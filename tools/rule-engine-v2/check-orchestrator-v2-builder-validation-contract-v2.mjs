import { buildRuleEngineFromCompiledInteractionGraphV2 } from "../../src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  openUnknownInactiveWordErrorTokenV2,
  OTHER_UNKNOWN_WAKE_WORD_ID_V2,
  UNKNOWN_WAKE_WORD_ID_V2,
  unknownInactiveWordErrorTokenV2,
} from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "orchestrator-v2-builder-validation-contract:v2";
const ERROR_PREFIX = "COMPILED_INTERACTION_GRAPH_V2 validation failed: ";
const ERROR_DELIMITER = " | ";
const PASS_MESSAGE = "orchestrator-v2 builder rejects invalid configs via validation-prefixed errors";

function expectBuilderValid(caseName, compiledInteractionGraphV2) {
  let threw = false;
  let result = null;
  let message = "";
  try {
    result = buildRuleEngineFromCompiledInteractionGraphV2({ compiledInteractionGraphV2 });
  } catch (err) {
    threw = true;
    message = err instanceof Error ? String(err.message || "") : String(err || "");
  }
  if (threw) {
    failCheck(CHECK_TAG, `${caseName} expected builder success but threw: ${message}`);
  }
  if (!result || typeof result !== "object") {
    failCheck(CHECK_TAG, `${caseName} expected builder to return an object payload`);
  }
}

function expectBuilderError(caseName, compiledInteractionGraphV2, expectedNeedle) {
  let threw = false;
  let message = "";
  try {
    buildRuleEngineFromCompiledInteractionGraphV2({ compiledInteractionGraphV2 });
  } catch (err) {
    threw = true;
    message = err instanceof Error ? String(err.message || "") : String(err || "");
  }
  if (!threw) {
    failCheck(CHECK_TAG, `${caseName} expected builder to throw`);
  }
  if (!message.startsWith(ERROR_PREFIX)) {
    failCheck(CHECK_TAG, `${caseName} error must start with validation prefix`);
  }
  if (!message.includes(expectedNeedle)) {
    failCheck(CHECK_TAG, `${caseName} missing expected validation message fragment: ${expectedNeedle}`);
  }
  return message;
}

function expectBuilderErrorWithFragments(caseName, compiledInteractionGraphV2, expectedFragments) {
  const message = expectBuilderError(caseName, compiledInteractionGraphV2, expectedFragments[0]);
  for (const fragment of expectedFragments.slice(1)) {
    if (!message.includes(fragment)) {
      failCheck(CHECK_TAG, `${caseName} missing expected validation message fragment: ${fragment}`);
    }
  }
  if (!message.includes(ERROR_DELIMITER)) {
    failCheck(CHECK_TAG, `${caseName} must include validation error delimiter: ${ERROR_DELIMITER}`);
  }
}

const baseValidRule = Object.freeze({
  id: "valid_rule",
  on: Object.freeze({ word: "orbis" }),
  trigger: Object.freeze({ grace: true }),
});

const baseline = Object.freeze({
  version: "2",
  enabled: true,
  rules: Object.freeze([baseValidRule]),
});

function withRules(rules) {
  return withBaselineOverride({
    rules: Object.freeze(rules),
  });
}

function withSingleRule(rule) {
  return withRules([Object.freeze(rule)]);
}

function withDefaults(defaultsOverride) {
  return withBaselineOverride({
    defaults: Object.freeze(defaultsOverride),
  });
}

function withGroupsAndSingleRule(groupsOverride, rule) {
  return withBaselineOverride({
    groups: Object.freeze(groupsOverride),
    rules: Object.freeze([Object.freeze(rule)]),
  });
}

function withBaselineOverride(overrides) {
  return Object.freeze({
    ...baseline,
    ...overrides,
  });
}

function withVersion(version) {
  return withBaselineOverride({ version });
}

function expectBuilderErrorWithBaselineOverride(caseName, overrides, expectedNeedle) {
  expectBuilderError(caseName, withBaselineOverride(overrides), expectedNeedle);
}

function expectBuilderErrorWithSingleRule(caseName, rule, expectedNeedle) {
  expectBuilderError(caseName, withSingleRule(rule), expectedNeedle);
}

function expectBuilderErrorWithGroupsAndSingleRule(
  caseName,
  groupsOverride,
  rule,
  expectedNeedle
) {
  expectBuilderError(caseName, withGroupsAndSingleRule(groupsOverride, rule), expectedNeedle);
}

function expectBuilderErrorWithRules(caseName, rules, expectedNeedle) {
  expectBuilderError(caseName, withRules(rules), expectedNeedle);
}

