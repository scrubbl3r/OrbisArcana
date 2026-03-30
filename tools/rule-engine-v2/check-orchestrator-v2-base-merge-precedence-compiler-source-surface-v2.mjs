import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-base-merge-precedence-compiler-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves compiled enabled/rules precedence over baseRuleEngine payload";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "return Object.freeze({",
    "...baseRuleEngine,",
    "[FIELD_ENABLED]: orchestratorV2[FIELD_ENABLED] !== ENABLED_FALSE,",
    "[FIELD_RULES]: Object.freeze(rules),",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing base-merge precedence compiler token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
