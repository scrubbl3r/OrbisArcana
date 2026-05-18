import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "./orb-lifecycle-3d-default.js?v=20260517f";

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

function resolvePctLerp(baseValue, minPct, maxPct, hpRatio, min = -Infinity, max = Infinity) {
  const base = Number(baseValue);
  const fallback = Number.isFinite(base) ? base : 0;
  const minValue = fallback * ((Number(minPct) || 0) / 100);
  const maxValue = fallback * ((Number(maxPct) || 0) / 100);
  return Math.max(min, Math.min(max, lerp(minValue, maxValue, hpRatio)));
}

export function resolveOrbLifecycle3dShaderLayer({
  health = 1000,
  maxHealth = 1000,
  lifecycleConfig = ORB_LIFECYCLE_3D_DEFAULTS,
  orbConfig = ORB_3D_VISUAL_DEFAULTS,
} = {}) {
  const resolvedMaxHealth = Math.max(1, Number(maxHealth) || 1000);
  const resolvedHealth = Math.max(0, Math.min(resolvedMaxHealth, Number(health) || 0));
  const hpRatio = Math.max(0, Math.min(1, resolvedHealth / resolvedMaxHealth));
  const lifecycle = lifecycleConfig && typeof lifecycleConfig === "object" ? lifecycleConfig : ORB_LIFECYCLE_3D_DEFAULTS;
  const orb = orbConfig && typeof orbConfig === "object" ? orbConfig : ORB_3D_VISUAL_DEFAULTS;
  const spotIntensity = resolvePctLerp(orb.shadowSpotIntensity, lifecycle.spotIntensityMinPct, lifecycle.spotIntensityMaxPct, hpRatio, 0, 10000);
  const spotDistanceBO = resolvePctLerp(orb.shadowSpotDistanceBO, lifecycle.spotDistanceMinPct, lifecycle.spotDistanceMaxPct, hpRatio, 0, 1000);
  const pointLightIntensity = resolvePctLerp(orb.lightIntensity, lifecycle.spotIntensityMinPct, lifecycle.spotIntensityMaxPct, hpRatio, 0, 10000);
  const pointLightDistanceBO = resolvePctLerp(orb.lightDistanceBO, lifecycle.spotDistanceMinPct, lifecycle.spotDistanceMaxPct, hpRatio, 0, 1000);
  return Object.freeze({
    id: "lifecycleDamage",
    health: resolvedHealth,
    maxHealth: resolvedMaxHealth,
    hpRatio,
    values: Object.freeze({
      shellLuminanceBoost: resolvePctLerp(orb.shellLuminanceBoost, lifecycle.shellLuminanceBoostMinPct, lifecycle.shellLuminanceBoostMaxPct, hpRatio, 0, 12),
      shellCenterAlpha: resolvePctLerp(orb.shellCenterAlpha, lifecycle.shellCenterAlphaMinPct, lifecycle.shellCenterAlphaMaxPct, hpRatio, 0, 1),
      pointLightIntensity,
      pointLightDistanceBO,
      shadowSpotIntensity: spotIntensity,
      shadowSpotDistanceBO: spotDistanceBO,
      goldMix: resolvePctLerp(orb.goldMix, lifecycle.goldMixMinPct, lifecycle.goldMixMaxPct, hpRatio, 0, 2),
    }),
  });
}
