import {
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-bare-id-contract:v2";
const UNKNOWN_WORD_ID = "__unknown_wake_word__";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasWakeUnknownMismatch(errors = [], wordId = UNKNOWN_WORD_ID) {
  const needle = `WAKE_WINDOW_WORD_IDS missing interactions-v2 wake_win word ids: ${wordId}`;
  return errors.some((error) => String(error).includes(needle));
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

const canonicalBareKnownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  wakeAction.words = (Array.isArray(wakeAction.words) ? wakeAction.words : [])
    .map((id) => String(id).replace(/^(word|spell)\./, ""));
  delete wakeAction.spells;
}));
if (canonicalBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept bare canonical wake_win.words[] refs: ${canonicalBareKnownErrors.join(" | ")}`
  );
}

const legacyBareKnownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = (Array.isArray(wakeAction.words) ? wakeAction.words : [])
    .map((id) => String(id).replace(/^(word|spell)\./, ""));
  wakeAction.spells = words;
  delete wakeAction.words;
}));
if (legacyBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept bare legacy wake_win.spells[] refs: ${legacyBareKnownErrors.join(" | ")}`
  );
}

const canonicalBareUnknownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = (Array.isArray(wakeAction.words) ? wakeAction.words : [])
    .map((id) => String(id).replace(/^(word|spell)\./, ""));
  wakeAction.words = words.length
    ? words.map((id, index) => (index === 0 ? UNKNOWN_WORD_ID : id))
    : [UNKNOWN_WORD_ID];
  delete wakeAction.spells;
}));
if (!hasWakeUnknownMismatch(canonicalBareUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown bare canonical wake_win.words[] refs: ${canonicalBareUnknownErrors.join(" | ")}`
  );
}

const legacyBareUnknownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = (Array.isArray(wakeAction.words) ? wakeAction.words : [])
    .map((id) => String(id).replace(/^(word|spell)\./, ""));
  wakeAction.spells = words.length
    ? words.map((id, index) => (index === 0 ? UNKNOWN_WORD_ID : id))
    : [UNKNOWN_WORD_ID];
  delete wakeAction.words;
}));
if (!hasWakeUnknownMismatch(legacyBareUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown bare legacy wake_win.spells[] refs: ${legacyBareUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell runtime routing accepts bare wake ids for words[]/spells[] alias and rejects unknown bare refs"
);
