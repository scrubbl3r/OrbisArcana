import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  KNOWN_WAKE_WORD_ID_V2,
  KNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
} from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "rule-engine-preview-system-wake-words-compat-contract:v2";
const EVT_WAKE_OPENED = "rule_engine.wake_win_opened";
const EVT_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_WORD_DETECTED = "voice.word_detected";
const ACTION_WAKE_WIN = "wake_win";
const WINDOW_WAKE_WIN = "wake_win";
const CONDITION_TYPE_WORD = "word";
const CONDITION_WORD_ID_PATH = "word.id";
const RULE_WORDS_PRECEDENCE = "r_words_precedence";
const RULE_SPELLS_FALLBACK = "r_spells_fallback";
const OVERRIDE_WORD_ID = "pyro";
const FALLBACK_WORD_ID = "domus";
const PASS_MESSAGE = "rule-engine preview system enforces wake_win words precedence with spells alias fallback semantics";

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
        { id: KNOWN_WAKE_WORD_SPELL_SELECTOR_V2, sourceEvent: EVT_WORD_DETECTED, where: { path: CONDITION_WORD_ID_PATH, eq: KNOWN_WAKE_WORD_ID_V2 } },
      ],
      windows: [
        { id: WINDOW_WAKE_WIN, type: ACTION_WAKE_WIN, defaultArgs: { ttlMs: 1200 } },
      ],
      events: [],
      rules: [
        {
          id: ruleId,
          on: { all: [{ type: CONDITION_TYPE_WORD, id: KNOWN_WAKE_WORD_ID_V2 }] },
          then: [wakeAction],
        },
      ],
    },
  });
  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_WORD_DETECTED, { word: { id: KNOWN_WAKE_WORD_ID_V2 }, atMs: 1000 });
  });
  return { wakeEvents, actionEvents };
}

const precedence = runScenario({
  ruleId: RULE_WORDS_PRECEDENCE,
  wakeAction: { type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_ID_V2], spells: [OVERRIDE_WORD_ID], ttlMs: 1400 },
});
if (precedence.wakeEvents.length !== 1) {
  failCheck(CHECK_TAG, `expected one wake opened event for words precedence scenario, got ${precedence.wakeEvents.length}`);
}
const precedenceWake = precedence.wakeEvents[0] || {};
if (JSON.stringify(precedenceWake.words) !== JSON.stringify([KNOWN_WAKE_WORD_ID_V2])) {
  failCheck(CHECK_TAG, "preview system wake opened event must prefer canonical words[] over spells[] alias");
}
if (JSON.stringify(precedenceWake.spells) !== JSON.stringify([KNOWN_WAKE_WORD_ID_V2])) {
  failCheck(CHECK_TAG, "preview system wake opened event must emit spells[] alias matching canonical words[]");
}
const precedenceAction = (precedence.actionEvents || []).find((evt) => evt?.actionType === ACTION_WAKE_WIN);
if (!precedenceAction) {
  failCheck(CHECK_TAG, `expected ${ACTION_WAKE_WIN} action executed event for words precedence scenario`);
}
if (JSON.stringify(precedenceAction.words) !== JSON.stringify([KNOWN_WAKE_WORD_ID_V2])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must use canonical words[]");
}
if (JSON.stringify(precedenceAction.spells) !== JSON.stringify([KNOWN_WAKE_WORD_ID_V2])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must mirror spells[] alias from words[]");
}

const fallback = runScenario({
  ruleId: RULE_SPELLS_FALLBACK,
  wakeAction: { type: ACTION_WAKE_WIN, spells: [FALLBACK_WORD_ID], ttlMs: 1400 },
});
if (fallback.wakeEvents.length !== 1) {
  failCheck(CHECK_TAG, `expected one wake opened event for spells fallback scenario, got ${fallback.wakeEvents.length}`);
}
const fallbackWake = fallback.wakeEvents[0] || {};
if (JSON.stringify(fallbackWake.words) !== JSON.stringify([FALLBACK_WORD_ID])) {
  failCheck(CHECK_TAG, "preview system wake opened event must fallback from spells[] alias to canonical words[]");
}
if (JSON.stringify(fallbackWake.spells) !== JSON.stringify([FALLBACK_WORD_ID])) {
  failCheck(CHECK_TAG, "preview system wake opened event must preserve spells[] alias payload on fallback");
}
const fallbackAction = (fallback.actionEvents || []).find((evt) => evt?.actionType === ACTION_WAKE_WIN);
if (!fallbackAction) {
  failCheck(CHECK_TAG, `expected ${ACTION_WAKE_WIN} action executed event for spells fallback scenario`);
}
if (JSON.stringify(fallbackAction.words) !== JSON.stringify([FALLBACK_WORD_ID])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must fallback to canonical words[]");
}
if (JSON.stringify(fallbackAction.spells) !== JSON.stringify([FALLBACK_WORD_ID])) {
  failCheck(CHECK_TAG, "preview system action executed wake payload must preserve spells[] alias on fallback");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
