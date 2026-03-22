import { validateOrchestratorV1 } from "../../src/content/interactions-v2/validate-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-validator:v2";
const WORD_ROTA_SELECTOR = "word:rota";
const LEGACY_SPELL_ROTA_SELECTOR = "spell:rota";
const PASS_MESSAGE = "orchestrator validator contract holds for shorthand + defaults";

function hasError(errors, needle) {
  return (Array.isArray(errors) ? errors : []).some(
    (line) => typeof line === "string" && line.includes(needle)
  );
}

function expectValid(caseName, cfg) {
  const errors = validateOrchestratorV1(cfg);
  if (errors.length) {
    failCheckWithDetails(CHECK_TAG, `${caseName} expected valid config`, errors);
  }
}

function expectInvalid(caseName, cfg, expectedNeedle) {
  const errors = validateOrchestratorV1(cfg);
  if (!errors.length) {
    failCheck(CHECK_TAG, `${caseName} expected validation failure`);
  }
  if (!hasError(errors, expectedNeedle)) {
    failCheckWithDetails(
      CHECK_TAG,
      `${caseName} expected error containing "${expectedNeedle}"`,
      errors
    );
  }
}

const baseline = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({
    open: Object.freeze({ ttlMs: 2000 }),
    trigger: Object.freeze({ grace: Object.freeze({ ms: 500 }) }),
    rule: Object.freeze({ cooldownMs: 100, matchWindowMs: 1500, priority: 4 }),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "o_validator_contract",
      on: Object.freeze([WORD_ROTA_SELECTOR, "gesture:spin_y", "orb_state:charged"]),
      open: Object.freeze(["sanctum", "vectus"]),
      trigger: Object.freeze({
        grace: Object.freeze({ args: Object.freeze({ ms: 500 }), mode: "boost" }),
        aoe_electric: true,
      }),
    }),
  ]),
});

function withDefaults(defaultsOverride) {
  return Object.freeze({
    ...baseline,
    defaults: Object.freeze({
      ...baseline.defaults,
      ...defaultsOverride,
    }),
  });
}

function withRuleSet(rules) {
  return Object.freeze({
    ...baseline,
    rules: Object.freeze(rules),
  });
}

function withSingleRule(rule) {
  return withRuleSet([Object.freeze(rule)]);
}

function expectValidWithSingleRule(caseName, rule) {
  expectValid(caseName, withSingleRule(rule));
}

function expectInvalidWithSingleRule(caseName, rule, expectedNeedle) {
  expectInvalid(caseName, withSingleRule(rule), expectedNeedle);
}

expectValid("baseline_shorthand", baseline);

