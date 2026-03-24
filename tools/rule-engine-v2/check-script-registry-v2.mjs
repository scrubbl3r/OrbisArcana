import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { flattenManifestChecksV2 } from "./manifest-check-entries-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Verifies package.json scripts cover all manifest-declared check scripts.
const CHECK_TAG = "script-registry:v2";
const PACKAGE_JSON_PATH = "package.json";
const PACKAGE_SCRIPTS_LABEL = "scripts";
const CHECK_SCRIPT_PREFIX = "check:";
const CHECK_SCRIPT_SUFFIX = ":v2";
const NODE_CMD_PREFIX = "node";
const MISSING_SCRIPTS_LABEL = "missing package scripts";
const MISMATCHED_SCRIPTS_LABEL = "mismatched package scripts";
const PASS_MESSAGE = "package scripts cover manifest-referenced checks";

function text(v) {
  return typeof v === "string" ? v.trim() : "";
}

function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function resolveScriptNameForCheck(id, overrides) {
  const key = text(id);
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return text(overrides[key]);
  }
  return `${CHECK_SCRIPT_PREFIX}${key.replace(/_/g, "-")}${CHECK_SCRIPT_SUFFIX}`;
}

const pkg = readJsonOrFail(CHECK_TAG, PACKAGE_JSON_PATH);
const scripts = isRecord(pkg?.scripts)
  ? pkg.scripts
  : null;
if (!scripts) failCheck(CHECK_TAG, `${PACKAGE_JSON_PATH} ${PACKAGE_SCRIPTS_LABEL} object missing`);

const explicitScriptNames = Object.freeze({
  doctor: "doctor:v2",
  rule_source_contract: "check:rule-source-contract:v2",
  policy_control_contract: "check:policy-control-contract:v2",
  runtime_policy_import_contract: "check:runtime-policy-import-contract:v2",
  doc_policy: "check:doc-policy-terminology:v2",
  validator_policy: "check:validator-policy-terminology:v2",
  compat_surface: "check:master-control-compat-surface:v2",
  import_boundary: "check:master-control-import-boundary:v2",
});

const missing = [];
const mismatched = [];
for (const check of flattenManifestChecksV2()) {
  const id = text(check?.id);
  const scriptPath = text(check?.script);
  const scriptName = resolveScriptNameForCheck(id, explicitScriptNames);
  const expected = `${NODE_CMD_PREFIX} ${scriptPath}`;
  const actual = text(scripts[scriptName]);
  if (!actual) {
    missing.push(scriptName);
    continue;
  }
  if (actual !== expected) {
    mismatched.push(`${scriptName} (expected '${expected}', got '${actual}')`);
  }
}

if (missing.length) failCheck(CHECK_TAG, `${MISSING_SCRIPTS_LABEL}: ${missing.join(", ")}`);
if (mismatched.length) failCheck(CHECK_TAG, `${MISMATCHED_SCRIPTS_LABEL}: ${mismatched.join("; ")}`);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
