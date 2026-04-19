import {
  ORB_BASE_SCALE_REFERENCE_DIAMETER_PX,
  getCanonicalOrbBaseDiameterPx,
} from "./orb-base-state.js";

function clampPositive(n, fallback = 0) {
  const value = Number(n);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
  const resolvedOrbDiameterPx = Math.max(
    1,
    clampPositive(orbDiameterPx, getCanonicalOrbBaseDiameterPx())
  );
  const diameterRatio = clampPositive(config.diameterRatio, 0);
  const strokeWidthRatio = clampPositive(config.strokeWidthRatio, 0);
  return {
    ...config,
    diameterPx: diameterRatio > 0
      ? Math.max(10, diameterRatio * resolvedOrbDiameterPx)
      : resolveOrbLinkedPx(config.diameterPx, { orbDiameterPx, min: 10 }),
    strokeWidthPx: strokeWidthRatio > 0
      ? (typeof normalizeStroke === "function"
          ? normalizeStroke(Math.max(1, strokeWidthRatio * resolvedOrbDiameterPx))
          : Math.max(1, strokeWidthRatio * resolvedOrbDiameterPx))
      : resolveOrbLinkedPx(config.strokeWidthPx, {
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
    startR: resolveOrbLinkedPx(config.startR, { orbDiameterPx, min: 1 }),
    endR: resolveOrbLinkedPx(config.endR, { orbDiameterPx, min: 1 }),
    stroke: resolveOrbLinkedPx(config.stroke, {
      orbDiameterPx,
      min: 1,
      normalize: normalizeStroke,
    }),
  };
}

export function resolveFlameAoeGeometry(config = {}, { orbDiameterPx = null } = {}) {
  const resolvedOrbDiameterPx = Math.max(
    1,
    clampPositive(orbDiameterPx, getCanonicalOrbBaseDiameterPx())
  );
  const diameterRatio = clampPositive(config.diameterRatio, 0);
  return {
    ...config,
    diameter: diameterRatio > 0
      ? Math.max(1, diameterRatio * resolvedOrbDiameterPx)
      : resolveOrbLinkedPx(config.diameter, { orbDiameterPx, min: 1 }),
  };
}

export function resolveElectricAoeGeometry(config = {}, { orbDiameterPx = null } = {}) {
  const resolvedOrbDiameterPx = Math.max(
    1,
    clampPositive(orbDiameterPx, getCanonicalOrbBaseDiameterPx())
  );
  const startRatio = clampPositive(config.startRatio, 0);
  const endRatio = clampPositive(config.endRatio, 0);
  return {
    ...config,
    startR: startRatio > 0
      ? Math.max(2, startRatio * resolvedOrbDiameterPx)
      : resolveOrbLinkedPx(config.startR, { orbDiameterPx, min: 2 }),
    endR: endRatio > 0
      ? Math.max(8, endRatio * resolvedOrbDiameterPx)
      : resolveOrbLinkedPx(config.endR, { orbDiameterPx, min: 8 }),
    maxBoltJumpSq: resolveOrbLinkedSq(config.maxBoltJumpSq, { orbDiameterPx, min: 100 }),
  };
}
