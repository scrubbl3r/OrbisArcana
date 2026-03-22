import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";

// Thin adapter used by checks to construct the runtime dispatch system.
export function createCheckDispatchSystem({
  eventBus,
  nowMs,
  resources,
  ruleEngineEnabled = true,
}) {
  return createSpellDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled,
  });
}
