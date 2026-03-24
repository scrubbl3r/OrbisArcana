import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";

const CHECK_TAG = "orchestrator-v2-window-semantics:v2";
const PASS_MESSAGE = "requires/consume/open.windowId semantics hold for wake chains";

const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
const EVT_VOICE_WORD_DETECTED = "voice.word_detected";
const ACTION_WAKE_WIN = "wake_win";
const WINDOW_WAKE_WIN = "wake_win";
const WINDOW_WAKE_MAIN_ID = "wake.main";
const WORD_ORBIS_ID = "orbis";
const WORD_DOMUS_ID = "domus";
const SIGNAL_RUNTIME_ORBIS = "spell.orbis";
const SIGNAL_RUNTIME_DOMUS = "spell.domus";
const CONDITION_TYPE_WORD = "word";
const CONDITION_WORD_ID_PATH = "word.id";
const EVENT_TYPE = "event";
const EVENT_TELEPORT_HOME_ID = "teleport_home";

const schema = Object.freeze({
  signals: Object.freeze([
    Object.freeze({
      id: SIGNAL_RUNTIME_ORBIS,
      type: CONDITION_TYPE_WORD,
      sourceEvent: EVT_VOICE_WORD_DETECTED,
      where: Object.freeze({ path: CONDITION_WORD_ID_PATH, eq: WORD_ORBIS_ID }),
    }),
    Object.freeze({
      id: SIGNAL_RUNTIME_DOMUS,
      type: CONDITION_TYPE_WORD,
      sourceEvent: EVT_VOICE_WORD_DETECTED,
      where: Object.freeze({ path: CONDITION_WORD_ID_PATH, eq: WORD_DOMUS_ID }),
    }),
  ]),
  windows: Object.freeze([
    Object.freeze({
      id: WINDOW_WAKE_WIN,
      type: ACTION_WAKE_WIN,
      defaultArgs: Object.freeze({ ttlMs: 1000 }),
    }),
  ]),
  events: Object.freeze([
    Object.freeze({
      id: EVENT_TELEPORT_HOME_ID,
      type: EVENT_TYPE,
      defaultArgs: Object.freeze({}),
    }),
  ]),
  rules: Object.freeze([
    Object.freeze({
      id: "master_wake",
      on: Object.freeze([
        Object.freeze({ type: CONDITION_TYPE_WORD, id: WORD_ORBIS_ID }),
      ]),
      then: Object.freeze([
        Object.freeze({
          type: ACTION_WAKE_WIN,
          id: WINDOW_WAKE_WIN,
          windowId: WINDOW_WAKE_MAIN_ID,
          spells: Object.freeze([WORD_DOMUS_ID]),
          ttlMs: 1000,
        }),
      ]),
    }),
    Object.freeze({
      id: "tele_home",
      on: Object.freeze([
        Object.freeze({ type: CONDITION_TYPE_WORD, id: WORD_DOMUS_ID }),
      ]),
      requires: Object.freeze([WINDOW_WAKE_MAIN_ID]),
      consume: Object.freeze([WINDOW_WAKE_MAIN_ID]),
      then: Object.freeze([
        Object.freeze({ type: EVENT_TYPE, id: EVENT_TELEPORT_HOME_ID }),
      ]),
    }),
  ]),
});

const nowRef = { value: 1000 };
const eventBus = createCheckEventBus();
const actionEvents = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
const wakeOpenedEvents = captureCheckEvents(eventBus, EVT_RULE_ENGINE_WAKE_WIN_OPENED);

const system = createRuleEnginePreviewSystem({
  eventBus,
  schema,
  executeActions: true,
  nowMs: () => nowRef.value,
});

function emitWord(id, atMs) {
  nowRef.value = Number(atMs);
  eventBus.emit(EVT_VOICE_WORD_DETECTED, {
    word: { id: String(id || "") },
    atMs: nowRef.value,
  });
}

function eventCount(actionType, actionId) {
  return actionEvents.filter((evt) =>
    String(evt?.actionType || "") === actionType &&
    String(evt?.actionId || "") === actionId
  ).length;
}

function assertEventCount(actionType, actionId, expectedCount, failureMessage) {
  if (eventCount(actionType, actionId) !== expectedCount) {
    failCheck(CHECK_TAG, failureMessage);
  }
}

system.start();
try {
  // No wake window yet: domus should not fire teleport.
  emitWord(WORD_DOMUS_ID, 1000);
  assertEventCount(EVENT_TYPE, EVENT_TELEPORT_HOME_ID, 0, "domus fired without wake window");

  // Open wake window.
  emitWord(WORD_ORBIS_ID, 1100);
  assertEventCount(ACTION_WAKE_WIN, WINDOW_WAKE_WIN, 1, "wake window did not open on orbis");
  if (!wakeOpenedEvents.length || String(wakeOpenedEvents[0]?.windowId || "") !== WINDOW_WAKE_MAIN_ID) {
    failCheck(CHECK_TAG, "wake window payload missing expected windowId");
  }

  // First domus should pass and consume wake.main.
  emitWord(WORD_DOMUS_ID, 1200);
  assertEventCount(EVENT_TYPE, EVENT_TELEPORT_HOME_ID, 1, "domus did not fire after wake window opened");

  // Consumed: second domus should not fire.
  emitWord(WORD_DOMUS_ID, 1300);
  assertEventCount(
    EVENT_TYPE,
    EVENT_TELEPORT_HOME_ID,
    1,
    "consume semantics failed; domus fired more than once per wake"
  );

  // Re-open wake then domus again should fire once.
  emitWord(WORD_ORBIS_ID, 1400);
  emitWord(WORD_DOMUS_ID, 1500);
  assertEventCount(EVENT_TYPE, EVENT_TELEPORT_HOME_ID, 2, "re-opened wake window did not allow domus again");
} finally {
  system.stop();
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
