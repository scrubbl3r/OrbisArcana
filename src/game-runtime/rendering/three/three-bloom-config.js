export const ORB_BLOOM_CONFIG = Object.freeze({
  enabled: true,
  strength: 0.58,
  radius: 0.38,
  threshold: 0.16,
});

export const STAGE_BLOOM_CONFIG = Object.freeze({
  ...ORB_BLOOM_CONFIG,
  pixelRatio: 0.5,
  strength: 0.58,
  radius: 0.38,
  threshold: 0.16,
  mix: 1,
});
