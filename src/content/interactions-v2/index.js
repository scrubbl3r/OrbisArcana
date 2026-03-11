export { SPELLBOOK_V2, SPELLBOOK_V2_SPELLS, SPELLBOOK_V2_SPELLS_BY_ID, SPELLBOOK_V2_ACTIVE_SPELLS, SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
export {
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  collectImmediateEventSpellIdsFromInteractionsV2,
} from "./interactions-v2.js";
export { SIGNAL_HANDLES_V2, ACTION_HANDLES_V2, EVENT_HANDLES_V2 } from "./entity-handles-v2.js";
export { validateInteractionsV2 } from "./validate-interactions-v2.js";
export { validateSpellbookV2 } from "./validate-spellbook-v2.js";
export {
  buildRuleEngineFromInteractionsV2,
  buildRulesFromInteractionsV2,
} from "./build-rule-engine-from-interactions-v2.js";
// Legacy alias exports kept for compatibility during migration.
export {
  buildRuleEngineV1FromInteractionsV2,
  buildRulesV1FromInteractionsV2,
} from "./build-rule-engine-from-interactions-v2.js";
