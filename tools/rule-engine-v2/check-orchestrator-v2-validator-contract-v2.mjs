import { validateOrchestratorV2 } from "../../src/content/interactions-v2/validate-orchestrator-v2.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v2-validator:v2";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeLabel(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasFragment(lines, needle) {
  if (!Array.isArray(lines)) {
    return false;
  }
  return lines.some(
    (line) => typeof line === "string" && line.includes(needle)
  );
}

function assertNeedleValue(caseName, kindLabel, needle) {
  if (normalizeLabel(needle).length === 0) {
    failCheck(
      CHECK_TAG,
      `${caseName} expected non-empty ${kindLabel} needle`
    );
  }
}

function requireNeedles(caseName, kind, needles) {
  const kindLabel = normalizeLabel(kind);
  if (kindLabel.length === 0) {
    failCheck(CHECK_TAG, `${caseName} expected non-empty needle kind label`);
  }
  const lines = asArray(needles);
  if (lines.length === 0) {
    failCheck(CHECK_TAG, `${caseName} expected at least one ${kindLabel} needle`);
  }
  for (const needle of lines) {
    assertNeedleValue(caseName, kindLabel, needle);
  }
  return lines;
}

function expectValidResult(caseName, cfg) {
  const res = validateOrchestratorV2(cfg);
  if (res?.ok !== true) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected valid config`,
      res ? getErrors(res) : ["missing validation result"]
    );
  }
  return res;
}

function expectZeroWarnings(caseName, warnings) {
  const lines = asArray(warnings);
  if (lines.length !== 0) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected zero warnings`,
      lines
    );
  }
}

function expectWarningContainsInLines(caseName, lines, needle) {
  assertNeedleValue(caseName, "warning", needle);
  if (!hasFragment(lines, needle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected warning containing "${needle}"`,
      lines
    );
  }
}

function expectWarningExcludesInLines(caseName, lines, needle) {
  assertNeedleValue(caseName, "warning", needle);
  if (hasFragment(lines, needle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected warning NOT to contain "${needle}"`,
      lines
    );
  }
}

function expectErrorContainsInLines(caseName, lines, needle) {
  assertNeedleValue(caseName, "error", needle);
  if (!hasFragment(lines, needle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected error containing "${needle}"`,
      lines
    );
  }
}

function expectWarningCount(caseName, warnings, expectedCount) {
  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    failCheck(
      CHECK_TAG,
      `${caseName} expected warning count must be a non-negative integer`
    );
  }
  const lines = asArray(warnings);
  const actualCount = lines.length;
  if (actualCount !== expectedCount) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected exactly ${expectedCount} warning(s), got ${actualCount}`,
      lines
    );
  }
}

function getWarnings(res) {
  return asArray(res?.warnings);
}

function getErrors(res) {
  return asArray(res?.errors);
}

function expectValidNoWarnings(caseName, cfg) {
  expectZeroWarnings(caseName, getWarnings(expectValidResult(caseName, cfg)));
}

function expectInvalidResult(caseName, cfg, expectedNeedle) {
  const res = validateOrchestratorV2(cfg);
  if (res?.ok !== false) {
    failCheck(CHECK_TAG, `${caseName} expected validation failure`);
  }
  expectErrorContainsInLines(caseName, getErrors(res), expectedNeedle);
  return res;
}

function expectInvalidNoWarnings(caseName, cfg, expectedNeedle) {
  expectZeroWarnings(
    caseName,
    getWarnings(expectInvalidResult(caseName, cfg, expectedNeedle))
  );
}

function expectInvalidWithWarning(caseName, cfg, expectedNeedle, expectedWarningNeedle) {
  expectWarningContainsInLines(
    caseName,
    getWarnings(expectInvalidResult(caseName, cfg, expectedNeedle)),
    expectedWarningNeedle
  );
}

