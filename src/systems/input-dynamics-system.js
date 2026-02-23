export function createInputDynamicsSystem({ config = {} } = {}) {
  const cfg = {
    stabilityAvgMs: Math.max(1, Number(config.stabilityAvgMs) || 250),
    stabilityArmMs: Math.max(0, Number(config.stabilityArmMs) || 220),
    stabilityOnThr: Number.isFinite(Number(config.stabilityOnThr)) ? Number(config.stabilityOnThr) : 0.08,
    stabilityOffThr: Number.isFinite(Number(config.stabilityOffThr)) ? Number(config.stabilityOffThr) : 0.10,
    variabilityAvgMs: Math.max(1, Number(config.variabilityAvgMs) || 250),
    variabilityArmMs: Math.max(0, Number(config.variabilityArmMs) || 220),
    variabilityOnThr: Number.isFinite(Number(config.variabilityOnThr)) ? Number(config.variabilityOnThr) : 0.80,
    variabilityOffThr: Number.isFinite(Number(config.variabilityOffThr)) ? Number(config.variabilityOffThr) : 0.78,
  };

  const state = {
    dynSamples: [],
    varSamples: [],
    stabilityOn: false,
    stabilityHoldMs: 0,
    stabilityLastMs: 0,
    variabilityOn: false,
    variabilityHoldMs: 0,
    variabilityLastMs: 0,
  };

  function clamp(v, lo, hi) {
    const n = Number(v);
    const x = Number.isFinite(n) ? n : lo;
    return Math.max(lo, Math.min(hi, x));
  }

  function clamp01(v) {
    return clamp(v, 0, 1);
  }

  function setStability(on) {
    state.stabilityOn = !!on;
  }

  function setVariability(on) {
    state.variabilityOn = !!on;
  }

  function reset() {
    state.dynSamples = [];
    state.varSamples = [];
    state.stabilityOn = false;
    state.stabilityHoldMs = 0;
    state.stabilityLastMs = 0;
    state.variabilityOn = false;
    state.variabilityHoldMs = 0;
    state.variabilityLastMs = 0;
  }

  function updateStability(dyn01, atMs) {
    const nowMs = Number(atMs) || 0;
    const v = clamp01(dyn01);

    if (!state.stabilityLastMs) state.stabilityLastMs = nowMs;
    let dt = nowMs - state.stabilityLastMs;
    state.stabilityLastMs = nowMs;
    dt = clamp(dt, 0, 80);

    state.dynSamples.push({ t: nowMs, v });
    const cutoff = nowMs - cfg.stabilityAvgMs;
    while (state.dynSamples.length && state.dynSamples[0].t < cutoff) state.dynSamples.shift();

    if (!state.dynSamples.length) {
      state.stabilityHoldMs = 0;
      if (state.stabilityOn) setStability(false);
      return;
    }

    let sum = 0;
    for (const s of state.dynSamples) sum += s.v;
    const avg = sum / state.dynSamples.length;
    const thr = state.stabilityOn ? cfg.stabilityOffThr : cfg.stabilityOnThr;

    if (avg <= thr) {
      state.stabilityHoldMs += dt;
      if (!state.stabilityOn && state.stabilityHoldMs >= cfg.stabilityArmMs) {
        setStability(true);
      }
    } else {
      state.stabilityHoldMs = 0;
      if (state.stabilityOn) setStability(false);
    }
  }

  function updateVariability(dyn01, atMs) {
    const nowMs = Number(atMs) || 0;
    const v = clamp01(dyn01);

    if (!state.variabilityLastMs) state.variabilityLastMs = nowMs;
    let dt = nowMs - state.variabilityLastMs;
    state.variabilityLastMs = nowMs;
    dt = clamp(dt, 0, 80);

    state.varSamples.push({ t: nowMs, v });
    const cutoff = nowMs - cfg.variabilityAvgMs;
    while (state.varSamples.length && state.varSamples[0].t < cutoff) state.varSamples.shift();

    if (!state.varSamples.length) {
      state.variabilityHoldMs = 0;
      if (state.variabilityOn) setVariability(false);
      return;
    }

    let sum = 0;
    for (const s of state.varSamples) sum += s.v;
    const avg = sum / state.varSamples.length;
    const thr = state.variabilityOn ? cfg.variabilityOffThr : cfg.variabilityOnThr;

    if (avg >= thr) {
      state.variabilityHoldMs += dt;
      if (!state.variabilityOn && state.variabilityHoldMs >= cfg.variabilityArmMs) {
        setVariability(true);
      }
    } else {
      state.variabilityHoldMs = 0;
      if (state.variabilityOn) setVariability(false);
    }
  }

  function processFrame({ dynamics01, atMs } = {}) {
    updateStability(dynamics01, atMs);
    updateVariability(dynamics01, atMs);
  }

  function getState() {
    return {
      stabilityOn: !!state.stabilityOn,
      variabilityOn: !!state.variabilityOn,
    };
  }

  function start() {}
  function stop() {}

  return {
    start,
    stop,
    reset,
    processFrame,
    getState,
  };
}
