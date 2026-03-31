import { hydrateReceiverBootstrapState, RULE_ENGINE_SOURCES } from "../../src/runtime/receiver-bootstrap.js";
import {
  COMPILED_INTERACTION_GRAPH_V2,
  validateCompiledInteractionGraphV2,
  buildRuleEngineFromCompiledInteractionGraphV2,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-bootstrap-precedence:v2";
const PASS_MESSAGE = "bootstrap source selection uses compiled interaction graph v2 when enabled";

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
    validateSpellRuntimeRouting: () => [],
    validateSpellSchemaIntegrity: () => [],
    validateWordbookV2: () => [],
    COMPILED_INTERACTION_GRAPH_V2,
    COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP: Object.freeze({ useInReceiverBootstrap: true }),
    validateCompiledInteractionGraphV2,
    buildRuleEngineFromCompiledInteractionGraphV2,
  },
  {
    setRuleSchema: (next) => {
      captured.ruleSchema = next ?? null;
    },
  }
);

const schema = captured.ruleSchema;
if (!schema || typeof schema !== "object") {
  failCheck(CHECK_TAG, "setRuleSchema was not called");
}
const source = typeof schema.source === "string" ? schema.source : "";
if (source !== RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2) {
  failCheck(
    CHECK_TAG,
    `expected source=${RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2} when v2 bootstrap enabled, got ${source}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
