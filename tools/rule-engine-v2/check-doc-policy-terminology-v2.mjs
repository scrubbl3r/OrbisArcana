import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(msg) {
  console.error(`[doc-policy-terminology:v2] FAIL: ${msg}`);
  process.exit(1);
}

const targets = Object.freeze([
  "docs/rule-engine-authoring.md",
  "docs/rule-engine-compatibility.md",
  "docs/master-control-schema.md",
]);

const requiredToken = "RULE_ENGINE_POLICY_CONTROL";
const forbiddenToken = "RULE_ENGINE_MASTER_CONTROL.execution.projectionRulesOnly";

for (const rel of targets) {
  const abs = resolve(process.cwd(), rel);
  const text = readFileSync(abs, "utf8");
  if (!text.includes(requiredToken)) {
    fail(`${rel} must mention ${requiredToken}`);
  }
  if (text.includes(forbiddenToken)) {
    fail(`${rel} contains deprecated token: ${forbiddenToken}`);
  }
}

console.log("[doc-policy-terminology:v2] PASS: active docs use policy-first projection flag naming");
