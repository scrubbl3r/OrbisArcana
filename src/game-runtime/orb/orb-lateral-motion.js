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

function clampSigned(value, maxMagnitude) {
  const max = Math.max(0, Number(maxMagnitude) || 0);
  return clamp(value, -max, max);
}

function lerp(current, target, alpha) {
  const c = Number(current) || 0;
  const t = Number(target) || 0;
  const a = clamp(Number(alpha) || 0, 0, 1);
  return c + ((t - c) * a);
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

  const frameDt = Math.max(0, Number(dt) || 0);
  const targetVX = clampSigned(
    Number(steering && steering.targetVX) || 0,
    Math.max(1, Number(steering && steering.maxSpeedPxPerSec) || Math.abs(Number(steering && steering.targetVX) || 0) || 1)
  );
  const velocityEaseFactor = clamp(Number(steering && steering.velocityEaseFactor) || 0.16, 0.01, 1);
  const currentVx = Number(state.vx) || 0;
  const frameAlpha = 1 - Math.pow(1 - velocityEaseFactor, Math.max(1, frameDt * 60));
  state.vx = lerp(currentVx, targetVX, frameAlpha);

  state.xW += (Number(state.vx) || 0) * frameDt;

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
