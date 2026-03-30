import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-id-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves whitespace rejection for rule/open ids";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof ruleIdRaw === \"string\" && ruleIdRaw !== ruleIdRaw.trim()) {",
    "errors.push(`${ROOT_CONTEXT}.rules[] id must not include leading/trailing whitespace: ${ruleIdRaw}`);",
    "if (typeof openIdRaw === \"string\" && openIdRaw !== openIdRaw.trim()) {",
    "errors.push(`${ctx}.id must not include leading/trailing whitespace: ${openIdRaw}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing id-whitespace validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
