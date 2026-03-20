import { RULE_ENGINE_POLICY_CONTROL, validateRuleEngineConfig } from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "validate-rule-engine-config-wake-words-contract:v2";

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

const canonicalKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_known",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", words: ["word.rota"] }],
}));
if (hasError(canonicalKnown, "wake_win references unknown word id: rota")) {
  failCheck(CHECK_TAG, `validateRuleEngineConfig should accept canonical known wake words[] refs: ${canonicalKnown.join(" | ")}`);
}

const legacyKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_legacy_known",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", spells: ["spell.rota"] }],
}));
if (hasError(legacyKnown, "wake_win references unknown word id: rota")) {
  failCheck(CHECK_TAG, `validateRuleEngineConfig should accept legacy known wake spells[] alias refs: ${legacyKnown.join(" | ")}`);
}

const canonicalUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_unknown",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", words: ["word.__unknown_wake_word__"] }],
}));
if (!hasError(canonicalUnknown, "wake_win references unknown word id: __unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown canonical wake words[] refs: ${canonicalUnknown.join(" | ")}`
  );
}

const legacyUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_legacy_unknown",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", spells: ["spell.__unknown_wake_word__"] }],
}));
if (!hasError(legacyUnknown, "wake_win references unknown word id: __unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown legacy wake spells[] refs: ${legacyUnknown.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateRuleEngineConfig enforces wake_win word refs for canonical words[] and legacy spells[] alias"
);
