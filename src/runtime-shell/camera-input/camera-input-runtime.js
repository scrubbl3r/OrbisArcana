import { createCamStore } from "./cam-store/create-cam-store.js?v=20260420f";
import { createInitialCameraInputState } from "./camera-input-state.js?v=20260420f";
import { createCameraInputSteering } from "./camera-input-steering.js?v=20260420f";
import { createCameraInputTracker } from "./camera-input-tracker.js?v=20260420f";

function normalizeErrorMessage(error, fallback = "camera_input_error") {
  if (error && error.message) return String(error.message);
  return String(fallback || "camera_input_error");
}

function deriveFailureCode(error) {
  const name = String(error && error.name || "").trim();
  const message = String(error && error.message || "").trim();
  if (name === "NotAllowedError") return "camera_denied";
  if (name === "NotFoundError") return "camera_not_found";
  if (message === "camera_get_user_media_unavailable") return "camera_get_user_media_unavailable";
  if (message === "camera_video_metadata_failed") return "camera_video_metadata_failed";
  return "camera_runtime_failed";
}

function buildStatusLine(state) {
  const lifecycle = state && state.lifecycle ? state.lifecycle : {};
  const tracking = state && state.tracking ? state.tracking : {};
  if (lifecycle.preloadState === "failed") return "cam:preload_failed";
  if (lifecycle.preloadState === "loading") return "cam:preloading";
  if (lifecycle.permissionState === "denied") return "cam:permission_denied";
  if (tracking.state === "tracking") return `cam:tracking:${String(tracking.handedness || "hand").toLowerCase()}`;
  if (tracking.state === "wrong_hand") return "cam:wrong_hand";
  if (tracking.state === "unstable") return "cam:unstable";
  if (lifecycle.streamState === "active") return "cam:searching";
  if (lifecycle.preloadState === "ready") return "cam:ready";
  return "cam:idle";
}

export function createCameraInputRuntime({
  rootWindow = window,
  rootDocument = document,
  eventBus = null,
  preferredHand = "Left",
  now = () => performance.now(),
} = {}) {
  const initialState = createInitialCameraInputState({
    preferredHand,
    modelAssetUrl: new URL("../../../assets/camera-input/models/hand_landmarker.task", import.meta.url).toString(),
    wasmRootUrl: new URL("../../../vendor/mediapipe/tasks-vision/wasm/", import.meta.url).toString(),
  });
  const camStore = createCamStore({
    initialState,
    eventBus,
  });
  const steering = createCameraInputSteering();
  const tracker = createCameraInputTracker({
    rootWindow,
    rootDocument,
    now,
    preferredHand,
    modelAssetUrl: initialState.config.modelAssetUrl,
    wasmRootUrl: initialState.config.wasmRootUrl,
    onObservation: handleObservation,
  });

  function syncStatusLine(extraDebug = {}) {
    const state = camStore.getState();
    camStore.patch({
      debug: {
        ...extraDebug,
        statusLine: buildStatusLine(state),
      },
    });
  }

  function handleObservation(observation = {}) {
    const tracking = steering.processObservation(observation);
    camStore.patch({
      updatedAtMs: Number(observation.observedAtMs) || now(),
      lifecycle: {
        runtimeState: camStore.getState().lifecycle.streamState === "active" ? "active" : camStore.getState().lifecycle.runtimeState,
        ready: camStore.getState().lifecycle.preloadState === "ready",
      },
      tracking,
      failures: tracking.state === "tracking"
        ? { code: "", message: "" }
        : camStore.getState().failures,
      debug: {
        frameMs: Number(observation.frameMs) || 0,
        fps: Number(observation.fps) || 0,
      },
    });
    syncStatusLine();
  }

  async function preload() {
    camStore.patch({
      updatedAtMs: now(),
      lifecycle: {
        preloadState: "loading",
        runtimeState: "preloading",
        ready: false,
      },
      failures: {
        code: "",
        message: "",
      },
      debug: {
        preloadDetail: "loading_mediapipe",
        lastError: "",
      },
    });
    syncStatusLine();

    try {
      await tracker.preload();
      camStore.patch({
        updatedAtMs: now(),
        lifecycle: {
          preloadState: "ready",
          runtimeState: "ready",
          ready: true,
        },
        debug: {
          preloadDetail: "mediapipe_ready",
        },
      });
      syncStatusLine();
      return camStore.getState();
    } catch (error) {
      camStore.patch({
        updatedAtMs: now(),
        lifecycle: {
          preloadState: "failed",
          runtimeState: "failed",
          ready: false,
        },
        failures: {
          code: deriveFailureCode(error),
          message: normalizeErrorMessage(error, "camera_input_preload_failed"),
        },
        debug: {
          preloadDetail: "mediapipe_failed",
          lastError: normalizeErrorMessage(error, "camera_input_preload_failed"),
        },
      });
      syncStatusLine();
      throw error;
    }
  }

  async function startCalibrationCapture() {
    if (camStore.getState().lifecycle.preloadState !== "ready") {
      await preload();
    }
    camStore.patch({
      updatedAtMs: now(),
      lifecycle: {
        permissionState: "prompting",
        streamState: "starting",
        runtimeState: "starting",
      },
      failures: {
        code: "",
        message: "",
      },
      debug: {
        lastError: "",
      },
    });
    syncStatusLine();

    try {
      await tracker.start();
      camStore.patch({
        updatedAtMs: now(),
        lifecycle: {
          permissionState: "granted",
          streamState: "active",
          runtimeState: "active",
          ready: true,
        },
      });
      syncStatusLine();
      return camStore.getState();
    } catch (error) {
      const code = deriveFailureCode(error);
      camStore.patch({
        updatedAtMs: now(),
        lifecycle: {
          permissionState: code === "camera_denied" ? "denied" : "error",
          streamState: "error",
          runtimeState: "error",
          ready: false,
        },
        failures: {
          code,
          message: normalizeErrorMessage(error, "camera_input_start_failed"),
        },
        debug: {
          lastError: normalizeErrorMessage(error, "camera_input_start_failed"),
        },
      });
      syncStatusLine();
      throw error;
    }
  }

  function stop() {
    tracker.stop();
    steering.reset();
    camStore.patch({
      updatedAtMs: now(),
      lifecycle: {
        streamState: "idle",
        runtimeState: camStore.getState().lifecycle.preloadState === "ready" ? "ready" : "idle",
      },
      tracking: {
        state: "idle",
        handPresent: false,
        confidence: 0,
        handedness: null,
        handednessScore: 0,
        landmarksCount: 0,
      },
    });
    syncStatusLine();
  }

  function destroy() {
    tracker.destroy();
    steering.reset();
  }

  return {
    preload,
    startCalibrationCapture,
    stop,
    destroy,
    getState: camStore.getState,
    subscribe: camStore.subscribe,
    isPreloadReady: () => camStore.getState().lifecycle.preloadState === "ready",
  };
}
