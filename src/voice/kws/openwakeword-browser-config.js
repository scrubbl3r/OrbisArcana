function readUrlParams() {
  try {
    if (typeof window === "undefined" || !window.location) return null;
    return new URLSearchParams(String(window.location.search || ""));
  } catch {
    return null;
  }
}

function readBooleanParam(name, fallback = false) {
  const params = readUrlParams();
  const raw = String(params && params.get(name) || "").trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
  if (raw === "0" || raw === "false" || raw === "no" || raw === "off") return false;
  return !!fallback;
}

function readStringParam(name, fallback = "") {
  const params = readUrlParams();
  const raw = String(params && params.get(name) || "").trim();
  return raw || String(fallback || "");
}

function readNumberParam(name, fallback = 0) {
  const params = readUrlParams();
  const raw = String(params && params.get(name) || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number(fallback);
}

export const OPENWAKEWORD_BROWSER_CONFIG_DEFAULT = Object.freeze({
  enabled: true,
  label: "openwakeword-browser",
  // Slice 1 only: optional simulated token emit loop for backend contract testing.
  simulate: readBooleanParam("owwBrowserSim", false),
  simulationIntervalMs: 1400,
  manifestUrl: readStringParam("owwBrowserManifest", "./tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json"),
  melModelUrl: readStringParam("owwBrowserMelModel", "./assets/kws/openwakeword-base-models/melspectrogram.onnx"),
  embeddingModelUrl: readStringParam("owwBrowserEmbeddingModel", "./assets/kws/openwakeword-base-models/embedding_model.onnx"),
  requireOnnxDataPair: readBooleanParam("owwBrowserRequireOnnxData", true),
  ortModuleUrl: readStringParam("owwBrowserOrtModule", "./vendor/onnxruntime/1.22.0/ort.wasm.min.mjs"),
  ortWasmRootUrl: readStringParam("owwBrowserOrtWasmRoot", "./vendor/onnxruntime/1.22.0/"),
  inferToken: readStringParam("owwBrowserToken", "tempus").toLowerCase(),
  inferThreshold: readNumberParam("owwBrowserInferThreshold", 0.05),
  inferCooldownMs: 600,
  inferPollMs: 33,
  tokenMap: Object.freeze({
    ingis: "tempus",
    igins: "tempus",
    ignuss: "tempus",
    ignus: "tempus",
    firdgis: "fridgis",
  }),
});
