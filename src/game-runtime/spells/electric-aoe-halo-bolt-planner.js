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

function rotateXY(v, angle = 0) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: c * v.x - s * v.y, y: s * v.x + c * v.y, z: v.z };
}

function rotateXZ(v, angle = 0) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: c * v.x - s * v.z, y: v.y, z: s * v.x + c * v.z };
}

function rotateYZ(v, angle = 0) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: c * v.y - s * v.z, z: s * v.y + c * v.z };
}

function sphericalFibonacciDirection(index, total, seed) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const jitter = random01(seed, 11) * 0.72;
  const y = 1 - 2 * ((index + 0.5 + jitter) / safeTotal);
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = (index + random01(seed, 12)) * Math.PI * (3 - Math.sqrt(5));
  return normalizeVector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
}

function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  return Object.freeze({
    fieldEnabled: source.haloFieldEnabled !== false,
    fieldPointCount: Math.round(clampNumber(source.haloFieldPointCount, 0, 256, 24)),
    fieldPointDiameterBo: 0.05,
    fieldSeed: Math.round(clampNumber(source.haloFieldSeed, 1, 999999999, 4242)),
    fieldShellRadiusBo: clampNumber(source.haloFieldShellRadiusBo, 0.5, 32, 1.5),
    fieldSliceHalfDepthBo: clampNumber(source.haloFieldSliceHalfDepthBo, 0, 32, 0),
    fieldWander: clampNumber(source.haloFieldWander, 0, 2, 0.35),
    fieldWanderSpeed: clampNumber(source.haloFieldWanderSpeed, 0, 12, 0.45),
    zBo: clampNumber(source.zBo ?? source.dominantBoltZBo, -64, 64, 0),
  });
}

function sampleShellDirection({ config, index, time, total }) {
  const seed = config.fieldSeed + index * 37.17;
  let direction = sphericalFibonacciDirection(index, total, seed);
  const speed = config.fieldWanderSpeed * randomBetween(seed, 21, 0.45, 1.35);
  const wander = config.fieldWander;
  direction = rotateXY(direction, time * speed * randomBetween(seed, 22, -0.92, 0.92)
    + Math.sin(time * speed * 0.37 + seed * 0.017) * wander * 0.28);
  direction = rotateYZ(direction, time * speed * randomBetween(seed, 23, -0.74, 0.74)
    + Math.cos(time * speed * 0.29 + seed * 0.023) * wander * 0.34);
  direction = rotateXZ(direction, time * speed * randomBetween(seed, 24, -0.58, 0.58)
    + Math.sin(time * speed * 0.43 + seed * 0.031) * wander * 0.24);
  return normalizeVector3(direction.x, direction.y, direction.z);
}

export function createElectricAoeHaloFieldPlanner() {
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
    for (let index = 0; index < config.fieldPointCount; index += 1) {
      const direction = sampleShellDirection({ config, index, time: safeTime, total: config.fieldPointCount });
      const end = Object.freeze({
        xW: originXW + direction.x * config.fieldShellRadiusBo * safeBo,
        yW: originYW + direction.y * config.fieldShellRadiusBo * safeBo,
        zBo: config.zBo + direction.z * config.fieldShellRadiusBo,
      });
      if (config.fieldSliceHalfDepthBo > 0 && Math.abs(end.zBo - config.zBo) > config.fieldSliceHalfDepthBo) continue;
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

  function reset() {}

  return Object.freeze({ buildPaths, reset });
}

export const createElectricAoeHaloBoltPlanner = createElectricAoeHaloFieldPlanner;
