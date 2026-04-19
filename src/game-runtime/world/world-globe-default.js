export const WORLD_GLOBE_VISUAL_DEFAULTS = Object.freeze({
  idle: Object.freeze({
    diameterRatio: 0.35,
    fillRgb: Object.freeze({
      r: 215,
      g: 215,
      b: 255,
    }),
    fillAlpha: 1.00,
    strokeRgb: Object.freeze({
      r: 255,
      g: 214,
      b: 64,
    }),
    strokeAlpha: 0.96,
    strokeWidthRatio: 0.000,
    driftRatio: 0.10,
    bobRatio: 0.07,
    bobHz: 0.65,
    pulseScale: 0.045,
    pulseHz: 0.90,
  }),
  collected: Object.freeze({
    diameterRatio: 0.17,
    fillRgb: Object.freeze({
      r: 255,
      g: 255,
      b: 255,
    }),
    fillAlpha: 0.42,
    strokeRgb: Object.freeze({
      r: 255,
      g: 255,
      b: 255,
    }),
    strokeAlpha: 0.96,
    strokeWidthRatio: 0.020,
  }),
  consumed: Object.freeze({
    diameterRatio: 0.10,
    fillRgb: Object.freeze({
      r: 255,
      g: 255,
      b: 255,
    }),
    fillAlpha: 1.00,
    strokeRgb: Object.freeze({
      r: 255,
      g: 255,
      b: 255,
    }),
    strokeAlpha: 0.96,
    strokeWidthRatio: 0.020,
  }),
});
