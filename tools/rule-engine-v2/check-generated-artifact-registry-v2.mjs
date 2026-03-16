import {
  docRelPathsForKeysV2,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { validateDocRegistryV2 } from "./validate-doc-registry-v2.mjs";

const CHECK_TAG = "generated-artifact-registry:v2";

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
  relPaths: docRelPathsForKeysV2(RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS),
  label: "generated artifact",
});

reportCheckPass(CHECK_TAG, "generated artifact registry is valid and complete");
