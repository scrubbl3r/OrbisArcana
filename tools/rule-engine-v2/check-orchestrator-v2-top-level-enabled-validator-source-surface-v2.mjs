import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-top-level-enabled-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves top-level enabled boolean validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof cfg.enabled !== \"boolean\") {",
    "errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing top-level enabled validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
