import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-top-level-enabled-compiler-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE =
  "compiled-interaction-graph builder source preserves top-level enabled mapping into compiled rule-engine payload";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const ENABLED_FALSE = false;",
    "[FIELD_ENABLED]: compiledInteractionGraphV2[FIELD_ENABLED] !== ENABLED_FALSE,",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing top-level enabled compiler token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
