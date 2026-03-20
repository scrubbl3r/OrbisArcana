import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "rule-engine-preview-system-wake-words-alias-contract:v2";
const EVT_WAKE_OPENED = "rule_engine.wake_win_opened";
const EVT_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_WORD_DETECTED = "voice.word_detected";

function runScenario({ ruleId, wakeAction }) {
  const eventBus = createCheckEventBus();
  const wakeEvents = captureCheckEvents(eventBus, EVT_WAKE_OPENED);
  const actionEvents = captureCheckEvents(eventBus, EVT_ACTION_EXECUTED);
  const system = createRuleEnginePreviewSystem({
    eventBus,
    executeActions: true,
    nowMs: () => 1000,
    schema: {
      signals: [
        { id: "spell.rota", sourceEvent: EVT_WORD_DETECTED, where: { path: "word.id", eq: "rota" } },
      ],
      windows: [
        { id: "wake_win", type: "wake_win", defaultArgs: { ttlMs: 1200 } },
      ],
      events: [],
      rules: [
        {
          id: ruleId,
          on: { all: [{ type: "word", id: "rota" }] },
          then: [wakeAction],
        },
      ],
    },
  });
  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_WORD_DETECTED, { word: { id: "rota" }, atMs: 1000 });
  });
  return { wakeEvents, actionEvents };
}

const precedence = runScenario({
  ruleId: "r_words_precedence",
  wakeAction: { type: "wake_win", words: ["rota"], spells: ["vectus"], ttlMs: 1400 },
});
if (precedence.wakeEvents.length !== 1) {
  failCheck(CHECK_TAG, `expected one wake opened event for words precedence scenario, got ${precedence.wakeEvents.length}`);
}
const precedenceWake = precedence.wakeEvents[0] || {};
if (JSON.stringify(precedenceWake.words) !== JSON.stringify(["rota"])) {
  failCheck(CHECK_TAG, "preview system wake opened event must prefer canonical words[] over spells[] alias");
}
if (JSON.stringify(precedenceWake.spells) !== JSON.stringify(["rota"])) {
  failCheck(CHECK_TAG, "preview system wake opened event must emit spells[] alias matching canonical words[]");
}
const precedenceAction = (precedence.actionEvents || []).find((evt) => evt?.actionType === "wake_win");
if (!precedenceAction) {
  failCheck(CHECK_TAG, "expected wake_win action executed event for words precedence scenario");
}
if (JSON.stringify(precedenceAction.words) !== JSON.stringify(["rota"])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must use canonical words[]");
}
if (JSON.stringify(precedenceAction.spells) !== JSON.stringify(["rota"])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must mirror spells[] alias from words[]");
}

const fallback = runScenario({
  ruleId: "r_spells_fallback",
  wakeAction: { type: "wake_win", spells: ["sanctum"], ttlMs: 1400 },
});
if (fallback.wakeEvents.length !== 1) {
  failCheck(CHECK_TAG, `expected one wake opened event for spells fallback scenario, got ${fallback.wakeEvents.length}`);
}
const fallbackWake = fallback.wakeEvents[0] || {};
if (JSON.stringify(fallbackWake.words) !== JSON.stringify(["sanctum"])) {
  failCheck(CHECK_TAG, "preview system wake opened event must fallback from spells[] alias to canonical words[]");
}
if (JSON.stringify(fallbackWake.spells) !== JSON.stringify(["sanctum"])) {
  failCheck(CHECK_TAG, "preview system wake opened event must preserve spells[] alias payload on fallback");
}
const fallbackAction = (fallback.actionEvents || []).find((evt) => evt?.actionType === "wake_win");
if (!fallbackAction) {
  failCheck(CHECK_TAG, "expected wake_win action executed event for spells fallback scenario");
}
if (JSON.stringify(fallbackAction.words) !== JSON.stringify(["sanctum"])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must fallback to canonical words[]");
}
if (JSON.stringify(fallbackAction.spells) !== JSON.stringify(["sanctum"])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must preserve spells[] alias on fallback");
}

reportCheckPass(
  CHECK_TAG,
  "rule-engine preview system enforces wake_win words precedence with spells alias fallback semantics"
);
