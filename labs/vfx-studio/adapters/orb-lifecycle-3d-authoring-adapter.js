const ORB_LIFECYCLE_3D_FIELDS = Object.freeze([
  "orbLifecycle3dHitTotal",
  "orbLifecycle3dCrackTotal",
  "orbLifecycle3dCrackAlpha",
  "orbLifecycle3dCrackStroke",
  "orbLifecycle3dCrackLift",
  "orbLifecycle3dStartHoleSizeMin",
  "orbLifecycle3dStartHoleSizeMax",
  "orbLifecycle3dChildHoleCountMin",
  "orbLifecycle3dChildHoleCountMax",
  "orbLifecycle3dChildHoleSizeMin",
  "orbLifecycle3dChildHoleSizeMax",
  "orbLifecycle3dChildHoleRangeMin",
  "orbLifecycle3dChildHoleRangeMax",
  "orbLifecycle3dParticleCount",
  "orbLifecycle3dParticleSize",
  "orbLifecycle3dParticleSpeedMin",
  "orbLifecycle3dParticleSpeedMax",
  "orbLifecycle3dParticleDrag",
  "orbLifecycle3dParticleTtl",
]);

const ORB_LIFECYCLE_3D_COLOR_FIELDS = Object.freeze([
  ["crackColor", "orbLifecycle3dCrack"],
  ["particleColor", "orbLifecycle3dParticle"],
]);

function roundedNumber(value, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Math.round(Number.isFinite(n) ? n : f);
}

function fixedNumber(value, digits, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Number((Number.isFinite(n) ? n : f).toFixed(digits));
}

function roundedByte(value, fallback = 255) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 255;
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : f)));
}

function colorChannels(color) {
  const c = Number(color) >>> 0;
  return Object.freeze({
    r: (c >> 16) & 255,
    g: (c >> 8) & 255,
    b: c & 255,
  });
}

function settingsFromDefaults(defaults = {}) {
  const settings = {
    orbLifecycle3dHitTotal: roundedNumber(defaults.maxHits, 10),
    orbLifecycle3dCrackTotal: roundedNumber(defaults.maxCracks, 12),
    orbLifecycle3dCrackAlpha: fixedNumber(defaults.crackAlpha, 2, 0.92),
    orbLifecycle3dCrackStroke: fixedNumber(defaults.crackWidthPx, 2, 1.5),
    orbLifecycle3dCrackLift: fixedNumber(defaults.crackLiftBO, 3, 0.006),
    orbLifecycle3dStartHoleSizeMin: fixedNumber(defaults.startHoleSizeMin, 3, 0.01),
    orbLifecycle3dStartHoleSizeMax: fixedNumber(defaults.startHoleSizeMax, 3, 0.02),
    orbLifecycle3dChildHoleCountMin: roundedNumber(defaults.childHoleCountMin, 4),
    orbLifecycle3dChildHoleCountMax: roundedNumber(defaults.childHoleCountMax, 9),
    orbLifecycle3dChildHoleSizeMin: fixedNumber(defaults.childHoleSizeMin, 3, 0.004),
    orbLifecycle3dChildHoleSizeMax: fixedNumber(defaults.childHoleSizeMax, 3, 0.012),
    orbLifecycle3dChildHoleRangeMin: fixedNumber(defaults.childHoleRangeMin, 3, 0.045),
    orbLifecycle3dChildHoleRangeMax: fixedNumber(defaults.childHoleRangeMax, 3, 0.145),
    orbLifecycle3dParticleCount: roundedNumber(defaults.particleCount, 72),
    orbLifecycle3dParticleSize: fixedNumber(defaults.particleSizePx, 2, 4.5),
    orbLifecycle3dParticleSpeedMin: fixedNumber(defaults.particleSpeedMinBO, 2, 1.35),
    orbLifecycle3dParticleSpeedMax: fixedNumber(defaults.particleSpeedMaxBO, 2, 4.25),
    orbLifecycle3dParticleDrag: fixedNumber(defaults.particleDrag, 2, 2.8),
    orbLifecycle3dParticleTtl: roundedNumber(defaults.particleTtlMs, 1050),
  };
  ORB_LIFECYCLE_3D_COLOR_FIELDS.forEach(([configKey, prefix]) => {
    const rgb = colorChannels(defaults[configKey]);
    settings[`${prefix}R`] = rgb.r;
    settings[`${prefix}G`] = rgb.g;
    settings[`${prefix}B`] = rgb.b;
  });
  return settings;
}

export function createOrbLifecycle3dAuthoringAdapter({
  orbLifecycle3dDefaults = {},
  getElementById = null,
} = {}) {
  const field = (id) => (typeof getElementById === "function" ? getElementById(id) : null);

  function defaultSettings() {
    return settingsFromDefaults(orbLifecycle3dDefaults);
  }

  function capture() {
    const settings = {};
    ORB_LIFECYCLE_3D_FIELDS.forEach((id) => {
      settings[id] = Number(field(id) && field(id).value);
    });
    ORB_LIFECYCLE_3D_COLOR_FIELDS.forEach(([, prefix]) => {
      settings[`${prefix}R`] = roundedByte(field(`${prefix}R`) && field(`${prefix}R`).value);
      settings[`${prefix}G`] = roundedByte(field(`${prefix}G`) && field(`${prefix}G`).value);
      settings[`${prefix}B`] = roundedByte(field(`${prefix}B`) && field(`${prefix}B`).value);
    });
    return settings;
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!settings || typeof settings !== "object") return false;
    ORB_LIFECYCLE_3D_FIELDS.forEach((id) => {
      const el = field(id);
      if (el && settings[id] != null) el.value = String(settings[id]);
    });
    ORB_LIFECYCLE_3D_COLOR_FIELDS.forEach(([, prefix]) => {
      ["R", "G", "B"].forEach((suffix) => {
        const id = `${prefix}${suffix}`;
        const el = field(id);
        if (el && settings[id] != null) el.value = String(settings[id]);
      });
    });
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
