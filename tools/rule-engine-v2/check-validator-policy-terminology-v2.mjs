import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const rel = "src/content/spell-rules/validate-rule-engine-config.js";
const text = readRelativeText(rel);

if (!text.includes("RULE_ENGINE_POLICY_CONTROL")) {
  failCheck("validator-policy-terminology:v2", `${rel} must reference RULE_ENGINE_POLICY_CONTROL in diagnostics`);
}
if (text.includes("RULE_ENGINE_MASTER_CONTROL")) {
  failCheck("validator-policy-terminology:v2", `${rel} must not reference RULE_ENGINE_MASTER_CONTROL`);
}

reportCheckPass("validator-policy-terminology:v2", "validator diagnostics use policy control naming");