expectValidWithSingleRule(
  "bare_gesture_selector_shorthand",
  {
    id: "o_bare_gesture",
    on: Object.freeze(["spin_y", WORD_ROTA_SELECTOR]),
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "object_selector_comma_shorthand",
  {
    id: "o_object_comma",
    on: Object.freeze({ word: "rota, sanctum", gesture: "spin_y" }),
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "open_comma_shorthand",
  {
    id: "o_open_comma",
    on: Object.freeze([WORD_ROTA_SELECTOR]),
    open: "sanctum, vectus",
  }
);

expectValidWithSingleRule(
  "open_words_alias",
  {
    id: "o_open_words_alias",
    on: Object.freeze([WORD_ROTA_SELECTOR]),
    open: Object.freeze({ words: Object.freeze(["sanctum", "vectus"]) }),
  }
);

expectValidWithSingleRule(
  "trigger_comma_shorthand",
  {
    id: "o_trigger_comma",
    on: Object.freeze([WORD_ROTA_SELECTOR]),
    trigger: "grace, aoe_electric",
  }
);

expectValidWithSingleRule(
  "bare_orb_state_selector_shorthand",
  {
    id: "o_bare_orb_state",
    on: Object.freeze(["charged", WORD_ROTA_SELECTOR]),
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "on_comma_string_shorthand",
  {
    id: "o_on_comma",
    on: "rota, spin_y, charged",
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "on_array_comma_token_shorthand",
  {
    id: "o_on_array_comma",
    on: Object.freeze(["rota, spin_y", "charged"]),
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "on_orbstate_camelcase_alias",
  {
    id: "o_orbstate_alias",
    on: Object.freeze({ word: "rota", orbState: "charged" }),
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "legacy_spell_selector_alias",
  {
    id: "o_legacy_spell_selector",
    on: Object.freeze([LEGACY_SPELL_ROTA_SELECTOR]),
    trigger: Object.freeze(["grace"]),
  }
);

expectValid(
  "open_ttl_alias",
  Object.freeze({
    ...withDefaults({
      open: Object.freeze({ ttl: 2100 }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "o_open_ttl_alias",
        on: Object.freeze([WORD_ROTA_SELECTOR]),
        open: Object.freeze({ spells: Object.freeze(["sanctum"]), ttl: 900 }),
      }),
    ]),
  })
);

expectValid(
  "rule_timing_aliases",
  Object.freeze({
    ...withDefaults({
      rule: Object.freeze({ cooldown: 333, matchWindow: 1666, priority: 2 }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "o_timing_alias",
        on: Object.freeze([WORD_ROTA_SELECTOR]),
        trigger: Object.freeze(["grace"]),
        cooldown: 444,
        matchWindow: 1888,
      }),
    ]),
  })
);

expectValidWithSingleRule(
  "on_plural_aliases",
  {
    id: "o_on_plural_aliases",
    on: Object.freeze({
      spells: "rota, sanctum",
      gestures: "spin_y",
      orbStates: "charged",
    }),
    trigger: Object.freeze(["grace"]),
  }
);

expectValidWithSingleRule(
  "triggers_alias",
  {
    id: "o_triggers_alias",
    on: Object.freeze([WORD_ROTA_SELECTOR]),
    trigger: "grace",
    triggers: "aoe_electric",
  }
);

expectValid(
  "defaults_triggers_alias",
  Object.freeze({
    ...withDefaults({
      trigger: Object.freeze({}),
      triggers: Object.freeze({ grace: Object.freeze({ ms: 777 }) }),
    }),
    rules: Object.freeze([
      Object.freeze({
        id: "o_defaults_triggers_alias",
        on: Object.freeze([WORD_ROTA_SELECTOR]),
        trigger: Object.freeze(["grace"]),
      }),
    ]),
  })
);

expectValid(
  "orb_state_type_aliases",
  withRuleSet([
    Object.freeze({
      id: "o_orb_state_type_aliases",
      on: Object.freeze(["orbstate:charged", WORD_ROTA_SELECTOR]),
      trigger: Object.freeze(["grace"]),
    }),
    Object.freeze({
      id: "o_orb_state_type_aliases_dash",
      on: Object.freeze(["orb-state:charged", "spell:sanctum"]),
      trigger: Object.freeze(["grace"]),
    }),
  ])
);

expectValidWithSingleRule(
  "legacy_gesture_alias_normalization",
  {
    id: "o_legacy_alias",
    on: Object.freeze(["gesture:y_spin", WORD_ROTA_SELECTOR]),
    trigger: Object.freeze(["grace"]),
  }
);

expectInvalidWithSingleRule(
  "duplicate_on_selector",
  {
    id: "o_dup",
    on: Object.freeze([WORD_ROTA_SELECTOR, WORD_ROTA_SELECTOR]),
    trigger: Object.freeze(["grace"]),
  },
  "contains duplicate on selector"
);

expectInvalid(
  "invalid_rule_default_timing",
  withDefaults({
    rule: Object.freeze({ cooldownMs: -1 }),
  }),
  "defaults.rule.cooldownMs must be a finite number >= 0"
);

expectInvalidWithSingleRule(
  "invalid_open_spell",
  {
    id: "o_bad_open",
    on: "rota",
    open: Object.freeze(["not_a_real_spell"]),
  },
  "open references inactive or unknown word id"
);

expectInvalidWithSingleRule(
  "open_words_spells_mismatch",
  {
    id: "o_open_words_spells_mismatch",
    on: "rota",
    open: Object.freeze({
      words: Object.freeze(["sanctum"]),
      spells: Object.freeze(["vectus"]),
    }),
  },
  "words and spells alias must match"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
