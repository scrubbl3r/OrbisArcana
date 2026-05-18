const ORB_3D_NUMBER_FIELDS = Object.freeze([
  "orb3dShellFresnelPower",
  "orb3dShellRimAlphaPower",
  "orb3dShellCenterAlpha",
  "orb3dShellRimAlpha",
  "orb3dShellPastelMix",
  "orb3dShellRimPastelMix",
  "orb3dShellDriftPastelMix",
  "orb3dShellLuminanceBoost",
  "orb3dOpalescenceSpeed",
  "orb3dDriftScaleX",
  "orb3dDriftScaleY",
  "orb3dDriftScaleZ",
  "orb3dDriftRateA",
  "orb3dDriftRateB",
  "orb3dDriftRateC",
  "orb3dDriftPhaseB",
  "orb3dDriftPhaseC",
  "orb3dGoldMix",
  "orb3dLightIntensity",
  "orb3dLightDistanceBO",
  "orb3dLightDecay",
  "orb3dLightPastelMix",
  "orb3dLightOffsetZBO",
  "orb3dLightShadowMapSize",
  "orb3dLightShadowBias",
  "orb3dLightShadowNormalBias",
  "orb3dLightShadowNearBO",
  "orb3dLightShadowFarBO",
]);

const ORB_3D_BOOLEAN_FIELDS = Object.freeze([
  "orb3dLightCastShadow",
]);

const ORB_3D_COLOR_GROUPS = Object.freeze([
  ["shellBaseColor", "orb3dShellBase"],
  ["shellCyanColor", "orb3dShellCyan"],
  ["shellVioletColor", "orb3dShellViolet"],
  ["shellGoldColor", "orb3dShellGold"],
  ["lightColor", "orb3dLight"],
]);

