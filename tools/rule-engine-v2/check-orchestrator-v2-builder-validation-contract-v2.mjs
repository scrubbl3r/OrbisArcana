import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v2-builder-validation-contract:v2";
const ERROR_PREFIX = "ORCHESTRATOR_V2 validation failed: ";
const ERROR_DELIMITER = " | ";

function expectBuilderValid(caseName, orchestratorV2) {
  let threw = false;
  let result = null;
  let message = "";
  try {
    result = buildRuleEngineFromOrchestratorV2({ orchestratorV2 });
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

function expectBuilderError(caseName, orchestratorV2, expectedNeedle) {
  let threw = false;
  let message = "";
  try {
    buildRuleEngineFromOrchestratorV2({ orchestratorV2 });
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

function expectBuilderErrorWithFragments(caseName, orchestratorV2, expectedFragments) {
  const message = expectBuilderError(caseName, orchestratorV2, expectedFragments[0]);
  for (const fragment of expectedFragments.slice(1)) {
    if (!message.includes(fragment)) {
      failCheck(CHECK_TAG, `${caseName} missing expected validation message fragment: ${fragment}`);
    }
  }
  if (!message.includes(ERROR_DELIMITER)) {
    failCheck(CHECK_TAG, `${caseName} must include validation error delimiter: ${ERROR_DELIMITER}`);
  }
}

expectBuilderValid(
  "baseline_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "baseline_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectBuilderValid(
  "trigger_shorthand_comma_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_comma_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: "grace, teleport_home",
      }),
    ]),
  })
);

expectBuilderValid(
  "trigger_shorthand_string_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_string_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: "grace",
      }),
    ]),
  })
);

expectBuilderValid(
  "trigger_shorthand_array_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_array_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze(["grace", "teleport_home"]),
      }),
    ]),
  })
);

expectBuilderValid(
  "alias_surfaces_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_surfaces_valid_rule",
        on: Object.freeze({ spell: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: "domus, pyro",
          ttlMs: 1200,
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "groups_prefixed_word_ids_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      prefixed_words: Object.freeze(["word.domus", "spell.pyro"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_prefixed_open_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@prefixed_words",
          ttlMs: 1200,
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "requires_consume_comma_string_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
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
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  })
);

expectBuilderValid(
  "trigger_boolean_false_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_boolean_false_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: false }),
      }),
    ]),
  })
);

expectBuilderValid(
  "trigger_object_enabled_false_with_args_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_object_enabled_false_with_args_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({
          grace: Object.freeze({ enabled: false, ttlMs: 700 }),
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "trigger_object_enabled_true_with_args_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_object_enabled_true_with_args_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({
          grace: Object.freeze({ enabled: true, ttlMs: 700 }),
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "on_word_comma_string_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_comma_string_valid_rule",
        on: Object.freeze({ word: "orbis, pyro" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectBuilderValid(
  "on_word_precedence_over_spell_alias_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_precedence_over_spell_alias_valid_rule",
        on: Object.freeze({
          word: "orbis",
          spell: "__unknown_wake_word__",
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectBuilderValid(
  "on_word_precedence_over_valid_spell_alias_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_precedence_over_valid_spell_alias_rule",
        on: Object.freeze({
          word: "orbis",
          spell: "pyro",
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectBuilderValid(
  "open_words_precedence_valid_when_spells_unknown_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze(["__unknown_wake_word__"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "open_words_comma_string_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_comma_string_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "domus, pyro",
          ttlMs: 1200,
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "open_words_comma_precedence_valid_when_spells_comma_unknown_build",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_comma_precedence_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "domus, pyro",
          spells: "__unknown_wake_word__, __other_unknown_wake_word__",
          ttlMs: 1200,
        }),
      }),
    ]),
  })
);

expectBuilderValid(
  "defaults_trigger_enabled_boolean_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: false, ttlMs: 500 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "defaults_trigger_enabled_boolean_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectBuilderValid(
  "defaults_trigger_object_valid_build",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        grace: Object.freeze({ ttlMs: 500 }),
        teleport_home: Object.freeze({ ttlMs: 900 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "defaults_trigger_object_valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectBuilderError(
  "invalid_rule_id_shape",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "bad rule id",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.rules[] id has invalid shape: bad rule id"
);

expectBuilderError(
  "rule_id_non_string_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: 123,
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.rules[] id must be a string"
);

expectBuilderError(
  "rule_id_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: " bad_rule_id ",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.rules[] id must not include leading/trailing whitespace:  bad_rule_id "
);

expectBuilderError(
  "rule_entry_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      "not-an-object",
    ]),
  }),
  "ORCHESTRATOR_V2.rules[0] must be an object"
);

