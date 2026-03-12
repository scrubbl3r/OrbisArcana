import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";

const health = readJsonOrFail("health-contract:v2", RULE_ENGINE_V2_DOC_PATHS.health);

if (String(health.schema || "") !== RULE_ENGINE_V2_SCHEMA_IDS.health) {
  failCheck("health-contract:v2", `unexpected schema: ${String(health.schema || "")}`);
}
if (health.spellbookOk !== true) failCheck("health-contract:v2", "spellbookOk must be true");
if (health.interactionsOk !== true) failCheck("health-contract:v2", "interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) failCheck("health-contract:v2", "bootstrapUsesV2Adapter must be true");
if (health.projectionRulesOnly !== true) failCheck("health-contract:v2", "projectionRulesOnly must be true");
if (!Array.isArray(health.driftRuleIds)) failCheck("health-contract:v2", "driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) failCheck("health-contract:v2", `driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

console.log("[health-contract:v2] PASS: health contract is valid");
