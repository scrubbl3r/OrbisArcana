import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "validate-rule-engine-config-wake-source-surface:v2";
const REL = "src/content/spell-rules/validate-rule-engine-config.js";
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "import { validateSpellRules } from \"./validate-spell-rules.js\";",
    "const ruleErrors = validateSpellRules(rules, { signals, windows, events });",
    "errors.push(...ruleErrors);",
  ],
  missingMessage: (token) => `${REL} missing required rule-validation token: ${token}`,
});

if (!text.includes("validateSpellRules(rules, { signals, windows, events })")) {
  failCheck(
    CHECK_TAG,
    `${REL} must delegate rule-level wake validation via validateSpellRules(rules, { signals, windows, events })`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateRuleEngineConfig source delegates wake-word rule validation through validateSpellRules"
);
