export const WORLD_GLOBE_3D_VISUAL_DEFAULTS = Object.freeze({
  idle: Object.freeze({
    diameterBO: 0.25,
    driftRangeBO: 0.02,
    bobRangeBO: 0.07,
    bobHz: 0.25,
    pulseScale: 0.045,
    pulseHz: 0.70,
  }),
  collected: Object.freeze({
    diameterBO: 0.10,
  }),
  consumed: Object.freeze({
    diameterBO: 0.08,
  }),
  material: Object.freeze({
    shellBaseColor: 0xfbf000,
    shellCyanColor: 0x9af5ff,
    shellVioletColor: 0xd9c6ff,
    shellGoldColor: 0xffd86a,
    shellFresnelPower: 1.700,
    shellRimAlphaPower: 0.820,
    shellCenterAlpha: 0.0500,
    shellRimAlpha: 0.860,
    shellPastelMix: 0.720,
    shellRimPastelMix: 0.420,
    shellLuminanceBoost: 1.420,
  }),
});
