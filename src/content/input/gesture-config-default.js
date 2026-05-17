export const INPUT_GESTURE_CONFIG_DEFAULT = Object.freeze({
  shake: Object.freeze({
    cooldownMs: 2500,
    mode: 2,
    grooveGate: 0.20,
    liftGate: 0.15,
    lampThreshold: 1.40,
    directionRecentMs: 750,
    rearmThreshold: 0.10,
  }),
  flatSpin: Object.freeze({
    dominanceOn: 0.72,
    dominanceOff: 0.60,
    dominanceGapOn: 0.14,
    dominanceGapOff: 0.09,
    onHoldMs: 200,
    offHoldMs: 280,
    gateRefreshMs: 1100,
    minSpeed01: 0.02,
    abilityWindowMs: 1500,
    abilityTransitionMs: 0,
  }),
});
