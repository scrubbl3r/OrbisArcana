export const CAMERA_STEERING_CONFIG_DEFAULT = Object.freeze({
  preferredHand: "Left",
  confidenceMin: 0.55,
  deadbandEnter01: 0.08,
  deadbandExit01: 0.04,
  directionSwitch01: 0.11,
  responseExponent: 0.78,
  maxIntent01: 1.0,
  maxSpeedPxPerSec: 1120,
  accelPxPerSec2: 5600,
  decelPxPerSec2: 4600,
  turnBrakePxPerSec2: 7600,
  inactiveDecelPxPerSec2: 6200,
});
