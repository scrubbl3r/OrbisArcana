import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-groups-normalization-compiler-source-surface:v2";
const COMPILER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 compiler source preserves normalizeSpellId-based @group expansion for wake words";

const text = readRelativeText(COMPILER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "function parseWordRefs(rawWords, groups) {",
    "const groupWords = asArray(asObj(groups)[groupName]);",
    "const normalized = normalizeSpellId(groupWord);",
    "if (normalized) out.push(normalized);",
  ],
  missingMessage: (token) => `${COMPILER_REL} missing group normalization compiler token: ${token}`,
});

if (text.includes("out.push(asText(groupWord).toLowerCase())")) {
  failCheck(
    CHECK_TAG,
    `${COMPILER_REL} group expansion must normalize via normalizeSpellId (raw lowercase fallback detected)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
