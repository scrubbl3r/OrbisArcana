import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

const rel = "src/content/spell-rules/validate-rule-engine-config.js";
const text = readFileSync(resolve(process.cwd(), rel), "utf8");

if (!text.includes("RULE_ENGINE_POLICY_CONTROL")) {
  failCheck("validator-policy-terminology:v2", `${rel} must reference RULE_ENGINE_POLICY_CONTROL in diagnostics`);
}
if (text.includes("RULE_ENGINE_MASTER_CONTROL")) {
  failCheck("validator-policy-terminology:v2", `${rel} must not reference RULE_ENGINE_MASTER_CONTROL`);
}

console.log("[validator-policy-terminology:v2] PASS: validator diagnostics use policy control naming");
