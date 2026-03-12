import { resolve } from "node:path";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  validateSpellbookV2,
  validateInteractionsV2,
  buildRuleEngineFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";

function stableClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSnapshot() {
  const spellbookErrors = validateSpellbookV2(SPELLBOOK_V2);
  const interactionsValidation = validateInteractionsV2(INTERACTIONS_V2);
  const projectedRuleEngine = buildRuleEngineFromInteractionsV2({
    interactionsV2: INTERACTIONS_V2,
    baseRuleEngine: null,
  });

  return {
    schema: "orbis.interactions_v2.effective_snapshot",
    generatedAt: new Date().toISOString(),
    flags: {
      interactionsV2Bootstrap: stableClone(INTERACTIONS_V2_BOOTSTRAP),
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
      projectedRuleEngineRules: Array.isArray(projectedRuleEngine.rules) ? projectedRuleEngine.rules.length : 0,
    },
    spellbookV2: stableClone(SPELLBOOK_V2),
    interactionsV2: stableClone(INTERACTIONS_V2),
    projectedRuleEngine: stableClone(projectedRuleEngine),
  };
}

const outputPath = resolve(process.cwd(), RULE_ENGINE_V2_DOC_PATHS.effectiveSnapshot);
const snapshot = buildSnapshot();
writeJsonFile(outputPath, snapshot);
console.log(`wrote ${outputPath}`);
