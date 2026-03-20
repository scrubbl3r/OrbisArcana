import {
  INTERACTIONS_V2,
  buildRulesFromInteractionsV2,
  projectOrchestratorV1FromInteractionsV2,
  validateOrchestratorV1,
} from "../../src/content/interactions-v2/index.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-projection-validity:v2";

function asObject(value) {
  return (!!value && typeof value === "object" && !Array.isArray(value)) ? value : {};
}

const projected = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
const validationErrors = validateOrchestratorV1(projected);
if (validationErrors.length) {
  failCheckWithDetails(CHECK_TAG, "projected orchestrator failed schema validation", validationErrors);
}

const projectedRules = Array.isArray(projected?.rules) ? projected.rules : [];
const interactionsRules = buildRulesFromInteractionsV2(INTERACTIONS_V2);
if (projectedRules.length !== interactionsRules.length) {
  failCheck(
    CHECK_TAG,
    `rule count mismatch: projected=${projectedRules.length} interactions=${interactionsRules.length}`
  );
}

for (const rule of projectedRules) {
  const ruleId = typeof rule?.id === "string" ? rule.id.trim() : "";
  if (!ruleId) failCheck(CHECK_TAG, "projected rule missing id");
  const safeRule = asObject(rule);
  const selectors = Array.isArray(rule?.on) ? rule.on : [];
  if (!selectors.length) {
    failCheck(CHECK_TAG, `projected rule ${ruleId} missing on[] selectors`);
  }
  const hasOpen = Object.prototype.hasOwnProperty.call(safeRule, "open");
  const hasTrigger = Object.prototype.hasOwnProperty.call(safeRule, "trigger");
  if (!hasOpen && !hasTrigger) {
    failCheck(CHECK_TAG, `projected rule ${ruleId} has neither open nor trigger`);
  }
  if (hasOpen) {
    const open = asObject(safeRule.open);
    const hasWords = Array.isArray(open.words);
    const hasSpells = Array.isArray(open.spells);
    if (!hasWords) {
      failCheck(CHECK_TAG, `projected rule ${ruleId} open missing canonical words[]`);
    }
    if (!hasSpells) {
      failCheck(CHECK_TAG, `projected rule ${ruleId} open missing compatibility spells[]`);
    }
    if (hasWords && hasSpells && JSON.stringify(open.words) !== JSON.stringify(open.spells)) {
      failCheck(CHECK_TAG, `projected rule ${ruleId} open words/spells alias mismatch`);
    }
  }
}

reportCheckPass(CHECK_TAG, "projected orchestrator shape is valid and complete");
