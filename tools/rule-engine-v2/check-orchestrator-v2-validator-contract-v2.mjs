import { validateOrchestratorV2 } from "../../src/content/interactions-v2/validate-orchestrator-v2.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  openUnknownInactiveWordErrorTokenV2,
  OTHER_UNKNOWN_WAKE_WORD_ID_V2,
  UNKNOWN_WAKE_WORD_ID_V2,
  unknownInactiveWordErrorTokenV2,
} from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "orchestrator-v2-validator:v2";
const PASS_MESSAGE = "orchestrator v2 validator contract holds for baseline + errors + compat warnings";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeLabel(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasFragment(candidateLinesInput, fragment) {
  return asArray(candidateLinesInput).some(
    (line) => typeof line === "string" && line.includes(fragment)
  );
}

function assertNeedleValue(caseName, needleKindLabel, needle) {
  if (normalizeLabel(needle).length === 0) {
    failCheck(
      CHECK_TAG,
      `${caseName} expected non-empty ${needleKindLabel} needle`
    );
  }
}

function requireNeedles(caseName, needleKind, needles) {
  const needleKindLabel = normalizeLabel(needleKind);
  if (needleKindLabel.length === 0) {
    failCheck(CHECK_TAG, `${caseName} expected non-empty needle kind label`);
  }
  const lines = asArray(needles);
  if (lines.length === 0) {
    failCheck(CHECK_TAG, `${caseName} expected at least one ${needleKindLabel} needle`);
  }
  for (const needle of lines) {
    assertNeedleValue(caseName, needleKindLabel, needle);
  }
  return lines;
}

function expectValidResult(caseName, config) {
  const validationResult = validateOrchestratorV2(config);
  if (validationResult?.ok !== true) {
    const errorLines = validationResult
      ? getErrors(validationResult)
      : ["missing validation result"];
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected valid config`,
      errorLines
    );
  }
  return validationResult;
}

function expectZeroWarnings(caseName, warningLinesInput) {
  const warnings = asArray(warningLinesInput);
  if (warnings.length > 0) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected zero warnings`,
      warnings
    );
  }
}

function expectWarningContainsInLines(caseName, warningLines, warningNeedle) {
  assertNeedleValue(caseName, "warning", warningNeedle);
  if (!hasFragment(warningLines, warningNeedle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected warning containing "${warningNeedle}"`,
      warningLines
    );
  }
}

function expectWarningExcludesInLines(caseName, warningLines, warningNeedle) {
  assertNeedleValue(caseName, "warning", warningNeedle);
  if (hasFragment(warningLines, warningNeedle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected warning NOT to contain "${warningNeedle}"`,
      warningLines
    );
  }
}

function expectErrorContainsInLines(caseName, errorLinesInput, errorNeedle) {
  assertNeedleValue(caseName, "error", errorNeedle);
  if (!hasFragment(errorLinesInput, errorNeedle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected error containing "${errorNeedle}"`,
      asArray(errorLinesInput)
    );
  }
}

function expectWarningCount(caseName, warningLinesInput, expectedWarningCount) {
  if (!Number.isInteger(expectedWarningCount) || expectedWarningCount < 0) {
    failCheck(
      CHECK_TAG,
      `${caseName} expected warning count must be a non-negative integer`
    );
  }
  const warnings = asArray(warningLinesInput);
  const warningCount = warnings.length;
  if (warningCount !== expectedWarningCount) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected exactly ${expectedWarningCount} warning(s), got ${warningCount}`,
      warnings
    );
  }
}

function getWarnings(validationResult) {
  return asArray(validationResult?.warnings);
}

function getErrors(validationResult) {
  return asArray(validationResult?.errors);
}

function expectValidNoWarnings(caseName, config) {
  const warningLines = getWarnings(expectValidResult(caseName, config));
  expectZeroWarnings(caseName, warningLines);
}

function expectInvalidResult(caseName, config, expectedErrorNeedle) {
  const validationResult = validateOrchestratorV2(config);
  if (validationResult?.ok !== false) {
    failCheck(CHECK_TAG, `${caseName} expected validation failure`);
  }
  const errorLines = getErrors(validationResult);
  expectErrorContainsInLines(caseName, errorLines, expectedErrorNeedle);
  return validationResult;
}

function expectInvalidNoWarnings(caseName, config, expectedErrorNeedle) {
  const warningLines = getWarnings(expectInvalidResult(caseName, config, expectedErrorNeedle));
  expectZeroWarnings(caseName, warningLines);
}

function expectInvalidWithWarning(caseName, config, expectedErrorNeedle, expectedWarningNeedle) {
  const warningLines = getWarnings(expectInvalidResult(caseName, config, expectedErrorNeedle));
  expectWarningContainsInLines(caseName, warningLines, expectedWarningNeedle);
}

function expectInvalidWithoutWarning(
  caseName,
  config,
  expectedErrorNeedle,
  forbiddenWarningNeedle
) {
  const warningLines = getWarnings(expectInvalidResult(caseName, config, expectedErrorNeedle));
  expectWarningExcludesInLines(caseName, warningLines, forbiddenWarningNeedle);
}

