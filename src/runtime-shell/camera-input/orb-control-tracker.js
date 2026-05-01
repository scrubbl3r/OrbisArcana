import { FilesetResolver, HandLandmarker } from "../../../vendor/mediapipe/tasks-vision/vision_bundle.mjs";

const DEFAULT_TRACKER_CONFIG = Object.freeze({
  numHands: 1,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  maxDetectionFps: 30,
  minDetectionFps: 20,
  slowDetectMs: 28,
  recoverDetectMs: 18,
  videoWidth: 640,
  videoHeight: 480,
  videoFps: 30,
  detectorInputWidth: 480,
  detectorInputHeight: 360,
});

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

  if (!landmarksGroups.length) {
    return {
      kind: "missing",
      observedAtMs,
      detectorBackend: "orb-control",
    };
  }

  let bestIndex = -1;
  let bestScore = -1;
  let bestHandedness = "";

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
    }
  }

  if (bestIndex === -1) {
    return {
      kind: "missing",
      observedAtMs,
      detectorBackend: "orb-control",
    };
  }

  const landmarks = Array.isArray(landmarksGroups[bestIndex]) ? landmarksGroups[bestIndex] : [];

  return {
    kind: "hand",
    observedAtMs,
    handedness: "Any",
    detectedHandedness: bestHandedness,
    handednessScore: bestScore,
    landmarksCount: landmarks.length,
    x01: toScreenSpaceX01(averagePalmX01(landmarks)),
    detectorBackend: "orb-control",
  };
}

function createHiddenVideo(rootDocument) {
  const videoEl = rootDocument.createElement("video");
  videoEl.autoplay = true;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.setAttribute("aria-hidden", "true");
  videoEl.style.position = "fixed";
  videoEl.style.opacity = "0";
  videoEl.style.pointerEvents = "none";
  videoEl.style.width = "1px";
  videoEl.style.height = "1px";
  videoEl.style.left = "-9999px";
  videoEl.style.top = "-9999px";
  return videoEl;
}

function waitForVideoMetadata(videoEl) {
  if (videoEl.readyState >= 2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("camera_video_metadata_failed"));
    };
    const cleanup = () => {
      videoEl.removeEventListener("loadedmetadata", onLoaded);
      videoEl.removeEventListener("error", onError);
    };
    videoEl.addEventListener("loadedmetadata", onLoaded, { once: true });
    videoEl.addEventListener("error", onError, { once: true });
  });
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

function summarizeMediapipeResources(rootWindow, wasmRootUrl, modelAssetUrl) {
  const perf = rootWindow && rootWindow.performance ? rootWindow.performance : null;
  if (!perf || typeof perf.getEntriesByType !== "function") return "";
  const root = String(wasmRootUrl || "");
  const model = String(modelAssetUrl || "");
  const entries = perf.getEntriesByType("resource") || [];
  const names = [];
  for (const entry of entries) {
    const name = String(entry && entry.name || "");
    if (!name) continue;
    if (
      name.indexOf(root) === 0 ||
      name === model ||
      name.indexOf("/mediapipe/tasks-vision/wasm/") >= 0 ||
      name.indexOf("/camera-input/models/") >= 0
    ) {
      names.push(name.split("/").pop());
    }
  }
  return Array.from(new Set(names)).join(",");
}

function resolveStreamSettings(mediaStream) {
  const tracks = mediaStream && typeof mediaStream.getVideoTracks === "function"
    ? mediaStream.getVideoTracks()
    : [];
  const track = tracks[0] || null;
  return track && typeof track.getSettings === "function"
    ? track.getSettings() || {}
    : {};
}

