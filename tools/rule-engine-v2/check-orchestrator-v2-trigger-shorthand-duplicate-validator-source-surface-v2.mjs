import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-shorthand-duplicate-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves trigger shorthand duplicate normalized-event rejection";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const seenEventIds = new Set();",
    "`${ctx} shorthand contains duplicate normalized event id: ${eventId}`",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing trigger-shorthand-duplicate validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
