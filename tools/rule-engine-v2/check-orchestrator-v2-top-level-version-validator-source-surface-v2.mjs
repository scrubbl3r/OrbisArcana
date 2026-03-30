import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-top-level-version-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves top-level version equality validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof cfg.version === \"string\" && cfg.version !== cfg.version.trim()) {",
    "errors.push(`${ROOT_CONTEXT}.version must not include leading/trailing whitespace: ${cfg.version}`);",
    "if (typeof cfg.version !== \"string\" || cfg.version !== \"2\") {",
    "errors.push(`${ROOT_CONTEXT}.version must be \"2\"`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing top-level version validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
