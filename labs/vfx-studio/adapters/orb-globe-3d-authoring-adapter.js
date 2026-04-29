const ORB_GLOBE_3D_NUMERIC_FIELDS = Object.freeze([
  "orbGlobe3dOrbitDistanceRatio",
  "orbGlobe3dOrbitDistanceMin",
  "orbGlobe3dSpeedMin",
  "orbGlobe3dSpeedMax",
  "orbGlobe3dDriftMin",
  "orbGlobe3dDriftMax",
  "orbGlobe3dInnerSpeedMin",
  "orbGlobe3dInnerSpeedMax",
  "orbGlobe3dInnerDriftMin",
  "orbGlobe3dInnerDriftMax",
  "orbGlobe3dInnerPaddingRatio",
  "orbGlobe3dLoadedDiameterRatio",
  "orbGlobe3dConsumedDiameterRatio",
  "orbGlobe3dShellFresnelPower",
  "orbGlobe3dShellRimAlphaPower",
  "orbGlobe3dShellCenterAlpha",
  "orbGlobe3dShellRimAlpha",
  "orbGlobe3dShellPastelMix",
  "orbGlobe3dShellRimPastelMix",
  "orbGlobe3dShellLuminanceBoost",
  "orbGlobe3dLightIntensity",
  "orbGlobe3dLightDistanceBO",
  "orbGlobe3dLightDecay",
  "orbGlobe3dLightOffsetZBO",
]);

const ORB_GLOBE_3D_COLOR_FIELDS = Object.freeze([
  ["shellBaseColor", "orbGlobe3dShellBase"],
  ["shellCyanColor", "orbGlobe3dShellCyan"],
  ["shellVioletColor", "orbGlobe3dShellViolet"],
  ["shellGoldColor", "orbGlobe3dShellGold"],
  ["lightColor", "orbGlobe3dLight"],
]);

const MATERIAL_NUMERIC_MAP = Object.freeze({
  orbGlobe3dShellFresnelPower: "shellFresnelPower",
  orbGlobe3dShellRimAlphaPower: "shellRimAlphaPower",
  orbGlobe3dShellCenterAlpha: "shellCenterAlpha",
  orbGlobe3dShellRimAlpha: "shellRimAlpha",
  orbGlobe3dShellPastelMix: "shellPastelMix",
  orbGlobe3dShellRimPastelMix: "shellRimPastelMix",
  orbGlobe3dShellLuminanceBoost: "shellLuminanceBoost",
  orbGlobe3dLightIntensity: "lightIntensity",
  orbGlobe3dLightDistanceBO: "lightDistanceBO",
  orbGlobe3dLightDecay: "lightDecay",
  orbGlobe3dLightOffsetZBO: "lightOffsetZBO",
});

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
  const material = defaults.material || {};
  const settings = {
    orbGlobe3dOrbitDistanceRatio: fixedNumber(defaults.orbitDistanceRatio, 2, 1.1),
    orbGlobe3dOrbitDistanceMin: roundedNumber(defaults.orbitDistanceMinPx, 14),
    orbGlobe3dSpeedMin: fixedNumber(defaults.orbitSpeedMin, 2, 1.8),
    orbGlobe3dSpeedMax: fixedNumber(defaults.orbitSpeedMax, 2, 2.45),
    orbGlobe3dDriftMin: fixedNumber(defaults.orbitDriftMin, 2, 0.03),
    orbGlobe3dDriftMax: fixedNumber(defaults.orbitDriftMax, 2, 0.18),
    orbGlobe3dInnerSpeedMin: roundedNumber(defaults.innerSpeedMinPxPerSec, 80),
    orbGlobe3dInnerSpeedMax: roundedNumber(defaults.innerSpeedMaxPxPerSec, 150),
    orbGlobe3dInnerDriftMin: fixedNumber(defaults.innerDriftMin, 2, 0.08),
    orbGlobe3dInnerDriftMax: fixedNumber(defaults.innerDriftMax, 2, 0.28),
    orbGlobe3dInnerPaddingRatio: fixedNumber(defaults.innerPaddingRatio, 2, 0.06),
    orbGlobe3dLoadedDiameterRatio: fixedNumber(defaults.loadedDiameterRatio, 2, 0.17),
    orbGlobe3dConsumedDiameterRatio: fixedNumber(defaults.consumedDiameterRatio, 2, 0.10),
  };
  Object.entries(MATERIAL_NUMERIC_MAP).forEach(([fieldId, configKey]) => {
    settings[fieldId] = fixedNumber(material[configKey], 3, 0);
  });
  ORB_GLOBE_3D_COLOR_FIELDS.forEach(([configKey, prefix]) => {
    const rgb = colorChannels(material[configKey]);
    settings[`${prefix}R`] = rgb.r;
    settings[`${prefix}G`] = rgb.g;
    settings[`${prefix}B`] = rgb.b;
  });
  return settings;
}

export function createOrbGlobe3dAuthoringAdapter({
  orbGlobe3dVisualDefaults = {},
  getElementById = null,
} = {}) {
  const field = (id) => (typeof getElementById === "function" ? getElementById(id) : null);

  function capture() {
    const settings = {};
    ORB_GLOBE_3D_NUMERIC_FIELDS.forEach((id) => {
      settings[id] = Number(field(id) && field(id).value);
    });
    ORB_GLOBE_3D_COLOR_FIELDS.forEach(([, prefix]) => {
      settings[`${prefix}R`] = roundedByte(field(`${prefix}R`) && field(`${prefix}R`).value);
      settings[`${prefix}G`] = roundedByte(field(`${prefix}G`) && field(`${prefix}G`).value);
      settings[`${prefix}B`] = roundedByte(field(`${prefix}B`) && field(`${prefix}B`).value);
    });
    return settings;
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!settings || typeof settings !== "object") return false;
    ORB_GLOBE_3D_NUMERIC_FIELDS.forEach((id) => {
      const el = field(id);
      if (el && settings[id] != null) el.value = String(settings[id]);
    });
    ORB_GLOBE_3D_COLOR_FIELDS.forEach(([, prefix]) => {
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
    defaultSettings: () => settingsFromDefaults(orbGlobe3dVisualDefaults),
    capture,
    apply,
  });
}
