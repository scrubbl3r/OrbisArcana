export const ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS = Object.freeze({
  controlPointDiameterBo: 0.05,
  detourRatioMax: 1.4,
  pointSpacingBo: 0.75,
  pathJitterBo: 0.18,
  rangeBo: 8,
  targetRadiusBo: 4.5,
  zBo: 0,
});

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function distance(from = {}, to = {}) {
  return Math.hypot((Number(from.xW) || 0) - (Number(to.xW) || 0), (Number(from.yW) || 0) - (Number(to.yW) || 0));
}

function pointAtRadius(radiusWorld = 1, phase = 0) {
  const r = Math.max(0, Number(radiusWorld) || 0);
  const angle = Number(phase) || 0;
  return {
    xW: Math.cos(angle) * r,
    yW: Math.sin(angle) * r,
  };
}

function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  return Object.freeze({
    controlPointDiameterBo: clampNumber(source.controlPointDiameterBo, 0.01, 0.5, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.controlPointDiameterBo),
    detourRatioMax: clampNumber(source.detourRatioMax, 1, 8, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.detourRatioMax),
    pointSpacingBo: clampNumber(source.pointSpacingBo, 0.05, 4, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.pointSpacingBo),
    pathJitterBo: clampNumber(source.pathJitterBo, 0, 2, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.pathJitterBo),
    rangeBo: clampNumber(source.rangeBo, 0.25, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.rangeBo),
    targetRadiusBo: clampNumber(source.targetRadiusBo, 0.25, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.targetRadiusBo),
    zBo: clampNumber(source.zBo, -64, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.zBo),
  });
}

function normalizePoint(point = {}, fallback = {}) {
  return {
    xW: Number.isFinite(Number(point.xW)) ? Number(point.xW) : Number(fallback.xW) || 0,
    yW: Number.isFinite(Number(point.yW)) ? Number(point.yW) : Number(fallback.yW) || 0,
  };
}

function resolveTarget({ from, target, bo, config, phase, nav }) {
  const fallback = nav && typeof nav.randomPointAround === "function"
    ? nav.randomPointAround(from, bo * config.targetRadiusBo, {
      minRadius: bo * Math.min(config.targetRadiusBo, config.targetRadiusBo * 0.55),
    })
    : pointAtRadius(bo * config.targetRadiusBo, phase);
  const rawTarget = target && typeof target === "object" ? target : fallback;
  const resolved = nav && typeof nav.resolvePoint === "function"
    ? nav.resolvePoint(rawTarget, { fallback })
    : rawTarget;
  return normalizePoint(resolved, fallback);
}

function pathIsEligible({ from, to, nav, bo, config }) {
  const straight = Math.max(0.001, distance(from, to));
  if (straight > bo * config.rangeBo) return false;
  if (!nav || typeof nav.distanceThroughLevel !== "function") return true;
  const routed = Math.max(0.001, nav.distanceThroughLevel(from, to));
  if (routed > bo * config.rangeBo) return false;
  return routed / straight <= config.detourRatioMax;
}

function routePoints({ from, to, nav, bo, config }) {
  const spacingWorld = bo * config.pointSpacingBo;
  const jitterWorld = bo * config.pathJitterBo;
  let segments = nav && typeof nav.buildRouteSegments === "function"
    ? nav.buildRouteSegments({ from, to, spacingWorld, jitterWorld })
    : null;
  if (!Array.isArray(segments) || !segments.length) {
    const total = Math.max(0.001, distance(from, to));
    const count = Math.max(1, Math.ceil(total / Math.max(1, spacingWorld)));
    const dx = (to.xW || 0) - (from.xW || 0);
    const dy = (to.yW || 0) - (from.yW || 0);
    const invLength = 1 / Math.max(0.001, Math.hypot(dx, dy));
    const nx = -dy * invLength;
    const ny = dx * invLength;
    segments = [];
    for (let i = 1; i <= count; i += 1) {
      const t = i / count;
      const centerBias = Math.sin(t * Math.PI);
      const jitter = i === count ? 0 : (Math.random() * 2 - 1) * jitterWorld * centerBias;
      segments.push({
        xW: (from.xW || 0) + dx * t + nx * jitter,
        yW: (from.yW || 0) + dy * t + ny * jitter,
      });
    }
  }
  return [from, ...segments.map((point) => normalizePoint(point, to))];
}

export function buildElectricAoeDominantBoltControlPath({
  bo = 42,
  config: rawConfig = {},
  from = {},
  nav = null,
  phase = 0,
  target = null,
} = {}) {
  const safeBo = Math.max(1, Number(bo) || 42);
  const config = normalizeConfig(rawConfig);
  const start = nav && typeof nav.resolvePoint === "function"
    ? nav.resolvePoint(normalizePoint(from), { fallback: normalizePoint(from) })
    : normalizePoint(from);
  const end = resolveTarget({ from: start, target, bo: safeBo, config, phase, nav });
  if (!pathIsEligible({ from: start, to: end, nav, bo: safeBo, config })) {
    return Object.freeze({
      eligible: false,
      points: Object.freeze([Object.freeze({ ...start, zBo: config.zBo })]),
      target: Object.freeze({ ...end, zBo: config.zBo }),
    });
  }
  const points = routePoints({ from: start, to: end, nav, bo: safeBo, config })
    .map((point) => Object.freeze({
      xW: point.xW,
      yW: point.yW,
      zBo: config.zBo,
    }));
  return Object.freeze({
    controlPointDiameterBo: config.controlPointDiameterBo,
    eligible: true,
    points: Object.freeze(points),
    target: Object.freeze({ ...end, zBo: config.zBo }),
  });
}
