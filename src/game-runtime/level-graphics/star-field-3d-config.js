export const STAR_FIELD_3D_CONFIG = Object.freeze({
  kind: "star_field",
  depthBands: Object.freeze({
    far: Object.freeze({
      minZBO: 18,
      maxZBO: 28,
      sizeScale: 0.9,
      opacityScale: 0.46,
    }),
    medium: Object.freeze({
      minZBO: 10,
      maxZBO: 18,
      sizeScale: 1.1,
      opacityScale: 0.58,
    }),
    close: Object.freeze({
      minZBO: 5,
      maxZBO: 10,
      sizeScale: 1.35,
      opacityScale: 0.72,
    }),
  }),
  defaultDepthBand: Object.freeze({
    minZBO: 8,
    maxZBO: 20,
    sizeScale: 1.1,
    opacityScale: 0.58,
  }),
  sizeBucketsPx: Object.freeze([1.0, 1.35, 1.8, 2.4, 3.2, 4.2, 5.6]),
  haloSizeMultiplier: 2.4,
  haloOpacityScale: 0.14,
});
