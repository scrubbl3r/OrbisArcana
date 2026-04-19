import {
  ORB_BASE_SCALE_REFERENCE_DIAMETER_PX,
  getCanonicalOrbBaseDiameterPx,
} from "./orb-base-state.js";

function clampPositive(n, fallback = 0) {
  const value = Number(n);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function resolveOrbRatioPx(
  ratio,
  {
    orbDiameterPx = null,
    min = 0,
    normalize = null,
  } = {}
) {
  const resolvedOrbDiameterPx = Math.max(
    1,
    clampPositive(orbDiameterPx, getCanonicalOrbBaseDiameterPx())
  );
  const resolved = Math.max(min, clampPositive(ratio, 0) * resolvedOrbDiameterPx);
  return typeof normalize === "function" ? normalize(resolved) : resolved;
}

export function resolveOrbRatioOrPx(
  {
    ratio = null,
    px = null,
    fallbackRatio = 0,
    fallbackPx = 0,
  } = {},
  {
    orbDiameterPx = null,
    min = 0,
    normalize = null,
  } = {}
) {
  const ratioCandidate = clampPositive(ratio, clampPositive(fallbackRatio, 0));
  if (ratioCandidate > 0) {
    return resolveOrbRatioPx(ratioCandidate, {
      orbDiameterPx,
      min,
      normalize,
    });
  }
  return resolveOrbLinkedPx(px, {
    orbDiameterPx,
    min,
    normalize,
  });
}

export function resolveOrbLinkedScale({
  orbDiameterPx = null,
  referenceDiameterPx = ORB_BASE_SCALE_REFERENCE_DIAMETER_PX,
} = {}) {
  const reference = Math.max(1, clampPositive(referenceDiameterPx, ORB_BASE_SCALE_REFERENCE_DIAMETER_PX));
  const diameter = Math.max(
    1,
    clampPositive(orbDiameterPx, getCanonicalOrbBaseDiameterPx())
  );
  return Math.max(0.01, diameter / reference);
}

export function resolveOrbLinkedPx(
  value,
  {
    orbDiameterPx = null,
    referenceDiameterPx = ORB_BASE_SCALE_REFERENCE_DIAMETER_PX,
    normalize = null,
    min = 0,
  } = {}
) {
  const scale = resolveOrbLinkedScale({ orbDiameterPx, referenceDiameterPx });
  const resolved = Math.max(min, (Number(value) || 0) * scale);
  return typeof normalize === "function" ? normalize(resolved) : resolved;
}

export function resolveOrbLinkedSq(
  value,
  {
    orbDiameterPx = null,
    referenceDiameterPx = ORB_BASE_SCALE_REFERENCE_DIAMETER_PX,
    min = 0,
  } = {}
) {
  const scale = resolveOrbLinkedScale({ orbDiameterPx, referenceDiameterPx });
  return Math.max(min, (Number(value) || 0) * scale * scale);
}

export function resolveBubbleShieldGeometry(
  config = {},
  {
    orbDiameterPx = null,
    normalizeStroke = null,
  } = {}
) {
  return {
    ...config,
    diameterPx: resolveOrbRatioOrPx({
      ratio: config.diameterRatio,
      px: config.diameterPx,
    }, { orbDiameterPx, min: 10 }),
    strokeWidthPx: resolveOrbRatioOrPx({
      ratio: config.strokeWidthRatio,
      px: config.strokeWidthPx,
    }, {
      orbDiameterPx,
      min: 1,
      normalize: normalizeStroke,
    }),
  };
}

export function resolveShockwaveGeometry(
  config = {},
  {
    orbDiameterPx = null,
    normalizeStroke = null,
  } = {}
) {
  return {
    ...config,
    startR: resolveOrbRatioOrPx({
      ratio: config.startRatio,
      px: config.startR,
    }, { orbDiameterPx, min: 1 }),
    endR: resolveOrbRatioOrPx({
      ratio: config.endRatio,
      px: config.endR,
    }, { orbDiameterPx, min: 1 }),
    stroke: resolveOrbRatioOrPx({
      ratio: config.strokeRatio,
      px: config.stroke,
    }, {
      orbDiameterPx,
      min: 1,
      normalize: normalizeStroke,
    }),
  };
}

export function resolveFlameAoeGeometry(config = {}, { orbDiameterPx = null } = {}) {
  return {
    ...config,
    diameter: resolveOrbRatioPx(config.diameterRatio, { orbDiameterPx, min: 1 }),
  };
}

export function resolveElectricAoeGeometry(config = {}, { orbDiameterPx = null } = {}) {
  return {
    ...config,
    startR: resolveOrbRatioOrPx({
      ratio: config.startRatio,
      px: config.startR,
    }, { orbDiameterPx, min: 2 }),
    endR: resolveOrbRatioOrPx({
      ratio: config.endRatio,
      px: config.endR,
    }, { orbDiameterPx, min: 8 }),
    maxBoltJumpSq: resolveOrbLinkedSq(config.maxBoltJumpSq, { orbDiameterPx, min: 100 }),
  };
}
