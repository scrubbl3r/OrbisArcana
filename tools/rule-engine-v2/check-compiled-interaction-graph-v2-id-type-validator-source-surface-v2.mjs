import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-id-type-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves strict string typing for rule/open ids";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof ruleIdRaw !== \"string\") {",
    "errors.push(`${ROOT_CONTEXT}.rules[] id must be a string`);",
    "if (typeof openIdRaw !== \"string\") {",
    "errors.push(`${ctx}.id must be a string`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing id-type validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
