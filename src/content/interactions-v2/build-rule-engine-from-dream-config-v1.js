import { DREAM_CONFIG_V1 } from "./dream-config-v1.js";

export function buildRuleEngineFromDreamConfigV1({
  dreamConfigV1 = DREAM_CONFIG_V1,
  baseRuleEngine = {},
} = {}) {
  // Stage 0 scaffold: produce a safe empty projection until compiler slices land.
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: dreamConfigV1 && dreamConfigV1.enabled !== false,
    signals: Object.freeze([]),
    windows: Object.freeze([]),
    events: Object.freeze([]),
    rules: Object.freeze([]),
    eventRuntimeBindings: Object.freeze({}),
  });
}
