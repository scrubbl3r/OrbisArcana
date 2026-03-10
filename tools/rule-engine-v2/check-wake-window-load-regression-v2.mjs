import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";
import {
  EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
  EVT_VOICE_AXIS_SELECTED,
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_SPELL_LOADED,
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

function runScenario({ axisSpellId, wakeWindowToken, expectedLoadedSpellId, expectedSlot }) {
  const eventBus = createEventBus();
  const loaded = [];
  const axisSelected = [];
  let stored = 1;
  const resources = {
    getStoredGlobeCount: () => stored,
    consumeStoredGlobe: () => {
      if (stored <= 0) return { ok: false, stored };
      stored -= 1;
      return { ok: true, stored };
    },
  };
  const nowRef = { value: 2000 };
  const nowMs = () => nowRef.value;

  const system = createSpellDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled: true,
  });
  eventBus.on(EVT_VOICE_AXIS_SELECTED, (p = {}) => axisSelected.push({ ...p }));
  eventBus.on(EVT_VOICE_SPELL_LOADED, (p = {}) => loaded.push({ ...p }));

  system.start();
  try {
    eventBus.emit(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, { axis: "y", atMs: nowRef.value });
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: axisSpellId, intent: "spell.axis_select", phrase: axisSpellId },
      atMs: nowRef.value,
    });
    nowRef.value += 10;
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: wakeWindowToken, intent: "spell.wake_window_select", phrase: wakeWindowToken },
      atMs: nowRef.value,
    });
  } finally {
    system.stop();
  }

  assert(axisSelected.length === 1, `[wake-load-regression] expected axis select for ${axisSpellId} + ${wakeWindowToken}`);
  assert(loaded.length === 1, `[wake-load-regression] expected one loaded spell for ${axisSpellId} + ${wakeWindowToken}`);
  assert(String(loaded[0].spellId || "") === expectedLoadedSpellId, `[wake-load-regression] expected loaded spell ${expectedLoadedSpellId}, got ${loaded[0].spellId || ""}`);
  assert(String(loaded[0].axis || "") === "y", `[wake-load-regression] expected axis y, got ${loaded[0].axis || ""}`);
  assert(String(loaded[0].slot || "") === expectedSlot, `[wake-load-regression] expected slot ${expectedSlot}, got ${loaded[0].slot || ""}`);
}

function main() {
  runScenario({
    axisSpellId: "pyro",
    wakeWindowToken: "sanctum",
    expectedLoadedSpellId: "sanctum",
    expectedSlot: "UD",
  });
  runScenario({
    axisSpellId: "pyro",
    wakeWindowToken: "rota",
    expectedLoadedSpellId: "rota",
    expectedSlot: "FB",
  });
  console.log("[wake-load-regression:v2] PASS: wake-window load flow works");
}

main();
