const DEFAULT_DETECTOR_CONFIG = Object.freeze({
  numHands: 1,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

let FilesetResolver = null;
let HandLandmarker = null;
let visionBundlePromise = null;
let wasmFileset = null;
let handLandmarker = null;
let activeModelAssetUrl = "";
let activeWasmRootUrl = "";

function installModuleWorkerImportShim() {
  if (typeof self.import === "function") return;
  self.import = async (url) => {
    const scriptUrl = new URL(String(url || ""), self.location.href).toString();
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`orb_control_worker_script_load_failed:${response.status}`);
    }
    const source = await response.text();
    (0, eval)(`${source}\n//# sourceURL=${scriptUrl}`);
  };
}

async function loadVisionBundle() {
  if (FilesetResolver && HandLandmarker) {
    return { FilesetResolver, HandLandmarker };
  }
  if (!visionBundlePromise) {
    installModuleWorkerImportShim();
    visionBundlePromise = import("../../../vendor/mediapipe/tasks-vision/vision_bundle.mjs")
      .then((module) => {
        FilesetResolver = module.FilesetResolver;
        HandLandmarker = module.HandLandmarker;
        return { FilesetResolver, HandLandmarker };
      });
  }
  return visionBundlePromise;
}

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function normalizeHandedness(value) {
  const label = String(value || "").trim().toLowerCase();
  if (label === "left") return "Left";
  if (label === "right") return "Right";
  return "";
}

function averagePalmX01(landmarks = []) {
  const wrist = landmarks[0] || null;
  const indexMcp = landmarks[5] || null;
  const pinkyMcp = landmarks[17] || null;
  const points = [wrist, indexMcp, pinkyMcp].filter(Boolean);
  if (!points.length) return 0.5;
  let total = 0;
  for (const point of points) {
    total += clamp01(point && point.x);
  }
  return clamp01(total / points.length);
}

function toScreenSpaceX01(cameraX01) {
  return clamp01(1 - clamp01(cameraX01));
}

function extractOrbControlObservation(result, observedAtMs) {
  const landmarksGroups = Array.isArray(result && result.landmarks) ? result.landmarks : [];
  const handednessGroups = Array.isArray(result && result.handedness) && result.handedness.length
    ? result.handedness
    : Array.isArray(result && result.handednesses)
    ? result.handednesses
    : [];
  const detectorLandmarkGroups = landmarksGroups.length;
  const detectorHandednessGroups = handednessGroups.length;

  if (!landmarksGroups.length) {
    return {
      kind: "missing",
      observedAtMs,
      detectorResultReason: "no_landmarks",
      detectorLandmarkGroups,
      detectorHandednessGroups,
      detectorBestScore: 0,
      detectorBestLandmarks: 0,
      detectorBestIndex: -1,
      detectorPalmCameraX01: 0.5,
      detectorBackend: "orb-control-worker",
    };
  }

  let bestIndex = -1;
  let bestScore = -1;
  let bestHandedness = "";
  let bestLandmarksCount = 0;

  for (let index = 0; index < landmarksGroups.length; index += 1) {
    const landmarks = Array.isArray(landmarksGroups[index]) ? landmarksGroups[index] : [];
    const categories = Array.isArray(handednessGroups[index]) ? handednessGroups[index] : [];
    const topCategory = categories[0] || null;
    const handedness = normalizeHandedness(topCategory && topCategory.categoryName);
    const score = topCategory ? clamp01(topCategory.score) : 1;
    if (landmarks.length && score >= bestScore) {
      bestIndex = index;
      bestScore = score;
      bestHandedness = handedness;
      bestLandmarksCount = landmarks.length;
    }
  }

  if (bestIndex === -1) {
    return {
      kind: "missing",
      observedAtMs,
      detectorResultReason: "no_valid_landmarks",
      detectorLandmarkGroups,
      detectorHandednessGroups,
      detectorBestScore: 0,
      detectorBestLandmarks: 0,
      detectorBestIndex: -1,
      detectorPalmCameraX01: 0.5,
      detectorBackend: "orb-control-worker",
    };
  }

  const landmarks = Array.isArray(landmarksGroups[bestIndex]) ? landmarksGroups[bestIndex] : [];
  const palmCameraX01 = averagePalmX01(landmarks);

  return {
    kind: "hand",
    observedAtMs,
    handedness: "Any",
    detectedHandedness: bestHandedness,
    handednessScore: bestScore,
    landmarksCount: landmarks.length,
    x01: toScreenSpaceX01(palmCameraX01),
    detectorResultReason: "hand",
    detectorLandmarkGroups,
    detectorHandednessGroups,
    detectorBestScore: bestScore,
    detectorBestLandmarks: bestLandmarksCount,
    detectorBestIndex: bestIndex,
    detectorPalmCameraX01: palmCameraX01,
    detectorPalmScreenX01: toScreenSpaceX01(palmCameraX01),
    detectorDetectedHandedness: bestHandedness,
    detectorBackend: "orb-control-worker",
  };
}

