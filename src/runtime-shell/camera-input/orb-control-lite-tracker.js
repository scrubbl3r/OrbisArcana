const DEFAULT_TRACKER_CONFIG = Object.freeze({
  maxDetectionFps: 30,
  videoWidth: 640,
  videoHeight: 480,
  videoFps: 30,
  detectorWidth: 160,
  detectorHeight: 120,
  minWeight: 60,
  minConfidence: 0.22,
  minPixelWeight: 0.06,
  minComponentPixels: 8,
  motionFloor: 10,
  motionScale: 54,
  skinMotionBoost: 0.55,
  outputCenterX01: 0.5,
  outputGain: 1,
  backgroundAlpha: 0.025,
});

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
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

function resolveStreamSettings(mediaStream) {
  const tracks = mediaStream && typeof mediaStream.getVideoTracks === "function"
    ? mediaStream.getVideoTracks()
    : [];
  const track = tracks[0] || null;
  return track && typeof track.getSettings === "function"
    ? track.getSettings() || {}
    : {};
}

function createDetectorCanvas(rootDocument) {
  const canvas = rootDocument.createElement("canvas");
  canvas.width = DEFAULT_TRACKER_CONFIG.detectorWidth;
  canvas.height = DEFAULT_TRACKER_CONFIG.detectorHeight;
  return {
    canvas,
    context: canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
      willReadFrequently: true,
    }),
  };
}

function estimateSkinWeight(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const brightEnough = max > 48;
  const rgbSkin = brightEnough && r > 70 && g > 38 && b > 24 && r > g && r > b && chroma > 12;
  const cb = 128 - (0.168736 * r) - (0.331264 * g) + (0.5 * b);
  const cr = 128 + (0.5 * r) - (0.418688 * g) - (0.081312 * b);
  const yCbCrSkin = cb >= 74 && cb <= 142 && cr >= 132 && cr <= 190;
  if (rgbSkin && yCbCrSkin) return 0.75;
  if (rgbSkin || yCbCrSkin) return 0.38;
  return 0;
}

function calibrateOutputX01(rawScreenX01) {
  return clamp01(
    0.5 + ((clamp01(rawScreenX01) - DEFAULT_TRACKER_CONFIG.outputCenterX01) * DEFAULT_TRACKER_CONFIG.outputGain)
  );
}

function createAnalysisScratch(width, height) {
  const size = Math.max(1, width * height);
  return {
    width,
    height,
    mask: new Uint8Array(size),
    visited: new Uint8Array(size),
    weights: new Float32Array(size),
    stack: new Int32Array(size),
  };
}

function scoreComponent(component, frameWidth, frameHeight) {
  const boxW = Math.max(1, component.maxX - component.minX + 1);
  const boxH = Math.max(1, component.maxY - component.minY + 1);
  const boxArea = boxW * boxH;
  const fill = component.pixels / Math.max(1, boxArea);
  const aspect = Math.max(boxW / boxH, boxH / boxW);
  const compactness = clamp01(fill * 2.2);
  const aspectPenalty = clamp01(1.35 / Math.max(1, aspect));
  const hugePenalty = 1 - clamp01(Math.max(boxW / frameWidth, boxH / frameHeight) - 0.55);
  return component.weight * Math.max(0.18, compactness) * Math.max(0.2, aspectPenalty) * Math.max(0.2, hugePenalty);
}

function analyzeComponents(mask, weights, visited, stack, width, height) {
  visited.fill(0);
  let componentCount = 0;
  let best = null;
  let bestScore = -1;

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;

    componentCount += 1;
    let top = 0;
    stack[top] = start;
    top += 1;
    visited[start] = 1;

    let pixels = 0;
    let weight = 0;
    let weightedX = 0;
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;

    while (top > 0) {
      top -= 1;
      const pixelIndex = stack[top];
      const x = pixelIndex % width;
      const y = (pixelIndex - x) / width;
      const pixelWeight = weights[pixelIndex] || 0;

      pixels += 1;
      weight += pixelWeight;
      weightedX += pixelWeight * (x + 0.5);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = pixelIndex - 1;
      const right = pixelIndex + 1;
      const up = pixelIndex - width;
      const down = pixelIndex + width;
      if (x > 0 && mask[left] && !visited[left]) {
        visited[left] = 1;
        stack[top] = left;
        top += 1;
      }
      if (x < width - 1 && mask[right] && !visited[right]) {
        visited[right] = 1;
        stack[top] = right;
        top += 1;
      }
      if (y > 0 && mask[up] && !visited[up]) {
        visited[up] = 1;
        stack[top] = up;
        top += 1;
      }
      if (y < height - 1 && mask[down] && !visited[down]) {
        visited[down] = 1;
        stack[top] = down;
        top += 1;
      }
    }

    if (pixels < DEFAULT_TRACKER_CONFIG.minComponentPixels || weight <= 0) continue;
    const component = { pixels, weight, weightedX, minX, maxX, minY, maxY };
    const score = scoreComponent(component, width, height);
    if (score > bestScore) {
      bestScore = score;
      best = component;
    }
  }

  if (!best) {
    return {
      componentCount,
      pixels: 0,
      weight: 0,
      score: 0,
      widthPx: 0,
      heightPx: 0,
      x01: 0.5,
      weightedX01: 0.5,
    };
  }

  const widthPx = Math.max(1, best.maxX - best.minX + 1);
  const heightPx = Math.max(1, best.maxY - best.minY + 1);
  return {
    componentCount,
    pixels: best.pixels,
    weight: best.weight,
    score: bestScore,
    widthPx,
    heightPx,
    x01: clamp01(((best.minX + best.maxX + 1) * 0.5) / width),
    weightedX01: clamp01(best.weightedX / Math.max(1, best.weight) / width),
  };
}

