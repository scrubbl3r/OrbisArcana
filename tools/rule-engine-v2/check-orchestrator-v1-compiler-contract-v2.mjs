import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-compiler:v2";

function asJson(v) {
  return JSON.stringify(v);
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

let built;
try {
  built = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: sample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for valid sample: ${msg}`);
}

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
if (asJson(rule.on) !== asJson(expectedOn)) {
  details.push(`rule.on mismatch: got ${asJson(rule.on)} expected ${asJson(expectedOn)}`);
}

const expectedThen = [
  { type: "wake_win", spells: ["sanctum", "vectus"], ttlMs: 1750 },
  { type: "event", id: "grace", ms: 700, mode: "boost" },
  { type: "event", id: "aoe_electric" },
];
if (asJson(rule.then) !== asJson(expectedThen)) {
  details.push(`rule.then mismatch: got ${asJson(rule.then)} expected ${asJson(expectedThen)}`);
}

if (details.length) {
  failCheckWithDetails(CHECK_TAG, "compiled output contract mismatch", details);
}

const commaSelectorsSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_comma_selectors",
      on: Object.freeze({ orb_state: "charged", spell: "rota, sanctum", gesture: "spin_y" }),
      trigger: "grace, aoe_electric",
    }),
  ]),
});

let builtCommaSelectors;
try {
  builtCommaSelectors = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: commaSelectorsSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for comma selector sample: ${msg}`);
}

const [commaRule] = Array.isArray(builtCommaSelectors?.rules) ? builtCommaSelectors.rules : [];
if (!commaRule) {
  failCheck(CHECK_TAG, "comma selector sample did not produce a compiled rule");
}
const expectedCommaOn = [
  { type: "spell", id: "rota" },
  { type: "spell", id: "sanctum" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
if (asJson(commaRule.on) !== asJson(expectedCommaOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "comma selector shorthand normalization mismatch",
    [`got ${asJson(commaRule.on)} expected ${asJson(expectedCommaOn)}`]
  );
}
const expectedCommaThen = [
  { type: "event", id: "grace" },
  { type: "event", id: "aoe_electric" },
];
if (asJson(commaRule.then) !== asJson(expectedCommaThen)) {
  failCheckWithDetails(
    CHECK_TAG,
    "comma trigger shorthand normalization mismatch",
    [`got ${asJson(commaRule.then)} expected ${asJson(expectedCommaThen)}`]
  );
}

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

let builtOnCommaString;
try {
  builtOnCommaString = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: onCommaStringSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for on comma-string sample: ${msg}`);
}

const [onCommaStringRule] = Array.isArray(builtOnCommaString?.rules) ? builtOnCommaString.rules : [];
if (!onCommaStringRule) {
  failCheck(CHECK_TAG, "on comma-string sample did not produce a compiled rule");
}
const expectedOnCommaStringOn = [
  { type: "spell", id: "rota" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
if (asJson(onCommaStringRule.on) !== asJson(expectedOnCommaStringOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "on comma-string shorthand normalization mismatch",
    [`got ${asJson(onCommaStringRule.on)} expected ${asJson(expectedOnCommaStringOn)}`]
  );
}

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

let builtOnArrayComma;
try {
  builtOnArrayComma = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: onArrayCommaSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for on array comma sample: ${msg}`);
}

const [onArrayCommaRule] = Array.isArray(builtOnArrayComma?.rules) ? builtOnArrayComma.rules : [];
if (!onArrayCommaRule) {
  failCheck(CHECK_TAG, "on array comma sample did not produce a compiled rule");
}
const expectedOnArrayCommaOn = [
  { type: "spell", id: "rota" },
  { type: "gesture", id: "spin_y" },
  { type: "orb_state", id: "charged" },
];
if (asJson(onArrayCommaRule.on) !== asJson(expectedOnArrayCommaOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "on array comma-token shorthand normalization mismatch",
    [`got ${asJson(onArrayCommaRule.on)} expected ${asJson(expectedOnArrayCommaOn)}`]
  );
}

const orbStateAliasSample = Object.freeze({
  version: "1",
  enabled: true,
  rules: Object.freeze([
    Object.freeze({
      id: "o_orbstate_alias",
      on: Object.freeze({ spell: "rota", orbState: "charged" }),
      trigger: "grace",
    }),
  ]),
});

let builtOrbStateAlias;
try {
  builtOrbStateAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: orbStateAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for orbState alias sample: ${msg}`);
}

const [orbStateAliasRule] = Array.isArray(builtOrbStateAlias?.rules) ? builtOrbStateAlias.rules : [];
if (!orbStateAliasRule) {
  failCheck(CHECK_TAG, "orbState alias sample did not produce a compiled rule");
}
const expectedOrbStateAliasOn = [
  { type: "spell", id: "rota" },
  { type: "orb_state", id: "charged" },
];
if (asJson(orbStateAliasRule.on) !== asJson(expectedOrbStateAliasOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "on orbState alias normalization mismatch",
    [`got ${asJson(orbStateAliasRule.on)} expected ${asJson(expectedOrbStateAliasOn)}`]
  );
}

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

let builtOpenTtlAlias;
try {
  builtOpenTtlAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: openTtlAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for open ttl alias sample: ${msg}`);
}

