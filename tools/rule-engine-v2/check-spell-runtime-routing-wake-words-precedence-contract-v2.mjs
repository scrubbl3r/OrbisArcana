import { INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { KNOWN_WAKE_WORD_ID_V2, SAMPLE_WAKE_RULE_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";
import { hasWakeWindowIdsMissingErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-words-precedence-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "spell runtime routing gives canonical wake_win.words[] precedence over wake_win.spells[] alias when both are present";

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

const canonicalWinsErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = toBareWakeWords(wakeAction.words);
  wakeAction.words = words;
  wakeAction.spells = [UNKNOWN_WAKE_WORD_ID_V2];
}));
if (canonicalWinsErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should prefer canonical wake_win.words[] over spells[] alias when both are present: ${canonicalWinsErrors.join(" | ")}`
  );
}

const canonicalUnknownErrors = validateSpellRuntimeRouting(withWakeActionMutator((wakeAction) => {
  const words = toBareWakeWords(wakeAction.words);
  wakeAction.words = words.length
    ? words.map((id, index) => (index === 0 ? UNKNOWN_WAKE_WORD_ID_V2 : id))
    : [UNKNOWN_WAKE_WORD_ID_V2];
  wakeAction.spells = [KNOWN_WAKE_WORD_ID_V2];
}));
if (!hasWakeWindowIdsMissingErrorV2(canonicalUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must keep validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
