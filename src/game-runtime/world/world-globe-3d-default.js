export const WORLD_GLOBE_3D_VISUAL_DEFAULTS = Object.freeze({
  idle: Object.freeze({
    diameterBO: 0.35,
    driftRangeBO: 0.10,
    bobRangeBO: 0.07,
    bobHz: 0.65,
    pulseScale: 0.045,
    pulseHz: 0.90,
  }),
  collected: Object.freeze({
    diameterBO: 0.06,
  }),
  consumed: Object.freeze({
    diameterBO: 0.05,
  }),
  material: Object.freeze({
    shellBaseColor: 0xfbfdff,
    shellCyanColor: 0x9af5ff,
    shellVioletColor: 0xd9c6ff,
    shellGoldColor: 0xffd86a,
    shellFresnelPower: 2.700,
    shellRimAlphaPower: 0.820,
    shellCenterAlpha: 0.0280,
    shellRimAlpha: 0.860,
    shellPastelMix: 0.720,
    shellRimPastelMix: 0.420,
    shellLuminanceBoost: 1.420,
    lightColor: 0xdff6ff,
    lightIntensity: 74.0,
    lightDistanceBO: 7.00,
    lightDecay: 1.45,
    lightOffsetZBO: 0.55,
  }),
});
