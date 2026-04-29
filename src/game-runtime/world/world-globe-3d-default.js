import { GLOBE_3D_VISUAL_DEFAULTS } from "./globe-3d-default.js?v=20260429a";
import { WORLD_GLOBE_VISUAL_DEFAULTS } from "./world-globe-default.js?v=20260418a";

export const WORLD_GLOBE_3D_VISUAL_DEFAULTS = Object.freeze({
  idle: Object.freeze({
    diameterRatio: WORLD_GLOBE_VISUAL_DEFAULTS.idle.diameterRatio,
    driftRatio: WORLD_GLOBE_VISUAL_DEFAULTS.idle.driftRatio,
    bobRatio: WORLD_GLOBE_VISUAL_DEFAULTS.idle.bobRatio,
    bobHz: WORLD_GLOBE_VISUAL_DEFAULTS.idle.bobHz,
    pulseScale: WORLD_GLOBE_VISUAL_DEFAULTS.idle.pulseScale,
    pulseHz: WORLD_GLOBE_VISUAL_DEFAULTS.idle.pulseHz,
  }),
  collected: Object.freeze({
    diameterRatio: WORLD_GLOBE_VISUAL_DEFAULTS.collected.diameterRatio,
  }),
  consumed: Object.freeze({
    diameterRatio: WORLD_GLOBE_VISUAL_DEFAULTS.consumed.diameterRatio,
  }),
  material: Object.freeze({
    shellBaseColor: GLOBE_3D_VISUAL_DEFAULTS.shellBaseColor,
    shellCyanColor: GLOBE_3D_VISUAL_DEFAULTS.shellCyanColor,
    shellVioletColor: GLOBE_3D_VISUAL_DEFAULTS.shellVioletColor,
    shellGoldColor: GLOBE_3D_VISUAL_DEFAULTS.shellGoldColor,
    shellFresnelPower: GLOBE_3D_VISUAL_DEFAULTS.shellFresnelPower,
    shellRimAlphaPower: GLOBE_3D_VISUAL_DEFAULTS.shellRimAlphaPower,
    shellCenterAlpha: GLOBE_3D_VISUAL_DEFAULTS.shellCenterAlpha,
    shellRimAlpha: GLOBE_3D_VISUAL_DEFAULTS.shellRimAlpha,
    shellPastelMix: GLOBE_3D_VISUAL_DEFAULTS.shellPastelMix,
    shellRimPastelMix: GLOBE_3D_VISUAL_DEFAULTS.shellRimPastelMix,
    shellLuminanceBoost: GLOBE_3D_VISUAL_DEFAULTS.shellLuminanceBoost,
    lightColor: GLOBE_3D_VISUAL_DEFAULTS.lightColor,
    lightIntensity: GLOBE_3D_VISUAL_DEFAULTS.lightIntensity,
    lightDistanceBO: GLOBE_3D_VISUAL_DEFAULTS.lightDistanceBO,
    lightDecay: GLOBE_3D_VISUAL_DEFAULTS.lightDecay,
    lightOffsetZBO: GLOBE_3D_VISUAL_DEFAULTS.lightOffsetZBO,
  }),
});
