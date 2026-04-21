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
  const accelIntentX = clampSigned(Number(steering && steering.accelIntentX) || 0, 1);
  const accelX = Math.max(1, Number(steering && steering.accelX) || 1);
  const turnBrakePxPerSec2 = Math.max(accelX, Number(steering && steering.turnBrakePxPerSec2) || accelX);
  const maxSpeedPxPerSec = Math.max(1, Number(steering && steering.maxSpeedPxPerSec) || Math.max(Math.abs(Number(steering && steering.targetVX) || 0), 1));
  const currentVx = Number(state.vx) || 0;

  if (accelIntentX !== 0) {
    const requestedAccel = accelIntentX * accelX;
    let nextVx = currentVx;
    if (currentVx !== 0 && Math.sign(currentVx) !== Math.sign(requestedAccel)) {
      nextVx = moveToward(currentVx, 0, turnBrakePxPerSec2 * frameDt);
    }
    nextVx += requestedAccel * frameDt;
    state.vx = clampSigned(nextVx, maxSpeedPxPerSec);
  } else {
    state.vx = moveToward(currentVx, 0, accelX * frameDt);
  }

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