function expectInvalidWithFragments(caseName, config, expectedErrorFragments) {
  const errorNeedleValues = requireNeedles(caseName, "error fragment", expectedErrorFragments);
  const errorLines = getErrors(expectInvalidResult(caseName, config, errorNeedleValues[0]));
  const remainingErrorFragments = errorNeedleValues.slice(1);
  for (const errorFragment of remainingErrorFragments) {
    expectErrorContainsInLines(caseName, errorLines, errorFragment);
  }
}

function expectWarnings(caseName, config, expectedWarningNeedles) {
  const warningNeedles = requireNeedles(caseName, "warning", expectedWarningNeedles);
  const warningLines = getWarnings(expectValidResult(caseName, config));
  const expectedWarningCount = warningNeedles.length;
  expectWarningCount(caseName, warningLines, expectedWarningCount);
  for (const warningNeedle of warningNeedles) {
    expectWarningContainsInLines(caseName, warningLines, warningNeedle);
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

function withBaselineOverride(override) {
  return Object.freeze({
    ...baseline,
    ...override,
  });
}

function expectVersionInvalidNoWarnings(caseName, versionValue, expectedErrorNeedle) {
  expectInvalidNoWarnings(
    caseName,
    withBaselineOverride({ version: versionValue }),
    expectedErrorNeedle
  );
}

expectVersionInvalidNoWarnings(
  "missing_version",
  "1",
  'ORCHESTRATOR_V2.version must be "2"'
);

expectVersionInvalidNoWarnings(
  "version_mismatch_invalid",
  "1",
  'ORCHESTRATOR_V2.version must be "2"'
);

expectVersionInvalidNoWarnings(
  "version_non_string_invalid",
  2,
  'ORCHESTRATOR_V2.version must be "2"'
);

expectVersionInvalidNoWarnings(
  "version_whitespace_invalid",
  " 2 ",
  "ORCHESTRATOR_V2.version must not include leading/trailing whitespace:  2 "
);

expectInvalidNoWarnings(
  "defaults_non_object_invalid",
  withBaselineOverride({ defaults: Object.freeze(["not-an-object"]) }),
  "ORCHESTRATOR_V2.defaults must be an object when present"
);

expectInvalidNoWarnings(
  "groups_non_object_invalid",
  withBaselineOverride({ groups: Object.freeze(["not-an-object"]) }),
  "ORCHESTRATOR_V2.groups must be an object when present"
);

expectInvalidNoWarnings(
  "rules_not_array_invalid",
  withBaselineOverride({ rules: Object.freeze({ not: "an-array" }) }),
  "ORCHESTRATOR_V2.rules must be an array"
);

expectInvalidNoWarnings(
  "top_level_unsupported_key_invalid",
  withBaselineOverride({ extra: true }),
  "ORCHESTRATOR_V2 contains unsupported key: extra"
);

expectInvalidNoWarnings(
  "top_level_enabled_non_boolean_invalid",
  withBaselineOverride({ enabled: "true" }),
  "ORCHESTRATOR_V2.enabled must be boolean"
);

function withBaselineDefaults(defaultsOverride) {
  return withBaselineOverride({
    defaults: Object.freeze({
      ...baseline.defaults,
      ...defaultsOverride,
    }),
  });
}

function withRuleSet(rules) {
  return withBaselineOverride({ rules: Object.freeze(rules) });
}

function withSingleRule(rule) {
  return withRuleSet([Object.freeze(rule)]);
}

function expectInvalidNoWarningsWithSingleRule(caseName, rule, expectedErrorNeedle) {
  expectInvalidNoWarnings(caseName, withSingleRule(rule), expectedErrorNeedle);
}

function expectValidNoWarningsWithSingleRule(caseName, rule) {
  expectValidNoWarnings(caseName, withSingleRule(rule));
}

function expectInvalidWithWarningWithSingleRule(
  caseName,
  rule,
  expectedErrorNeedle,
  expectedWarningNeedle
) {
  expectInvalidWithWarning(
    caseName,
    withSingleRule(rule),
    expectedErrorNeedle,
    expectedWarningNeedle
  );
}

function expectInvalidWithoutWarningWithSingleRule(
  caseName,
  rule,
  expectedErrorNeedle,
  forbiddenWarningNeedle
) {
  expectInvalidWithoutWarning(
    caseName,
    withSingleRule(rule),
    expectedErrorNeedle,
    forbiddenWarningNeedle
  );
}

function expectWarningsWithSingleRule(caseName, rule, expectedWarningNeedles) {
  expectWarnings(caseName, withSingleRule(rule), expectedWarningNeedles);
}

function expectInvalidWithFragmentsWithSingleRule(caseName, rule, expectedErrorFragments) {
  expectInvalidWithFragments(caseName, withSingleRule(rule), expectedErrorFragments);
}

function withAppendedRule(rule) {
  return withRuleSet([...baseline.rules, Object.freeze(rule)]);
}

function withBaselineRulePrefixAndRule(prefixCount, rule) {
  return withRuleSet([...baseline.rules.slice(0, prefixCount), Object.freeze(rule)]);
}

function expectInvalidNoWarningsWithAppendedRule(caseName, rule, expectedErrorNeedle) {
  expectInvalidNoWarnings(caseName, withAppendedRule(rule), expectedErrorNeedle);
}

function expectInvalidNoWarningsWithBaselineRulePrefixAndRule(
  caseName,
  prefixCount,
  rule,
  expectedErrorNeedle
) {
  expectInvalidNoWarnings(
    caseName,
    withBaselineRulePrefixAndRule(prefixCount, rule),
    expectedErrorNeedle
  );
}

function withGroupsAndSingleRule(groupsOverride, rule) {
  return withBaselineOverride({
    groups: Object.freeze({
      ...baseline.groups,
      ...groupsOverride,
    }),
    rules: Object.freeze([Object.freeze(rule)]),
  });
}

function expectValidNoWarningsWithGroupsAndSingleRule(caseName, groupsOverride, rule) {
  expectValidNoWarnings(caseName, withGroupsAndSingleRule(groupsOverride, rule));
}

function expectInvalidNoWarningsWithGroupsAndSingleRule(
  caseName,
  groupsOverride,
  rule,
  expectedErrorNeedle
) {
  expectInvalidNoWarnings(
    caseName,
    withGroupsAndSingleRule(groupsOverride, rule),
    expectedErrorNeedle
  );
}

expectInvalidNoWarnings(
  "defaults_open_ttl_invalid",
  withBaselineDefaults({
    open: Object.freeze({ ttlMs: -1 }),
  }),
  "defaults.open.ttlMs must be a finite number >= 0 when present"
);

expectInvalidNoWarnings(
  "defaults_open_non_object_invalid",
  withBaselineDefaults({
    open: Object.freeze(["bad"]),
  }),
  "ORCHESTRATOR_V2.defaults.open must be an object when present"
);

expectInvalidNoWarnings(
  "defaults_rule_non_object_invalid",
  withBaselineDefaults({
    rule: Object.freeze(["bad"]),
  }),
  "ORCHESTRATOR_V2.defaults.rule must be an object when present"
);

expectInvalidNoWarnings(
  "defaults_trigger_non_object_invalid",
  withBaselineDefaults({
    trigger: Object.freeze(["bad"]),
  }),
  "ORCHESTRATOR_V2.defaults.trigger must be an object when present"
);

expectInvalidNoWarnings(
  "defaults_unsupported_key_invalid",
  withBaselineDefaults({
    extra: true,
  }),
  "ORCHESTRATOR_V2.defaults contains unsupported key: extra"
);

expectInvalidNoWarnings(
  "defaults_rule_match_window_invalid",
  withBaselineDefaults({
    rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 50, priority: 10 }),
  }),
  "defaults.rule.matchWindowMs must be a finite number >= 100 when present"
);

