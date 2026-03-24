import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Confirms docs cite canonical wordbook SSOT and avoid legacy spellbook module-path references.
const CHECK_TAG = "docs-wordbook-canonical-ssot:v2";
const WORDBOOK_SSOT_TOKEN = "src/content/interactions-v2/wordbook-v2.js";
const LEGACY_SPELLBOOK_MODULE_PATH = "src/content/interactions-v2/spellbook-v2.js";
const PASS_MESSAGE = "rule-engine docs use canonical wordbook SSOT naming without legacy spellbook module-path alias";

const TARGETS = Object.freeze([
  "docs/rule-engine-authoring.md",
  "docs/rule-engine-v2-docs-index.md",
]);

for (const rel of TARGETS) {
  const text = readRelativeText(rel);
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [WORDBOOK_SSOT_TOKEN],
    missingMessage: (token) => `${rel} missing required wordbook SSOT token: ${token}`,
  });
  if (text.includes(LEGACY_SPELLBOOK_MODULE_PATH)) {
    failCheck(CHECK_TAG, `${rel} must not reference retired spellbook module path`);
  }
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
