// Compatibility shim: keep legacy module path stable during filename migration.
export {
  buildRuleEngineFromInteractionsV2,
  buildRuleEngineV1FromInteractionsV2,
  buildRulesFromInteractionsV2,
  buildRulesV1FromInteractionsV2,
} from "./build-rule-engine-from-interactions-v2.js";
