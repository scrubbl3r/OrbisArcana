export const CAMERA_STEERING_CONFIG_DEFAULT = Object.freeze({
  preferredHand: "Left",
  confidenceMin: 0.55,
  centerEpsilon01: 0.002,
  directionSwitchHysteresis01: 0.08,
  maxIntent01: 1.0,
  maxSpeedPxPerSec: 780,
  maxAccelPxPerSec2: 300,
  decelPxPerSec2: 5200,
  turnBrakePxPerSec2: 6800,
  inactiveDecelPxPerSec2: 7000,
});
