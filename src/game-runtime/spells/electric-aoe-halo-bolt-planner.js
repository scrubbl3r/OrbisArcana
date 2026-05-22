import { createElectricAoeHaloWalkController } from "./electric-aoe-halo-walk-controller.js?v=20260521a";

const ORIGIN_RADIUS_BO = 0.5;
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

function normalizeVector(x = 0, y = 0, fallback = { x: 1, y: 0 }) {
  const length = Math.hypot(Number(x) || 0, Number(y) || 0);
  if (length <= 0.000001) return fallback;
  return { x: (Number(x) || 0) / length, y: (Number(y) || 0) / length };
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  return x * x * (3 - 2 * x);
}

function normalizeAngle(angle) {
  const value = Number(angle) || 0;
  return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

function shortestAngleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function chooseFieldOffsetTarget(state, seed, config, time) {
  state.retargetCount += 1;
  const retargetSeed = seed + state.retargetCount * 37.91 + config.fieldSeed * 0.013;
  const sign = random01(retargetSeed, 21) < 0.5 ? -1 : 1;
  const magnitude = randomBetween(retargetSeed, 22, 0, config.fieldCellJitter * 0.32);
  state.targetOffsetUnit = sign * magnitude;
  state.easeRate = randomBetween(retargetSeed, 23, 0.9, 2.6);
  state.nextRetargetAt = time + randomBetween(retargetSeed, 24, 0.65, 2.8);
}

function chooseEndpointOffsetTarget(state, seed, time) {
  state.retargetCount += 1;
  const retargetSeed = seed + state.retargetCount * 29.73;
  const previousSign = state.targetOffset < 0 ? -1 : 1;
  const sign = random01(retargetSeed, 11) < 0.32 ? -previousSign : (random01(retargetSeed, 12) < 0.5 ? -1 : 1);
  const magnitude = randomBetween(retargetSeed, 13, 0.035, 0.28);
  state.targetOffset = sign * magnitude;
  state.easeRate = randomBetween(retargetSeed, 14, 0.85, 2.8);
  state.nextRetargetAt = time + randomBetween(retargetSeed, 15, 0.55, 2.4);
}

function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const minRangeBo = clampNumber(source.haloBoltMinRangeBo, 0, 16, 0.55);
  const maxRangeBo = clampNumber(source.haloBoltMaxRangeBo, Math.max(0.05, minRangeBo), 16, 1.65);
  const minTotal = Math.round(clampNumber(source.haloBoltMinTotal, 0, 64, 4));
  const maxTotal = Math.round(clampNumber(source.haloBoltMaxTotal, minTotal, 64, 10));
  const minWalkSpeed = clampNumber(source.haloBoltMinWalkSpeed, 0, 24, 0.35);
  const maxWalkSpeed = clampNumber(source.haloBoltMaxWalkSpeed, minWalkSpeed, 24, 1.2);
  const minStepBo = clampNumber(source.haloBoltMinStepBo, 0.01, 4, 0.08);
  const maxStepBo = clampNumber(source.haloBoltMaxStepBo, minStepBo, 4, 0.28);
  const forksMin = Math.round(clampNumber(source.haloBoltForksMin, 0, 12, 0));
  const forksMax = Math.round(clampNumber(source.haloBoltForksMax, forksMin, 12, 2));
  const forkLengthMinBo = clampNumber(source.haloBoltForkLengthMinBo, 0, 8, 0.2);
  const forkLengthMaxBo = clampNumber(source.haloBoltForkLengthMaxBo, forkLengthMinBo, 8, 0.7);
  const fieldMinFeaturePoints = Math.round(clampNumber(source.haloFieldMinFeaturePoints, 0, 64, minTotal));
  const fieldMaxFeaturePoints = Math.round(clampNumber(source.haloFieldMaxFeaturePoints, fieldMinFeaturePoints, 64, maxTotal));
  const fieldMinDriftSpeed = clampNumber(source.haloFieldMinDriftSpeed, 0, 12, minWalkSpeed);
  const fieldMaxDriftSpeed = clampNumber(source.haloFieldMaxDriftSpeed, fieldMinDriftSpeed, 12, maxWalkSpeed);
  const fieldMinDifferentialOffset = clampNumber(source.haloFieldMinDifferentialOffset, 0, 1, 0.18);
  const fieldMaxDifferentialOffset = clampNumber(source.haloFieldMaxDifferentialOffset, fieldMinDifferentialOffset, 1, 0.46);
  return Object.freeze({
    fieldCellJitter: clampNumber(source.haloFieldCellJitter, 0, 1, 0.42),
    fieldEnabled: source.haloFieldEnabled !== false,
    fieldMaxDifferentialOffset,
    fieldMaxDriftSpeed,
    fieldMaxFeaturePoints,
    fieldMinDifferentialOffset,
    fieldMinDriftSpeed,
    fieldMinFeaturePoints,
    fieldSeed: Math.round(clampNumber(source.haloFieldSeed, 1, 999999999, 4242)),
    fieldSliceWidthBo: clampNumber(source.haloFieldSliceWidthBo, 0, 2, 0.18),
    forkLengthMaxBo,
    forkLengthMinBo,
    forksMax,
    forksMin,
    maxRangeBo,
    maxStepBo,
    maxTotal,
    maxWalkSpeed,
    minRangeBo,
    minStepBo,
    minTotal,
    minWalkSpeed,
    pathJitterBo: clampNumber(source.haloBoltPathJitterBo, 0, 2, 0.16),
    zBo: clampNumber(source.zBo ?? source.dominantBoltZBo, -64, 64, 0),
  });
}

