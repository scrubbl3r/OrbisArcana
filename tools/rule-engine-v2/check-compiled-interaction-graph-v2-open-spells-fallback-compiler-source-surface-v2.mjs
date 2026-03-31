import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-open-spells-fallback-compiler-source-surface:v2";
const COMPILER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 compiler source preserves open.spells fallback with mirrored canonical words/spells output";

const text = readRelativeText(COMPILER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const wordsRaw = Object.hasOwn(open, FIELD_WORDS) ? open[FIELD_WORDS] : open[FIELD_SPELLS];",
    "const words = parseWordRefs(wordsRaw, groups);",
    "[FIELD_WORDS]: words,",
    "[FIELD_SPELLS]: words,",
  ],
  missingMessage: (token) => `${COMPILER_REL} missing open.spells fallback compiler token: ${token}`,
});

if (text.includes("[FIELD_SPELLS]: parseWordRefs(open[FIELD_SPELLS], groups)")) {
  failCheck(
    CHECK_TAG,
    `${COMPILER_REL} must mirror compatibility spells[] from canonical normalized words[]`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
