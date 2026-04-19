const ORB_GLOBE_FIELDS = Object.freeze([
  "orbGlobeInnerDiameterRatio",
  "orbGlobeOrbitDiameterRatio",
  "orbGlobeOrbitDistanceRatio",
  "orbGlobeOrbitDistanceMin",
  "orbGlobeOrbitRadiusMin",
  "orbGlobeSpeedMin",
  "orbGlobeSpeedMax",
  "orbGlobeDriftMin",
  "orbGlobeDriftMax",
  "orbGlobeInnerSpeedMin",
  "orbGlobeInnerSpeedMax",
  "orbGlobeInnerDriftMin",
  "orbGlobeInnerDriftMax",
  "orbGlobeInnerPaddingPx",
]);

function fixedNumber(value, digits, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Number((Number.isFinite(n) ? n : f).toFixed(digits));
}

function roundedNumber(value, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Math.round(Number.isFinite(n) ? n : f);
}

export function createOrbGlobeAuthoringAdapter({
  orbGlobeVisualDefaults = {},
} = {}) {
  function defaultSettings() {
    return {
      orbGlobeInnerDiameterRatio: fixedNumber(orbGlobeVisualDefaults.innerDiameterRatio, 2),
      orbGlobeOrbitDiameterRatio: fixedNumber(orbGlobeVisualDefaults.orbitDiameterRatio ?? orbGlobeVisualDefaults.orbitRadiusRatio, 2),
      orbGlobeOrbitDistanceRatio: fixedNumber(orbGlobeVisualDefaults.orbitDistanceRatio, 2),
      orbGlobeOrbitDistanceMin: roundedNumber(orbGlobeVisualDefaults.orbitDistanceMinPx),
      orbGlobeOrbitRadiusMin: roundedNumber(orbGlobeVisualDefaults.orbitRadiusMinPx),
      orbGlobeSpeedMin: fixedNumber(orbGlobeVisualDefaults.orbitSpeedMin, 2),
      orbGlobeSpeedMax: fixedNumber(orbGlobeVisualDefaults.orbitSpeedMax, 2),
      orbGlobeDriftMin: fixedNumber(orbGlobeVisualDefaults.orbitDriftMin, 2),
      orbGlobeDriftMax: fixedNumber(orbGlobeVisualDefaults.orbitDriftMax, 2),
      orbGlobeInnerSpeedMin: roundedNumber(orbGlobeVisualDefaults.innerSpeedMinPxPerSec),
      orbGlobeInnerSpeedMax: roundedNumber(orbGlobeVisualDefaults.innerSpeedMaxPxPerSec),
      orbGlobeInnerDriftMin: fixedNumber(orbGlobeVisualDefaults.innerDriftMin, 2),
      orbGlobeInnerDriftMax: fixedNumber(orbGlobeVisualDefaults.innerDriftMax, 2),
      orbGlobeInnerPaddingPx: roundedNumber(orbGlobeVisualDefaults.innerPaddingPx),
    };
  }

  function capture(els) {
    return Object.fromEntries(ORB_GLOBE_FIELDS.map((key) => [
      key,
      Number(els && els[key] && els[key].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_GLOBE_FIELDS.forEach((key) => {
      if (els[key] && settings[key] != null) els[key].value = String(settings[key]);
    });
    if (els.orbGlobeOrbitDiameterRatio && settings.orbGlobeOrbitRadiusRatio != null && settings.orbGlobeOrbitDiameterRatio == null) {
      els.orbGlobeOrbitDiameterRatio.value = String(settings.orbGlobeOrbitRadiusRatio);
    }
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
