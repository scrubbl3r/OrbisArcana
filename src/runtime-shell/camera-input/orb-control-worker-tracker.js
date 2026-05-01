const DEFAULT_TRACKER_CONFIG = Object.freeze({
  maxDetectionFps: 30,
  videoWidth: 640,
  videoHeight: 480,
  videoFps: 30,
});

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

function summarizeWorkerResources(rootWindow, wasmRootUrl, modelAssetUrl) {
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
      name.indexOf("/camera-input/models/") >= 0 ||
      name.indexOf("/orb-control-detector-worker.js") >= 0
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

function normalizeErrorMessage(error, fallback = "orb_control_worker_error") {
  return error && error.message ? String(error.message) : String(fallback || "orb_control_worker_error");
}

export function createOrbControlWorkerTracker({
  rootWindow = window,
  rootDocument = document,
  now = () => performance.now(),
  modelAssetUrl = new URL("../../../assets/camera-input/models/hand_landmarker.task", import.meta.url).toString(),
  wasmRootUrl = new URL("../../../vendor/mediapipe/tasks-vision/wasm/", import.meta.url).toString(),
  workerUrl = new URL("./orb-control-detector-worker.js?v=20260501u", import.meta.url).toString(),
  onObservation = () => {},
} = {}) {
  let worker = null;
  let videoEl = null;
  let mediaStream = null;
  let tickTimer = 0;
  let running = false;
  let pendingFrame = false;
  let lastVideoTime = -1;
  let lastFrameAtMs = 0;
  let lastDetectionAtMs = 0;
  let nextMessageId = 1;
  const pendingMessages = new Map();
  const minDetectionIntervalMs = 1000 / DEFAULT_TRACKER_CONFIG.maxDetectionFps;

  function createWorker() {
    if (worker) return worker;
    if (!rootWindow || typeof rootWindow.Worker !== "function") {
      throw new Error("orb_control_worker_unavailable");
    }
    worker = new rootWindow.Worker(workerUrl, {
      type: "module",
      name: "orbis-orb-control-detector",
    });
    worker.onmessage = handleWorkerMessage;
    worker.onerror = (event) => {
      const error = new Error(event && event.message ? String(event.message) : "orb_control_worker_runtime_error");
      rejectAllPending(error);
    };
    return worker;
  }

  function rejectAllPending(error) {
    for (const entry of pendingMessages.values()) {
      if (entry && typeof entry.reject === "function") {
        entry.reject(error);
      }
    }
    pendingMessages.clear();
  }

  function handleWorkerMessage(event) {
    const message = event && event.data ? event.data : {};
    const id = Number(message.id) || 0;
    const entry = pendingMessages.get(id);
    if (entry) pendingMessages.delete(id);

    if (message.type === "observation") {
      const payload = {
        detectorTargetFps: DEFAULT_TRACKER_CONFIG.maxDetectionFps,
        detectorDetectMsEma: Number(message.payload && message.payload.detectMs) || 0,
        ...(message.payload || {}),
      };
      pendingFrame = false;
      onObservation(payload);
      if (entry && typeof entry.resolve === "function") {
        entry.resolve(payload);
      }
      if (running) scheduleTick(0);
      return;
    }

    if (message.type === "error") {
      const error = new Error(String(message.error || "orb_control_worker_error"));
      if (entry && typeof entry.reject === "function") {
        entry.reject(error);
      }
      pendingFrame = false;
      if (running) scheduleTick(minDetectionIntervalMs);
      return;
    }

    if (entry && typeof entry.resolve === "function") {
      entry.resolve(message.payload || {});
    }
  }

  function postWorkerMessage(type, payload = {}, transfer = []) {
    const activeWorker = createWorker();
    const id = nextMessageId;
    nextMessageId += 1;
    return new Promise((resolve, reject) => {
      pendingMessages.set(id, { resolve, reject });
      try {
        activeWorker.postMessage({ ...payload, id, type }, transfer);
      } catch (error) {
        pendingMessages.delete(id);
        reject(error);
      }
    });
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

  async function preload() {
    const preloadInfo = await postWorkerMessage("preload", {
      modelAssetUrl,
      wasmRootUrl,
    });
    return {
      ...preloadInfo,
      detectorBackend: "orb-control-worker",
      loadedWasmAssets: summarizeWorkerResources(rootWindow, wasmRootUrl, modelAssetUrl),
    };
  }

  async function tick() {
    tickTimer = 0;
    if (!running || pendingFrame || !videoEl) return;
    if (videoEl.readyState < 2) {
      scheduleTick(16);
      return;
    }
    if (videoEl.currentTime === lastVideoTime) {
      scheduleTick(8);
      return;
    }

    const observedAtMs = now();
    const sinceLastDetectionMs = lastDetectionAtMs ? observedAtMs - lastDetectionAtMs : minDetectionIntervalMs;
    if (sinceLastDetectionMs < minDetectionIntervalMs) {
      scheduleTick(minDetectionIntervalMs - sinceLastDetectionMs);
      return;
    }

    const frameMs = lastFrameAtMs ? Math.max(0, observedAtMs - lastFrameAtMs) : 0;
    const streamSettings = resolveStreamSettings(mediaStream);
    lastFrameAtMs = observedAtMs;
    lastDetectionAtMs = observedAtMs;
    lastVideoTime = videoEl.currentTime;
    pendingFrame = true;

    try {
      if (typeof rootWindow.createImageBitmap !== "function") {
        throw new Error("orb_control_create_image_bitmap_unavailable");
      }
      const bitmap = await rootWindow.createImageBitmap(videoEl);
      const fps = frameMs > 0 ? (1000 / frameMs) : 0;
      postWorkerMessage("detect", {
        bitmap,
        observedAtMs,
        frameMs,
        fps,
        videoWidth: Number(videoEl.videoWidth) || 0,
        videoHeight: Number(videoEl.videoHeight) || 0,
        trackWidth: Number(streamSettings.width) || 0,
        trackHeight: Number(streamSettings.height) || 0,
        trackFrameRate: Number(streamSettings.frameRate) || 0,
      }, [bitmap]).catch((error) => {
        pendingFrame = false;
        onObservation({
          kind: "missing",
          observedAtMs: now(),
          frameMs: 0,
          fps: 0,
          detectorTargetFps: DEFAULT_TRACKER_CONFIG.maxDetectionFps,
          detectorDetectMsEma: 0,
          detectorLoop: "orb-control-worker",
          detectorBackend: "orb-control-worker",
          error: normalizeErrorMessage(error),
        });
        if (running) scheduleTick(minDetectionIntervalMs);
      });
    } catch (error) {
      pendingFrame = false;
      onObservation({
        kind: "missing",
        observedAtMs: now(),
        frameMs: 0,
        fps: 0,
        detectorTargetFps: DEFAULT_TRACKER_CONFIG.maxDetectionFps,
        detectorDetectMsEma: 0,
        detectorLoop: "orb-control-worker",
        detectorBackend: "orb-control-worker",
        error: normalizeErrorMessage(error),
      });
      if (running) scheduleTick(minDetectionIntervalMs);
    }
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
    pendingFrame = false;
    lastVideoTime = -1;
    lastFrameAtMs = 0;
    lastDetectionAtMs = 0;
    scheduleTick(0);
  }

  function stop() {
    running = false;
    pendingFrame = false;
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
      detectorTargetFps: DEFAULT_TRACKER_CONFIG.maxDetectionFps,
      detectorDetectMsEma: 0,
      detectorLoop: "orb-control-worker",
      detectorBackend: "orb-control-worker",
    });
  }

  function destroy() {
    stop();
    rejectAllPending(new Error("orb_control_worker_destroyed"));
    if (worker) {
      try { worker.postMessage({ type: "destroy", id: nextMessageId }); } catch (_) {}
      try { worker.terminate(); } catch (_) {}
    }
    worker = null;
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