expectInvalidNoWarnings(
  "defaults_rule_cooldown_invalid",
  withBaselineDefaults({
    rule: Object.freeze({ cooldownMs: -1, matchWindowMs: 2000, priority: 10 }),
  }),
  "defaults.rule.cooldownMs must be a finite number >= 0 when present"
);

expectInvalidNoWarnings(
  "defaults_rule_priority_invalid",
  withBaselineDefaults({
    rule: Object.freeze({ cooldownMs: 0, matchWindowMs: 2000, priority: "high" }),
  }),
  "defaults.rule.priority must be a finite number when present"
);

expectInvalidNoWarnings(
  "defaults_trigger_enabled_non_boolean_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: "nope", ttlMs: 500 }),
    }),
  }),
  ".enabled must be boolean when present"
);

expectValidNoWarnings(
  "defaults_trigger_enabled_boolean_valid",
  withBaselineDefaults({
    trigger: Object.freeze({
      ...baseline.defaults.trigger,
      grace: Object.freeze({ enabled: false, ttlMs: 500 }),
    }),
  })
);

expectInvalidNoWarnings(
  "defaults_trigger_event_array_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      grace: Object.freeze([500]),
    }),
  }),
  "must be an object"
);

expectInvalidNoWarnings(
  "defaults_trigger_event_key_whitespace_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      " grace ": Object.freeze({ ttlMs: 500 }),
    }),
  }),
  "contains event id key with leading/trailing whitespace:  grace "
);

expectInvalidNoWarnings(
  "defaults_trigger_duplicate_normalized_event_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      grace: Object.freeze({ ttlMs: 500 }),
      "event.grace": Object.freeze({ ttlMs: 700 }),
    }),
  }),
  "contains duplicate normalized event id: grace"
);

expectInvalidNoWarnings(
  "defaults_trigger_case_duplicate_normalized_event_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      Grace: Object.freeze({ ttlMs: 500 }),
      grace: Object.freeze({ ttlMs: 700 }),
    }),
  }),
  "contains duplicate normalized event id: grace"
);

expectInvalidNoWarnings(
  "defaults_trigger_prefixed_case_duplicate_normalized_event_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      "event.Grace": Object.freeze({ ttlMs: 500 }),
      grace: Object.freeze({ ttlMs: 700 }),
    }),
  }),
  "contains duplicate normalized event id: grace"
);

expectInvalidNoWarnings(
  "defaults_trigger_unknown_event_invalid",
  withBaselineDefaults({
    trigger: Object.freeze({
      event_does_not_exist: Object.freeze({ ttlMs: 500 }),
    }),
  }),
  "references unknown event id: event_does_not_exist"
);

