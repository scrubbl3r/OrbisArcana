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

const CHECK_TAG = "policy-targets-registry:v2";
const POLICY_SCHEMA_DOC_KEY_REGISTRY_LABEL = "policy schema doc key registry";
const POLICY_SCHEMA_DOC_REL_REGISTRY_LABEL = "policy schema doc rel registry";
const POLICY_VALIDATOR_TARGET_REGISTRY_LABEL = "policy validator target registry";
const POLICY_RUNTIME_IMPORT_TARGETS_LABEL = "policy runtime import targets";
const POLICY_VALIDATOR_TARGETS_LABEL = "policy validator targets";

assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_SCHEMA_DOC_KEYS_V2,
  label: POLICY_SCHEMA_DOC_KEY_REGISTRY_LABEL,
});
assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_SCHEMA_DOC_RELS_V2,
  label: POLICY_SCHEMA_DOC_REL_REGISTRY_LABEL,
});
assertSingletonRegistryV2({
  tag: CHECK_TAG,
  values: POLICY_VALIDATOR_TARGETS_V2,
  label: POLICY_VALIDATOR_TARGET_REGISTRY_LABEL,
});

validateFileTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_RUNTIME_IMPORT_TARGETS_V2,
  label: POLICY_RUNTIME_IMPORT_TARGETS_LABEL,
});
validateFileTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_VALIDATOR_TARGETS_V2,
  label: POLICY_VALIDATOR_TARGETS_LABEL,
});

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: POLICY_AUTHORING_DOC_KEYS_V2,
  relPaths: POLICY_AUTHORING_DOC_RELS_V2,
  label: "policy authoring docs",
  requireMarkdown: true,
});

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: POLICY_SCHEMA_DOC_KEYS_V2,
  relPaths: POLICY_SCHEMA_DOC_RELS_V2,
  label: "policy schema doc",
  requireMarkdown: true,
});

reportCheckPass(CHECK_TAG, "policy target registry is valid");
