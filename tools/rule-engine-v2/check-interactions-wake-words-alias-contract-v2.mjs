import {
  INTERACTIONS_V2,
  buildRulesFromInteractionsV2,
  validateInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "interactions-wake-words-alias-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const sample = clone(INTERACTIONS_V2);
const targetRule = Array.isArray(sample?.rules)
  ? sample.rules.find((rule) => rule?.id === "r_rota_yspin_charged")
  : null;
if (!targetRule || !Array.isArray(targetRule.then)) {
  failCheck(CHECK_TAG, "unable to load r_rota_yspin_charged sample rule");
}

const wakeAction = targetRule.then.find((action) => action?.type === "wake_win");
if (!wakeAction) {
  failCheck(CHECK_TAG, "sample rule missing wake_win action");
}

const wakeWords = Array.isArray(wakeAction.words) ? wakeAction.words.slice() : [];
if (!wakeWords.length) {
  failCheck(CHECK_TAG, "sample wake_win action missing canonical words[]");
}

delete wakeAction.spells;
wakeAction.words = wakeWords.map((wordId, index) => {
  if (index !== 0) return wordId;
  return String(wordId).startsWith("word.") ? wordId : `word.${String(wordId).replace(/^spell\./, "")}`;
});

const validation = validateInteractionsV2(sample);
if (!validation?.ok) {
  failCheck(CHECK_TAG, `validateInteractionsV2 should accept wake_win.words alias input: ${(validation?.errors || []).join(" | ")}`);
}

const compiledRules = buildRulesFromInteractionsV2(sample);
const compiledTargetRule = Array.isArray(compiledRules)
  ? compiledRules.find((rule) => rule?.id === "r_rota_yspin_charged")
  : null;
if (!compiledTargetRule || !Array.isArray(compiledTargetRule.then)) {
  failCheck(CHECK_TAG, "compiled rules missing r_rota_yspin_charged");
}

const compiledWakeAction = compiledTargetRule.then.find((action) => action?.type === "wake_win");
if (!compiledWakeAction) {
  failCheck(CHECK_TAG, "compiled rule missing wake_win action");
}

if (!Array.isArray(compiledWakeAction.spells) || !compiledWakeAction.spells.length) {
  failCheck(CHECK_TAG, "compiled wake_win action must include compatibility spells[]");
}
if (!Array.isArray(compiledWakeAction.words) || !compiledWakeAction.words.length) {
  failCheck(CHECK_TAG, "compiled wake_win action must include canonical words[]");
}
if (JSON.stringify(compiledWakeAction.words) !== JSON.stringify(compiledWakeAction.spells)) {
  failCheck(CHECK_TAG, "compiled wake_win words[] and spells[] must match");
}
const expectedFirst = String(wakeWords[0] || "").replace(/^spell\./, "");
if (compiledWakeAction.spells[0] !== expectedFirst) {
  failCheck(CHECK_TAG, "compiled wake_win first word should normalize word.* prefix to bare id");
}

reportCheckPass(
  CHECK_TAG,
  "interactions wake_win supports canonical words[] input and emits matching spells[] compatibility alias"
);
