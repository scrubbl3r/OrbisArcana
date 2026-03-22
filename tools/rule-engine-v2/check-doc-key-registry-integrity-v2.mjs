import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTokenListV2 } from "./check-token-list-v2.mjs";

const CHECK_TAG = "doc-key-registry-integrity:v2";
const CORE_LABEL = "core";
const GENERATED_LABEL = "generated";
const CORE_REGISTRY_LABEL = `${CORE_LABEL} markdown doc key registry`;
const GENERATED_REGISTRY_LABEL = `${GENERATED_LABEL} artifact key registry`;
const DUPLICATE_KEY_PREFIX = "duplicate";
const RULE_PATHS_KEY = "RULE_ENGINE_V2_DOC_PATHS";
const REGISTRY_OVERLAP_ERROR = "registry key overlap not allowed";
const PASS_MESSAGE = "doc key registries are valid, unique, and disjoint";

const allDefinedKeys = Object.freeze(new Set(Object.keys(RULE_ENGINE_V2_DOC_PATHS)));
const core = Array.from(RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS);
const generated = Array.from(RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS);

requireTokenListV2({
  tag: CHECK_TAG,
  tokens: core,
  emptyMessage: `${CORE_REGISTRY_LABEL} is empty`,
  invalidMessage: `${CORE_REGISTRY_LABEL} contains invalid key`,
});
requireTokenListV2({
  tag: CHECK_TAG,
  tokens: generated,
  emptyMessage: `${GENERATED_REGISTRY_LABEL} is empty`,
  invalidMessage: `${GENERATED_REGISTRY_LABEL} contains invalid key`,
});

function validateRegistryKeys(keys, label) {
  const seen = new Set();
  for (const key of keys) {
    if (!allDefinedKeys.has(key)) failCheck(CHECK_TAG, `${label} key missing from ${RULE_PATHS_KEY}: ${key}`);
    if (seen.has(key)) failCheck(CHECK_TAG, `${DUPLICATE_KEY_PREFIX} ${label} key: ${key}`);
    seen.add(key);
  }
  return seen;
}

const seenCore = validateRegistryKeys(core, CORE_LABEL);
const seenGenerated = validateRegistryKeys(generated, GENERATED_LABEL);

for (const key of seenCore) {
  if (seenGenerated.has(key)) {
    failCheck(CHECK_TAG, `${REGISTRY_OVERLAP_ERROR}: ${key}`);
  }
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
