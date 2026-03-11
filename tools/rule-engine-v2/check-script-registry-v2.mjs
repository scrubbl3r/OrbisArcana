import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";

function loadPackageJson() {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
  } catch (err) {
    failCheck("script-registry:v2", `unable to read package.json (${err?.message || err})`);
  }
}

const pkg = loadPackageJson();
const scripts = (pkg && typeof pkg.scripts === "object" && pkg.scripts) ? pkg.scripts : null;
if (!scripts) failCheck("script-registry:v2", "package.json scripts object missing");

const checks = [
  ...READY_PHASES_V2,
  ...REGRESSION_CHECKS_V2,
  ...CONTRACT_CHECKS_V2,
];

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
