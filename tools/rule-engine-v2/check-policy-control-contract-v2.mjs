import {
  RULE_ENGINE_MASTER_CONTROL,
  RULE_ENGINE_POLICY_CONTROL,
} from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";

if (!RULE_ENGINE_POLICY_CONTROL || typeof RULE_ENGINE_POLICY_CONTROL !== "object") {
  failCheck("policy-control-contract:v2", "RULE_ENGINE_POLICY_CONTROL export missing");
}
if (!RULE_ENGINE_MASTER_CONTROL || typeof RULE_ENGINE_MASTER_CONTROL !== "object") {
  failCheck("policy-control-contract:v2", "RULE_ENGINE_MASTER_CONTROL export missing");
}
if (RULE_ENGINE_POLICY_CONTROL !== RULE_ENGINE_MASTER_CONTROL) {
  failCheck("policy-control-contract:v2", "RULE_ENGINE_POLICY_CONTROL must alias RULE_ENGINE_MASTER_CONTROL");
}
if (!Array.isArray(RULE_ENGINE_POLICY_CONTROL.rules)) {
  failCheck("policy-control-contract:v2", "RULE_ENGINE_POLICY_CONTROL.rules must be an array");
}
if (RULE_ENGINE_POLICY_CONTROL.rules.length !== 0) {
  failCheck("policy-control-contract:v2", "RULE_ENGINE_POLICY_CONTROL.rules must remain empty; author rules in INTERACTIONS_V2");
}

console.log("[policy-control-contract:v2] PASS: policy alias and rules-empty contract hold");
