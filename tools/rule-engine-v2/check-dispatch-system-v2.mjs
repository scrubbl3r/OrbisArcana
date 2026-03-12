import { createSpellDispatchSystem } from "../../src/systems/spell-dispatch-system.js";

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
