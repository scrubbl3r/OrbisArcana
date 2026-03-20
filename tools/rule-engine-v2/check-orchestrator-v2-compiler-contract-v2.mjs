import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v2-compiler:v2";

function asJson(v) {
  return JSON.stringify(v);
}

function assertEqual(actual, expected, label, details) {
  if (actual !== expected) {
    details.push(`${label} mismatch: got ${actual} expected ${expected}`);
  }
}

const sample = Object.freeze({
  version: "2",
  enabled: true,
  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 1750 }),
    rule: Object.freeze({ cooldownMs: 222, matchWindowMs: 1999, priority: 7 }),
    trigger: Object.freeze({
      grace: Object.freeze({ ttlMs: 625 }),
      aoe_frost: Object.freeze({ enabled: false, power: 12 }),
    }),
  }),
  groups: Object.freeze({
    wake_main_words: Object.freeze(["domus", "pyro", "fridgis", "electrum", "rota"]),
    prefixed_words: Object.freeze(["word.pyro", "spell.rota"]),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_v2_wake",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({ id: "wake.main", words: "@wake_main_words", ttlMs: 1800 }),
    }),
    Object.freeze({
      id: "o_v2_pyro_school",
      on: Object.freeze({ word: "pyro", gesture: "spin_y" }),
      requires: Object.freeze(["wake.main"]),
      consume: Object.freeze(["wake.main"]),
      open: Object.freeze({ id: "pyro.school", words: Object.freeze(["rota"]) }),
      trigger: Object.freeze({
        aoe_flame: Object.freeze({ range: 14, ttlMs: 5000, power: 95 }),
        grace: true,
      }),
      cooldownMs: 300,
      priority: 42,
    }),
    Object.freeze({
      id: "o_v2_open_words_precedence",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "precedence.win",
        words: Object.freeze(["domus"]),
        spells: Object.freeze(["__unknown_wake_word__"]),
      }),
    }),
    Object.freeze({
      id: "o_v2_open_spells_alias_fallback",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "alias.fallback",
        spells: Object.freeze(["pyro"]),
      }),
    }),
    Object.freeze({
      id: "o_v2_on_spell_alias",
      on: Object.freeze({ spell: "orbis" }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_trigger_disabled_boolean",
      on: Object.freeze({ word: "orbis" }),
      trigger: Object.freeze({ grace: false }),
    }),
    Object.freeze({
      id: "o_v2_trigger_shorthand_array",
      on: Object.freeze({ word: "orbis" }),
      trigger: Object.freeze(["grace", "teleport_home"]),
    }),
    Object.freeze({
      id: "o_v2_trigger_object_enabled_false_with_args",
      on: Object.freeze({ word: "orbis" }),
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: false, ttlMs: 700 }),
      }),
    }),
    Object.freeze({
      id: "o_v2_trigger_object_enabled_true_with_args",
      on: Object.freeze({ word: "orbis" }),
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: true, ttlMs: 900 }),
      }),
    }),
    Object.freeze({
      id: "o_v2_defaults_trigger_enabled_shorthand",
      on: Object.freeze({ word: "orbis" }),
      trigger: "aoe_frost",
    }),
    Object.freeze({
      id: "o_v2_defaults_trigger_enabled_override",
      on: Object.freeze({ word: "orbis" }),
      trigger: Object.freeze({
        aoe_frost: Object.freeze({ enabled: true, range: 3 }),
      }),
    }),
    Object.freeze({
      id: "o_v2_trigger_requires_consume_comma_string",
      on: Object.freeze({ word: "domus" }),
      requires: "wake.main, pyro.school",
      consume: "wake.main,pyro.school",
      trigger: "grace, teleport_home",
    }),
    Object.freeze({
      id: "o_v2_on_word_comma_string",
      on: Object.freeze({ word: "orbis, pyro" }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_on_spell_comma_alias_fallback",
      on: Object.freeze({ spell: "orbis, pyro" }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_on_word_precedence_over_spell_alias",
      on: Object.freeze({ word: "orbis", spell: "__unknown_wake_word__" }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_on_word_precedence_over_valid_spell_alias",
      on: Object.freeze({ word: "orbis", spell: "domus" }),
      trigger: Object.freeze({ grace: true }),
    }),
    Object.freeze({
      id: "o_v2_alias_prefixed_normalization",
      on: Object.freeze({ spell: "word.orbis" }),
      open: Object.freeze({
        id: "alias.prefixed",
        spells: Object.freeze(["word.pyro", "spell.rota"]),
      }),
    }),
    Object.freeze({
      id: "o_v2_open_words_comma_string",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "open.words.comma",
        words: "domus, pyro",
      }),
    }),
    Object.freeze({
      id: "o_v2_open_words_comma_precedence_over_spells_comma",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "open.words.precedence.comma",
        words: "domus, pyro",
        spells: "__unknown_wake_word__, __other_unknown_wake_word__",
      }),
    }),
    Object.freeze({
      id: "o_v2_open_spells_comma_alias_fallback",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "open.spells.comma",
        spells: "domus, pyro",
      }),
    }),
    Object.freeze({
      id: "o_v2_group_prefixed_normalization",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "group.prefixed",
        words: "@prefixed_words",
      }),
    }),
    Object.freeze({
      id: "o_v2_group_mixed_order",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "group.mixed",
        words: Object.freeze(["@prefixed_words", "domus", "spell.fridgis"]),
      }),
    }),
  ]),
});

