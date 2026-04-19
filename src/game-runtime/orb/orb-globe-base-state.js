import { ORB_GLOBE_VISUAL_DEFAULTS as ORB_GLOBE_VISUAL_DEFAULTS_FILE } from "./orb-globe-default.js?v=20260418a";
import { ORB_BASE_SCALE_REFERENCE_DIAMETER_PX } from "./orb-base-state.js";
import { resolveOrbRatioPx } from "./orb-spell-geometry.js";

function clamp01(v) {
  const n = Number(v);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function clampPx(v, fallback) {
  const n = Number(v);
  return Math.max(0, Number.isFinite(n) ? n : fallback);
}

function clampRatio(v, fallback) {
  const n = Number(v);
  return Math.max(0, Number.isFinite(n) ? n : fallback);
}

function orbScaleFactorFromRadius(orbRadiusPx) {
  const radius = Math.max(0, Number(orbRadiusPx) || 0);
  return Math.max(0.01, (radius * 2) / ORB_BASE_SCALE_REFERENCE_DIAMETER_PX);
}

function scaleOrbLinkedPx(value, orbRadiusPx) {
  return clampPx(value, 0) * orbScaleFactorFromRadius(orbRadiusPx);
}

export const ORB_GLOBE_VISUAL_DEFAULTS = Object.freeze({
  orbitDistanceOffsetPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitDistanceOffsetPx,
    18
  ),
  orbitDistanceRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitDistanceRatio,
    1.10
  ),
  orbitDistanceMinPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitDistanceMinPx,
    14
  ),
  orbitSpeedMin: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitSpeedMin,
    1.8
  ),
  orbitSpeedMax: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitSpeedMax,
    2.45
  ),
  orbitDriftMin: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitDriftMin,
    0.03
  ),
  orbitDriftMax: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitDriftMax,
    0.18
  ),
  innerSpeedMinPxPerSec: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerSpeedMinPxPerSec,
    80
  ),
  innerSpeedMaxPxPerSec: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerSpeedMaxPxPerSec,
    150
  ),
  innerDriftMin: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerDriftMin,
    0.08
  ),
  innerDriftMax: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerDriftMax,
    0.28
  ),
  innerPaddingRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerPaddingRatio,
    0.06
  ),
});

export function buildOrbGlobeVisualState(overrides = null) {
  const source = (overrides && typeof overrides === "object") ? overrides : ORB_GLOBE_VISUAL_DEFAULTS;

  return Object.freeze({
    orbitDistanceOffsetPx: clampPx(
      source.orbitDistanceOffsetPx,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDistanceOffsetPx
    ),
    orbitDistanceRatio: clampRatio(
      source.orbitDistanceRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDistanceRatio
    ),
    orbitDistanceMinPx: clampPx(
      source.orbitDistanceMinPx,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDistanceMinPx
    ),
    orbitSpeedMin: clampPx(
      source.orbitSpeedMin,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitSpeedMin
    ),
    orbitSpeedMax: clampPx(
      source.orbitSpeedMax,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitSpeedMax
    ),
    orbitDriftMin: clampPx(
      source.orbitDriftMin,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDriftMin
    ),
    orbitDriftMax: clampPx(
      source.orbitDriftMax,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDriftMax
    ),
    innerSpeedMinPxPerSec: clampPx(
      source.innerSpeedMinPxPerSec,
      ORB_GLOBE_VISUAL_DEFAULTS.innerSpeedMinPxPerSec
    ),
    innerSpeedMaxPxPerSec: clampPx(
      source.innerSpeedMaxPxPerSec,
      ORB_GLOBE_VISUAL_DEFAULTS.innerSpeedMaxPxPerSec
    ),
    innerDriftMin: clampPx(
      source.innerDriftMin,
      ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMin
    ),
    innerDriftMax: clampPx(
      source.innerDriftMax,
      ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMax
    ),
    innerPaddingRatio: clampRatio(
      source.innerPaddingRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.innerPaddingRatio
    ),
  });
}

export function applyOrbGlobeVisualCssVars(
  orbGlobeVisualState,
  {
    root = globalThis.document && globalThis.document.documentElement,
    orbRadiusPx = null,
  } = {}
) {
  if (!root || !orbGlobeVisualState || typeof orbGlobeVisualState !== "object") return;
}

export function getOrbitDistancePx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  return Math.max(
    scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.orbitDistanceMinPx,
      orbRadiusPx
    ),
    (Number(orbRadiusPx) + scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.orbitDistanceOffsetPx,
      orbRadiusPx
    )) * clampRatio(
      orbGlobeVisualState && orbGlobeVisualState.orbitDistanceRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDistanceRatio
    )
  );
}

export function getInnerPaddingPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  return resolveOrbRatioPx(orbGlobeVisualState && orbGlobeVisualState.innerPaddingRatio, {
    orbDiameterPx: Math.max(0, Number(orbRadiusPx) || 0) * 2,
    min: 0,
  });
}
