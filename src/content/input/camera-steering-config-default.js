export const CAMERA_STEERING_CONFIG_DEFAULT = Object.freeze({
  preferredHand: "Left",
  confidenceMin: 0.55,
  centerEpsilon01: 0.003,
  maxIntent01: 1.0,
  maxSpeedPxPerSec: 780,
  accelCurveExponent: 2.0,
  maxAccelPxPerSec2: 255,
  decelPxPerSec2: 5200,
  turnBrakePxPerSec2: 6800,
  inactiveDecelPxPerSec2: 7000,
});
