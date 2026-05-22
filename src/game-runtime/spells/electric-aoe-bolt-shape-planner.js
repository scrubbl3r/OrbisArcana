export const ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS = Object.freeze({
  headingMemory: 0.72,
  maxStepBo: 0.28,
  minStepBo: 0.05,
  pathJitterBo: 0.18,
  seekStrength: 0.42,
  shapeSmoothing: 0.18,
  shapeSpeedHz: 18,
  wanderStrength: 0.9,
});

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function random01(seed, salt = 0) {
  const value = Math.sin((Number(seed) || 0) * 12.9898 + salt * 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  return x * x * (3 - 2 * x);
}

function lerp(from, to, t) {
  return from + (to - from) * t;
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

function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const minStepBo = clampNumber(source.minStepBo, 0.01, 8, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.minStepBo);
  const maxStepBo = clampNumber(source.maxStepBo, minStepBo, 8, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.maxStepBo);
  return Object.freeze({
    headingMemory: clampNumber(source.headingMemory, 0, 1, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.headingMemory),
    maxStepBo,
    minStepBo,
    pathJitterBo: clampNumber(source.pathJitterBo, 0, 4, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.pathJitterBo),
    seekStrength: clampNumber(source.seekStrength, 0, 4, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.seekStrength),
    shapeSmoothing: clampNumber(source.shapeSmoothing, 0, 1, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.shapeSmoothing),
    shapeSpeedHz: clampNumber(source.shapeSpeedHz, 0, 120, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.shapeSpeedHz),
    wanderStrength: clampNumber(source.wanderStrength, 0, 4, ELECTRIC_AOE_BOLT_SHAPE_DEFAULTS.wanderStrength),
  });
}

function normalizePoint3(point = {}, fallback = {}) {
  return Object.freeze({
    xW: Number.isFinite(Number(point.xW)) ? Number(point.xW) : Number(fallback.xW) || 0,
    yW: Number.isFinite(Number(point.yW)) ? Number(point.yW) : Number(fallback.yW) || 0,
    zBo: Number.isFinite(Number(point.zBo)) ? Number(point.zBo) : Number(fallback.zBo) || 0,
  });
}

function distanceBo(from, to, bo) {
  const safeBo = Math.max(1, Number(bo) || 1);
  return Math.hypot(
    ((Number(to.xW) || 0) - (Number(from.xW) || 0)) / safeBo,
    ((Number(to.yW) || 0) - (Number(from.yW) || 0)) / safeBo,
    (Number(to.zBo) || 0) - (Number(from.zBo) || 0)
  );
}

function smoothPath(points, smoothing) {
  if (smoothing <= 0 || points.length <= 3) return points;
  const next = [points[0]];
  const t = smoothing * 0.5;
  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = points[index - 1];
    const point = points[index];
    const after = points[index + 1];
    next.push(Object.freeze({
      xW: lerp(point.xW, (prev.xW + after.xW) * 0.5, t),
      yW: lerp(point.yW, (prev.yW + after.yW) * 0.5, t),
      zBo: lerp(point.zBo, (prev.zBo + after.zBo) * 0.5, t),
    }));
  }
  next.push(points[points.length - 1]);
  return Object.freeze(next);
}

export function buildElectricAoeBoltShapePath({
  bo = 42,
  config: rawConfig = {},
  from = {},
  seed = 1,
  time = 0,
  to = {},
} = {}) {
  const safeBo = Math.max(1, Number(bo) || 42);
  const config = normalizeConfig(rawConfig);
  const start = normalizePoint3(from);
  const end = normalizePoint3(to, start);
  const totalDistanceBo = distanceBo(start, end, safeBo);
  if (totalDistanceBo <= 0.000001) return Object.freeze([start, end]);
  const points = [start];
  let current = start;
  let heading = normalizeVector3(
    (end.xW - start.xW) / safeBo,
    (end.yW - start.yW) / safeBo,
    end.zBo - start.zBo
  );
  const animatedSalt = (Number(time) || 0) * config.shapeSpeedHz;
  const maxIterations = 96;
  for (let index = 0; index < maxIterations; index += 1) {
    const remainingBo = distanceBo(current, end, safeBo);
    if (remainingBo <= config.maxStepBo) break;
    const seek = normalizeVector3(
      (end.xW - current.xW) / safeBo,
      (end.yW - current.yW) / safeBo,
      end.zBo - current.zBo,
      heading
    );
    const tangentSeed = seed + index * 23.17;
    const wanderA = random01(tangentSeed, 31 + animatedSalt) * 2 - 1;
    const wanderB = random01(tangentSeed, 37 + animatedSalt * 0.73) * 2 - 1;
    const wanderC = random01(tangentSeed, 41 + animatedSalt * 0.49) * 2 - 1;
    const wanderScale = config.pathJitterBo * config.wanderStrength / Math.max(0.001, config.maxStepBo);
    const latePull = smoothstep(index / Math.max(1, totalDistanceBo / Math.max(0.001, config.maxStepBo))) * 1.15;
    heading = normalizeVector3(
      heading.x * config.headingMemory + seek.x * (config.seekStrength + latePull) + wanderA * wanderScale,
      heading.y * config.headingMemory + seek.y * (config.seekStrength + latePull) + wanderB * wanderScale,
      heading.z * config.headingMemory + seek.z * (config.seekStrength + latePull) + wanderC * wanderScale * 0.38,
      seek
    );
    const stepRoll = random01(tangentSeed, 43 + animatedSalt * 0.31);
    const stepLengthBo = Math.min(
      remainingBo * 0.82,
      config.minStepBo + (config.maxStepBo - config.minStepBo) * stepRoll
    );
    current = Object.freeze({
      xW: current.xW + heading.x * stepLengthBo * safeBo,
      yW: current.yW + heading.y * stepLengthBo * safeBo,
      zBo: current.zBo + heading.z * stepLengthBo,
    });
    points.push(current);
  }
  points.push(end);
  return smoothPath(Object.freeze(points), config.shapeSmoothing);
}