function expectBuilderErrorWithRuleEntries(caseName, entries, expectedNeedle) {
  expectBuilderError(caseName, withRuleEntries(entries), expectedNeedle);
}

function expectBuilderErrorWithDefaults(caseName, defaultsOverride, expectedNeedle) {
  expectBuilderError(caseName, withDefaults(defaultsOverride), expectedNeedle);
}

function expectBuilderErrorWithVersion(caseName, version, expectedNeedle) {
  expectBuilderError(caseName, withVersion(version), expectedNeedle);
}

function expectBuilderValidWithSingleRule(caseName, rule) {
  expectBuilderValid(caseName, withSingleRule(rule));
}

function expectBuilderValidWithGroupsAndSingleRule(caseName, groupsOverride, rule) {
  expectBuilderValid(caseName, withGroupsAndSingleRule(groupsOverride, rule));
}

function expectBuilderValidWithRules(caseName, rules) {
  expectBuilderValid(caseName, withRules(rules));
}

function expectBuilderErrorWithSingleRuleFragments(caseName, rule, expectedFragments) {
  expectBuilderErrorWithFragments(caseName, withSingleRule(rule), expectedFragments);
}

function withDefaultsAndSingleRule(defaultsOverride, rule) {
  return withBaselineOverride({
    defaults: Object.freeze(defaultsOverride),
    rules: Object.freeze([Object.freeze(rule)]),
  });
}

function expectBuilderValidWithDefaultsAndSingleRule(caseName, defaultsOverride, rule) {
  expectBuilderValid(caseName, withDefaultsAndSingleRule(defaultsOverride, rule));
}

function withRuleEntries(entries) {
  return withBaselineOverride({
    rules: Object.freeze(entries),
  });
}

expectBuilderValidWithSingleRule(
  "baseline_valid_build",
  {
    id: "baseline_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectBuilderValidWithSingleRule(
  "trigger_shorthand_comma_valid_build",
  {
    id: "trigger_shorthand_comma_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "grace, teleport",
  }
);

expectBuilderValidWithSingleRule(
  "trigger_shorthand_string_valid_build",
  {
    id: "trigger_shorthand_string_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "grace",
  }
);

expectBuilderValidWithSingleRule(
  "trigger_shorthand_array_valid_build",
  {
    id: "trigger_shorthand_array_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["grace", "teleport"]),
  }
);

expectBuilderValidWithSingleRule(
  "compat_surfaces_valid_build",
  {
    id: "compat_surfaces_valid_rule",
    on: Object.freeze({ spell: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: "domus, pyro",
      ttlMs: 1200,
    }),
  }
);

expectBuilderValidWithGroupsAndSingleRule(
  "groups_prefixed_word_ids_valid_build",
  {
    prefixed_words: Object.freeze(["word.domus", "spell.pyro"]),
  },
  {
    id: "group_prefixed_open_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@prefixed_words",
      ttlMs: 1200,
    }),
  }
);

expectBuilderValidWithRules(
  "requires_consume_comma_string_valid_build",
  [
    Object.freeze({
      id: "open_wake_main_for_requires_consume_valid",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "wake.main",
        words: Object.freeze(["domus"]),
      }),
    }),
    Object.freeze({
      id: "open_pyro_school_for_requires_consume_valid",
      on: Object.freeze({ word: "pyro" }),
      open: Object.freeze({
        id: "pyro.school",
        words: Object.freeze(["rota"]),
      }),
    }),
    Object.freeze({
      id: "requires_consume_comma_valid_rule",
      on: Object.freeze({ word: "domus" }),
      requires: "wake.main,pyro.school",
      consume: "wake.main, pyro.school",
      trigger: Object.freeze({ teleport: true }),
    }),
  ]
);

expectBuilderValidWithSingleRule(
  "trigger_boolean_false_valid_build",
  {
    id: "trigger_boolean_false_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: false }),
  }
);

expectBuilderValidWithSingleRule(
  "trigger_object_enabled_false_with_args_valid_build",
  {
    id: "trigger_object_enabled_false_with_args_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: false, ttlMs: 700 }),
    }),
  }
);

expectBuilderValidWithSingleRule(
  "trigger_object_enabled_true_with_args_valid_build",
  {
    id: "trigger_object_enabled_true_with_args_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: true, ttlMs: 700 }),
    }),
  }
);

