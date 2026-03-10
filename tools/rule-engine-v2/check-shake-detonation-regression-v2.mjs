import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";
import {
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_DETECTED,
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
      for (const fn of bucket.slice()) {
        fn(payload);
      }
    },
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runScenario({ wakeWindowToken, expectedSpellId }) {
  const eventBus = createEventBus();
  const casts = [];
  let stored = 1;
  const resources = {
    getStoredGlobeCount: () => stored,
    consumeStoredGlobe: () => {
      if (stored <= 0) return { ok: false, stored };
      stored -= 1;
      return { ok: true, stored };
    },
  };
  const nowRef = { value: 1000 };
  const nowMs = () => nowRef.value;
  const system = createSpellDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled: true,
  });
  eventBus.on(EVT_VOICE_SPELL_CAST, (p = {}) => casts.push({ ...p }));
  system.start();
  try {
    eventBus.emit(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, { axis: "y", atMs: nowRef.value });
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, { spell: { id: "pyro", intent: "spell.axis_select", phrase: "pyro" }, atMs: nowRef.value });
    nowRef.value += 10;
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: wakeWindowToken, intent: "spell.wake_window_select", phrase: wakeWindowToken },
      atMs: nowRef.value,
    });
    nowRef.value += 10;
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "", group: "", atMs: nowRef.value });
  } finally {
    system.stop();
  }

  assert(casts.length === 1, `[shake-regression] expected 1 cast for ${wakeWindowToken}, got ${casts.length}`);
  assert(String(casts[0].spellId || "") === expectedSpellId, `[shake-regression] expected spellId=${expectedSpellId}, got ${casts[0].spellId || ""}`);
  assert(String(casts[0].trigger || "") === "shake_detonation", `[shake-regression] expected trigger=shake_detonation for ${wakeWindowToken}`);
}

function main() {
  runScenario({ wakeWindowToken: "sanctum", expectedSpellId: "sanctum" });
  runScenario({ wakeWindowToken: "rota", expectedSpellId: "rota" });
  console.log("[shake-regression:v2] PASS: directionless shake detonates loaded spell");
}

main();
