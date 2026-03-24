import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-on-spell-compat-compiler-source-surface:v2";
const COMPILER_REL = "src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 compiler source preserves on.word precedence with on.spell fallback to canonical word selectors";

const text = readRelativeText(COMPILER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const wordRefsRaw = Object.hasOwn(on, \"word\") ? on.word : on.spell;",
    "for (const rawWord of parseStringOrArray(wordRefsRaw)) {",
    "conditions.push(Object.freeze({ type: \"word\", id }));",
  ],
  missingMessage: (token) => `${COMPILER_REL} missing on.spell compat compiler token: ${token}`,
});

if (text.includes("type: \"spell\"")) {
  failCheck(
    CHECK_TAG,
    `${COMPILER_REL} must compile on.spell alias to canonical type: \"word\" (found type: \"spell\")`
  );
}
if (text.includes("for (const rawWordAlias of parseStringOrArray(on.spell)) {")) {
  failCheck(
    CHECK_TAG,
    `${COMPILER_REL} must not merge on.spell selectors when on.word is present (legacy on.spell loop detected)`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
