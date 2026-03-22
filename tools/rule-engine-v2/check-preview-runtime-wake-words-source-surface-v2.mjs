import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "preview-runtime-wake-words-source-surface:v2";
const PASS_MESSAGE = "preview runtime surfaces prefer canonical wake words[] with spells[] compatibility alias";

const PREVIEW_SYSTEM_REL = "src/systems/rule-engine-preview-system.js";
const previewSystemText = readRelativeText(PREVIEW_SYSTEM_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: previewSystemText,
  tokens: [
    "Array.isArray(action && action.words)",
    "Array.isArray(action && action.spells)",
    "spells: words.slice()",
  ],
  missingMessage: (token) => `${PREVIEW_SYSTEM_REL} missing wake words source token: ${token}`,
});
if (!previewSystemText.includes("const words = Array.isArray(action && action.words)")) {
  failCheck(CHECK_TAG, `${PREVIEW_SYSTEM_REL} must prefer canonical action.words over action.spells`);
}

const PREVIEW_RUNTIME_REL = "src/content/spell-rules/build-rule-engine-preview-runtime.js";
const previewRuntimeText = readRelativeText(PREVIEW_RUNTIME_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: previewRuntimeText,
  tokens: [
    "Array.isArray(a && a.words)",
    "Array.isArray(a && a.spells)",
    "spells: words.slice()",
  ],
  missingMessage: (token) => `${PREVIEW_RUNTIME_REL} missing wake words source token: ${token}`,
});
if (!previewRuntimeText.includes("const words = Array.isArray(a && a.words)")) {
  failCheck(CHECK_TAG, `${PREVIEW_RUNTIME_REL} must prefer canonical action.words over action.spells`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
