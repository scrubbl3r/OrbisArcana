import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "docs-wordbook-canonical-ssot:v2";

const TARGETS = Object.freeze([
  "docs/rule-engine-authoring.md",
  "docs/rule-engine-v2-docs-index.md",
]);

for (const rel of TARGETS) {
  const text = readRelativeText(rel);
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: [
      "src/content/interactions-v2/wordbook-v2.js",
      "src/content/interactions-v2/spellbook-v2.js",
    ],
    missingMessage: (token) => `${rel} missing required wordbook SSOT token: ${token}`,
  });
  if (!text.includes("compatibility alias")) {
    failCheck(CHECK_TAG, `${rel} must document compatibility alias wording`);
  }
}

reportCheckPass(
  CHECK_TAG,
  "rule-engine docs use canonical wordbook SSOT naming with explicit spellbook compatibility alias"
);
