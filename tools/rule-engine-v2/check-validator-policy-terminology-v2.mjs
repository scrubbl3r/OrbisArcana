import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(msg) {
  console.error(`[validator-policy-terminology:v2] FAIL: ${msg}`);
  process.exit(1);
}

const rel = "src/content/spell-rules/validate-rule-engine-config.js";
const text = readFileSync(resolve(process.cwd(), rel), "utf8");

if (!text.includes("RULE_ENGINE_POLICY_CONTROL")) {
  fail(`${rel} must reference RULE_ENGINE_POLICY_CONTROL in diagnostics`);
}
if (text.includes("RULE_ENGINE_MASTER_CONTROL")) {
  fail(`${rel} must not reference RULE_ENGINE_MASTER_CONTROL`);
}

console.log("[validator-policy-terminology:v2] PASS: validator diagnostics use policy control naming");
