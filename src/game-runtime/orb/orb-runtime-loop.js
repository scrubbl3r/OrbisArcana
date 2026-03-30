/**
 * @typedef {Object} CreateOrbRuntimeLoopOptions
 * @property {() => Object|null} getState Returns the mutable orb runtime state object.
 * @property {(frame:{ts:number, dt:number, nowMs:number, wasOnGround:boolean}) => void} runFrame Per-frame callback.
 * @property {() => boolean} [isReady] Optional readiness gate; when false, loop keeps scheduling but skips `runFrame`.
 * @property {(n:number, min:number, max:number) => number} [clamp]
 * @property {(cb:FrameRequestCallback) => number} [raf]
 * @property {(id:number) => void} [caf]
 * @property {() => number} [now]
 */

/**
 * Extracted RAF/timing shell for orb runtime simulation.
 * Caller owns the actual frame behavior via `runFrame(...)`.
 *
 * @param {CreateOrbRuntimeLoopOptions} options
 */
export function createOrbRuntimeLoop({
  getState,
  runFrame,
  isReady = () => true,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  raf = (cb) => requestAnimationFrame(cb),
  caf = (id) => cancelAnimationFrame(id),
  now = () => performance.now(),
} = {}) {
  let rafId = 0;
  let running = false;

  function tick(ts) {
    if (!running) return;
    const state = (typeof getState === "function") ? (getState() || null) : null;
    if (state) {
      if (state.lastTs == null) state.lastTs = ts;
      let dt = (ts - state.lastTs) / 1000;
      state.lastTs = ts;
      const nowMs = now();
      const wasOnGround = !!state.onGround;
      dt = clamp(dt, 0, 0.05);

      if (typeof isReady !== "function" || isReady()) {
        if (typeof runFrame === "function") {
          runFrame({ ts, dt, nowMs, wasOnGround });
        }
      }
    }
    rafId = raf(tick);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = raf(tick);
  }

  function stop() {
    running = false;
    if (rafId) caf(rafId);
    rafId = 0;
  }

  function getStateMeta() {
    return { running, rafId };
  }

  return {
    start,
    stop,
    getState: getStateMeta,
  };
}
