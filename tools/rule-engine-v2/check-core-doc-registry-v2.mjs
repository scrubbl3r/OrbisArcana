import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS,
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { validateDocRegistryV2 } from "./validate-doc-registry-v2.mjs";

const CHECK_TAG = "core-doc-registry:v2";

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  relPaths: RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS,
  label: "core doc",
  requireMarkdown: true,
});

reportCheckPass(CHECK_TAG, "core markdown doc registry is valid and complete");
