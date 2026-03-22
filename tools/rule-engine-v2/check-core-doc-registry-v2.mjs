import { RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS, RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { validateDocRegistryV2 } from "./validate-doc-registry-v2.mjs";

// Confirms the core markdown doc registry stays complete and markdown-only.
const CHECK_TAG = "core-doc-registry:v2";
const CORE_DOC_LABEL = "core doc";
const CORE_DOC_REGISTRY_LABEL = `${CORE_DOC_LABEL} registry`;
const PASS_MESSAGE = `${CORE_DOC_REGISTRY_LABEL} is valid and complete`;

validateDocRegistryV2({
  tag: CHECK_TAG,
  keys: RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  relPaths: RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS,
  label: CORE_DOC_LABEL,
  requireMarkdown: true,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
