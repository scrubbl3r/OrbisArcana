import {
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-words-alias-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const sample = clone(INTERACTIONS_V2);
const targetRule = Array.isArray(sample?.rules)
  ? sample.rules.find((rule) => rule?.id === "r_rota_yspin_charged")
  : null;
if (!targetRule || !Array.isArray(targetRule?.then)) {
  failCheck(CHECK_TAG, "unable to load r_rota_yspin_charged sample rule");
}

const wakeAction = targetRule.then.find((action) => action?.type === "wake_win");
if (!wakeAction || !Array.isArray(wakeAction.words) || !wakeAction.words.length) {
  failCheck(CHECK_TAG, "sample wake_win action missing canonical words[]");
}

wakeAction.words = wakeAction.words.map((id, index) => (
  index === 0 ? `word.${String(id).replace(/^(word|spell)\./, "")}` : id
));
delete wakeAction.spells;

const errors = validateSpellRuntimeRouting(sample);
if (errors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept wake_win words[] without spells[] alias: ${errors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell runtime routing validator accepts canonical wake_win.words[] input with optional spells[] alias"
);
