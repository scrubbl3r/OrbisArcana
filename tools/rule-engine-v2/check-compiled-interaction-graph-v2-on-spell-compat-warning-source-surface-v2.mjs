import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-on-spell-compat-warning-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves on.word precedence with on.spell compatibility warning";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const hasOnWord = Object.hasOwn(on, \"word\");",
    "if (Object.hasOwn(on, \"spell\")) {",
    "warnings.push(`rule ${ruleId} uses on.spell alias; prefer on.word`);",
    "if (!hasOnWord) {",
    "parseAndPush(\"word\", on.spell);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on.spell compat-warning token: ${token}`,
});

if (text.includes("uses on.word alias; prefer on.spell")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} contains inverted on selector compat guidance (must prefer on.word)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
