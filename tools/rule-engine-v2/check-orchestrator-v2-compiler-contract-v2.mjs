import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { OTHER_UNKNOWN_WAKE_WORD_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "orchestrator-v2-compiler:v2";
const PASS_MESSAGE = "orchestrator v2 compiler contract holds for on/requires/open/consume/bind/trigger + defaults";
const ACTION_WAKE_WIN = "wake_win";
const WINDOW_WAKE_WIN = "wake_win";
const WINDOW_WAKE_MAIN_ID = "wake.main";
const WINDOW_PYRO_SCHOOL_ID = "pyro.school";
const WINDOW_PRECEDENCE_ID = "precedence.win";
const WINDOW_COMPAT_FALLBACK_ID = "compat.fallback";
const WINDOW_COMPAT_PREFIXED_ID = "compat.prefixed";
const WINDOW_OPEN_WORDS_COMMA_ID = "open.words.comma";
const WINDOW_OPEN_WORDS_PRECEDENCE_COMMA_ID = "open.words.precedence.comma";
const WINDOW_OPEN_SPELLS_COMMA_ID = "open.spells.comma";
const WINDOW_GROUP_PREFIXED_ID = "group.prefixed";
const WINDOW_GROUP_MIXED_ID = "group.mixed";
const WORD_ORBIS_ID = "orbis";
const WORD_PYRO_ID = "pyro";
const WORD_DOMUS_ID = "domus";
const WORD_ROTA_ID = "rota";
const WORD_FRIDGIS_ID = "fridgis";
const WORD_ELECTRUM_ID = "electrum";
const GESTURE_SPIN_Y_ID = "spin_y";
const EVENT_GRACE_ID = "grace";
const EVENT_TELEPORT_HOME_ID = "teleport_home";
const EVENT_AOE_FROST_ID = "aoe_frost";
const EVENT_AOE_FLAME_ID = "aoe_flame";
const ACTION_BIND = "bind";
const WORD_PYRO_SELECTOR = "word.pyro";
const WORD_ORBIS_SELECTOR = "word.orbis";
const WORD_GROUP_PREFIXED_REF = "@prefixed_words";
const SPELL_ROTA_SELECTOR = "spell.rota";
const SPELL_FRIDGIS_SELECTOR = "spell.fridgis";

function asJson(v) {
  return JSON.stringify(v);
}

function assertEqual(actual, expected, label, details) {
  if (actual !== expected) {
    details.push(`${label} mismatch: got ${actual} expected ${expected}`);
  }
}

function expectedWakeThen(windowId, words, ttlMs = 1750) {
  return [{
    type: ACTION_WAKE_WIN,
    id: WINDOW_WAKE_WIN,
    words,
    spells: words,
    ttlMs,
    windowId,
  }];
}

function createBaseRuleEngine(enabled) {
  return Object.freeze({
    version: "2",
    enabled,
    signals: Object.freeze([]),
    windows: Object.freeze([]),
    events: Object.freeze([]),
    rules: Object.freeze([Object.freeze({ id: "base_rule_should_be_overridden" })]),
    eventRuntimeBindings: Object.freeze({}),
  });
}

function buildOrFail(orchestratorV2, baseEnabled, failureContext) {
  try {
    return buildRuleEngineFromOrchestratorV2({
      orchestratorV2,
      baseRuleEngine: createBaseRuleEngine(baseEnabled),
    });
  } catch (err) {
    const message =
      err instanceof Error && typeof err.message === "string" && err.message
        ? err.message
        : "unknown error";
    failCheck(CHECK_TAG, `builder threw for ${failureContext}: ${message}`);
  }
}

function requireRuleById(rules, ruleId) {
  const rule = Array.isArray(rules)
    ? rules.find((candidate) => candidate && candidate.id === ruleId)
    : null;
  if (!rule) {
    failCheck(CHECK_TAG, `compiled rules missing expected id: ${ruleId}`);
  }
  return rule;
}

const sample = Object.freeze({
  version: "2",
  enabled: true,
  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 1750 }),
    rule: Object.freeze({ cooldownMs: 222, matchWindowMs: 1999, priority: 7 }),
    trigger: Object.freeze({
      grace: Object.freeze({ ttlMs: 625 }),
      [EVENT_AOE_FROST_ID]: Object.freeze({ enabled: false, power: 12 }),
    }),
  }),
  groups: Object.freeze({
    wake_main_words: Object.freeze([WORD_DOMUS_ID, WORD_PYRO_ID, WORD_FRIDGIS_ID, WORD_ELECTRUM_ID, WORD_ROTA_ID]),
    prefixed_words: Object.freeze([WORD_PYRO_SELECTOR, SPELL_ROTA_SELECTOR]),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_v2_wake",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({ id: WINDOW_WAKE_MAIN_ID, words: "@wake_main_words", ttlMs: 1800 }),
    }),
    Object.freeze({
      id: "o_v2_pyro_school",
      on: Object.freeze({ word: WORD_PYRO_ID, gesture: GESTURE_SPIN_Y_ID }),
      requires: Object.freeze([WINDOW_WAKE_MAIN_ID]),
      consume: Object.freeze([WINDOW_WAKE_MAIN_ID]),
      open: Object.freeze({ id: WINDOW_PYRO_SCHOOL_ID, words: Object.freeze([WORD_ROTA_ID]) }),
      trigger: Object.freeze({
        [EVENT_AOE_FLAME_ID]: Object.freeze({ range: 14, ttlMs: 5000, power: 95 }),
        grace: true,
      }),
      cooldownMs: 300,
      priority: 42,
    }),
    Object.freeze({
      id: "o_v2_open_words_precedence",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_PRECEDENCE_ID,
        words: Object.freeze([WORD_DOMUS_ID]),
        spells: Object.freeze([UNKNOWN_WAKE_WORD_ID_V2]),
      }),
    }),
    Object.freeze({
      id: "o_v2_open_spells_compat_fallback",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_COMPAT_FALLBACK_ID,
        spells: Object.freeze([WORD_PYRO_ID]),
      }),
    }),
    Object.freeze({
      id: "o_v2_on_spell_compat",
      on: Object.freeze({ spell: WORD_ORBIS_ID }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_trigger_disabled_boolean",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      trigger: Object.freeze({ grace: false }),
    }),
    Object.freeze({
      id: "o_v2_trigger_shorthand_array",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      trigger: Object.freeze([EVENT_GRACE_ID, EVENT_TELEPORT_HOME_ID]),
    }),
    Object.freeze({
      id: "o_v2_trigger_object_enabled_false_with_args",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: false, ttlMs: 700 }),
      }),
    }),
    Object.freeze({
      id: "o_v2_trigger_object_enabled_true_with_args",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: true, ttlMs: 900 }),
      }),
    }),
    Object.freeze({
      id: "o_v2_defaults_trigger_enabled_shorthand",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      trigger: EVENT_AOE_FROST_ID,
    }),
    Object.freeze({
      id: "o_v2_defaults_trigger_enabled_override",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      trigger: Object.freeze({
        [EVENT_AOE_FROST_ID]: Object.freeze({ enabled: true, range: 3 }),
      }),
    }),
    Object.freeze({
      id: "o_v2_trigger_requires_consume_comma_string",
      on: Object.freeze({ word: WORD_DOMUS_ID }),
      requires: `${WINDOW_WAKE_MAIN_ID}, ${WINDOW_PYRO_SCHOOL_ID}`,
      consume: `${WINDOW_WAKE_MAIN_ID},${WINDOW_PYRO_SCHOOL_ID}`,
      trigger: "grace, teleport_home",
    }),
    Object.freeze({
      id: "o_v2_bind_fb",
      on: Object.freeze({ word: WORD_PYRO_ID }),
      bind: Object.freeze({ spell: EVENT_AOE_FLAME_ID, slot: "FB" }),
    }),
    Object.freeze({
      id: "o_v2_on_word_comma_string",
      on: Object.freeze({ word: `${WORD_ORBIS_ID}, ${WORD_PYRO_ID}` }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_on_spell_comma_compat_fallback",
      on: Object.freeze({ spell: `${WORD_ORBIS_ID}, ${WORD_PYRO_ID}` }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_on_word_precedence_over_spell_compat",
      on: Object.freeze({ word: WORD_ORBIS_ID, spell: UNKNOWN_WAKE_WORD_ID_V2 }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_on_word_precedence_over_valid_spell_compat",
      on: Object.freeze({ word: WORD_ORBIS_ID, spell: WORD_DOMUS_ID }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_compat_prefixed_normalization",
      on: Object.freeze({ spell: WORD_ORBIS_SELECTOR }),
      open: Object.freeze({
        id: WINDOW_COMPAT_PREFIXED_ID,
        spells: Object.freeze([WORD_PYRO_SELECTOR, SPELL_ROTA_SELECTOR]),
      }),
    }),
    Object.freeze({
      id: "o_v2_open_words_comma_string",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_OPEN_WORDS_COMMA_ID,
        words: `domus, ${WORD_PYRO_ID}`,
      }),
    }),
    Object.freeze({
      id: "o_v2_open_words_comma_precedence_over_spells_comma",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_OPEN_WORDS_PRECEDENCE_COMMA_ID,
        words: `domus, ${WORD_PYRO_ID}`,
        spells: `${UNKNOWN_WAKE_WORD_ID_V2}, ${OTHER_UNKNOWN_WAKE_WORD_ID_V2}`,
      }),
    }),
    Object.freeze({
      id: "o_v2_open_spells_comma_compat_fallback",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_OPEN_SPELLS_COMMA_ID,
        spells: `domus, ${WORD_PYRO_ID}`,
      }),
    }),
    Object.freeze({
      id: "o_v2_group_prefixed_normalization",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_GROUP_PREFIXED_ID,
        words: WORD_GROUP_PREFIXED_REF,
      }),
    }),
    Object.freeze({
      id: "o_v2_group_mixed_order",
      on: Object.freeze({ word: WORD_ORBIS_ID }),
      open: Object.freeze({
        id: WINDOW_GROUP_MIXED_ID,
        words: Object.freeze([WORD_GROUP_PREFIXED_REF, WORD_DOMUS_ID, SPELL_FRIDGIS_SELECTOR]),
      }),
    }),
  ]),
});

