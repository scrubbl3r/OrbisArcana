import { INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "interactions-authoring-wake-words-surface:v2";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const rules = asArray(INTERACTIONS_V2?.rules);
let sawWakeWin = false;

for (const rule of rules) {
  const ruleId = String(rule?.id || "(missing-id)");
  const actions = asArray(rule?.then);
  for (const action of actions) {
    const actionType = String(action?.type || "").trim().toLowerCase();
    if (actionType !== "wake_win") continue;
    sawWakeWin = true;

    if (!Array.isArray(action?.words) || action.words.length === 0) {
      failCheck(
        CHECK_TAG,
        `rule ${ruleId} wake_win must declare canonical non-empty words[]`
      );
    }
    if (Object.hasOwn(action || {}, "spells")) {
      if (!Array.isArray(action.spells)) {
        failCheck(CHECK_TAG, `rule ${ruleId} wake_win compatibility spells must be an array when present`);
      }
      if (JSON.stringify(action.words) !== JSON.stringify(action.spells)) {
        failCheck(CHECK_TAG, `rule ${ruleId} wake_win words and spells alias must match`);
      }
    }
  }
}

if (!sawWakeWin) {
  failCheck(CHECK_TAG, "INTERACTIONS_V2 authoring must contain at least one wake_win action");
}

reportCheckPass(
  CHECK_TAG,
  "interactions authoring wake_win uses canonical words[] with matching optional spells[] compatibility alias"
);
