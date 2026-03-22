import {
  RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES,
  RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES,
  RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES,
} from "./handle-naming-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTokenListV2 } from "./check-token-list-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";
import { requireTextExcludesTokensV2, requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "docs-index-canonical-signals:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();
const SIGNAL_LABEL = "signal";
const HANDLE_LABEL = "handle";
const LEGACY_SIGNAL_LABEL = "legacy signal";
const TOKEN_LIST_EMPTY_LABEL = "token list is empty";
const TOKEN_LIST_INVALID_LABEL = "token list contains invalid token";
const PASS_MESSAGE = "docs index signal and handle examples use canonical naming";

function tokenListMessage(kind, issue) {
  return `${docsIndexRel} ${kind} ${issue}`;
}

requireTokenListV2({
  tag: CHECK_TAG,
  tokens: RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES,
  emptyMessage: tokenListMessage(`canonical ${SIGNAL_LABEL}`, TOKEN_LIST_EMPTY_LABEL),
  invalidMessage: tokenListMessage(`canonical ${SIGNAL_LABEL}`, TOKEN_LIST_INVALID_LABEL),
});
requireTokenListV2({
  tag: CHECK_TAG,
  tokens: RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES,
  emptyMessage: tokenListMessage(`canonical ${HANDLE_LABEL}`, TOKEN_LIST_EMPTY_LABEL),
  invalidMessage: tokenListMessage(`canonical ${HANDLE_LABEL}`, TOKEN_LIST_INVALID_LABEL),
});
requireTokenListV2({
  tag: CHECK_TAG,
  tokens: RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES,
  emptyMessage: tokenListMessage(LEGACY_SIGNAL_LABEL, TOKEN_LIST_EMPTY_LABEL),
  invalidMessage: tokenListMessage(LEGACY_SIGNAL_LABEL, TOKEN_LIST_INVALID_LABEL),
});

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES,
  missingMessage: (token) => `${docsIndexRel} missing canonical signal example ${token}`,
});
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES,
  missingMessage: (token) => `${docsIndexRel} missing canonical handle example ${token}`,
});
requireTextExcludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES,
  forbiddenMessage: (token) => `${docsIndexRel} contains legacy signal example ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
