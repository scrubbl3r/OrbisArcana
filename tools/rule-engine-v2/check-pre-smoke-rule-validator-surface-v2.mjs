import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Enforces that pre-smoke validates orchestrator-compiled rules with validateSpellRules.
const CHECK_TAG = "pre-smoke-rule-validator-surface:v2";
const REL = "tools/rule-engine-v2/pre-smoke-check.mjs";
const PASS_MESSAGE = "pre-smoke runs validateSpellRules against orchestrator-compiled rules";
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "buildRuleEngineFromOrchestratorV2",
    "validateSpellRules",
    "spell-rules validation failed",
  ],
  missingMessage: (token) => `${REL} missing required pre-smoke rule-validator token: ${token}`,
});

if (!text.includes("validateSpellRules(buildRuleEngineFromOrchestratorV2().rules)")) {
  failCheck(
    CHECK_TAG,
    `${REL} must validate compiled spell rules from ORCHESTRATOR_V2 during pre-smoke`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