const built = buildOrFail(sample, false, "valid sample");

if (!built || typeof built !== "object") {
  failCheck(CHECK_TAG, "builder returned non-object");
}
if (built.enabled !== true) {
  failCheck(CHECK_TAG, "builder did not preserve top-level enabled=true");
}
if (!Array.isArray(built.rules) || built.rules.length !== 23) {
  failCheck(CHECK_TAG, "builder did not produce exactly twenty-three compiled rules");
}
if (built.rules.some((rule) => rule && rule.id === "base_rule_should_be_overridden")) {
  failCheck(CHECK_TAG, "builder did not override baseRuleEngine.rules with compiled rules");
}

const wakeRule = requireRuleById(built.rules, "o_v2_wake");
const pyroRule = requireRuleById(built.rules, "o_v2_pyro_school");
const precedenceRule = requireRuleById(built.rules, "o_v2_open_words_precedence");
const compatFallbackRule = requireRuleById(built.rules, "o_v2_open_spells_compat_fallback");
const onSpellCompatRule = requireRuleById(built.rules, "o_v2_on_spell_compat");
const triggerDisabledRule = requireRuleById(built.rules, "o_v2_trigger_disabled_boolean");
const triggerShorthandRule = requireRuleById(built.rules, "o_v2_trigger_shorthand_array");
const triggerObjectEnabledFalseRule = requireRuleById(
  built.rules,
  "o_v2_trigger_object_enabled_false_with_args"
);
const triggerObjectEnabledTrueRule = requireRuleById(
  built.rules,
  "o_v2_trigger_object_enabled_true_with_args"
);
const defaultsTriggerEnabledShorthandRule = requireRuleById(
  built.rules,
  "o_v2_defaults_trigger_enabled_shorthand"
);
const defaultsTriggerEnabledOverrideRule = requireRuleById(
  built.rules,
  "o_v2_defaults_trigger_enabled_override"
);
const triggerCommaRule = requireRuleById(built.rules, "o_v2_trigger_requires_consume_comma_string");
const onCommaRule = requireRuleById(built.rules, "o_v2_on_word_comma_string");
const onSpellCommaCompatRule = requireRuleById(built.rules, "o_v2_on_spell_comma_compat_fallback");
const onWordPrecedenceRule = requireRuleById(
  built.rules,
  "o_v2_on_word_precedence_over_spell_compat"
);
const onWordPrecedenceValidAliasRule = requireRuleById(
  built.rules,
  "o_v2_on_word_precedence_over_valid_spell_compat"
);
const bindRule = requireRuleById(built.rules, "o_v2_bind_fb");
const prefixedCompatRule = requireRuleById(built.rules, "o_v2_compat_prefixed_normalization");
const openWordsCommaRule = requireRuleById(built.rules, "o_v2_open_words_comma_string");
const openWordsCommaPrecedenceRule = requireRuleById(
  built.rules,
  "o_v2_open_words_comma_precedence_over_spells_comma"
);
const openSpellsCommaCompatRule = requireRuleById(
  built.rules,
  "o_v2_open_spells_comma_compat_fallback"
);
const groupPrefixedRule = requireRuleById(built.rules, "o_v2_group_prefixed_normalization");
const groupMixedRule = requireRuleById(built.rules, "o_v2_group_mixed_order");

