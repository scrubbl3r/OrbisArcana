import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-defaults-rule-numeric-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves defaults.rule cooldown/priority numeric guardrails";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const ctx = `${DEFAULTS_CONTEXT}.rule`;",
    "\"cooldownMs\",",
    "\"must be a finite number >= 0 when present\"",
    "\"priority\",",
    "\"must be a finite number when present\"",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing defaults.rule numeric validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
