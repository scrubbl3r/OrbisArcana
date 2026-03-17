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

reportCheckPass(CHECK_TAG, "orchestrator compiler contract holds for ON/OPEN/TRIGGER + defaults");
