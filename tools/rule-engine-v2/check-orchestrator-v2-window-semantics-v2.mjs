import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";

const CHECK_TAG = "orchestrator-v2-window-semantics:v2";

const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";
const EVT_VOICE_WORD_DETECTED = "voice.word_detected";

const schema = Object.freeze({
  signals: Object.freeze([
    Object.freeze({
      id: "spell.orbis",
      type: "spell",
      sourceEvent: EVT_VOICE_WORD_DETECTED,
      where: Object.freeze({ path: "word.id", eq: "orbis" }),
    }),
    Object.freeze({
      id: "spell.domus",
      type: "spell",
      sourceEvent: EVT_VOICE_WORD_DETECTED,
      where: Object.freeze({ path: "word.id", eq: "domus" }),
    }),
  ]),
  windows: Object.freeze([
    Object.freeze({
      id: "wake_win",
      type: "wake_win",
      defaultArgs: Object.freeze({ ttlMs: 1000 }),
    }),
  ]),
  events: Object.freeze([
    Object.freeze({
      id: "teleport_home",
      type: "event",
      defaultArgs: Object.freeze({}),
    }),
  ]),
  rules: Object.freeze([
    Object.freeze({
      id: "master_wake",
      on: Object.freeze([
        Object.freeze({ type: "spell", id: "orbis" }),
      ]),
      then: Object.freeze([
        Object.freeze({
          type: "wake_win",
          id: "wake_win",
          windowId: "wake.main",
          spells: Object.freeze(["domus"]),
          ttlMs: 1000,
        }),
      ]),
    }),
    Object.freeze({
      id: "tele_home",
      on: Object.freeze([
        Object.freeze({ type: "spell", id: "domus" }),
      ]),
      requires: Object.freeze(["wake.main"]),
      consume: Object.freeze(["wake.main"]),
      then: Object.freeze([
        Object.freeze({ type: "event", id: "teleport_home" }),
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

system.start();
try {
  // No wake window yet: domus should not fire teleport.
  emitWord("domus", 1000);
  if (eventCount("event", "teleport_home") !== 0) {
    failCheck(CHECK_TAG, "domus fired without wake window");
  }

  // Open wake window.
  emitWord("orbis", 1100);
  if (eventCount("wake_win", "wake_win") !== 1) {
    failCheck(CHECK_TAG, "wake window did not open on orbis");
  }
  if (!wakeOpenedEvents.length || String(wakeOpenedEvents[0]?.windowId || "") !== "wake.main") {
    failCheck(CHECK_TAG, "wake window payload missing expected windowId");
  }

  // First domus should pass and consume wake.main.
  emitWord("domus", 1200);
  if (eventCount("event", "teleport_home") !== 1) {
    failCheck(CHECK_TAG, "domus did not fire after wake window opened");
  }

  // Consumed: second domus should not fire.
  emitWord("domus", 1300);
  if (eventCount("event", "teleport_home") !== 1) {
    failCheck(CHECK_TAG, "consume semantics failed; domus fired more than once per wake");
  }

  // Re-open wake then domus again should fire once.
  emitWord("orbis", 1400);
  emitWord("domus", 1500);
  if (eventCount("event", "teleport_home") !== 2) {
    failCheck(CHECK_TAG, "re-opened wake window did not allow domus again");
  }
} finally {
  system.stop();
}

reportCheckPass(CHECK_TAG, "requires/consume/open.windowId semantics hold for wake chains");
