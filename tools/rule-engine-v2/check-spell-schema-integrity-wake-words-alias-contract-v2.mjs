import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/index.js";
import { validateSpellSchemaIntegrity } from "../../src/content/spells/validate-spell-schema-integrity.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import {
  SAMPLE_WAKE_RULE_ID_V2,
  UNKNOWN_WAKE_WORD_ID_V2,
  UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2,
} from "./wake-test-ids-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "spell-schema-integrity-wake-words-alias-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "spell schema integrity validates canonical wake_win.words[] with optional spells[] alias";

const orchestratorEngine = buildRuleEngineFromOrchestratorV1();
const rules = cloneJsonV2(Array.isArray(orchestratorEngine?.rules) ? orchestratorEngine.rules : []);
const targetRule = Array.isArray(rules)
  ? rules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
  : null;
if (!targetRule || !Array.isArray(targetRule.then)) {
  failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} compiled rule sample`);
}

const wakeAction = targetRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
if (!wakeAction || !Array.isArray(wakeAction.words) || !wakeAction.words.length) {
  failCheck(CHECK_TAG, `sample ${ACTION_WAKE_WIN} action missing canonical words[]`);
}

wakeAction.words = [UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2];
delete wakeAction.spells;

const errors = validateSpellSchemaIntegrity({ rules });
const hasExpected = hasWakeUnknownWordErrorV2(errors, UNKNOWN_WAKE_WORD_ID_V2);
if (!hasExpected) {
  failCheck(
    CHECK_TAG,
    `validateSpellSchemaIntegrity must validate wake_win.words[] when spells[] alias is absent; got: ${errors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
