import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-defaults-unsupported-keys-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves defaults key filtering to open/rule/trigger";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const defaults = asObj(defaultsRaw);",
    "pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, new Set([\"open\", \"rule\", \"trigger\"]));",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing defaults unsupported-key validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
