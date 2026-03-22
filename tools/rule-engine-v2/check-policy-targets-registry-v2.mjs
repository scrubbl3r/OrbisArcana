import { assertSingletonRegistryV2 } from "./assert-singleton-registry-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { validateDocRegistryV2 } from "./validate-doc-registry-v2.mjs";
import { validateFileTargetsV2 } from "./validate-file-targets-v2.mjs";
import {
  POLICY_AUTHORING_DOC_KEYS_V2,
  POLICY_AUTHORING_DOC_RELS_V2,
  POLICY_RUNTIME_IMPORT_TARGETS_V2,
  POLICY_SCHEMA_DOC_KEYS_V2,
  POLICY_SCHEMA_DOC_RELS_V2,
  POLICY_VALIDATOR_TARGETS_V2,
} from "./policy-targets-v2.mjs";

// Validates policy registries/targets are unique and point at existing files/docs.
const CHECK_TAG = "policy-targets-registry:v2";
const PASS_MESSAGE = "policy target registry is valid";
const POLICY_LABELS = Object.freeze({
  schemaDocKeyRegistry: "policy schema doc key registry",
  schemaDocRelRegistry: "policy schema doc rel registry",
  validatorTargetRegistry: "policy validator target registry",
  runtimeImportTargets: "policy runtime import targets",
  validatorTargets: "policy validator targets",
  authoringDocs: "policy authoring docs",
  schemaDoc: "policy schema doc",
});

assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_SCHEMA_DOC_KEYS_V2,
  label: POLICY_LABELS.schemaDocKeyRegistry,
});
assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_SCHEMA_DOC_RELS_V2,
  label: POLICY_LABELS.schemaDocRelRegistry,
});
assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_VALIDATOR_TARGETS_V2,
  label: POLICY_LABELS.validatorTargetRegistry,
});

validateFileTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_RUNTIME_IMPORT_TARGETS_V2,
  label: POLICY_LABELS.runtimeImportTargets,
});
validateFileTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_VALIDATOR_TARGETS_V2,
  label: POLICY_LABELS.validatorTargets,
});

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: POLICY_AUTHORING_DOC_KEYS_V2,
  relPaths: POLICY_AUTHORING_DOC_RELS_V2,
  label: POLICY_LABELS.authoringDocs,
  requireMarkdown: true,
});

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: POLICY_SCHEMA_DOC_KEYS_V2,
  relPaths: POLICY_SCHEMA_DOC_RELS_V2,
  label: POLICY_LABELS.schemaDoc,
  requireMarkdown: true,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
