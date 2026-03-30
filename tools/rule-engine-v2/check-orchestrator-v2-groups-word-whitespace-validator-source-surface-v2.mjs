import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-groups-word-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves groups word-id whitespace validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (wordRaw !== wordRaw.trim()) {",
    "errors.push(`${ctx} contains word id with leading/trailing whitespace: ${wordRaw}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing groups word-whitespace validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
