import {
  buildElectricAoeBoltShapePath,
  ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS,
} from "./electric-aoe-bolt-shape-planner.js?v=20260522b";

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
  const fieldBoltEndMinBo = clampNumber(
    source.haloFieldBoltEndMinBo ?? source.haloFieldBoltLengthMinBo ?? fieldShellRadiusBo,
    0.05,
    fieldShellRadiusBo,
    fieldShellRadiusBo
  );
  const fieldBoltEndMaxBo = clampNumber(
    source.haloFieldBoltEndMaxBo ?? source.haloFieldBoltLengthMaxBo ?? fieldShellRadiusBo,
    fieldBoltEndMinBo,
    fieldShellRadiusBo,
    fieldShellRadiusBo
  );
  const fieldBoltStartMinBo = clampNumber(source.haloFieldBoltStartMinBo, 0, fieldBoltEndMaxBo, 0);
  const fieldBoltStartMaxBo = clampNumber(source.haloFieldBoltStartMaxBo, fieldBoltStartMinBo, fieldBoltEndMaxBo, 0);
  const legacyWanderSpeed = clampNumber(source.haloFieldWanderSpeed, 0, 64, 0.45);
  const boltMinStepBo = clampNumber(source.haloBoltShapeMinStepBo ?? source.haloBoltMinStepBo, 0.01, 8, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.minStepBo);
  const boltMaxStepBo = clampNumber(source.haloBoltShapeMaxStepBo ?? source.haloBoltMaxStepBo, boltMinStepBo, 8, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.maxStepBo);
  const zRange = normalizeZRange(source, fieldShellRadiusBo);
  const forkStartPct = clampNumber(source.haloBoltForkStartPct, 0, 1, 0.33);
  const forkEndPct = clampNumber(source.haloBoltForkEndPct, 0, 1, 0.75);
  const legacyForkSpreadBo = source.haloBoltForkSpreadBo;
  const forkSpreadMinBo = clampNumber(source.haloBoltForkSpreadMinBo ?? legacyForkSpreadBo, 0, 8, 0.22);
  const forkSpreadMaxBo = clampNumber(source.haloBoltForkSpreadMaxBo ?? legacyForkSpreadBo, forkSpreadMinBo, 8, 0.46);
  const forkZTineMinBo = clampNumber(source.haloBoltForkZTineMinBo, 0, 8, 0);
  const forkZTineMaxBo = clampNumber(source.haloBoltForkZTineMaxBo, forkZTineMinBo, 8, 0.08);
  const forkTtlMinMs = Math.round(clampNumber(source.haloBoltForkTtlMinMs ?? source.haloBoltForkTtlMs, 16, 20000, 180));
  const forkTtlMaxMs = Math.round(clampNumber(source.haloBoltForkTtlMaxMs ?? source.haloBoltForkTtlMs, forkTtlMinMs, 20000, 180));
  const branchTotalMin = Math.round(clampNumber(source.haloBoltBranchTotalMin, 0, 16, 0));
  const branchTotalMax = Math.round(clampNumber(source.haloBoltBranchTotalMax, branchTotalMin, 16, 0));
  const branchRangeStartPct = clampNumber(source.haloBoltBranchRangeStartPct, 0, 1, 0.15);
  const branchRangeEndPct = clampNumber(source.haloBoltBranchRangeEndPct, branchRangeStartPct, 1, 0.85);
  const branchLengthMinBo = clampNumber(source.haloBoltBranchLengthMinBo, 0, 8, 0.08);
  const branchLengthMaxBo = clampNumber(source.haloBoltBranchLengthMaxBo, branchLengthMinBo, 8, 0.28);
  const branchAngleMinDeg = clampNumber(source.haloBoltBranchAngleMinDeg, 0, 180, 72);
  const branchAngleMaxDeg = clampNumber(source.haloBoltBranchAngleMaxDeg, branchAngleMinDeg, 180, 112);
  const branchTtlMinMs = Math.round(clampNumber(source.haloBoltBranchTtlMinMs, 16, 20000, 120));
  const branchTtlMaxMs = Math.round(clampNumber(source.haloBoltBranchTtlMaxMs, branchTtlMinMs, 20000, 260));
  return Object.freeze({
    branchAngleMaxDeg,
    branchAngleMinDeg,
    branchChance: clampNumber(source.haloBoltBranchChance, 0, 1, 0),
    branchEnabled: source.haloBoltBranchEnabled === true,
    branchLengthMaxBo,
    branchLengthMinBo,
    branchRangeEndPct,
    branchRangeStartPct,
    branchShapeScale: clampNumber(source.haloBoltBranchShapeScale, 0.05, 1, 0.45),
    branchTotalMax,
    branchTotalMin,
    branchTtlMaxMs,
    branchTtlMinMs,
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
    fieldBoltEndMaxBo,
    fieldBoltEndMinBo,
    fieldBoltStartMaxBo,
    fieldBoltStartMinBo,
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
    forkChance: clampNumber(source.haloBoltForkChance, 0, 1, 0),
    forkEndPctMax: Math.max(forkStartPct, forkEndPct),
    forkEndPctMin: Math.min(forkStartPct, forkEndPct),
    forkSpreadMaxBo,
    forkSpreadMinBo,
    forkTargetOffsetBo: clampNumber(source.haloBoltForkTargetOffsetBo, 0, 8, 0.18),
    forkTtlMaxMs,
    forkTtlMinMs,
    forkZTineMaxBo,
    forkZTineMinBo,
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
  const endLengthBo = randomBetween(seed, 71.3, config.fieldBoltEndMinBo, config.fieldBoltEndMaxBo);
  const startLengthBo = Math.min(
    endLengthBo,
    randomBetween(seed, 73.7, config.fieldBoltStartMinBo, config.fieldBoltStartMaxBo)
  );
  const clampedZBo = Math.max(-endLengthBo, Math.min(endLengthBo, zBo));
  const planarRadiusBo = Math.sqrt(Math.max(0, endLengthBo * endLengthBo - clampedZBo * clampedZBo));
  const end = Object.freeze({
    xBo: Math.cos(angle) * planarRadiusBo,
    yBo: Math.sin(angle) * planarRadiusBo,
    zBo: clampedZBo,
  });
  const endLength = Math.max(0.000001, Math.hypot(end.xBo, end.yBo, end.zBo));
  const startScale = Math.max(0, startLengthBo) / endLength;
  return Object.freeze({
    end,
    start: Object.freeze({
      xBo: end.xBo * startScale,
      yBo: end.yBo * startScale,
      zBo: end.zBo * startScale,
    }),
  });
}

function buildHaloBoltPath({ config, endpoint, originXW, originYW, originZBo = null, safeBo, seed, time }) {
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
    from: { xW: originXW, yW: originYW, zBo: Number.isFinite(Number(originZBo)) ? Number(originZBo) : config.zBo },
    seed,
    time,
    to: endpoint,
  });
}

