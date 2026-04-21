import { EVT_CAMERA_INPUT_STATE_CHANGED } from "../camera-input-events.js";
import { createInitialCameraInputState, mergeCameraInputState } from "../camera-input-state.js";

export function createCamStore({
  initialState = createInitialCameraInputState(),
  eventBus = null,
} = {}) {
  let state = mergeCameraInputState(createInitialCameraInputState(), initialState);
  const subscribers = new Set();

  function getState() {
    return state;
  }

  function notify() {
    const snapshot = getState();
    for (const subscriber of subscribers) {
      try {
        subscriber(snapshot);
      } catch (_) {}
    }
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit(EVT_CAMERA_INPUT_STATE_CHANGED, { state: snapshot });
    }
  }

  function publish(nextState) {
    state = mergeCameraInputState(createInitialCameraInputState(), nextState);
    notify();
    return state;
  }

  function patch(partialState = {}) {
    state = mergeCameraInputState(state, partialState);
    notify();
    return state;
  }

  function subscribe(subscriber) {
    if (typeof subscriber !== "function") return () => {};
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }

  function reset() {
    state = createInitialCameraInputState({
      preferredHand: state.config && state.config.preferredHand,
      modelAssetUrl: state.config && state.config.modelAssetUrl,
      wasmRootUrl: state.config && state.config.wasmRootUrl,
    });
    notify();
    return state;
  }

  return {
    getState,
    publish,
    patch,
    subscribe,
    reset,
  };
}

