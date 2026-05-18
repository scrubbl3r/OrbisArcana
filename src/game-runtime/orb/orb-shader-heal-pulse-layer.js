import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "./orb-lifecycle-3d-default.js?v=20260517g";
import { HEAL_PRESET_DEFAULT } from "../../vfx/presets/heal-default.js?v=20260517b";
import { resolveOrbLifecycle3dShaderLayer } from "./orb-shader-lifecycle-layer.js?v=20260517d";

const HEAL_PULSE_LAYER_ID = "healPulse";

function clampNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  const resolved = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, resolved));
}

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

function easeInOutQuad(t) {
  const x = clampNumber(t, 0, 1, 0);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function resolveEase(name = "easeInOutQuad") {
  const key = String(name || "").trim().toLowerCase();
  if (key === "linear") return (t) => clampNumber(t, 0, 1, 0);
  return easeInOutQuad;
}

function boosted(value, pct, min, max) {
  const base = Number(value);
  const safe = Number.isFinite(base) ? base : 0;
  const boostPct = Math.max(0, Number(pct) || 0);
  return clampNumber(safe * (1 + boostPct / 100), min, max, safe);
}

function resolveLifecycleValues(health, maxHealth, lifecycleConfig, orbConfig) {
  const layer = resolveOrbLifecycle3dShaderLayer({
    health,
    maxHealth,
    lifecycleConfig,
    orbConfig,
  });
  return layer && layer.values ? layer.values : {};
}

export function resolveOrbHealPulseShaderLayer({
  healthBefore = 0,
  healthAfter = 0,
  maxHealth = 1000,
  progress = 0,
  healConfig = HEAL_PRESET_DEFAULT,
  lifecycleConfig = ORB_LIFECYCLE_3D_DEFAULTS,
  orbConfig = ORB_3D_VISUAL_DEFAULTS,
} = {}) {
  const hpMax = Math.max(1, Number(maxHealth) || 1000);
  const before = resolveLifecycleValues(healthBefore, hpMax, lifecycleConfig, orbConfig);
  const after = resolveLifecycleValues(healthAfter, hpMax, lifecycleConfig, orbConfig);
  const ease = resolveEase(healConfig && healConfig.shaderPulseEasing);
  const t = clampNumber(progress, 0, 1, 0);
  const rise = t <= 0.5;
  const segmentT = rise ? ease(t * 2) : ease((t - 0.5) * 2);
  const peak = {
    shellLuminanceBoost: boosted(after.shellLuminanceBoost, healConfig.shaderPulseLuminanceBoostPct, 0, 12),
    shellCenterAlpha: boosted(after.shellCenterAlpha, healConfig.shaderPulseCenterAlphaPct, 0, 1),
    pointLightIntensity: boosted(after.pointLightIntensity, healConfig.shaderPulsePointLightIntensityPct, 0, 10000),
    pointLightDistanceBO: boosted(after.pointLightDistanceBO, healConfig.shaderPulsePointLightDistancePct, 0, 1000),
    goldMix: boosted(after.goldMix, healConfig.shaderPulseGoldMixPct, 0, 2),
  };
  const from = rise ? before : peak;
  const to = rise ? peak : after;
  return Object.freeze({
    id: HEAL_PULSE_LAYER_ID,
    healthBefore: clampNumber(healthBefore, 0, hpMax, 0),
    healthAfter: clampNumber(healthAfter, 0, hpMax, 0),
    maxHealth: hpMax,
    progress: t,
    values: Object.freeze({
      shellLuminanceBoost: lerp(from.shellLuminanceBoost, to.shellLuminanceBoost, segmentT),
      shellCenterAlpha: lerp(from.shellCenterAlpha, to.shellCenterAlpha, segmentT),
      pointLightIntensity: lerp(from.pointLightIntensity, to.pointLightIntensity, segmentT),
      pointLightDistanceBO: lerp(from.pointLightDistanceBO, to.pointLightDistanceBO, segmentT),
      goldMix: lerp(from.goldMix, to.goldMix, segmentT),
    }),
  });
}

export function getOrbHealPulseLayerId() {
  return HEAL_PULSE_LAYER_ID;
}
