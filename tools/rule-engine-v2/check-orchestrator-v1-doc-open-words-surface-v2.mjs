import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v1-doc-open-words-surface:v2";
const PASS_MESSAGE = "orchestrator-v1 docs use canonical word/words authoring with explicit legacy spells compatibility wording";

const targets = Object.freeze([
  "docs/orchestrator-v1-schema.md",
  "docs/orchestrator-v1-recipes.md",
]);

for (const rel of targets) {
  const text = readRelativeText(rel);
  requireTextIncludesTokensV2({
    tag: CHECK_TAG,
    text,
    tokens: ["word", "words", "spells"],
    missingMessage: (token) => `${rel} missing required open authoring token: ${token}`,
  });
  const lower = text.toLowerCase();
  if (!lower.includes("legacy") || !lower.includes("compatibility alias")) {
    failCheck(CHECK_TAG, `${rel} must include explicit legacy compatibility alias wording`);
  }
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