function analyzeFrame(imageData, background, scratch) {
  const { data, width, height } = imageData;
  const mask = scratch.mask;
  const weights = scratch.weights;
  const bgAlpha = DEFAULT_TRACKER_CONFIG.backgroundAlpha;
  let totalWeight = 0;
  let weightedX = 0;
  let activePixels = 0;
  let maxWeight = 0;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = rowOffset + x;
      const dataIndex = pixelIndex * 4;
      const r = data[dataIndex];
      const g = data[dataIndex + 1];
      const b = data[dataIndex + 2];
      const luma = (r * 0.299) + (g * 0.587) + (b * 0.114);
      const previous = background[pixelIndex];
      const diff = Math.abs(luma - previous);
      const motionWeight = clamp01((diff - DEFAULT_TRACKER_CONFIG.motionFloor) / DEFAULT_TRACKER_CONFIG.motionScale);
      const skinWeight = estimateSkinWeight(r, g, b);
      const weight = clamp01(motionWeight * (0.65 + (skinWeight * DEFAULT_TRACKER_CONFIG.skinMotionBoost)));

      const adaptiveBgAlpha = weight > DEFAULT_TRACKER_CONFIG.minPixelWeight ? bgAlpha * 0.2 : bgAlpha;
      background[pixelIndex] = previous + ((luma - previous) * adaptiveBgAlpha);
      if (weight <= DEFAULT_TRACKER_CONFIG.minPixelWeight) {
        mask[pixelIndex] = 0;
        weights[pixelIndex] = 0;
        continue;
      }

      mask[pixelIndex] = 1;
      weights[pixelIndex] = weight;
      activePixels += 1;
      totalWeight += weight;
      weightedX += weight * (x + 0.5);
      if (weight > maxWeight) maxWeight = weight;
    }
  }

  const coverage = activePixels / Math.max(1, width * height);
  const density = totalWeight / Math.max(1, activePixels);
  const confidence = clamp01((coverage * 9) + (density * 0.55) + (maxWeight * 0.18));
  const present = totalWeight >= DEFAULT_TRACKER_CONFIG.minWeight &&
    confidence >= DEFAULT_TRACKER_CONFIG.minConfidence;
  const component = analyzeComponents(mask, weights, scratch.visited, scratch.stack, width, height);
  const selectedX01 = component.pixels > 0 ? component.x01 : 0.5;

  return {
    present,
    confidence,
    totalWeight,
    activePixels,
    component,
    weightedX01: present ? clamp01(weightedX / Math.max(1, totalWeight) / width) : 0.5,
    x01: present ? selectedX01 : 0.5,
  };
}

