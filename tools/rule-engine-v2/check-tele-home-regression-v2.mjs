import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";

const CHECK_TAG = CHECK_TAGS_V2.teleHomeRegression;
const PASS_MESSAGE = "orbis wake followed by domus triggers teleport_home through authored rule path";
const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
const WORD_ORBIS = "orbis";
const WORD_DOMUS = "domus";
const WINDOW_WAKE_MAIN = "wake.main";
const EVENT_TELEPORT_HOME = "teleport_home";

const eventBus = createCheckEventBus();
const actionEvents = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
const wakeOpenedEvents = captureCheckEvents(eventBus, EVT_RULE_ENGINE_WAKE_WIN_OPENED);
let nowRef = { value: 1000 };

const system = createRuleEnginePreviewSystem({
  eventBus,
  executeActions: true,
  nowMs: () => nowRef.value,
  schema: {
    signals: SIGNAL_DEFINITIONS,
    windows: WINDOW_DEFINITIONS,
    events: EVENT_DEFINITIONS,
    rules: buildRuleEngineFromOrchestratorV2().rules,
  },
});

function emitWakeToken(token, atMs) {
  nowRef.value = Number(atMs);
  eventBus.emit("voice.token_detected", { token, atMs: nowRef.value });
}

function emitDetectedWord(wordId, atMs) {
  nowRef.value = Number(atMs);
  eventBus.emit("voice.word_detected", {
    word: { id: String(wordId || "") },
    atMs: nowRef.value,
  });
}

system.start();
try {
  emitWakeToken(WORD_ORBIS, 1000);
  const wakeMainOpened = wakeOpenedEvents.some((evt) => String(evt?.windowId || "") === WINDOW_WAKE_MAIN);
  if (!wakeMainOpened) {
    failCheck(CHECK_TAG, "wake_main did not open wake.main from orbis root wake");
  }

  emitDetectedWord(WORD_DOMUS, 1100);
  const teleHomeActions = actionEvents.filter((evt) =>
    String(evt?.actionType || "") === "event"
    && String(evt?.actionId || "") === EVENT_TELEPORT_HOME
  );
  if (teleHomeActions.length !== 1) {
    failCheck(CHECK_TAG, `expected one authored teleport_home action after orbis -> domus, got ${teleHomeActions.length}`);
  }
  const teleHomeRuleId = String(teleHomeActions[0]?.ruleId || "");
  if (teleHomeRuleId !== "tele_home") {
    failCheck(CHECK_TAG, `expected tele_home rule to fire, got ${teleHomeRuleId || "(empty)"}`);
  }
} finally {
  system.stop();
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
