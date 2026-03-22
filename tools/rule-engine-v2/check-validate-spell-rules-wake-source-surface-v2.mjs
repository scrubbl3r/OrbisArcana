import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { WAKE_UNKNOWN_WORD_ERROR_PREFIX_V2 } from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-source-surface:v2";
const ACTION_WAKE_WIN = "wake_win";
const TOKEN_CANONICAL_WORDS_ARRAY = "Array.isArray(action && action.words)";
const TOKEN_LEGACY_SPELLS_ARRAY = "Array.isArray(action && action.spells)";
const TOKEN_PREFIX_NORMALIZER = "replace(/^(word|spell)\\./, \"\")";
const TOKEN_WORDS_PRECEDENCE_ASSIGNMENT = "const words = Array.isArray(action && action.words)";
const REL = "src/content/spell-rules/validate-spell-rules.js";
const PASS_MESSAGE = `validateSpellRules source preserves canonical ${ACTION_WAKE_WIN} words[] validation with spells[] compatibility alias`;
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    TOKEN_CANONICAL_WORDS_ARRAY,
    TOKEN_LEGACY_SPELLS_ARRAY,
    TOKEN_PREFIX_NORMALIZER,
    WAKE_UNKNOWN_WORD_ERROR_PREFIX_V2,
  ],
  missingMessage: (token) => `${REL} missing wake validation token: ${token}`,
});

if (!text.includes(TOKEN_WORDS_PRECEDENCE_ASSIGNMENT)) {
  failCheck(CHECK_TAG, `${REL} must prefer canonical ${ACTION_WAKE_WIN}.words[] before spells[] alias`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
