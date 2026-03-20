import { validateOrchestratorV2 } from "../../src/content/interactions-v2/validate-orchestrator-v2.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v2-validator:v2";

function hasError(errors, needle) {
  return (Array.isArray(errors) ? errors : []).some(
    (line) => typeof line === "string" && line.includes(needle)
  );
}

function hasWarning(warnings, needle) {
  return (Array.isArray(warnings) ? warnings : []).some(
    (line) => typeof line === "string" && line.includes(needle)
  );
}

function expectValid(caseName, cfg) {
  const res = validateOrchestratorV2(cfg);
  if (!res || res.ok !== true) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected valid config`,
      Array.isArray(res?.errors) ? res.errors : ["missing validation result"]
    );
  }
}

function expectInvalid(caseName, cfg, expectedNeedle) {
  const res = validateOrchestratorV2(cfg);
  if (!res || res.ok !== false) {
    failCheck(CHECK_TAG, `${caseName} expected validation failure`);
  }
  if (!hasError(res.errors, expectedNeedle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected error containing "${expectedNeedle}"`,
      Array.isArray(res.errors) ? res.errors : []
    );
  }
}

function expectWarning(caseName, cfg, expectedNeedle) {
  const res = validateOrchestratorV2(cfg);
  if (!res || res.ok !== true) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected valid config with warning`,
      Array.isArray(res?.errors) ? res.errors : ["missing validation result"]
    );
  }
  if (!hasWarning(res.warnings, expectedNeedle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected warning containing "${expectedNeedle}"`,
      Array.isArray(res.warnings) ? res.warnings : []
    );
  }
}

const baseline = Object.freeze({
  version: "2",
  enabled: true,
  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 1500 }),
    rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 2000, priority: 10 }),
    trigger: Object.freeze({ grace: Object.freeze({ ttlMs: 500 }) }),
  }),
  groups: Object.freeze({
    wake_main_words: Object.freeze(["domus", "pyro", "fridgis", "electrum", "rota"]),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "master_wake_01",
      on: Object.freeze({ word: "orbis" }),
      open: Object.freeze({
        id: "wake.main",
        words: "@wake_main_words",
        ttlMs: 1500,
      }),
    }),
    Object.freeze({
      id: "tele_home_01",
      on: Object.freeze({ word: "domus" }),
      requires: Object.freeze(["wake.main"]),
      consume: Object.freeze(["wake.main"]),
      trigger: Object.freeze({ teleport_home: true }),
    }),
    Object.freeze({
      id: "pyro_school_01",
      on: Object.freeze({ word: "pyro" }),
      requires: Object.freeze(["wake.main"]),
      open: Object.freeze({ id: "pyro.school", words: Object.freeze(["rota"]), ttlMs: 1200 }),
      trigger: Object.freeze({ aoe_flame: Object.freeze({ range: 14, ttlMs: 5000, power: 95 }) }),
    }),
  ]),
});

expectValid("baseline", baseline);

expectInvalid(
  "missing_version",
  Object.freeze({
    ...baseline,
    version: "1",
  }),
  'ORCHESTRATOR_V2.version must be "2"'
);

expectInvalid(
  "defaults_trigger_enabled_non_boolean_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        grace: Object.freeze({ enabled: "nope", ttlMs: 500 }),
      }),
    }),
  }),
  ".enabled must be boolean when present"
);

expectValid(
  "defaults_trigger_enabled_boolean_valid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        ...baseline.defaults.trigger,
        grace: Object.freeze({ enabled: false, ttlMs: 500 }),
      }),
    }),
  })
);

expectInvalid(
  "invalid_rule_id_shape",
  Object.freeze({
    ...baseline,
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

expectInvalid(
  "unknown_trigger_event",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules.slice(0, 2),
      Object.freeze({
        id: "bad_event",
        on: Object.freeze({ word: "pyro" }),
        trigger: Object.freeze({ event_does_not_exist: true }),
      }),
    ]),
  }),
  "references unknown event id"
);

expectInvalid(
  "trigger_event_args_array_invalid",
  Object.freeze({
    ...baseline,
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

expectValid(
  "trigger_boolean_false_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_false_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({ grace: false }),
      }),
    ]),
  })
);

expectValid(
  "trigger_object_enabled_false_with_args_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_object_enabled_false_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({
          grace: Object.freeze({ enabled: false, ttlMs: 700 }),
        }),
      }),
    ]),
  })
);

expectValid(
  "trigger_object_enabled_true_with_args_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_object_enabled_true_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze({
          grace: Object.freeze({ enabled: true, ttlMs: 900 }),
        }),
      }),
    ]),
  })
);

expectInvalid(
  "trigger_object_enabled_non_boolean_invalid",
  Object.freeze({
    ...baseline,
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

expectValid(
  "trigger_shorthand_string_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_string_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: "grace",
      }),
    ]),
  })
);

expectValid(
  "trigger_shorthand_array_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_array_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: Object.freeze(["grace", "teleport_home"]),
      }),
    ]),
  })
);

expectValid(
  "trigger_shorthand_comma_string_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_comma_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: "grace, teleport_home",
      }),
    ]),
  })
);

expectValid(
  "on_word_comma_string_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_comma_string_rule",
        on: Object.freeze({ word: "orbis, pyro" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  })
);

