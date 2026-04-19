export const GAME_THEME_DEFAULT = Object.freeze({
  ui: {
    accentRgb: Object.freeze({ r: 230, g: 230, b: 230 }),
    panelBorderAlpha: 0.18,
    backgroundRgb: Object.freeze({ r: 5, g: 5, b: 6 }),
    panelRgb: Object.freeze({ r: 10, g: 10, b: 12 }),
    styleProfile: Object.freeze({
      textRgb: Object.freeze({ r: 183, g: 183, b: 188 }),
      textStrongRgb: Object.freeze({ r: 238, g: 238, b: 242 }),
      textMutedRgb: Object.freeze({ r: 122, g: 122, b: 128 }),
      frameRgb: Object.freeze({ r: 82, g: 82, b: 88 }),
      frameStrongRgb: Object.freeze({ r: 118, g: 118, b: 126 }),
      surfaceRgb: Object.freeze({ r: 10, g: 10, b: 12 }),
      surfaceRaisedRgb: Object.freeze({ r: 16, g: 16, b: 20 }),
      emphasisRgb: Object.freeze({ r: 230, g: 230, b: 230 }),
    }),
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
  shockwave: {
    color: Object.freeze({ r: 255, g: 255, b: 255, a: 0.65 }),
  },
});
