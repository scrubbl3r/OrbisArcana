import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";

// Validates the generated health artifact schema and required true/empty fields.
const CHECK_TAG = "health-contract:v2";
const FIELD_WORDBOOK_OK = "wordbookOk";
const FIELD_SPELLBOOK_OK = "spellbookOk";
const FIELD_INTERACTIONS_OK = "interactionsOk";
const FIELD_BOOTSTRAP_V2 = "bootstrapUsesV2Adapter";
const FIELD_PROJECTION_RULES_ONLY = "projectionRulesOnly";
const FIELD_DRIFT_RULE_IDS = "driftRuleIds";
const PASS_MESSAGE = "health contract is valid";

const health = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.health);
const schema = typeof health.schema === "string" ? health.schema : "";

if (schema !== RULE_ENGINE_V2_SCHEMA_IDS.health) {
  failCheck(CHECK_TAG, `unexpected schema: ${schema}`);
}
const wordbookOk = health[FIELD_WORDBOOK_OK] === true || health[FIELD_SPELLBOOK_OK] === true;
if (!wordbookOk) failCheck(CHECK_TAG, `${FIELD_WORDBOOK_OK} (or compatibility ${FIELD_SPELLBOOK_OK}) must be true`);
if (Object.hasOwn(health, FIELD_WORDBOOK_OK) && health[FIELD_WORDBOOK_OK] !== true) {
  failCheck(CHECK_TAG, `${FIELD_WORDBOOK_OK} must be true when present`);
}
if (Object.hasOwn(health, FIELD_SPELLBOOK_OK) && health[FIELD_SPELLBOOK_OK] !== true) {
  failCheck(CHECK_TAG, `${FIELD_SPELLBOOK_OK} must be true when present`);
}
if (health[FIELD_INTERACTIONS_OK] !== true) failCheck(CHECK_TAG, `${FIELD_INTERACTIONS_OK} must be true`);
if (health[FIELD_BOOTSTRAP_V2] !== true) failCheck(CHECK_TAG, `${FIELD_BOOTSTRAP_V2} must be true`);
if (health[FIELD_PROJECTION_RULES_ONLY] !== true) failCheck(CHECK_TAG, `${FIELD_PROJECTION_RULES_ONLY} must be true`);
if (!Array.isArray(health[FIELD_DRIFT_RULE_IDS])) failCheck(CHECK_TAG, `${FIELD_DRIFT_RULE_IDS} must be an array`);
if (health[FIELD_DRIFT_RULE_IDS].length !== 0) failCheck(CHECK_TAG, `${FIELD_DRIFT_RULE_IDS} must be empty (got ${health[FIELD_DRIFT_RULE_IDS].join(", ")})`);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
