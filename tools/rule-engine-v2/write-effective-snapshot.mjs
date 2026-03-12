import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { jsonClone } from "./json-clone-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
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

  return {
    schema: "orbis.interactions_v2.effective_snapshot",
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
      spellbookV2Spells: Array.isArray(SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells.length : 0,
      interactionsV2Rules: Array.isArray(INTERACTIONS_V2.rules) ? INTERACTIONS_V2.rules.length : 0,
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
