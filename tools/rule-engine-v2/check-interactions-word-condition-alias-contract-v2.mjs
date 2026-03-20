import {
  INTERACTIONS_V2,
  buildRulesFromInteractionsV2,
  collectImmediateEventWordIdsFromInteractionsV2,
  validateInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "interactions-word-condition-alias-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const sample = clone(INTERACTIONS_V2);
const targetRule = Array.isArray(sample?.rules)
  ? sample.rules.find((rule) => rule?.id === "r_pyro_immediate")
  : null;
if (!targetRule || !Array.isArray(targetRule?.on?.all)) {
  failCheck(CHECK_TAG, "unable to load r_pyro_immediate sample rule");
}

const targetCondition = targetRule.on.all[0];
if (!targetCondition) {
  failCheck(CHECK_TAG, "sample rule missing first condition");
}
targetCondition.type = "word";
targetCondition.id = "word.pyro";

const validation = validateInteractionsV2(sample);
if (!validation?.ok) {
  failCheck(
    CHECK_TAG,
    `validateInteractionsV2 should accept word condition alias input: ${(validation?.errors || []).join(" | ")}`
  );
}

const compiledRules = buildRulesFromInteractionsV2(sample);
const compiledTargetRule = Array.isArray(compiledRules)
  ? compiledRules.find((rule) => rule?.id === "r_pyro_immediate")
  : null;
if (!compiledTargetRule || !Array.isArray(compiledTargetRule.on)) {
  failCheck(CHECK_TAG, "compiled rules missing r_pyro_immediate");
}

const compiledCondition = compiledTargetRule.on[0];
if (!compiledCondition) {
  failCheck(CHECK_TAG, "compiled rule missing first condition");
}
if (compiledCondition.type !== "spell") {
  failCheck(CHECK_TAG, "compiled word condition alias must normalize to runtime spell type");
}
if (compiledCondition.id !== "pyro") {
  failCheck(CHECK_TAG, "compiled word condition alias must normalize word.pyro to bare id");
}

const immediateWordIds = collectImmediateEventWordIdsFromInteractionsV2(sample);
if (!Array.isArray(immediateWordIds) || !immediateWordIds.includes("pyro")) {
  failCheck(CHECK_TAG, "immediate event word-id collector must include aliased word condition");
}

reportCheckPass(
  CHECK_TAG,
  "interactions condition type supports canonical word alias and compiles to runtime spell semantics"
);
