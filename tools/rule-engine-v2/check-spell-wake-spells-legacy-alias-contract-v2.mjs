import { buildRulesFromInteractionsV2, INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { SAMPLE_WAKE_RULE_ID_V2 } from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "spell-wake-spells-legacy-alias-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const SPELL_PREFIX = "spell.";
const PASS_MESSAGE = "spell-layer validators accept legacy wake_win.spells[] alias when canonical words[] is absent";

const interactionsSample = cloneJsonV2(INTERACTIONS_V2);
const sampleRule = Array.isArray(interactionsSample?.rules)
  ? interactionsSample.rules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
  : null;
if (!sampleRule || !Array.isArray(sampleRule.then)) {
  failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} sample rule`);
}
const sampleWakeAction = sampleRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
if (!sampleWakeAction || !Array.isArray(sampleWakeAction.words) || !sampleWakeAction.words.length) {
  failCheck(CHECK_TAG, `sample ${ACTION_WAKE_WIN} action missing canonical words[]`);
}
sampleWakeAction.spells = sampleWakeAction.words.map((id) => `${SPELL_PREFIX}${String(id).replace(/^(word|spell)\./, "")}`);
delete sampleWakeAction.words;

const runtimeRoutingErrors = validateSpellRuntimeRouting(interactionsSample);
if (runtimeRoutingErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept legacy wake_win.spells[] when words[] is absent: ${runtimeRoutingErrors.join(" | ")}`
  );
}

const projectedRules = cloneJsonV2(buildRulesFromInteractionsV2(INTERACTIONS_V2));
const projectedRule = Array.isArray(projectedRules)
  ? projectedRules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
  : null;
if (!projectedRule || !Array.isArray(projectedRule.then)) {
  failCheck(CHECK_TAG, `unable to load projected ${SAMPLE_WAKE_RULE_ID_V2} rule`);
}
const projectedWakeAction = projectedRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
if (!projectedWakeAction || !Array.isArray(projectedWakeAction.words) || !projectedWakeAction.words.length) {
  failCheck(CHECK_TAG, `projected ${ACTION_WAKE_WIN} action missing canonical words[]`);
}
projectedWakeAction.spells = projectedWakeAction.words.map((id) => `${SPELL_PREFIX}${String(id).replace(/^(word|spell)\./, "")}`);
delete projectedWakeAction.words;

const schemaErrors = validateSpellSchemaIntegrity({ rules: projectedRules });
const wakeUnknownErrors = schemaErrors.filter((error) => String(error).includes("wake_win references unknown"));
if (wakeUnknownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should accept legacy wake_win.spells[] when words[] is absent: ${wakeUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
