import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-window-refs-entry-type-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves requires/consume non-string entry rejection";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const rawValues = asSelectorList(rule[key]);",
    "if (typeof rawValue !== \"string\") {",
    "errors.push(`rule ${ruleId} ${key} contains non-string window id: ${asText(rawValue) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing window-refs-entry-type validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
