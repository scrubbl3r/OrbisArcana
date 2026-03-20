import {
  buildRulesFromInteractionsV2,
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { validateSpellRuntimeRouting } from "../../src/content/spells/validate-spell-runtime-routing.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "spell-wake-spells-legacy-alias-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const interactionsSample = clone(INTERACTIONS_V2);
const sampleRule = Array.isArray(interactionsSample?.rules)
  ? interactionsSample.rules.find((rule) => rule?.id === "r_rota_yspin_charged")
  : null;
if (!sampleRule || !Array.isArray(sampleRule.then)) {
  failCheck(CHECK_TAG, "unable to load r_rota_yspin_charged sample rule");
}
const sampleWakeAction = sampleRule.then.find((action) => action?.type === "wake_win");
if (!sampleWakeAction || !Array.isArray(sampleWakeAction.words) || !sampleWakeAction.words.length) {
  failCheck(CHECK_TAG, "sample wake_win action missing canonical words[]");
}
sampleWakeAction.spells = sampleWakeAction.words.map((id) => `spell.${String(id).replace(/^(word|spell)\./, "")}`);
delete sampleWakeAction.words;

const runtimeRoutingErrors = validateSpellRuntimeRouting(interactionsSample);
if (runtimeRoutingErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellRuntimeRouting should accept legacy wake_win.spells[] when words[] is absent: ${runtimeRoutingErrors.join(" | ")}`
  );
}

const projectedRules = clone(buildRulesFromInteractionsV2(INTERACTIONS_V2));
const projectedRule = Array.isArray(projectedRules)
  ? projectedRules.find((rule) => rule?.id === "r_rota_yspin_charged")
  : null;
if (!projectedRule || !Array.isArray(projectedRule.then)) {
  failCheck(CHECK_TAG, "unable to load projected r_rota_yspin_charged rule");
}
const projectedWakeAction = projectedRule.then.find((action) => action?.type === "wake_win");
if (!projectedWakeAction || !Array.isArray(projectedWakeAction.words) || !projectedWakeAction.words.length) {
  failCheck(CHECK_TAG, "projected wake_win action missing canonical words[]");
}
projectedWakeAction.spells = projectedWakeAction.words.map((id) => `spell.${String(id).replace(/^(word|spell)\./, "")}`);
delete projectedWakeAction.words;

const schemaErrors = validateSpellSchemaIntegrity({ rules: projectedRules });
const wakeUnknownErrors = schemaErrors.filter((error) => String(error).includes("wake_win references unknown"));
if (wakeUnknownErrors.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity should accept legacy wake_win.spells[] when words[] is absent: ${wakeUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "spell-layer validators accept legacy wake_win.spells[] alias when canonical words[] is absent"
);