const details = [];
const expectedGraceThen = [{ type: "event", id: EVENT_GRACE_ID, ttlMs: 625 }];
const expectedGraceTeleportThen = [
  { type: "event", id: EVENT_GRACE_ID, ttlMs: 625 },
  { type: "event", id: EVENT_TELEPORT_HOME_ID },
];
assertEqual(asJson(wakeRule.on), asJson([{ type: "word", id: WORD_ORBIS_ID }]), "wakeRule.on", details);
assertEqual(String(wakeRule.cooldownMs), "222", "wakeRule.cooldownMs(default)", details);
assertEqual(String(wakeRule.matchWindowMs), "1999", "wakeRule.matchWindowMs(default)", details);
assertEqual(String(wakeRule.priority), "7", "wakeRule.priority(default)", details);
assertEqual(
  asJson(wakeRule.then),
  asJson(expectedWakeThen(WINDOW_WAKE_MAIN_ID, [WORD_DOMUS_ID, WORD_PYRO_ID, WORD_FRIDGIS_ID, WORD_ELECTRUM_ID, WORD_ROTA_ID], 1800)),
  "wakeRule.then",
  details
);

assertEqual(
  asJson(pyroRule.on),
  asJson([{ type: "word", id: WORD_PYRO_ID }, { type: "gesture", id: GESTURE_SPIN_Y_ID }]),
  "pyroRule.on",
  details
);
assertEqual(asJson(pyroRule.requires), asJson([WINDOW_WAKE_MAIN_ID]), "pyroRule.requires", details);
assertEqual(asJson(pyroRule.consume), asJson([WINDOW_WAKE_MAIN_ID]), "pyroRule.consume", details);
assertEqual(String(pyroRule.cooldownMs), "300", "pyroRule.cooldownMs", details);
assertEqual(String(pyroRule.matchWindowMs), "1999", "pyroRule.matchWindowMs(default)", details);
assertEqual(String(pyroRule.priority), "42", "pyroRule.priority", details);

