import { buildRuleEngineFromCompiledInteractionGraphV2 } from "../../src/content/interactions-v2/index.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";

const CHECK_TAG = CHECK_TAGS_V2.electricAoeRegression;
const PASS_MESSAGE = "orbis wake followed by electrum triggers tesla_1 through authored rule path";
const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
const WORD_ORBIS = "orbis";
const WORD_ELECTRUM = "electrum";
const WINDOW_WAKE_MAIN = "wake.main";
const EVENT_TESLA_1 = "tesla_1";

const eventBus = createCheckEventBus();
const actionEvents = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
const wakeOpenedEvents = captureCheckEvents(eventBus, EVT_RULE_ENGINE_WAKE_WIN_OPENED);
const nowRef = { value: 1000 };

const system = createRuleEnginePreviewSystem({
  eventBus,
  executeActions: true,
  nowMs: () => nowRef.value,
  schema: {
    signals: SIGNAL_DEFINITIONS,
    windows: WINDOW_DEFINITIONS,
    events: EVENT_DEFINITIONS,
    rules: buildRuleEngineFromCompiledInteractionGraphV2().rules,
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

  emitDetectedWord(WORD_ELECTRUM, 1100);
  const teslaActions = actionEvents.filter((evt) =>
    String(evt?.actionType || "") === "event"
    && String(evt?.actionId || "") === EVENT_TESLA_1
  );
  if (teslaActions.length !== 1) {
    failCheck(CHECK_TAG, `expected one authored tesla_1 action after orbis -> electrum, got ${teslaActions.length}`);
  }
  const teslaRuleId = String(teslaActions[0]?.ruleId || "");
  if (teslaRuleId !== "electrum_cast_tesla_1") {
    failCheck(CHECK_TAG, `expected electrum_cast_tesla_1 rule to fire, got ${teslaRuleId || "(empty)"}`);
  }
} finally {
  system.stop();
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
