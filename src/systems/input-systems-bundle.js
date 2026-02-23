import { createInputSystem } from "./input-system.js";
import { createInputDynamicsSystem } from "./input-dynamics-system.js";
import { createInputGestureSystem } from "./input-gesture-system.js";

export function createInputSystemsBundle({
  eventBus,
  gestureConfig = {},
  dynamicsConfig = {},
  gestureHooks = {},
} = {}) {
  const inputSystem = createInputSystem({ eventBus });
  const inputDynamicsSystem = createInputDynamicsSystem({ config: dynamicsConfig });
  const inputGestureSystem = createInputGestureSystem({
    eventBus,
    config: gestureConfig,
    hooks: gestureHooks,
  });

  function start() {
    inputSystem.start();
    inputDynamicsSystem.start();
    inputGestureSystem.start();
  }

  function stop() {
    try { inputGestureSystem.stop(); } catch (_) {}
    try { inputDynamicsSystem.stop(); } catch (_) {}
    try { inputSystem.stop(); } catch (_) {}
  }

  function resetAll(atMs) {
    if (typeof inputSystem.reset === "function") inputSystem.reset(atMs);
    if (typeof inputDynamicsSystem.reset === "function") inputDynamicsSystem.reset(atMs);
    if (typeof inputGestureSystem.reset === "function") inputGestureSystem.reset(atMs);
  }

  return {
    inputSystem,
    inputDynamicsSystem,
    inputGestureSystem,
    start,
    stop,
    resetAll,
  };
}
