/**
 * @typedef {Object} OrbSystemsBundle
 * @property {Object|null} orbSystem Gameplay orb system (health/damage/revive).
 * @property {Object|null} orbFxSystem Orb FX runtime system.
 * @property {() => void} start Starts orb FX subscriptions/runtime.
 * @property {() => void} stop Stops orb FX subscriptions/runtime.
 * @property {() => void} reset Resets orb FX runtime state.
 */

/**
 * @typedef {Object} CreateOrbSystemsBundleOptions
 * @property {Function} [createOrbSystem] Factory for orb gameplay system.
 * @property {Function} [createOrbFxSystem] Factory for orb FX runtime system.
 * @property {Object} [gameState] Game state container passed to orb system.
 * @property {Object} [eventBus] Event bus passed to orb/orb-fx systems.
 * @property {Object} [orbFxOptions] Orb FX factory options (DOM refs, color provider, etc).
 */

/**
 * Compose orb gameplay + orb FX systems into a single receiver-facing bundle.
 *
 * @param {CreateOrbSystemsBundleOptions} [options]
 * @returns {OrbSystemsBundle}
 */
export function createOrbSystemsBundle({
  createOrbSystem,
  createOrbFxSystem,
  gameState,
  eventBus,
  orbFxOptions,
} = {}){
  const orbSystem = (typeof createOrbSystem === "function")
    ? createOrbSystem({ gameState, eventBus })
    : null;

  const orbFxSystem = (typeof createOrbFxSystem === "function")
    ? createOrbFxSystem({ eventBus, ...(orbFxOptions || {}) })
    : null;

  function start(){
    if (orbFxSystem && typeof orbFxSystem.start === "function") {
      orbFxSystem.start();
    }
  }

  function stop(){
    if (orbFxSystem && typeof orbFxSystem.stop === "function") {
      orbFxSystem.stop();
    }
  }

  function reset(){
    if (orbFxSystem && typeof orbFxSystem.reset === "function") {
      orbFxSystem.reset();
    }
  }

  return {
    orbSystem,
    orbFxSystem,
    start,
    stop,
    reset,
  };
}
