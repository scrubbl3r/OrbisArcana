import { ORB_GLOBE_VISUAL_DEFAULTS as ORB_GLOBE_VISUAL_DEFAULTS_FILE } from "./orb-globe-default.js?v=20260418a";
import { ORB_BASE_SCALE_REFERENCE_DIAMETER_PX } from "./orb-base-state.js";

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
  innerDiameterRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerDiameterRatio,
    0.2
  ),
  orbitDiameterRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitDiameterRatio ?? ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitRadiusRatio,
    0.13
  ),
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
  orbitRadiusMinPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitRadiusMinPx,
    5
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
  innerPaddingPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerPaddingPx,
    6
  ),
  pickupDiameterRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.pickupDiameterRatio,
    0.50
  ),
  pickupDiameterPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.pickupDiameterPx,
    50
  ),
  innerStrokeWidthRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerStrokeWidthRatio,
    0.02
  ),
  innerStrokeWidthPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.innerStrokeWidthPx,
    2
  ),
  releasedStrokeWidthRatio: clampRatio(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.releasedStrokeWidthRatio,
    0.02
  ),
  releasedStrokeWidthPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.releasedStrokeWidthPx,
    2
  ),
  orbitStrokeWidthPx: clampPx(
    ORB_GLOBE_VISUAL_DEFAULTS_FILE.orbitStrokeWidthPx,
    2
  ),
});

export function buildOrbGlobeVisualState(overrides = null) {
  const source = (overrides && typeof overrides === "object") ? overrides : ORB_GLOBE_VISUAL_DEFAULTS;

  return Object.freeze({
    innerDiameterRatio: clampRatio(
      source.innerDiameterRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.innerDiameterRatio
    ),
    orbitDiameterRatio: clampRatio(
      source.orbitDiameterRatio ?? source.orbitRadiusRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDiameterRatio
    ),
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
    orbitRadiusMinPx: clampPx(
      source.orbitRadiusMinPx,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitRadiusMinPx
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
    innerPaddingPx: clampPx(
      source.innerPaddingPx,
      ORB_GLOBE_VISUAL_DEFAULTS.innerPaddingPx
    ),
    pickupDiameterRatio: clampRatio(
      source.pickupDiameterRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.pickupDiameterRatio
    ),
    pickupDiameterPx: clampPx(
      source.pickupDiameterPx,
      ORB_GLOBE_VISUAL_DEFAULTS.pickupDiameterPx
    ),
    innerStrokeWidthRatio: clampRatio(
      source.innerStrokeWidthRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.innerStrokeWidthRatio
    ),
    innerStrokeWidthPx: clampPx(
      source.innerStrokeWidthPx,
      ORB_GLOBE_VISUAL_DEFAULTS.innerStrokeWidthPx
    ),
    releasedStrokeWidthRatio: clampRatio(
      source.releasedStrokeWidthRatio,
      ORB_GLOBE_VISUAL_DEFAULTS.releasedStrokeWidthRatio
    ),
    releasedStrokeWidthPx: clampPx(
      source.releasedStrokeWidthPx,
      ORB_GLOBE_VISUAL_DEFAULTS.releasedStrokeWidthPx
    ),
    orbitStrokeWidthPx: clampPx(
      source.orbitStrokeWidthPx,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitStrokeWidthPx
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

  root.style.setProperty(
    "--orb-globe-pickup-d",
    `${getPickupGlobeDiameterPx(orbRadiusPx, orbGlobeVisualState)}px`
  );
  root.style.setProperty(
    "--orb-globe-inner-stroke",
    `${getInnerGlobeStrokeWidthPx(orbRadiusPx, orbGlobeVisualState)}px`
  );
  root.style.setProperty(
    "--orb-globe-released-stroke",
    `${getReleasedGlobeStrokeWidthPx(orbRadiusPx, orbGlobeVisualState)}px`
  );
  root.style.setProperty(
    "--orb-globe-orbit-stroke",
    `${Math.max(
      0,
      scaleOrbLinkedPx(
        clampPx(
          orbGlobeVisualState.orbitStrokeWidthPx,
          ORB_GLOBE_VISUAL_DEFAULTS.orbitStrokeWidthPx
        ),
        orbRadiusPx
      )
    )}px`
  );
}

export function getInnerGlobeDiameterPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  return Number(orbRadiusPx) * clampRatio(
    orbGlobeVisualState && orbGlobeVisualState.innerDiameterRatio,
    ORB_GLOBE_VISUAL_DEFAULTS.innerDiameterRatio
  );
}

export function getOrbitGlobeRadiusPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  return Math.max(
    scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.orbitRadiusMinPx,
      orbRadiusPx
    ),
    Number(orbRadiusPx) * clampRatio(
      orbGlobeVisualState && (orbGlobeVisualState.orbitDiameterRatio ?? orbGlobeVisualState.orbitRadiusRatio),
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDiameterRatio
    )
  );
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

export function getPickupGlobeDiameterPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  const pickupDiameterRatio = clampRatio(
    orbGlobeVisualState && orbGlobeVisualState.pickupDiameterRatio,
    ORB_GLOBE_VISUAL_DEFAULTS.pickupDiameterRatio
  );
  if (pickupDiameterRatio > 0) {
    return Math.max(0, Number(orbRadiusPx) * 2 * pickupDiameterRatio);
  }
  return Math.max(
    0,
    scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.pickupDiameterPx,
      orbRadiusPx
    )
  );
}

export function getInnerPaddingPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  const innerPaddingRatio = clampRatio(
    orbGlobeVisualState && orbGlobeVisualState.innerPaddingRatio,
    ORB_GLOBE_VISUAL_DEFAULTS.innerPaddingRatio
  );
  if (innerPaddingRatio > 0) {
    return Math.max(0, Number(orbRadiusPx) * 2 * innerPaddingRatio);
  }
  return Math.max(
    0,
    scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.innerPaddingPx,
      orbRadiusPx
    )
  );
}

export function getInnerGlobeStrokeWidthPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  const innerStrokeWidthRatio = clampRatio(
    orbGlobeVisualState && orbGlobeVisualState.innerStrokeWidthRatio,
    ORB_GLOBE_VISUAL_DEFAULTS.innerStrokeWidthRatio
  );
  if (innerStrokeWidthRatio > 0) {
    return Math.max(0, Number(orbRadiusPx) * 2 * innerStrokeWidthRatio);
  }
  return Math.max(
    0,
    scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.innerStrokeWidthPx,
      orbRadiusPx
    )
  );
}

export function getReleasedGlobeStrokeWidthPx(orbRadiusPx, orbGlobeVisualState = ORB_GLOBE_VISUAL_DEFAULTS) {
  const releasedStrokeWidthRatio = clampRatio(
    orbGlobeVisualState && orbGlobeVisualState.releasedStrokeWidthRatio,
    ORB_GLOBE_VISUAL_DEFAULTS.releasedStrokeWidthRatio
  );
  if (releasedStrokeWidthRatio > 0) {
    return Math.max(0, Number(orbRadiusPx) * 2 * releasedStrokeWidthRatio);
  }
  return Math.max(
    0,
    scaleOrbLinkedPx(
      orbGlobeVisualState && orbGlobeVisualState.releasedStrokeWidthPx,
      orbRadiusPx
    )
  );
}
