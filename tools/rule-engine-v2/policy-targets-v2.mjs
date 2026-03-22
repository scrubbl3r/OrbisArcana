// Canonical policy validation target lists for runtime imports and authoring docs.
import { docRelPathForKeyV2, docRelPathsForKeysV2 } from "./docs-paths-v2.mjs";
// These lists are consumed by policy checks and should remain narrowly scoped.
export const POLICY_RUNTIME_IMPORT_TARGETS_V2 = Object.freeze([
  "src/runtime/receiver-bootstrap.js",
]);

export const POLICY_VALIDATOR_TARGETS_V2 = Object.freeze([
  "src/content/spell-rules/validate-rule-engine-config.js",
]);

export const POLICY_AUTHORING_DOC_KEYS_V2 = Object.freeze([
  "ruleEngineAuthoringDoc",
  "ruleEngineCompatibilityDoc",
]);

export const POLICY_SCHEMA_DOC_KEYS_V2 = Object.freeze(["masterControlSchemaDoc"]);

export const POLICY_AUTHORING_DOC_RELS_V2 = Object.freeze(
  docRelPathsForKeysV2(POLICY_AUTHORING_DOC_KEYS_V2)
);

export const POLICY_SCHEMA_DOC_RELS_V2 = Object.freeze(
  POLICY_SCHEMA_DOC_KEYS_V2.map((key) => docRelPathForKeyV2(key))
);
