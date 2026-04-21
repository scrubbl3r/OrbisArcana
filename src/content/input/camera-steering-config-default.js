export const CAMERA_STEERING_CONFIG_DEFAULT = Object.freeze({
  preferredHand: "Left",
  confidenceMin: 0.55,
  centerEpsilon01: 0.006,
  maxIntent01: 1.0,
  maxSpeedPxPerSec: 780,
  accelCurvePxPerSec2: Object.freeze([0, 3, 6, 12, 25, 50, 100, 200]),
  decelPxPerSec2: 5200,
  turnBrakePxPerSec2: 6800,
  inactiveDecelPxPerSec2: 7000,
});
