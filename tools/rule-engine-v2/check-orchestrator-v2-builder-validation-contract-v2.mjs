import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v2-builder-validation-contract:v2";
const ERROR_PREFIX = "ORCHESTRATOR_V2 validation failed: ";
const ERROR_DELIMITER = " | ";

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
