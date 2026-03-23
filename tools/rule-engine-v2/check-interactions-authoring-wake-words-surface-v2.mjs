import { INTERACTIONS_V2, INTERACTIONS_V2_BOOTSTRAP } from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Enforces canonical wake_win authoring via words[] with optional matching spells[] alias.
const CHECK_TAG = "interactions-authoring-wake-words-surface:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = `interactions authoring ${ACTION_WAKE_WIN} uses canonical words[] with matching optional spells[] compatibility alias`;
const LEGACY_OPTIONAL_PASS_MESSAGE = `interactions authoring ${ACTION_WAKE_WIN} surface is legacy-optional when interactions bootstrap is disabled`;

const interactionsBootstrapEnabled = !!(
  INTERACTIONS_V2_BOOTSTRAP &&
  INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true
);
if (!interactionsBootstrapEnabled) {
  reportCheckPass(CHECK_TAG, LEGACY_OPTIONAL_PASS_MESSAGE);
  process.exit(0);
}

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
    if (actionType !== ACTION_WAKE_WIN) continue;
    sawWakeWin = true;

    if (!Array.isArray(action?.words) || action.words.length === 0) {
      failCheck(
        CHECK_TAG,
        `rule ${ruleId} ${ACTION_WAKE_WIN} must declare canonical non-empty words[]`
      );
    }
    if (Object.hasOwn(action || {}, "spells")) {
      if (!Array.isArray(action.spells)) {
        failCheck(CHECK_TAG, `rule ${ruleId} ${ACTION_WAKE_WIN} compatibility spells must be an array when present`);
      }
      if (JSON.stringify(action.words) !== JSON.stringify(action.spells)) {
        failCheck(CHECK_TAG, `rule ${ruleId} ${ACTION_WAKE_WIN} words and spells alias must match`);
      }
    }
  }
}

if (!sawWakeWin) {
  failCheck(CHECK_TAG, `INTERACTIONS_V2 authoring must contain at least one ${ACTION_WAKE_WIN} action`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