expectBuilderValidWithSingleRule(
  "on_word_comma_string_valid_build",
  {
    id: "on_word_comma_string_valid_rule",
    on: Object.freeze({ word: "orbis, pyro" }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectBuilderValidWithSingleRule(
  "on_word_precedence_over_spell_compat_valid_build",
  {
    id: "on_word_precedence_over_spell_compat_valid_rule",
    on: Object.freeze({
      word: "orbis",
      spell: UNKNOWN_WAKE_WORD_ID_V2,
    }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectBuilderValidWithSingleRule(
  "on_word_precedence_over_valid_spell_compat_build",
  {
    id: "on_word_precedence_over_valid_spell_compat_rule",
    on: Object.freeze({
      word: "orbis",
      spell: "pyro",
    }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectBuilderValidWithSingleRule(
  "open_words_precedence_valid_when_spells_unknown_build",
  {
    id: "open_words_precedence_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze([UNKNOWN_WAKE_WORD_ID_V2]),
      ttlMs: 1200,
    }),
  }
);

expectBuilderValidWithSingleRule(
  "open_words_comma_string_valid_build",
  {
    id: "open_words_comma_string_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "domus, pyro",
      ttlMs: 1200,
    }),
  }
);

expectBuilderValidWithSingleRule(
  "open_words_comma_precedence_valid_when_spells_comma_unknown_build",
  {
    id: "open_words_comma_precedence_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "domus, pyro",
      spells: `${UNKNOWN_WAKE_WORD_ID_V2}, ${OTHER_UNKNOWN_WAKE_WORD_ID_V2}`,
      ttlMs: 1200,
    }),
  }
);

expectBuilderValidWithDefaultsAndSingleRule(
  "defaults_trigger_enabled_boolean_valid_build",
  {
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: false, ttlMs: 500 }),
    }),
  },
  {
    id: "defaults_trigger_enabled_boolean_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectBuilderValidWithDefaultsAndSingleRule(
  "defaults_trigger_object_valid_build",
  {
    trigger: Object.freeze({
      grace: Object.freeze({ ttlMs: 500 }),
      teleport: Object.freeze({ ttlMs: 900 }),
    }),
  },
  {
    id: "defaults_trigger_object_valid_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectBuilderErrorWithSingleRule(
  "invalid_rule_id_shape",
  {
    id: "bad rule id",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  "COMPILED_INTERACTION_GRAPH_V2.rules[] id has invalid shape: bad rule id"
);

expectBuilderErrorWithSingleRule(
  "rule_id_non_string_invalid",
  {
    id: 123,
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  "COMPILED_INTERACTION_GRAPH_V2.rules[] id must be a string"
);

expectBuilderErrorWithSingleRule(
  "rule_id_whitespace_invalid",
  {
    id: " bad_rule_id ",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  "COMPILED_INTERACTION_GRAPH_V2.rules[] id must not include leading/trailing whitespace:  bad_rule_id "
);

expectBuilderErrorWithRuleEntries(
  "rule_entry_non_object_invalid",
  ["not-an-object"],
  "COMPILED_INTERACTION_GRAPH_V2.rules[0] must be an object"
);

expectBuilderErrorWithVersion(
  "version_mismatch_invalid",
  "1",
  "COMPILED_INTERACTION_GRAPH_V2.version must be \"2\""
);

expectBuilderErrorWithVersion(
  "version_non_string_invalid",
  2,
  "COMPILED_INTERACTION_GRAPH_V2.version must be \"2\""
);

expectBuilderErrorWithVersion(
  "version_whitespace_invalid",
  " 2 ",
  "COMPILED_INTERACTION_GRAPH_V2.version must not include leading/trailing whitespace:  2 "
);

expectBuilderErrorWithBaselineOverride(
  "rules_not_array_invalid",
  {
    rules: Object.freeze({ not: "an-array" }),
  },
  "COMPILED_INTERACTION_GRAPH_V2.rules must be an array"
);

expectBuilderErrorWithBaselineOverride(
  "defaults_non_object_invalid",
  {
    defaults: Object.freeze(["not-an-object"]),
  },
  "COMPILED_INTERACTION_GRAPH_V2.defaults must be an object when present"
);

expectBuilderErrorWithBaselineOverride(
  "groups_non_object_invalid",
  {
    groups: Object.freeze(["not-an-object"]),
  },
  "COMPILED_INTERACTION_GRAPH_V2.groups must be an object when present"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_key_whitespace_invalid",
  {
    " bad_group ": Object.freeze(["domus"]),
  },
  {
    id: "group_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@ bad_group ",
    }),
  },
  "key must not include leading/trailing whitespace"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_key_shape_invalid",
  {
    "bad group": Object.freeze(["domus"]),
  },
  {
    id: "group_shape_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@bad group",
    }),
  },
  "key has invalid shape: bad group"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "open_group_ref_whitespace_invalid",
  {
    valid_group: Object.freeze(["domus"]),
  },
  {
    id: "open_group_ref_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@ valid_group",
    }),
  },
  "open.words group ref must not include leading/trailing whitespace after @: @ valid_group"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "open_group_ref_shape_invalid",
  {
    "bad.group": Object.freeze(["domus"]),
  },
  {
    id: "open_group_ref_shape_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@bad/group",
    }),
  },
  "open.words group ref has invalid shape: @bad/group"
);

