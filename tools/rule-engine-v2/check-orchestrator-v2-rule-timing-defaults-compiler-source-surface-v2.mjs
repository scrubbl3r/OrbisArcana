import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-rule-timing-defaults-compiler-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves rule timing fallback to defaults.rule values";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const cooldownMs = finiteAtLeastOrNull(",
    "Object.hasOwn(rule, FIELD_COOLDOWN_MS) ? rule[FIELD_COOLDOWN_MS] : defaultsRule[FIELD_COOLDOWN_MS]",
    "const matchWindowMs = finiteAtLeastOrNull(",
    "Object.hasOwn(rule, FIELD_MATCH_WINDOW_MS) ? rule[FIELD_MATCH_WINDOW_MS] : defaultsRule[FIELD_MATCH_WINDOW_MS]",
    "const priority = finiteOrNull(",
    "Object.hasOwn(rule, FIELD_PRIORITY) ? rule[FIELD_PRIORITY] : defaultsRule[FIELD_PRIORITY]",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing rule timing-defaults compiler token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
