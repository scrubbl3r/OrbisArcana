import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-rule-section-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves explicit rule on/open shape validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const onIsObject = isPlainObject(rule.on);",
    "errors.push(`${ctx}.on must be an object`);",
    "const openIsObject = !hasOpenSection || isPlainObject(rule.open);",
    "errors.push(`${ctx}.open must be an object when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing rule-section-shape validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
