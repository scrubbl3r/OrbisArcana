import {
  buildElectricAoeBoltShapePath,
  ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS,
} from "./electric-aoe-bolt-shape-planner.js?v=20260522a";

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
  const legacyWanderSpeed = clampNumber(source.haloFieldWanderSpeed, 0, 64, 0.45);
  const boltMinStepBo = clampNumber(source.haloBoltShapeMinStepBo ?? source.haloBoltMinStepBo, 0.01, 8, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.minStepBo);
  const boltMaxStepBo = clampNumber(source.haloBoltShapeMaxStepBo ?? source.haloBoltMaxStepBo, boltMinStepBo, 8, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.maxStepBo);
  const zRange = normalizeZRange(source, fieldShellRadiusBo);
  return Object.freeze({
    boltHeadingMemory: clampNumber(source.haloBoltShapeHeadingMemory ?? source.haloBoltHeadingMemory, 0, 1, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.headingMemory),
    boltMaxStepBo,
    boltMinStepBo,
    boltPathJitterBo: clampNumber(source.haloBoltShapePathJitterBo ?? source.haloBoltPathJitterBo, 0, 4, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.pathJitterBo),
    boltSeekStrength: clampNumber(source.haloBoltShapeSeekStrength ?? source.haloBoltSeek, 0, 4, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.seekStrength),
    boltShapeSmoothing: clampNumber(source.haloBoltShapeSmoothing ?? source.haloBoltSmoothing, 0, 1, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.shapeSmoothing),
    boltShapeSpeedHz: clampNumber(source.haloBoltShapeSpeedHz, 0, 120, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.shapeSpeedHz),
    boltWanderStrength: clampNumber(source.haloBoltShapeWanderStrength ?? source.haloBoltWanderStrength, 0, 4, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.wanderStrength),
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
    fieldLingerDrift: clampNumber(source.haloFieldLingerDrift, 0, 1, 0),
    fieldEnabled: source.haloFieldEnabled !== false,
    fieldPointCount: Math.round(clampNumber(source.haloFieldPointCount, 0, 256, 24)),
    fieldPointDiameterBo: 0.05,
    fieldSeed: Math.round(clampNumber(source.haloFieldSeed, 1, 999999999, 4242)),
    fieldShellRadiusBo,
    fieldReversalChance: clampNumber(source.haloFieldReversalChance, 0, 1, 0.35),
    fieldWander: clampNumber(source.haloFieldWander, 0, 2, 0.35),
    fieldWanderDurationMaxMs: Math.round(clampNumber(
      source.haloFieldWanderDurationMaxMs,
      50,
      20000,
      3200
    )),
    fieldWanderDurationMinMs: Math.round(clampNumber(
      source.haloFieldWanderDurationMinMs,
      50,
      20000,
      1200
    )),
    fieldWanderSpeedMax: clampNumber(source.haloFieldWanderSpeedMax ?? source.haloFieldWanderSpeed, 0, 64, Math.max(legacyWanderSpeed, 0.75)),
    fieldWanderSpeedMin: clampNumber(source.haloFieldWanderSpeedMin ?? source.haloFieldWanderSpeed, 0, 64, Math.min(legacyWanderSpeed, 0.25)),
    fieldZMaxBo: zRange.max,
    fieldZMinBo: zRange.min,
    zBo: clampNumber(source.zBo ?? source.dominantBoltZBo, -64, 64, 0),
  });
}

function lerpSpeed(speedMin, speedMax, roll) {
  return Math.min(speedMin, speedMax) + (Math.max(speedMin, speedMax) - Math.min(speedMin, speedMax)) * roll;
}

function randomSignedSpeed(seed, salt, speedMin, speedMax) {
  const sign = random01(seed, salt) < 0.5 ? -1 : 1;
  const roll = random01(seed, salt + 1);
  return Object.freeze({
    roll,
    sign,
    value: sign * lerpSpeed(speedMin, speedMax, roll),
  });
}