export function createOrbControlTracker({
  rootWindow = window,
  rootDocument = document,
  now = () => performance.now(),
  modelAssetUrl = new URL("../../../assets/camera-input/models/hand_landmarker.task", import.meta.url).toString(),
  wasmRootUrl = new URL("../../../vendor/mediapipe/tasks-vision/wasm/", import.meta.url).toString(),
  onObservation = () => {},
} = {}) {
  let wasmFileset = null;
  let handLandmarker = null;
  let videoEl = null;
  let detectorCanvas = null;
  let detectorContext = null;
  let mediaStream = null;
  let tickTimer = 0;
  let running = false;
  let lastVideoTime = -1;
  let lastFrameAtMs = 0;
  let lastDetectionAtMs = 0;
  let targetDetectionFps = DEFAULT_TRACKER_CONFIG.maxDetectionFps;
  let detectMsEma = 0;
  let slowDetectStreak = 0;
  let recoverDetectStreak = 0;

  function getDetectionIntervalMs() {
    return 1000 / Math.max(1, targetDetectionFps);
  }

  function updateAdaptiveCadence(detectMs) {
    const sample = Math.max(0, Number(detectMs) || 0);
    detectMsEma = detectMsEma ? (detectMsEma * 0.8) + (sample * 0.2) : sample;
    if (detectMsEma >= DEFAULT_TRACKER_CONFIG.slowDetectMs) {
      slowDetectStreak += 1;
      recoverDetectStreak = 0;
    } else if (detectMsEma <= DEFAULT_TRACKER_CONFIG.recoverDetectMs) {
      recoverDetectStreak += 1;
      slowDetectStreak = 0;
    } else {
      slowDetectStreak = 0;
      recoverDetectStreak = 0;
    }

    if (slowDetectStreak >= 6 && targetDetectionFps > DEFAULT_TRACKER_CONFIG.minDetectionFps) {
      targetDetectionFps = Math.max(DEFAULT_TRACKER_CONFIG.minDetectionFps, targetDetectionFps - 2);
      slowDetectStreak = 0;
      return;
    }
    if (recoverDetectStreak >= 24 && targetDetectionFps < DEFAULT_TRACKER_CONFIG.maxDetectionFps) {
      targetDetectionFps = Math.min(DEFAULT_TRACKER_CONFIG.maxDetectionFps, targetDetectionFps + 2);
      recoverDetectStreak = 0;
    }
  }

  async function preload() {
    if (handLandmarker) {
      return {
        detectorBackend: "orb-control",
        modelAssetUrl,
        wasmRootUrl,
        preloadMs: 0,
        wasmSimdSupported: supportsWasmSimd(),
        loadedWasmAssets: summarizeMediapipeResources(rootWindow, wasmRootUrl, modelAssetUrl),
      };
    }
    const preloadStartMs = now();
    wasmFileset = await FilesetResolver.forVisionTasks(wasmRootUrl);
    handLandmarker = await HandLandmarker.createFromOptions(wasmFileset, {
      baseOptions: {
        modelAssetPath: modelAssetUrl,
      },
      runningMode: "VIDEO",
      numHands: DEFAULT_TRACKER_CONFIG.numHands,
      minHandDetectionConfidence: DEFAULT_TRACKER_CONFIG.minHandDetectionConfidence,
      minHandPresenceConfidence: DEFAULT_TRACKER_CONFIG.minHandPresenceConfidence,
      minTrackingConfidence: DEFAULT_TRACKER_CONFIG.minTrackingConfidence,
    });
    return {
      detectorBackend: "orb-control",
      modelAssetUrl,
      wasmRootUrl,
      preloadMs: Math.max(0, now() - preloadStartMs),
      wasmSimdSupported: supportsWasmSimd(),
      loadedWasmAssets: summarizeMediapipeResources(rootWindow, wasmRootUrl, modelAssetUrl),
    };
  }

  function stopStreamTracks() {
    if (!mediaStream) return;
    const tracks = typeof mediaStream.getTracks === "function" ? mediaStream.getTracks() : [];
    for (const track of tracks) {
      try { track.stop(); } catch (_) {}
    }
    mediaStream = null;
  }

  function scheduleTick(delayMs = 0) {
    if (!running || tickTimer) return;
    tickTimer = rootWindow.setTimeout(tick, Math.max(0, Number(delayMs) || 0));
  }

  function stopLoop() {
    if (!tickTimer) return;
    rootWindow.clearTimeout(tickTimer);
    tickTimer = 0;
  }

  function getDetectorInput() {
    if (!detectorCanvas) {
      detectorCanvas = rootDocument.createElement("canvas");
      detectorCanvas.width = DEFAULT_TRACKER_CONFIG.detectorInputWidth;
      detectorCanvas.height = DEFAULT_TRACKER_CONFIG.detectorInputHeight;
      detectorContext = detectorCanvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });
    }
    if (!detectorContext) return videoEl;
    if (
      detectorCanvas.width !== DEFAULT_TRACKER_CONFIG.detectorInputWidth ||
      detectorCanvas.height !== DEFAULT_TRACKER_CONFIG.detectorInputHeight
    ) {
      detectorCanvas.width = DEFAULT_TRACKER_CONFIG.detectorInputWidth;
      detectorCanvas.height = DEFAULT_TRACKER_CONFIG.detectorInputHeight;
    }
    detectorContext.drawImage(
      videoEl,
      0,
      0,
      DEFAULT_TRACKER_CONFIG.detectorInputWidth,
      DEFAULT_TRACKER_CONFIG.detectorInputHeight
    );
    return detectorCanvas;
  }

  function tick() {
    tickTimer = 0;
    if (!running || !videoEl || !handLandmarker) return;
    if (videoEl.readyState < 2) {
      scheduleTick(16);
      return;
    }
    if (videoEl.currentTime === lastVideoTime) {
      scheduleTick(8);
      return;
    }

    const observedAtMs = now();
    const minDetectionIntervalMs = getDetectionIntervalMs();
    const sinceLastDetectionMs = lastDetectionAtMs ? observedAtMs - lastDetectionAtMs : minDetectionIntervalMs;
    if (sinceLastDetectionMs < minDetectionIntervalMs) {
      scheduleTick(minDetectionIntervalMs - sinceLastDetectionMs);
      return;
    }

    const frameMs = lastFrameAtMs ? Math.max(0, observedAtMs - lastFrameAtMs) : 0;
    lastFrameAtMs = observedAtMs;
    lastDetectionAtMs = observedAtMs;
    lastVideoTime = videoEl.currentTime;
    const detectorInput = getDetectorInput();

    const detectStartMs = now();
    const result = handLandmarker.detectForVideo(detectorInput, observedAtMs);
    const detectMs = Math.max(0, now() - detectStartMs);
    updateAdaptiveCadence(detectMs);
    const observation = extractOrbControlObservation(result, observedAtMs);
    const streamSettings = resolveStreamSettings(mediaStream);
    onObservation({
      ...observation,
      frameMs,
      fps: frameMs > 0 ? (1000 / frameMs) : 0,
      detectMs,
      videoWidth: Number(videoEl.videoWidth) || 0,
      videoHeight: Number(videoEl.videoHeight) || 0,
      detectorInputWidth: Number(detectorInput && detectorInput.width) || Number(videoEl.videoWidth) || 0,
      detectorInputHeight: Number(detectorInput && detectorInput.height) || Number(videoEl.videoHeight) || 0,
      trackWidth: Number(streamSettings.width) || 0,
      trackHeight: Number(streamSettings.height) || 0,
      trackFrameRate: Number(streamSettings.frameRate) || 0,
      detectorLoop: "orb-control-timeout",
      detectorBackend: "orb-control",
      detectorTargetFps: targetDetectionFps,
      detectorDetectMsEma: detectMsEma,
    });
    scheduleTick(Math.max(0, getDetectionIntervalMs() - detectMs));
  }

  async function start() {
    await preload();
    if (running) return;
    const mediaDevices = rootWindow.navigator && rootWindow.navigator.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
      throw new Error("camera_get_user_media_unavailable");
    }

    mediaStream = await mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: DEFAULT_TRACKER_CONFIG.videoWidth },
        height: { ideal: DEFAULT_TRACKER_CONFIG.videoHeight },
        frameRate: {
          ideal: DEFAULT_TRACKER_CONFIG.videoFps,
          max: DEFAULT_TRACKER_CONFIG.videoFps,
        },
      },
    });

    if (!videoEl) {
      videoEl = createHiddenVideo(rootDocument);
      rootDocument.body.appendChild(videoEl);
    }
    videoEl.srcObject = mediaStream;
    await videoEl.play();
    await waitForVideoMetadata(videoEl);

    running = true;
    lastVideoTime = -1;
    lastFrameAtMs = 0;
    lastDetectionAtMs = 0;
    targetDetectionFps = DEFAULT_TRACKER_CONFIG.maxDetectionFps;
    detectMsEma = 0;
    slowDetectStreak = 0;
    recoverDetectStreak = 0;
    scheduleTick(0);
  }

  function stop() {
    running = false;
    stopLoop();
    if (videoEl) {
      try { videoEl.pause(); } catch (_) {}
      videoEl.srcObject = null;
    }
    stopStreamTracks();
    onObservation({
      kind: "missing",
      observedAtMs: now(),
      frameMs: 0,
      fps: 0,
      detectorBackend: "orb-control",
      detectorTargetFps: targetDetectionFps,
      detectorDetectMsEma: detectMsEma,
    });
  }

  function destroy() {
    stop();
    if (handLandmarker && typeof handLandmarker.close === "function") {
      try { handLandmarker.close(); } catch (_) {}
    }
    handLandmarker = null;
    wasmFileset = null;
    detectorCanvas = null;
    detectorContext = null;
    if (videoEl && videoEl.parentNode) {
      videoEl.parentNode.removeChild(videoEl);
    }
    videoEl = null;
  }

  return {
    preload,
    start,
    stop,
    destroy,
  };
}