expectBuilderErrorWithSingleRule(
  "open_group_ref_empty_name_invalid",
  {
    id: "open_group_ref_empty_name_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@",
    }),
  },
  "open.words group ref must include a name: @"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_empty_array_invalid",
  {
    empty_group: Object.freeze([]),
  },
  {
    id: "group_empty_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@empty_group",
    }),
  },
  "must be a non-empty array"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_unknown_word_invalid",
  {
    bad_words: Object.freeze([UNKNOWN_WAKE_WORD_ID_V2]),
  },
  {
    id: "group_unknown_word_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@bad_words",
    }),
  },
  unknownInactiveWordErrorTokenV2(UNKNOWN_WAKE_WORD_ID_V2)
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_invalid_word_shape_invalid",
  {
    bad_words: Object.freeze(["bad/word"]),
  },
  {
    id: "group_invalid_word_shape_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@bad_words",
    }),
  },
  "contains invalid word id shape: bad/word"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_non_string_word_invalid",
  {
    bad_words: Object.freeze([42]),
  },
  {
    id: "group_non_string_word_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@bad_words",
    }),
  },
  "contains non-string word id: 42"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_duplicate_after_normalization_invalid",
  {
    dup_words: Object.freeze(["word.pyro", "spell.pyro"]),
  },
  {
    id: "group_duplicate_after_normalization_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@dup_words",
    }),
  },
  "contains duplicate word id: pyro"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "open_words_duplicate_after_normalization",
  {
    dup_words: Object.freeze(["word.pyro"]),
  },
  {
    id: "dup_norm_open",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["@dup_words", "spell.pyro"]),
    }),
  },
  "open contains duplicate word id: pyro"
);

expectBuilderErrorWithSingleRule(
  "on_words_duplicate_after_normalization",
  {
    id: "dup_norm_on",
    on: Object.freeze({
      word: Object.freeze(["word.pyro", "spell.pyro"]),
    }),
    trigger: Object.freeze({ grace: true }),
  },
  "contains duplicate on selector: word:pyro"
);

expectBuilderErrorWithGroupsAndSingleRule(
  "groups_word_whitespace_invalid",
  {
    bad_words: Object.freeze([" domus "]),
  },
  {
    id: "group_word_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@bad_words",
    }),
  },
  "contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRule(
  "rule_unsupported_key_invalid",
  {
    id: "rule_unsupported_key",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
    extra: true,
  },
  "contains unsupported key: extra"
);

expectBuilderErrorWithSingleRule(
  "rule_on_non_object_invalid",
  {
    id: "rule_on_non_object",
    on: "orbis",
    trigger: Object.freeze({ grace: true }),
  },
  "rule rule_on_non_object.on must be an object"
);

expectBuilderErrorWithSingleRule(
  "rule_open_non_object_invalid",
  {
    id: "rule_open_non_object",
    on: Object.freeze({ word: "orbis" }),
    open: "wake.main",
  },
  "rule rule_open_non_object.open must be an object when present"
);

expectBuilderErrorWithBaselineOverride(
  "top_level_unsupported_key_invalid",
  {
    foo: true,
  },
  "COMPILED_INTERACTION_GRAPH_V2 contains unsupported key: foo"
);

expectBuilderErrorWithBaselineOverride(
  "top_level_enabled_non_boolean_invalid",
  {
    enabled: "yes",
  },
  "COMPILED_INTERACTION_GRAPH_V2.enabled must be boolean"
);

expectBuilderErrorWithDefaults(
  "defaults_open_ttl_invalid",
  {
    open: Object.freeze({ ttlMs: -1 }),
  },
  "defaults.open.ttlMs must be a finite number >= 0 when present"
);

expectBuilderErrorWithDefaults(
  "defaults_open_non_object_invalid",
  {
    open: Object.freeze(["bad"]),
  },
  "COMPILED_INTERACTION_GRAPH_V2.defaults.open must be an object when present"
);

expectBuilderErrorWithDefaults(
  "defaults_rule_non_object_invalid",
  {
    rule: Object.freeze(["bad"]),
  },
  "COMPILED_INTERACTION_GRAPH_V2.defaults.rule must be an object when present"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_non_object_invalid",
  {
    trigger: Object.freeze(["bad"]),
  },
  "COMPILED_INTERACTION_GRAPH_V2.defaults.trigger must be an object when present"
);

