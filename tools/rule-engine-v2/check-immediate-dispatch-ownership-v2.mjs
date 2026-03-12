import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";
import { RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS } from "../../src/content/spells/spell-runtime-routing.js";
import {
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_SPELL_REJECTED,
} from "../../src/contracts/events.js";
import { asLowerText } from "./text-utils-v2.mjs";

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

function detectSpell({ ruleEngineEnabled, spellId }) {
  const eventBus = createEventBus();
  const casts = [];
  const rejects = [];
  const system = createSpellDispatchSystem({
    eventBus,
    nowMs: () => 3000,
    resources: {
      getStoredGlobeCount: () => 0,
      consumeStoredGlobe: () => ({ ok: false, stored: 0 }),
    },
    ruleEngineEnabled,
  });
  eventBus.on(EVT_VOICE_SPELL_CAST, (p = {}) => casts.push({ ...p }));
  eventBus.on(EVT_VOICE_SPELL_REJECTED, (p = {}) => rejects.push({ ...p }));
  system.start();
  try {
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { id: spellId, intent: `spell.${spellId}`, phrase: spellId },
      confidence: 0.8,
      atMs: 3000,
    });
  } finally {
    system.stop();
  }
  return { casts, rejects };
}

function main() {
  const ownedImmediate = (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS)
    ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS
    : [])
    .map((id) => asLowerText(id))
    .filter(Boolean);
  assert(ownedImmediate.length > 0, "[immediate-ownership:v2] expected non-empty RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS");

  for (const spellId of ownedImmediate) {
    const withRuleEngine = detectSpell({ ruleEngineEnabled: true, spellId });
    assert(withRuleEngine.casts.length === 0, `[immediate-ownership:v2] expected 0 casts when ruleEngineEnabled=true for ${spellId}, got ${withRuleEngine.casts.length}`);
    assert(
      withRuleEngine.rejects.some((r) => String(r.reason || "") === "rule_engine_owned_immediate_spell"),
      `[immediate-ownership:v2] expected rule_engine_owned_immediate_spell reject for ${spellId}`
    );

    const withoutRuleEngine = detectSpell({ ruleEngineEnabled: false, spellId });
    assert(withoutRuleEngine.casts.length === 1, `[immediate-ownership:v2] expected 1 cast when ruleEngineEnabled=false for ${spellId}, got ${withoutRuleEngine.casts.length}`);
    assert(String(withoutRuleEngine.casts[0].spellId || "") === spellId, `[immediate-ownership:v2] unexpected cast spellId for ${spellId}`);
  }

  console.log("[immediate-ownership:v2] PASS: immediate spell dispatch ownership contract holds");
}

main();
