import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-defaults-numeric-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves defaults.open/defaults.rule numeric guardrails";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const ctx = `${DEFAULTS_CONTEXT}.open`;",
    "\"ttlMs\",",
    "\"must be a finite number >= 0 when present\"",
    "const ctx = `${DEFAULTS_CONTEXT}.rule`;",
    "\"matchWindowMs\",",
    "`must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing defaults numeric validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
