const TWO_PI = Math.PI * 2;

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function random01(seed, salt = 0) {
  const value = Math.sin((Number(seed) || 0) * 12.9898 + salt * 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function randomBetween(seed, salt, min, max) {
  return min + (max - min) * random01(seed, salt);
}

function normalizeAngle(angle) {
  const value = Number(angle) || 0;
  return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

function chooseTargetVelocity(state, minWalkSpeed, maxWalkSpeed) {
  state.retargetCount += 1;
  const seed = state.seed + state.retargetCount * 31.17;
  const currentSign = state.velocity < 0 ? -1 : 1;
  const choice = random01(seed, 1);
  let sign = currentSign;
  let magnitude = randomBetween(seed, 2, minWalkSpeed, maxWalkSpeed);

  if (choice < 0.18) {
    magnitude *= randomBetween(seed, 3, 0.02, 0.18);
  } else if (choice < 0.42) {
    sign = -currentSign;
    magnitude *= randomBetween(seed, 4, 0.72, 1.18);
  } else if (choice > 0.88) {
    magnitude *= randomBetween(seed, 5, 1.08, 1.42);
  }

  state.targetVelocity = sign * Math.min(maxWalkSpeed * 1.45, Math.max(0, magnitude));
  state.easeRate = randomBetween(seed, 6, 1.35, 4.85);
  state.nextRetargetAt = state.lastTime + randomBetween(seed, 7, 0.38, 1.85);
}

export function createElectricAoeHaloWalkController() {
  const states = [];
  let lastTime = null;

  function ensureState(index, total, minWalkSpeed, maxWalkSpeed, time) {
    if (states[index]) return states[index];
    const seed = index + 1;
    const direction = random01(seed, 11) >= 0.5 ? 1 : -1;
    const velocity = direction * randomBetween(seed, 12, minWalkSpeed, maxWalkSpeed);
    const state = {
      angle: total <= 0 ? 0 : (index / Math.max(1, total)) * TWO_PI,
      easeRate: randomBetween(seed, 13, 1.6, 3.8),
      lastTime: time,
      nextRetargetAt: time + randomBetween(seed, 14, 0.25, 1.4),
      retargetCount: 0,
      seed,
      targetVelocity: velocity,
      velocity,
    };
    states[index] = state;
    return state;
  }

  function sample({
    maxWalkSpeed = 1.2,
    minWalkSpeed = 0.35,
    time = 0,
    total = 0,
  } = {}) {
    const safeTotal = Math.max(0, Math.round(Number(total) || 0));
    const safeMin = clampNumber(minWalkSpeed, 0, 24, 0.35);
    const safeMax = clampNumber(maxWalkSpeed, safeMin, 24, 1.2);
    const safeTime = Math.max(0, Number(time) || 0);
    const dt = lastTime == null ? 0 : Math.max(0, Math.min(0.12, safeTime - lastTime));
    lastTime = safeTime;
    states.length = safeTotal;

    const samples = [];
    for (let index = 0; index < safeTotal; index += 1) {
      const state = ensureState(index, safeTotal, safeMin, safeMax, safeTime);
      state.lastTime = safeTime;
      if (safeTime >= state.nextRetargetAt) {
        chooseTargetVelocity(state, safeMin, safeMax);
      }
      const blend = 1 - Math.exp(-dt * state.easeRate);
      state.velocity += (state.targetVelocity - state.velocity) * blend;
      const drift = Math.sin(safeTime * randomBetween(state.seed, 15, 0.24, 0.72) + state.seed * 1.37) * 0.006;
      state.angle = normalizeAngle(state.angle + (state.velocity + drift) * dt);
      samples.push(Object.freeze({
        angle: state.angle,
        seed: state.seed,
        velocity: state.velocity,
      }));
    }
    return Object.freeze(samples);
  }

  function reset() {
    states.length = 0;
    lastTime = null;
  }

  return Object.freeze({ reset, sample });
}
