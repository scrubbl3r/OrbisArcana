import {
  buildRulesFromInteractionsV2,
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-schema-integrity-wake-words-alias-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const rules = clone(buildRulesFromInteractionsV2(INTERACTIONS_V2));
const targetRule = Array.isArray(rules)
  ? rules.find((rule) => rule?.id === "r_rota_yspin_charged")
  : null;
if (!targetRule || !Array.isArray(targetRule.then)) {
  failCheck(CHECK_TAG, "unable to load r_rota_yspin_charged compiled rule sample");
}

const wakeAction = targetRule.then.find((action) => action?.type === "wake_win");
if (!wakeAction || !Array.isArray(wakeAction.words) || !wakeAction.words.length) {
  failCheck(CHECK_TAG, "sample wake_win action missing canonical words[]");
}

wakeAction.words = ["word.__unknown_wake_word__"];
delete wakeAction.spells;

const errors = validateSpellSchemaIntegrity({ rules });
const hasExpected = errors.some((error) =>
  String(error).includes("wake_win references unknown word id: __unknown_wake_word__")
);
if (!hasExpected) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must validate wake_win.words[] when spells[] alias is absent; got: ${errors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell schema integrity validates canonical wake_win.words[] with optional spells[] alias"
);
