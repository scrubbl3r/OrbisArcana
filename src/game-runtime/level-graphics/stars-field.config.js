export const STARS_FIELD_CONFIG = Object.freeze({
  targetCellSizeW: 280,
  minRegionAreaW2: 64000,
  primaryDensityThreshold: 0.34,
  secondaryDensityThreshold: 0.76,
  jitterRatio: 0.42,
  maxJitterW: 140,
  seedSalt: "stars-field-v1",
  depthBands: Object.freeze([
    Object.freeze({
      id: "far",
      weight: 0.56,
      radiusRangePx: Object.freeze([1.2, 2.0]),
      opacityRange: Object.freeze([0.34, 0.58]),
      palette: Object.freeze(["#e0efff", "#e1fffa", "#fff0d4"]),
    }),
    Object.freeze({
      id: "mid",
      weight: 0.31,
      radiusRangePx: Object.freeze([1.8, 2.8]),
      opacityRange: Object.freeze([0.50, 0.78]),
      palette: Object.freeze(["#f8fbff", "#e8fdff", "#fff1de"]),
    }),
    Object.freeze({
      id: "near",
      weight: 0.13,
      radiusRangePx: Object.freeze([2.3, 3.6]),
      opacityRange: Object.freeze([0.72, 0.98]),
      palette: Object.freeze(["#ffffff", "#f2feff", "#fff6e8"]),
    }),
  ]),
});
