import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-word-id-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves ID-shape validation for normalized open/groups word ids";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (!ID_RE.test(normalizedWordId)) {",
    "errors.push(`${ctx} contains invalid word id shape: ${asText(wordRaw) || \"(empty)\"}`);",
    "errors.push(`${ctx} contains invalid word id shape: ${rawWord}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing word-id-shape validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
