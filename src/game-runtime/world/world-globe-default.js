export const WORLD_GLOBE_VISUAL_DEFAULTS = Object.freeze({
  idle: Object.freeze({
    diameterPx: 25,
    fillRgb: Object.freeze({
      r: 255,
      g: 225,
      b: 255,
    }),
    fillAlpha: 0.75,
    strokeRgb: Object.freeze({
      r: 255,
      g: 214,
      b: 64,
    }),
    strokeAlpha: 0.96,
    strokeWidthPx: 0.0,
    driftPx: 10,
    bobPx: 7,
    bobHz: 0.65,
    pulseScale: 0.045,
    pulseHz: 0.90,
  }),
  collected: Object.freeze({
    diameterPx: 14,
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
    strokeWidthPx: 2.0,
  }),
  consumed: Object.freeze({
    diameterPx: 11,
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
    strokeWidthPx: 2.0,
  }),
});