let built;
try {
  built = buildRuleEngineFromOrchestratorV2({
    orchestratorV2: sample,
    baseRuleEngine: Object.freeze({
      version: "2",
      signals: Object.freeze([]),
      windows: Object.freeze([]),
      events: Object.freeze([]),
      rules: Object.freeze([]),
      eventRuntimeBindings: Object.freeze({}),
    }),
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
if (!Array.isArray(built.rules) || built.rules.length !== 22) {
  failCheck(CHECK_TAG, "builder did not produce exactly twenty-two compiled rules");
}

const wakeRule = built.rules.find((rule) => rule && rule.id === "o_v2_wake");
const pyroRule = built.rules.find((rule) => rule && rule.id === "o_v2_pyro_school");
const precedenceRule = built.rules.find((rule) => rule && rule.id === "o_v2_open_words_precedence");
const aliasFallbackRule = built.rules.find((rule) => rule && rule.id === "o_v2_open_spells_alias_fallback");
const onSpellAliasRule = built.rules.find((rule) => rule && rule.id === "o_v2_on_spell_alias");
const triggerDisabledRule = built.rules.find((rule) => rule && rule.id === "o_v2_trigger_disabled_boolean");
const triggerShorthandRule = built.rules.find((rule) => rule && rule.id === "o_v2_trigger_shorthand_array");
const triggerObjectEnabledFalseRule = built.rules.find((rule) => rule && rule.id === "o_v2_trigger_object_enabled_false_with_args");
const triggerObjectEnabledTrueRule = built.rules.find((rule) => rule && rule.id === "o_v2_trigger_object_enabled_true_with_args");
const defaultsTriggerEnabledShorthandRule = built.rules.find((rule) => rule && rule.id === "o_v2_defaults_trigger_enabled_shorthand");
const defaultsTriggerEnabledOverrideRule = built.rules.find((rule) => rule && rule.id === "o_v2_defaults_trigger_enabled_override");
const triggerCommaRule = built.rules.find((rule) => rule && rule.id === "o_v2_trigger_requires_consume_comma_string");
const onCommaRule = built.rules.find((rule) => rule && rule.id === "o_v2_on_word_comma_string");
const onSpellCommaAliasRule = built.rules.find((rule) => rule && rule.id === "o_v2_on_spell_comma_alias_fallback");
const onWordPrecedenceRule = built.rules.find((rule) => rule && rule.id === "o_v2_on_word_precedence_over_spell_alias");
const onWordPrecedenceValidAliasRule = built.rules.find((rule) => rule && rule.id === "o_v2_on_word_precedence_over_valid_spell_alias");
const prefixedAliasRule = built.rules.find((rule) => rule && rule.id === "o_v2_alias_prefixed_normalization");
const openWordsCommaRule = built.rules.find((rule) => rule && rule.id === "o_v2_open_words_comma_string");
const openWordsCommaPrecedenceRule = built.rules.find((rule) => rule && rule.id === "o_v2_open_words_comma_precedence_over_spells_comma");
const openSpellsCommaAliasRule = built.rules.find((rule) => rule && rule.id === "o_v2_open_spells_comma_alias_fallback");
const groupPrefixedRule = built.rules.find((rule) => rule && rule.id === "o_v2_group_prefixed_normalization");
const groupMixedRule = built.rules.find((rule) => rule && rule.id === "o_v2_group_mixed_order");
if (!wakeRule || !pyroRule || !precedenceRule || !aliasFallbackRule || !onSpellAliasRule || !triggerDisabledRule || !triggerShorthandRule || !triggerObjectEnabledFalseRule || !triggerObjectEnabledTrueRule || !defaultsTriggerEnabledShorthandRule || !defaultsTriggerEnabledOverrideRule || !triggerCommaRule || !onCommaRule || !onSpellCommaAliasRule || !onWordPrecedenceRule || !onWordPrecedenceValidAliasRule || !prefixedAliasRule || !openWordsCommaRule || !openWordsCommaPrecedenceRule || !openSpellsCommaAliasRule || !groupPrefixedRule || !groupMixedRule) {
  failCheck(CHECK_TAG, "compiled rules missing expected ids");
}

const details = [];
assertEqual(asJson(wakeRule.on), asJson([{ type: "word", id: "orbis" }]), "wakeRule.on", details);
assertEqual(
  asJson(wakeRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["domus", "pyro", "fridgis", "electrum", "rota"],
    spells: ["domus", "pyro", "fridgis", "electrum", "rota"],
    ttlMs: 1800,
    windowId: "wake.main",
  }]),
  "wakeRule.then",
  details
);

assertEqual(
  asJson(pyroRule.on),
  asJson([{ type: "word", id: "pyro" }, { type: "gesture", id: "spin_y" }]),
  "pyroRule.on",
  details
);
assertEqual(asJson(pyroRule.requires), asJson(["wake.main"]), "pyroRule.requires", details);
assertEqual(asJson(pyroRule.consume), asJson(["wake.main"]), "pyroRule.consume", details);
assertEqual(String(pyroRule.cooldownMs), "300", "pyroRule.cooldownMs", details);
assertEqual(String(pyroRule.matchWindowMs), "1999", "pyroRule.matchWindowMs(default)", details);
assertEqual(String(pyroRule.priority), "42", "pyroRule.priority", details);

const expectedPyroThen = [
  { type: "wake_win", id: "wake_win", words: ["rota"], spells: ["rota"], ttlMs: 1750, windowId: "pyro.school" },
  { type: "event", id: "aoe_flame", range: 14, ttlMs: 5000, power: 95 },
  { type: "event", id: "grace", ttlMs: 625 },
];
assertEqual(asJson(pyroRule.then), asJson(expectedPyroThen), "pyroRule.then", details);

const expectedPrecedenceThen = [
  { type: "wake_win", id: "wake_win", words: ["domus"], spells: ["domus"], ttlMs: 1750, windowId: "precedence.win" },
];
assertEqual(
  asJson(precedenceRule.then),
  asJson(expectedPrecedenceThen),
  "precedenceRule.then",
  details
);

const expectedAliasFallbackThen = [
  { type: "wake_win", id: "wake_win", words: ["pyro"], spells: ["pyro"], ttlMs: 1750, windowId: "alias.fallback" },
];
assertEqual(
  asJson(aliasFallbackRule.then),
  asJson(expectedAliasFallbackThen),
  "aliasFallbackRule.then",
  details
);

assertEqual(
  asJson(onSpellAliasRule.on),
  asJson([{ type: "word", id: "orbis" }]),
  "onSpellAliasRule.on",
  details
);
assertEqual(
  asJson(onSpellAliasRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 625 }]),
  "onSpellAliasRule.then",
  details
);
assertEqual(
  asJson(triggerDisabledRule.on),
  asJson([{ type: "word", id: "orbis" }]),
  "triggerDisabledRule.on",
  details
);
assertEqual(
  asJson(triggerDisabledRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 625, enabled: false }]),
  "triggerDisabledRule.then",
  details
);
assertEqual(
  asJson(triggerShorthandRule.on),
  asJson([{ type: "word", id: "orbis" }]),
  "triggerShorthandRule.on",
  details
);
assertEqual(
  asJson(triggerShorthandRule.then),
  asJson([
    { type: "event", id: "grace", ttlMs: 625 },
    { type: "event", id: "teleport_home" },
  ]),
  "triggerShorthandRule.then",
  details
);
assertEqual(
  asJson(triggerObjectEnabledFalseRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 700, enabled: false }]),
  "triggerObjectEnabledFalseRule.then",
  details
);
assertEqual(
  asJson(triggerObjectEnabledTrueRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 900, enabled: true }]),
  "triggerObjectEnabledTrueRule.then",
  details
);
assertEqual(
  asJson(defaultsTriggerEnabledShorthandRule.then),
  asJson([{ type: "event", id: "aoe_frost", enabled: false, power: 12 }]),
  "defaultsTriggerEnabledShorthandRule.then",
  details
);
assertEqual(
  asJson(defaultsTriggerEnabledOverrideRule.then),
  asJson([{ type: "event", id: "aoe_frost", enabled: true, power: 12, range: 3 }]),
  "defaultsTriggerEnabledOverrideRule.then",
  details
);
assertEqual(
  asJson(triggerCommaRule.requires),
  asJson(["wake.main", "pyro.school"]),
  "triggerCommaRule.requires",
  details
);
assertEqual(
  asJson(triggerCommaRule.consume),
  asJson(["wake.main", "pyro.school"]),
  "triggerCommaRule.consume",
  details
);
assertEqual(
  asJson(triggerCommaRule.then),
  asJson([
    { type: "event", id: "grace", ttlMs: 625 },
    { type: "event", id: "teleport_home" },
  ]),
  "triggerCommaRule.then",
  details
);
assertEqual(
  asJson(onCommaRule.on),
  asJson([
    { type: "word", id: "orbis" },
    { type: "word", id: "pyro" },
  ]),
  "onCommaRule.on",
  details
);
assertEqual(
  asJson(onCommaRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 625 }]),
  "onCommaRule.then",
  details
);
assertEqual(
  asJson(onSpellCommaAliasRule.on),
  asJson([
    { type: "word", id: "orbis" },
    { type: "word", id: "pyro" },
  ]),
  "onSpellCommaAliasRule.on",
  details
);
assertEqual(
  asJson(onSpellCommaAliasRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 625 }]),
  "onSpellCommaAliasRule.then",
  details
);
assertEqual(
  asJson(onWordPrecedenceRule.on),
  asJson([{ type: "word", id: "orbis" }]),
  "onWordPrecedenceRule.on",
  details
);
assertEqual(
  asJson(onWordPrecedenceRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 625 }]),
  "onWordPrecedenceRule.then",
  details
);
assertEqual(
  asJson(onWordPrecedenceValidAliasRule.on),
  asJson([{ type: "word", id: "orbis" }]),
  "onWordPrecedenceValidAliasRule.on",
  details
);
assertEqual(
  asJson(onWordPrecedenceValidAliasRule.then),
  asJson([{ type: "event", id: "grace", ttlMs: 625 }]),
  "onWordPrecedenceValidAliasRule.then",
  details
);

