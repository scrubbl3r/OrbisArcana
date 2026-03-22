import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-compiler:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "orchestrator compiler contract holds for ON/OPEN/TRIGGER + defaults";

function asJson(v) {
  return JSON.stringify(v);
}

function pushJsonMismatch(details, label, actual, expected) {
  if (asJson(actual) !== asJson(expected)) {
    details.push(`${label} mismatch: got ${asJson(actual)} expected ${asJson(expected)}`);
  }
}

function failJsonMismatch(message, actual, expected) {
  if (asJson(actual) !== asJson(expected)) {
    failCheckWithDetails(CHECK_TAG, message, [`got ${asJson(actual)} expected ${asJson(expected)}`]);
  }
}

const BASE_RULE_ENGINE = Object.freeze({
  version: "2",
  signals: [],
  windows: [],
  events: [],
  rules: [],
  eventRuntimeBindings: {},
});

function buildOrFail(orchestratorV1, failureContext) {
  try {
    return buildRuleEngineFromOrchestratorV1({
      orchestratorV1,
      baseRuleEngine: BASE_RULE_ENGINE,
    });
  } catch (err) {
    const message =
      err instanceof Error && typeof err.message === "string" && err.message
        ? err.message
        : "unknown error";
    failCheck(CHECK_TAG, `builder threw for ${failureContext}: ${message}`);
  }
}

function requireFirstCompiledRule(buildResult, failureMessage) {
  const [rule] = Array.isArray(buildResult?.rules) ? buildResult.rules : [];
  if (!rule) {
    failCheck(CHECK_TAG, failureMessage);
  }
  return rule;
}

function requireRuleById(rules, ruleId, failureMessage) {
  const match = Array.isArray(rules)
    ? rules.find((rule) => rule?.id === ruleId)
    : null;
  if (!match) {
    failCheck(CHECK_TAG, failureMessage);
  }
  return match;
}

const sample = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 1750 }),
    trigger: Object.freeze({
      grace: Object.freeze({ ms: 625 }),
    }),
    rule: Object.freeze({
      cooldownMs: 222,
      matchWindowMs: 1999,
      priority: 7,
    }),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_contract_sample",
      on: Object.freeze(["rota", "y_spin", "orb_state:charged"]),
      open: "sanctum, vectus",
      trigger: Object.freeze({
        grace: Object.freeze({ args: Object.freeze({ ms: 700 }), mode: "boost" }),
        aoe_electric: true,
      }),
      priority: 42,
    }),
  ]),
});

const built = buildOrFail(sample, "valid sample");

if (!built || typeof built !== "object") {
  failCheck(CHECK_TAG, "builder returned non-object");
}
if (built.enabled !== true) {
  failCheck(CHECK_TAG, "builder did not preserve top-level enabled=true");
}
if (!Array.isArray(built.rules) || built.rules.length !== 1) {
  failCheck(CHECK_TAG, "builder did not produce exactly one compiled rule");
}

const [rule] = built.rules;
const details = [];
if (rule.id !== "o_contract_sample") details.push(`rule id mismatch: ${rule.id}`);
if (rule.priority !== 42) details.push(`rule priority mismatch: ${rule.priority}`);
if (rule.cooldownMs !== 222) details.push(`rule cooldownMs mismatch: ${rule.cooldownMs}`);
if (rule.matchWindowMs !== 1999) details.push(`rule matchWindowMs mismatch: ${rule.matchWindowMs}`);

const expectedOn = [
  { type: "spell", id: "rota" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
pushJsonMismatch(details, "rule.on", rule.on, expectedOn);

const expectedThen = [
  { type: ACTION_WAKE_WIN, spells: ["sanctum", "vectus"], words: ["sanctum", "vectus"], ttlMs: 1750 },
  { type: "event", id: "grace", ms: 700, mode: "boost" },
  { type: "event", id: "aoe_electric" },
];
pushJsonMismatch(details, "rule.then", rule.then, expectedThen);

if (details.length) {
  failCheckWithDetails(CHECK_TAG, "compiled output contract mismatch", details);
}

const commaSelectorsSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_comma_selectors",
      on: Object.freeze({ orb_state: "charged", word: "rota, sanctum", gesture: "spin_y" }),
      trigger: "grace, aoe_electric",
    }),
  ]),
});

const builtCommaSelectors = buildOrFail(commaSelectorsSample, "comma selector sample");

const commaRule = requireFirstCompiledRule(
  builtCommaSelectors,
  "comma selector sample did not produce a compiled rule"
);
const expectedCommaOn = [
  { type: "spell", id: "rota" },
  { type: "spell", id: "sanctum" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
failJsonMismatch("comma selector shorthand normalization mismatch", commaRule.on, expectedCommaOn);
const expectedCommaThen = [
  { type: "event", id: "grace" },
  { type: "event", id: "aoe_electric" },
];
failJsonMismatch("comma trigger shorthand normalization mismatch", commaRule.then, expectedCommaThen);

const onCommaStringSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_on_comma_string",
      on: "rota, spin_y, charged",
      trigger: "grace",
    }),
  ]),
});

