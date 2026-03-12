import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { ALL_CHECK_MANIFEST_ENTRIES_V2 } from "./check-manifests-v2.mjs";

const pkg = readJsonOrFail("script-registry:v2", "package.json");
const scripts = (pkg && typeof pkg.scripts === "object" && pkg.scripts) ? pkg.scripts : null;
if (!scripts) failCheck("script-registry:v2", "package.json scripts object missing");

const checks = ALL_CHECK_MANIFEST_ENTRIES_V2;

const explicitScriptNames = Object.freeze({
  doctor: "doctor:v2",
  rule_source: "check:rule-source-contract:v2",
  policy_alias: "check:policy-control-contract:v2",
  runtime_import: "check:runtime-policy-import-contract:v2",
  doc_policy: "check:doc-policy-terminology:v2",
  validator_policy: "check:validator-policy-terminology:v2",
  compat_surface: "check:master-control-compat-surface:v2",
  import_boundary: "check:master-control-import-boundary:v2",
});

const missing = [];
const mismatched = [];
for (const check of checks) {
  const id = String(check?.id || "").trim();
  const scriptPath = String(check?.script || "").trim();
  const scriptName = explicitScriptNames[id] || `check:${id.replace(/_/g, "-")}:v2`;
  const expected = `node ${scriptPath}`;
  const actual = String(scripts[scriptName] || "").trim();
  if (!actual) {
    missing.push(scriptName);
    continue;
  }
  if (actual !== expected) {
    mismatched.push(`${scriptName} (expected '${expected}', got '${actual}')`);
  }
}

if (missing.length) failCheck("script-registry:v2", `missing package scripts: ${missing.join(", ")}`);
if (mismatched.length) failCheck("script-registry:v2", `mismatched package scripts: ${mismatched.join("; ")}`);

console.log("[script-registry:v2] PASS: package scripts cover manifest-referenced checks");