const SETTING_BY_FIELD = Object.freeze({
  orb3dShellFresnelPower: "shellFresnelPower",
  orb3dShellRimAlphaPower: "shellRimAlphaPower",
  orb3dShellCenterAlpha: "shellCenterAlpha",
  orb3dShellRimAlpha: "shellRimAlpha",
  orb3dShellPastelMix: "shellPastelMix",
  orb3dShellRimPastelMix: "shellRimPastelMix",
  orb3dShellDriftPastelMix: "shellDriftPastelMix",
  orb3dShellLuminanceBoost: "shellLuminanceBoost",
  orb3dOpalescenceSpeed: "opalescenceSpeed",
  orb3dDriftScaleX: "driftScaleX",
  orb3dDriftScaleY: "driftScaleY",
  orb3dDriftScaleZ: "driftScaleZ",
  orb3dDriftRateA: "driftRateA",
  orb3dDriftRateB: "driftRateB",
  orb3dDriftRateC: "driftRateC",
  orb3dDriftPhaseB: "driftPhaseB",
  orb3dDriftPhaseC: "driftPhaseC",
  orb3dGoldMix: "goldMix",
  orb3dLightIntensity: "lightIntensity",
  orb3dLightDistanceBO: "lightDistanceBO",
  orb3dLightDecay: "lightDecay",
  orb3dLightPastelMix: "lightPastelMix",
  orb3dLightOffsetZBO: "lightOffsetZBO",
  orb3dLightCastShadow: "lightCastShadow",
  orb3dLightShadowMapSize: "lightShadowMapSize",
  orb3dLightShadowBias: "lightShadowBias",
  orb3dLightShadowNormalBias: "lightShadowNormalBias",
  orb3dLightShadowNearBO: "lightShadowNearBO",
  orb3dLightShadowFarBO: "lightShadowFarBO",
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

function rgbFromHex(hex) {
  const n = Number(hex) >>> 0;
  return Object.freeze({
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  });
}

function hexFromRgb(prefix, els) {
  const r = roundedNumber(els && els[`${prefix}R`] && els[`${prefix}R`].value);
  const g = roundedNumber(els && els[`${prefix}G`] && els[`${prefix}G`].value);
  const b = roundedNumber(els && els[`${prefix}B`] && els[`${prefix}B`].value);
  return ((Math.max(0, Math.min(255, r)) << 16) | (Math.max(0, Math.min(255, g)) << 8) | Math.max(0, Math.min(255, b))) >>> 0;
}

function setRgbFields(prefix, hex, els) {
  const rgb = rgbFromHex(hex);
  if (els[`${prefix}R`]) els[`${prefix}R`].value = String(rgb.r);
  if (els[`${prefix}G`]) els[`${prefix}G`].value = String(rgb.g);
  if (els[`${prefix}B`]) els[`${prefix}B`].value = String(rgb.b);
}

function settingsFromDefaults(defaults = {}) {
  return {
    shellBaseColor: roundedNumber(defaults.shellBaseColor, 0xfbfdff),
    shellCyanColor: roundedNumber(defaults.shellCyanColor, 0x8ff4ff),
    shellVioletColor: roundedNumber(defaults.shellVioletColor, 0xd0b8ff),
    shellGoldColor: roundedNumber(defaults.shellGoldColor, 0xffcc3f),
    shellFresnelPower: fixedNumber(defaults.shellFresnelPower, 2, 3.15),
    shellRimAlphaPower: fixedNumber(defaults.shellRimAlphaPower, 2, 0.92),
    shellCenterAlpha: fixedNumber(defaults.shellCenterAlpha, 3, 0.015),
    shellRimAlpha: fixedNumber(defaults.shellRimAlpha, 2, 0.84),
    shellPastelMix: fixedNumber(defaults.shellPastelMix, 2, 0.84),
    shellRimPastelMix: fixedNumber(defaults.shellRimPastelMix, 2, 0.36),
    shellDriftPastelMix: fixedNumber(defaults.shellDriftPastelMix, 2, 0.08),
    shellLuminanceBoost: fixedNumber(defaults.shellLuminanceBoost, 2, 1.5),
    opalescenceSpeed: fixedNumber(defaults.opalescenceSpeed, 1, 9),
    driftScaleX: fixedNumber(defaults.driftScaleX, 3, 0.03),
    driftScaleY: fixedNumber(defaults.driftScaleY, 3, 0.036),
    driftScaleZ: fixedNumber(defaults.driftScaleZ, 3, 0.028),
    driftRateA: fixedNumber(defaults.driftRateA, 2, 0.42),
    driftRateB: fixedNumber(defaults.driftRateB, 2, -0.31),
    driftRateC: fixedNumber(defaults.driftRateC, 2, 0.24),
    driftPhaseB: fixedNumber(defaults.driftPhaseB, 2, 1.7),
    driftPhaseC: fixedNumber(defaults.driftPhaseC, 2, 3.1),
    goldMix: fixedNumber(defaults.goldMix, 2, 0.34),
    lightColor: roundedNumber(defaults.lightColor, 0xcfefff),
    lightIntensity: fixedNumber(defaults.lightIntensity, 1, 120),
    lightDistanceBO: fixedNumber(defaults.lightDistanceBO, 2, 10),
    lightDecay: fixedNumber(defaults.lightDecay, 2, 1.35),
    lightPastelMix: fixedNumber(defaults.lightPastelMix, 2, 0.42),
    lightOffsetZBO: fixedNumber(defaults.lightOffsetZBO, 2, 0),
    lightCastShadow: defaults.lightCastShadow !== false,
    lightShadowMapSize: roundedNumber(defaults.lightShadowMapSize, 512),
    lightShadowBias: fixedNumber(defaults.lightShadowBias, 5, -0.00025),
    lightShadowNormalBias: fixedNumber(defaults.lightShadowNormalBias, 3, 0.018),
    lightShadowNearBO: fixedNumber(defaults.lightShadowNearBO, 2, 0.08),
    lightShadowFarBO: fixedNumber(defaults.lightShadowFarBO, 2, 10),
  };
}

export function createOrb3dAuthoringAdapter({
  orb3dVisualDefaults = {},
} = {}) {
  function defaultSettings() {
    return settingsFromDefaults(orb3dVisualDefaults);
  }

  function capture(els) {
    const settings = {};
    ORB_3D_NUMBER_FIELDS.forEach((fieldKey) => {
      settings[SETTING_BY_FIELD[fieldKey]] = Number(els && els[fieldKey] && els[fieldKey].value);
    });
    ORB_3D_BOOLEAN_FIELDS.forEach((fieldKey) => {
      settings[SETTING_BY_FIELD[fieldKey]] = !!(els && els[fieldKey] && els[fieldKey].checked);
    });
    ORB_3D_COLOR_GROUPS.forEach(([settingsKey, prefix]) => {
      settings[settingsKey] = hexFromRgb(prefix, els);
    });
    return settings;
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_3D_NUMBER_FIELDS.forEach((fieldKey) => {
      const settingsKey = SETTING_BY_FIELD[fieldKey];
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    ORB_3D_BOOLEAN_FIELDS.forEach((fieldKey) => {
      const settingsKey = SETTING_BY_FIELD[fieldKey];
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].checked = !!settings[settingsKey];
    });
    ORB_3D_COLOR_GROUPS.forEach(([settingsKey, prefix]) => {
      if (settings[settingsKey] != null) setRgbFields(prefix, settings[settingsKey], els);
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