expectBuilderError(
  "version_mismatch_invalid",
  Object.freeze({
    version: "1",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.version must be \"2\""
);

expectBuilderError(
  "version_non_string_invalid",
  Object.freeze({
    version: 2,
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.version must be \"2\""
);

expectBuilderError(
  "version_whitespace_invalid",
  Object.freeze({
    version: " 2 ",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.version must not include leading/trailing whitespace:  2 "
);

expectBuilderError(
  "rules_not_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze({ not: "an-array" }),
  }),
  "ORCHESTRATOR_V2.rules must be an array"
);

expectBuilderError(
  "defaults_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze(["not-an-object"]),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.defaults must be an object when present"
);

expectBuilderError(
  "groups_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze(["not-an-object"]),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.groups must be an object when present"
);

expectBuilderError(
  "groups_key_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      " bad_group ": Object.freeze(["domus"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@ bad_group ",
        }),
      }),
    ]),
  }),
  "key must not include leading/trailing whitespace"
);

expectBuilderError(
  "groups_key_shape_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      "bad group": Object.freeze(["domus"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_shape_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@bad group",
        }),
      }),
    ]),
  }),
  "key has invalid shape: bad group"
);

expectBuilderError(
  "open_group_ref_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      valid_group: Object.freeze(["domus"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "open_group_ref_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@ valid_group",
        }),
      }),
    ]),
  }),
  "open.words group ref must not include leading/trailing whitespace after @: @ valid_group"
);

expectBuilderError(
  "open_group_ref_shape_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      "bad.group": Object.freeze(["domus"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "open_group_ref_shape_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@bad/group",
        }),
      }),
    ]),
  }),
  "open.words group ref has invalid shape: @bad/group"
);

expectBuilderError(
  "open_group_ref_empty_name_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_group_ref_empty_name_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@",
        }),
      }),
    ]),
  }),
  "open.words group ref must include a name: @"
);

expectBuilderError(
  "groups_empty_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      empty_group: Object.freeze([]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_empty_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@empty_group",
        }),
      }),
    ]),
  }),
  "must be a non-empty array"
);

expectBuilderError(
  "groups_unknown_word_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      bad_words: Object.freeze(["__unknown_wake_word__"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_unknown_word_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@bad_words",
        }),
      }),
    ]),
  }),
  "references unknown/inactive word id: __unknown_wake_word__"
);

expectBuilderError(
  "groups_invalid_word_shape_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      bad_words: Object.freeze(["bad/word"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_invalid_word_shape_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@bad_words",
        }),
      }),
    ]),
  }),
  "contains invalid word id shape: bad/word"
);

expectBuilderError(
  "groups_non_string_word_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      bad_words: Object.freeze([42]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_non_string_word_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@bad_words",
        }),
      }),
    ]),
  }),
  "contains non-string word id: 42"
);

expectBuilderError(
  "groups_duplicate_after_normalization_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      dup_words: Object.freeze(["word.pyro", "spell.pyro"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_duplicate_after_normalization_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@dup_words",
        }),
      }),
    ]),
  }),
  "contains duplicate word id: pyro"
);

expectBuilderError(
  "open_words_duplicate_after_normalization",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      dup_words: Object.freeze(["word.pyro"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "dup_norm_open",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["@dup_words", "spell.pyro"]),
        }),
      }),
    ]),
  }),
  "open contains duplicate word id: pyro"
);

expectBuilderError(
  "on_words_duplicate_after_normalization",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "dup_norm_on",
        on: Object.freeze({
          word: Object.freeze(["word.pyro", "spell.pyro"]),
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "contains duplicate on selector: word:pyro"
);

expectBuilderError(
  "groups_word_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    groups: Object.freeze({
      bad_words: Object.freeze([" domus "]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_word_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@bad_words",
        }),
      }),
    ]),
  }),
  "contains word id with leading/trailing whitespace:  domus "
);

