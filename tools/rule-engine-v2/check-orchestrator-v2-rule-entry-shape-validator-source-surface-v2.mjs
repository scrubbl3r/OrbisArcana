import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-rule-entry-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (!isPlainObject(ruleRaw)) {",
    "errors.push(`${ROOT_CONTEXT}.rules[${ruleIndex}] must be an object`);",
    "for (let i = 0; i < cfg.rules.length; i += 1) {",
    "validateRule(cfg.rules[i], i, groups, seenRuleIds, openWindowIds, pendingWindowRefs, errors, warnings);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing rule-entry-shape validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves explicit rules[] entry object-shape validation"
);
