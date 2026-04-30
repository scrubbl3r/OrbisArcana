import { createCameraInputRuntime } from "./camera-input-runtime.js?v=20260430a";

export async function bootstrapCameraInput({
  rootWindow = window,
  rootDocument = document,
  eventBus = null,
  preferredHand = "Left",
} = {}) {
  const cameraInputRuntime = createCameraInputRuntime({
    rootWindow,
    rootDocument,
    eventBus,
    preferredHand,
  });
  await cameraInputRuntime.preload();
  return cameraInputRuntime;
}
