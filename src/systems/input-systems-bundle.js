import { createInputSystem } from "./input-system.js";
import { createInputDynamicsSystem } from "./input-dynamics-system.js";
import { createInputGestureSystem } from "./input-gesture-system.js";

/**
 * @typedef {Object} InputSystemsBundle
 * @property {Object} inputSystem Normalized latest-frame input SSOT owner.
 * @property {Object} inputDynamicsSystem Stability/variability detector runtime.
 * @property {Object} inputGestureSystem Shake/flat-spin gesture runtime.
 * @property {() => void} start Starts underlying input systems.
 * @property {() => void} stop Stops underlying input systems.
 * @property {(atMs?: number) => void} resetAll Resets all input system runtime state.
 * @property {(atMs?: number) => void} resetProcessingState Explicit alias for gameplay-driven input detector resets.
 */

/**
 * @typedef {Object} CreateInputSystemsBundleOptions
 * @property {Object} eventBus Event bus with `emit`/`on`.
 * @property {Object} [gestureConfig] Gesture tuning values for input-gesture-system.
 * @property {Object} [dynamicsConfig] Stability/variability tuning for input-dynamics-system.
 * @property {Object} [gestureHooks] Receiver-provided hooks for gesture side effects (lamps, shockwave, etc).
 */

/**
 * Compose the input domain runtime systems used by the receiver shell.
 *
 * Returns a small bundle so the receiver can treat input concerns as one subsystem.
 *
 * @param {CreateInputSystemsBundleOptions} [options]
 * @returns {InputSystemsBundle}
 */
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
    resetProcessingState: resetAll,
  };
}
