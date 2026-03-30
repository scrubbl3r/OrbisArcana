import { createSpellDispatchSystem } from "../../src/game-runtime/triggers/spell-dispatch-system.js";

// Thin adapter used by checks to construct the runtime dispatch system.
export function createCheckDispatchSystem({
  eventBus,
  nowMs,
  resources,
  ruleEngineEnabled = true,
  allowLegacyFallbacks = false,
  baseSpellBySlot,
}) {
  return createSpellDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled,
    allowLegacyFallbacks,
    baseSpellBySlot,
  });
}