const openTtlRules = Array.isArray(builtOpenTtlAlias?.rules) ? builtOpenTtlAlias.rules : [];
if (openTtlRules.length !== 2) {
  failCheck(CHECK_TAG, "open ttl alias sample did not produce expected compiled rules");
}
const openAliasRule = openTtlRules.find((rule) => rule?.id === "o_open_ttl_alias");
const openDefaultRule = openTtlRules.find((rule) => rule?.id === "o_open_ttl_default");
if (!openAliasRule || !openDefaultRule) {
  failCheck(CHECK_TAG, "open ttl alias sample rules missing expected ids");
}
const aliasWakeAction = Array.isArray(openAliasRule.then)
  ? openAliasRule.then.find((action) => action?.type === "wake_win")
  : null;
if (!aliasWakeAction || aliasWakeAction.ttlMs !== 900) {
  failCheckWithDetails(
    CHECK_TAG,
    "open ttl alias did not map to wake_win.ttlMs",
    [`wake action: ${asJson(aliasWakeAction)}`]
  );
}
const defaultWakeAction = Array.isArray(openDefaultRule.then)
  ? openDefaultRule.then.find((action) => action?.type === "wake_win")
  : null;
if (!defaultWakeAction || defaultWakeAction.ttlMs !== 2100) {
  failCheckWithDetails(
    CHECK_TAG,
    "defaults.open.ttl did not map to wake_win.ttlMs",
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

let builtTimingAlias;
try {
  builtTimingAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: timingAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for timing alias sample: ${msg}`);
}

const timingRules = Array.isArray(builtTimingAlias?.rules) ? builtTimingAlias.rules : [];
const timingOverrideRule = timingRules.find((rule) => rule?.id === "o_timing_alias_override");
const timingDefaultRule = timingRules.find((rule) => rule?.id === "o_timing_alias_default");
if (!timingOverrideRule || !timingDefaultRule) {
  failCheck(CHECK_TAG, "timing alias sample rules missing expected ids");
}
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

let builtOnPluralAlias;
try {
  builtOnPluralAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: onPluralAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for on plural alias sample: ${msg}`);
}

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
if (asJson(onPluralAliasRule.on) !== asJson(expectedOnPluralAliasOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "on plural aliases normalization mismatch",
    [`got ${asJson(onPluralAliasRule.on)} expected ${asJson(expectedOnPluralAliasOn)}`]
  );
}

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

let builtTriggersAlias;
try {
  builtTriggersAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: triggersAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for triggers alias sample: ${msg}`);
}

const [triggersAliasRule] = Array.isArray(builtTriggersAlias?.rules) ? builtTriggersAlias.rules : [];
if (!triggersAliasRule) {
  failCheck(CHECK_TAG, "triggers alias sample did not produce a compiled rule");
}
const expectedTriggersAliasThen = [
  { type: "event", id: "grace" },
  { type: "event", id: "aoe_electric" },
];
if (asJson(triggersAliasRule.then) !== asJson(expectedTriggersAliasThen)) {
  failCheckWithDetails(
    CHECK_TAG,
    "triggers alias normalization mismatch",
    [`got ${asJson(triggersAliasRule.then)} expected ${asJson(expectedTriggersAliasThen)}`]
  );
}

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

let builtDefaultsTriggersAlias;
try {
  builtDefaultsTriggersAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: defaultsTriggersAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for defaults.triggers alias sample: ${msg}`);
}

