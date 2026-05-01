import { createCameraInputRuntime } from "./camera-input-runtime.js?v=20260501b";

export async function bootstrapCameraInput({
  rootWindow = window,
  rootDocument = document,
  eventBus = null,
  preferredHand = "Left",
  cameraInputBackend = "hand",
} = {}) {
  const cameraInputRuntime = createCameraInputRuntime({
    rootWindow,
    rootDocument,
    eventBus,
    preferredHand,
    cameraInputBackend,
  });
  await cameraInputRuntime.preload();
  return cameraInputRuntime;
}
