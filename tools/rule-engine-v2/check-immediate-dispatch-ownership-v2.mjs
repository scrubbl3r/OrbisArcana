import { RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS } from "../../src/content/spells/spell-runtime-routing.js";
import {
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_REJECTED,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { emitDetectedSpell } from "./check-detected-spell-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { hasReason } from "./check-reason-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { spellIdText } from "./check-spell-event-v2.mjs";
import { createFixedNowMs } from "./check-time-v2.mjs";
import { asLowerText } from "./text-utils-v2.mjs";

function detectSpell({ ruleEngineEnabled, spellId }) {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const rejects = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs: createFixedNowMs(3000),
    resources: createStoredGlobeResources(0),
    ruleEngineEnabled,
  });
  system.start();
  try {
    emitDetectedSpell(eventBus, {
      id: spellId,
      intent: `spell.${spellId}`,
      phrase: spellId,
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
  assertCheck(ownedImmediate.length > 0, "[immediate-ownership:v2] expected non-empty RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS");

  for (const spellId of ownedImmediate) {
    const withRuleEngine = detectSpell({ ruleEngineEnabled: true, spellId });
    assertCheck(withRuleEngine.casts.length === 0, `[immediate-ownership:v2] expected 0 casts when ruleEngineEnabled=true for ${spellId}, got ${withRuleEngine.casts.length}`);
    assertCheck(
      hasReason(withRuleEngine.rejects, "rule_engine_owned_immediate_spell"),
      `[immediate-ownership:v2] expected rule_engine_owned_immediate_spell reject for ${spellId}`
    );

    const withoutRuleEngine = detectSpell({ ruleEngineEnabled: false, spellId });
    assertCheck(withoutRuleEngine.casts.length === 1, `[immediate-ownership:v2] expected 1 cast when ruleEngineEnabled=false for ${spellId}, got ${withoutRuleEngine.casts.length}`);
    assertCheck(spellIdText(withoutRuleEngine.casts[0]) === spellId, `[immediate-ownership:v2] unexpected cast spellId for ${spellId}`);
  }

  console.log("[immediate-ownership:v2] PASS: immediate spell dispatch ownership contract holds");
}

main();