function chooseTargetVelocity({ chance, current, salt, seed, speedMax, speedMin }) {
  const currentSign = current < 0 ? -1 : 1;
  const shouldReverse = random01(seed, salt) < chance;
  const sign = shouldReverse ? -currentSign : currentSign;
  const roll = random01(seed, salt + 1);
  return Object.freeze({
    roll,
    sign,
    value: sign * lerpSpeed(speedMin, speedMax, roll),
  });
}

function rollDurationSeconds(seed, salt, minMs, maxMs) {
  return randomBetween(
    seed,
    salt,
    Math.min(minMs, maxMs) / 1000,
    Math.max(minMs, maxMs) / 1000
  );
}

function beginStop(state, config, seed, time) {
  state.rollCount += 1;
  const rollSeed = seed + state.rollCount * 97.31;
  state.phase = "ease-out";
  state.phaseEndsAt = time + randomBetween(rollSeed, 31, 0.35, 0.95);
  state.phaseStartedAt = time;
  state.fromAngularVelocity = state.angularVelocity;
  state.fromZVelocity = state.zVelocity;
  state.targetAngularVelocity = 0;
  state.targetZVelocity = 0;
}

function beginLinger(state, config, seed, time) {
  const rollSeed = seed + state.rollCount * 97.31;
  state.phase = "linger";
  state.phaseEndsAt = time + rollDurationSeconds(rollSeed, 37, config.fieldLingerMinMs, config.fieldLingerMaxMs);
  state.phaseStartedAt = time;
  state.angularVelocity = 0;
  state.zVelocity = 0;
  state.fromAngularVelocity = 0;
  state.fromZVelocity = 0;
  state.targetAngularVelocity = 0;
  state.targetZVelocity = 0;
  state.lingerPhaseEndsAt = time;
  state.lingerPhaseStartedAt = time;
  state.lingerAngularFrom = state.lingerAngularVelocity || 0;
  state.lingerZFrom = state.lingerZVelocity || 0;
  state.lingerAngularTarget = 0;
  state.lingerZTarget = 0;
}

function beginEaseIn(state, config, seed, time) {
  const rollSeed = seed + state.rollCount * 97.31;
  const angularTarget = chooseTargetVelocity({
    chance: config.fieldReversalChance,
    current: state.lastDirectionSign,
    salt: 33,
    seed: rollSeed,
    speedMax: config.fieldWanderSpeedMax,
    speedMin: config.fieldWanderSpeedMin,
  });
  const zTarget = chooseTargetVelocity({
    chance: config.fieldReversalChance,
    current: state.lastZDirectionSign,
    salt: 35,
    seed: rollSeed,
    speedMax: config.fieldWanderSpeedMax * 0.72,
    speedMin: config.fieldWanderSpeedMin * 0.72,
  });
  state.phase = "ease-in";
  state.phaseEndsAt = time + randomBetween(rollSeed, 39, 0.45, 1.25);
  state.phaseStartedAt = time;
  state.fromAngularVelocity = 0;
  state.fromZVelocity = 0;
  state.targetAngularSpeedRoll = angularTarget.roll;
  state.targetZSpeedRoll = zTarget.roll;
  state.targetAngularVelocity = angularTarget.value;
  state.targetZVelocity = zTarget.value;
  state.lastDirectionSign = angularTarget.sign;
  state.lastZDirectionSign = zTarget.sign;
}

function beginWander(state, config, seed, time) {
  const rollSeed = seed + state.rollCount * 97.31;
  state.phase = "wander";
  state.phaseEndsAt = time + rollDurationSeconds(rollSeed, 41, config.fieldWanderDurationMinMs, config.fieldWanderDurationMaxMs);
  state.phaseStartedAt = time;
  state.angularSpeedRoll = state.targetAngularSpeedRoll;
  state.zSpeedRoll = state.targetZSpeedRoll;
  state.angularVelocity = state.lastDirectionSign * lerpSpeed(config.fieldWanderSpeedMin, config.fieldWanderSpeedMax, state.angularSpeedRoll);
  state.zVelocity = state.lastZDirectionSign * lerpSpeed(config.fieldWanderSpeedMin * 0.72, config.fieldWanderSpeedMax * 0.72, state.zSpeedRoll);
}