export function createOrbControlLiteTracker({
  rootWindow = window,
  rootDocument = document,
  now = () => performance.now(),
  onObservation = () => {},
} = {}) {
  let videoEl = null;
  let mediaStream = null;
  let detectorCanvas = null;
  let detectorContext = null;
  let background = null;
  let analysisScratch = null;
  let backgroundReady = false;
  let tickTimer = 0;
  let running = false;
  let lastVideoTime = -1;
  let lastFrameAtMs = 0;
  let lastDetectionAtMs = 0;
  const minDetectionIntervalMs = 1000 / DEFAULT_TRACKER_CONFIG.maxDetectionFps;

  function ensureDetector() {
    if (detectorCanvas && detectorContext && background) return true;
    const detector = createDetectorCanvas(rootDocument);
    detectorCanvas = detector.canvas;
    detectorContext = detector.context;
    background = new Float32Array(DEFAULT_TRACKER_CONFIG.detectorWidth * DEFAULT_TRACKER_CONFIG.detectorHeight);
    analysisScratch = createAnalysisScratch(DEFAULT_TRACKER_CONFIG.detectorWidth, DEFAULT_TRACKER_CONFIG.detectorHeight);
    return Boolean(detectorContext);
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
    ensureDetector();
    return {
      detectorBackend: "orb-control-lite",
      modelAssetUrl: "",
      wasmRootUrl: "",
      preloadMs: 0,
      wasmSimdSupported: false,
      loadedWasmAssets: "",
    };
  }

  function tick() {
    tickTimer = 0;
    if (!running || !videoEl || !ensureDetector()) return;
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
    lastFrameAtMs = observedAtMs;
    lastDetectionAtMs = observedAtMs;
    lastVideoTime = videoEl.currentTime;

    const detectStartMs = now();
    detectorContext.drawImage(
      videoEl,
      0,
      0,
      DEFAULT_TRACKER_CONFIG.detectorWidth,
      DEFAULT_TRACKER_CONFIG.detectorHeight
    );
    const imageData = detectorContext.getImageData(
      0,
      0,
      DEFAULT_TRACKER_CONFIG.detectorWidth,
      DEFAULT_TRACKER_CONFIG.detectorHeight
    );
    if (!backgroundReady) {
      const { data, width, height } = imageData;
      for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
        const dataIndex = pixelIndex * 4;
        background[pixelIndex] = (data[dataIndex] * 0.299) +
          (data[dataIndex + 1] * 0.587) +
          (data[dataIndex + 2] * 0.114);
      }
      backgroundReady = true;
    }
    const analysis = analyzeFrame(imageData, background, analysisScratch);
    const detectMs = Math.max(0, now() - detectStartMs);
    const streamSettings = resolveStreamSettings(mediaStream);
    const rawScreenX01 = analysis.present ? clamp01(1 - analysis.x01) : 0.5;
    const outputX01 = analysis.present ? calibrateOutputX01(rawScreenX01) : 0.5;
    const baseObservation = analysis.present
      ? {
          kind: "hand",
          handedness: "Any",
          handednessScore: Math.max(0.56, analysis.confidence),
          landmarksCount: Number(analysis.activePixels) || 0,
          x01: outputX01,
        }
      : {
          kind: "missing",
        };

    onObservation({
      ...baseObservation,
      observedAtMs,
      frameMs,
      fps: frameMs > 0 ? (1000 / frameMs) : 0,
      detectMs,
      videoWidth: Number(videoEl.videoWidth) || 0,
      videoHeight: Number(videoEl.videoHeight) || 0,
      detectorInputWidth: DEFAULT_TRACKER_CONFIG.detectorWidth,
      detectorInputHeight: DEFAULT_TRACKER_CONFIG.detectorHeight,
      detectorBlobWeight: Math.round((Number(analysis.totalWeight) || 0) * 10) / 10,
      detectorRawX01: Math.round(rawScreenX01 * 1000) / 1000,
      detectorWeightedX01: Math.round((analysis.present ? clamp01(1 - analysis.weightedX01) : 0.5) * 1000) / 1000,
      detectorComponentCount: Number(analysis.component && analysis.component.componentCount) || 0,
      detectorComponentPixels: Number(analysis.component && analysis.component.pixels) || 0,
      detectorComponentWidthPx: Number(analysis.component && analysis.component.widthPx) || 0,
      detectorComponentHeightPx: Number(analysis.component && analysis.component.heightPx) || 0,
      detectorComponentScore: Math.round((Number(analysis.component && analysis.component.score) || 0) * 10) / 10,
      detectorOutputX01: Math.round(outputX01 * 1000) / 1000,
      detectorOutputCenterX01: DEFAULT_TRACKER_CONFIG.outputCenterX01,
      detectorOutputGain: DEFAULT_TRACKER_CONFIG.outputGain,
      trackWidth: Number(streamSettings.width) || 0,
      trackHeight: Number(streamSettings.height) || 0,
      trackFrameRate: Number(streamSettings.frameRate) || 0,
      detectorLoop: "orb-control-lite-timeout",
      detectorBackend: "orb-control-lite",
      detectorTargetFps: DEFAULT_TRACKER_CONFIG.maxDetectionFps,
      detectorDetectMsEma: detectMs,
    });
    scheduleTick(Math.max(0, minDetectionIntervalMs - detectMs));
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
    if (background) background.fill(0);
    backgroundReady = false;
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
      detectorBackend: "orb-control-lite",
      detectorTargetFps: DEFAULT_TRACKER_CONFIG.maxDetectionFps,
      detectorDetectMsEma: 0,
    });
  }

  function destroy() {
    stop();
    detectorCanvas = null;
    detectorContext = null;
    background = null;
    analysisScratch = null;
    backgroundReady = false;
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