const builtOnCommaString = buildOrFail(onCommaStringSample, "on comma-string sample");

const onCommaStringRule = requireFirstCompiledRule(
  builtOnCommaString,
  "on comma-string sample did not produce a compiled rule"
);
const expectedOnCommaStringOn = [
  { type: "spell", id: "rota" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
failJsonMismatch(
  "on comma-string shorthand normalization mismatch",
  onCommaStringRule.on,
  expectedOnCommaStringOn
);

const onArrayCommaSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_on_array_comma",
      on: Object.freeze(["rota, spin_y", "charged"]),
      trigger: "grace",
    }),
  ]),
});

const builtOnArrayComma = buildOrFail(onArrayCommaSample, "on array comma sample");

const onArrayCommaRule = requireFirstCompiledRule(
  builtOnArrayComma,
  "on array comma sample did not produce a compiled rule"
);
const expectedOnArrayCommaOn = [
  { type: "spell", id: "rota" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
failJsonMismatch(
  "on array comma-token shorthand normalization mismatch",
  onArrayCommaRule.on,
  expectedOnArrayCommaOn
);

const orbStateAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_orbstate_alias",
      on: Object.freeze({ word: "rota", orbState: "charged" }),
      trigger: "grace",
    }),
  ]),
});

const builtOrbStateAlias = buildOrFail(orbStateAliasSample, "orbState alias sample");

const orbStateAliasRule = requireFirstCompiledRule(
  builtOrbStateAlias,
  "orbState alias sample did not produce a compiled rule"
);
const expectedOrbStateAliasOn = [
  { type: "spell", id: "rota" },
  { type: "orb_state", id: "charged" },
];
failJsonMismatch("on orbState alias normalization mismatch", orbStateAliasRule.on, expectedOrbStateAliasOn);

const openTtlAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({ open: Object.freeze({ ttl: 2100 }) }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_open_ttl_alias",
      on: "rota",
      open: Object.freeze({ spells: Object.freeze(["sanctum"]), ttl: 900 }),
    }),
    Object.freeze({
      id: "o_open_ttl_default",
      on: "sanctum",
      open: Object.freeze({ spells: Object.freeze(["vectus"]) }),
    }),
  ]),
});

const builtOpenTtlAlias = buildOrFail(openTtlAliasSample, "open ttl alias sample");

const openTtlRules = Array.isArray(builtOpenTtlAlias?.rules) ? builtOpenTtlAlias.rules : [];
if (openTtlRules.length !== 2) {
  failCheck(CHECK_TAG, "open ttl alias sample did not produce expected compiled rules");
}
const openAliasRule = requireRuleById(
  openTtlRules,
  "o_open_ttl_alias",
  "open ttl alias sample rules missing expected ids"
);
const openDefaultRule = requireRuleById(
  openTtlRules,
  "o_open_ttl_default",
  "open ttl alias sample rules missing expected ids"
);
const aliasWakeAction = Array.isArray(openAliasRule.then)
  ? openAliasRule.then.find((action) => action?.type === ACTION_WAKE_WIN)
  : null;
if (!aliasWakeAction || aliasWakeAction.ttlMs !== 900) {
  failCheckWithDetails(
    CHECK_TAG,
    `open ttl alias did not map to ${ACTION_WAKE_WIN}.ttlMs`,
    [`wake action: ${asJson(aliasWakeAction)}`]
  );
}
const defaultWakeAction = Array.isArray(openDefaultRule.then)
  ? openDefaultRule.then.find((action) => action?.type === ACTION_WAKE_WIN)
  : null;
if (!defaultWakeAction || defaultWakeAction.ttlMs !== 2100) {
  failCheckWithDetails(
    CHECK_TAG,
    `defaults.open.ttl did not map to ${ACTION_WAKE_WIN}.ttlMs`,
    [`wake action: ${asJson(defaultWakeAction)}`]
  );
}

const timingAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({ rule: Object.freeze({ cooldown: 333, matchWindow: 1666 }) }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_timing_alias_override",
      on: "rota",
      trigger: "grace",
      cooldown: 444,
      matchWindow: 1888,
    }),
    Object.freeze({
      id: "o_timing_alias_default",
      on: "sanctum",
      trigger: "grace",
    }),
  ]),
});

const builtTimingAlias = buildOrFail(timingAliasSample, "timing alias sample");

