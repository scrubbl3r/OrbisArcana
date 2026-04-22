export function createCameraRuntimeState() {
  const state = {
    activeTravel: null,
    lastResolvedFrame: null,
  };

  function get() {
    return state;
  }

  function reset() {
    state.activeTravel = null;
    state.lastResolvedFrame = null;
    return state;
  }

  return {
    get,
    reset,
  };
}
