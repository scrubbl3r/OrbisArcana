import {
  RULE_ENGINE_V2_CANONICAL_HANDLE_EXAMPLES,
  RULE_ENGINE_V2_CANONICAL_SIGNAL_EXAMPLES,
  RULE_ENGINE_V2_LEGACY_SIGNAL_EXAMPLES,
} from "./handle-naming-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";
import {
  requireTextExcludesTokensV2,
  requireTextIncludesTokensV2,
} from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "docs-index-canonical-signals:v2";
const { rel: docsIndexRel, text } = readDocsIndexV2();

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

reportCheckPass(CHECK_TAG, "docs index signal and handle examples use canonical naming");
