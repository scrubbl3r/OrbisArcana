const DEFAULT_HAND_X01 = 0.5;

export function createInitialCameraInputState({
  preferredHand = "Left",
  modelAssetUrl = "",
  wasmRootUrl = "",
} = {}) {
  return {
    updatedAtMs: 0,
    config: {
      preferredHand: String(preferredHand || "Left"),
      modelAssetUrl: String(modelAssetUrl || ""),
      wasmRootUrl: String(wasmRootUrl || ""),
    },
    lifecycle: {
      preloadState: "idle",
      runtimeState: "idle",
      permissionState: "unknown",
      streamState: "idle",
      ready: false,
    },
    tracking: {
      state: "idle",
      handPresent: false,
      handedness: null,
      handednessScore: 0,
      landmarksCount: 0,
      confidence: 0,
      rawX01: DEFAULT_HAND_X01,
      filteredX01: DEFAULT_HAND_X01,
      centeredX01: 0,
      lastSeenAtMs: 0,
    },
    failures: {
      code: "",
      message: "",
    },
    debug: {
      statusLine: "cam:idle",
      preloadDetail: "",
      frameMs: 0,
      fps: 0,
      detectMs: 0,
      videoWidth: 0,
      videoHeight: 0,
      trackWidth: 0,
      trackHeight: 0,
      trackFrameRate: 0,
      preloadMs: 0,
      wasmSimdSupported: false,
      loadedWasmAssets: "",
      modelAssetUrl: "",
      wasmRootUrl: "",
      detectorLoop: "",
      lastError: "",
    },
  };
}

export function mergeCameraInputState(currentState, partialState = {}) {
  const current = currentState || createInitialCameraInputState();
  const patch = partialState && typeof partialState === "object" ? partialState : {};
  return {
    ...current,
    ...patch,
    config: { ...current.config, ...(patch.config || {}) },
    lifecycle: { ...current.lifecycle, ...(patch.lifecycle || {}) },
    tracking: { ...current.tracking, ...(patch.tracking || {}) },
    failures: { ...current.failures, ...(patch.failures || {}) },
    debug: { ...current.debug, ...(patch.debug || {}) },
  };
}

export function applyCameraInputStatePatch(currentState, partialState = {}) {
  const current = currentState || createInitialCameraInputState();
  const patch = partialState && typeof partialState === "object" ? partialState : {};
  for (const [key, value] of Object.entries(patch)) {
    if (key === "config" || key === "lifecycle" || key === "tracking" || key === "failures" || key === "debug") {
      if (!value || typeof value !== "object") continue;
      Object.assign(current[key], value);
      continue;
    }
    current[key] = value;
  }
  return current;
}
