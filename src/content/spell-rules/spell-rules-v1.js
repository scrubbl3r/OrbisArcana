// V1 RUNTIME RULE VIEW
// Authoring SSOT is interactions-v2.
// This module exposes a projected V1-compatible rule list for runtime consumers.
import { INTERACTIONS_V2, buildRulesV1FromInteractionsV2 } from "../interactions-v2/index.js";

function resolveSpellRulesV1() {
  try {
    return buildRulesV1FromInteractionsV2(INTERACTIONS_V2);
  } catch (err) {
    console.warn("SPELL_RULES_V1 projection failed; using empty projected rules:", err);
    return [];
  }
}

export const SPELL_RULES_V1 = resolveSpellRulesV1();
