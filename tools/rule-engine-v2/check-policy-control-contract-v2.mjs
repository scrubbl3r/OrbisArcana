import { RULE_ENGINE_MASTER_CONTROL, RULE_ENGINE_POLICY_CONTROL } from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Guards alias contract for policy/master control and empty runtime rule list policy.
const CHECK_TAG = "policy-control-contract:v2";
const PASS_MESSAGE = "policy alias and rules-empty contract hold";

function isObjectRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

if (!isObjectRecord(RULE_ENGINE_POLICY_CONTROL)) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL export missing");
}
if (!isObjectRecord(RULE_ENGINE_MASTER_CONTROL)) {
  failCheck(CHECK_TAG, "RULE_ENGINE_MASTER_CONTROL export missing");
}
if (RULE_ENGINE_POLICY_CONTROL !== RULE_ENGINE_MASTER_CONTROL) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL must alias RULE_ENGINE_MASTER_CONTROL");
}
if (!Array.isArray(RULE_ENGINE_POLICY_CONTROL.rules)) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL.rules must be an array");
}
if (RULE_ENGINE_POLICY_CONTROL.rules.length !== 0) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL.rules must remain empty; author rules in ORCHESTRATOR_V1/ORCHESTRATOR_V2");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
