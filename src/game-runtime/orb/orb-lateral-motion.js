function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function moveToward(current, target, maxDelta) {
  const c = Number(current) || 0;
  const t = Number(target) || 0;
  const delta = Math.max(0, Number(maxDelta) || 0);
  if (c < t) return Math.min(c + delta, t);
  if (c > t) return Math.max(c - delta, t);
  return c;
}

export function stepOrbLateralMotion({
  dt = 0,
  state = null,
  steering = null,
  bounds = {},
} = {}) {
  if (!state || typeof state !== "object") return;
  const left = Number(bounds.left);
  const right = Number(bounds.right);
  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= left) return;

  const targetVX = Number(steering && steering.targetVX) || 0;
  const accelX = Math.max(1, Number(steering && steering.accelX) || 1);
  const maxDeltaV = accelX * Math.max(0, Number(dt) || 0);

  state.vx = moveToward(state.vx, targetVX, maxDeltaV);
  state.xW += (Number(state.vx) || 0) * Math.max(0, Number(dt) || 0);

  if (state.xW <= left) {
    state.xW = left;
    if (state.vx < 0) state.vx = 0;
  } else if (state.xW >= right) {
    state.xW = right;
    if (state.vx > 0) state.vx = 0;
  }

  state.steerIntentX = Number(steering && steering.intentX) || 0;
  state.steerActive = !!(steering && steering.active);
}

