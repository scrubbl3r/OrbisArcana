import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-words-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves open.words/open.spells type-shape validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(open, \"words\") && !isStringOrArray(open.words)) {",
    "errors.push(`${ctx}.words must be a string or array when present`);",
    "if (!isStringOrArray(open.spells)) {",
    "errors.push(`${ctx}.spells must be a string or array when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open words-shape validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
