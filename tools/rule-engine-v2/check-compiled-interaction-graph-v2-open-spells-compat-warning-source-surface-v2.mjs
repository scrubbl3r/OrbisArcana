import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-open-spells-compat-warning-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves open.spells compatibility warning with canonical open.words guidance";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(open, \"spells\") && !Object.hasOwn(open, \"words\")) {",
    "warnings.push(`rule ${ruleId} uses open.spells alias; prefer open.words`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open.spells compat-warning token: ${token}`,
});

if (text.includes("uses open.words alias; prefer open.spells")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} contains inverted open compat guidance (must prefer open.words)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
