import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { countWordbookWords } from "./wordbook-v2-utils.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import {
  WORDBOOK_V2,
  INTERACTION_GRAPH_V2,
  COMPILED_INTERACTION_GRAPH_V2,
  COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP,
  buildRuleEngineFromCompiledInteractionGraphV2,
  validateInteractionGraphV2,
  validateCompiledInteractionGraphV2,
  validateWordbookV2,
} from "../../src/content/interactions-v2/index.js";

// Builds the effective rule-engine snapshot from canonical orchestrator authoring.
function buildSnapshot() {
  const wordbookErrors = validateWordbookV2(WORDBOOK_V2);
  const dreamValidation = validateInteractionGraphV2(INTERACTION_GRAPH_V2);
  const orchestratorValidation = validateCompiledInteractionGraphV2(COMPILED_INTERACTION_GRAPH_V2);
  const projectedRuleEngine = buildRuleEngineFromCompiledInteractionGraphV2();
  const orchestratorRules = Array.isArray(COMPILED_INTERACTION_GRAPH_V2?.rules) ? COMPILED_INTERACTION_GRAPH_V2.rules : [];

  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.effectiveSnapshot,
    generatedAt: nowIso(),
    flags: {
      orchestratorV2Bootstrap: cloneJsonV2(COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP),
    },
    validation: {
      wordbookV2: {
        ok: wordbookErrors.length === 0,
        errors: wordbookErrors,
      },
      dreamConfigV2: {
        ok: !!dreamValidation?.ok,
        errors: Array.isArray(dreamValidation?.errors) ? dreamValidation.errors.slice() : [],
      },
      orchestratorV2: {
        ok: Array.isArray(orchestratorValidation?.errors) ? orchestratorValidation.errors.length === 0 : !!orchestratorValidation?.ok,
        errors: Array.isArray(orchestratorValidation?.errors) ? orchestratorValidation.errors.slice() : [],
      },
    },
    counts: {
      wordbookV2Words: countWordbookWords(WORDBOOK_V2),
      orchestratorV2Rules: orchestratorRules.length,
      compiledRuleEngineRules: Array.isArray(projectedRuleEngine.rules) ? projectedRuleEngine.rules.length : 0,
    },
    wordbookV2: cloneJsonV2(WORDBOOK_V2),
    dreamConfigV2: cloneJsonV2(INTERACTION_GRAPH_V2),
    orchestratorV2: cloneJsonV2(COMPILED_INTERACTION_GRAPH_V2),
    compiledRuleEngine: cloneJsonV2(projectedRuleEngine),
  };
}

const outputPath = resolveRuleEngineDocPath("effectiveSnapshot");
const snapshot = buildSnapshot();
writeJsonFile(outputPath, snapshot);
console.log(`wrote ${outputPath}`);
