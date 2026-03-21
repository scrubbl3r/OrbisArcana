import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-top-level-unsupported-keys-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "pushUnsupportedKeys(errors, ROOT_CONTEXT, cfg, new Set([\"version\", \"enabled\", \"defaults\", \"groups\", \"rules\"]));",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing top-level unsupported-key validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves top-level unsupported-key filtering"
);
