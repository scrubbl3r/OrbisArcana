import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-on-duplicate-normalized-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves normalized duplicate detection for on.word selectors";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const id = normalizeWordId(entry.value);",
    "const dedupeKey = `word:${id}`;",
    "pushDuplicateWhenSeen(errors, seen, dedupeKey, `rule ${ruleId} contains duplicate on selector: ${dedupeKey}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on selector duplicate-normalized validation token: ${token}`,
});

if (text.includes("const dedupeKey = `word:${entry.value}`;")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} on selector duplicate detection must use normalized word ids (raw value dedupe detected)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