function expectInvalidWithoutWarning(
  caseName,
  cfg,
  expectedNeedle,
  forbiddenWarningNeedle
) {
  expectWarningExcludesInLines(
    caseName,
    getWarnings(expectInvalidResult(caseName, cfg, expectedNeedle)),
    forbiddenWarningNeedle
  );
}

function expectInvalidWithFragments(caseName, cfg, expectedNeedles) {
  const needles = requireNeedles(caseName, "error fragment", expectedNeedles);
  const errors = getErrors(expectInvalidResult(caseName, cfg, needles[0]));
  for (let i = 1; i < needles.length; i += 1) {
    expectErrorContainsInLines(caseName, errors, needles[i]);
  }
}

function expectWarnings(caseName, cfg, expectedNeedles) {
  const needles = requireNeedles(caseName, "warning", expectedNeedles);
  const warnings = getWarnings(expectValidResult(caseName, cfg));
  expectWarningCount(caseName, warnings, needles.length);
  for (const needle of needles) {
    expectWarningContainsInLines(caseName, warnings, needle);
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

expectValidNoWarnings("baseline", baseline);

expectInvalidNoWarnings(
  "missing_version",
  Object.freeze({
    ...baseline,
    version: "1",
  }),
  'ORCHESTRATOR_V2.version must be "2"'
);

expectInvalidNoWarnings(
  "version_mismatch_invalid",
  Object.freeze({
    ...baseline,
    version: "1",
  }),
  'ORCHESTRATOR_V2.version must be "2"'
);

expectInvalidNoWarnings(
  "version_non_string_invalid",
  Object.freeze({
    ...baseline,
    version: 2,
  }),
  'ORCHESTRATOR_V2.version must be "2"'
);

expectInvalidNoWarnings(
  "version_whitespace_invalid",
  Object.freeze({
    ...baseline,
    version: " 2 ",
  }),
  "ORCHESTRATOR_V2.version must not include leading/trailing whitespace:  2 "
);

expectInvalidNoWarnings(
  "defaults_non_object_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze(["not-an-object"]),
  }),
  "ORCHESTRATOR_V2.defaults must be an object when present"
);

expectInvalidNoWarnings(
  "groups_non_object_invalid",
  Object.freeze({
    ...baseline,
    groups: Object.freeze(["not-an-object"]),
  }),
  "ORCHESTRATOR_V2.groups must be an object when present"
);

expectInvalidNoWarnings(
  "rules_not_array_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze({ not: "an-array" }),
  }),
  "ORCHESTRATOR_V2.rules must be an array"
);

expectInvalidNoWarnings(
  "top_level_unsupported_key_invalid",
  Object.freeze({
    ...baseline,
    extra: true,
  }),
  "ORCHESTRATOR_V2 contains unsupported key: extra"
);

expectInvalidNoWarnings(
  "top_level_enabled_non_boolean_invalid",
  Object.freeze({
    ...baseline,
    enabled: "true",
  }),
  "ORCHESTRATOR_V2.enabled must be boolean"
);

expectInvalidNoWarnings(
  "defaults_open_ttl_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      open: Object.freeze({ ttlMs: -1 }),
    }),
  }),
  "defaults.open.ttlMs must be a finite number >= 0 when present"
);

expectInvalidNoWarnings(
  "defaults_open_non_object_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      open: Object.freeze(["bad"]),
    }),
  }),
  "ORCHESTRATOR_V2.defaults.open must be an object when present"
);

expectInvalidNoWarnings(
  "defaults_rule_non_object_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      rule: Object.freeze(["bad"]),
    }),
  }),
  "ORCHESTRATOR_V2.defaults.rule must be an object when present"
);

expectInvalidNoWarnings(
  "defaults_trigger_non_object_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze(["bad"]),
    }),
  }),
  "ORCHESTRATOR_V2.defaults.trigger must be an object when present"
);

expectInvalidNoWarnings(
  "defaults_unsupported_key_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      extra: true,
    }),
  }),
  "ORCHESTRATOR_V2.defaults contains unsupported key: extra"
);