expectBuilderErrorWithDefaults(
  "defaults_rule_match_window_invalid",
  {
    rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 50, priority: 10 }),
  },
  "defaults.rule.matchWindowMs must be a finite number >= 100 when present"
);

expectBuilderErrorWithDefaults(
  "defaults_rule_cooldown_invalid",
  {
    rule: Object.freeze({ cooldownMs: -1, matchWindowMs: 2000, priority: 10 }),
  },
  "defaults.rule.cooldownMs must be a finite number >= 0 when present"
);

expectBuilderErrorWithDefaults(
  "defaults_rule_priority_invalid",
  {
    rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 2000, priority: "high" }),
  },
  "defaults.rule.priority must be a finite number when present"
);

expectBuilderErrorWithDefaults(
  "defaults_unsupported_key_invalid",
  {
    extra: Object.freeze({}),
  },
  "COMPILED_INTERACTION_GRAPH_V2.defaults contains unsupported key: extra"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_enabled_non_boolean_invalid",
  {
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: "nope", ttlMs: 500 }),
    }),
  },
  ".enabled must be boolean when present"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_event_array_invalid",
  {
    trigger: Object.freeze({
      grace: Object.freeze([500]),
    }),
  },
  "must be an object"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_unknown_event_invalid",
  {
    trigger: Object.freeze({
      event_does_not_exist: Object.freeze({ ttlMs: 500 }),
    }),
  },
  "references unknown event id: event_does_not_exist"
);

expectBuilderErrorWithSingleRule(
  "unknown_trigger_event",
  {
    id: "bad_event",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ event_does_not_exist: true }),
  },
  "references unknown event id: event_does_not_exist"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_event_key_whitespace_invalid",
  {
    trigger: Object.freeze({
      " grace ": Object.freeze({ ttlMs: 500 }),
    }),
  },
  "contains event id key with leading/trailing whitespace:  grace "
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_duplicate_normalized_event_invalid",
  {
    trigger: Object.freeze({
      grace: Object.freeze({ ttlMs: 500 }),
      "event.grace": Object.freeze({ ttlMs: 700 }),
    }),
  },
  "contains duplicate normalized event id: grace"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_case_duplicate_normalized_event_invalid",
  {
    trigger: Object.freeze({
      Grace: Object.freeze({ ttlMs: 500 }),
      grace: Object.freeze({ ttlMs: 700 }),
    }),
  },
  "contains duplicate normalized event id: grace"
);

expectBuilderErrorWithDefaults(
  "defaults_trigger_prefixed_case_duplicate_normalized_event_invalid",
  {
    trigger: Object.freeze({
      "event.Grace": Object.freeze({ ttlMs: 500 }),
      grace: Object.freeze({ ttlMs: 700 }),
    }),
  },
  "contains duplicate normalized event id: grace"
);

expectBuilderErrorWithSingleRule(
  "trigger_non_object_non_shorthand_invalid",
  {
    id: "trigger_non_object_non_shorthand_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: 123,
  },
  "trigger must be a string, array, or object"
);

expectBuilderErrorWithSingleRule(
  "trigger_event_key_whitespace_invalid",
  {
    id: "trigger_event_key_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ " grace ": true }),
  },
  "contains event id key with leading/trailing whitespace:  grace "
);

expectBuilderErrorWithSingleRule(
  "trigger_duplicate_normalized_event_invalid",
  {
    id: "trigger_duplicate_normalized_event_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({
      grace: true,
      "event.grace": Object.freeze({ ttlMs: 700 }),
    }),
  },
  "contains duplicate normalized event id: grace"
);

expectBuilderErrorWithRules(
  "duplicate_open_window_id",
  [
    Object.freeze({
      id: "dup_open_a",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
    }),
    Object.freeze({
      id: "dup_open_b",
      on: Object.freeze({ word: "pyro" }),
      open: Object.freeze({ id: "wake.main", words: Object.freeze(["rota"]) }),
    }),
  ],
  "open.id duplicates previously opened window: wake.main"
);

expectBuilderErrorWithSingleRule(
  "open_id_non_string_invalid",
  {
    id: "open_id_non_string_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: 123,
      words: Object.freeze(["domus"]),
    }),
  },
  "open.id must be a string"
);

expectBuilderErrorWithSingleRule(
  "open_id_whitespace_invalid",
  {
    id: "open_id_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: " wake.main ",
      words: Object.freeze(["domus"]),
    }),
  },
  "open.id must not include leading/trailing whitespace:  wake.main "
);

