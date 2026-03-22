import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-groups-normalization-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves normalizeWordId-based validation for groups and @group open expansion";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "function validateGroups(groupsRaw, errors) {",
    "const normalizedWordId = normalizeWordId(wordRaw);",
    "function expandOpenWords(wordsRaw, groups, ruleId, errors) {",
    "for (const groupWord of groupWords) out.push(asText(groupWord));",
    "const normalizedWordId = normalizeWordId(rawWord);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing groups/open normalization token: ${token}`,
});

if (text.includes("const normalizedWordId = asText(wordRaw).toLowerCase();")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} groups normalization must use normalizeWordId (raw lowercase fallback detected)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