function buildHaloPath({ angle, bo, config, destinationAngle, from, seed, time }) {
  const originXW = Number(from && from.xW) || 0;
  const originYW = Number(from && from.yW) || 0;
  const rangeBreath = 0.5 + 0.5 * Math.sin(seed * 1.91 + time * randomBetween(seed, 31, 0.9, 1.9));
  const rangeBo = config.minRangeBo + (config.maxRangeBo - config.minRangeBo) * smoothstep(rangeBreath);
  const originRadial = { x: Math.cos(angle), y: Math.sin(angle) };
  const destinationRadial = { x: Math.cos(destinationAngle), y: Math.sin(destinationAngle) };
  const start = Object.freeze({
    xW: originXW + originRadial.x * ORIGIN_RADIUS_BO * bo,
    yW: originYW + originRadial.y * ORIGIN_RADIUS_BO * bo,
    zBo: config.zBo,
  });
  const end = Object.freeze({
    xW: originXW + destinationRadial.x * (ORIGIN_RADIUS_BO + rangeBo) * bo,
    yW: originYW + destinationRadial.y * (ORIGIN_RADIUS_BO + rangeBo) * bo,
    zBo: config.zBo,
  });
  const points = [start];
  const targetDistanceBo = Math.max(0.001, Math.hypot(end.xW - start.xW, end.yW - start.yW) / bo);
  const targetDirection = normalizeVector(end.xW - start.xW, end.yW - start.yW, originRadial);
  const tangent = { x: -targetDirection.y, y: targetDirection.x };
  const maxNodes = 28;
  let distanceBo = 0;
  let current = start;
  let heading = targetDirection;
  for (let pointIndex = 1; pointIndex < maxNodes && distanceBo < targetDistanceBo; pointIndex += 1) {
    const remainingBo = Math.max(0, Math.hypot(end.xW - current.xW, end.yW - current.yW) / bo);
    if (remainingBo <= config.maxStepBo) break;
    const stepWave = 0.5 + 0.5 * Math.sin(seed * 2.71 + pointIndex * 3.37 + time * randomBetween(seed, pointIndex + 41, 7.5, 14.5));
    const twitchWave = Math.sin(seed * 9.19 + pointIndex * 5.11 + time * randomBetween(seed, pointIndex + 61, 18, 34));
    const stepBo = Math.min(
      remainingBo,
      config.minStepBo + (config.maxStepBo - config.minStepBo) * smoothstep(stepWave)
    );
    const t = Math.min(1, (distanceBo + stepBo) / targetDistanceBo);
    const seek = normalizeVector(end.xW - current.xW, end.yW - current.yW, targetDirection);
    const wander = twitchWave * config.pathJitterBo * Math.sin(t * Math.PI);
    const seekWeight = 0.92 + 0.14 * Math.sin(seed * 4.7 + time * 3.1);
    heading = normalizeVector(
      heading.x * 0.5 + seek.x * seekWeight + tangent.x * wander,
      heading.y * 0.5 + seek.y * seekWeight + tangent.y * wander,
      seek
    );
    current = Object.freeze({
      xW: current.xW + heading.x * stepBo * bo,
      yW: current.yW + heading.y * stepBo * bo,
      zBo: config.zBo,
    });
    points.push(current);
    distanceBo += stepBo;
  }
  points.push(end);
  return points;
}