expectInvalidNoWarnings(
  "defaults_rule_match_window_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 50, priority: 10 }),
    }),
  }),
  "defaults.rule.matchWindowMs must be a finite number >= 100 when present"
);

expectInvalidNoWarnings(
  "defaults_rule_cooldown_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      rule: Object.freeze({ cooldownMs: -1, matchWindowMs: 2000, priority: 10 }),
    }),
  }),
  "defaults.rule.cooldownMs must be a finite number >= 0 when present"
);

expectInvalidNoWarnings(
  "defaults_rule_priority_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 2000, priority: "high" }),
    }),
  }),
  "defaults.rule.priority must be a finite number when present"
);

expectInvalidNoWarnings(
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

expectValidNoWarnings(
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

expectInvalidNoWarnings(
  "defaults_trigger_event_array_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        grace: Object.freeze([500]),
      }),
    }),
  }),
  "must be an object"
);

expectInvalidNoWarnings(
  "defaults_trigger_event_key_whitespace_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        " grace ": Object.freeze({ ttlMs: 500 }),
      }),
    }),
  }),
  "contains event id key with leading/trailing whitespace:  grace "
);

expectInvalidNoWarnings(
  "defaults_trigger_duplicate_normalized_event_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        grace: Object.freeze({ ttlMs: 500 }),
        "event.grace": Object.freeze({ ttlMs: 700 }),
      }),
    }),
  }),
  "contains duplicate normalized event id: grace"
);

expectInvalidNoWarnings(
  "defaults_trigger_case_duplicate_normalized_event_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        Grace: Object.freeze({ ttlMs: 500 }),
        grace: Object.freeze({ ttlMs: 700 }),
      }),
    }),
  }),
  "contains duplicate normalized event id: grace"
);

expectInvalidNoWarnings(
  "defaults_trigger_prefixed_case_duplicate_normalized_event_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        "event.Grace": Object.freeze({ ttlMs: 500 }),
        grace: Object.freeze({ ttlMs: 700 }),
      }),
    }),
  }),
  "contains duplicate normalized event id: grace"
);

expectInvalidNoWarnings(
  "defaults_trigger_unknown_event_invalid",
  Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      trigger: Object.freeze({
        event_does_not_exist: Object.freeze({ ttlMs: 500 }),
      }),
    }),
  }),
  "references unknown event id: event_does_not_exist"
);

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "rule_id_non_string_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "rule_id_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "rule_entry_non_object_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      "not-an-object",
    ]),
  }),
  "ORCHESTRATOR_V2.rules[0] must be an object"
);

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "rule_unsupported_key_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "rule_on_non_object_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "rule_open_non_object_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "trigger_non_object_non_shorthand_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_event_key_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_duplicate_normalized_event_invalid",
  Object.freeze({
    ...baseline,
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

expectValidNoWarnings(
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

expectValidNoWarnings(
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

expectValidNoWarnings(
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

expectInvalidNoWarnings(
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

expectValidNoWarnings(
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

expectValidNoWarnings(
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

expectValidNoWarnings(
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

expectValidNoWarnings(
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

expectInvalidNoWarnings(
  "on_word_non_string_array_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_gesture_non_string_array_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_orb_state_non_string_array_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidWithWarning(
  "on_spell_non_string_array_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_spell_non_string_array_rule",
        on: Object.freeze({ spell: Object.freeze({ orbis: true }) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.spell must be a string or array when present",
  "uses on.spell alias; prefer on.word"
);

expectInvalidNoWarnings(
  "on_word_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_word_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_word_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidWithWarning(
  "on_spell_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_spell_non_string_entry_rule",
        on: Object.freeze({ spell: Object.freeze(["orbis", 42]) }),
        trigger: Object.freeze({ grace: true }),
      }),
    ]),
  }),
  "on.word contains non-string selector id: 42",
  "uses on.spell alias; prefer on.word"
);

expectInvalidNoWarnings(
  "on_gesture_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_gesture_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_gesture_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_orb_state_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_orb_state_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "on_orb_state_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
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

expectWarnings(
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
  ["uses on.spell alias; prefer on.word"]
);

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "trigger_shorthand_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_shorthand_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_shorthand_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_shorthand_duplicate_normalized_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_shorthand_array_duplicate_normalized_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_shorthand_case_duplicate_normalized_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "trigger_shorthand_prefixed_case_duplicate_normalized_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "open_id_non_string_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "open_id_whitespace_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
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

expectValidNoWarnings(
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "requires_non_string_array_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "requires_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "consume_non_string_array_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
  "consume_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "requires_window_whitespace_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "requires_window_whitespace_rule",
        on: Object.freeze({ word: "fridgis" }),
        requires: Object.freeze([" wake.main "]),
        trigger: Object.freeze({ aoe_frost: true }),
      }),
    ]),
  }),
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarnings(
  "requires_window_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "requires_window_string_whitespace_rule",
        on: Object.freeze({ word: "fridgis" }),
        requires: " wake.main ",
        trigger: Object.freeze({ aoe_frost: true }),
      }),
    ]),
  }),
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "consume_invalid_window_shape",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules.slice(0, 2),
      Object.freeze({
        id: "consume_invalid_window_shape_rule",
        on: Object.freeze({ word: "domus" }),
        consume: "wake main",
        trigger: Object.freeze({ teleport_home: true }),
      }),
    ]),
  }),
  "consume has invalid window id shape: wake main"
);

