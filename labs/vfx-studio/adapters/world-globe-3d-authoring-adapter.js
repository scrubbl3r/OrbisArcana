const WORLD_GLOBE_3D_NUMERIC_FIELDS = Object.freeze([
  "worldGlobe3dIdleDiameterRatio",
  "worldGlobe3dIdleDriftRatio",
  "worldGlobe3dIdleBobRatio",
  "worldGlobe3dIdleBobHz",
  "worldGlobe3dIdlePulseScale",
  "worldGlobe3dIdlePulseHz",
  "worldGlobe3dCollectedDiameterRatio",
  "worldGlobe3dConsumedDiameterRatio",
  "worldGlobe3dShellFresnelPower",
  "worldGlobe3dShellRimAlphaPower",
  "worldGlobe3dShellCenterAlpha",
  "worldGlobe3dShellRimAlpha",
  "worldGlobe3dShellPastelMix",
  "worldGlobe3dShellRimPastelMix",
  "worldGlobe3dShellLuminanceBoost",
  "worldGlobe3dLightIntensity",
  "worldGlobe3dLightDistanceBO",
  "worldGlobe3dLightDecay",
  "worldGlobe3dLightOffsetZBO",
]);

const WORLD_GLOBE_3D_COLOR_FIELDS = Object.freeze([
  ["shellBaseColor", "worldGlobe3dShellBase"],
  ["shellCyanColor", "worldGlobe3dShellCyan"],
  ["shellVioletColor", "worldGlobe3dShellViolet"],
  ["shellGoldColor", "worldGlobe3dShellGold"],
  ["lightColor", "worldGlobe3dLight"],
]);

const WORLD_GLOBE_3D_NUMERIC_MAP = Object.freeze({
  worldGlobe3dShellFresnelPower: "shellFresnelPower",
  worldGlobe3dShellRimAlphaPower: "shellRimAlphaPower",
  worldGlobe3dShellCenterAlpha: "shellCenterAlpha",
  worldGlobe3dShellRimAlpha: "shellRimAlpha",
  worldGlobe3dShellPastelMix: "shellPastelMix",
  worldGlobe3dShellRimPastelMix: "shellRimPastelMix",
  worldGlobe3dShellLuminanceBoost: "shellLuminanceBoost",
  worldGlobe3dLightIntensity: "lightIntensity",
  worldGlobe3dLightDistanceBO: "lightDistanceBO",
  worldGlobe3dLightDecay: "lightDecay",
  worldGlobe3dLightOffsetZBO: "lightOffsetZBO",
});

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
  const material = defaults.material || {};
  const idle = defaults.idle || {};
  const collected = defaults.collected || {};
  const consumed = defaults.consumed || {};
  const settings = {
    worldGlobe3dIdleDiameterRatio: fixedNumber(idle.diameterRatio, 2, 0.35),
    worldGlobe3dIdleDriftRatio: fixedNumber(idle.driftRatio, 2, 0.10),
    worldGlobe3dIdleBobRatio: fixedNumber(idle.bobRatio, 2, 0.07),
    worldGlobe3dIdleBobHz: fixedNumber(idle.bobHz, 2, 0.65),
    worldGlobe3dIdlePulseScale: fixedNumber(idle.pulseScale, 3, 0.045),
    worldGlobe3dIdlePulseHz: fixedNumber(idle.pulseHz, 2, 0.9),
    worldGlobe3dCollectedDiameterRatio: fixedNumber(collected.diameterRatio, 2, 0.17),
    worldGlobe3dConsumedDiameterRatio: fixedNumber(consumed.diameterRatio, 2, 0.10),
  };

  Object.entries(WORLD_GLOBE_3D_NUMERIC_MAP).forEach(([fieldId, configKey]) => {
    settings[fieldId] = fixedNumber(material[configKey], 3, 0);
  });
  WORLD_GLOBE_3D_COLOR_FIELDS.forEach(([configKey, prefix]) => {
    const rgb = colorChannels(material[configKey]);
    settings[`${prefix}R`] = rgb.r;
    settings[`${prefix}G`] = rgb.g;
    settings[`${prefix}B`] = rgb.b;
  });
  return settings;
}

export function createWorldGlobe3dAuthoringAdapter({
  worldGlobe3dVisualDefaults = {},
  getElementById = null,
} = {}) {
  const field = (id) => (typeof getElementById === "function" ? getElementById(id) : null);

  function capture() {
    const settings = {};
    WORLD_GLOBE_3D_NUMERIC_FIELDS.forEach((id) => {
      settings[id] = Number(field(id) && field(id).value);
    });
    WORLD_GLOBE_3D_COLOR_FIELDS.forEach(([, prefix]) => {
      settings[`${prefix}R`] = roundedByte(field(`${prefix}R`) && field(`${prefix}R`).value);
      settings[`${prefix}G`] = roundedByte(field(`${prefix}G`) && field(`${prefix}G`).value);
      settings[`${prefix}B`] = roundedByte(field(`${prefix}B`) && field(`${prefix}B`).value);
    });
    return settings;
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!settings || typeof settings !== "object") return false;
    WORLD_GLOBE_3D_NUMERIC_FIELDS.forEach((id) => {
      const el = field(id);
      if (el && settings[id] != null) el.value = String(settings[id]);
    });
    WORLD_GLOBE_3D_COLOR_FIELDS.forEach(([, prefix]) => {
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
    defaultSettings: () => settingsFromDefaults(worldGlobe3dVisualDefaults),
    capture,
    apply,
  });
}
