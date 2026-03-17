import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "doc-key-registry-integrity:v2";

const allDefinedKeys = Object.freeze(new Set(Object.keys(RULE_ENGINE_V2_DOC_PATHS)));
const core = Array.from(RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS);
const generated = Array.from(RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS);

function assertNonEmptyList(values, label) {
  if (!Array.isArray(values) || !values.length) {
    failCheck(CHECK_TAG, `${label} key registry is empty`);
  }
}

assertNonEmptyList(core, "core markdown doc");
assertNonEmptyList(generated, "generated artifact");

function validateRegistryKeys(keys, label) {
  const seen = new Set();
  for (const key of keys) {
    if (!allDefinedKeys.has(key)) failCheck(CHECK_TAG, `${label} key missing from RULE_ENGINE_V2_DOC_PATHS: ${key}`);
    if (seen.has(key)) failCheck(CHECK_TAG, `duplicate ${label} key: ${key}`);
    seen.add(key);
  }
  return seen;
}

const seenCore = validateRegistryKeys(core, "core");
const seenGenerated = validateRegistryKeys(generated, "generated");

for (const key of seenCore) {
  if (seenGenerated.has(key)) {
    failCheck(CHECK_TAG, `registry key overlap not allowed: ${key}`);
  }
}

reportCheckPass(CHECK_TAG, "doc key registries are valid, unique, and disjoint");
