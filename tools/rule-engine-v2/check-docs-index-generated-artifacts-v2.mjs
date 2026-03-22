import { RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_RELS } from "./docs-paths-v2.mjs";
import { docsIndexLinkTokensForRelPathsV2, docsIndexOwnershipTokensForRelPathsV2 } from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTokenListV2 } from "./check-token-list-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

// Verifies docs index includes generated-artifact quick links and ownership tokens.
const CHECK_TAG = "docs-index-generated-artifacts:v2";
const { rel: indexRel, text } = readDocsIndexV2();
const GENERATED_ARTIFACT_LABEL = "generated-artifact";
const QUICK_LINK_LABEL = "quick link";
const OWNERSHIP_LABEL = "ownership";
const TOKEN_LIST_EMPTY_LABEL = "token list is empty";
const TOKEN_LIST_INVALID_LABEL = "token list contains invalid token";
const PASS_MESSAGE = "docs index covers all generated artifact links and ownership entries";

function tokenListMessage(scope, issue) {
  return `${indexRel} ${GENERATED_ARTIFACT_LABEL} ${scope} ${issue}`;
}

const requiredQuickLinkTokens = docsIndexLinkTokensForRelPathsV2(
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_RELS
);
const requiredOwnershipTokens = docsIndexOwnershipTokensForRelPathsV2(
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_RELS
);
requireTokenListV2({
  tag: CHECK_TAG,
  tokens: requiredQuickLinkTokens,
  emptyMessage: tokenListMessage(QUICK_LINK_LABEL, TOKEN_LIST_EMPTY_LABEL),
  invalidMessage: tokenListMessage(QUICK_LINK_LABEL, TOKEN_LIST_INVALID_LABEL),
});
requireTokenListV2({
  tag: CHECK_TAG,
  tokens: requiredOwnershipTokens,
  emptyMessage: tokenListMessage(OWNERSHIP_LABEL, TOKEN_LIST_EMPTY_LABEL),
  invalidMessage: tokenListMessage(OWNERSHIP_LABEL, TOKEN_LIST_INVALID_LABEL),
});

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredQuickLinkTokens,
  missingMessage: (token) => `${indexRel} missing ${GENERATED_ARTIFACT_LABEL} ${QUICK_LINK_LABEL} token: ${token}`,
});
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredOwnershipTokens,
  missingMessage: (token) => `${indexRel} missing ${GENERATED_ARTIFACT_LABEL} ${OWNERSHIP_LABEL} token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