expectInvalidNoWarningsWithSingleRule(
  "invalid_rule_id_shape",
  {
    id: "bad rule id",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  "ORCHESTRATOR_V2.rules[] id has invalid shape: bad rule id"
);

expectInvalidNoWarningsWithSingleRule(
  "rule_id_non_string_invalid",
  {
    id: 123,
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  "ORCHESTRATOR_V2.rules[] id must be a string"
);

expectInvalidNoWarningsWithSingleRule(
  "rule_id_whitespace_invalid",
  {
    id: " bad_rule_id ",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  "ORCHESTRATOR_V2.rules[] id must not include leading/trailing whitespace:  bad_rule_id "
);

expectInvalidNoWarnings(
  "rule_entry_non_object_invalid",
  withRuleSet(["not-an-object"]),
  "ORCHESTRATOR_V2.rules[0] must be an object"
);

expectInvalidNoWarningsWithBaselineRulePrefixAndRule(
  "unknown_trigger_event",
  2,
  {
    id: "bad_event",
    on: Object.freeze({ word: "pyro" }),
    trigger: Object.freeze({ event_does_not_exist: true }),
  },
  "references unknown event id"
);

expectInvalidNoWarningsWithSingleRule(
  "rule_unsupported_key_invalid",
  {
    id: "rule_unsupported_key",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: true }),
    extra: true,
  },
  "contains unsupported key: extra"
);

expectInvalidNoWarningsWithSingleRule(
  "rule_on_non_object_invalid",
  {
    id: "rule_on_non_object",
    on: "orbis",
    trigger: Object.freeze({ grace: true }),
  },
  "rule rule_on_non_object.on must be an object"
);

expectInvalidNoWarningsWithSingleRule(
  "rule_open_non_object_invalid",
  {
    id: "rule_open_non_object",
    on: Object.freeze({ word: "orbis" }),
    open: "wake.main",
  },
  "rule rule_open_non_object.open must be an object when present"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_event_args_array_invalid",
  {
    id: "trigger_args_array_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: Object.freeze([500]) }),
  },
  "must be boolean or object args"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_non_object_non_shorthand_invalid",
  {
    id: "trigger_non_object_non_shorthand_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: 123,
  },
  "trigger must be a string, array, or object"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_event_key_whitespace_invalid",
  {
    id: "trigger_event_key_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ " grace ": true }),
  },
  "contains event id key with leading/trailing whitespace:  grace "
);

expectInvalidNoWarningsWithSingleRule(
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

expectValidNoWarningsWithSingleRule(
  "trigger_boolean_false_valid",
  {
    id: "trigger_false_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({ grace: false }),
  }
);

expectValidNoWarningsWithSingleRule(
  "trigger_object_enabled_false_with_args_valid",
  {
    id: "trigger_object_enabled_false_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: false, ttlMs: 700 }),
    }),
  }
);

expectValidNoWarningsWithSingleRule(
  "trigger_object_enabled_true_with_args_valid",
  {
    id: "trigger_object_enabled_true_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze({
      grace: Object.freeze({ enabled: true, ttlMs: 900 }),
    }),
  }
);

