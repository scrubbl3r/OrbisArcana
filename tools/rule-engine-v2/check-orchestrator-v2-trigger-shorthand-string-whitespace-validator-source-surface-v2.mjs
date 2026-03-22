import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-shorthand-string-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves trigger shorthand string whitespace validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof trigger === \"string\" && trigger !== trigger.trim()) {",
    "errors.push(`${ctx} shorthand contains event id with leading/trailing whitespace: ${trigger}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing trigger-shorthand-string-whitespace validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
