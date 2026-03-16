import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";

const CHECK_TAG = "health-contract:v2";

const health = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.health);
const schema = typeof health.schema === "string" ? health.schema : "";

if (schema !== RULE_ENGINE_V2_SCHEMA_IDS.health) {
  failCheck(CHECK_TAG, `unexpected schema: ${schema}`);
}
if (health.spellbookOk !== true) failCheck(CHECK_TAG, "spellbookOk must be true");
if (health.interactionsOk !== true) failCheck(CHECK_TAG, "interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) failCheck(CHECK_TAG, "bootstrapUsesV2Adapter must be true");
if (health.projectionRulesOnly !== true) failCheck(CHECK_TAG, "projectionRulesOnly must be true");
if (!Array.isArray(health.driftRuleIds)) failCheck(CHECK_TAG, "driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) failCheck(CHECK_TAG, `driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

reportCheckPass(CHECK_TAG, "health contract is valid");