function buildHaloBranchPath({ config, endpoint, origin, safeBo, seed, time }) {
  const scale = Math.max(0.05, Math.min(1, config.branchShapeScale));
  return buildElectricAoeBoltShapePath({
    bo: safeBo,
    config: {
      headingMemory: config.boltHeadingMemory,
      maxStepBo: Math.max(0.01, config.boltMaxStepBo * scale),
      minStepBo: Math.max(0.01, config.boltMinStepBo * scale),
      pathJitterBo: config.boltPathJitterBo * scale,
      seekStrength: config.boltSeekStrength,
      shapeSmoothing: config.boltShapeSmoothing,
      shapeSpeedHz: config.boltShapeSpeedHz,
      wanderStrength: config.boltWanderStrength * scale,
    },
    from: origin,
    seed,
    time,
    to: endpoint,
  });
}

function distanceBetweenPointsBo(from, to, safeBo) {
  return Math.hypot(
    ((Number(to && to.xW) || 0) - (Number(from && from.xW) || 0)) / safeBo,
    ((Number(to && to.yW) || 0) - (Number(from && from.yW) || 0)) / safeBo,
    (Number(to && to.zBo) || 0) - (Number(from && from.zBo) || 0)
  );
}

function interpolatePoint(from, to, t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  return Object.freeze({
    xW: lerp(Number(from && from.xW) || 0, Number(to && to.xW) || 0, x),
    yW: lerp(Number(from && from.yW) || 0, Number(to && to.yW) || 0, x),
    zBo: lerp(Number(from && from.zBo) || 0, Number(to && to.zBo) || 0, x),
  });
}