expectInvalidNoWarnings(
  "consume_window_whitespace_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "consume_window_whitespace_rule",
        on: Object.freeze({ word: "electrum" }),
        consume: Object.freeze([" wake.main "]),
        trigger: Object.freeze({ aoe_shock: true }),
      }),
    ]),
  }),
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarnings(
  "consume_window_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      ...baseline.rules,
      Object.freeze({
        id: "consume_window_string_whitespace_rule",
        on: Object.freeze({ word: "electrum" }),
        consume: " wake.main ",
        trigger: Object.freeze({ aoe_shock: true }),
      }),
    ]),
  }),
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarnings(
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

expectWarnings(
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
  ["uses on.spell alias; prefer on.word"]
);

expectWarnings(
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
  ["uses open.spells alias; prefer open.words"]
);

expectWarnings(
  "alias_on_spell_and_open_spells_dual_warning",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "alias_dual_rule",
        on: Object.freeze({ spell: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze(["domus"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  Object.freeze([
    "uses on.spell alias; prefer on.word",
    "uses open.spells alias; prefer open.words",
  ])
);

expectValidNoWarnings(
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

expectInvalidWithoutWarning(
  "open_words_precedence_spells_non_string_array_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_spells_non_string_array_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze({ domus: true }),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.spells must be a string or array when present",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithoutWarning(
  "open_words_precedence_spells_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_spells_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze(["domus", 42]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.spells contains non-string word id: 42",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithoutWarning(
  "open_words_precedence_spells_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_precedence_spells_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze([" domus "]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.spells contains word id with leading/trailing whitespace:  domus ",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithFragments(
  "multi_error_aggregation",
  Object.freeze({
    ...baseline,
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

expectValidNoWarnings(
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

expectValidNoWarnings(
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

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
  "open_words_non_string_array_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_non_string_array_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze({ domus: true }),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.words must be a string or array when present"
);

expectInvalidNoWarnings(
  "open_words_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus", 42]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open contains non-string word id: 42"
);

expectInvalidNoWarnings(
  "open_invalid_word_shape_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_invalid_word_shape_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["bad/word"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open contains invalid word id shape: bad/word"
);

expectInvalidNoWarnings(
  "open_words_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze([" domus "]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectInvalidNoWarnings(
  "open_words_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_words_string_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: " domus ",
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectInvalidWithWarning(
  "open_spells_non_string_array_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_non_string_array_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze({ domus: true }),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.spells must be a string or array when present",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarning(
  "open_spells_non_string_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_non_string_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze(["domus", 42]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open contains non-string word id: 42",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarning(
  "open_spells_whitespace_entry_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_whitespace_entry_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: Object.freeze([" domus "]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.spells contains word id with leading/trailing whitespace:  domus ",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarning(
  "open_spells_string_whitespace_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_spells_string_whitespace_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          spells: " domus ",
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.spells contains word id with leading/trailing whitespace:  domus ",
  "uses open.spells alias; prefer open.words"
);

expectWarnings(
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
  ["uses on.spell alias; prefer on.word"]
);

expectWarnings(
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
  ["uses on.spell alias; prefer on.word"]
);

expectWarnings(
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
  ["uses on.spell alias; prefer on.word"]
);

expectWarnings(
  "on_spell_alias_with_open_words_precedence_only_on_warning",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "on_spell_alias_with_open_words_precedence_rule",
        on: Object.freeze({ spell: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: Object.freeze(["domus"]),
          spells: Object.freeze(["__unknown_wake_word__"]),
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  ["uses on.spell alias; prefer on.word"]
);

expectInvalidWithWarning(
  "on_word_precedence_with_invalid_spell_entry_invalid",
  Object.freeze({
    ...baseline,
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
  "on.spell contains non-string selector id: 42",
  "uses on.spell alias; prefer on.word"
);

expectInvalidWithWarning(
  "on_word_precedence_with_whitespace_spell_entry_invalid",
  Object.freeze({
    ...baseline,
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
  "on.spell contains selector id with leading/trailing whitespace:  domus ",
  "uses on.spell alias; prefer on.word"
);

expectWarnings(
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
  ["uses open.spells alias; prefer open.words"]
);

expectInvalidWithWarning(
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
  "open references unknown/inactive word id: __unknown_wake_word__",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarning(
  "open_spells_comma_unknown_invalid",
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
  "open references unknown/inactive word id: __unknown_wake_word__",
  "uses open.spells alias; prefer open.words"
);

expectWarnings(
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
  ["uses open.spells alias; prefer open.words"]
);

expectValidNoWarnings(
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

expectInvalidNoWarnings(
  "groups_key_whitespace_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "key must not include leading/trailing whitespace"
);

expectInvalidNoWarnings(
  "groups_key_shape_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "key has invalid shape: bad group"
);

expectInvalidNoWarnings(
  "open_group_ref_whitespace_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.words group ref must not include leading/trailing whitespace after @: @ valid_group"
);

expectInvalidNoWarnings(
  "open_group_ref_shape_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.words group ref has invalid shape: @bad/group"
);

expectInvalidNoWarnings(
  "open_group_ref_empty_name_invalid",
  Object.freeze({
    ...baseline,
    rules: Object.freeze([
      Object.freeze({
        id: "open_group_ref_empty_name_rule",
        on: Object.freeze({ word: "orbis" }),
        open: Object.freeze({
          id: "wake.main",
          words: "@",
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "open.words group ref must include a name: @"
);

expectInvalidNoWarnings(
  "groups_empty_array_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "must be a non-empty array"
);

expectInvalidNoWarnings(
  "groups_unknown_word_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "references unknown/inactive word id: __unknown_wake_word__"
);

expectInvalidNoWarnings(
  "groups_invalid_word_shape_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "contains invalid word id shape: bad/word"
);

expectInvalidNoWarnings(
  "groups_non_string_word_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "contains non-string word id: 42"
);

expectInvalidNoWarnings(
  "groups_duplicate_after_normalization_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "contains duplicate word id: pyro"
);

expectInvalidNoWarnings(
  "groups_word_whitespace_invalid",
  Object.freeze({
    ...baseline,
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
          ttlMs: 1200,
        }),
      }),
    ]),
  }),
  "contains word id with leading/trailing whitespace:  domus "
);

expectInvalidNoWarnings(
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

expectInvalidNoWarnings(
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
