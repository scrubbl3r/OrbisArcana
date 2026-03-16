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

validateFileTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_RUNTIME_IMPORT_TARGETS_V2,
  label: "POLICY_RUNTIME_IMPORT_TARGETS_V2",
});
validateFileTargetsV2({
  tag: CHECK_TAG,
  targets: POLICY_VALIDATOR_TARGETS_V2,
  label: "POLICY_VALIDATOR_TARGETS_V2",
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
