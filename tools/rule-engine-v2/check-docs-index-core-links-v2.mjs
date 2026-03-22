import { RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS, RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { docsIndexLinkTokensForRelPathsV2 } from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTokenListV2 } from "./check-token-list-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

// Ensures docs index contains link tokens for every registered core markdown doc.
const CHECK_TAG = "docs-index-core-links:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();
const CORE_DOC_LABEL = "core doc link";
const TOKEN_LIST_EMPTY_LABEL = "token list is empty";
const TOKEN_LIST_INVALID_LABEL = "token list contains invalid token";
const PASS_MESSAGE = "docs index links all core markdown docs";

const coreDocLinks = RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS.filter(
  (rel) => rel !== RULE_ENGINE_V2_DOC_PATHS.docsIndex
);
const requiredLinkTokens = docsIndexLinkTokensForRelPathsV2(coreDocLinks);
requireTokenListV2({
  tag: CHECK_TAG,
  tokens: requiredLinkTokens,
  emptyMessage: `${docsIndexRel} ${CORE_DOC_LABEL} ${TOKEN_LIST_EMPTY_LABEL}`,
  invalidMessage: `${docsIndexRel} ${CORE_DOC_LABEL} ${TOKEN_LIST_INVALID_LABEL}`,
});

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredLinkTokens,
  missingMessage: (token) => `${docsIndexRel} missing ${CORE_DOC_LABEL} token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
