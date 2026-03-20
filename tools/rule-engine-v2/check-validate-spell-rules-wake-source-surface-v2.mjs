import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-source-surface:v2";
const REL = "src/content/spell-rules/validate-spell-rules.js";
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "Array.isArray(action && action.words)",
    "Array.isArray(action && action.spells)",
    "replace(/^(word|spell)\\./, \"\")",
    "wake_win references unknown word id",
  ],
  missingMessage: (token) => `${REL} missing wake validation token: ${token}`,
});

if (!text.includes("const words = Array.isArray(action && action.words)")) {
  failCheck(CHECK_TAG, `${REL} must prefer canonical wake_win.words[] before spells[] alias`);
}

reportCheckPass(
  CHECK_TAG,
  "validateSpellRules source preserves canonical wake_win words[] validation with spells[] compatibility alias"
);