function rollLingerDrift(state, config, seed, time) {
  state.lingerRollCount += 1;
  const rollSeed = seed + state.rollCount * 131.17 + state.lingerRollCount * 43.71;
  const excitement = config.fieldLingerDrift;
  const driftSpeedMin = config.fieldWanderSpeedMin * (0.04 + excitement * 0.12);
  const driftSpeedMax = config.fieldWanderSpeedMax * (0.04 + excitement * 0.12);
  const angularTarget = chooseTargetVelocity({
    chance: config.fieldReversalChance,
    current: state.lingerAngularSign,
    salt: 51,
    seed: rollSeed,
    speedMax: driftSpeedMax,
    speedMin: driftSpeedMin,
  });
  const zTarget = chooseTargetVelocity({
    chance: config.fieldReversalChance,
    current: state.lingerZSign,
    salt: 53,
    seed: rollSeed,
    speedMax: driftSpeedMax * 0.72,
    speedMin: driftSpeedMin * 0.72,
  });
  const durationScale = 0.18 + (1 - excitement) * 0.24;
  state.lingerPhaseStartedAt = time;
  state.lingerPhaseEndsAt = time + Math.max(0.06, rollDurationSeconds(
    rollSeed,
    55,
    config.fieldWanderDurationMinMs * durationScale,
    config.fieldWanderDurationMaxMs * durationScale
  ));
  state.lingerAngularFrom = state.lingerAngularVelocity || 0;
  state.lingerZFrom = state.lingerZVelocity || 0;
  state.lingerAngularTarget = angularTarget.value;
  state.lingerZTarget = zTarget.value;
  state.lingerAngularSign = angularTarget.sign;
  state.lingerZSign = zTarget.sign;
}

function ensurePointState(states, { config, index, time, total }) {
  if (states[index]) return states[index];
  const seed = config.fieldSeed + index * 37.17;
  const direction = sphericalFibonacciDirection(index, total, seed);
  const angularSpeed = randomSignedSpeed(seed, 41, config.fieldWanderSpeedMin, config.fieldWanderSpeedMax);
  const zSpeed = randomSignedSpeed(seed, 45, config.fieldWanderSpeedMin * 0.72, config.fieldWanderSpeedMax * 0.72);
  const state = {
    anglePhase: Math.atan2(direction.y, direction.x),
    angularSpeedRoll: angularSpeed.roll,
    angularVelocity: angularSpeed.value,
    fromAngularVelocity: 0,
    fromZVelocity: 0,
    lastTime: time,
    lastDirectionSign: 1,
    lastZDirectionSign: 1,
    lingerAngularFrom: 0,
    lingerAngularSign: 1,
    lingerAngularTarget: 0,
    lingerAngularVelocity: 0,
    lingerPhaseEndsAt: time,
    lingerPhaseStartedAt: time,
    lingerRollCount: 0,
    lingerZFrom: 0,
    lingerZSign: 1,
    lingerZTarget: 0,
    lingerZVelocity: 0,
    phase: "wander",
    phaseEndsAt: time + rollDurationSeconds(seed, 43, config.fieldWanderDurationMinMs, config.fieldWanderDurationMaxMs),
    phaseStartedAt: time,
    rollCount: 0,
    targetAngularSpeedRoll: angularSpeed.roll,
    targetAngularVelocity: angularSpeed.value,
    targetZSpeedRoll: zSpeed.roll,
    targetZVelocity: zSpeed.value,
    zPhase: random01(seed, 24) * 2,
    zSpeedRoll: zSpeed.roll,
    zVelocity: zSpeed.value,
  };
  state.lastDirectionSign = angularSpeed.sign;
  state.lastZDirectionSign = zSpeed.sign;
  state.lingerAngularSign = angularSpeed.sign;
  state.lingerZSign = zSpeed.sign;
  states[index] = state;
  return state;
}

