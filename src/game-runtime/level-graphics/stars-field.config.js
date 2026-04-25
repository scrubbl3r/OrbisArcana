export const STARS_FIELD_CONFIG = Object.freeze({
  targetCellSizeW: 140,
  minRegionAreaW2: 64000,
  primaryDensityThreshold: 0.22,
  secondaryDensityThreshold: 0.58,
  jitterRatio: 0.42,
  maxJitterW: 90,
  seedSalt: "stars-field-v1",
  depthBands: Object.freeze([
    Object.freeze({
      id: "far",
      weight: 0.56,
      radiusRangePx: Object.freeze([1.2, 2.1]),
      opacityRange: Object.freeze([0.38, 0.64]),
      palette: Object.freeze(["#c6dcff", "#bff8ee", "#ffe3a8", "#d9c9ff", "#ffd4ea"]),
    }),
    Object.freeze({
      id: "mid",
      weight: 0.31,
      radiusRangePx: Object.freeze([1.9, 3.0]),
      opacityRange: Object.freeze([0.58, 0.86]),
      palette: Object.freeze(["#f8fbff", "#dffbff", "#fff0c8", "#e8d9ff", "#ffdcef"]),
    }),
    Object.freeze({
      id: "near",
      weight: 0.13,
      radiusRangePx: Object.freeze([2.5, 3.9]),
      opacityRange: Object.freeze([0.80, 1.00]),
      palette: Object.freeze(["#ffffff", "#eefdff", "#fff6d8", "#efe3ff", "#ffe3f4"]),
    }),
  ]),
});
