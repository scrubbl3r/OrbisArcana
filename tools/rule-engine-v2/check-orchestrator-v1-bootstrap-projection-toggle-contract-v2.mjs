import { hydrateReceiverBootstrapState, RULE_ENGINE_SOURCES } from "../../src/runtime/receiver-bootstrap.js";
import {
  INTERACTIONS_V2,
  buildRuleEngineFromOrchestratorV1,
  projectOrchestratorV1FromInteractionsV2,
  validateOrchestratorV1,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { assertSchemaSourceV2 } from "./check-schema-source-v2.mjs";

const CHECK_TAG = "orchestrator-v1-bootstrap-projection-toggle:v2";
const PASS_MESSAGE = "projection toggle disables auto-projection when orchestrator is empty";

const captured = {
  ruleSchema: null,
};

hydrateReceiverBootstrapState(
  {
    RULE_ENGINE_POLICY_CONTROL: Object.freeze({
      version: "2",
      signals: Object.freeze([]),
      windows: Object.freeze([]),
      events: Object.freeze([]),
      rules: Object.freeze([]),
      eventRuntimeBindings: Object.freeze({}),
    }),
    validateRuleEngineConfig: () => [],
    ORCHESTRATOR_V1: Object.freeze({
      version: "1",
      enabled: true,
      defaults: Object.freeze({}),
      rules: Object.freeze([]),
    }),
    ORCHESTRATOR_V1_BOOTSTRAP: Object.freeze({
      useInReceiverBootstrap: true,
      projectFromInteractionsWhenOrchestratorEmpty: false,
    }),
    INTERACTIONS_V2,
    INTERACTIONS_V2_BOOTSTRAP: Object.freeze({ useInReceiverBootstrap: true }),
    buildRuleEngineFromOrchestratorV1,
    projectOrchestratorV1FromInteractionsV2,
    validateOrchestratorV1,
  },
  {
    setRuleSchema: (next) => {
      captured.ruleSchema = next ?? null;
    },
  }
);

const schema = captured.ruleSchema;
assertSchemaSourceV2({
  tag: CHECK_TAG,
  schema,
  expectedSource: RULE_ENGINE_SOURCES.ORCHESTRATOR_V1,
});

const rules = Array.isArray(schema.rules) ? schema.rules : [];
if (rules.length !== 0) {
  failCheck(CHECK_TAG, `expected zero rules with projection disabled, got ${rules.length}`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
