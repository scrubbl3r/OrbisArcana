import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS } from "../../src/content/spells/spell-runtime-routing.js";
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
const PASS_MESSAGE = "spell runtime routing rejects unknown wake_win word refs for canonical words[] and compat spells[] alias input";

function withSyntheticImmediateEventRules(sample) {
  const rules = Array.isArray(sample?.rules) ? sample.rules : [];
  for (const id of Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : []) {
    rules.push({
      id: `r_test_immediate_${id}`,
      on: { all: [{ type: "word", id: `word.${id}` }] },
      then: [{ type: "event", id: "teleport_home" }],
    });
  }
  return sample;
}

function buildSampleWakeActionInput({ useCompatSpellsAlias = false } = {}) {
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

  if (useCompatSpellsAlias) {
    wakeAction.spells = [`${SPELL_PREFIX}${UNKNOWN_WAKE_WORD_ID_V2}`];
    delete wakeAction.words;
  } else {
    wakeAction.words = [`${WORD_PREFIX}${UNKNOWN_WAKE_WORD_ID_V2}`];
    delete wakeAction.spells;
  }

  return sample;
}

const canonicalUnknownErrors = validateSpellRuntimeRouting(
  buildSampleWakeActionInput({ useCompatSpellsAlias: false })
);
if (!hasWakeWindowIdsMissingErrorV2(canonicalUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown canonical wake_win.words[] refs: ${canonicalUnknownErrors.join(" | ")}`
  );
}

const compatUnknownErrors = validateSpellRuntimeRouting(
  buildSampleWakeActionInput({ useCompatSpellsAlias: true })
);
if (!hasWakeWindowIdsMissingErrorV2(compatUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting must reject unknown compat wake_win.spells[] refs: ${compatUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
