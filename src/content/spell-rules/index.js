export {
  SIGNAL_DEFINITION_COLLISIONS,
  SIGNAL_DEFINITIONS,
  SIGNAL_DEFINITIONS_BY_ID,
} from "./signal-definitions.js";
export {
  WINDOW_DEFINITIONS,
  WINDOW_DEFINITIONS_BY_ID,
} from "./window-definitions.js";
export {
  EVENT_DEFINITIONS,
  EVENT_DEFINITIONS_BY_ID,
} from "./event-definitions.js";
export {
  EVENT_RUNTIME_BINDINGS,
  EVENT_RUNTIME_BINDINGS_BY_ID,
} from "./event-runtime-bindings.js";
export { RULE_ENGINE_MASTER_CONTROL } from "./rule-engine-master-control.js";
export { validateSpellRules } from "./validate-spell-rules.js";
export { validateRuleEngineConfig } from "./validate-rule-engine-config.js";
export { buildRuleEnginePreviewRuntime } from "./build-rule-engine-preview-runtime.js";

// Legacy alias exports kept for compatibility during migration.
export {
  SIGNAL_DEFINITION_COLLISIONS_V1,
  SIGNAL_DEFINITIONS_V1,
  SIGNAL_DEFINITIONS_V1_BY_ID,
} from "./signal-definitions.js";
export {
  WINDOW_DEFINITIONS_V1,
  WINDOW_DEFINITIONS_V1_BY_ID,
} from "./window-definitions.js";
export {
  EVENT_DEFINITIONS_V1,
  EVENT_DEFINITIONS_V1_BY_ID,
} from "./event-definitions.js";
export {
  EVENT_RUNTIME_BINDINGS_V1,
  EVENT_RUNTIME_BINDINGS_V1_BY_ID,
} from "./event-runtime-bindings.js";
export { RULE_ENGINE_V1_MASTER_CONTROL } from "./rule-engine-master-control.js";
export { validateSpellRulesV1 } from "./validate-spell-rules.js";
export { validateRuleEngineV1Config } from "./validate-rule-engine-config.js";
export { buildRuleEngineV1PreviewRuntime } from "./build-rule-engine-preview-runtime.js";
