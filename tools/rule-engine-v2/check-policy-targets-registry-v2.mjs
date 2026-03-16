import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { docRelPathForKeyV2, docRelPathsForKeysV2 } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  POLICY_AUTHORING_DOC_KEYS_V2,
  POLICY_RUNTIME_IMPORT_TARGETS_V2,
  POLICY_SCHEMA_DOC_KEY_V2,
  POLICY_VALIDATOR_TARGET_V2,
} from "./policy-targets-v2.mjs";

const CHECK_TAG = "policy-targets-registry:v2";

function assertFile(relPath, label) {
  if (!String(relPath).trim()) {
    failCheck(CHECK_TAG, `${label} path is empty`);
  }
  if (!existsSync(resolve(process.cwd(), relPath))) {
    failCheck(CHECK_TAG, `${label} file missing: ${relPath}`);
  }
}

if (!Array.isArray(POLICY_RUNTIME_IMPORT_TARGETS_V2) || !POLICY_RUNTIME_IMPORT_TARGETS_V2.length) {
  failCheck(CHECK_TAG, "POLICY_RUNTIME_IMPORT_TARGETS_V2 must be a non-empty array");
}
for (const rel of POLICY_RUNTIME_IMPORT_TARGETS_V2) {
  assertFile(rel, "runtime import target");
}

assertFile(POLICY_VALIDATOR_TARGET_V2, "validator target");

if (!Array.isArray(POLICY_AUTHORING_DOC_KEYS_V2) || !POLICY_AUTHORING_DOC_KEYS_V2.length) {
  failCheck(CHECK_TAG, "POLICY_AUTHORING_DOC_KEYS_V2 must be a non-empty array");
}
const authoringDocRels = docRelPathsForKeysV2(POLICY_AUTHORING_DOC_KEYS_V2);
for (const rel of authoringDocRels) {
  if (!String(rel).endsWith(".md")) {
    failCheck(CHECK_TAG, `authoring doc target must be markdown: ${rel}`);
  }
  assertFile(rel, "authoring doc target");
}

const schemaDocRel = docRelPathForKeyV2(POLICY_SCHEMA_DOC_KEY_V2);
if (!String(schemaDocRel).endsWith(".md")) {
  failCheck(CHECK_TAG, `schema doc target must be markdown: ${schemaDocRel}`);
}
assertFile(schemaDocRel, "schema doc target");

reportCheckPass(CHECK_TAG, "policy target registry is valid");