expectBuilderErrorWithSingleRule(
  "invalid_open_window_id_shape",
  {
    id: "invalid_open_window_id_shape_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake bad",
      words: Object.freeze(["domus"]),
    }),
  },
  "open.id has invalid shape: wake bad"
);

expectBuilderErrorWithSingleRule(
  "open_words_non_string_array_invalid",
  {
    id: "open_words_non_string_array_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze({ domus: true }),
    }),
  },
  "open.words must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "open_words_non_string_entry_invalid",
  {
    id: "open_words_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus", 42]),
    }),
  },
  "open contains non-string word id: 42"
);

expectBuilderErrorWithSingleRule(
  "open_invalid_word_shape_invalid",
  {
    id: "open_invalid_word_shape_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["bad/word"]),
    }),
  },
  "open contains invalid word id shape: bad/word"
);

expectBuilderErrorWithSingleRule(
  "open_words_whitespace_entry_invalid",
  {
    id: "open_words_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze([" domus "]),
    }),
  },
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRule(
  "open_words_string_whitespace_invalid",
  {
    id: "open_words_string_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: " domus ",
    }),
  },
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRule(
  "open_spells_non_string_array_invalid",
  {
    id: "open_spells_non_string_array_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze({ domus: true }),
    }),
  },
  "open.spells must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "open_spells_non_string_entry_invalid",
  {
    id: "open_spells_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze(["domus", 42]),
    }),
  },
  "open contains non-string word id: 42"
);

expectBuilderErrorWithSingleRule(
  "open_spells_whitespace_entry_invalid",
  {
    id: "open_spells_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze([" domus "]),
    }),
  },
  "open.spells contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRule(
  "open_spells_string_whitespace_invalid",
  {
    id: "open_spells_string_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: " domus ",
    }),
  },
  "open.spells contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRule(
  "open_words_precedence_spells_non_string_array_invalid",
  {
    id: "open_words_precedence_spells_non_string_array_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze({ domus: true }),
    }),
  },
  "open.spells must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "open_words_precedence_spells_non_string_entry_invalid",
  {
    id: "open_words_precedence_spells_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze(["domus", 42]),
    }),
  },
  "open.spells contains non-string word id: 42"
);

expectBuilderErrorWithSingleRule(
  "open_words_precedence_spells_whitespace_entry_invalid",
  {
    id: "open_words_precedence_spells_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze([" domus "]),
    }),
  },
  "open.spells contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRuleFragments(
  "multi_error_aggregation",
  {
    id: "bad rule id",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({ id: "wake bad", words: Object.freeze(["domus"]) }),
  },
  Object.freeze([
    "COMPILED_INTERACTION_GRAPH_V2.rules[] id has invalid shape: bad rule id",
    "open.id has invalid shape: wake bad",
  ])
);

expectBuilderErrorWithSingleRule(
  "open_spells_comma_unknown_invalid",
  {
    id: "compat_open_comma_unknown_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: `${UNKNOWN_WAKE_WORD_ID_V2}, ${OTHER_UNKNOWN_WAKE_WORD_ID_V2}`,
      ttlMs: 1200,
    }),
  },
  openUnknownInactiveWordErrorTokenV2(UNKNOWN_WAKE_WORD_ID_V2)
);

expectBuilderErrorWithSingleRule(
  "on_word_comma_empty_invalid",
  {
    id: "on_word_comma_empty_rule",
    on: Object.freeze({ word: " , " }),
    trigger: Object.freeze({ grace: true }),
  },
  "must define on selectors"
);

