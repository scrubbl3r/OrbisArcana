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

const CHECK_TAG = CHECK_TAGS_V2.electricAoeRegression;
const PASS_MESSAGE = "orbis wake followed by electrum then rota triggers aoe_electric through authored rule path";
const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
const WORD_ORBIS = "orbis";
const WORD_ELECTRUM = "electrum";
const WORD_ROTA = "rota";
const WINDOW_WAKE_MAIN = "wake.main";
const WINDOW_ELECTRUM = "chain.electrum";
const EVENT_AOE_ELECTRIC = "aoe_electric";

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

  emitDetectedWord(WORD_ELECTRUM, 1100);
  const electrumWindowOpened = wakeOpenedEvents.some((evt) => String(evt?.windowId || "") === WINDOW_ELECTRUM);
  if (!electrumWindowOpened) {
    failCheck(CHECK_TAG, "electric_aoe did not open chain.electrum after orbis -> electrum");
  }

  emitDetectedWord(WORD_ROTA, 1200);
  const electricActions = actionEvents.filter((evt) =>
    String(evt?.actionType || "") === "event"
    && String(evt?.actionId || "") === EVENT_AOE_ELECTRIC
  );
  if (electricActions.length !== 1) {
    failCheck(CHECK_TAG, `expected one authored aoe_electric action after orbis -> electrum -> rota, got ${electricActions.length}`);
  }
  const electricRuleId = String(electricActions[0]?.ruleId || "");
  if (electricRuleId !== "electric_aoe_cast") {
    failCheck(CHECK_TAG, `expected electric_aoe_cast rule to fire, got ${electricRuleId || "(empty)"}`);
  }
} finally {
  system.stop();
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
