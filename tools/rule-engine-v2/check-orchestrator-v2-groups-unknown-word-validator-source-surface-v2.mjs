import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2 } from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "orchestrator-v2-groups-unknown-word-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves groups unknown/inactive word-id rejection";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "for (const wordRaw of wordsRaw) {",
    "const normalizedWordId = normalizeWordId(wordRaw);",
    "if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedWordId)) {",
    `errors.push(\`${"${ctx}"} ${UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2}${"${normalizedWordId}"}\`);`,
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing groups unknown-word validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
