import { RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS } from "./docs-paths-v2.mjs";
import { RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS } from "./handle-naming-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTextExcludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

// Ensures rule-engine docs do not regress to legacy handle token names.
const CHECK_TAG = "docs-compat-handle-drift:v2";
const LEGACY_TOKEN_LABEL = "legacy token";
const LEGACY_SCOPE_LABEL = "legacy handle names";
const PASS_MESSAGE = `rule-engine docs are free of ${LEGACY_SCOPE_LABEL}`;

const docFiles = RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS;

for (const rel of docFiles) {
  const text = readRelativeText(rel);
  requireTextExcludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS,
    forbiddenMessage: (token) => `${rel} contains ${LEGACY_TOKEN_LABEL}: ${token}`,
  });
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
