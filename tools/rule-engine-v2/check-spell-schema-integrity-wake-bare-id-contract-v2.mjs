import {
  buildRulesFromInteractionsV2,
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-schema-integrity-wake-bare-id-contract:v2";
const UNKNOWN_WORD_ID = "__unknown_wake_word__";

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

function hasUnknownWakeWordError(errors = [], wordId = UNKNOWN_WORD_ID) {
  return errors.some((error) => String(error).includes(`wake_win references unknown word id: ${wordId}`));
}

const canonicalBareKnownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.words = ["rota"];
    delete wakeAction.spells;
  }),
});
if (canonicalBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should accept bare canonical wake_win.words[] refs: ${canonicalBareKnownErrors.join(" | ")}`
  );
}

const legacyBareKnownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.spells = ["rota"];
    delete wakeAction.words;
  }),
});
if (legacyBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should accept bare legacy wake_win.spells[] refs: ${legacyBareKnownErrors.join(" | ")}`
  );
}

const canonicalBareUnknownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.words = [UNKNOWN_WORD_ID];
    delete wakeAction.spells;
  }),
});
if (!hasUnknownWakeWordError(canonicalBareUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must reject unknown bare canonical wake_win.words[] refs: ${canonicalBareUnknownErrors.join(" | ")}`
  );
}

const legacyBareUnknownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.spells = [UNKNOWN_WORD_ID];
    delete wakeAction.words;
  }),
});
if (!hasUnknownWakeWordError(legacyBareUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must reject unknown bare legacy wake_win.spells[] refs: ${legacyBareUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell schema integrity accepts bare wake ids for words[]/spells[] alias and rejects unknown bare refs"
);
