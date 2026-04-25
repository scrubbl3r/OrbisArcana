export const STARS_FIELD_CONFIG = Object.freeze({
  targetCellSizeW: 420,
  minRegionAreaW2: 64000,
  primaryDensityThreshold: 0.48,
  secondaryDensityThreshold: 0.84,
  jitterRatio: 0.42,
  maxJitterW: 140,
  seedSalt: "stars-field-v1",
  depthBands: Object.freeze([
    Object.freeze({
      id: "far",
      weight: 0.56,
      radiusRangePx: Object.freeze([1.0, 1.7]),
      opacityRange: Object.freeze([0.16, 0.34]),
      palette: Object.freeze(["#cde4ff", "#d9fff5", "#ffe7bf"]),
    }),
    Object.freeze({
      id: "mid",
      weight: 0.31,
      radiusRangePx: Object.freeze([1.4, 2.3]),
      opacityRange: Object.freeze([0.28, 0.52]),
      palette: Object.freeze(["#f4f8ff", "#d8fbff", "#ffe6c9"]),
    }),
    Object.freeze({
      id: "near",
      weight: 0.13,
      radiusRangePx: Object.freeze([1.8, 3.0]),
      opacityRange: Object.freeze([0.44, 0.78]),
      palette: Object.freeze(["#ffffff", "#e7fcff", "#ffeed8"]),
    }),
  ]),
});

