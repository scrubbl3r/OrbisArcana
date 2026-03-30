import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-object-enabled-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves object-trigger enabled propagation with reserved-key filtering";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (argRaw && typeof argRaw === \"object\" && !Array.isArray(argRaw)) {",
    "if (typeof argRaw[FIELD_ENABLED] === \"boolean\") {",
    "out[FIELD_ENABLED] = argRaw[FIELD_ENABLED];",
    "if (RESERVED_TRIGGER_KEYS.has(k)) continue;",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing trigger object-enabled token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
