import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-spells-alias-warning-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves open.spells compatibility warning with canonical open.words guidance";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(open, \"spells\") && !Object.hasOwn(open, \"words\")) {",
    "warnings.push(`rule ${ruleId} uses open.spells alias; prefer open.words`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open.spells alias-warning token: ${token}`,
});

if (text.includes("uses open.words alias; prefer open.spells")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} contains inverted open alias guidance (must prefer open.words)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
