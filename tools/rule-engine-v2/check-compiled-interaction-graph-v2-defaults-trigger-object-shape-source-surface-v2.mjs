import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-defaults-trigger-object-shape-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves defaults.trigger.<event> object-shape validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "for (const [eventIdRaw, argsRaw] of Object.entries(triggerDefaults)) {",
    "if (!isPlainObject(argsRaw)) {",
    "errors.push(`${ctx}[${eventIdRaw}] must be an object`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing defaults.trigger object-shape validation token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
