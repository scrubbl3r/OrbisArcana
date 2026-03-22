import { RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_RELS, RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { validateDocRegistryV2 } from "./validate-doc-registry-v2.mjs";

// Confirms generated artifact registry keys and paths remain complete.
const CHECK_TAG = "generated-artifact-registry:v2";
const GENERATED_ARTIFACT_LABEL = "generated artifact";
const GENERATED_ARTIFACT_REGISTRY_LABEL = `${GENERATED_ARTIFACT_LABEL} registry`;
const PASS_MESSAGE = `${GENERATED_ARTIFACT_REGISTRY_LABEL} is valid and complete`;

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
  relPaths: RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_RELS,
  label: GENERATED_ARTIFACT_LABEL,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
