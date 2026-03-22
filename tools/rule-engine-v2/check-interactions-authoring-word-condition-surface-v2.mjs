import { INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Enforces canonical authoring condition type `word` (legacy `spell` is compatibility-only).
const CHECK_TAG = "interactions-authoring-word-condition-surface:v2";
const PASS_MESSAGE = "interactions authoring uses canonical word condition type (spell remains compatibility alias only)";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const rules = asArray(INTERACTIONS_V2?.rules);
if (!rules.length) {
  failCheck(CHECK_TAG, "INTERACTIONS_V2.rules must contain at least one rule");
}

let sawWordCondition = false;
for (const rule of rules) {
  const ruleId = String(rule?.id || "(missing-id)");
  const conditions = asArray(rule?.on?.all);
  for (const condition of conditions) {
    const conditionType = String(condition?.type || "").trim().toLowerCase();
    if (!conditionType) continue;
    if (conditionType === "word") {
      sawWordCondition = true;
      continue;
    }
    if (conditionType === "spell") {
      failCheck(
        CHECK_TAG,
        `rule ${ruleId} uses legacy condition type spell; prefer canonical word`
      );
    }
  }
}

if (!sawWordCondition) {
  failCheck(CHECK_TAG, "INTERACTIONS_V2 authoring must include canonical word conditions");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
