import { OPENWAKEWORD_BROWSER_CONFIG_DEFAULT } from "./openwakeword-browser-config.js";

const SIM_TOKENS = Object.freeze(["ignis", "rota", "electrum", "sanctum", "domus"]);

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

export function createOpenWakeWordBrowserBackendFactory(cfg = {}) {
  const config = {
    ...OPENWAKEWORD_BROWSER_CONFIG_DEFAULT,
    ...(cfg && typeof cfg === "object" ? cfg : {}),
  };
  const tokenMap = (config.tokenMap && typeof config.tokenMap === "object") ? config.tokenMap : {};

  return async function openWakeWordBrowserBackendFactory(ctx = {}) {
    const onToken = typeof ctx.onToken === "function" ? ctx.onToken : () => {};
    const onError = typeof ctx.onError === "function" ? ctx.onError : () => {};

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
    let loadAbortController = null;

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
          if (/\.onnx$/i.test(m.url)) {
            dataUrl = `${m.url}.data`;
            if (requireOnnxDataPair) {
              const dataBlob = await fetchBuffer(dataUrl, controller.signal);
              dataBytes = dataBlob.bytes;
              totalModelBytes += dataBytes;
            }
          }

          nextLoaded.push({
            modelUrl: m.url,
            dataUrl,
            modelBytes: modelBlob.bytes,
            dataBytes,
            label: m.label || "",
            token: m.token || "",
            threshold: m.threshold,
          });
        }

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
      return true;
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
        loadedModels,
      };
    }

    return Object.freeze({
      start,
      stop,
      destroy,
      getStatus,
    });
  };
}
