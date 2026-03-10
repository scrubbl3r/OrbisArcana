import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";
import {
  EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
  EVT_VOICE_AXIS_SELECTED,
  EVT_VOICE_SPELL_DETECTED,
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

function detectOutsideWindow({ spellId, intent, expectedReason }) {
  const eventBus = createEventBus();
  const rejects = [];
  const system = createSpellDispatchSystem({
    eventBus,
    nowMs: () => 4000,
    resources: {
      getStoredGlobeCount: () => 1,
      consumeStoredGlobe: () => ({ ok: true, stored: 0 }),
    },
    ruleEngineEnabled: true,
  });
  eventBus.on(EVT_VOICE_SPELL_REJECTED, (p = {}) => rejects.push({ ...p }));
  system.start();
  try {
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: spellId, intent, phrase: spellId },
      confidence: 0.9,
      atMs: 4000,
    });
  } finally {
    system.stop();
  }
  assert(rejects.length >= 1, `[flat-spin-gating:v2] expected reject for ${spellId} outside flat-spin window`);
  assert(
    rejects.some((r) => String(r.reason || "") === expectedReason),
    `[flat-spin-gating:v2] expected reason=${expectedReason} for ${spellId}; got [${rejects.map((r) => String(r.reason || "")).join(", ")}]`
  );
}

function detectInsideWindowAxisSelect() {
  const eventBus = createEventBus();
  const axisSelected = [];
  const rejects = [];
  const system = createSpellDispatchSystem({
    eventBus,
    nowMs: () => 4100,
    resources: {
      getStoredGlobeCount: () => 1,
      consumeStoredGlobe: () => ({ ok: true, stored: 0 }),
    },
    ruleEngineEnabled: true,
  });
  eventBus.on(EVT_VOICE_AXIS_SELECTED, (p = {}) => axisSelected.push({ ...p }));
  eventBus.on(EVT_VOICE_SPELL_REJECTED, (p = {}) => rejects.push({ ...p }));
  system.start();
  try {
    eventBus.emit(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, { axis: "y", atMs: 4100 });
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: "pyro", intent: "spell.axis_select", phrase: "pyro" },
      confidence: 0.9,
      atMs: 4100,
    });
  } finally {
    system.stop();
  }
  assert(axisSelected.length === 1, "[flat-spin-gating:v2] expected axis select event for pyro inside flat-spin window");
  assert(rejects.length === 0, `[flat-spin-gating:v2] unexpected reject(s) for pyro inside flat-spin window: ${rejects.map((r) => r.reason).join(", ")}`);
}

function main() {
  detectOutsideWindow({
    spellId: "pyro",
    intent: "spell.axis_select",
    expectedReason: "rule_engine_owned_immediate_spell",
  });
  detectInsideWindowAxisSelect();
  console.log("[flat-spin-gating:v2] PASS: flat-spin token gating contract holds");
}

main();
