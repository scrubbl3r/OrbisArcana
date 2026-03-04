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

export const OPENWAKEWORD_BROWSER_CONFIG_DEFAULT = Object.freeze({
  enabled: true,
  label: "openwakeword-browser",
  // Slice 1 only: optional simulated token emit loop for backend contract testing.
  simulate: readBooleanParam("owwBrowserSim", false),
  simulationIntervalMs: 1400,
  manifestUrl: readStringParam("owwBrowserManifest", "./tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json"),
  requireOnnxDataPair: readBooleanParam("owwBrowserRequireOnnxData", true),
  ortModuleUrl: readStringParam("owwBrowserOrtModule", "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.all.min.mjs"),
  inferToken: readStringParam("owwBrowserToken", "ignis").toLowerCase(),
  inferThreshold: 0.85,
  inferCooldownMs: 600,
  inferPollMs: 33,
  tokenMap: Object.freeze({
    ingis: "ignis",
    igins: "ignis",
    ignuss: "ignis",
    ignus: "ignis",
    firdgis: "fridgis",
  }),
});
