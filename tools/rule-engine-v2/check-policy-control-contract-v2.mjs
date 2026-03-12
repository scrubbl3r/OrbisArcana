import {
  RULE_ENGINE_MASTER_CONTROL,
  RULE_ENGINE_POLICY_CONTROL,
} from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "policy-control-contract:v2";

if (!RULE_ENGINE_POLICY_CONTROL || typeof RULE_ENGINE_POLICY_CONTROL !== "object") {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL export missing");
}
if (!RULE_ENGINE_MASTER_CONTROL || typeof RULE_ENGINE_MASTER_CONTROL !== "object") {
  failCheck(CHECK_TAG, "RULE_ENGINE_MASTER_CONTROL export missing");
}
if (RULE_ENGINE_POLICY_CONTROL !== RULE_ENGINE_MASTER_CONTROL) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL must alias RULE_ENGINE_MASTER_CONTROL");
}
if (!Array.isArray(RULE_ENGINE_POLICY_CONTROL.rules)) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL.rules must be an array");
}
if (RULE_ENGINE_POLICY_CONTROL.rules.length !== 0) {
  failCheck(CHECK_TAG, "RULE_ENGINE_POLICY_CONTROL.rules must remain empty; author rules in INTERACTIONS_V2");
}

reportCheckPass(CHECK_TAG, "policy alias and rules-empty contract hold");
