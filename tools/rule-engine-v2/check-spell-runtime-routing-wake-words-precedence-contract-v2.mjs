import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS } from "../../src/content/spells/spell-runtime-routing.js";
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

function withSyntheticImmediateEventRules(sample) {
  const rules = Array.isArray(sample?.rules) ? sample.rules : [];
  for (const id of Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : []) {
    rules.push({
      id: `r_test_immediate_${id}`,
      on: { all: [{ type: "word", id: `word.${id}` }] },
      then: [{ type: "event", id: "teleport" }],
    });
  }
  return sample;
}

function withWakeActionMutator(mutateWakeAction) {
  const orchestratorEngine = buildRuleEngineFromOrchestratorV2();
  const compiledRules = cloneJsonV2(Array.isArray(orchestratorEngine?.rules) ? orchestratorEngine.rules : []);
  const sample = withSyntheticImmediateEventRules({
    rules: compiledRules,
  });
  const targetRuleSample = Array.isArray(sample?.rules)
    ? sample.rules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
    : null;
  if (!targetRuleSample || !Array.isArray(targetRuleSample?.then)) {
    failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} sample rule`);
  }
  const wakeAction = targetRuleSample.then.find((action) => action?.type === ACTION_WAKE_WIN);
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
