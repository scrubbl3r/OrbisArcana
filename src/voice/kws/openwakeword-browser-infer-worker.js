let ortRef = null;
let session = null;
let inputName = "";
let outputName = "";
let modelToken = "";
let threshold = 0.85;
let initialized = false;
let framesSeen = 0;
let inferences = 0;
let lastScore = 0;
let lastInferAtMs = 0;
let inputShape = [];
let lastError = "";

function nowMs() {
  return Date.now();
}

function toFiniteNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function loadOrtModule(url) {
  const mod = await import(String(url || ""));
  if (mod && mod.ort) return mod.ort;
  if (mod && mod.default && mod.default.InferenceSession) return mod.default;
  if (mod && mod.InferenceSession) return mod;
  if (typeof self !== "undefined" && self.ort && self.ort.InferenceSession) return self.ort;
  throw new Error("oww_browser_infer_ort_unavailable");
}

function resolveDims(dimensions, frameSize) {
  const dims = Array.isArray(dimensions) ? dimensions.slice() : [1, frameSize];
  const out = [];
  for (let i = 0; i < dims.length; i += 1) {
    const d = dims[i];
    if (typeof d === "number" && Number.isFinite(d) && d > 0) {
      out.push(Math.floor(d));
      continue;
    }
    if (i === dims.length - 1) {
      out.push(frameSize);
      continue;
    }
    out.push(1);
  }
  return out.length ? out : [1, frameSize];
}

function product(arr) {
  let p = 1;
  for (const n of arr) p *= Math.max(1, Math.floor(Number(n) || 1));
  return p;
}

function buildInputTensor(frameI16) {
  const frame = frameI16 instanceof Int16Array ? frameI16 : new Int16Array(0);
  const frameSize = frame.length || 1280;
  const md = session && session.inputMetadata && inputName ? session.inputMetadata[inputName] : null;
  const dims = resolveDims(md && md.dimensions, frameSize);
  const needed = product(dims);
  const data = new Float32Array(needed);
  const copyN = Math.min(needed, frame.length);
  for (let i = 0; i < copyN; i += 1) {
    data[i] = Math.max(-1, Math.min(1, frame[i] / 32768));
  }
  inputShape = dims;
  return new ortRef.Tensor("float32", data, dims);
}

function extractScore(output) {
  if (!output || typeof output !== "object") return 0;
  let maxScore = 0;
  for (const v of Object.values(output)) {
    const data = v && v.data ? v.data : null;
    if (!data || typeof data.length !== "number") continue;
    for (let i = 0; i < data.length; i += 1) {
      const n = toFiniteNumber(data[i], 0);
      if (n > maxScore) maxScore = n;
    }
  }
  return maxScore;
}

async function onInit(msg) {
  const ortModuleUrl = String(msg && msg.ortModuleUrl || "").trim();
  const wasmRootUrl = String(msg && msg.wasmRootUrl || "").trim();
  const modelUrl = String(msg && msg.modelUrl || "").trim();
  modelToken = String(msg && msg.token || "").trim().toLowerCase();
  threshold = toFiniteNumber(msg && msg.threshold, 0.85);
  if (!ortModuleUrl) throw new Error("oww_browser_infer_missing_ort_module_url");
  if (!modelUrl) throw new Error("oww_browser_infer_missing_model_url");
  ortRef = await loadOrtModule(ortModuleUrl);
  if (ortRef && ortRef.env && ortRef.env.wasm) {
    ortRef.env.wasm.numThreads = 1;
    ortRef.env.wasm.proxy = false;
    if (wasmRootUrl) {
      const root = wasmRootUrl.endsWith("/") ? wasmRootUrl : `${wasmRootUrl}/`;
      ortRef.env.wasm.wasmPaths = root;
    }
  }
  session = await ortRef.InferenceSession.create(modelUrl, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  inputName = session && Array.isArray(session.inputNames) ? String(session.inputNames[0] || "") : "";
  outputName = session && Array.isArray(session.outputNames) ? String(session.outputNames[0] || "") : "";
  if (!inputName) throw new Error("oww_browser_infer_missing_input_name");
  initialized = true;
  postMessage({
    type: "ready",
    atMs: nowMs(),
    token: modelToken,
    inputName,
    outputName,
    wasmRootUrl,
  });
}

async function onFrame(msg) {
  if (!initialized || !session || !ortRef) return;
  const frame = msg && msg.frame instanceof ArrayBuffer ? new Int16Array(msg.frame) : new Int16Array(0);
  framesSeen += 1;
  const t0 = nowMs();
  const tensor = buildInputTensor(frame);
  const output = await session.run({ [inputName]: tensor });
  inferences += 1;
  lastInferAtMs = nowMs();
  lastScore = extractScore(output);
  postMessage({
    type: "infer_stats",
    atMs: lastInferAtMs,
    inferMs: Math.max(0, lastInferAtMs - t0),
    framesSeen,
    inferences,
    lastScore,
    inputShape,
  });
  if (lastScore >= threshold && modelToken) {
    postMessage({
      type: "token_detected",
      atMs: lastInferAtMs,
      token: modelToken,
      confidence: lastScore,
    });
  }
}

function reportError(err) {
  lastError = err && err.message ? String(err.message) : "oww_browser_infer_worker_error";
  postMessage({ type: "error", atMs: nowMs(), message: lastError });
}

self.onmessage = (ev) => {
  const msg = ev && ev.data ? ev.data : {};
  const type = String(msg && msg.type || "");
  if (type === "init") {
    onInit(msg).catch(reportError);
    return;
  }
  if (type === "frame") {
    onFrame(msg).catch(reportError);
    return;
  }
  if (type === "stop") {
    initialized = false;
    session = null;
    ortRef = null;
    inputName = "";
    outputName = "";
    return;
  }
};
