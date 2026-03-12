import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "validator-policy-terminology:v2";
const rel = "src/content/spell-rules/validate-rule-engine-config.js";
const text = readRelativeText(rel);

if (!text.includes("RULE_ENGINE_POLICY_CONTROL")) {
  failCheck(CHECK_TAG, `${rel} must reference RULE_ENGINE_POLICY_CONTROL in diagnostics`);
}
if (text.includes("RULE_ENGINE_MASTER_CONTROL")) {
  failCheck(CHECK_TAG, `${rel} must not reference RULE_ENGINE_MASTER_CONTROL`);
}

reportCheckPass(CHECK_TAG, "validator diagnostics use policy control naming");
