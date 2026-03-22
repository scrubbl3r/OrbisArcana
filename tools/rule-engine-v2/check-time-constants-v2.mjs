// Shared fixed/mutable timeline constants for deterministic regression scenarios.
// Values are offsets used only by tests; they do not represent wall-clock time.
export const CHECK_FIXED_TIMES_V2 = Object.freeze({
  immediateOwnership: 3000,
  flatSpinOutside: 4000,
  flatSpinInside: 4100,
  wakeAxisPrereq: 5000,
});

export const CHECK_MUTABLE_TIME_STARTS_V2 = Object.freeze({
  shakeDetonation: 1000,
  wakeLoad: 2000,
});