function samplePointAtPathPct(points, pct, safeBo) {
  if (!Array.isArray(points) || points.length <= 1) return points && points[0] || Object.freeze({ xW: 0, yW: 0, zBo: 0 });
  const distances = [0];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceBetweenPointsBo(points[index - 1], points[index], safeBo);
    distances.push(total);
  }
  if (total <= 0.000001) return points[0];
  const target = total * Math.max(0, Math.min(1, Number(pct) || 0));
  for (let index = 1; index < points.length; index += 1) {
    if (distances[index] < target) continue;
    const segmentLength = Math.max(0.000001, distances[index] - distances[index - 1]);
    return interpolatePoint(points[index - 1], points[index], (target - distances[index - 1]) / segmentLength);
  }
  return points[points.length - 1];
}

function vectorBetweenBo(from, to, safeBo) {
  return normalizeVector3(
    ((Number(to && to.xW) || 0) - (Number(from && from.xW) || 0)) / safeBo,
    ((Number(to && to.yW) || 0) - (Number(from && from.yW) || 0)) / safeBo,
    (Number(to && to.zBo) || 0) - (Number(from && from.zBo) || 0)
  );
}

function pathTangentAtPct(points, pct, safeBo) {
  if (!Array.isArray(points) || points.length <= 1) return Object.freeze({ x: 1, y: 0, z: 0 });
  const sample = Math.max(0, Math.min(1, Number(pct) || 0));
  const nextPct = Math.min(1, sample + 0.02);
  const prevPct = Math.max(0, sample - 0.02);
  const prev = samplePointAtPathPct(points, prevPct, safeBo);
  const next = samplePointAtPathPct(points, nextPct, safeBo);
  return vectorBetweenBo(prev, next, safeBo);
}

function clampPointToHaloShell(point, { centerXW, centerYW, centerZBo, radiusBo, safeBo }) {
  const dxBo = ((Number(point && point.xW) || 0) - centerXW) / safeBo;
  const dyBo = ((Number(point && point.yW) || 0) - centerYW) / safeBo;
  const dzBo = (Number(point && point.zBo) || 0) - centerZBo;
  const distanceBo = Math.hypot(dxBo, dyBo, dzBo);
  if (distanceBo <= Math.max(0, radiusBo) || distanceBo <= 0.000001) return point;
  const scale = radiusBo / distanceBo;
  return Object.freeze({
    xW: centerXW + dxBo * scale * safeBo,
    yW: centerYW + dyBo * scale * safeBo,
    zBo: centerZBo + dzBo * scale,
  });
}

function clampPathToHaloShell(points, shell) {
  if (!Array.isArray(points)) return Object.freeze([]);
  return Object.freeze(points.map((point) => clampPointToHaloShell(point, shell)));
}

function ensureBranchState(states, key, { config, seed, time }) {
  let state = states.get(key);
  if (!state) {
    state = { active: false, count: 0, expiresAt: -1, roll: 0, ttlMaxMs: config.branchTtlMaxMs, ttlMinMs: config.branchTtlMinMs };
    states.set(key, state);
  }
  if (!config.branchEnabled || config.branchChance <= 0 || config.branchTotalMax <= 0) {
    state.active = false;
    state.count = 0;
    state.expiresAt = time + config.branchTtlMaxMs / 1000;
    state.ttlMaxMs = config.branchTtlMaxMs;
    state.ttlMinMs = config.branchTtlMinMs;
    return state;
  }
  if (time >= state.expiresAt || state.ttlMinMs !== config.branchTtlMinMs || state.ttlMaxMs !== config.branchTtlMaxMs) {
    state.roll += 1;
    state.ttlMaxMs = config.branchTtlMaxMs;
    state.ttlMinMs = config.branchTtlMinMs;
    state.active = random01(seed + state.roll * 307.13, 211) <= config.branchChance;
    state.count = state.active ? Math.round(randomBetween(seed + state.roll * 307.13, 213, config.branchTotalMin, config.branchTotalMax)) : 0;
    state.expiresAt = time + randomBetween(seed + state.roll * 307.13, 217, config.branchTtlMinMs, config.branchTtlMaxMs) / 1000;
  }
  return state;
}

