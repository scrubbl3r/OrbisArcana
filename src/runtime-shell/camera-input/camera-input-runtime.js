import { createCamStore } from "./cam-store/create-cam-store.js?v=20260420h";
import { createInitialCameraInputState } from "./camera-input-state.js?v=20260501t";
import { createCameraInputSteering } from "./camera-input-steering.js?v=20260501t";
import { createCameraInputTracker } from "./camera-input-tracker.js?v=20260430h";
import { createOrbControlTracker } from "./orb-control-tracker.js?v=20260430d";
import { createOrbControlLiteTracker } from "./orb-control-lite-tracker.js?v=20260501t";
import { createOrbControlWorkerTracker } from "./orb-control-worker-tracker.js?v=20260501t";

const OBSERVATION_PUBLISH_FPS = 30;
const OBSERVATION_PUBLISH_INTERVAL_MS = 1000 / OBSERVATION_PUBLISH_FPS;

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
  cameraInputBackend = "hand",
  now = () => performance.now(),
} = {}) {
  const requestedDetectorBackend = String(cameraInputBackend || "hand").trim() || "hand";
  let activeDetectorBackend = requestedDetectorBackend;
  const initialState = createInitialCameraInputState({
    preferredHand,
    cameraInputBackend: activeDetectorBackend,
    modelAssetUrl: new URL("../../../assets/camera-input/models/hand_landmarker.task", import.meta.url).toString(),
    wasmRootUrl: new URL("../../../vendor/mediapipe/tasks-vision/wasm/", import.meta.url).toString(),
  });
  const camStore = createCamStore({
    initialState,
    eventBus,
  });
  const steering = createCameraInputSteering();
  let observationFlushTimer = 0;
  let lastObservationFlushAtMs = 0;

  function createTrackerFor(detectorBackend) {
    const trackerFactory = detectorBackend === "orb-control-worker"
      ? createOrbControlWorkerTracker
      : detectorBackend === "orb-control-lite"
      ? createOrbControlLiteTracker
      : detectorBackend === "orb-control"
      ? createOrbControlTracker
      : createCameraInputTracker;
    return trackerFactory({
      rootWindow,
      rootDocument,
      now,
      preferredHand,
      modelAssetUrl: initialState.config.modelAssetUrl,
      wasmRootUrl: initialState.config.wasmRootUrl,
      onObservation: handleObservation,
    });
  }

  let tracker = createTrackerFor(activeDetectorBackend);

  function switchTracker(detectorBackend) {
    if (tracker && typeof tracker.destroy === "function") {
      try { tracker.destroy(); } catch (_) {}
    }
    activeDetectorBackend = detectorBackend;
    tracker = createTrackerFor(activeDetectorBackend);
    patchCameraState({
      updatedAtMs: now(),
      config: {
        cameraInputBackend: activeDetectorBackend,
      },
      debug: {
        detectorBackend: activeDetectorBackend,
      },
    });
  }

  function clearObservationFlushTimer() {
    if (!observationFlushTimer) return;
    rootWindow.clearTimeout(observationFlushTimer);
    observationFlushTimer = 0;
  }

  function flushCameraState() {
    const state = camStore.getState();
    state.debug.statusLine = buildStatusLine(state);
    camStore.flush();
    return state;
  }

  function flushObservationState() {
    clearObservationFlushTimer();
    lastObservationFlushAtMs = now();
    return flushCameraState();
  }

  function scheduleObservationFlush(observedAtMs) {
    const timestamp = Number(observedAtMs) || now();
    const elapsedMs = lastObservationFlushAtMs
      ? timestamp - lastObservationFlushAtMs
      : OBSERVATION_PUBLISH_INTERVAL_MS;
    if (elapsedMs >= OBSERVATION_PUBLISH_INTERVAL_MS) {
      return flushObservationState();
    }
    if (!observationFlushTimer) {
      observationFlushTimer = rootWindow.setTimeout(
        flushObservationState,
        OBSERVATION_PUBLISH_INTERVAL_MS - elapsedMs
      );
    }
    return camStore.getState();
  }

  function patchCameraState(partialState = {}, { coalesceObservation = false } = {}) {
    camStore.patch(partialState, { silent: true });
    if (coalesceObservation) {
      return scheduleObservationFlush(partialState.updatedAtMs);
    }
    clearObservationFlushTimer();
    return flushCameraState();
  }

  function handleObservation(observation = {}) {
    const tracking = steering.processObservation(observation);
    const state = camStore.getState();
    patchCameraState({
      updatedAtMs: Number(observation.observedAtMs) || now(),
      lifecycle: {
        runtimeState: state.lifecycle.streamState === "active" ? "active" : state.lifecycle.runtimeState,
        ready: state.lifecycle.preloadState === "ready",
      },
      tracking,
      failures: tracking.state === "tracking"
        ? { code: "", message: "" }
        : state.failures,
      debug: {
        frameMs: Number(observation.frameMs) || 0,
        fps: Number(observation.fps) || 0,
        detectMs: Number(observation.detectMs) || 0,
        videoWidth: Number(observation.videoWidth) || 0,
        videoHeight: Number(observation.videoHeight) || 0,
        detectorInputWidth: Number(observation.detectorInputWidth) || 0,
        detectorInputHeight: Number(observation.detectorInputHeight) || 0,
        detectorBlobWeight: Number(observation.detectorBlobWeight) || 0,
        detectorMaskPixels: Number(observation.detectorMaskPixels) || 0,
        detectorRawX01: Number(observation.detectorRawX01) || 0.5,
        detectorCoreX01: Number(observation.detectorCoreX01) || 0.5,
        detectorOuterX01: Number(observation.detectorOuterX01) || 0.5,
        detectorEdgeX01: Number(observation.detectorEdgeX01) || 0.5,
        detectorWeightedX01: Number(observation.detectorWeightedX01) || 0.5,
        detectorComponentCount: Number(observation.detectorComponentCount) || 0,
        detectorComponentPixels: Number(observation.detectorComponentPixels) || 0,
        detectorComponentWidthPx: Number(observation.detectorComponentWidthPx) || 0,
        detectorComponentHeightPx: Number(observation.detectorComponentHeightPx) || 0,
        detectorCoreWidthPx: Number(observation.detectorCoreWidthPx) || 0,
        detectorComponentScore: Number(observation.detectorComponentScore) || 0,
        detectorPriorX01: Number(observation.detectorPriorX01) || 0.5,
        detectorPriorAgeMs: Number(observation.detectorPriorAgeMs) || 0,
        detectorPriorDistance01: Number(observation.detectorPriorDistance01) || -1,
        detectorContinuityMultiplier: Number(observation.detectorContinuityMultiplier) || 1,
        detectorOutputX01: Number(observation.detectorOutputX01) || 0.5,
        detectorOutputCenterX01: Number(observation.detectorOutputCenterX01) || 0.5,
        detectorOutputGain: Number(observation.detectorOutputGain) || 1,
        detectorResultReason: String(observation.detectorResultReason || ""),
        detectorLandmarkGroups: Number(observation.detectorLandmarkGroups) || 0,
        detectorHandednessGroups: Number(observation.detectorHandednessGroups) || 0,
        detectorBestScore: Number(observation.detectorBestScore) || 0,
        detectorBestLandmarks: Number(observation.detectorBestLandmarks) || 0,
        detectorBestIndex: Number(observation.detectorBestIndex) || -1,
        detectorPalmCameraX01: Number(observation.detectorPalmCameraX01) || 0.5,
        detectorPalmScreenX01: Number(observation.detectorPalmScreenX01) || 0.5,
        detectorDetectedHandedness: String(observation.detectorDetectedHandedness || observation.detectedHandedness || ""),
        trackWidth: Number(observation.trackWidth) || 0,
        trackHeight: Number(observation.trackHeight) || 0,
        trackFrameRate: Number(observation.trackFrameRate) || 0,
        detectorLoop: String(observation.detectorLoop || ""),
        detectorBackend: String(observation.detectorBackend || activeDetectorBackend),
        detectorTargetFps: Number(observation.detectorTargetFps) || 0,
        detectorDetectMsEma: Number(observation.detectorDetectMsEma) || 0,
      },
    }, {
      coalesceObservation: true,
    });
  }

  async function preload() {
    patchCameraState({
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
        preloadDetail: activeDetectorBackend === "orb-control-lite" ? "loading_orb_control_lite" : "loading_mediapipe",
        lastError: "",
      },
    });

    try {
      let preloadInfo = null;
      try {
        preloadInfo = await tracker.preload();
      } catch (error) {
        if (activeDetectorBackend !== "orb-control-worker") throw error;
        switchTracker("orb-control");
        preloadInfo = await tracker.preload();
        preloadInfo = {
          ...preloadInfo,
          fallbackFromDetectorBackend: "orb-control-worker",
          fallbackReason: normalizeErrorMessage(error, "orb_control_worker_preload_failed"),
        };
      }
      patchCameraState({
        updatedAtMs: now(),
        lifecycle: {
          preloadState: "ready",
          runtimeState: "ready",
          ready: true,
        },
        debug: {
          preloadDetail: activeDetectorBackend === "orb-control-lite" ? "orb_control_lite_ready" : "mediapipe_ready",
          preloadMs: Number(preloadInfo && preloadInfo.preloadMs) || 0,
          wasmSimdSupported: Boolean(preloadInfo && preloadInfo.wasmSimdSupported),
          loadedWasmAssets: String(preloadInfo && preloadInfo.loadedWasmAssets || ""),
          modelAssetUrl: activeDetectorBackend === "orb-control-lite"
            ? ""
            : String(preloadInfo && preloadInfo.modelAssetUrl || initialState.config.modelAssetUrl),
          wasmRootUrl: activeDetectorBackend === "orb-control-lite"
            ? ""
            : String(preloadInfo && preloadInfo.wasmRootUrl || initialState.config.wasmRootUrl),
          detectorBackend: String(preloadInfo && preloadInfo.detectorBackend || activeDetectorBackend),
          lastError: String(preloadInfo && preloadInfo.fallbackReason || ""),
        },
      });
      return camStore.getState();
    } catch (error) {
      patchCameraState({
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
      throw error;
    }
  }

  async function startCalibrationCapture() {
    if (camStore.getState().lifecycle.preloadState !== "ready") {
      await preload();
    }
    patchCameraState({
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

    try {
      await tracker.start();
      patchCameraState({
        updatedAtMs: now(),
        lifecycle: {
          permissionState: "granted",
          streamState: "active",
          runtimeState: "active",
          ready: true,
        },
      });
      return camStore.getState();
    } catch (error) {
      const code = deriveFailureCode(error);
      patchCameraState({
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
      throw error;
    }
  }

  function stop() {
    tracker.stop();
    steering.reset();
    patchCameraState({
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
  }

  function destroy() {
    clearObservationFlushTimer();
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