const [defaultsTriggersAliasRule] = Array.isArray(builtDefaultsTriggersAlias?.rules)
  ? builtDefaultsTriggersAlias.rules
  : [];
if (!defaultsTriggersAliasRule) {
  failCheck(CHECK_TAG, "defaults.triggers alias sample did not produce a compiled rule");
}
const expectedDefaultsTriggersAliasThen = [
  { type: "event", id: "grace", ms: 888 },
];
if (asJson(defaultsTriggersAliasRule.then) !== asJson(expectedDefaultsTriggersAliasThen)) {
  failCheckWithDetails(
    CHECK_TAG,
    "defaults.triggers alias merge mismatch",
    [`got ${asJson(defaultsTriggersAliasRule.then)} expected ${asJson(expectedDefaultsTriggersAliasThen)}`]
  );
}

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

let builtOrbStateTypeAlias;
try {
  builtOrbStateTypeAlias = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: orbStateTypeAliasSample,
    baseRuleEngine: Object.freeze({ version: "2", signals: [], windows: [], events: [], rules: [], eventRuntimeBindings: {} }),
  });
} catch (err) {
  const msg = err instanceof Error && typeof err.message === "string" && err.message
    ? err.message
    : "unknown error";
  failCheck(CHECK_TAG, `builder threw for orb_state type alias sample: ${msg}`);
}

const orbStateTypeAliasRules = Array.isArray(builtOrbStateTypeAlias?.rules)
  ? builtOrbStateTypeAlias.rules
  : [];
const orbStateTypeAliasRule = orbStateTypeAliasRules.find((rule) => rule?.id === "o_orb_state_type_aliases");
const orbStateTypeAliasDashRule = orbStateTypeAliasRules.find((rule) => rule?.id === "o_orb_state_type_aliases_dash");
if (!orbStateTypeAliasRule || !orbStateTypeAliasDashRule) {
  failCheck(CHECK_TAG, "orb_state type alias sample did not produce a compiled rule");
}
const expectedOrbStateTypeAliasOn = [
  { type: "orb_state", id: "charged" },
  { type: "spell", id: "rota" },
];
if (asJson(orbStateTypeAliasRule.on) !== asJson(expectedOrbStateTypeAliasOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "orb_state alias normalization mismatch",
    [`got ${asJson(orbStateTypeAliasRule.on)} expected ${asJson(expectedOrbStateTypeAliasOn)}`]
  );
}
const expectedOrbStateTypeAliasDashOn = [
  { type: "orb_state", id: "charged" },
  { type: "spell", id: "sanctum" },
];
if (asJson(orbStateTypeAliasDashRule.on) !== asJson(expectedOrbStateTypeAliasDashOn)) {
  failCheckWithDetails(
    CHECK_TAG,
    "orb-state alias normalization mismatch",
    [`got ${asJson(orbStateTypeAliasDashRule.on)} expected ${asJson(expectedOrbStateTypeAliasDashOn)}`]
  );
}

reportCheckPass(CHECK_TAG, "orchestrator compiler contract holds for ON/OPEN/TRIGGER + defaults");
