import {
  buildRulesFromInteractionsV2,
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-schema-integrity-wake-words-precedence-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withMutatedWakeAction(mutateWakeAction) {
  const rules = clone(buildRulesFromInteractionsV2(INTERACTIONS_V2));
  const targetRule = Array.isArray(rules)
    ? rules.find((rule) => rule?.id === "r_rota_yspin_charged")
    : null;
  if (!targetRule || !Array.isArray(targetRule.then)) {
    failCheck(CHECK_TAG, "unable to load r_rota_yspin_charged compiled rule sample");
  }
  const wakeAction = targetRule.then.find((action) => action?.type === "wake_win");
  if (!wakeAction) {
    failCheck(CHECK_TAG, "sample wake_win action missing");
  }
  mutateWakeAction(wakeAction);
  return rules;
}

function hasUnknownWakeWordError(errors = [], wordId = "__unknown_wake_word__") {
  return errors.some((error) => String(error).includes(`wake_win references unknown word id: ${wordId}`));
}

const canonicalWinsErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.words = ["rota"];
    wakeAction.spells = ["__unknown_wake_word__"];
  }),
});
if (hasUnknownWakeWordError(canonicalWinsErrors, "__unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should prefer canonical wake_win.words[] over spells[] alias when both are present: ${canonicalWinsErrors.join(" | ")}`
  );
}

const canonicalUnknownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.words = ["__unknown_wake_word__"];
    wakeAction.spells = ["rota"];
  }),
});
if (!hasUnknownWakeWordError(canonicalUnknownErrors, "__unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must keep validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell schema integrity gives canonical wake_win.words[] precedence over wake_win.spells[] alias when both are present"
);
