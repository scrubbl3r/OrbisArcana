import { INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { SAMPLE_WAKE_RULE_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";
import { hasWakeWindowIdsMissingErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-bare-id-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "spell runtime routing accepts bare wake ids for words[]/spells[] alias and rejects unknown bare refs";

function toBareWakeWords(input) {
  return (Array.isArray(input) ? input : []).map((id) => String(id).replace(/^(word|spell)\./, ""));
}

function withWakeActionMutator(mutateWakeAction) {
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
  mutateWakeAction(wakeAction);
  return sample;
}

const canonicalBareKnownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  wakeAction.words = toBareWakeWords(wakeAction.words);
  delete wakeAction.spells;
}));
if (canonicalBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept bare canonical wake_win.words[] refs: ${canonicalBareKnownErrors.join(" | ")}`
  );
}

const legacyBareKnownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = toBareWakeWords(wakeAction.words);
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
  const words = toBareWakeWords(wakeAction.words);
  wakeAction.words = words.length
    ? words.map((id, index) => (index === 0 ? UNKNOWN_WAKE_WORD_ID_V2 : id))
    : [UNKNOWN_WAKE_WORD_ID_V2];
  delete wakeAction.spells;
}));
if (!hasWakeWindowIdsMissingErrorV2(canonicalBareUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown bare canonical wake_win.words[] refs: ${canonicalBareUnknownErrors.join(" | ")}`
  );
}

const legacyBareUnknownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = toBareWakeWords(wakeAction.words);
  wakeAction.spells = words.length
    ? words.map((id, index) => (index === 0 ? UNKNOWN_WAKE_WORD_ID_V2 : id))
    : [UNKNOWN_WAKE_WORD_ID_V2];
  delete wakeAction.words;
}));
if (!hasWakeWindowIdsMissingErrorV2(legacyBareUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown bare legacy wake_win.spells[] refs: ${legacyBareUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
