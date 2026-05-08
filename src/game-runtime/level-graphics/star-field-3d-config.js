export const STAR_FIELD_3D_CONFIG = Object.freeze({
  kind: "star_field",
  depthBands: Object.freeze({
    far: Object.freeze({
      minZBO: 18,
      maxZBO: 28,
      sizeScale: 2.2,
      opacityScale: 0.70,
    }),
    medium: Object.freeze({
      minZBO: 10,
      maxZBO: 18,
      sizeScale: 2.8,
      opacityScale: 0.86,
    }),
    close: Object.freeze({
      minZBO: 5,
      maxZBO: 10,
      sizeScale: 3.4,
      opacityScale: 1.0,
    }),
  }),
  defaultDepthBand: Object.freeze({
    minZBO: 8,
    maxZBO: 20,
    sizeScale: 2.8,
    opacityScale: 0.86,
  }),
  sizeBucketsPx: Object.freeze([2.5, 3.75, 5.25, 7.0, 9.0, 12.0, 16.0, 22.0, 30.0]),
  haloSizeMultiplier: 3.2,
  haloOpacityScale: 0.38,
});