expectBuilderError(
  "rule_unsupported_key_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "rule_unsupported_key",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
        extra: true,
      }),
    ]),
  }),
  "contains unsupported key: extra"
);

expectBuilderError(
  "rule_on_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "rule_on_non_object",
        on: "orbis",
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "rule rule_on_non_object.on must be an object"
);

expectBuilderError(
  "rule_open_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "rule_open_non_object",
        on: Object.freeze({ word: "orbis" }),
        open: "wake.main",
      }),
    ]),
  }),
  "rule rule_open_non_object.open must be an object when present"
);

expectBuilderError(
  "top_level_unsupported_key_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
    foo: true,
  }),
  "ORCHESTRATOR_V2 contains unsupported key: foo"
);

expectBuilderError(
  "top_level_enabled_non_boolean_invalid",
  Object.freeze({
    version: "2",
    enabled: "yes",
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.enabled must be boolean"
);

expectBuilderError(
  "defaults_open_ttl_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      open: Object.freeze({ ttlMs: -1 }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "defaults.open.ttlMs must be a finite number >= 0 when present"
);

expectBuilderError(
  "defaults_open_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      open: Object.freeze(["bad"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.defaults.open must be an object when present"
);

expectBuilderError(
  "defaults_rule_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      rule: Object.freeze(["bad"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.defaults.rule must be an object when present"
);

expectBuilderError(
  "defaults_trigger_non_object_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze(["bad"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.defaults.trigger must be an object when present"
);

expectBuilderError(
  "defaults_rule_match_window_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 50, priority: 10 }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "defaults.rule.matchWindowMs must be a finite number >= 100 when present"
);

expectBuilderError(
  "defaults_rule_cooldown_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      rule: Object.freeze({ cooldownMs: -1, matchWindowMs: 2000, priority: 10 }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "defaults.rule.cooldownMs must be a finite number >= 0 when present"
);

expectBuilderError(
  "defaults_rule_priority_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 2000, priority: "high" }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "defaults.rule.priority must be a finite number when present"
);

expectBuilderError(
  "defaults_unsupported_key_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      extra: Object.freeze({}),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "ORCHESTRATOR_V2.defaults contains unsupported key: extra"
);

expectBuilderError(
  "defaults_trigger_enabled_non_boolean_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: "nope", ttlMs: 500 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  ".enabled must be boolean when present"
);

expectBuilderError(
  "defaults_trigger_event_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        grace: Object.freeze([500]),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "must be an object"
);

expectBuilderError(
  "defaults_trigger_unknown_event_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        event_does_not_exist: Object.freeze({ ttlMs: 500 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "references unknown event id: event_does_not_exist"
);

expectBuilderError(
  "unknown_trigger_event",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "bad_event",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ event_does_not_exist: true }),
      }),
    ]),
  }),
  "references unknown event id: event_does_not_exist"
);

expectBuilderError(
  "defaults_trigger_event_key_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        " grace ": Object.freeze({ ttlMs: 500 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "contains event id key with leading/trailing whitespace:  grace "
);

expectBuilderError(
  "defaults_trigger_duplicate_normalized_event_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        grace: Object.freeze({ ttlMs: 500 }),
        "event.grace": Object.freeze({ ttlMs: 700 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "contains duplicate normalized event id: grace"
);

expectBuilderError(
  "defaults_trigger_case_duplicate_normalized_event_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        Grace: Object.freeze({ ttlMs: 500 }),
        grace: Object.freeze({ ttlMs: 700 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "contains duplicate normalized event id: grace"
);

expectBuilderError(
  "defaults_trigger_prefixed_case_duplicate_normalized_event_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    defaults: Object.freeze({
      trigger: Object.freeze({
        "event.Grace": Object.freeze({ ttlMs: 500 }),
        grace: Object.freeze({ ttlMs: 700 }),
      }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "valid_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "contains duplicate normalized event id: grace"
);

expectBuilderError(
  "trigger_non_object_non_shorthand_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_non_object_non_shorthand_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: 123,
      }),
    ]),
  }),
  "trigger must be a string, array, or object"
);