function buildHaloBranches({ config, key, parentPoints, safeBo, seed, shell, states, time }) {
  const state = ensureBranchState(states, key, { config, seed, time });
  if (!state.active || state.count <= 0 || !Array.isArray(parentPoints) || parentPoints.length <= 1) return Object.freeze([]);
  const branches = [];
  for (let index = 0; index < state.count; index += 1) {
    const branchSeed = seed + state.roll * 307.13 + index * 41.31;
    const pct = randomBetween(branchSeed, 223, config.branchRangeStartPct, config.branchRangeEndPct);
    const origin = samplePointAtPathPct(parentPoints, pct, safeBo);
    const tangent = pathTangentAtPct(parentPoints, pct, safeBo);
    const planarLength = Math.hypot(tangent.x, tangent.y);
    const planar = planarLength > 0.000001
      ? Object.freeze({ x: tangent.x / planarLength, y: tangent.y / planarLength })
      : Object.freeze({ x: 1, y: 0 });
    const side = random01(branchSeed, 227) < 0.5 ? -1 : 1;
    const angle = randomBetween(branchSeed, 229, config.branchAngleMinDeg, config.branchAngleMaxDeg) * Math.PI / 180 * side;
    const dir = normalizeVector3(
      planar.x * Math.cos(angle) - planar.y * Math.sin(angle),
      planar.x * Math.sin(angle) + planar.y * Math.cos(angle),
      (random01(branchSeed, 231) * 2 - 1) * 0.24
    );
    const lengthBo = randomBetween(branchSeed, 233, config.branchLengthMinBo, config.branchLengthMaxBo);
    const target = clampPointToHaloShell(Object.freeze({
      xW: (Number(origin.xW) || 0) + dir.x * lengthBo * safeBo,
      yW: (Number(origin.yW) || 0) + dir.y * lengthBo * safeBo,
      zBo: (Number(origin.zBo) || 0) + dir.z * lengthBo,
    }), shell);
    branches.push(Object.freeze({
      points: clampPathToHaloShell(buildHaloBranchPath({ config, endpoint: target, origin, safeBo, seed: branchSeed + 239, time }), shell),
      target,
    }));
  }
  return Object.freeze(branches);
}

function buildHaloForkTine({ branchKey, branchStates, config, endpoint, forkPoint, safeBo, seed, shell, time }) {
  const target = clampPointToHaloShell(endpoint, shell);
  const points = clampPathToHaloShell(buildHaloBoltPath({
    config,
    endpoint: target,
    originXW: forkPoint.xW,
    originYW: forkPoint.yW,
    originZBo: forkPoint.zBo,
    safeBo,
    seed,
    time,
  }), shell);
  return Object.freeze({
    branches: buildHaloBranches({ config, key: branchKey, parentPoints: points, safeBo, seed: seed + 271.17, shell, states: branchStates, time }),
    points,
    target,
  });
}

function buildHaloFork({ branchStates, config, endpoint, forkPoint, originXW, originYW, originZBo, parentKey, safeBo, seed, time }) {
  const tangent = vectorBetweenBo(forkPoint, endpoint, safeBo);
  const planarLength = Math.hypot(tangent.x, tangent.y);
  const perpendicular = planarLength > 0.000001
    ? Object.freeze({ x: -tangent.y / planarLength, y: tangent.x / planarLength, z: 0 })
    : Object.freeze({ x: 0, y: 1, z: 0 });
  const spreadBo = randomBetween(seed, 153, config.forkSpreadMinBo, config.forkSpreadMaxBo);
  const offsetBo = config.forkTargetOffsetBo * (random01(seed, 157) * 2 - 1);
  const zSpreadBo = randomBetween(seed, 159, config.forkZTineMinBo, config.forkZTineMaxBo) * (random01(seed, 161) < 0.5 ? -1 : 1);
  const center = Object.freeze({
    xW: (Number(endpoint.xW) || 0) + tangent.x * offsetBo * safeBo,
    yW: (Number(endpoint.yW) || 0) + tangent.y * offsetBo * safeBo,
    zBo: (Number(endpoint.zBo) || 0) + tangent.z * offsetBo,
  });
  const tineAEnd = Object.freeze({
    xW: center.xW + perpendicular.x * spreadBo * safeBo * 0.5,
    yW: center.yW + perpendicular.y * spreadBo * safeBo * 0.5,
    zBo: center.zBo + zSpreadBo,
  });
  const tineBEnd = Object.freeze({
    xW: center.xW - perpendicular.x * spreadBo * safeBo * 0.5,
    yW: center.yW - perpendicular.y * spreadBo * safeBo * 0.5,
    zBo: center.zBo - zSpreadBo,
  });
  return Object.freeze({
    kind: "fork",
    point: forkPoint,
    points: Object.freeze([forkPoint]),
    tines: Object.freeze([
      buildHaloForkTine({
        branchKey: `${parentKey}:fork-a`,
        branchStates,
        config,
        endpoint: tineAEnd,
        forkPoint,
        safeBo,
        seed: seed + 170.17,
        shell: { centerXW: originXW, centerYW: originYW, centerZBo: originZBo, radiusBo: config.fieldShellRadiusBo, safeBo },
        time,
      }),
      buildHaloForkTine({
        branchKey: `${parentKey}:fork-b`,
        branchStates,
        config,
        endpoint: tineBEnd,
        forkPoint,
        safeBo,
        seed: seed + 190.19,
        shell: { centerXW: originXW, centerYW: originYW, centerZBo: originZBo, radiusBo: config.fieldShellRadiusBo, safeBo },
        time,
      }),
    ]),
  });
}

