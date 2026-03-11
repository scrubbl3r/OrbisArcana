import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

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
    failCheck("doc-policy-terminology:v2", `${rel} must mention ${requiredToken}`);
  }
  if (text.includes(forbiddenProjectionToken)) {
    failCheck("doc-policy-terminology:v2", `${rel} contains deprecated token: ${forbiddenProjectionToken}`);
  }
  if (text.includes("RULE_ENGINE_MASTER_CONTROL")) {
    failCheck("doc-policy-terminology:v2", `${rel} must not reference RULE_ENGINE_MASTER_CONTROL`);
  }
}

const schemaDocRel = "docs/master-control-schema.md";
const schemaDocText = readFileSync(resolve(process.cwd(), schemaDocRel), "utf8");
if (!schemaDocText.includes(requiredToken)) {
  failCheck("doc-policy-terminology:v2", `${schemaDocRel} must mention ${requiredToken}`);
}
if (schemaDocText.includes(forbiddenProjectionToken)) {
  failCheck("doc-policy-terminology:v2", `${schemaDocRel} contains deprecated token: ${forbiddenProjectionToken}`);
}
const masterMentions = schemaDocText.match(/RULE_ENGINE_MASTER_CONTROL/g) || [];
if (masterMentions.length !== 1) {
  failCheck("doc-policy-terminology:v2", `${schemaDocRel} must contain exactly one RULE_ENGINE_MASTER_CONTROL compatibility mention`);
}
if (!schemaDocText.includes("compatibility alias: `RULE_ENGINE_MASTER_CONTROL`")) {
  failCheck("doc-policy-terminology:v2", `${schemaDocRel} compatibility alias line missing`);
}

console.log("[doc-policy-terminology:v2] PASS: active docs use policy-first projection flag naming");