expectBuilderError(
  "trigger_event_key_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_event_key_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ " grace ": true }),
      }),
    ]),
  }),
  "contains event id key with leading/trailing whitespace:  grace "
);

expectBuilderError(
  "trigger_duplicate_normalized_event_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_duplicate_normalized_event_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({
          grace: true,
          "event.grace": Object.freeze({ ttlMs: 700 }),
        }),
      }),
    ]),
  }),
  "contains duplicate normalized event id: grace"
);

expectBuilderError(
  "duplicate_open_window_id",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
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
    ]),
  }),
  "open.id duplicates previously opened window: wake.main"
);

expectBuilderError(
  "open_id_non_string_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_id_non_string_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: 123,
          words: Object.freeze(["domus"]),
        }),
      }),
    ]),
  }),
  "open.id must be a string"
);

expectBuilderError(
  "open_id_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_id_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: " wake.main ",
          words: Object.freeze(["domus"]),
        }),
      }),
    ]),
  }),
  "open.id must not include leading/trailing whitespace:  wake.main "
);

expectBuilderError(
  "invalid_open_window_id_shape",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "invalid_open_window_id_shape_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake bad",
          words: Object.freeze(["domus"]),
        }),
      }),
    ]),
  }),
  "open.id has invalid shape: wake bad"
);

expectBuilderError(
  "open_words_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_non_string_array_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze({ domus: true }),
        }),
      }),
    ]),
  }),
  "open.words must be a string or array when present"
);

expectBuilderError(
  "open_words_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus", 42]),
        }),
      }),
    ]),
  }),
  "open contains non-string word id: 42"
);

expectBuilderError(
  "open_invalid_word_shape_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_invalid_word_shape_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["bad/word"]),
        }),
      }),
    ]),
  }),
  "open contains invalid word id shape: bad/word"
);

expectBuilderError(
  "open_words_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze([" domus "]),
        }),
      }),
    ]),
  }),
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectBuilderError(
  "open_words_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_string_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: " domus ",
        }),
      }),
    ]),
  }),
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectBuilderError(
  "open_spells_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_non_string_array_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze({ domus: true }),
        }),
      }),
    ]),
  }),
  "open.spells must be a string or array when present"
);

expectBuilderError(
  "open_spells_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze(["domus", 42]),
        }),
      }),
    ]),
  }),
  "open contains non-string word id: 42"
);

expectBuilderError(
  "open_spells_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze([" domus "]),
        }),
      }),
    ]),
  }),
  "open.spells contains word id with leading/trailing whitespace:  domus "
);

expectBuilderError(
  "open_spells_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_string_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: " domus ",
        }),
      }),
    ]),
  }),
  "open.spells contains word id with leading/trailing whitespace:  domus "
);

expectBuilderError(
  "open_words_precedence_spells_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_spells_non_string_array_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze({ domus: true }),
        }),
      }),
    ]),
  }),
  "open.spells must be a string or array when present"
);

expectBuilderError(
  "open_words_precedence_spells_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_spells_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze(["domus", 42]),
        }),
      }),
    ]),
  }),
  "open.spells contains non-string word id: 42"
);

expectBuilderError(
  "open_words_precedence_spells_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_spells_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze([" domus "]),
        }),
      }),
    ]),
  }),
  "open.spells contains word id with leading/trailing whitespace:  domus "
);

expectBuilderErrorWithFragments(
  "multi_error_aggregation",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "bad rule id",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({ id: "wake bad", words: Object.freeze(["domus"]) }),
      }),
    ]),
  }),
  Object.freeze([
    "ORCHESTRATOR_V2.rules[] id has invalid shape: bad rule id",
    "open.id has invalid shape: wake bad",
  ])
);

expectBuilderError(
  "open_spells_comma_unknown_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_open_comma_unknown_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: "__unknown_wake_word__, __other_unknown_wake_word__",
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open references unknown/inactive word id: __unknown_wake_word__"
);

