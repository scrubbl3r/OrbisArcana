import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";
import {
  EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_REJECTED,
} from "../../src/contracts/events.js";

function createEventBus() {
  const listeners = new Map();
  return {
    on(eventName, handler) {
      const key = String(eventName || "");
      const bucket = listeners.get(key) || [];
      bucket.push(handler);
      listeners.set(key, bucket);
      return () => {
        const cur = listeners.get(key) || [];
        const idx = cur.indexOf(handler);
        if (idx >= 0) cur.splice(idx, 1);
        listeners.set(key, cur);
      };
    },
    emit(eventName, payload = {}) {
      const key = String(eventName || "");
      const bucket = listeners.get(key) || [];
      for (const fn of bucket.slice()) fn(payload);
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const eventBus = createEventBus();
  const rejects = [];
  const loads = [];
  let stored = 2;
  const system = createSpellDispatchSystem({
    eventBus,
    nowMs: () => 5000,
    resources: {
      getStoredGlobeCount: () => stored,
      consumeStoredGlobe: () => {
        if (stored <= 0) return { ok: false, stored };
        stored -= 1;
        return { ok: true, stored };
      },
    },
    ruleEngineEnabled: true,
  });

  eventBus.on(EVT_VOICE_SPELL_REJECTED, (p = {}) => rejects.push({ ...p }));
  eventBus.on(EVT_VOICE_SPELL_LOADED, (p = {}) => loads.push({ ...p }));

  system.start();
  try {
    eventBus.emit(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, { axis: "y", atMs: 5000 });

    // Wake-window token before axis selection must be rejected.
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: "sanctum", intent: "spell.wake_window_select", phrase: "sanctum" },
      confidence: 0.8,
      atMs: 5000,
    });

    // After axis selection, same wake-window token should load.
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: "pyro", intent: "spell.axis_select", phrase: "pyro" },
      confidence: 0.8,
      atMs: 5001,
    });
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: "sanctum", intent: "spell.wake_window_select", phrase: "sanctum" },
      confidence: 0.8,
      atMs: 5002,
    });
  } finally {
    system.stop();
  }

  assert(
    rejects.some((r) => String(r.reason || "") === "no_axis_selected"),
    "[wake-window-axis-prereq:v2] expected no_axis_selected reject when wake token spoken before axis token"
  );
  assert(loads.length >= 1, "[wake-window-axis-prereq:v2] expected wake token to load after axis selection");
  assert(
    loads.some((l) => String(l.spellId || "") === "sanctum"),
    "[wake-window-axis-prereq:v2] expected sanctum load after axis selection"
  );

  console.log("[wake-window-axis-prereq:v2] PASS: wake-window axis prerequisite contract holds");
}

main();