function advancePointState(state, config, seed, time) {
  const dt = Math.max(0, Math.min(0.12, time - state.lastTime));
  while (time >= state.phaseEndsAt) {
    if (state.phase === "wander") beginStop(state, config, seed, state.phaseEndsAt);
    else if (state.phase === "ease-out") beginLinger(state, config, seed, state.phaseEndsAt);
    else if (state.phase === "linger") beginEaseIn(state, config, seed, state.phaseEndsAt);
    else beginWander(state, config, seed, state.phaseEndsAt);
  }
  if (state.phase === "ease-out" || state.phase === "ease-in") {
    const duration = Math.max(0.001, state.phaseEndsAt - state.phaseStartedAt);
    const t = smoothstep((time - state.phaseStartedAt) / duration);
    if (state.phase === "ease-in") {
      state.targetAngularVelocity = state.lastDirectionSign * lerpSpeed(config.fieldWanderSpeedMin, config.fieldWanderSpeedMax, state.targetAngularSpeedRoll);
      state.targetZVelocity = state.lastZDirectionSign * lerpSpeed(config.fieldWanderSpeedMin * 0.72, config.fieldWanderSpeedMax * 0.72, state.targetZSpeedRoll);
    }
    state.angularVelocity = lerp(state.fromAngularVelocity, state.targetAngularVelocity, t);
    state.zVelocity = lerp(state.fromZVelocity, state.targetZVelocity, t);
  } else if (state.phase === "linger") {
    state.angularVelocity = 0;
    state.zVelocity = 0;
    if (config.fieldLingerDrift > 0) {
      if (time >= state.lingerPhaseEndsAt) rollLingerDrift(state, config, seed, time);
      const duration = Math.max(0.001, state.lingerPhaseEndsAt - state.lingerPhaseStartedAt);
      const t = smoothstep((time - state.lingerPhaseStartedAt) / duration);
      state.lingerAngularVelocity = lerp(state.lingerAngularFrom, state.lingerAngularTarget, t);
      state.lingerZVelocity = lerp(state.lingerZFrom, state.lingerZTarget, t);
    } else {
      state.lingerAngularVelocity = 0;
      state.lingerZVelocity = 0;
    }
  } else {
    state.angularVelocity = state.lastDirectionSign * lerpSpeed(config.fieldWanderSpeedMin, config.fieldWanderSpeedMax, state.angularSpeedRoll);
    state.zVelocity = state.lastZDirectionSign * lerpSpeed(config.fieldWanderSpeedMin * 0.72, config.fieldWanderSpeedMax * 0.72, state.zSpeedRoll);
  }
  state.anglePhase += (state.angularVelocity + state.lingerAngularVelocity) * dt;
  state.zPhase += (state.zVelocity + state.lingerZVelocity) * dt;
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

function buildHaloBoltPath({ config, endpoint, originXW, originYW, safeBo, seed, time }) {
  return buildElectricAoeBoltShapePath({
    bo: safeBo,
    config: {
      headingMemory: config.boltHeadingMemory,
      maxStepBo: config.boltMaxStepBo,
      minStepBo: config.boltMinStepBo,
      pathJitterBo: config.boltPathJitterBo,
      seekStrength: config.boltSeekStrength,
      shapeSmoothing: config.boltShapeSmoothing,
      shapeSpeedHz: config.boltShapeSpeedHz,
      wanderStrength: config.boltWanderStrength,
    },
    from: { xW: originXW, yW: originYW, zBo: config.zBo },
    seed,
    time,
    to: endpoint,
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
      const seed = config.fieldSeed + index * 37.17;
      const points = buildHaloBoltPath({ config, endpoint: end, index, originXW, originYW, safeBo, seed, time: safeTime });
      paths.push(Object.freeze({
        forks: Object.freeze([]),
        points,
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