const expectedPyroThen = [
  { type: ACTION_WAKE_WIN, id: WINDOW_WAKE_WIN, words: [WORD_ROTA_ID], spells: [WORD_ROTA_ID], ttlMs: 1750, windowId: WINDOW_PYRO_SCHOOL_ID },
  { type: "event", id: EVENT_AOE_FLAME_ID, range: 14, ttlMs: 5000, power: 95 },
  { type: "event", id: EVENT_GRACE_ID, ttlMs: 625 },
];
assertEqual(asJson(pyroRule.then), asJson(expectedPyroThen), "pyroRule.then", details);

const expectedPrecedenceThen = expectedWakeThen(WINDOW_PRECEDENCE_ID, [WORD_DOMUS_ID]);
assertEqual(
  asJson(precedenceRule.then),
  asJson(expectedPrecedenceThen),
  "precedenceRule.then",
  details
);

const expectedCompatFallbackThen = expectedWakeThen(WINDOW_COMPAT_FALLBACK_ID, [WORD_PYRO_ID]);
assertEqual(
  asJson(compatFallbackRule.then),
  asJson(expectedCompatFallbackThen),
  "compatFallbackRule.then",
  details
);

assertEqual(
  asJson(onSpellCompatRule.on),
  asJson([{ type: "word", id: WORD_ORBIS_ID }]),
  "onSpellCompatRule.on",
  details
);
assertEqual(
  asJson(onSpellCompatRule.then),
  asJson(expectedGraceThen),
  "onSpellCompatRule.then",
  details
);
assertEqual(
  asJson(triggerDisabledRule.on),
  asJson([{ type: "word", id: WORD_ORBIS_ID }]),
  "triggerDisabledRule.on",
  details
);
assertEqual(
  asJson(triggerDisabledRule.then),
  asJson([{ type: "event", id: EVENT_GRACE_ID, ttlMs: 625, enabled: false }]),
  "triggerDisabledRule.then",
  details
);
assertEqual(
  asJson(triggerShorthandRule.on),
  asJson([{ type: "word", id: WORD_ORBIS_ID }]),
  "triggerShorthandRule.on",
  details
);
assertEqual(
  asJson(triggerShorthandRule.then),
  asJson(expectedGraceTeleportThen),
  "triggerShorthandRule.then",
  details
);
assertEqual(
  asJson(triggerObjectEnabledFalseRule.then),
  asJson([{ type: "event", id: EVENT_GRACE_ID, ttlMs: 700, enabled: false }]),
  "triggerObjectEnabledFalseRule.then",
  details
);
assertEqual(
  asJson(triggerObjectEnabledTrueRule.then),
  asJson([{ type: "event", id: EVENT_GRACE_ID, ttlMs: 900, enabled: true }]),
  "triggerObjectEnabledTrueRule.then",
  details
);
assertEqual(
  asJson(defaultsTriggerEnabledShorthandRule.then),
  asJson([{ type: "event", id: EVENT_AOE_FROST_ID, enabled: false, power: 12 }]),
  "defaultsTriggerEnabledShorthandRule.then",
  details
);
assertEqual(
  asJson(defaultsTriggerEnabledOverrideRule.then),
  asJson([{ type: "event", id: EVENT_AOE_FROST_ID, enabled: true, power: 12, range: 3 }]),
  "defaultsTriggerEnabledOverrideRule.then",
  details
);
assertEqual(
  asJson(triggerCommaRule.requires),
  asJson([WINDOW_WAKE_MAIN_ID, WINDOW_PYRO_SCHOOL_ID]),
  "triggerCommaRule.requires",
  details
);
assertEqual(
  asJson(triggerCommaRule.consume),
  asJson([WINDOW_WAKE_MAIN_ID, WINDOW_PYRO_SCHOOL_ID]),
  "triggerCommaRule.consume",
  details
);
assertEqual(
  asJson(triggerCommaRule.then),
  asJson(expectedGraceTeleportThen),
  "triggerCommaRule.then",
  details
);
assertEqual(
  asJson(onCommaRule.on),
  asJson([
    { type: "word", id: WORD_ORBIS_ID },
    { type: "word", id: WORD_PYRO_ID },
  ]),
  "onCommaRule.on",
  details
);
assertEqual(
  asJson(onCommaRule.then),
  asJson(expectedGraceThen),
  "onCommaRule.then",
  details
);
assertEqual(
  asJson(onSpellCommaCompatRule.on),
  asJson([
    { type: "word", id: WORD_ORBIS_ID },
    { type: "word", id: WORD_PYRO_ID },
  ]),
  "onSpellCommaCompatRule.on",
  details
);
assertEqual(
  asJson(onSpellCommaCompatRule.then),
  asJson(expectedGraceThen),
  "onSpellCommaCompatRule.then",
  details
);
assertEqual(
  asJson(onWordPrecedenceRule.on),
  asJson([{ type: "word", id: WORD_ORBIS_ID }]),
  "onWordPrecedenceRule.on",
  details
);
assertEqual(
  asJson(onWordPrecedenceRule.then),
  asJson(expectedGraceThen),
  "onWordPrecedenceRule.then",
  details
);
assertEqual(
  asJson(onWordPrecedenceValidAliasRule.on),
  asJson([{ type: "word", id: WORD_ORBIS_ID }]),
  "onWordPrecedenceValidAliasRule.on",
  details
);
assertEqual(
  asJson(onWordPrecedenceValidAliasRule.then),
  asJson(expectedGraceThen),
  "onWordPrecedenceValidAliasRule.then",
  details
);
assertEqual(
  asJson(bindRule.then),
  asJson([{ type: ACTION_BIND, id: "fb", spell: EVENT_AOE_FLAME_ID, slot: "FB" }]),
  "bindRule.then",
  details
);

