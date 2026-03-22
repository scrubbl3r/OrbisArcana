import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-defaults-merge-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves trigger defaults merge with explicit boolean/object enabled overrides";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof triggerRaw === \"string\" || Array.isArray(triggerRaw)) {",
    "...asObj(defaultsTriggerByEvent[eventId]),",
    "if (typeof argRaw === \"boolean\") {",
    "if (argRaw === false) out[FIELD_ENABLED] = false;",
    "if (typeof argRaw[FIELD_ENABLED] === \"boolean\") {",
    "out[FIELD_ENABLED] = argRaw[FIELD_ENABLED];",
    "if (RESERVED_TRIGGER_KEYS.has(k)) continue;",
    "out[k] = v;",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing trigger defaults-merge token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
