export function createCameraRuntimeState() {
  const state = {
    activeTravel: null,
  };

  function get() {
    return state;
  }

  function reset() {
    state.activeTravel = null;
    return state;
  }

  return {
    get,
    reset,
  };
}
