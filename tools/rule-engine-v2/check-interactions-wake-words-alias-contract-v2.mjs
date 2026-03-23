import {
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  buildRulesFromInteractionsV2,
  validateInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { SAMPLE_WAKE_RULE_ID_V2 } from "./wake-test-ids-v2.mjs";

// Confirms wake_win authoring accepts words[] and emits matching spells[] compatibility alias.
const CHECK_TAG = "interactions-wake-words-alias-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const WORD_PREFIX = "word.";
const SPELL_PREFIX_PATTERN = /^spell\./;
const PASS_MESSAGE = "interactions wake_win supports canonical words[] input and emits matching spells[] compatibility alias";
const LEGACY_OPTIONAL_PASS_MESSAGE = "interactions wake-word alias contract is legacy-optional when interactions bootstrap is disabled";

const interactionsBootstrapEnabled = !!(
  INTERACTIONS_V2_BOOTSTRAP &&
  INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true
);
if (!interactionsBootstrapEnabled) {
  reportCheckPass(CHECK_TAG, LEGACY_OPTIONAL_PASS_MESSAGE);
  process.exit(0);
}

const sample = cloneJsonV2(INTERACTIONS_V2);
const targetRule = Array.isArray(sample?.rules)
  ? sample.rules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
  : null;
if (!targetRule || !Array.isArray(targetRule.then)) {
  failCheck(CHECK_TAG, `unable to load ${SAMPLE_WAKE_RULE_ID_V2} sample rule`);
}

const wakeAction = targetRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
if (!wakeAction) {
  failCheck(CHECK_TAG, `sample rule missing ${ACTION_WAKE_WIN} action`);
}

const wakeWords = Array.isArray(wakeAction.words) ? wakeAction.words.slice() : [];
if (!wakeWords.length) {
  failCheck(CHECK_TAG, `sample ${ACTION_WAKE_WIN} action missing canonical words[]`);
}

delete wakeAction.spells;
wakeAction.words = wakeWords.map((wordId, index) => {
  if (index !== 0) return wordId;
  return String(wordId).startsWith(WORD_PREFIX)
    ? wordId
    : `${WORD_PREFIX}${String(wordId).replace(SPELL_PREFIX_PATTERN, "")}`;
});

const validation = validateInteractionsV2(sample);
if (!validation?.ok) {
  failCheck(CHECK_TAG, `validateInteractionsV2 should accept ${ACTION_WAKE_WIN}.words alias input: ${(validation?.errors || []).join(" | ")}`);
}

const compiledRules = buildRulesFromInteractionsV2(sample);
const compiledTargetRule = Array.isArray(compiledRules)
  ? compiledRules.find((rule) => rule?.id === SAMPLE_WAKE_RULE_ID_V2)
  : null;
if (!compiledTargetRule || !Array.isArray(compiledTargetRule.then)) {
  failCheck(CHECK_TAG, `compiled rules missing ${SAMPLE_WAKE_RULE_ID_V2}`);
}

const compiledWakeAction = compiledTargetRule.then.find((action) => action?.type === ACTION_WAKE_WIN);
if (!compiledWakeAction) {
  failCheck(CHECK_TAG, `compiled rule missing ${ACTION_WAKE_WIN} action`);
}

if (!Array.isArray(compiledWakeAction.spells) || !compiledWakeAction.spells.length) {
  failCheck(CHECK_TAG, `compiled ${ACTION_WAKE_WIN} action must include compatibility spells[]`);
}
if (!Array.isArray(compiledWakeAction.words) || !compiledWakeAction.words.length) {
  failCheck(CHECK_TAG, `compiled ${ACTION_WAKE_WIN} action must include canonical words[]`);
}
if (JSON.stringify(compiledWakeAction.words) !== JSON.stringify(compiledWakeAction.spells)) {
  failCheck(CHECK_TAG, `compiled ${ACTION_WAKE_WIN} words[] and spells[] must match`);
}
const expectedFirst = String(wakeWords[0] || "").replace(SPELL_PREFIX_PATTERN, "");
if (compiledWakeAction.spells[0] !== expectedFirst) {
  failCheck(CHECK_TAG, `compiled ${ACTION_WAKE_WIN} first word should normalize word.* prefix to bare id`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