expectBuilderError(
  "on_word_comma_empty_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_comma_empty_rule",
        on: Object.freeze({ word: " , " }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "must define on selectors"
);

expectBuilderError(
  "on_word_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_non_string_array_rule",
        on: Object.freeze({ word: Object.freeze({ orbis: true }) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.word must be a string or array when present"
);

expectBuilderError(
  "on_gesture_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_gesture_non_string_array_rule",
        on: Object.freeze({ gesture: Object.freeze({ spin_y: true }) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.gesture must be a string or array when present"
);

expectBuilderError(
  "on_orb_state_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_orb_state_non_string_array_rule",
        on: Object.freeze({ orb_state: Object.freeze({ charged: true }) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.orb_state must be a string or array when present"
);

expectBuilderError(
  "on_spell_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_spell_non_string_array_rule",
        on: Object.freeze({ spell: Object.freeze({ orbis: true }) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.spell must be a string or array when present"
);

expectBuilderError(
  "on_word_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_non_string_entry_rule",
        on: Object.freeze({ word: Object.freeze(["orbis", 42]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.word contains non-string selector id: 42"
);

expectBuilderError(
  "on_word_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_whitespace_entry_rule",
        on: Object.freeze({ word: Object.freeze([" orbis "]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.word contains selector id with leading/trailing whitespace:  orbis "
);

expectBuilderError(
  "on_word_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_string_whitespace_rule",
        on: Object.freeze({ word: " orbis " }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.word contains selector id with leading/trailing whitespace:  orbis "
);

expectBuilderError(
  "on_spell_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_spell_non_string_entry_rule",
        on: Object.freeze({ spell: Object.freeze(["orbis", 42]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.word contains non-string selector id: 42"
);

expectBuilderError(
  "on_word_precedence_with_invalid_spell_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_precedence_invalid_spell_entry_rule",
        on: Object.freeze({
          word: "orbis",
          spell: Object.freeze(["domus", 42]),
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.spell contains non-string selector id: 42"
);

expectBuilderError(
  "on_word_precedence_with_whitespace_spell_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_precedence_whitespace_spell_entry_rule",
        on: Object.freeze({
          word: "orbis",
          spell: Object.freeze([" domus "]),
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.spell contains selector id with leading/trailing whitespace:  domus "
);

expectBuilderError(
  "on_gesture_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_gesture_non_string_entry_rule",
        on: Object.freeze({ gesture: Object.freeze(["spin_y", 42]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.gesture contains non-string selector id: 42"
);

expectBuilderError(
  "on_gesture_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_gesture_whitespace_entry_rule",
        on: Object.freeze({ gesture: Object.freeze([" spin_y "]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.gesture contains selector id with leading/trailing whitespace:  spin_y "
);

expectBuilderError(
  "on_gesture_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_gesture_string_whitespace_rule",
        on: Object.freeze({ gesture: " spin_y " }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.gesture contains selector id with leading/trailing whitespace:  spin_y "
);

expectBuilderError(
  "on_orb_state_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_orb_state_non_string_entry_rule",
        on: Object.freeze({ orb_state: Object.freeze(["charged", 42]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.orb_state contains non-string selector id: 42"
);

expectBuilderError(
  "on_orb_state_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_orb_state_whitespace_entry_rule",
        on: Object.freeze({ orb_state: Object.freeze([" charged "]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.orb_state contains selector id with leading/trailing whitespace:  charged "
);

expectBuilderError(
  "on_orb_state_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "on_orb_state_string_whitespace_rule",
        on: Object.freeze({ orb_state: " charged " }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.orb_state contains selector id with leading/trailing whitespace:  charged "
);

expectBuilderError(
  "consume_comma_duplicate_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "consume_comma_duplicate_rule",
        on: Object.freeze({ word: "domus" }),
        consume: "wake.main, wake.main",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume contains duplicate window id: wake.main"
);

expectBuilderError(
  "requires_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "requires_non_string_array_rule",
        on: Object.freeze({ word: "domus" }),
        requires: Object.freeze({ wake: "main" }),
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "requires must be a string or array when present"
);

expectBuilderError(
  "requires_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "requires_non_string_entry_rule",
        on: Object.freeze({ word: "domus" }),
        requires: Object.freeze(["wake.main", 42]),
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "requires contains non-string window id: 42"
);

expectBuilderError(
  "consume_non_string_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "consume_non_string_array_rule",
        on: Object.freeze({ word: "domus" }),
        consume: Object.freeze({ wake: "main" }),
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume must be a string or array when present"
);

expectBuilderError(
  "consume_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "consume_non_string_entry_rule",
        on: Object.freeze({ word: "domus" }),
        consume: Object.freeze(["wake.main", 42]),
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume contains non-string window id: 42"
);

expectBuilderError(
  "consume_invalid_window_shape",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "consume_invalid_shape_rule",
        on: Object.freeze({ word: "domus" }),
        consume: "wake main",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume has invalid window id shape: wake main"
);

expectBuilderError(
  "invalid_consume_window_shape",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "invalid_consume_window_shape_rule",
        on: Object.freeze({ word: "domus" }),
        consume: "wake main",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume has invalid window id shape: wake main"
);

expectBuilderError(
  "invalid_requires_window_shape",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "invalid_requires_window_shape_rule",
        on: Object.freeze({ word: "domus" }),
        requires: "wake main",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "requires has invalid window id shape: wake main"
);

expectBuilderError(
  "requires_window_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_wake_main_window",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
      }),
      Object.freeze({
        id: "requires_window_whitespace_rule",
        on: Object.freeze({ word: "domus" }),
        requires: Object.freeze([" wake.main "]),
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderError(
  "requires_window_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_wake_main_window",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
      }),
      Object.freeze({
        id: "requires_window_string_whitespace_rule",
        on: Object.freeze({ word: "domus" }),
        requires: " wake.main ",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderError(
  "consume_window_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_wake_main_window",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
      }),
      Object.freeze({
        id: "consume_window_whitespace_rule",
        on: Object.freeze({ word: "domus" }),
        consume: Object.freeze([" wake.main "]),
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderError(
  "consume_window_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "open_wake_main_window",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({ id: "wake.main", words: Object.freeze(["domus"]) }),
      }),
      Object.freeze({
        id: "consume_window_string_whitespace_rule",
        on: Object.freeze({ word: "domus" }),
        consume: " wake.main ",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectBuilderError(
  "unknown_requires_window",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
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
    ]),
  }),
  "references unknown window id: wake.unknown"
);

expectBuilderError(
  "unknown_consume_window",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
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
    ]),
  }),
  "references unknown window id: wake.unknown"
);

expectBuilderError(
  "trigger_event_args_array_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_args_array_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: Object.freeze([500]) }),
      }),
    ]),
  }),
  "must be boolean or object args"
);

expectBuilderError(
  "trigger_shorthand_non_string_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze(["grace", 42]),
      }),
    ]),
  }),
  "shorthand contains non-string event id: 42"
);

expectBuilderError(
  "trigger_shorthand_whitespace_entry_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze([" grace "]),
      }),
    ]),
  }),
  "shorthand contains event id with leading/trailing whitespace:  grace "
);

expectBuilderError(
  "trigger_shorthand_string_whitespace_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_string_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: " grace ",
      }),
    ]),
  }),
  "shorthand contains event id with leading/trailing whitespace:  grace "
);

expectBuilderError(
  "trigger_shorthand_duplicate_normalized_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_duplicate_normalized_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: "grace, grace",
      }),
    ]),
  }),
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderError(
  "trigger_shorthand_array_duplicate_normalized_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_array_duplicate_normalized_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze(["grace", "event.grace"]),
      }),
    ]),
  }),
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderError(
  "trigger_shorthand_case_duplicate_normalized_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_case_duplicate_normalized_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze(["Grace", "grace"]),
      }),
    ]),
  }),
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderError(
  "trigger_shorthand_prefixed_case_duplicate_normalized_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_prefixed_case_duplicate_normalized_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze(["event.Grace", "grace"]),
      }),
    ]),
  }),
  "shorthand contains duplicate normalized event id: grace"
);

expectBuilderError(
  "trigger_object_enabled_non_boolean_invalid",
  Object.freeze({
    version: "2",
    enabled: true,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_object_enabled_non_boolean_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({
          grace: Object.freeze({ enabled: "nope", ttlMs: 700 }),
        }),
      }),
    ]),
  }),
  ".enabled must be boolean when present"
);

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 builder rejects invalid configs via validation-prefixed errors"
);
