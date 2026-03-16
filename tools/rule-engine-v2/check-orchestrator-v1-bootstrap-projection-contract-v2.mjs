import {
  hydrateReceiverBootstrapState,
  RULE_ENGINE_SOURCES,
} from "../../src/runtime/receiver-bootstrap.js";
import {
  INTERACTIONS_V2,
  buildRulesFromInteractionsV2,
  buildRuleEngineFromOrchestratorV1,
  projectOrchestratorV1FromInteractionsV2,
  validateOrchestratorV1,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-bootstrap-projection:v2";

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
      projectFromInteractionsWhenOrchestratorEmpty: true,
    }),
    INTERACTIONS_V2,
    INTERACTIONS_V2_BOOTSTRAP: Object.freeze({ useInReceiverBootstrap: true }),
    buildRuleEngineFromOrchestratorV1,
    projectOrchestratorV1FromInteractionsV2,
    validateOrchestratorV1,
  },
  {
    setRuleSchema: (next) => {
      captured.ruleSchema = next || null;
    },
  }
);

const schema = captured.ruleSchema;
if (!schema || typeof schema !== "object") {
  failCheck(CHECK_TAG, "setRuleSchema was not called");
}
const source = typeof schema.source === "string" ? schema.source : "";

if (source !== RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_PROJECTED) {
  failCheck(
    CHECK_TAG,
    `expected source=${RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_PROJECTED}, got ${source}`
  );
}

const expectedRules = buildRulesFromInteractionsV2(INTERACTIONS_V2);
const actualRules = Array.isArray(schema.rules) ? schema.rules : [];
if (actualRules.length !== expectedRules.length) {
  failCheck(
    CHECK_TAG,
    `projected rules mismatch: expected ${expectedRules.length}, got ${actualRules.length}`
  );
}

reportCheckPass(CHECK_TAG, "bootstrap projection source and rule count contract hold");
