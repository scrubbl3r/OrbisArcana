import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-window-refs-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves requires/consume type-shape validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (!isStringOrArray(rule[key])) {",
    "errors.push(`rule ${ruleId} ${key} must be a string or array when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing window-refs-shape validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
