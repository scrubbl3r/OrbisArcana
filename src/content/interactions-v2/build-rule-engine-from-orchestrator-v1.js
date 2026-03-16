import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  // Stage 0 scaffold: produce a safe empty projection until compiler slices land.
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: orchestratorV1 && orchestratorV1.enabled !== false,
    signals: Object.freeze([]),
    windows: Object.freeze([]),
    events: Object.freeze([]),
    rules: Object.freeze([]),
    eventRuntimeBindings: Object.freeze({}),
  });
}
