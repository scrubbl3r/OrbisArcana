import {
  hydrateReceiverBootstrapState,
  RULE_ENGINE_SOURCES,
} from "../../src/runtime/receiver-bootstrap.js";
import {
  INTERACTIONS_V2,
  buildRuleEngineFromInteractionsV2,
  buildRuleEngineFromOrchestratorV1,
  projectOrchestratorV1FromInteractionsV2,
  validateOrchestratorV1,
} from "../../src/content/interactions-v2/index.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-bootstrap-parity:v2";

function stableJson(v) {
  return JSON.stringify(v);
}

function runScenario({ orchestratorBootstrap, interactionsBootstrap }) {
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
      ORCHESTRATOR_V1_BOOTSTRAP: Object.freeze(orchestratorBootstrap),
      INTERACTIONS_V2,
      INTERACTIONS_V2_BOOTSTRAP: Object.freeze(interactionsBootstrap),
      buildRuleEngineFromInteractionsV2,
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

  if (!captured.ruleSchema || typeof captured.ruleSchema !== "object") {
    failCheck(CHECK_TAG, "setRuleSchema was not called");
  }
  return captured.ruleSchema;
}

const schemaFromInteractions = runScenario({
  orchestratorBootstrap: {
    useInReceiverBootstrap: false,
    projectFromInteractionsWhenOrchestratorEmpty: true,
  },
  interactionsBootstrap: { useInReceiverBootstrap: true },
});

const schemaFromProjectedOrchestrator = runScenario({
  orchestratorBootstrap: {
    useInReceiverBootstrap: true,
    projectFromInteractionsWhenOrchestratorEmpty: true,
  },
  interactionsBootstrap: { useInReceiverBootstrap: true },
});

const interactionsSource = typeof schemaFromInteractions.source === "string"
  ? schemaFromInteractions.source
  : "";
if (interactionsSource !== RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER) {
  failCheck(
    CHECK_TAG,
    `expected interactions source=${RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER}, got ${interactionsSource}`
  );
}
const projectedSource = typeof schemaFromProjectedOrchestrator.source === "string"
  ? schemaFromProjectedOrchestrator.source
  : "";
if (projectedSource !== RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_PROJECTED) {
  failCheck(
    CHECK_TAG,
    `expected projected source=${RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_PROJECTED}, got ${projectedSource}`
  );
}

const comparableInteractions = {
  ...schemaFromInteractions,
  source: "",
};
const comparableProjected = {
  ...schemaFromProjectedOrchestrator,
  source: "",
};

const lhs = stableJson(comparableInteractions);
const rhs = stableJson(comparableProjected);
if (lhs !== rhs) {
  failCheckWithDetails(CHECK_TAG, "bootstrap parity mismatch", [
    `interactions: ${lhs}`,
    `projected: ${rhs}`,
  ]);
}

reportCheckPass(CHECK_TAG, "bootstrap payload parity holds between interactions and projected orchestrator");
