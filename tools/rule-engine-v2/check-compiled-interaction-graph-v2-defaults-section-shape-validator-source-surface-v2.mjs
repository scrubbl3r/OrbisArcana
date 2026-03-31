import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-defaults-section-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves defaults open/rule/trigger object-shape validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(defaults, \"open\") && !isPlainObject(defaults.open)) {",
    "errors.push(`${DEFAULTS_CONTEXT}.open must be an object when present`);",
    "if (Object.hasOwn(defaults, \"rule\") && !isPlainObject(defaults.rule)) {",
    "errors.push(`${DEFAULTS_CONTEXT}.rule must be an object when present`);",
    "if (Object.hasOwn(defaults, \"trigger\") && !isPlainObject(defaults.trigger)) {",
    "errors.push(`${DEFAULTS_CONTEXT}.trigger must be an object when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing defaults-section-shape validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
