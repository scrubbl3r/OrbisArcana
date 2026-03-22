import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Confirms docs cite wordbook SSOT and explicit spellbook compatibility alias wording.
const CHECK_TAG = "docs-wordbook-canonical-ssot:v2";
const WORDBOOK_SSOT_TOKEN = "src/content/interactions-v2/wordbook-v2.js";
const SPELLBOOK_COMPAT_TOKEN = "src/content/interactions-v2/spellbook-v2.js";
const COMPAT_ALIAS_TOKEN = "compatibility alias";
const PASS_MESSAGE = "rule-engine docs use canonical wordbook SSOT naming with explicit spellbook compatibility alias";

const TARGETS = Object.freeze([
  "docs/rule-engine-authoring.md",
  "docs/rule-engine-v2-docs-index.md",
]);

for (const rel of TARGETS) {
  const text = readRelativeText(rel);
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [WORDBOOK_SSOT_TOKEN, SPELLBOOK_COMPAT_TOKEN],
    missingMessage: (token) => `${rel} missing required wordbook SSOT token: ${token}`,
  });
  if (!text.includes(COMPAT_ALIAS_TOKEN)) {
    failCheck(CHECK_TAG, `${rel} must document compatibility alias wording`);
  }
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
