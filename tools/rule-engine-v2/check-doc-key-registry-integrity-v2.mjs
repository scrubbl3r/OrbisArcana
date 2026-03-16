import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "doc-key-registry-integrity:v2";

const allDefinedKeys = new Set(Object.keys(RULE_ENGINE_V2_DOC_PATHS));
const core = Array.from(RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS);
const generated = Array.from(RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS);

if (!core.length) failCheck(CHECK_TAG, "core markdown doc key registry is empty");
if (!generated.length) failCheck(CHECK_TAG, "generated artifact key registry is empty");

const seenCore = new Set();
for (const key of core) {
  if (!allDefinedKeys.has(key)) failCheck(CHECK_TAG, `core key missing from RULE_ENGINE_V2_DOC_PATHS: ${key}`);
  if (seenCore.has(key)) failCheck(CHECK_TAG, `duplicate core key: ${key}`);
  seenCore.add(key);
}

const seenGenerated = new Set();
for (const key of generated) {
  if (!allDefinedKeys.has(key)) failCheck(CHECK_TAG, `generated key missing from RULE_ENGINE_V2_DOC_PATHS: ${key}`);
  if (seenGenerated.has(key)) failCheck(CHECK_TAG, `duplicate generated key: ${key}`);
  seenGenerated.add(key);
}

for (const key of seenCore) {
  if (seenGenerated.has(key)) {
    failCheck(CHECK_TAG, `registry key overlap not allowed: ${key}`);
  }
}

reportCheckPass(CHECK_TAG, "doc key registries are valid, unique, and disjoint");
