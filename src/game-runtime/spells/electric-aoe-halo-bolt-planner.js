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

function normalizeVector3(x = 0, y = 0, z = 0, fallback = { x: 1, y: 0, z: 0 }) {
  const length = Math.hypot(Number(x) || 0, Number(y) || 0, Number(z) || 0);
  if (length <= 0.000001) return fallback;
  return {
    x: (Number(x) || 0) / length,
    y: (Number(y) || 0) / length,
    z: (Number(z) || 0) / length,
  };
}

function sphericalFibonacciDirection(index, total, seed) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const jitter = random01(seed, 11) * 0.72;
  const y = 1 - 2 * ((index + 0.5 + jitter) / safeTotal);
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = (index + random01(seed, 12)) * Math.PI * (3 - Math.sqrt(5));
  return normalizeVector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
}

function pingPong01(value) {
  const cycle = ((Number(value) || 0) % 2 + 2) % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  return x * x * (3 - 2 * x);
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function normalizeZRange(source, shellRadiusBo) {
  const radius = Math.max(0.5, Number(shellRadiusBo) || 1.5);
  const rawMin = clampNumber(source.haloFieldZMinBo, -32, 32, -radius);
  const rawMax = clampNumber(source.haloFieldZMaxBo, -32, 32, radius);
  const min = Math.max(-radius, Math.min(radius, Math.min(rawMin, rawMax)));
  const max = Math.max(-radius, Math.min(radius, Math.max(rawMin, rawMax)));
  return Object.freeze({ max, min });
}

function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const fieldShellRadiusBo = clampNumber(source.haloFieldShellRadiusBo, 0.5, 32, 1.5);
  const zRange = normalizeZRange(source, fieldShellRadiusBo);
  return Object.freeze({
    fieldLingerMaxMs: Math.round(clampNumber(
      source.haloFieldLingerMaxMs ?? source.haloFieldReversalFrequencyMaxMs ?? source.haloFieldDirectionHoldMaxMs,
      50,
      20000,
      2600
    )),
    fieldLingerMinMs: Math.round(clampNumber(
      source.haloFieldLingerMinMs ?? source.haloFieldReversalFrequencyMinMs ?? source.haloFieldDirectionHoldMinMs,
      50,
      20000,
      900
    )),
    fieldEnabled: source.haloFieldEnabled !== false,
    fieldPointCount: Math.round(clampNumber(source.haloFieldPointCount, 0, 256, 24)),
    fieldPointDiameterBo: 0.05,
    fieldSeed: Math.round(clampNumber(source.haloFieldSeed, 1, 999999999, 4242)),
    fieldShellRadiusBo,
    fieldReversalChance: clampNumber(source.haloFieldReversalChance, 0, 1, 0.35),
    fieldWander: clampNumber(source.haloFieldWander, 0, 2, 0.35),
    fieldWanderSpeed: clampNumber(source.haloFieldWanderSpeed, 0, 12, 0.45),
    fieldZMaxBo: zRange.max,
    fieldZMinBo: zRange.min,
    zBo: clampNumber(source.zBo ?? source.dominantBoltZBo, -64, 64, 0),
  });
}

function randomSignedSpeed(seed, salt, speedScale) {
  const sign = random01(seed, salt) < 0.5 ? -1 : 1;
  return sign * speedScale * randomBetween(seed, salt + 1, 0.45, 1.35);
}

function chooseTargetVelocity({ chance, current, salt, seed, speedScale }) {
  const currentSign = current < 0 ? -1 : 1;
  const shouldReverse = random01(seed, salt) < chance;
  const sign = shouldReverse ? -currentSign : currentSign;
  return sign * speedScale * randomBetween(seed, salt + 1, 0.45, 1.35);
}

function chooseDirectionTarget(state, config, seed, time) {
  state.rollCount += 1;
  const rollSeed = seed + state.rollCount * 97.31;
  const holdMinS = Math.min(config.fieldLingerMinMs, config.fieldLingerMaxMs) / 1000;
  const holdMaxS = Math.max(config.fieldLingerMinMs, config.fieldLingerMaxMs) / 1000;
  state.transitionStart = time;
  state.transitionDuration = randomBetween(rollSeed, 31, 0.45, 1.25);
  state.fromAngularVelocity = state.angularVelocity;
  state.fromZVelocity = state.zVelocity;
  state.targetAngularVelocity = chooseTargetVelocity({
    chance: config.fieldReversalChance,
    current: state.angularVelocity,
    salt: 33,
    seed: rollSeed,
    speedScale: config.fieldWanderSpeed,
  });
  state.targetZVelocity = chooseTargetVelocity({
    chance: config.fieldReversalChance,
    current: state.zVelocity,
    salt: 35,
    seed: rollSeed,
    speedScale: config.fieldWanderSpeed * 0.72,
  });
  state.holdUntil = time + state.transitionDuration + randomBetween(rollSeed, 37, holdMinS, holdMaxS);
}

