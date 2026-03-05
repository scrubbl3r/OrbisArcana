let ortRef = null;
let melSession = null;
let embeddingSession = null;
const classifierEntries = [];

let melInputName = "";
let melOutputName = "";
let embeddingInputName = "";
let embeddingOutputName = "";
let threshold = 0.85;
let initialized = false;
let processing = false;

let framesSeen = 0;
let inferences = 0;
let lastScore = 0;
let lastInferAtMs = 0;
let inputShape = [];
let lastError = "";
let initStep = "";

const PCM_WINDOW_SAMPLES = 12640; // yields mel output [1,1,76,32]
const EMBEDDING_HISTORY = 16;
const EMBEDDING_DIMS = 96;

let pcmRing = new Float32Array(PCM_WINDOW_SAMPLES);
let pcmWrite = 0;
let pcmFilled = 0;
const frameQueue = [];
const embeddingQueue = [];

function nowMs() {
  return Date.now();
}

function toFiniteNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function setInitStep(step) {
  initStep = String(step || "").trim().toLowerCase();
  postMessage({ type: "init_progress", atMs: nowMs(), step: initStep });
}

async function loadOrtModule(url) {
  const mod = await import(String(url || ""));
  if (mod && mod.ort) return mod.ort;
  if (mod && mod.default && mod.default.InferenceSession) return mod.default;
  if (mod && mod.InferenceSession) return mod;
  if (typeof self !== "undefined" && self.ort && self.ort.InferenceSession) return self.ort;
  throw new Error("oww_browser_infer_ort_unavailable");
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

function extractEmbedding(output) {
  if (!output || typeof output !== "object") return null;
  const t = embeddingOutputName && output[embeddingOutputName] ? output[embeddingOutputName] : Object.values(output)[0];
  const data = t && t.data ? t.data : null;
  if (!data || data.length < EMBEDDING_DIMS) return null;
  const out = new Float32Array(EMBEDDING_DIMS);
  out.set(data.slice(0, EMBEDDING_DIMS));
  return out;
}

function resetState() {
  pcmRing = new Float32Array(PCM_WINDOW_SAMPLES);
  pcmWrite = 0;
  pcmFilled = 0;
  frameQueue.length = 0;
  embeddingQueue.length = 0;
  framesSeen = 0;
  inferences = 0;
  lastScore = 0;
  lastInferAtMs = 0;
  inputShape = [];
}

function appendPcmFrame(frameI16) {
  const frame = frameI16 instanceof Int16Array ? frameI16 : new Int16Array(0);
  for (let i = 0; i < frame.length; i += 1) {
    // openWakeWord expects 16-bit PCM amplitude scale (int16 range), cast to float32.
    pcmRing[pcmWrite] = Number(frame[i]) || 0;
    pcmWrite = (pcmWrite + 1) % PCM_WINDOW_SAMPLES;
  }
  pcmFilled = Math.min(PCM_WINDOW_SAMPLES, pcmFilled + frame.length);
}

function readPcmWindow() {
  const out = new Float32Array(PCM_WINDOW_SAMPLES);
  out.set(pcmRing.subarray(pcmWrite));
  out.set(pcmRing.subarray(0, pcmWrite), PCM_WINDOW_SAMPLES - pcmWrite);
  return out;
}

function enqueueFrame(frameI16) {
  frameQueue.push(frameI16);
  if (frameQueue.length > 4) frameQueue.shift(); // keep newest, drop backlog
}

async function runPipelineForFrame(frameI16) {
  framesSeen += 1;
  appendPcmFrame(frameI16);
  if (pcmFilled < PCM_WINDOW_SAMPLES) return;

  const t0 = nowMs();
  const pcm = readPcmWindow();
  const melInput = new ortRef.Tensor("float32", pcm, [1, PCM_WINDOW_SAMPLES]);
  const melOut = await melSession.run({ [melInputName]: melInput });
  const melTensor = melOut[melOutputName];
  const melData = melTensor && melTensor.data ? melTensor.data : null;
  const melDims = melTensor && melTensor.dims ? melTensor.dims : [];
  if (!melData) {
    throw new Error("oww_browser_infer_mel_output_missing");
  }
  if (melData.length !== (76 * 32)) {
    throw new Error(`oww_browser_infer_mel_unexpected_shape:${String(melDims)};len=${melData.length}`);
  }
  // Match openWakeWord AudioFeatures default melspec transform.
  for (let i = 0; i < melData.length; i += 1) {
    melData[i] = (Number(melData[i]) || 0) / 10 + 2;
  }

  const embInput = new ortRef.Tensor("float32", melData, [1, 76, 32, 1]);
  const embOut = await embeddingSession.run({ [embeddingInputName]: embInput });
  const embVec = extractEmbedding(embOut);
  if (!embVec) {
    throw new Error("oww_browser_infer_embedding_output_missing");
  }
  embeddingQueue.push(embVec);
  if (embeddingQueue.length > EMBEDDING_HISTORY) embeddingQueue.shift();
  if (embeddingQueue.length < EMBEDDING_HISTORY) return;

  const clsData = new Float32Array(EMBEDDING_HISTORY * EMBEDDING_DIMS);
  for (let i = 0; i < EMBEDDING_HISTORY; i += 1) {
    clsData.set(embeddingQueue[i], i * EMBEDDING_DIMS);
  }
  inputShape = [1, EMBEDDING_HISTORY, EMBEDDING_DIMS];
  const clsInput = new ortRef.Tensor("float32", clsData, inputShape);
  inferences += 1;
  lastInferAtMs = nowMs();
  let frameMaxScore = 0;
  const warmupSuppressed = inferences <= 5; // mirror warmup suppression in openWakeWord
  for (const c of classifierEntries) {
    let clsOut;
    try {
      clsOut = await c.session.run({ [c.inputName]: clsInput });
    } catch (err) {
      const em = err && err.message ? String(err.message) : String(err || "unknown");
      throw new Error(`oww_browser_infer_run_failed:${em};token=${c.token};input=${c.inputName};shape=[${inputShape.join(",")}]`);
    }
    const score = extractScore(clsOut);
    if (score > frameMaxScore) frameMaxScore = score;
    const effectiveScore = warmupSuppressed ? 0 : score;
    if (!warmupSuppressed && effectiveScore >= c.threshold && c.token) {
      postMessage({
        type: "token_detected",
        atMs: lastInferAtMs,
        token: c.token,
        confidence: effectiveScore,
      });
    }
  }
  lastScore = frameMaxScore;
  const effectiveMaxScore = warmupSuppressed ? 0 : frameMaxScore;
  postMessage({
    type: "infer_stats",
    atMs: lastInferAtMs,
    inferMs: Math.max(0, lastInferAtMs - t0),
    framesSeen,
    inferences,
    lastScore: effectiveMaxScore,
    inputShape,
    initStep,
  });
}

async function processQueue() {
  if (processing || !initialized) return;
  processing = true;
  try {
    while (frameQueue.length && initialized) {
      const frame = frameQueue.shift();
      await runPipelineForFrame(frame);
    }
  } finally {
    processing = false;
  }
}

async function onInit(msg) {
  const ortModuleUrl = String(msg && msg.ortModuleUrl || "").trim();
  const wasmRootUrl = String(msg && msg.wasmRootUrl || "").trim();
  const melModelUrl = String(msg && msg.melModelUrl || "").trim();
  const embeddingModelUrl = String(msg && msg.embeddingModelUrl || "").trim();
  const melModelBuffer = msg && msg.melModelBuffer instanceof ArrayBuffer ? msg.melModelBuffer : null;
  const embeddingModelBuffer = msg && msg.embeddingModelBuffer instanceof ArrayBuffer ? msg.embeddingModelBuffer : null;
  threshold = toFiniteNumber(msg && msg.threshold, 0.85);
  const rawClassifiers = Array.isArray(msg && msg.classifiers) ? msg.classifiers : [];

  if (!ortModuleUrl) throw new Error("oww_browser_infer_missing_ort_module_url");
  if (!melModelUrl && !melModelBuffer) throw new Error("oww_browser_infer_missing_mel_model");
  if (!embeddingModelUrl && !embeddingModelBuffer) throw new Error("oww_browser_infer_missing_embedding_model");
  if (!rawClassifiers.length) throw new Error("oww_browser_infer_missing_classifier_models");

  ortRef = await loadOrtModule(ortModuleUrl);
  if (ortRef && ortRef.env && ortRef.env.wasm) {
    ortRef.env.wasm.numThreads = 1;
    ortRef.env.wasm.proxy = false;
    if (wasmRootUrl) {
      const root = wasmRootUrl.endsWith("/") ? wasmRootUrl : `${wasmRootUrl}/`;
      ortRef.env.wasm.wasmPaths = root;
    }
  }
  setInitStep("ort_loaded");

  melSession = await ortRef.InferenceSession.create(melModelBuffer || melModelUrl, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  melInputName = String((melSession.inputNames && melSession.inputNames[0]) || "");
  melOutputName = String((melSession.outputNames && melSession.outputNames[0]) || "");
  setInitStep("mel_ready");

  embeddingSession = await ortRef.InferenceSession.create(embeddingModelBuffer || embeddingModelUrl, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  embeddingInputName = String((embeddingSession.inputNames && embeddingSession.inputNames[0]) || "");
  embeddingOutputName = String((embeddingSession.outputNames && embeddingSession.outputNames[0]) || "");
  setInitStep("embedding_ready");

  classifierEntries.length = 0;
  for (const item of rawClassifiers) {
    const classifierModelUrl = String(item && item.modelUrl || "").trim();
    const classifierModelBuffer = item && item.modelBuffer instanceof ArrayBuffer ? item.modelBuffer : null;
    const externalData = Array.isArray(item && item.externalData) ? item.externalData : [];
    const token = String(item && item.token || "").trim().toLowerCase();
    const perClassifierThreshold = Math.max(0, Math.min(1, toFiniteNumber(item && item.threshold, threshold)));
    if (!classifierModelUrl && !classifierModelBuffer) continue;
    const session = await ortRef.InferenceSession.create(classifierModelBuffer || classifierModelUrl, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
      ...(externalData.length ? { externalData } : {}),
    });
    const inputName = String((session.inputNames && session.inputNames[0]) || "");
    const outputName = String((session.outputNames && session.outputNames[0]) || "");
    if (!inputName) {
      throw new Error(`oww_browser_infer_missing_classifier_input_name:${token || classifierModelUrl}`);
    }
    classifierEntries.push({
      token: token || String(classifierModelUrl),
      threshold: perClassifierThreshold,
      session,
      inputName,
      outputName,
    });
  }
  if (!classifierEntries.length) {
    throw new Error("oww_browser_infer_no_classifier_session");
  }
  setInitStep("classifier_ready");

  if (!melInputName || !melOutputName || !embeddingInputName || !embeddingOutputName) {
    throw new Error("oww_browser_infer_missing_model_io_name");
  }

  resetState();
  initialized = true;
  setInitStep("ready");
  postMessage({
    type: "ready",
    atMs: nowMs(),
    classifierCount: classifierEntries.length,
    melInputName,
    melOutputName,
    embeddingInputName,
    embeddingOutputName,
    wasmRootUrl,
  });
}

function reportError(err) {
  const msg = err && err.message ? String(err.message) : "oww_browser_infer_worker_error";
  const name = err && err.name ? String(err.name) : "";
  const stack = err && err.stack ? String(err.stack) : "";
  lastError = [msg, name ? `name=${name}` : "", stack ? `stack=${stack}` : ""]
    .filter(Boolean)
    .join(" | ");
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
    const frame = msg && msg.frame instanceof ArrayBuffer ? new Int16Array(msg.frame) : null;
    if (frame && frame.length) {
      enqueueFrame(frame);
      void processQueue().catch(reportError);
    }
    return;
  }
  if (type === "stop") {
    initialized = false;
    processing = false;
    frameQueue.length = 0;
    embeddingQueue.length = 0;
    melSession = null;
    embeddingSession = null;
    classifierEntries.length = 0;
    ortRef = null;
    melInputName = "";
    melOutputName = "";
    embeddingInputName = "";
    embeddingOutputName = "";
    initStep = "";
    return;
  }
  if (type === "set_config") {
    const n = toFiniteNumber(msg && msg.threshold, threshold);
    threshold = Math.max(0, Math.min(1, n));
    for (const c of classifierEntries) {
      c.threshold = threshold;
    }
    return;
  }
};
