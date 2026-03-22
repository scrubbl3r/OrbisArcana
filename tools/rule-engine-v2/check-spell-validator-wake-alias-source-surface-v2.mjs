import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "spell-validator-wake-alias-source-surface:v2";
const ACTION_WAKE_WIN = "wake_win";
const TOKEN_CANONICAL_WORDS_ARRAY = "Array.isArray(action && action.words)";
const TOKEN_LEGACY_SPELLS_ARRAY = "Array.isArray(action && action.spells)";
const TOKEN_PREFIX_NORMALIZER = "replace(/^(word|spell)\\./, \"\")";
const TOKEN_WORDS_PRECEDENCE_ASSIGNMENT = "wordRefs = Array.isArray(action && action.words)";
const PASS_MESSAGE = `spell validators preserve canonical ${ACTION_WAKE_WIN}.words[] handling with spells[] fallback and word|spell prefix normalization`;

const RUNTIME_ROUTING_REL = "src/content/spells/validate-spell-runtime-routing.js";
const runtimeRoutingText = readRelativeText(RUNTIME_ROUTING_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: runtimeRoutingText,
  tokens: [
    TOKEN_CANONICAL_WORDS_ARRAY,
    TOKEN_LEGACY_SPELLS_ARRAY,
    TOKEN_PREFIX_NORMALIZER,
  ],
  missingMessage: (token) => `${RUNTIME_ROUTING_REL} missing wake alias source token: ${token}`,
});

const SCHEMA_INTEGRITY_REL = "src/content/spells/validate-spell-schema-integrity.js";
const schemaIntegrityText = readRelativeText(SCHEMA_INTEGRITY_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: schemaIntegrityText,
  tokens: [
    TOKEN_CANONICAL_WORDS_ARRAY,
    TOKEN_LEGACY_SPELLS_ARRAY,
    TOKEN_PREFIX_NORMALIZER,
  ],
  missingMessage: (token) => `${SCHEMA_INTEGRITY_REL} missing wake alias source token: ${token}`,
});

if (!runtimeRoutingText.includes(TOKEN_WORDS_PRECEDENCE_ASSIGNMENT)) {
  failCheck(CHECK_TAG, `${RUNTIME_ROUTING_REL} must prefer canonical words[] before spells[] alias`);
}
if (!schemaIntegrityText.includes(TOKEN_WORDS_PRECEDENCE_ASSIGNMENT)) {
  failCheck(CHECK_TAG, `${SCHEMA_INTEGRITY_REL} must prefer canonical words[] before spells[] alias`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
