import { RULE_ENGINE_POLICY_CONTROL, validateRuleEngineConfig } from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "validate-rule-engine-config-wake-bare-id-contract:v2";
const UNKNOWN_WORD_ID = "__unknown_wake_word__";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasError(errors, token) {
  return (Array.isArray(errors) ? errors : []).some((error) => String(error).includes(token));
}

function withSingleRule(rule) {
  const cfg = clone(RULE_ENGINE_POLICY_CONTROL);
  cfg.rules = [rule];
  return cfg;
}

const canonicalBareKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_bare_known",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", words: ["rota"] }],
}));
if (hasError(canonicalBareKnown, "wake_win references unknown word id: rota")) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig should accept bare canonical wake words[] refs: ${canonicalBareKnown.join(" | ")}`
  );
}

const legacyBareKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_legacy_bare_known",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", spells: ["rota"] }],
}));
if (hasError(legacyBareKnown, "wake_win references unknown word id: rota")) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig should accept bare legacy wake spells[] alias refs: ${legacyBareKnown.join(" | ")}`
  );
}

const canonicalBareUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_bare_unknown",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", words: [UNKNOWN_WORD_ID] }],
}));
if (!hasError(canonicalBareUnknown, `wake_win references unknown word id: ${UNKNOWN_WORD_ID}`)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown bare canonical wake words[] refs: ${canonicalBareUnknown.join(" | ")}`
  );
}

const legacyBareUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_legacy_bare_unknown",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", spells: [UNKNOWN_WORD_ID] }],
}));
if (!hasError(legacyBareUnknown, `wake_win references unknown word id: ${UNKNOWN_WORD_ID}`)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown bare legacy wake spells[] refs: ${legacyBareUnknown.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateRuleEngineConfig accepts bare wake word ids for words[]/spells[] alias and rejects unknown bare ids"
);