assertEqual(
  asJson(prefixedCompatRule.on),
  asJson([{ type: "word", id: WORD_ORBIS_ID }]),
  "prefixedCompatRule.on",
  details
);
assertEqual(
  asJson(prefixedCompatRule.then),
  asJson(expectedWakeThen(WINDOW_COMPAT_PREFIXED_ID, [WORD_PYRO_ID, WORD_ROTA_ID])),
  "prefixedCompatRule.then",
  details
);
assertEqual(
  asJson(openWordsCommaRule.then),
  asJson(expectedWakeThen(WINDOW_OPEN_WORDS_COMMA_ID, [WORD_DOMUS_ID, WORD_PYRO_ID])),
  "openWordsCommaRule.then",
  details
);
assertEqual(
  asJson(openWordsCommaPrecedenceRule.then),
  asJson(expectedWakeThen(WINDOW_OPEN_WORDS_PRECEDENCE_COMMA_ID, [WORD_DOMUS_ID, WORD_PYRO_ID])),
  "openWordsCommaPrecedenceRule.then",
  details
);
assertEqual(
  asJson(openSpellsCommaCompatRule.then),
  asJson(expectedWakeThen(WINDOW_OPEN_SPELLS_COMMA_ID, [WORD_DOMUS_ID, WORD_PYRO_ID])),
  "openSpellsCommaCompatRule.then",
  details
);
assertEqual(
  asJson(groupPrefixedRule.then),
  asJson(expectedWakeThen(WINDOW_GROUP_PREFIXED_ID, [WORD_PYRO_ID, WORD_ROTA_ID])),
  "groupPrefixedRule.then",
  details
);
assertEqual(
  asJson(groupMixedRule.then),
  asJson(expectedWakeThen(WINDOW_GROUP_MIXED_ID, [WORD_PYRO_ID, WORD_ROTA_ID, WORD_DOMUS_ID, WORD_FRIDGIS_ID])),
  "groupMixedRule.then",
  details
);

if (details.length) {
  failCheckWithDetails(CHECK_TAG, "compiled output contract mismatch", details);
}

const builtDisabled = buildOrFail(
  Object.freeze({
    ...sample,
    enabled: false,
  }),
  true,
  "enabled=false sample"
);

if (!builtDisabled || typeof builtDisabled !== "object") {
  failCheck(CHECK_TAG, "builder returned non-object for enabled=false sample");
}
if (builtDisabled.enabled !== false) {
  failCheck(CHECK_TAG, "builder did not preserve top-level enabled=false");
}
if (!Array.isArray(builtDisabled.rules) || builtDisabled.rules.length !== built.rules.length) {
  failCheck(CHECK_TAG, "enabled=false sample changed compiled rule count unexpectedly");
}
if (builtDisabled.rules.some((rule) => rule && rule.id === "base_rule_should_be_overridden")) {
  failCheck(CHECK_TAG, "builder did not override baseRuleEngine.rules for enabled=false sample");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
