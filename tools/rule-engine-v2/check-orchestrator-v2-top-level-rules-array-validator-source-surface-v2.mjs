import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-top-level-rules-array-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (!Array.isArray(cfg.rules)) {",
    "errors.push(`${ROOT_CONTEXT}.rules must be an array`);",
    "return { ok: false, errors, warnings };",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing top-level rules-array validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves top-level rules-array validation and early failure"
);
