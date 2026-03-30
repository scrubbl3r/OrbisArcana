export const GAME_THEME_DEFAULT = Object.freeze({
  ui: {
    accentRgb: Object.freeze({ r: 50, g: 255, b: 117 }),
    panelBorderAlpha: 0.18,
    backgroundRgb: Object.freeze({ r: 0, g: 0, b: 0 }),
  },
  axisColors: Object.freeze({
    x: Object.freeze({ r: 0, g: 100, b: 253 }),
    y: Object.freeze({ r: 253, g: 178, b: 0 }),
    z: Object.freeze({ r: 253, g: 241, b: 0 }),
  }),
  world: {
    energyBackground: Object.freeze({
      startRgb: Object.freeze({ r: 0, g: 0, b: 0 }),
      endRgb: Object.freeze({ r: 255, g: 42, b: 0 }),
    }),
  },
  orb: {
    diameterPx: 100,
    strokeWidthPx: 2,
    strokeDefaultRgb: Object.freeze({ r: 255, g: 255, b: 255 }),
    fillAlpha: 0.20,
  },
  shield: {
    diameterPx: 124,
    strokeWidthPx: 4,
    colorRgb: Object.freeze({ r: 120, g: 210, b: 255 }),
    alpha: 1.00,
    pulseMs: 80,
    pulseMin: 0.30,
    pulseMax: 1.00,
  },
  shockwave: {
    color: Object.freeze({ r: 255, g: 255, b: 255, a: 0.65 }),
    strokeWidthPx: 4,
  },
});
