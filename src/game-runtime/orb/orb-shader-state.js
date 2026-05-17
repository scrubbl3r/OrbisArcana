import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";

export const ORB_SHADER_STATE_KEYS = Object.freeze([
  "shellLuminanceBoost",
  "shellCenterAlpha",
  "goldMix",
  "pointLightIntensity",
  "pointLightDistanceBO",
  "shadowSpotIntensity",
  "shadowSpotDistanceBO",
]);

const KEY_LIMITS = Object.freeze({
  shellLuminanceBoost: Object.freeze({ min: 0, max: 12 }),
  shellCenterAlpha: Object.freeze({ min: 0, max: 1 }),
  goldMix: Object.freeze({ min: 0, max: 2 }),
  pointLightIntensity: Object.freeze({ min: 0, max: 10000 }),
  pointLightDistanceBO: Object.freeze({ min: 0, max: 1000 }),
  shadowSpotIntensity: Object.freeze({ min: 0, max: 10000 }),
  shadowSpotDistanceBO: Object.freeze({ min: 0, max: 1000 }),
});

function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const n = Number(value);
  const resolved = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, resolved));
}

function normalizeKeyValue(key, value, fallback = 0) {
  const limits = KEY_LIMITS[key] || {};
  return clampNumber(value, fallback, limits.min, limits.max);
}

function readShaderValue(source = {}, key = "") {
  if (source[key] != null) return source[key];
  switch (key) {
    case "shellLuminanceBoost":
      return source.luminanceBoost;
    case "shellCenterAlpha":
      return source.centerAlpha;
    case "pointLightIntensity":
      return source.lightIntensity ?? source.spotIntensity;
    case "pointLightDistanceBO":
      return source.lightDistanceBO ?? source.spotDistanceBO;
    case "shadowSpotIntensity":
      return source.spotIntensity;
    case "shadowSpotDistanceBO":
      return source.spotDistanceBO;
    default:
      return undefined;
  }
}

export function normalizeOrbShaderState(values = {}, fallback = {}) {
  const source = values && typeof values === "object" ? values : {};
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const out = {};
  ORB_SHADER_STATE_KEYS.forEach((key) => {
    const value = readShaderValue(source, key);
    if (value == null && base[key] == null) return;
    out[key] = normalizeKeyValue(key, value, base[key]);
  });
  return Object.freeze(out);
}

export function buildOrbShaderBaseState(config = ORB_3D_VISUAL_DEFAULTS) {
  const source = config && typeof config === "object" ? config : ORB_3D_VISUAL_DEFAULTS;
  return normalizeOrbShaderState({
    shellLuminanceBoost: source.shellLuminanceBoost,
    shellCenterAlpha: source.shellCenterAlpha,
    goldMix: source.goldMix,
    pointLightIntensity: source.lightIntensity,
    pointLightDistanceBO: source.lightDistanceBO,
    shadowSpotIntensity: source.shadowSpotIntensity,
    shadowSpotDistanceBO: source.shadowSpotDistanceBO,
  }, {
    shellLuminanceBoost: ORB_3D_VISUAL_DEFAULTS.shellLuminanceBoost,
    shellCenterAlpha: ORB_3D_VISUAL_DEFAULTS.shellCenterAlpha,
    goldMix: ORB_3D_VISUAL_DEFAULTS.goldMix,
    pointLightIntensity: ORB_3D_VISUAL_DEFAULTS.lightIntensity,
    pointLightDistanceBO: ORB_3D_VISUAL_DEFAULTS.lightDistanceBO,
    shadowSpotIntensity: ORB_3D_VISUAL_DEFAULTS.shadowSpotIntensity,
    shadowSpotDistanceBO: ORB_3D_VISUAL_DEFAULTS.shadowSpotDistanceBO,
  });
}

export function coerceOrbShaderLayerValues(values = {}, fallback = {}) {
  return normalizeOrbShaderState(values, fallback);
}
