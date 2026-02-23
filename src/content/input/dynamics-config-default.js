export const INPUT_DYNAMICS_CONFIG_DEFAULT = Object.freeze({
  stability: Object.freeze({
    avgMs: 250,
    armMs: 220,
    onThreshold: 0.08,
    offThreshold: 0.10,
    speedMin01: 0.02,
  }),
  variability: Object.freeze({
    avgMs: 250,
    armMs: 220,
    onThreshold: 0.80,
    offThreshold: 0.78,
  }),
});
