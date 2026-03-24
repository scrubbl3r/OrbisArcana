import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { KNOWN_WAKE_WORD_ID_V2, SAMPLE_WAKE_RULE_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "spell-schema-integrity-wake-bare-id-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "spell schema integrity accepts bare wake ids for words[]/spells[] alias and rejects unknown bare refs";

function withMutatedWakeAction(mutateWakeAction) {
  const orchestratorEngine = buildRuleEngineFromOrchestratorV2();
  const compiledRules = cloneJsonV2(Array.isArray(orchestratorEngine?.rules) ? orchestratorEngine.rules : []);
  const targetRule = Array.isArray(compiledRules)
    ? compiledRules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
    : null;
  if (!targetRule || !Array.isArray(targetRule.then)) {
    failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} compiled rule sample`);
  }
  const rules = [targetRule];
  const wakeAction = targetRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
  if (!wakeAction) {
    failCheck(CHECK_TAG, `sample ${ACTION_WAKE_WIN} action missing`);
  }
  mutateWakeAction(wakeAction);
  return rules;
}

const canonicalBareKnownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.words = [KNOWN_WAKE_WORD_ID_V2];
    delete wakeAction.spells;
  }),
});
if (canonicalBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should accept bare canonical wake_win.words[] refs: ${canonicalBareKnownErrors.join(" | ")}`
  );
}

const compatBareKnownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.spells = [KNOWN_WAKE_WORD_ID_V2];
    delete wakeAction.words;
  }),
});
if (compatBareKnownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should accept bare compat wake_win.spells[] refs: ${compatBareKnownErrors.join(" | ")}`
  );
}

const canonicalBareUnknownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.words = [UNKNOWN_WAKE_WORD_ID_V2];
    delete wakeAction.spells;
  }),
});
if (!hasWakeUnknownWordErrorV2(canonicalBareUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must reject unknown bare canonical wake_win.words[] refs: ${canonicalBareUnknownErrors.join(" | ")}`
  );
}

const compatBareUnknownErrors = validateSpellSchemaIntegrity({
  rules: withMutatedWakeAction((wakeAction) => {
    wakeAction.spells = [UNKNOWN_WAKE_WORD_ID_V2];
    delete wakeAction.words;
  }),
});
if (!hasWakeUnknownWordErrorV2(compatBareUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must reject unknown bare compat wake_win.spells[] refs: ${compatBareUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