const timingRules = Array.isArray(builtTimingAlias?.rules) ? builtTimingAlias.rules : [];
const timingOverrideRule = requireRuleById(
  timingRules,
  "o_timing_alias_override",
  "timing alias sample rules missing expected ids"
);
const timingDefaultRule = requireRuleById(
  timingRules,
  "o_timing_alias_default",
  "timing alias sample rules missing expected ids"
);
if (timingOverrideRule.cooldownMs !== 444 || timingOverrideRule.matchWindowMs !== 1888) {
  failCheckWithDetails(
    CHECK_TAG,
    "rule timing aliases did not map to cooldownMs/matchWindowMs",
    [`rule: ${asJson(timingOverrideRule)}`]
  );
}
if (timingDefaultRule.cooldownMs !== 333 || timingDefaultRule.matchWindowMs !== 1666) {
  failCheckWithDetails(
    CHECK_TAG,
    "defaults.rule timing aliases did not map to cooldownMs/matchWindowMs",
    [`rule: ${asJson(timingDefaultRule)}`]
  );
}

const onPluralAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_on_plural_aliases",
      on: Object.freeze({
        spells: "rota, sanctum",
        gestures: "spin_y",
        orbStates: "charged",
      }),
      trigger: "grace",
    }),
  ]),
});

const builtOnPluralAlias = buildOrFail(onPluralAliasSample, "on plural alias sample");

const [onPluralAliasRule] = Array.isArray(builtOnPluralAlias?.rules) ? builtOnPluralAlias.rules : [];
if (!onPluralAliasRule) {
  failCheck(CHECK_TAG, "on plural alias sample did not produce a compiled rule");
}
const expectedOnPluralAliasOn = [
  { type: "spell", id: "rota" },
  { type: "spell", id: "sanctum" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
failJsonMismatch("on plural aliases normalization mismatch", onPluralAliasRule.on, expectedOnPluralAliasOn);

const triggersAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_triggers_alias",
      on: "rota",
      trigger: "grace",
      triggers: "aoe_electric",
    }),
  ]),
});

const builtTriggersAlias = buildOrFail(triggersAliasSample, "triggers alias sample");

const triggersAliasRule = requireFirstCompiledRule(
  builtTriggersAlias,
  "triggers alias sample did not produce a compiled rule"
);
const expectedTriggersAliasThen = [
  { type: "event", id: "grace" },
  { type: "event", id: "aoe_electric" },
];
failJsonMismatch(
  "triggers alias normalization mismatch",
  triggersAliasRule.then,
  expectedTriggersAliasThen
);

const defaultsTriggersAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({
    trigger: Object.freeze({ grace: Object.freeze({ ms: 888 }) }),
    triggers: Object.freeze({ grace: Object.freeze({ ms: 777 }) }),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_defaults_triggers_alias",
      on: "rota",
      trigger: "grace",
    }),
  ]),
});

const builtDefaultsTriggersAlias = buildOrFail(
  defaultsTriggersAliasSample,
  "defaults.triggers alias sample"
);

const defaultsTriggersAliasRule = requireFirstCompiledRule(
  builtDefaultsTriggersAlias,
  "defaults.triggers alias sample did not produce a compiled rule"
);
const expectedDefaultsTriggersAliasThen = [
  { type: "event", id: "grace", ms: 888 },
];
failJsonMismatch(
  "defaults.triggers alias merge mismatch",
  defaultsTriggersAliasRule.then,
  expectedDefaultsTriggersAliasThen
);

const orbStateTypeAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_orb_state_type_aliases",
      on: Object.freeze(["orbstate:charged", "rota"]),
      trigger: "grace",
    }),
    Object.freeze({
      id: "o_orb_state_type_aliases_dash",
      on: Object.freeze(["orb-state:charged", "sanctum"]),
      trigger: "grace",
    }),
  ]),
});

const builtOrbStateTypeAlias = buildOrFail(
  orbStateTypeAliasSample,
  "orb_state type alias sample"
);

const orbStateTypeAliasRules = Array.isArray(builtOrbStateTypeAlias?.rules)
  ? builtOrbStateTypeAlias.rules
  : [];
const orbStateTypeAliasRule = requireRuleById(
  orbStateTypeAliasRules,
  "o_orb_state_type_aliases",
  "orb_state type alias sample did not produce a compiled rule"
);
const orbStateTypeAliasDashRule = requireRuleById(
  orbStateTypeAliasRules,
  "o_orb_state_type_aliases_dash",
  "orb_state type alias sample did not produce a compiled rule"
);
const expectedOrbStateTypeAliasOn = [
  { type: "orb_state", id: "charged" },
  { type: "spell", id: "rota" },
];
failJsonMismatch(
  "orb_state alias normalization mismatch",
  orbStateTypeAliasRule.on,
  expectedOrbStateTypeAliasOn
);
const expectedOrbStateTypeAliasDashOn = [
  { type: "orb_state", id: "charged" },
  { type: "spell", id: "sanctum" },
];
failJsonMismatch(
  "orb-state alias normalization mismatch",
  orbStateTypeAliasDashRule.on,
  expectedOrbStateTypeAliasDashOn
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