assertEqual(
  asJson(prefixedAliasRule.on),
  asJson([{ type: "word", id: "orbis" }]),
  "prefixedAliasRule.on",
  details
);
assertEqual(
  asJson(prefixedAliasRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["pyro", "rota"],
    spells: ["pyro", "rota"],
    ttlMs: 1750,
    windowId: "alias.prefixed",
  }]),
  "prefixedAliasRule.then",
  details
);
assertEqual(
  asJson(openWordsCommaRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["domus", "pyro"],
    spells: ["domus", "pyro"],
    ttlMs: 1750,
    windowId: "open.words.comma",
  }]),
  "openWordsCommaRule.then",
  details
);
assertEqual(
  asJson(openWordsCommaPrecedenceRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["domus", "pyro"],
    spells: ["domus", "pyro"],
    ttlMs: 1750,
    windowId: "open.words.precedence.comma",
  }]),
  "openWordsCommaPrecedenceRule.then",
  details
);
assertEqual(
  asJson(openSpellsCommaAliasRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["domus", "pyro"],
    spells: ["domus", "pyro"],
    ttlMs: 1750,
    windowId: "open.spells.comma",
  }]),
  "openSpellsCommaAliasRule.then",
  details
);
assertEqual(
  asJson(groupPrefixedRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["pyro", "rota"],
    spells: ["pyro", "rota"],
    ttlMs: 1750,
    windowId: "group.prefixed",
  }]),
  "groupPrefixedRule.then",
  details
);
assertEqual(
  asJson(groupMixedRule.then),
  asJson([{
    type: "wake_win",
    id: "wake_win",
    words: ["pyro", "rota", "domus", "fridgis"],
    spells: ["pyro", "rota", "domus", "fridgis"],
    ttlMs: 1750,
    windowId: "group.mixed",
  }]),
  "groupMixedRule.then",
  details
);

if (details.length) {
  failCheckWithDetails(CHECK_TAG, "compiled output contract mismatch", details);
}

reportCheckPass(CHECK_TAG, "orchestrator v2 compiler contract holds for on/requires/open/consume/trigger + defaults");
