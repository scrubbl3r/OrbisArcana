import {
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-unknown-word-contract:v2";
const UNKNOWN_WORD_ID = "__unknown_wake_word__";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasWakeUnknownMismatch(errors = [], wordId = UNKNOWN_WORD_ID) {
  const needle = `WAKE_WINDOW_WORD_IDS missing interactions-v2 wake_win word ids: ${wordId}`;
  return errors.some((error) => String(error).includes(needle));
}

function buildSampleWakeActionInput({ useLegacySpellsAlias = false } = {}) {
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

  if (useLegacySpellsAlias) {
    wakeAction.spells = [`spell.${UNKNOWN_WORD_ID}`];
    delete wakeAction.words;
  } else {
    wakeAction.words = [`word.${UNKNOWN_WORD_ID}`];
    delete wakeAction.spells;
  }

  return sample;
}

const canonicalUnknownErrors = validateSpellRuntimeRouting(
  buildSampleWakeActionInput({ useLegacySpellsAlias: false })
);
if (!hasWakeUnknownMismatch(canonicalUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown canonical wake_win.words[] refs: ${canonicalUnknownErrors.join(" | ")}`
  );
}

const legacyUnknownErrors = validateSpellRuntimeRouting(
  buildSampleWakeActionInput({ useLegacySpellsAlias: true })
);
if (!hasWakeUnknownMismatch(legacyUnknownErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown legacy wake_win.spells[] refs: ${legacyUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell runtime routing rejects unknown wake_win word refs for canonical words[] and legacy spells[] alias input"
);