function ensurePointState(states, { config, index, time, total }) {
  if (states[index]) return states[index];
  const seed = config.fieldSeed + index * 37.17;
  const direction = sphericalFibonacciDirection(index, total, seed);
  const state = {
    anglePhase: Math.atan2(direction.y, direction.x),
    angularVelocity: randomSignedSpeed(seed, 41, config.fieldWanderSpeed),
    fromAngularVelocity: 0,
    fromZVelocity: 0,
    holdUntil: time + randomBetween(
      seed,
      43,
      Math.min(config.fieldLingerMinMs, config.fieldLingerMaxMs) / 1000,
      Math.max(config.fieldLingerMinMs, config.fieldLingerMaxMs) / 1000
    ),
    lastTime: time,
    rollCount: 0,
    targetAngularVelocity: 0,
    targetZVelocity: 0,
    transitionDuration: 0,
    transitionStart: time,
    zPhase: random01(seed, 24) * 2,
    zVelocity: randomSignedSpeed(seed, 45, config.fieldWanderSpeed * 0.72),
  };
  state.fromAngularVelocity = state.angularVelocity;
  state.fromZVelocity = state.zVelocity;
  state.targetAngularVelocity = state.angularVelocity;
  state.targetZVelocity = state.zVelocity;
  states[index] = state;
  return state;
}

function advancePointState(state, config, seed, time) {
  const dt = Math.max(0, Math.min(0.12, time - state.lastTime));
  if (time >= state.holdUntil) chooseDirectionTarget(state, config, seed, time);
  if (state.transitionDuration > 0) {
    const t = smoothstep((time - state.transitionStart) / state.transitionDuration);
    state.angularVelocity = lerp(state.fromAngularVelocity, state.targetAngularVelocity, t);
    state.zVelocity = lerp(state.fromZVelocity, state.targetZVelocity, t);
  }
  state.anglePhase += state.angularVelocity * dt;
  state.zPhase += state.zVelocity * dt;
  state.lastTime = time;
}

function sampleShellPoint({ config, index, states, time, total }) {
  const seed = config.fieldSeed + index * 37.17;
  const state = ensurePointState(states, { config, index, time, total });
  advancePointState(state, config, seed, time);
  const wander = config.fieldWander;
  const zSpan = Math.max(0, config.fieldZMaxBo - config.fieldZMinBo);
  const zPhase = state.zPhase;
  const zBo = zSpan <= 0.000001 ? config.fieldZMinBo : config.fieldZMinBo + pingPong01(zPhase) * zSpan;
  const angle = state.anglePhase
    + Math.sin(time * 0.37 + seed * 0.017) * wander * 0.38
    + Math.cos(time * 0.29 + seed * 0.023) * wander * 0.24;
  const planarRadiusBo = Math.sqrt(Math.max(0, config.fieldShellRadiusBo * config.fieldShellRadiusBo - zBo * zBo));
  return Object.freeze({
    xBo: Math.cos(angle) * planarRadiusBo,
    yBo: Math.sin(angle) * planarRadiusBo,
    zBo,
  });
}

export function createElectricAoeHaloFieldPlanner() {
  const pointStates = [];

  function buildPaths({
    bo = 42,
    config: rawConfig = {},
    from = {},
    time = 0,
  } = {}) {
    const safeBo = Math.max(1, Number(bo) || 42);
    const safeTime = Math.max(0, Number(time) || 0);
    const config = normalizeConfig(rawConfig);
    if (!config.fieldEnabled) return Object.freeze([]);
    const originXW = Number(from && from.xW) || 0;
    const originYW = Number(from && from.yW) || 0;
    const paths = [];
    pointStates.length = config.fieldPointCount;
    for (let index = 0; index < config.fieldPointCount; index += 1) {
      const point = sampleShellPoint({ config, index, states: pointStates, time: safeTime, total: config.fieldPointCount });
      const end = Object.freeze({
        xW: originXW + point.xBo * safeBo,
        yW: originYW + point.yBo * safeBo,
        zBo: config.zBo + point.zBo,
      });
      paths.push(Object.freeze({
        forks: Object.freeze([]),
        points: Object.freeze([
          Object.freeze({ xW: originXW, yW: originYW, zBo: config.zBo }),
          end,
        ]),
        shellRadiusBo: config.fieldShellRadiusBo,
        pointDiameterBo: config.fieldPointDiameterBo,
      }));
    }
    return Object.freeze(paths);
  }

  function reset() {
    pointStates.length = 0;
  }

  return Object.freeze({ buildPaths, reset });
}

export const createElectricAoeHaloBoltPlanner = createElectricAoeHaloFieldPlanner;
