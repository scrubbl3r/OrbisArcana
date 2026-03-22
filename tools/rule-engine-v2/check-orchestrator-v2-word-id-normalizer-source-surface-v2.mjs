import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-word-id-normalizer-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source keeps normalizeWordId delegated to normalizeSpellId for alias-prefix handling";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "function normalizeWordId(raw) {",
    "return normalizeSpellId(raw);",
    "const id = normalizeWordId(entry.value);",
    "const normalizedWordId = normalizeWordId(rawWord);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing normalizeWordId source token: ${token}`,
});

if (text.includes("return asText(raw).toLowerCase();")) {
  failCheck(
    CHECK_TAG,
    `${VALIDATOR_REL} normalizeWordId must delegate to normalizeSpellId (bare lowercase fallback detected)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
