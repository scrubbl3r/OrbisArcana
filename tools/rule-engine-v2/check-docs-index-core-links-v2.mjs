import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  RULE_ENGINE_V2_DOC_PATHS,
} from "./docs-paths-v2.mjs";
import { docsIndexLinkTokenForRelPathV2 } from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-core-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();

const coreDocLinks = RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS
  .filter((key) => key !== "docsIndex")
  .map((key) => RULE_ENGINE_V2_DOC_PATHS[key]);
const requiredLinkTokens = coreDocLinks.map((rel) => docsIndexLinkTokenForRelPathV2(rel));

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredLinkTokens,
  missingMessage: (token) => `${docsIndexRel} missing core doc link token: ${token}`,
});

reportCheckPass(CHECK_TAG, "docs index links all core markdown docs");
