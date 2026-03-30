import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-entry-type-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves non-string open word entry rejection";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const values = asSelectorList(wordsRaw);",
    "if (typeof rawToken !== \"string\") {",
    "errors.push(`rule ${ruleId} open contains non-string word id: ${asText(rawToken) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open-entry-type validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