expectInvalidNoWarningsWithSingleRule(
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

expectValidNoWarningsWithSingleRule(
  "trigger_shorthand_string_valid",
  {
    id: "trigger_shorthand_string_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "grace",
  }
);

expectValidNoWarningsWithSingleRule(
  "trigger_shorthand_array_valid",
  {
    id: "trigger_shorthand_array_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["grace", "teleport_home"]),
  }
);

expectValidNoWarningsWithSingleRule(
  "trigger_shorthand_comma_string_valid",
  {
    id: "trigger_shorthand_comma_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "grace, teleport_home",
  }
);

expectValidNoWarningsWithSingleRule(
  "on_word_comma_string_valid",
  {
    id: "on_word_comma_string_rule",
    on: Object.freeze({ word: "orbis, pyro" }),
    trigger: Object.freeze({ grace: true }),
  }
);

expectInvalidNoWarningsWithSingleRule(
  "on_word_non_string_array_invalid",
  {
    id: "on_word_non_string_array_rule",
    on: Object.freeze({ word: Object.freeze({ orbis: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word must be a string or array when present"
);

expectInvalidNoWarningsWithSingleRule(
  "on_spin_non_string_array_invalid",
  {
    id: "on_spin_non_string_array_rule",
    on: Object.freeze({ spin: Object.freeze({ y: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin must be a string or array when present"
);

expectInvalidNoWarningsWithSingleRule(
  "on_orb_state_non_string_array_invalid",
  {
    id: "on_orb_state_non_string_array_rule",
    on: Object.freeze({ orb_state: Object.freeze({ charged: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state must be a string or array when present"
);

expectInvalidWithWarningWithSingleRule(
  "on_spell_non_string_array_invalid",
  {
    id: "on_spell_non_string_array_rule",
    on: Object.freeze({ spell: Object.freeze({ orbis: true }) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spell must be a string or array when present",
  "uses on.spell alias; prefer on.word"
);

expectInvalidNoWarningsWithSingleRule(
  "on_word_non_string_entry_invalid",
  {
    id: "on_word_non_string_entry_rule",
    on: Object.freeze({ word: Object.freeze(["orbis", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains non-string selector id: 42"
);

expectInvalidNoWarningsWithSingleRule(
  "on_word_whitespace_entry_invalid",
  {
    id: "on_word_whitespace_entry_rule",
    on: Object.freeze({ word: Object.freeze([" orbis "]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains selector id with leading/trailing whitespace:  orbis "
);

expectInvalidNoWarningsWithSingleRule(
  "on_word_string_whitespace_invalid",
  {
    id: "on_word_string_whitespace_rule",
    on: Object.freeze({ word: " orbis " }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains selector id with leading/trailing whitespace:  orbis "
);

expectInvalidWithWarningWithSingleRule(
  "on_spell_non_string_entry_invalid",
  {
    id: "on_spell_non_string_entry_rule",
    on: Object.freeze({ spell: Object.freeze(["orbis", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.word contains non-string selector id: 42",
  "uses on.spell alias; prefer on.word"
);

expectInvalidNoWarningsWithSingleRule(
  "on_spin_non_string_entry_invalid",
  {
    id: "on_spin_non_string_entry_rule",
    on: Object.freeze({ spin: Object.freeze(["y", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin contains non-string selector id: 42"
);

expectInvalidNoWarningsWithSingleRule(
  "on_spin_whitespace_entry_invalid",
  {
    id: "on_spin_whitespace_entry_rule",
    on: Object.freeze({ spin: Object.freeze([" y "]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin contains selector id with leading/trailing whitespace:  y "
);

expectInvalidNoWarningsWithSingleRule(
  "on_spin_string_whitespace_invalid",
  {
    id: "on_spin_string_whitespace_rule",
    on: Object.freeze({ spin: " y " }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spin contains selector id with leading/trailing whitespace:  y "
);

expectInvalidNoWarningsWithSingleRule(
  "on_orb_state_non_string_entry_invalid",
  {
    id: "on_orb_state_non_string_entry_rule",
    on: Object.freeze({ orb_state: Object.freeze(["charged", 42]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state contains non-string selector id: 42"
);

expectInvalidNoWarningsWithSingleRule(
  "on_orb_state_whitespace_entry_invalid",
  {
    id: "on_orb_state_whitespace_entry_rule",
    on: Object.freeze({ orb_state: Object.freeze([" charged "]) }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state contains selector id with leading/trailing whitespace:  charged "
);

expectInvalidNoWarningsWithSingleRule(
  "on_orb_state_string_whitespace_invalid",
  {
    id: "on_orb_state_string_whitespace_rule",
    on: Object.freeze({ orb_state: " charged " }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.orb_state contains selector id with leading/trailing whitespace:  charged "
);

expectInvalidNoWarningsWithSingleRule(
  "on_word_comma_empty_invalid",
  {
    id: "on_word_comma_empty_rule",
    on: Object.freeze({ word: " , " }),
    trigger: Object.freeze({ grace: true }),
  },
  "must define on selectors"
);

expectWarningsWithSingleRule(
  "on_spell_comma_string_compat_warning",
  {
    id: "on_spell_comma_string_rule",
    on: Object.freeze({ spell: "orbis, pyro" }),
    trigger: Object.freeze({ grace: true }),
  },
  ["uses on.spell alias; prefer on.word"]
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_empty_invalid",
  {
    id: "trigger_shorthand_empty_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "",
  },
  "shorthand must contain at least one event id"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_non_string_entry_invalid",
  {
    id: "trigger_shorthand_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["grace", 42]),
  },
  "shorthand contains non-string event id: 42"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_whitespace_entry_invalid",
  {
    id: "trigger_shorthand_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze([" grace "]),
  },
  "shorthand contains event id with leading/trailing whitespace:  grace "
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_string_whitespace_invalid",
  {
    id: "trigger_shorthand_string_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: " grace ",
  },
  "shorthand contains event id with leading/trailing whitespace:  grace "
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: "grace, grace",
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_array_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_array_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["grace", "event.grace"]),
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_case_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_case_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["Grace", "grace"]),
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectInvalidNoWarningsWithSingleRule(
  "trigger_shorthand_prefixed_case_duplicate_normalized_invalid",
  {
    id: "trigger_shorthand_prefixed_case_duplicate_normalized_rule",
    on: Object.freeze({ word: "orbis" }),
    trigger: Object.freeze(["event.Grace", "grace"]),
  },
  "shorthand contains duplicate normalized event id: grace"
);

expectInvalidNoWarningsWithSingleRule(
  "invalid_open_window_id_shape",
  {
    id: "bad_open_id_shape",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake bad",
      words: Object.freeze(["domus"]),
    }),
  },
  "open.id has invalid shape: wake bad"
);

expectInvalidNoWarningsWithSingleRule(
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

expectInvalidNoWarningsWithSingleRule(
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

expectInvalidNoWarnings(
  "duplicate_open_window_id",
  withRuleSet([
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
  "open.id duplicates previously opened window: wake.main"
);

expectInvalidNoWarningsWithAppendedRule(
  "unknown_requires_window",
  {
    id: "bad_window_ref",
    on: Object.freeze({ word: "fridgis" }),
    requires: Object.freeze(["wake.unknown"]),
    trigger: Object.freeze({ aoe_frost: true }),
  },
  "references unknown window id: wake.unknown"
);

expectValidNoWarnings(
  "requires_consume_comma_string_valid",
  withRuleSet([
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
  ])
);

expectInvalidNoWarningsWithSingleRule(
  "requires_comma_duplicate_invalid",
  {
    id: "requires_comma_duplicate_rule",
    on: Object.freeze({ word: "domus" }),
    requires: "wake.main, wake.main",
    trigger: Object.freeze({ teleport_home: true }),
  },
  "requires contains duplicate window id: wake.main"
);

expectInvalidNoWarningsWithSingleRule(
  "requires_non_string_array_invalid",
  {
    id: "requires_non_string_array_rule",
    on: Object.freeze({ word: "domus" }),
    requires: Object.freeze({ wake: "main" }),
    trigger: Object.freeze({ teleport_home: true }),
  },
  "requires must be a string or array when present"
);

expectInvalidNoWarningsWithSingleRule(
  "requires_non_string_entry_invalid",
  {
    id: "requires_non_string_entry_rule",
    on: Object.freeze({ word: "domus" }),
    requires: Object.freeze(["wake.main", 42]),
    trigger: Object.freeze({ teleport_home: true }),
  },
  "requires contains non-string window id: 42"
);

expectInvalidNoWarningsWithSingleRule(
  "consume_comma_duplicate_invalid",
  {
    id: "consume_comma_duplicate_rule",
    on: Object.freeze({ word: "domus" }),
    consume: "wake.main, wake.main",
    trigger: Object.freeze({ teleport_home: true }),
  },
  "consume contains duplicate window id: wake.main"
);

expectInvalidNoWarningsWithSingleRule(
  "consume_non_string_array_invalid",
  {
    id: "consume_non_string_array_rule",
    on: Object.freeze({ word: "domus" }),
    consume: Object.freeze({ wake: "main" }),
    trigger: Object.freeze({ teleport_home: true }),
  },
  "consume must be a string or array when present"
);

expectInvalidNoWarningsWithSingleRule(
  "consume_non_string_entry_invalid",
  {
    id: "consume_non_string_entry_rule",
    on: Object.freeze({ word: "domus" }),
    consume: Object.freeze(["wake.main", 42]),
    trigger: Object.freeze({ teleport_home: true }),
  },
  "consume contains non-string window id: 42"
);

expectInvalidNoWarningsWithAppendedRule(
  "invalid_requires_window_shape",
  {
    id: "bad_requires_window_shape",
    on: Object.freeze({ word: "fridgis" }),
    requires: Object.freeze(["wake main"]),
    trigger: Object.freeze({ aoe_frost: true }),
  },
  "requires has invalid window id shape: wake main"
);

expectInvalidNoWarningsWithAppendedRule(
  "requires_window_whitespace_invalid",
  {
    id: "requires_window_whitespace_rule",
    on: Object.freeze({ word: "fridgis" }),
    requires: Object.freeze([" wake.main "]),
    trigger: Object.freeze({ aoe_frost: true }),
  },
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarningsWithAppendedRule(
  "requires_window_string_whitespace_invalid",
  {
    id: "requires_window_string_whitespace_rule",
    on: Object.freeze({ word: "fridgis" }),
    requires: " wake.main ",
    trigger: Object.freeze({ aoe_frost: true }),
  },
  "requires contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarningsWithAppendedRule(
  "invalid_consume_window_shape",
  {
    id: "bad_consume_window_shape",
    on: Object.freeze({ word: "electrum" }),
    consume: Object.freeze(["wake main"]),
    trigger: Object.freeze({ aoe_shock: true }),
  },
  "consume has invalid window id shape: wake main"
);

expectInvalidNoWarningsWithBaselineRulePrefixAndRule(
  "consume_invalid_window_shape",
  2,
  {
    id: "consume_invalid_window_shape_rule",
    on: Object.freeze({ word: "domus" }),
    consume: "wake main",
    trigger: Object.freeze({ teleport_home: true }),
  },
  "consume has invalid window id shape: wake main"
);

expectInvalidNoWarningsWithAppendedRule(
  "consume_window_whitespace_invalid",
  {
    id: "consume_window_whitespace_rule",
    on: Object.freeze({ word: "electrum" }),
    consume: Object.freeze([" wake.main "]),
    trigger: Object.freeze({ aoe_shock: true }),
  },
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarningsWithAppendedRule(
  "consume_window_string_whitespace_invalid",
  {
    id: "consume_window_string_whitespace_rule",
    on: Object.freeze({ word: "electrum" }),
    consume: " wake.main ",
    trigger: Object.freeze({ aoe_shock: true }),
  },
  "consume contains window id with leading/trailing whitespace:  wake.main "
);

expectInvalidNoWarningsWithAppendedRule(
  "unknown_consume_window",
  {
    id: "bad_consume_window_ref",
    on: Object.freeze({ word: "electrum" }),
    consume: Object.freeze(["wake.unknown"]),
    trigger: Object.freeze({ aoe_shock: true }),
  },
  "references unknown window id: wake.unknown"
);

expectWarningsWithSingleRule(
  "compat_on_spell",
  {
    id: "compat_rule",
    on: Object.freeze({ spell: "orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  ["uses on.spell alias; prefer on.word"]
);

expectWarningsWithSingleRule(
  "compat_open_spells",
  {
    id: "compat_open_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze(["domus"]),
      ttlMs: 1200,
    }),
  },
  ["uses open.spells alias; prefer open.words"]
);

expectWarningsWithSingleRule(
  "compat_on_spell_and_open_spells_dual_warning",
  {
    id: "compat_dual_rule",
    on: Object.freeze({ spell: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze(["domus"]),
      ttlMs: 1200,
    }),
  },
  Object.freeze([
    "uses on.spell alias; prefer on.word",
    "uses open.spells alias; prefer open.words",
  ])
);

expectValidNoWarningsWithSingleRule(
  "open_words_precedence_valid_when_spells_unknown",
  {
    id: "open_words_precedence_valid",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze([UNKNOWN_WAKE_WORD_ID_V2]),
      ttlMs: 1200,
    }),
  }
);

expectInvalidWithoutWarningWithSingleRule(
  "open_words_precedence_spells_non_string_array_invalid",
  {
    id: "open_words_precedence_spells_non_string_array_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze({ domus: true }),
      ttlMs: 1200,
    }),
  },
  "open.spells must be a string or array when present",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithoutWarningWithSingleRule(
  "open_words_precedence_spells_non_string_entry_invalid",
  {
    id: "open_words_precedence_spells_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze(["domus", 42]),
      ttlMs: 1200,
    }),
  },
  "open.spells contains non-string word id: 42",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithoutWarningWithSingleRule(
  "open_words_precedence_spells_whitespace_entry_invalid",
  {
    id: "open_words_precedence_spells_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze([" domus "]),
      ttlMs: 1200,
    }),
  },
  "open.spells contains word id with leading/trailing whitespace:  domus ",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithFragmentsWithSingleRule(
  "multi_error_aggregation",
  {
    id: "bad rule id",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({ id: "wake bad", words: Object.freeze(["domus"]) }),
  },
  Object.freeze([
    "ORCHESTRATOR_V2.rules[] id has invalid shape: bad rule id",
    "open.id has invalid shape: wake bad",
  ])
);

expectValidNoWarningsWithSingleRule(
  "open_words_comma_string_valid",
  {
    id: "open_words_comma_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "domus, pyro",
      ttlMs: 1200,
    }),
  }
);

expectValidNoWarningsWithSingleRule(
  "open_words_comma_precedence_valid_when_spells_comma_unknown",
  {
    id: "open_words_comma_precedence_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "domus, pyro",
      spells: `${UNKNOWN_WAKE_WORD_ID_V2}, ${OTHER_UNKNOWN_WAKE_WORD_ID_V2}`,
      ttlMs: 1200,
    }),
  }
);

expectInvalidNoWarningsWithSingleRule(
  "open_words_precedence_invalid_when_words_unknown",
  {
    id: "open_words_precedence_invalid",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze([UNKNOWN_WAKE_WORD_ID_V2]),
      spells: Object.freeze(["domus"]),
      ttlMs: 1200,
    }),
  },
  openUnknownInactiveWordErrorTokenV2(UNKNOWN_WAKE_WORD_ID_V2)
);

expectInvalidNoWarningsWithSingleRule(
  "open_words_non_string_array_invalid",
  {
    id: "open_words_non_string_array_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze({ domus: true }),
      ttlMs: 1200,
    }),
  },
  "open.words must be a string or array when present"
);

expectInvalidNoWarningsWithSingleRule(
  "open_words_non_string_entry_invalid",
  {
    id: "open_words_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus", 42]),
      ttlMs: 1200,
    }),
  },
  "open contains non-string word id: 42"
);

expectInvalidNoWarningsWithSingleRule(
  "open_invalid_word_shape_invalid",
  {
    id: "open_invalid_word_shape_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["bad/word"]),
      ttlMs: 1200,
    }),
  },
  "open contains invalid word id shape: bad/word"
);

expectInvalidNoWarningsWithSingleRule(
  "open_words_whitespace_entry_invalid",
  {
    id: "open_words_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze([" domus "]),
      ttlMs: 1200,
    }),
  },
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectInvalidNoWarningsWithSingleRule(
  "open_words_string_whitespace_invalid",
  {
    id: "open_words_string_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: " domus ",
      ttlMs: 1200,
    }),
  },
  "open.words contains word id with leading/trailing whitespace:  domus "
);

expectInvalidWithWarningWithSingleRule(
  "open_spells_non_string_array_invalid",
  {
    id: "open_spells_non_string_array_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze({ domus: true }),
      ttlMs: 1200,
    }),
  },
  "open.spells must be a string or array when present",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarningWithSingleRule(
  "open_spells_non_string_entry_invalid",
  {
    id: "open_spells_non_string_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze(["domus", 42]),
      ttlMs: 1200,
    }),
  },
  "open contains non-string word id: 42",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarningWithSingleRule(
  "open_spells_whitespace_entry_invalid",
  {
    id: "open_spells_whitespace_entry_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze([" domus "]),
      ttlMs: 1200,
    }),
  },
  "open.spells contains word id with leading/trailing whitespace:  domus ",
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarningWithSingleRule(
  "open_spells_string_whitespace_invalid",
  {
    id: "open_spells_string_whitespace_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: " domus ",
      ttlMs: 1200,
    }),
  },
  "open.spells contains word id with leading/trailing whitespace:  domus ",
  "uses open.spells alias; prefer open.words"
);

expectWarningsWithSingleRule(
  "compat_on_spell_prefixed",
  {
    id: "compat_on_prefixed",
    on: Object.freeze({ spell: "word.orbis" }),
    trigger: Object.freeze({ grace: true }),
  },
  ["uses on.spell alias; prefer on.word"]
);

expectWarningsWithSingleRule(
  "on_word_precedence_over_spell_compat",
  {
    id: "on_word_precedence_rule",
    on: Object.freeze({
      word: "orbis",
      spell: UNKNOWN_WAKE_WORD_ID_V2,
    }),
    trigger: Object.freeze({ grace: true }),
  },
  ["uses on.spell alias; prefer on.word"]
);

expectWarningsWithSingleRule(
  "on_word_precedence_over_valid_spell_compat",
  {
    id: "on_word_precedence_valid_compat_rule",
    on: Object.freeze({
      word: "orbis",
      spell: "domus",
    }),
    trigger: Object.freeze({ grace: true }),
  },
  ["uses on.spell alias; prefer on.word"]
);

expectWarningsWithSingleRule(
  "on_spell_compat_with_open_words_precedence_only_on_warning",
  {
    id: "on_spell_compat_with_open_words_precedence_rule",
    on: Object.freeze({ spell: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: Object.freeze(["domus"]),
      spells: Object.freeze([UNKNOWN_WAKE_WORD_ID_V2]),
      ttlMs: 1200,
    }),
  },
  ["uses on.spell alias; prefer on.word"]
);

expectInvalidWithWarningWithSingleRule(
  "on_word_precedence_with_invalid_spell_entry_invalid",
  {
    id: "on_word_precedence_invalid_spell_entry_rule",
    on: Object.freeze({
      word: "orbis",
      spell: Object.freeze(["domus", 42]),
    }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spell contains non-string selector id: 42",
  "uses on.spell alias; prefer on.word"
);

expectInvalidWithWarningWithSingleRule(
  "on_word_precedence_with_whitespace_spell_entry_invalid",
  {
    id: "on_word_precedence_whitespace_spell_entry_rule",
    on: Object.freeze({
      word: "orbis",
      spell: Object.freeze([" domus "]),
    }),
    trigger: Object.freeze({ grace: true }),
  },
  "on.spell contains selector id with leading/trailing whitespace:  domus ",
  "uses on.spell alias; prefer on.word"
);

expectWarningsWithSingleRule(
  "compat_open_spells_comma_string",
  {
    id: "compat_open_comma_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: "domus, pyro",
      ttlMs: 1200,
    }),
  },
  ["uses open.spells alias; prefer open.words"]
);

expectInvalidWithWarningWithSingleRule(
  "compat_open_spells_comma_string_unknown_invalid",
  {
    id: "compat_open_comma_unknown_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: `${UNKNOWN_WAKE_WORD_ID_V2}, ${OTHER_UNKNOWN_WAKE_WORD_ID_V2}`,
      ttlMs: 1200,
    }),
  },
  openUnknownInactiveWordErrorTokenV2(UNKNOWN_WAKE_WORD_ID_V2),
  "uses open.spells alias; prefer open.words"
);

expectInvalidWithWarningWithSingleRule(
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
  openUnknownInactiveWordErrorTokenV2(UNKNOWN_WAKE_WORD_ID_V2),
  "uses open.spells alias; prefer open.words"
);

expectWarningsWithSingleRule(
  "compat_open_spells_prefixed",
  {
    id: "compat_open_prefixed",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      spells: Object.freeze(["word.domus", "spell.pyro"]),
      ttlMs: 1200,
    }),
  },
  ["uses open.spells alias; prefer open.words"]
);

expectValidNoWarningsWithGroupsAndSingleRule(
  "groups_prefixed_word_ids",
  {
    prefixed_words: Object.freeze(["word.domus", "spell.pyro"]),
  },
  {
    id: "group_prefixed_open",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@prefixed_words",
      ttlMs: 1200,
    }),
  }
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "key must not include leading/trailing whitespace"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "key has invalid shape: bad group"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "open.words group ref must not include leading/trailing whitespace after @: @ valid_group"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "open.words group ref has invalid shape: @bad/group"
);

expectInvalidNoWarningsWithSingleRule(
  "open_group_ref_empty_name_invalid",
  {
    id: "open_group_ref_empty_name_rule",
    on: Object.freeze({ word: "orbis" }),
    open: Object.freeze({
      id: "wake.main",
      words: "@",
      ttlMs: 1200,
    }),
  },
  "open.words group ref must include a name: @"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "must be a non-empty array"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  unknownInactiveWordErrorTokenV2(UNKNOWN_WAKE_WORD_ID_V2)
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "contains invalid word id shape: bad/word"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "contains non-string word id: 42"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "contains duplicate word id: pyro"
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "contains word id with leading/trailing whitespace:  domus "
);

expectInvalidNoWarningsWithGroupsAndSingleRule(
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
      ttlMs: 1200,
    }),
  },
  "open contains duplicate word id: pyro"
);

expectInvalidNoWarningsWithSingleRule(
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

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
