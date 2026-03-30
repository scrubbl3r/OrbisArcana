import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-shorthand-entry-type-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves trigger shorthand non-string entry rejection";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "for (const rawEventId of asSelectorList(trigger)) {",
    "if (typeof rawEventId !== \"string\") {",
    "errors.push(`${ctx} shorthand contains non-string event id: ${asText(rawEventId) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing trigger-shorthand-entry-type validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
