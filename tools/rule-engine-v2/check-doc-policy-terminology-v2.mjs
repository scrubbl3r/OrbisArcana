import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(msg) {
  console.error(`[doc-policy-terminology:v2] FAIL: ${msg}`);
  process.exit(1);
}

const requiredToken = "RULE_ENGINE_POLICY_CONTROL";
const forbiddenProjectionToken = "RULE_ENGINE_MASTER_CONTROL.execution.projectionRulesOnly";

const authoringDocs = Object.freeze([
  "docs/rule-engine-authoring.md",
  "docs/rule-engine-compatibility.md",
]);

for (const rel of authoringDocs) {
  const abs = resolve(process.cwd(), rel);
  const text = readFileSync(abs, "utf8");
  if (!text.includes(requiredToken)) {
    fail(`${rel} must mention ${requiredToken}`);
  }
  if (text.includes(forbiddenProjectionToken)) {
    fail(`${rel} contains deprecated token: ${forbiddenProjectionToken}`);
  }
  if (text.includes("RULE_ENGINE_MASTER_CONTROL")) {
    fail(`${rel} must not reference RULE_ENGINE_MASTER_CONTROL`);
  }
}

const schemaDocRel = "docs/master-control-schema.md";
const schemaDocText = readFileSync(resolve(process.cwd(), schemaDocRel), "utf8");
if (!schemaDocText.includes(requiredToken)) {
  fail(`${schemaDocRel} must mention ${requiredToken}`);
}
if (schemaDocText.includes(forbiddenProjectionToken)) {
  fail(`${schemaDocRel} contains deprecated token: ${forbiddenProjectionToken}`);
}
const masterMentions = schemaDocText.match(/RULE_ENGINE_MASTER_CONTROL/g) || [];
if (masterMentions.length !== 1) {
  fail(`${schemaDocRel} must contain exactly one RULE_ENGINE_MASTER_CONTROL compatibility mention`);
}
if (!schemaDocText.includes("compatibility alias: `RULE_ENGINE_MASTER_CONTROL`")) {
  fail(`${schemaDocRel} compatibility alias line missing`);
}

console.log("[doc-policy-terminology:v2] PASS: active docs use policy-first projection flag naming");
