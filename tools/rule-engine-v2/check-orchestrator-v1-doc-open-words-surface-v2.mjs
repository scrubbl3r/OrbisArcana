import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v1-doc-open-words-surface:v2";

const targets = Object.freeze([
  "docs/orchestrator-v1-schema.md",
  "docs/orchestrator-v1-recipes.md",
]);

for (const rel of targets) {
  const text = readRelativeText(rel);
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: ["words", "spells"],
    missingMessage: (token) => `${rel} missing required open authoring token: ${token}`,
  });
  if (!text.toLowerCase().includes("compatibility alias")) {
    failCheck(CHECK_TAG, `${rel} must include compatibility alias wording`);
  }
}

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v1 docs use canonical open.words with explicit open.spells compatibility alias"
);
