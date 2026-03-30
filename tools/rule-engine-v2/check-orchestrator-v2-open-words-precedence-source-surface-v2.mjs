import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-words-precedence-source-surface:v2";
const PASS_MESSAGE = "orchestrator-v2 compiler and validator source preserve canonical open.words precedence over open.spells alias";

const COMPILER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const compilerText = readRelativeText(COMPILER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: compilerText,
  tokens: [
    "const wordsRaw = Object.hasOwn(open, FIELD_WORDS) ? open[FIELD_WORDS] : open[FIELD_SPELLS];",
  ],
  missingMessage: (token) => `${COMPILER_REL} missing open.words precedence token: ${token}`,
});

const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const validatorText = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: validatorText,
  tokens: [
    "const wordsRaw = Object.hasOwn(open, \"words\") ? open.words : open.spells;",
    "if (Object.hasOwn(open, \"spells\") && !Object.hasOwn(open, \"words\")) {",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open.words precedence token: ${token}`,
});

if (validatorText.includes("const wordsRaw = Object.hasOwn(open, \"spells\") ? open.spells : open.words;")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} must prefer open.words before open.spells alias`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