function ensureForkState(states, { config, index, seed, time }) {
  let state = states[index];
  if (!state) {
    state = { active: false, expiresAt: -1, roll: 0, ttlMaxMs: config.forkTtlMaxMs, ttlMinMs: config.forkTtlMinMs };
    states[index] = state;
  }
  if (config.forkChance <= 0) {
    state.active = false;
    state.expiresAt = time + config.forkTtlMaxMs / 1000;
    state.ttlMaxMs = config.forkTtlMaxMs;
    state.ttlMinMs = config.forkTtlMinMs;
    return state;
  }
  if (time >= state.expiresAt || state.ttlMinMs !== config.forkTtlMinMs || state.ttlMaxMs !== config.forkTtlMaxMs) {
    state.roll += 1;
    state.ttlMaxMs = config.forkTtlMaxMs;
    state.ttlMinMs = config.forkTtlMinMs;
    state.active = random01(seed + state.roll * 211.13, 173) <= config.forkChance;
    state.expiresAt = time + randomBetween(seed + state.roll * 211.13, 181, config.forkTtlMinMs, config.forkTtlMaxMs) / 1000;
  }
  return state;
}

export function createElectricAoeHaloFieldPlanner() {
  const pointStates = [];
  const forkStates = [];
  const branchStates = new Map();

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
    forkStates.length = config.fieldPointCount;
    for (let index = 0; index < config.fieldPointCount; index += 1) {
      const point = sampleShellPoint({ config, index, states: pointStates, time: safeTime, total: config.fieldPointCount });
      const start = Object.freeze({
        xW: originXW + point.start.xBo * safeBo,
        yW: originYW + point.start.yBo * safeBo,
        zBo: config.zBo + point.start.zBo,
      });
      const end = Object.freeze({
        xW: originXW + point.end.xBo * safeBo,
        yW: originYW + point.end.yBo * safeBo,
        zBo: config.zBo + point.end.zBo,
      });
      const seed = config.fieldSeed + index * 37.17;
      const fullPoints = buildHaloBoltPath({ config, endpoint: end, index, originXW: start.xW, originYW: start.yW, originZBo: start.zBo, safeBo, seed, time: safeTime });
      const parentKey = `main:${index}`;
      const forkState = ensureForkState(forkStates, { config, index, seed, time: safeTime });
      const forkSeed = seed + (forkState.roll || 0) * 211.13;
      const forkPct = randomBetween(forkSeed, 149, config.forkEndPctMin, config.forkEndPctMax);
      const forkPoint = samplePointAtPathPct(fullPoints, forkPct, safeBo);
      const fork = forkState.active ? buildHaloFork({
        config,
        endpoint: end,
        forkPoint,
        branchStates,
        originXW,
        originYW,
        originZBo: config.zBo,
        parentKey,
        safeBo,
        seed: forkSeed,
        time: safeTime,
      }) : null;
      const points = fork ? buildHaloBoltPath({ config, endpoint: forkPoint, index, originXW: start.xW, originYW: start.yW, originZBo: start.zBo, safeBo, seed: seed + 130.13, time: safeTime }) : fullPoints;
      paths.push(Object.freeze({
        branches: buildHaloBranches({
          config,
          key: parentKey,
          parentPoints: points,
          safeBo,
          seed: seed + 331.17,
          shell: { centerXW: originXW, centerYW: originYW, centerZBo: config.zBo, radiusBo: config.fieldShellRadiusBo, safeBo },
          states: branchStates,
          time: safeTime,
        }),
        forks: Object.freeze(fork ? [fork] : []),
        points,
        shellRadiusBo: config.fieldShellRadiusBo,
        pointDiameterBo: config.fieldPointDiameterBo,
        start,
        target: end,
      }));
    }
    return Object.freeze(paths);
  }

  function reset() {
    pointStates.length = 0;
    forkStates.length = 0;
    branchStates.clear();
  }

  return Object.freeze({ buildPaths, reset });
}

export const createElectricAoeHaloBoltPlanner = createElectricAoeHaloFieldPlanner;
