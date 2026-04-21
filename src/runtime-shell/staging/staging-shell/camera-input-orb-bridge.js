import { CAMERA_STEERING_CONFIG_DEFAULT } from "../../../content/input/camera-steering-config-default.js?v=20260420r";
import { createCameraSteeringSystem } from "../../../game-runtime/input/camera-steering-system.js?v=20260420r";

export function createCameraInputOrbBridge({
  cameraInputRuntime = null,
  config = CAMERA_STEERING_CONFIG_DEFAULT,
} = {}) {
  const cameraSteeringSystem = createCameraSteeringSystem({ config });
  let unsubscribe = () => {};

  if (cameraInputRuntime && typeof cameraInputRuntime.subscribe === "function") {
    unsubscribe = cameraInputRuntime.subscribe((cameraState) => {
      cameraSteeringSystem.updateFromCameraState(cameraState, Date.now());
    });
  }
  if (cameraInputRuntime && typeof cameraInputRuntime.getState === "function") {
    cameraSteeringSystem.updateFromCameraState(cameraInputRuntime.getState(), Date.now());
  }

  return {
    getState: () => cameraSteeringSystem.getState(),
    dispose() {
      try { unsubscribe(); } catch (_) {}
    },
  };
}
