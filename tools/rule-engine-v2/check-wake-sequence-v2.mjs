import {
  EVT_ORB_FLOAT_GRACE_GRANT,
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_SPELL_WINDOW_SPIN_OPENED,
  EVT_VOICE_WORD_DETECTED,
} from "../../src/contracts/events.js";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";

export function emitDetectedWord(eventBus, wordId, atMs) {
  eventBus.emit(EVT_VOICE_WORD_DETECTED, {
    word: { id: String(wordId || "").trim().toLowerCase() },
    atMs: Number(atMs),
  });
}

export function emitSpinOpened(eventBus, { axis = CHECK_AXES_V2.y, atMs } = {}) {
  eventBus.emit(EVT_SPELL_WINDOW_SPIN_OPENED, {
    axis: String(axis || "").trim().toLowerCase(),
    atMs: Number(atMs),
  });
}

export function emitOrbCharged(eventBus, atMs, ms = 100) {
  eventBus.emit(EVT_ORB_FLOAT_GRACE_GRANT, {
    atMs: Number(atMs),
    ms: Number(ms),
  });
}

export function emitStoredGlobe(eventBus, atMs, stored = 1) {
  eventBus.emit(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, {
    atMs: Number(atMs),
    stored: Number(stored),
  });
}

export function emitPyroBindPrelude({
  eventBus,
  startAtMs = 1000,
  axis = CHECK_AXES_V2.y,
  pyroWordId = CHECK_SPELL_IDS_V2.pyro,
} = {}) {
  const start = Number(startAtMs);
  emitSpinOpened(eventBus, { axis, atMs: start + 10 });
  emitDetectedWord(eventBus, pyroWordId, start + 20);
  return start + 20;
}
