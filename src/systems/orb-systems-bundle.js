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

