const DEFAULTS = Object.freeze({
  targetSampleRate: 16000,
  frameSamples: 1280,
  maxQueuedFrames: 24,
  statsIntervalMs: 250,
});

const state = {
  configured: false,
  inputSampleRate: 0,
  targetSampleRate: DEFAULTS.targetSampleRate,
  frameSamples: DEFAULTS.frameSamples,
  maxQueuedFrames: DEFAULTS.maxQueuedFrames,
  phase: 0,
  frameBuf: new Int16Array(DEFAULTS.frameSamples),
  frameWrite: 0,
  frameQueue: [],
  chunksIn: 0,
  inputSamplesIn: 0,
  outputSamplesOut: 0,
  framesProduced: 0,
  framesDropped: 0,
  startedAtMs: 0,
  lastChunkAtMs: 0,
  statsTimer: null,
};

function nowMs() {
  return Date.now();
}

function clampToI16(v) {
  const x = Math.max(-1, Math.min(1, Number(v) || 0));
  return x < 0 ? Math.round(x * 32768) : Math.round(x * 32767);
}

function resetState() {
  state.phase = 0;
  state.frameBuf = new Int16Array(Math.max(64, state.frameSamples | 0));
  state.frameWrite = 0;
  state.frameQueue = [];
  state.chunksIn = 0;
  state.inputSamplesIn = 0;
  state.outputSamplesOut = 0;
  state.framesProduced = 0;
  state.framesDropped = 0;
  state.startedAtMs = nowMs();
  state.lastChunkAtMs = 0;
}

function postStats() {
  postMessage({
    type: "stats",
    atMs: nowMs(),
    configured: state.configured,
    inputSampleRate: state.inputSampleRate,
    targetSampleRate: state.targetSampleRate,
    frameSamples: state.frameSamples,
    maxQueuedFrames: state.maxQueuedFrames,
    queueDepth: state.frameQueue.length,
    chunksIn: state.chunksIn,
    inputSamplesIn: state.inputSamplesIn,
    outputSamplesOut: state.outputSamplesOut,
    framesProduced: state.framesProduced,
    framesDropped: state.framesDropped,
    startedAtMs: state.startedAtMs,
    lastChunkAtMs: state.lastChunkAtMs,
  });
}

function stopStatsTimer() {
  if (!state.statsTimer) return;
  clearInterval(state.statsTimer);
  state.statsTimer = null;
}

function startStatsTimer() {
  stopStatsTimer();
  const intervalMs = Math.max(100, Number(DEFAULTS.statsIntervalMs) || 250);
  state.statsTimer = setInterval(postStats, intervalMs);
}

function emitFrame() {
  const fullFrame = state.frameBuf;
  if (state.frameQueue.length >= state.maxQueuedFrames) {
    state.frameQueue.shift();
    state.framesDropped += 1;
  }
  state.frameQueue.push(fullFrame);
  state.framesProduced += 1;
  state.frameBuf = new Int16Array(state.frameSamples);
  state.frameWrite = 0;
}

function handleAudioChunk(samples) {
  if (!state.configured) return;
  if (!(samples instanceof Float32Array) || samples.length === 0) return;
  const inputRate = Math.max(1, state.inputSampleRate | 0);
  const outputRate = Math.max(1, state.targetSampleRate | 0);

  state.chunksIn += 1;
  state.inputSamplesIn += samples.length;
  state.lastChunkAtMs = nowMs();

  // Lightweight resampling strategy for Slice 3: phase-accumulator decimation.
  // This keeps pipeline behavior simple/observable before inference integration.
  for (let i = 0; i < samples.length; i += 1) {
    state.phase += outputRate;
    if (state.phase < inputRate) continue;
    state.phase -= inputRate;
    const sampleI16 = clampToI16(samples[i]);
    state.frameBuf[state.frameWrite] = sampleI16;
    state.frameWrite += 1;
    state.outputSamplesOut += 1;
    if (state.frameWrite >= state.frameSamples) {
      emitFrame();
    }
  }
}

function handleInit(msg) {
  const inputSampleRate = Number(msg && msg.inputSampleRate);
  if (!Number.isFinite(inputSampleRate) || inputSampleRate < 8000) {
    throw new Error("oww_browser_audio_worker_bad_input_sample_rate");
  }
  state.inputSampleRate = Math.round(inputSampleRate);
  state.targetSampleRate = Math.max(8000, Math.round(Number(msg && msg.targetSampleRate) || DEFAULTS.targetSampleRate));
  state.frameSamples = Math.max(128, Math.round(Number(msg && msg.frameSamples) || DEFAULTS.frameSamples));
  state.maxQueuedFrames = Math.max(2, Math.round(Number(msg && msg.maxQueuedFrames) || DEFAULTS.maxQueuedFrames));
  state.configured = true;
  resetState();
  startStatsTimer();
  postMessage({ type: "ready", atMs: nowMs() });
}

function clearQueuedFrames() {
  state.frameQueue = [];
  state.framesDropped = 0;
}

self.onmessage = (ev) => {
  const msg = ev && ev.data ? ev.data : {};
  const type = String(msg && msg.type || "");
  try {
    if (type === "init") {
      handleInit(msg);
      return;
    }
    if (type === "audio") {
      handleAudioChunk(msg.samples);
      return;
    }
    if (type === "pull_frame_count") {
      postMessage({ type: "frame_count", atMs: nowMs(), queueDepth: state.frameQueue.length });
      return;
    }
    if (type === "pull_frame") {
      const next = state.frameQueue.length ? state.frameQueue.shift() : null;
      if (!next) {
        postMessage({ type: "frame", atMs: nowMs(), queueDepth: state.frameQueue.length, hasFrame: false });
        return;
      }
      postMessage(
        { type: "frame", atMs: nowMs(), queueDepth: state.frameQueue.length, hasFrame: true, frame: next.buffer },
        [next.buffer]
      );
      return;
    }
    if (type === "clear_queue") {
      clearQueuedFrames();
      postMessage({ type: "frame_count", atMs: nowMs(), queueDepth: state.frameQueue.length });
      return;
    }
    if (type === "stop") {
      state.configured = false;
      stopStatsTimer();
      postStats();
      return;
    }
  } catch (err) {
    postMessage({
      type: "error",
      atMs: nowMs(),
      message: err && err.message ? String(err.message) : "oww_browser_audio_worker_error",
    });
  }
};