function buildForks({ bo, config, pathIndex, points, seed, time }) {
  const forkSpan = config.forksMax - config.forksMin;
  const forkPulse = 0.5 + 0.5 * Math.sin(seed * 1.37 + time * randomBetween(seed, 81, 3.6, 8.2));
  const forkCount = Math.max(0, Math.round(config.forksMin + forkSpan * smoothstep(forkPulse)));
  const forks = [];
  for (let forkIndex = 0; forkIndex < forkCount; forkIndex += 1) {
    if (points.length < 3) break;
    const basePointIndex = Math.min(points.length - 2, Math.max(1, 1 + ((forkIndex * 2 + pathIndex + seed) % Math.max(1, points.length - 2))));
    const base = points[basePointIndex];
    const prev = points[Math.max(0, basePointIndex - 1)];
    const next = points[Math.min(points.length - 1, basePointIndex + 1)];
    const heading = normalizeVector(next.xW - prev.xW, next.yW - prev.yW);
    const tangent = { x: -heading.y, y: heading.x };
    const side = random01(seed + forkIndex, 91) >= 0.5 ? 1 : -1;
    const forkLengthBo = config.forkLengthMinBo + (config.forkLengthMaxBo - config.forkLengthMinBo)
      * smoothstep(0.5 + 0.5 * Math.sin(seed * 3.31 + forkIndex * 2.1 + time * 11.5));
    const forkJitter = Math.sin(seed * 13.7 + forkIndex * 4.2 + time * 21.0) * config.pathJitterBo * 0.55;
    forks.push(Object.freeze([
      base,
      Object.freeze({
        xW: base.xW + (tangent.x * side + heading.x * (0.16 + forkJitter)) * forkLengthBo * bo,
        yW: base.yW + (tangent.y * side + heading.y * (0.16 + forkJitter)) * forkLengthBo * bo,
        zBo: config.zBo,
      }),
    ]));
  }
  return Object.freeze(forks);
}