function supportsWasmSimd() {
  try {
    return WebAssembly.validate(new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0,
      1, 5, 1, 96, 0, 1, 123,
      3, 2, 1, 0,
      10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
    ]));
  } catch (_) {
    return false;
  }
}

async function preloadDetector({
  modelAssetUrl = "",
  wasmRootUrl = "",
} = {}) {
  if (
    handLandmarker &&
    activeModelAssetUrl === modelAssetUrl &&
    activeWasmRootUrl === wasmRootUrl
  ) {
    return {
      detectorBackend: "orb-control-worker",
      modelAssetUrl,
      wasmRootUrl,
      preloadMs: 0,
      wasmSimdSupported: supportsWasmSimd(),
    };
  }

  if (handLandmarker && typeof handLandmarker.close === "function") {
    try { handLandmarker.close(); } catch (_) {}
  }
  handLandmarker = null;
  wasmFileset = null;

  const preloadStartMs = performance.now();
  const vision = await loadVisionBundle();
  wasmFileset = await vision.FilesetResolver.forVisionTasks(wasmRootUrl);
  handLandmarker = await vision.HandLandmarker.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath: modelAssetUrl,
    },
    runningMode: "VIDEO",
    numHands: DEFAULT_DETECTOR_CONFIG.numHands,
    minHandDetectionConfidence: DEFAULT_DETECTOR_CONFIG.minHandDetectionConfidence,
    minHandPresenceConfidence: DEFAULT_DETECTOR_CONFIG.minHandPresenceConfidence,
    minTrackingConfidence: DEFAULT_DETECTOR_CONFIG.minTrackingConfidence,
  });
  activeModelAssetUrl = modelAssetUrl;
  activeWasmRootUrl = wasmRootUrl;

  return {
    detectorBackend: "orb-control-worker",
    modelAssetUrl,
    wasmRootUrl,
    preloadMs: Math.max(0, performance.now() - preloadStartMs),
    wasmSimdSupported: supportsWasmSimd(),
  };
}

function closeBitmap(bitmap) {
  if (bitmap && typeof bitmap.close === "function") {
    try { bitmap.close(); } catch (_) {}
  }
}

async function handleDetect(message) {
  if (!handLandmarker) {
    throw new Error("orb_control_worker_not_preloaded");
  }
  const bitmap = message && message.bitmap ? message.bitmap : null;
  if (!bitmap) {
    throw new Error("orb_control_worker_missing_bitmap");
  }

  const observedAtMs = Number(message.observedAtMs) || performance.now();
  const detectStartMs = performance.now();
  try {
    const result = handLandmarker.detectForVideo(bitmap, observedAtMs);
    const detectMs = Math.max(0, performance.now() - detectStartMs);
    const observation = extractOrbControlObservation(result, observedAtMs);
    return {
      ...observation,
      detectMs,
      frameMs: Number(message.frameMs) || 0,
      fps: Number(message.fps) || 0,
      videoWidth: Number(message.videoWidth) || 0,
      videoHeight: Number(message.videoHeight) || 0,
      trackWidth: Number(message.trackWidth) || 0,
      trackHeight: Number(message.trackHeight) || 0,
      trackFrameRate: Number(message.trackFrameRate) || 0,
      detectorLoop: "orb-control-worker",
      detectorBackend: "orb-control-worker",
    };
  } finally {
    closeBitmap(bitmap);
  }
}

self.onmessage = async (event) => {
  const message = event && event.data ? event.data : {};
  const id = Number(message.id) || 0;
  try {
    if (message.type === "preload") {
      const payload = await preloadDetector(message);
      self.postMessage({ id, type: "preloaded", payload });
      return;
    }
    if (message.type === "detect") {
      const payload = await handleDetect(message);
      self.postMessage({ id, type: "observation", payload });
      return;
    }
    if (message.type === "destroy") {
      if (handLandmarker && typeof handLandmarker.close === "function") {
        try { handLandmarker.close(); } catch (_) {}
      }
      handLandmarker = null;
      wasmFileset = null;
      self.postMessage({ id, type: "destroyed", payload: { detectorBackend: "orb-control-worker" } });
    }
  } catch (error) {
    if (message && message.bitmap) closeBitmap(message.bitmap);
    self.postMessage({
      id,
      type: "error",
      error: error && error.message ? String(error.message) : "orb_control_worker_error",
    });
  }
};