expectBuilderErrorWithSingleRule(
  "on_word_non_string_array_invalid",
  {
    id: "on_word_non_string_array_rule",
    on: Object.freeze({ word: Object.freeze({ orbis: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "on_spin_non_string_array_invalid",
  {
    id: "on_spin_non_string_array_rule",
    on: Object.freeze({ spin: Object.freeze({ y: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "on_orb_state_non_string_array_invalid",
  {
    id: "on_orb_state_non_string_array_rule",
    on: Object.freeze({ orb_state: Object.freeze({ charged: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "on_spell_non_string_array_invalid",
  {
    id: "on_spell_non_string_array_rule",
    on: Object.freeze({ spell: Object.freeze({ orbis: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spell must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "on_word_non_string_entry_invalid",
  {
    id: "on_word_non_string_entry_rule",
    on: Object.freeze({ word: Object.freeze(["orbis", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains non-string selector id: 42"
);

expectBuilderErrorWithSingleRule(
  "on_word_whitespace_entry_invalid",
  {
    id: "on_word_whitespace_entry_rule",
    on: Object.freeze({ word: Object.freeze([" orbis "]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains selector id with leading/trailing whitespace:  orbis "
);

expectBuilderErrorWithSingleRule(
  "on_word_string_whitespace_invalid",
  {
    id: "on_word_string_whitespace_rule",
    on: Object.freeze({ word: " orbis " }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains selector id with leading/trailing whitespace:  orbis "
);

expectBuilderErrorWithSingleRule(
  "on_spell_non_string_entry_invalid",
  {
    id: "on_spell_non_string_entry_rule",
    on: Object.freeze({ spell: Object.freeze(["orbis", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains non-string selector id: 42"
);

expectBuilderErrorWithSingleRule(
  "on_word_precedence_with_invalid_spell_entry_invalid",
  {
    id: "on_word_precedence_invalid_spell_entry_rule",
    on: Object.freeze({
      word: "orbis",
      spell: Object.freeze(["domus", 42]),
    }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spell contains non-string selector id: 42"
);

expectBuilderErrorWithSingleRule(
  "on_word_precedence_with_whitespace_spell_entry_invalid",
  {
    id: "on_word_precedence_whitespace_spell_entry_rule",
    on: Object.freeze({
      word: "orbis",
      spell: Object.freeze([" domus "]),
    }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spell contains selector id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithSingleRule(
  "on_spin_non_string_entry_invalid",
  {
    id: "on_spin_non_string_entry_rule",
    on: Object.freeze({ spin: Object.freeze(["y", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin contains non-string selector id: 42"
);

expectBuilderErrorWithSingleRule(
  "on_spin_whitespace_entry_invalid",
  {
    id: "on_spin_whitespace_entry_rule",
    on: Object.freeze({ spin: Object.freeze([" y "]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin contains selector id with leading/trailing whitespace:  y "
);

expectBuilderErrorWithSingleRule(
  "on_spin_string_whitespace_invalid",
  {
    id: "on_spin_string_whitespace_rule",
    on: Object.freeze({ spin: " y " }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin contains selector id with leading/trailing whitespace:  y "
);

expectBuilderErrorWithSingleRule(
  "on_orb_state_non_string_entry_invalid",
  {
    id: "on_orb_state_non_string_entry_rule",
    on: Object.freeze({ orb_state: Object.freeze(["charged", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state contains non-string selector id: 42"
);

expectBuilderErrorWithSingleRule(
  "on_orb_state_whitespace_entry_invalid",
  {
    id: "on_orb_state_whitespace_entry_rule",
    on: Object.freeze({ orb_state: Object.freeze([" charged "]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state contains selector id with leading/trailing whitespace:  charged "
);

expectBuilderErrorWithSingleRule(
  "on_orb_state_string_whitespace_invalid",
  {
    id: "on_orb_state_string_whitespace_rule",
    on: Object.freeze({ orb_state: " charged " }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state contains selector id with leading/trailing whitespace:  charged "
);

expectBuilderErrorWithSingleRule(
  "consume_comma_duplicate_invalid",
  {
    id: "consume_comma_duplicate_rule",
    on: Object.freeze({ word: "domus" }),
    consume: "wake.main, wake.main",
    trigger: Object.freeze({ teleport: true }),
  },
  "consume contains duplicate window id: wake.main"
);

expectBuilderErrorWithSingleRule(
  "requires_non_string_array_invalid",
  {
    id: "requires_non_string_array_rule",
    on: Object.freeze({ word: "domus" }),
    requires: Object.freeze({ wake: "main" }),
    trigger: Object.freeze({ teleport: true }),
  },
  "requires must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "requires_non_string_entry_invalid",
  {
    id: "requires_non_string_entry_rule",
    on: Object.freeze({ word: "domus" }),
    requires: Object.freeze(["wake.main", 42]),
    trigger: Object.freeze({ teleport: true }),
  },
  "requires contains non-string window id: 42"
);

expectBuilderErrorWithSingleRule(
  "consume_non_string_array_invalid",
  {
    id: "consume_non_string_array_rule",
    on: Object.freeze({ word: "domus" }),
    consume: Object.freeze({ wake: "main" }),
    trigger: Object.freeze({ teleport: true }),
  },
  "consume must be a string or array when present"
);

expectBuilderErrorWithSingleRule(
  "consume_non_string_entry_invalid",
  {
    id: "consume_non_string_entry_rule",
    on: Object.freeze({ word: "domus" }),
    consume: Object.freeze(["wake.main", 42]),
    trigger: Object.freeze({ teleport: true }),
  },
  "consume contains non-string window id: 42"
);

expectBuilderErrorWithSingleRule(
  "consume_invalid_window_shape",
  {
    id: "consume_invalid_shape_rule",
    on: Object.freeze({ word: "domus" }),
    consume: "wake main",
    trigger: Object.freeze({ teleport: true }),
  },
  "consume has invalid window id shape: wake main"
);

expectBuilderErrorWithSingleRule(
  "invalid_consume_window_shape",
  {
    id: "invalid_consume_window_shape_rule",
    on: Object.freeze({ word: "domus" }),
    consume: "wake main",
    trigger: Object.freeze({ teleport: true }),
  },
  "consume has invalid window id shape: wake main"
);

expectBuilderErrorWithSingleRule(
  "invalid_requires_window_shape",
  {
    id: "invalid_requires_window_shape_rule",
    on: Object.freeze({ word: "domus" }),
    requires: "wake main",
    trigger: Object.freeze({ teleport: true }),
  },
  "requires has invalid window id shape: wake main"
);

expectBuilderErrorWithRules(
  "requires_window_whitespace_invalid",
  [
    Object.freeze({
      id: "open_wake_main_window",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
    }),
    Object.freeze({
      id: "requires_window_whitespace_rule",
      on: Object.freeze({ word: "domus" }),
      requires: Object.freeze([" wake.main "]),
      trigger: Object.freeze({ teleport: true }),
    }),
  ],
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderErrorWithRules(
  "requires_window_string_whitespace_invalid",
  [
    Object.freeze({
      id: "open_wake_main_window",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
    }),
    Object.freeze({
      id: "requires_window_string_whitespace_rule",
      on: Object.freeze({ word: "domus" }),
      requires: " wake.main ",
      trigger: Object.freeze({ teleport: true }),
    }),
  ],
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderErrorWithRules(
  "consume_window_whitespace_invalid",
  [
    Object.freeze({
      id: "open_wake_main_window",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
    }),
    Object.freeze({
      id: "consume_window_whitespace_rule",
      on: Object.freeze({ word: "domus" }),
      consume: Object.freeze([" wake.main "]),
      trigger: Object.freeze({ teleport: true }),
    }),
  ],
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderErrorWithRules(
  "consume_window_string_whitespace_invalid",
  [
    Object.freeze({
      id: "open_wake_main_window",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
    }),
    Object.freeze({
      id: "consume_window_string_whitespace_rule",
      on: Object.freeze({ word: "domus" }),
      consume: " wake.main ",
      trigger: Object.freeze({ teleport: true }),
    }),
  ],
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderErrorWithRules(
  "unknown_requires_window",
  [
    Object.freeze({
      id: "master_wake_01",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "wake.main",
        words: Object.freeze(["domus", "pyro"]),
        ttlMs: 1500,
      }),
    }),
    Object.freeze({
      id: "bad_window_ref",
      on: Object.freeze({ word: "pyro" }),
      requires: Object.freeze(["wake.unknown"]),
      trigger: Object.freeze({ grace: true }),
    }),
  ],
  "references unknown window id: wake.unknown"
);

expectBuilderErrorWithRules(
  "unknown_consume_window",
  [
    Object.freeze({
      id: "master_wake_01",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "wake.main",
        words: Object.freeze(["domus", "pyro"]),
        ttlMs: 1500,
      }),
    }),
    Object.freeze({
      id: "bad_consume_window_ref",
      on: Object.freeze({ word: "pyro" }),
      consume: Object.freeze(["wake.unknown"]),
      trigger: Object.freeze({ grace: true }),
    }),
  ],
  "references unknown window id: wake.unknown"
);

expectBuilderErrorWithSingleRule(
  "trigger_event_args_array_invalid",
  {
    id: "trigger_args_array_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: Object.freeze([500]) }),
  },
  "must be boolean or object args"
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_non_string_entry_invalid",
  {
    id: "trigger_shorthand_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["grace", 42]),
  },
  "shorthand contains non-string event id: 42"
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_whitespace_entry_invalid",
  {
    id: "trigger_shorthand_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze([" grace "]),
  },
  "shorthand contains event id with leading/trailing whitespace:  grace "
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_string_whitespace_invalid",
  {
    id: "trigger_shorthand_string_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: " grace ",
  },
  "shorthand contains event id with leading/trailing whitespace:  grace "
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "grace, grace",
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_array_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_array_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["grace", "event.grace"]),
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_case_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_case_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["Grace", "grace"]),
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderErrorWithSingleRule(
  "trigger_shorthand_prefixed_case_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_prefixed_case_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["event.Grace", "grace"]),
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderErrorWithSingleRule(
  "trigger_object_enabled_non_boolean_invalid",
  {
    id: "trigger_object_enabled_non_boolean_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: "nope", ttlMs: 700 }),
    }),
  },
  ".enabled must be boolean when present"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
