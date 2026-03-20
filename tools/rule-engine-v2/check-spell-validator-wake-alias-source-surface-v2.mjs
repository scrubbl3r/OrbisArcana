import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "spell-validator-wake-alias-source-surface:v2";

const RUNTIME_ROUTING_REL = "src/content/spells/validate-spell-runtime-routing.js";
const runtimeRoutingText = readRelativeText(RUNTIME_ROUTING_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: runtimeRoutingText,
  tokens: [
    "Array.isArray(action && action.words)",
    "Array.isArray(action && action.spells)",
    "replace(/^(word|spell)\\./, \"\")",
  ],
  missingMessage: (token) => `${RUNTIME_ROUTING_REL} missing wake alias source token: ${token}`,
});

const SCHEMA_INTEGRITY_REL = "src/content/spells/validate-spell-schema-integrity.js";
const schemaIntegrityText = readRelativeText(SCHEMA_INTEGRITY_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: schemaIntegrityText,
  tokens: [
    "Array.isArray(action && action.words)",
    "Array.isArray(action && action.spells)",
    "replace(/^(word|spell)\\./, \"\")",
  ],
  missingMessage: (token) => `${SCHEMA_INTEGRITY_REL} missing wake alias source token: ${token}`,
});

if (!runtimeRoutingText.includes("wordRefs = Array.isArray(action && action.words)")) {
  failCheck(CHECK_TAG, `${RUNTIME_ROUTING_REL} must prefer canonical words[] before spells[] alias`);
}
if (!schemaIntegrityText.includes("wordRefs = Array.isArray(action && action.words)")) {
  failCheck(CHECK_TAG, `${SCHEMA_INTEGRITY_REL} must prefer canonical words[] before spells[] alias`);
}

reportCheckPass(
  CHECK_TAG,
  "spell validators preserve canonical wake_win.words[] handling with spells[] fallback and word|spell prefix normalization"
);
