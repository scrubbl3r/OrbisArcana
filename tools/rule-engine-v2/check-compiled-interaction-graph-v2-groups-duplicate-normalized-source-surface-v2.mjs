import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-groups-duplicate-normalized-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves normalized duplicate detection for groups entries";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "function validateGroups(groupsRaw, errors) {",
    "const normalizedWordId = normalizeWordId(wordRaw);",
    "pushDuplicateWhenSeen(errors, seen, normalizedWordId, `${ctx} contains duplicate word id: ${normalizedWordId}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing groups duplicate-normalized validation token: ${token}`,
});

if (text.includes("pushDuplicateWhenSeen(errors, seen, wordRaw")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} group duplicate detection must use normalized word ids (raw token duplicate check detected)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
