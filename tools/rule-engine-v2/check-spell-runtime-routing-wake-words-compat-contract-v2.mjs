import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS } from "../../src/content/spells/spell-runtime-routing.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { SAMPLE_WAKE_RULE_ID_V2 } from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "spell-runtime-routing-wake-words-compat-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const WORD_PREFIX = "word.";
const PASS_MESSAGE = "spell runtime routing validator accepts canonical wake_win.words[] input with optional spells[] alias";

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

const orchestratorEngine = buildRuleEngineFromOrchestratorV2();
const compiledRules = cloneJsonV2(Array.isArray(orchestratorEngine?.rules) ? orchestratorEngine.rules : []);
const sample = withSyntheticImmediateEventRules({
  rules: compiledRules,
});
const targetRule = Array.isArray(sample?.rules)
  ? sample.rules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
  : null;
if (!targetRule || !Array.isArray(targetRule?.then)) {
  failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} sample rule`);
}

const wakeAction = targetRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
if (!wakeAction || !Array.isArray(wakeAction.words) || !wakeAction.words.length) {
  failCheck(CHECK_TAG, `sample ${ACTION_WAKE_WIN} action missing canonical words[]`);
}

wakeAction.words = wakeAction.words.map((id, index) => (
  index === 0 ? `${WORD_PREFIX}${String(id).replace(/^(word|spell)\./, "")}` : id
));
delete wakeAction.spells;

const errors = validateSpellRuntimeRouting(sample);
if (errors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept wake_win words[] without spells[] alias: ${errors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