export function createElectricAoeHaloBoltPlanner() {
  const walkController = createElectricAoeHaloWalkController();
  const fieldStates = [];
  const endpointStates = [];
  let lastEndpointTime = null;
  let lastFieldTime = null;

  function ensureFieldState(index, seed, config, time) {
    if (fieldStates[index]) return fieldStates[index];
    const sign = random01(seed + config.fieldSeed, 41) < 0.5 ? -1 : 1;
    const state = {
      easeRate: randomBetween(seed + config.fieldSeed, 42, 1.1, 2.4),
      nextRetargetAt: time + randomBetween(seed + config.fieldSeed, 43, 0.45, 2.1),
      offsetUnit: sign * randomBetween(seed + config.fieldSeed, 44, 0, config.fieldCellJitter * 0.32),
      retargetCount: 0,
      targetOffsetUnit: sign * randomBetween(seed + config.fieldSeed, 45, 0, config.fieldCellJitter * 0.32),
    };
    fieldStates[index] = state;
    return state;
  }

  function sampleFieldAngle({ config, index, time, total }) {
    fieldStates.length = Math.max(0, Number(total) || 0);
    const cellWidth = TWO_PI / Math.max(1, total);
    const seed = config.fieldSeed + index * 17.13;
    const state = ensureFieldState(index, seed, config, time);
    const dt = lastFieldTime == null ? 0 : Math.max(0, Math.min(0.12, time - lastFieldTime));
    if (time >= state.nextRetargetAt) chooseFieldOffsetTarget(state, seed, config, time);
    const blend = 1 - Math.exp(-dt * state.easeRate);
    state.offsetUnit += (state.targetOffsetUnit - state.offsetUnit) * blend;
    const cellCenter = (index + 0.5) * cellWidth;
    const driftSpeed = randomBetween(seed, 51, config.fieldMinDriftSpeed, config.fieldMaxDriftSpeed);
    const drift = Math.sin(time * driftSpeed + seed * 0.19) * config.fieldCellJitter * 0.08;
    const slice = Math.sin(seed * 0.31 + time * randomBetween(seed, 52, 0.16, 0.48)) * config.fieldSliceWidthBo * 0.08;
    const offset = Math.max(-0.36, Math.min(0.36, state.offsetUnit + drift + slice));
    return normalizeAngle(cellCenter + offset * cellWidth);
  }

  function ensureEndpointState(index, seed, time) {
    if (endpointStates[index]) return endpointStates[index];
    const sign = random01(seed, 101) < 0.5 ? -1 : 1;
    const state = {
      easeRate: randomBetween(seed, 102, 1.1, 2.6),
      nextRetargetAt: time + randomBetween(seed, 103, 0.45, 1.9),
      offset: sign * randomBetween(seed, 104, 0.04, 0.18),
      retargetCount: 0,
      targetOffset: sign * randomBetween(seed, 105, 0.06, 0.22),
    };
    endpointStates[index] = state;
    return state;
  }

  function sampleDestinationAngle({ index, originAngle, seed, time, total }) {
    endpointStates.length = Math.max(0, Number(total) || 0);
    const dt = lastEndpointTime == null ? 0 : Math.max(0, Math.min(0.12, time - lastEndpointTime));
    const state = ensureEndpointState(index, seed, time);
    if (time >= state.nextRetargetAt) chooseEndpointOffsetTarget(state, seed, time);
    const blend = 1 - Math.exp(-dt * state.easeRate);
    state.offset += (state.targetOffset - state.offset) * blend;
    const flutter = Math.sin(seed * 7.1 + time * randomBetween(seed, 34, 1.4, 2.6)) * 0.025;
    return originAngle + state.offset + flutter;
  }

  function sampleFieldDestinationAngle({ config, index, originAngle, seed, time, total }) {
    const cellWidth = TWO_PI / Math.max(1, total);
    const stateAngle = sampleDestinationAngle({ index, originAngle, seed, time, total });
    const desiredDelta = shortestAngleDelta(originAngle, stateAngle);
    const minOffset = config.fieldMinDifferentialOffset * cellWidth;
    const maxOffset = config.fieldMaxDifferentialOffset * cellWidth;
    const sign = desiredDelta < 0 ? -1 : 1;
    const magnitude = Math.max(minOffset, Math.min(maxOffset, Math.abs(desiredDelta)));
    return normalizeAngle(originAngle + sign * magnitude);
  }

  function buildPaths({
    bo = 42,
    config: rawConfig = {},
    from = {},
    time = 0,
  } = {}) {
    const safeBo = Math.max(1, Number(bo) || 42);
    const safeTime = Math.max(0, Number(time) || 0);
    const config = normalizeConfig(rawConfig);
    const total = Math.max(0, Math.round(config.fieldEnabled
      ? (config.fieldMinFeaturePoints + config.fieldMaxFeaturePoints) * 0.5
      : (config.minTotal + config.maxTotal) * 0.5));
    const walkSamples = walkController.sample({
      maxWalkSpeed: config.maxWalkSpeed,
      minWalkSpeed: config.minWalkSpeed,
      time: safeTime,
      total,
    });
    lastEndpointTime = lastEndpointTime == null ? safeTime : lastEndpointTime;
    lastFieldTime = lastFieldTime == null ? safeTime : lastFieldTime;
    const paths = [];
    for (let pathIndex = 0; pathIndex < total; pathIndex += 1) {
      const seed = pathIndex + 1;
      const angle = config.fieldEnabled
        ? sampleFieldAngle({ config, index: pathIndex, time: safeTime, total })
        : (walkSamples[pathIndex] && walkSamples[pathIndex].angle || 0)
          + Math.sin(safeTime * randomBetween(seed, 11, 0.4, 1.2) + seed) * 0.08;
      const destinationAngle = config.fieldEnabled ? sampleFieldDestinationAngle({
        config,
        index: pathIndex,
        originAngle: angle,
        seed,
        time: safeTime,
        total,
      }) : sampleDestinationAngle({
        index: pathIndex,
        originAngle: angle,
        seed,
        time: safeTime,
        total,
      });
      const points = Object.freeze(buildHaloPath({
        angle,
        bo: safeBo,
        config,
        destinationAngle,
        from,
        seed,
        time: safeTime,
      }));
      paths.push(Object.freeze({
        forks: buildForks({ bo: safeBo, config, pathIndex, points, seed, time: safeTime }),
        points,
      }));
    }
    lastEndpointTime = safeTime;
    lastFieldTime = safeTime;
    return Object.freeze(paths);
  }

  function reset() {
    walkController.reset();
    fieldStates.length = 0;
    endpointStates.length = 0;
    lastEndpointTime = null;
    lastFieldTime = null;
  }

  return Object.freeze({ buildPaths, reset });
}
