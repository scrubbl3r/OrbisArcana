import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  validateSpellbookV2,
  validateInteractionsV2,
  buildRuleEngineV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import {
  SPELL_RULES_V1,
  SPELL_RULES_V1_LEGACY_BRIDGE,
} from "../../src/content/spell-rules/spell-rules-v1.js";
import { RULE_ENGINE_V1_MASTER_CONTROL } from "../../src/content/spell-rules/index.js";

function stableClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSnapshot() {
  const spellbookErrors = validateSpellbookV2(SPELLBOOK_V2);
  const interactionsValidation = validateInteractionsV2(INTERACTIONS_V2);
  const projectedRuleEngineV1 = buildRuleEngineV1FromInteractionsV2({
    interactionsV2: INTERACTIONS_V2,
    baseRuleEngineV1: RULE_ENGINE_V1_MASTER_CONTROL,
  });

  return {
    schema: "orbis.interactions_v2.effective_snapshot",
    generatedAt: new Date().toISOString(),
    flags: {
      interactionsV2Bootstrap: stableClone(INTERACTIONS_V2_BOOTSTRAP),
      spellRulesV1LegacyBridge: stableClone(SPELL_RULES_V1_LEGACY_BRIDGE),
    },
    validation: {
      spellbookV2: {
        ok: spellbookErrors.length === 0,
        errors: spellbookErrors,
      },
      interactionsV2: {
        ok: !!interactionsValidation.ok,
        errors: Array.isArray(interactionsValidation.errors) ? interactionsValidation.errors.slice() : [],
      },
    },
    counts: {
      spellbookV2Spells: Array.isArray(SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells.length : 0,
      interactionsV2Rules: Array.isArray(INTERACTIONS_V2.rules) ? INTERACTIONS_V2.rules.length : 0,
      spellRulesV1Current: Array.isArray(SPELL_RULES_V1) ? SPELL_RULES_V1.length : 0,
      projectedRuleEngineV1Rules: Array.isArray(projectedRuleEngineV1.rules) ? projectedRuleEngineV1.rules.length : 0,
    },
    spellbookV2: stableClone(SPELLBOOK_V2),
    interactionsV2: stableClone(INTERACTIONS_V2),
    spellRulesV1Current: stableClone(SPELL_RULES_V1),
    projectedRuleEngineV1: stableClone(projectedRuleEngineV1),
  };
}

const outputPath = resolve(process.cwd(), "docs/effective-interactions-v2.snapshot.json");
const snapshot = buildSnapshot();
writeFileSync(outputPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
console.log(`wrote ${outputPath}`);
