import { OPENWAKEWORD_BROWSER_CONFIG_DEFAULT } from "./openwakeword-browser-config.js";

const SIM_TOKENS = Object.freeze(["tempus", "rota", "electrum", "sanctum", "domus"]);

function nowMs() {
  return (typeof performance !== "undefined" && typeof performance.now === "function")
    ? performance.now()
    : Date.now();
}

function normalizeToken(rawToken, tokenMap = {}) {
  const key = String(rawToken || "").trim();
  if (!key) return "";
  const mapped = Object.prototype.hasOwnProperty.call(tokenMap, key) ? tokenMap[key] : key;
  return String(mapped || "").trim().toLowerCase();
}

function safeUrl(rawUrl) {
  const s = String(rawUrl || "").trim();
  if (!s) return "";
  try {
    if (typeof window !== "undefined" && window.location && window.location.href) {
      return new URL(s, window.location.href).toString();
    }
    return new URL(s).toString();
  } catch {
    return "";
  }
}

function normalizeThreshold(value, fallback = null) {
  if (value == null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function parseManifest(manifest, manifestUrl) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("oww_browser_manifest_not_object");
  }
  const rawModels = Array.isArray(manifest.models) ? manifest.models : [];
  const models = [];
  for (const entry of rawModels) {
    if (typeof entry === "string") {
      const u = safeUrl(new URL(entry, manifestUrl).toString());
      if (u) models.push({ url: u, label: "", token: "", threshold: null });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const rawPath = String(entry.path || "").trim();
    if (!rawPath) continue;
    const u = safeUrl(new URL(rawPath, manifestUrl).toString());
    if (!u) continue;
    models.push({
      url: u,
      label: String(entry.label || "").trim(),
      token: String(entry.token || "").trim().toLowerCase(),
      threshold: normalizeThreshold(entry.threshold, null),
    });
  }
  const labelMap = Object.create(null);
  const thresholdMap = Object.create(null);
  if (manifest.label_map && typeof manifest.label_map === "object") {
    for (const [k, v] of Object.entries(manifest.label_map)) {
      const key = String(k || "").trim();
      const value = String(v || "").trim().toLowerCase();
      if (key && value) labelMap[key] = value;
    }
  }
  if (manifest.threshold_map && typeof manifest.threshold_map === "object") {
    for (const [k, v] of Object.entries(manifest.threshold_map)) {
      const key = String(k || "").trim().toLowerCase();
      const value = normalizeThreshold(v, null);
      if (key && value != null) thresholdMap[key] = value;
    }
  }
  if (!models.length) {
    throw new Error("oww_browser_manifest_no_models");
  }
  return { models, labelMap, thresholdMap };
}

async function fetchJson(url, signal) {
  const res = await fetch(url, { method: "GET", signal });
  if (!res.ok) throw new Error(`oww_browser_manifest_fetch_failed:${res.status}`);
  return await res.json();
}

async function fetchBuffer(url, signal) {
  const res = await fetch(url, { method: "GET", signal });
  if (!res.ok) throw new Error(`oww_browser_model_fetch_failed:${res.status}:${url}`);
  const buf = await res.arrayBuffer();
  return { buffer: buf, bytes: buf.byteLength >>> 0 };
}

function buildWorkerUrl() {
  try {
    return new URL("./openwakeword-browser-audio-worker.js", import.meta.url);
  } catch {
    return null;
  }
}

function buildInferWorkerUrl() {
  try {
    return new URL("./openwakeword-browser-infer-worker.js", import.meta.url);
  } catch {
    return null;
  }
}

function basenameFromUrl(raw) {
  try {
    const u = new URL(String(raw || ""));
    const p = String(u.pathname || "");
    return p.split("/").filter(Boolean).pop() || "";
  } catch {
    const s = String(raw || "");
    const parts = s.split(/[\\/]/g).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }
}

export function createOpenWakeWordBrowserBackendFactory(cfg = {}) {
  const config = {
    ...OPENWAKEWORD_BROWSER_CONFIG_DEFAULT,
    ...(cfg && typeof cfg === "object" ? cfg : {}),
  };
  const tokenMap = (config.tokenMap && typeof config.tokenMap === "object") ? config.tokenMap : {};

  return async function openWakeWordBrowserBackendFactory(ctx = {}) {
    const onToken = typeof ctx.onToken === "function" ? ctx.onToken : () => {};
    const onError = typeof ctx.onError === "function" ? ctx.onError : () => {};
    const stream = (ctx && ctx.stream) || null;

    let started = false;
    let running = false;
    let connected = false;
    let simulated = !!config.simulate;
    let simulationTimer = null;
    let lastError = "";
    let lastToken = "";
    let lastTokenAtMs = 0;
    let tokensEmitted = 0;
    let loading = false;
    let manifestLoaded = false;
    let modelAssetsLoaded = false;
    let manifestLoadAtMs = 0;
    let modelLoadDurationMs = 0;
    let manifestUrlResolved = "";
    let modelCount = 0;
    let loadedModelCount = 0;
    let totalModelBytes = 0;
    let loadedModels = [];
    let melModelUrlResolved = "";
    let embeddingModelUrlResolved = "";
    let melModelBytes = 0;
    let embeddingModelBytes = 0;
    let melModelBuffer = null;
    let embeddingModelBuffer = null;
    let loadAbortController = null;
    let audioWorker = null;
    let audioContext = null;
    let sourceNode = null;
    let processorNode = null;
    let audioPipelineReady = false;
    let audioStartAtMs = 0;
    let audioTargetSampleRate = 16000;
    let audioFrameSamples = 1280;
    let audioMaxQueuedFrames = 24;
    let audioChunksSent = 0;
    let audioWorkerQueueDepth = 0;
    let audioWorkerFramesProduced = 0;
    let audioWorkerFramesDropped = 0;
    let audioWorkerLastStatsAtMs = 0;
    let audioWorkerLastChunkAtMs = 0;
    let audioWorkerError = "";
    let audioWorkerConfigured = false;
    let audioInputSampleRate = 0;
    let audioResumeTimer = null;
    let audioResumeHandlersBound = false;
    let inferWorker = null;
    let inferReady = false;
    let inferLoading = false;
    let inferError = "";
    let inferOrtModuleUrl = "";
    let inferModelUrl = "";
    let inferWasmRootUrl = "";
    let inferToken = "";
    let inferThreshold = normalizeThreshold(config.inferThreshold, 0.85);
    let inferPollMs = Math.max(16, Number(config.inferPollMs) || 33);
    let inferCooldownMs = Math.max(0, Number(config.inferCooldownMs) || 600);
    let inferLastScore = 0;
    let inferLastMs = 0;
    let inferLastInferMs = 0;
    let inferFramesSent = 0;
    let inferInferences = 0;
    let inferInputShape = [];
    let inferPumpTimer = null;
    let inferFramePullInFlight = false;
    let inferFramePullSentAtMs = 0;
    let inferFramePullTimeoutMs = 1200;
    const inferLastEmitAtMsByToken = Object.create(null);
    let inferInitStep = "";
    let audioWatchdogTimer = null;
    let audioWatchdogRestartCount = 0;
    let audioWatchdogLastRestartAtMs = 0;

    function emitError(message) {
      lastError = String(message || "oww_browser_error");
      try { onError(new Error(lastError)); } catch {}
    }

    function clearSimulationTimer() {
      if (!simulationTimer) return;
      clearInterval(simulationTimer);
      simulationTimer = null;
    }

    function emitToken(token, confidence = 0.9) {
      const normalized = normalizeToken(token, tokenMap);
      if (!normalized) return;
      const atMs = nowMs();
      lastToken = normalized;
      lastTokenAtMs = atMs;
      tokensEmitted += 1;
      onToken({ token: normalized, confidence, atMs });
    }

    async function loadManifestAndAssets() {
      if (modelAssetsLoaded && loadedModels.length) return true;
      const manifestUrl = safeUrl(config.manifestUrl);
      if (!manifestUrl) throw new Error("oww_browser_manifest_url_invalid");

      const controller = new AbortController();
      loadAbortController = controller;
      loading = true;
      manifestLoaded = false;
      modelAssetsLoaded = false;
      loadedModelCount = 0;
      totalModelBytes = 0;
      loadedModels = [];
      modelLoadDurationMs = 0;
      manifestLoadAtMs = 0;
      modelCount = 0;
      manifestUrlResolved = manifestUrl;
      melModelUrlResolved = "";
      embeddingModelUrlResolved = "";
      melModelBytes = 0;
      embeddingModelBytes = 0;
      melModelBuffer = null;
      embeddingModelBuffer = null;
      const t0 = nowMs();

      try {
        const manifest = await fetchJson(manifestUrl, controller.signal);
        const parsed = parseManifest(manifest, manifestUrl);
        manifestLoaded = true;
        manifestLoadAtMs = nowMs();
        modelCount = parsed.models.length;
        const requireOnnxDataPair = !!config.requireOnnxDataPair;
        const nextLoaded = [];

        for (const m of parsed.models) {
          const modelBlob = await fetchBuffer(m.url, controller.signal);
          totalModelBytes += modelBlob.bytes;
          loadedModelCount += 1;

          let dataUrl = "";
          let dataBytes = 0;
          let dataBuffer = null;
          if (/\.onnx$/i.test(m.url)) {
            dataUrl = `${m.url}.data`;
            if (requireOnnxDataPair) {
              const dataBlob = await fetchBuffer(dataUrl, controller.signal);
              dataBytes = dataBlob.bytes;
              dataBuffer = dataBlob.buffer;
              totalModelBytes += dataBytes;
            }
          }

          const mToken = normalizeToken(m.token || m.label || "", tokenMap);
          const mLabel = String(m.label || "").trim();
          let effectiveThreshold = normalizeThreshold(m.threshold, null);
          if (effectiveThreshold == null && mToken && Object.prototype.hasOwnProperty.call(parsed.thresholdMap, mToken)) {
            effectiveThreshold = normalizeThreshold(parsed.thresholdMap[mToken], null);
          }
          if (effectiveThreshold == null && mLabel && Object.prototype.hasOwnProperty.call(parsed.thresholdMap, mLabel.toLowerCase())) {
            effectiveThreshold = normalizeThreshold(parsed.thresholdMap[mLabel.toLowerCase()], null);
          }

          nextLoaded.push({
            modelUrl: m.url,
            dataUrl,
            modelBytes: modelBlob.bytes,
            dataBytes,
            modelBuffer: modelBlob.buffer,
            dataBuffer,
            label: m.label || "",
            token: m.token || "",
            threshold: effectiveThreshold,
          });
        }

        const melUrl = safeUrl(config.melModelUrl || "");
        const embUrl = safeUrl(config.embeddingModelUrl || "");
        if (!melUrl) throw new Error("oww_browser_mel_model_url_invalid");
        if (!embUrl) throw new Error("oww_browser_embedding_model_url_invalid");
        const melBlob = await fetchBuffer(melUrl, controller.signal);
        const embBlob = await fetchBuffer(embUrl, controller.signal);
        melModelUrlResolved = melUrl;
        embeddingModelUrlResolved = embUrl;
        melModelBytes = melBlob.bytes;
        embeddingModelBytes = embBlob.bytes;
        melModelBuffer = melBlob.buffer;
        embeddingModelBuffer = embBlob.buffer;
        totalModelBytes += melModelBytes + embeddingModelBytes;

        loadedModels = nextLoaded;
        modelAssetsLoaded = true;
        modelLoadDurationMs = Math.max(0, nowMs() - t0);
        return true;
      } finally {
        loading = false;
        if (loadAbortController === controller) loadAbortController = null;
      }
    }

    function abortLoading() {
      if (!loadAbortController) return;
      try { loadAbortController.abort(); } catch {}
      loadAbortController = null;
    }

    function resetAudioStats() {
      audioChunksSent = 0;
      audioWorkerQueueDepth = 0;
      audioWorkerFramesProduced = 0;
      audioWorkerFramesDropped = 0;
      audioWorkerLastStatsAtMs = 0;
      audioWorkerLastChunkAtMs = 0;
      audioWorkerError = "";
      audioWorkerConfigured = false;
      audioStartAtMs = 0;
      audioInputSampleRate = 0;
      audioWatchdogRestartCount = 0;
      audioWatchdogLastRestartAtMs = 0;
    }

    function terminateAudioWorker() {
      if (!audioWorker) return;
      try { audioWorker.postMessage({ type: "stop" }); } catch {}
      try { audioWorker.terminate(); } catch {}
      audioWorker = null;
    }

    function clearInferPumpTimer() {
      if (!inferPumpTimer) return;
      clearInterval(inferPumpTimer);
      inferPumpTimer = null;
    }

    function clearAudioWatchdog() {
      if (!audioWatchdogTimer) return;
      clearInterval(audioWatchdogTimer);
      audioWatchdogTimer = null;
    }

    function terminateInferWorker() {
      if (!inferWorker) return;
      try { inferWorker.postMessage({ type: "stop" }); } catch {}
      try { inferWorker.terminate(); } catch {}
      inferWorker = null;
    }

    function clearAudioResumeTimer() {
      if (!audioResumeTimer) return;
      clearInterval(audioResumeTimer);
      audioResumeTimer = null;
    }

    function removeResumeHandlers() {
      if (!audioResumeHandlersBound) return;
      if (typeof window !== "undefined" && window && window.removeEventListener) {
        try { window.removeEventListener("pointerdown", handleResumeGesture, true); } catch {}
        try { window.removeEventListener("keydown", handleResumeGesture, true); } catch {}
      }
      audioResumeHandlersBound = false;
    }

    async function tryResumeAudioContext() {
      if (!audioContext) return false;
      if (audioContext.state === "running") return true;
      try {
        await audioContext.resume();
      } catch {}
      return audioContext.state === "running";
    }

    function handleResumeGesture() {
      void tryResumeAudioContext();
    }

    function armAudioResumeGuards() {
      clearAudioResumeTimer();
      removeResumeHandlers();
      audioResumeTimer = setInterval(() => {
        if (!audioContext) return;
        if (audioContext.state === "running") {
          clearAudioResumeTimer();
          removeResumeHandlers();
          return;
        }
        void tryResumeAudioContext();
      }, 1000);
      if (typeof window !== "undefined" && window && window.addEventListener) {
        try { window.addEventListener("pointerdown", handleResumeGesture, true); } catch {}
        try { window.addEventListener("keydown", handleResumeGesture, true); } catch {}
        audioResumeHandlersBound = true;
      }
    }

    async function stopAudioPipeline() {
      if (processorNode) {
        try { processorNode.disconnect(); } catch {}
      }
      if (sourceNode) {
        try { sourceNode.disconnect(); } catch {}
      }
      processorNode = null;
      sourceNode = null;

      if (audioContext) {
        try { await audioContext.close(); } catch {}
      }
      audioContext = null;
      clearAudioResumeTimer();
      removeResumeHandlers();
      clearAudioWatchdog();
      terminateAudioWorker();
      audioPipelineReady = false;
      return true;
    }

    function startAudioWatchdog() {
      clearAudioWatchdog();
      audioWatchdogTimer = setInterval(() => {
        if (!started || !running || simulated) return;
        if (!audioPipelineReady || !audioContext) return;
        if (String(audioContext.state || "").toLowerCase() !== "running") return;
        const ageMs = Math.max(0, nowMs() - Number(audioStartAtMs || 0));
        if (ageMs < 2500) return;
        if (audioChunksSent > 0) return;
        if (audioWatchdogRestartCount >= 3) return;
        const sinceLast = Math.max(0, nowMs() - Number(audioWatchdogLastRestartAtMs || 0));
        if (sinceLast < 1500) return;
        audioWatchdogRestartCount += 1;
        audioWatchdogLastRestartAtMs = nowMs();
        Promise.resolve()
          .then(() => startAudioPipeline())
          .catch((err) => {
            const m = err && err.message ? String(err.message) : "oww_browser_audio_watchdog_restart_failed";
            audioWorkerError = m;
            emitError(m);
          });
      }, 700);
    }

    async function stopInferPipeline() {
      clearInferPumpTimer();
      inferFramePullInFlight = false;
      inferFramePullSentAtMs = 0;
      terminateInferWorker();
      for (const k of Object.keys(inferLastEmitAtMsByToken)) {
        delete inferLastEmitAtMsByToken[k];
      }
      inferReady = false;
      inferLoading = false;
      inferModelUrl = "";
      inferOrtModuleUrl = "";
      inferWasmRootUrl = "";
      inferToken = "";
      inferLastScore = 0;
      inferLastMs = 0;
      inferLastInferMs = 0;
      inferFramesSent = 0;
      inferInferences = 0;
      inferInputShape = [];
      inferInitStep = "";
      return true;
    }

    function startInferPump() {
      clearInferPumpTimer();
      inferFramePullInFlight = false;
      inferFramePullSentAtMs = 0;
      inferPumpTimer = setInterval(() => {
        if (!started || !running) return;
        if (!audioWorker || !audioPipelineReady) return;
        if (!inferWorker || !inferReady) return;
        if (inferFramePullInFlight) {
          const elapsed = Math.max(0, nowMs() - Number(inferFramePullSentAtMs || 0));
          if (elapsed < inferFramePullTimeoutMs) return;
          // Recover from a lost/ignored pull response instead of stalling forever.
          inferFramePullInFlight = false;
          inferFramePullSentAtMs = 0;
        }
        inferFramePullInFlight = true;
        inferFramePullSentAtMs = nowMs();
        try {
          audioWorker.postMessage({ type: "pull_frame" });
        } catch {
          inferFramePullInFlight = false;
          inferFramePullSentAtMs = 0;
        }
      }, inferPollMs);
    }

    async function startInferPipeline() {
      if (simulated) return true;
      if (inferWorker && inferReady) return true;
      if (typeof Worker !== "function") {
        throw new Error("oww_browser_infer_worker_unavailable");
      }
      const activeModels = loadedModels.filter((m) => !!(m && m.modelUrl));
      if (!activeModels.length) {
        throw new Error("oww_browser_infer_model_missing");
      }
      const inferWorkerUrl = buildInferWorkerUrl();
      if (!inferWorkerUrl) {
        throw new Error("oww_browser_infer_worker_url_invalid");
      }
      await stopInferPipeline();
      inferLoading = true;
      inferError = "";
      inferOrtModuleUrl = safeUrl(config.ortModuleUrl || "");
      if (!inferOrtModuleUrl) {
        throw new Error("oww_browser_infer_ort_module_url_invalid");
      }
      inferModelUrl = activeModels.length === 1
        ? String(activeModels[0].modelUrl || "")
        : `multi:${activeModels.length}`;
      inferToken = "multi";
      inferWasmRootUrl = safeUrl(config.ortWasmRootUrl || "");
      if (!inferWasmRootUrl) {
        if (inferOrtModuleUrl) {
          try {
            inferWasmRootUrl = new URL(".", inferOrtModuleUrl).toString();
          } catch {}
        }
      }

      const worker = new Worker(inferWorkerUrl, { type: "module" });
      inferWorker = worker;

      const classifiers = activeModels.map((m) => {
        const modelUrl = String(m.modelUrl || "");
        const modelToken = normalizeToken(m.token || m.label || "", tokenMap);
        const modelThreshold = normalizeThreshold(m.threshold, inferThreshold);
        const externalData = [];
        if (m && m.dataBuffer) {
          const names = new Set();
          const base = basenameFromUrl(m.dataUrl || `${m.modelUrl}.data`);
          if (base) {
            names.add(base);
            names.add(`"${base}"`);
            names.add(`'${base}'`);
          }
          if (m.dataUrl) names.add(String(m.dataUrl));
          for (const p of names) {
            externalData.push({ path: p, data: m.dataBuffer });
          }
        }
        return {
          modelUrl,
          modelBuffer: m && m.modelBuffer ? m.modelBuffer : null,
          token: modelToken || modelUrl,
          threshold: modelThreshold == null ? inferThreshold : modelThreshold,
          externalData,
        };
      }).filter((m) => !!m.modelUrl);

      worker.addEventListener("message", (ev) => {
        const msg = ev && ev.data ? ev.data : {};
        const type = String(msg.type || "");
        if (type === "ready") {
          inferReady = true;
          inferLoading = false;
          inferInitStep = "ready";
          return;
        }
        if (type === "init_progress") {
          inferInitStep = String(msg.step || "").trim().toLowerCase();
          return;
        }
        if (type === "infer_stats") {
          inferLastMs = Number(msg.atMs) || nowMs();
          inferLastInferMs = Number(msg.inferMs) || 0;
          inferInferences = Number(msg.inferences) || inferInferences;
          inferLastScore = Number(msg.lastScore) || 0;
          inferInputShape = Array.isArray(msg.inputShape) ? msg.inputShape.slice() : [];
          return;
        }
        if (type === "token_detected") {
          const token = normalizeToken(msg.token || inferToken, tokenMap);
          const atMs = Number(msg.atMs) || nowMs();
          const confidence = Number(msg.confidence);
          if (!token) return;
          const lastEmit = Number(inferLastEmitAtMsByToken[token] || 0);
          if ((atMs - lastEmit) < inferCooldownMs) return;
          inferLastEmitAtMsByToken[token] = atMs;
          emitToken(token, Number.isFinite(confidence) ? confidence : 0.9);
          return;
        }
        if (type === "error") {
          inferError = String(msg.message || "oww_browser_infer_worker_error");
          inferLoading = false;
          inferReady = false;
          emitError(inferError);
        }
      });
      worker.addEventListener("error", (ev) => {
        const msg = ev && ev.message ? String(ev.message) : "oww_browser_infer_worker_script_error";
        inferError = msg;
        inferLoading = false;
        inferReady = false;
        emitError(inferError);
      });
      worker.addEventListener("messageerror", () => {
        inferError = "oww_browser_infer_worker_messageerror";
        inferLoading = false;
        inferReady = false;
        emitError(inferError);
      });

      let readyResolved = false;
      await new Promise((resolve, reject) => {
        const rejectOnce = (err) => {
          if (readyResolved) return;
          readyResolved = true;
          clearTimeout(t);
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onWorkerError);
          worker.removeEventListener("messageerror", onWorkerMessageError);
          reject(err instanceof Error ? err : new Error(String(err || "oww_browser_infer_init_failed")));
        };
        const resolveOnce = () => {
          if (readyResolved) return;
          readyResolved = true;
          clearTimeout(t);
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onWorkerError);
          worker.removeEventListener("messageerror", onWorkerMessageError);
          resolve(true);
        };
        const t = setTimeout(() => {
          rejectOnce(new Error(inferError || "oww_browser_infer_ready_timeout"));
        }, 60000);
        const onMessage = (ev) => {
          const msg = ev && ev.data ? ev.data : {};
          const type = String(msg.type || "");
          if (type === "ready") {
            resolveOnce();
            return;
          }
          if (type === "error") {
            const m = String(msg.message || "oww_browser_infer_init_error");
            inferError = m;
            rejectOnce(new Error(m));
          }
        };
        const onWorkerError = (ev) => {
          const m = (ev && ev.message) ? String(ev.message) : "oww_browser_infer_worker_script_error";
          inferError = m;
          rejectOnce(new Error(m));
        };
        const onWorkerMessageError = () => {
          inferError = "oww_browser_infer_worker_messageerror";
          rejectOnce(new Error(inferError));
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onWorkerError);
        worker.addEventListener("messageerror", onWorkerMessageError);
        worker.postMessage({
          type: "init",
          ortModuleUrl: inferOrtModuleUrl,
          wasmRootUrl: inferWasmRootUrl || "",
          melModelUrl: melModelUrlResolved || String(config.melModelUrl || ""),
          embeddingModelUrl: embeddingModelUrlResolved || String(config.embeddingModelUrl || ""),
          melModelBuffer,
          embeddingModelBuffer,
          classifiers,
          threshold: inferThreshold,
        });
      });

      inferReady = true;
      inferLoading = false;
      startInferPump();
      return true;
    }

    async function startAudioPipeline() {
      if (audioPipelineReady && audioWorker && audioContext) return true;
      if (!stream || typeof stream.getTracks !== "function") {
        throw new Error("oww_browser_stream_missing");
      }
      if (typeof Worker !== "function") {
        throw new Error("oww_browser_worker_unavailable");
      }
      const AudioContextCtor = (typeof window !== "undefined")
        ? (window.AudioContext || window.webkitAudioContext)
        : null;
      if (typeof AudioContextCtor !== "function") {
        throw new Error("oww_browser_audio_context_unavailable");
      }

      await stopAudioPipeline();
      resetAudioStats();

      const workerUrl = buildWorkerUrl();
      if (!workerUrl) {
        throw new Error("oww_browser_audio_worker_url_invalid");
      }
      const worker = new Worker(workerUrl, { type: "module" });
      audioWorker = worker;

      worker.addEventListener("message", (ev) => {
        const msg = ev && ev.data ? ev.data : {};
        const type = String(msg.type || "");
        if (type === "ready") {
          audioWorkerConfigured = true;
          return;
        }
        if (type === "stats") {
          audioWorkerLastStatsAtMs = Number(msg.atMs) || nowMs();
          audioWorkerQueueDepth = Number(msg.queueDepth) || 0;
          audioWorkerFramesProduced = Number(msg.framesProduced) || 0;
          audioWorkerFramesDropped = Number(msg.framesDropped) || 0;
          audioWorkerLastChunkAtMs = Number(msg.lastChunkAtMs) || 0;
          audioWorkerConfigured = !!msg.configured;
          return;
        }
        if (type === "frame") {
          inferFramePullInFlight = false;
          inferFramePullSentAtMs = 0;
          audioWorkerQueueDepth = Number(msg.queueDepth) || 0;
          if (!msg.hasFrame) return;
          if (!inferWorker || !inferReady) return;
          try {
            inferFramesSent += 1;
            inferWorker.postMessage({ type: "frame", frame: msg.frame }, [msg.frame]);
          } catch (err) {
            inferError = err && err.message ? String(err.message) : "oww_browser_infer_frame_post_failed";
            emitError(inferError);
          }
          return;
        }
        if (type === "error") {
          audioWorkerError = String(msg.message || "oww_browser_audio_worker_error");
          emitError(audioWorkerError);
        }
      });

      let readyResolved = false;
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          if (readyResolved) return;
          readyResolved = true;
          reject(new Error("oww_browser_audio_worker_ready_timeout"));
        }, 3000);
        const onMessage = (ev) => {
          const msg = ev && ev.data ? ev.data : {};
          if (String(msg.type || "") !== "ready") return;
          if (readyResolved) return;
          readyResolved = true;
          clearTimeout(t);
          worker.removeEventListener("message", onMessage);
          resolve(true);
        };
        worker.addEventListener("message", onMessage);
        worker.postMessage({
          type: "init",
          inputSampleRate: 48000, // temporary; replaced once AudioContext is ready
          targetSampleRate: audioTargetSampleRate,
          frameSamples: audioFrameSamples,
          maxQueuedFrames: audioMaxQueuedFrames,
        });
      });

      const ctx = new AudioContextCtor();
      audioContext = ctx;
      audioInputSampleRate = Number(ctx.sampleRate) || 0;

      // Re-init worker with true device sample rate now that AudioContext is known.
      worker.postMessage({
        type: "init",
        inputSampleRate: audioInputSampleRate || 48000,
        targetSampleRate: audioTargetSampleRate,
        frameSamples: audioFrameSamples,
        maxQueuedFrames: audioMaxQueuedFrames,
      });

      sourceNode = ctx.createMediaStreamSource(stream);
      processorNode = ctx.createScriptProcessor(4096, 1, 1);

      processorNode.onaudioprocess = (ev) => {
        if (!audioWorker) return;
        try {
          const ch0 = ev.inputBuffer.getChannelData(0);
          if (!ch0 || !ch0.length) return;
          const out0 = ev.outputBuffer && ev.outputBuffer.numberOfChannels > 0
            ? ev.outputBuffer.getChannelData(0)
            : null;
          if (out0 && out0.length) out0.fill(0);
          const copy = new Float32Array(ch0.length);
          copy.set(ch0);
          audioChunksSent += 1;
          audioWorker.postMessage({ type: "audio", samples: copy }, [copy.buffer]);
        } catch (err) {
          audioWorkerError = err && err.message ? String(err.message) : "oww_browser_audio_chunk_send_failed";
          emitError(audioWorkerError);
        }
      };

      sourceNode.connect(processorNode);
      processorNode.connect(ctx.destination);

      if (ctx.state !== "running") {
        try { await ctx.resume(); } catch {}
      }
      if (ctx.state !== "running") {
        armAudioResumeGuards();
      } else {
        clearAudioResumeTimer();
        removeResumeHandlers();
      }
      audioStartAtMs = nowMs();
      audioPipelineReady = true;
      startAudioWatchdog();
      return true;
    }

    async function start() {
      started = true;
      lastError = "";

      if (simulated) {
        running = true;
        connected = true;
        clearSimulationTimer();
        const intervalMs = Math.max(200, Number(config.simulationIntervalMs) || 1400);
        simulationTimer = setInterval(() => {
          const token = SIM_TOKENS[Math.floor(Math.random() * SIM_TOKENS.length)];
          emitToken(token, 0.85);
        }, intervalMs);
        return true;
      }

      try {
        await loadManifestAndAssets();
        await startAudioPipeline();
        await startInferPipeline();
        running = true;
        connected = true;
        return true;
      } catch (err) {
        running = false;
        connected = false;
        emitError(err && err.message ? String(err.message) : "oww_browser_load_failed");
        return false;
      }
    }

    async function stop() {
      started = false;
      running = false;
      connected = false;
      clearSimulationTimer();
      abortLoading();
      await stopInferPipeline();
      await stopAudioPipeline();
      return true;
    }

    async function destroy() {
      await stop();
      manifestLoaded = false;
      modelAssetsLoaded = false;
      loadedModelCount = 0;
      totalModelBytes = 0;
      loadedModels = [];
      modelLoadDurationMs = 0;
      manifestLoadAtMs = 0;
      modelCount = 0;
      manifestUrlResolved = "";
      resetAudioStats();
      return true;
    }

    function setConfig(next = {}) {
      if (!next || typeof next !== "object") return getStatus();
      if (Object.prototype.hasOwnProperty.call(next, "inferThreshold")) {
        const n = Number(next.inferThreshold);
        if (Number.isFinite(n)) inferThreshold = normalizeThreshold(n, inferThreshold);
      }
      if (Object.prototype.hasOwnProperty.call(next, "inferCooldownMs")) {
        const n = Number(next.inferCooldownMs);
        if (Number.isFinite(n)) inferCooldownMs = Math.max(0, Math.round(n));
      }
      if (Object.prototype.hasOwnProperty.call(next, "inferPollMs")) {
        const n = Number(next.inferPollMs);
        if (Number.isFinite(n)) inferPollMs = Math.max(16, Math.round(n));
      }
      if (inferWorker) {
        try {
          inferWorker.postMessage({
            type: "set_config",
            threshold: inferThreshold,
          });
        } catch {}
      }
      return getStatus();
    }

    function getStatus() {
      return {
        backend: "openwakeword-browser",
        label: String(config.label || "openwakeword-browser"),
        connected,
        started,
        running,
        simulated,
        requiresMic: true,
        lastError,
        lastToken,
        lastTokenAtMs,
        tokensEmitted,
        loading,
        manifestUrl: manifestUrlResolved || String(config.manifestUrl || ""),
        manifestLoaded,
        modelAssetsLoaded,
        modelCount,
        loadedModelCount,
        totalModelBytes,
        modelLoadDurationMs,
        manifestLoadAtMs,
        loadedModels: loadedModels.map((m) => ({
          modelUrl: m.modelUrl,
          dataUrl: m.dataUrl,
          modelBytes: m.modelBytes,
          dataBytes: m.dataBytes,
          label: m.label,
          token: m.token,
          threshold: m.threshold,
        })),
        audioPipelineReady,
        audioContextState: audioContext ? String(audioContext.state || "") : "",
        audioStartAtMs,
        audioInputSampleRate,
        audioTargetSampleRate,
        audioFrameSamples,
        audioMaxQueuedFrames,
        audioChunksSent,
        audioWorkerConfigured,
        audioWorkerQueueDepth,
        audioWorkerFramesProduced,
        audioWorkerFramesDropped,
        audioWorkerLastStatsAtMs,
        audioWorkerLastChunkAtMs,
        audioWorkerError,
        melModelUrl: melModelUrlResolved || String(config.melModelUrl || ""),
        embeddingModelUrl: embeddingModelUrlResolved || String(config.embeddingModelUrl || ""),
        melModelBytes,
        embeddingModelBytes,
        inferReady,
        inferLoading,
        inferError,
        inferOrtModuleUrl,
        inferModelUrl,
        inferWasmRootUrl,
        inferToken,
        inferThreshold,
        inferPollMs,
        inferCooldownMs,
        inferFramesSent,
        inferInferences,
        inferLastScore,
        inferLastMs,
        inferLastInferMs,
        inferInputShape,
        inferInitStep,
      };
    }

    return Object.freeze({
      start,
      stop,
      destroy,
      setConfig,
      getStatus,
    });
  };
}
