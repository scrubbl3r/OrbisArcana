import { INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { SAMPLE_WAKE_RULE_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";
import { hasWakeWindowIdsMissingErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-unknown-word-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const WORD_PREFIX = "word.";
const SPELL_PREFIX = "spell.";
const PASS_MESSAGE = "spell runtime routing rejects unknown wake_win word refs for canonical words[] and legacy spells[] alias input";

function buildSampleWakeActionInput({ useLegacySpellsAlias = false } = {}) {
  const sample = cloneJsonV2(INTERACTIONS_V2);
  const targetRule = Array.isArray(sample?.rules)
    ? sample.rules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
    : null;
  if (!targetRule || !Array.isArray(targetRule?.then)) {
    failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} sample rule`);
  }

  const wakeAction = targetRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
  if (!wakeAction) {
    failCheck(CHECK_TAG, `sample ${ACTION_WAKE_WIN} action missing`);
  }

  if (useLegacySpellsAlias) {
    wakeAction.spells = [`${SPELL_PREFIX}${UNKNOWN_WAKE_WORD_ID_V2}`];
    delete wakeAction.words;
  } else {
    wakeAction.words = [`${WORD_PREFIX}${UNKNOWN_WAKE_WORD_ID_V2}`];
    delete wakeAction.spells;
  }

  return sample;
}

const canonicalUnknownErrors = validateSpellRuntimeRouting(
  buildSampleWakeActionInput({ useLegacySpellsAlias: false })
);
if (!hasWakeWindowIdsMissingErrorV2(canonicalUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown canonical wake_win.words[] refs: ${canonicalUnknownErrors.join(" | ")}`
  );
}

const legacyUnknownErrors = validateSpellRuntimeRouting(
  buildSampleWakeActionInput({ useLegacySpellsAlias: true })
);
if (!hasWakeWindowIdsMissingErrorV2(legacyUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown legacy wake_win.spells[] refs: ${legacyUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
