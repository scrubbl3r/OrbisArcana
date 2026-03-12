import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { getInteractionsRules } from "./interactions-v2-utils.mjs";
import { jsonClone } from "./json-clone-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { countSpellbookSpells } from "./spellbook-v2-utils.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  validateSpellbookV2,
  validateInteractionsV2,
  buildRuleEngineFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";

function buildSnapshot() {
  const spellbookErrors = validateSpellbookV2(SPELLBOOK_V2);
  const interactionsValidation = validateInteractionsV2(INTERACTIONS_V2);
  const projectedRuleEngine = buildRuleEngineFromInteractionsV2({
    interactionsV2: INTERACTIONS_V2,
    baseRuleEngine: null,
  });
  const interactionRules = getInteractionsRules(INTERACTIONS_V2);

  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.effectiveSnapshot,
    generatedAt: nowIso(),
    flags: {
      interactionsV2Bootstrap: jsonClone(INTERACTIONS_V2_BOOTSTRAP),
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
      spellbookV2Spells: countSpellbookSpells(SPELLBOOK_V2),
      interactionsV2Rules: interactionRules.length,
      projectedRuleEngineRules: Array.isArray(projectedRuleEngine.rules) ? projectedRuleEngine.rules.length : 0,
    },
    spellbookV2: jsonClone(SPELLBOOK_V2),
    interactionsV2: jsonClone(INTERACTIONS_V2),
    projectedRuleEngine: jsonClone(projectedRuleEngine),
  };
}

const outputPath = resolveRuleEngineDocPath("effectiveSnapshot");
const snapshot = buildSnapshot();
writeJsonFile(outputPath, snapshot);
console.log(`wrote ${outputPath}`);