expectInvalid(
  "on_word_comma_empty_invalid",
  Object.freeze({
    ...baseline,
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

expectWarning(
  "on_spell_comma_string_alias_warning",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_spell_comma_string_rule",
        on: Object.freeze({ spell: "orbis, pyro" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "uses on.spell alias; prefer on.word"
);

expectInvalid(
  "trigger_shorthand_empty_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "trigger_shorthand_empty_rule",
        on: Object.freeze({ word: "orbis" }),
        trigger: "",
      }),
    ]),
  }),
  "shorthand must contain at least one event id"
);

expectInvalid(
  "invalid_open_window_id_shape",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "bad_open_id_shape",
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

expectInvalid(
  "duplicate_open_window_id",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "dup_open_a",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
        }),
      }),
      Object.freeze({
        id: "dup_open_b",
        on: Object.freeze({ word: "pyro" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["rota"]),
        }),
      }),
    ]),
  }),
  "open.id duplicates previously opened window: wake.main"
);

expectInvalid(
  "unknown_requires_window",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "bad_window_ref",
        on: Object.freeze({ word: "fridgis" }),
        requires: Object.freeze(["wake.unknown"]),
        trigger: Object.freeze({ aoe_frost: true }),
      }),
    ]),
  }),
  "references unknown window id: wake.unknown"
);

expectValid(
  "requires_consume_comma_string_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_wake_main_for_requires_consume",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
        }),
      }),
      Object.freeze({
        id: "open_pyro_school_for_requires_consume",
        on: Object.freeze({ word: "pyro" }),
        open: Object.freeze({
          id: "pyro.school",
          words: Object.freeze(["rota"]),
        }),
      }),
      Object.freeze({
        id: "requires_consume_comma_rule",
        on: Object.freeze({ word: "domus" }),
        requires: "wake.main,pyro.school",
        consume: "wake.main, pyro.school",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  })
);

expectInvalid(
  "requires_comma_duplicate_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "requires_comma_duplicate_rule",
        on: Object.freeze({ word: "domus" }),
        requires: "wake.main, wake.main",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "requires contains duplicate window id: wake.main"
);

expectInvalid(
  "consume_comma_duplicate_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalid(
  "invalid_requires_window_shape",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "bad_requires_window_shape",
        on: Object.freeze({ word: "fridgis" }),
        requires: Object.freeze(["wake main"]),
        trigger: Object.freeze({ aoe_frost: true }),
      }),
    ]),
  }),
  "requires has invalid window id shape: wake main"
);

expectInvalid(
  "invalid_consume_window_shape",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "bad_consume_window_shape",
        on: Object.freeze({ word: "electrum" }),
        consume: Object.freeze(["wake main"]),
        trigger: Object.freeze({ aoe_shock: true }),
      }),
    ]),
  }),
  "consume has invalid window id shape: wake main"
);

expectInvalid(
  "unknown_consume_window",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "bad_consume_window_ref",
        on: Object.freeze({ word: "electrum" }),
        consume: Object.freeze(["wake.unknown"]),
        trigger: Object.freeze({ aoe_shock: true }),
      }),
    ]),
  }),
  "references unknown window id: wake.unknown"
);

expectWarning(
  "alias_on_spell",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_rule",
        on: Object.freeze({ spell: "orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "uses on.spell alias; prefer on.word"
);

expectWarning(
  "alias_open_spells",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_open_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze(["domus"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "uses open.spells alias; prefer open.words"
);

expectValid(
  "open_words_precedence_valid_when_spells_unknown",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_valid",
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

expectValid(
  "open_words_comma_string_valid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_comma_rule",
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

expectValid(
  "open_words_comma_precedence_valid_when_spells_comma_unknown",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_comma_precedence_rule",
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

expectInvalid(
  "open_words_precedence_invalid_when_words_unknown",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_invalid",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["__unknown_wake_word__"]),
          spells: Object.freeze(["domus"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open references unknown/inactive word id: __unknown_wake_word__"
);

expectWarning(
  "alias_on_spell_prefixed",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_on_prefixed",
        on: Object.freeze({ spell: "word.orbis" }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "uses on.spell alias; prefer on.word"
);

expectWarning(
  "on_word_precedence_over_spell_alias",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_precedence_rule",
        on: Object.freeze({
          word: "orbis",
          spell: "__unknown_wake_word__",
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "uses on.spell alias; prefer on.word"
);

expectWarning(
  "on_word_precedence_over_valid_spell_alias",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_word_precedence_valid_alias_rule",
        on: Object.freeze({
          word: "orbis",
          spell: "domus",
        }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "uses on.spell alias; prefer on.word"
);

expectWarning(
  "alias_open_spells_comma_string",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_open_comma_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: "domus, pyro",
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "uses open.spells alias; prefer open.words"
);

expectInvalid(
  "alias_open_spells_comma_string_unknown_invalid",
  Object.freeze({
    ...baseline,
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

expectWarning(
  "alias_open_spells_prefixed",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_open_prefixed",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze(["word.domus", "spell.pyro"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "uses open.spells alias; prefer open.words"
);

expectValid(
  "groups_prefixed_word_ids",
  Object.freeze({
    ...baseline,
    groups: Object.freeze({
      prefixed_words: Object.freeze(["word.domus", "spell.pyro"]),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "group_prefixed_open",
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

expectInvalid(
  "open_words_duplicate_after_normalization",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open contains duplicate word id: pyro"
);

expectInvalid(
  "on_words_duplicate_after_normalization",
  Object.freeze({
    ...baseline,
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

reportCheckPass(CHECK_TAG, "orchestrator v2 validator contract holds for baseline + errors + alias warnings");
