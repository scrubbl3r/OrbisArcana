// Compatibility shim: keep legacy module path stable during filename migration.
export {
  buildRuleEngineV1FromInteractionsV2,
  buildRuleEngineFromInteractionsV2,
  buildRulesV1FromInteractionsV2,
  buildRulesFromInteractionsV2,
} from "./build-rule-engine-from-interactions-v2.js";
