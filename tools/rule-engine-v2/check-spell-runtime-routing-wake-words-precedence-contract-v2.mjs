import {
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-words-precedence-contract:v2";
const UNKNOWN_WORD_ID = "__unknown_wake_word__";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withWakeActionMutator(mutateWakeAction) {
  const sample = clone(INTERACTIONS_V2);
  const targetRule = Array.isArray(sample?.rules)
    ? sample.rules.find((rule) => rule?.id === "r_rota_yspin_charged")
    : null;
  if (!targetRule || !Array.isArray(targetRule?.then)) {
    failCheck(CHECK_TAG, "unable to load r_rota_yspin_charged sample rule");
  }
  const wakeAction = targetRule.then.find((action) => action?.type === "wake_win");
  if (!wakeAction) {
    failCheck(CHECK_TAG, "sample wake_win action missing");
  }
  mutateWakeAction(wakeAction);
  return sample;
}

function hasWakeUnknownMismatch(errors = [], wordId = UNKNOWN_WORD_ID) {
  const needle = `WAKE_WINDOW_WORD_IDS missing interactions-v2 wake_win word ids: ${wordId}`;
  return errors.some((error) => String(error).includes(needle));
}

const canonicalWinsErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = (Array.isArray(wakeAction.words) ? wakeAction.words : [])
    .map((id) => String(id).replace(/^(word|spell)\./, ""));
  wakeAction.words = words;
  wakeAction.spells = [UNKNOWN_WORD_ID];
}));
if (canonicalWinsErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should prefer canonical wake_win.words[] over spells[] alias when both are present: ${canonicalWinsErrors.join(" | ")}`
  );
}

const canonicalUnknownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = (Array.isArray(wakeAction.words) ? wakeAction.words : [])
    .map((id) => String(id).replace(/^(word|spell)\./, ""));
  wakeAction.words = words.length
    ? words.map((id, index) => (index === 0 ? UNKNOWN_WORD_ID : id))
    : [UNKNOWN_WORD_ID];
  wakeAction.spells = ["rota"];
}));
if (!hasWakeUnknownMismatch(canonicalUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must keep validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell runtime routing gives canonical wake_win.words[] precedence over wake_win.spells[] alias when both are present"
);
