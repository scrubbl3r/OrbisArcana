function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function createCameraInputSteering({
  smoothingAlpha = 0.25,
} = {}) {
  const alpha = clamp01(smoothingAlpha) || 0.25;
  let filteredX01 = 0.5;

  function reset() {
    filteredX01 = 0.5;
  }

  function processObservation(observation = {}) {
    const kind = String(observation.kind || "none");
    if (kind !== "hand") {
      if (kind === "wrong_hand") {
        return {
          state: "wrong_hand",
          trackingState: "wrong_hand",
          handPresent: false,
          handedness: String(observation.handedness || ""),
          handednessScore: Number(observation.handednessScore) || 0,
          landmarksCount: Number(observation.landmarksCount) || 0,
          confidence: Number(observation.handednessScore) || 0,
          rawX01: filteredX01,
          filteredX01,
          centeredX01: (filteredX01 - 0.5) * 2,
          lastSeenAtMs: Number(observation.observedAtMs) || 0,
        };
      }
      return {
        state: kind === "missing" ? "no_hand" : "idle",
        trackingState: kind === "missing" ? "no_hand" : "idle",
        handPresent: false,
        handedness: null,
        handednessScore: 0,
        landmarksCount: 0,
        confidence: 0,
        rawX01: filteredX01,
        filteredX01,
        centeredX01: (filteredX01 - 0.5) * 2,
        lastSeenAtMs: Number(observation.observedAtMs) || 0,
      };
    }

    const rawX01 = clamp01(observation.x01);
    filteredX01 += (rawX01 - filteredX01) * alpha;
    const handednessScore = clamp01(observation.handednessScore);
    return {
      state: handednessScore >= 0.55 ? "tracking" : "unstable",
      trackingState: handednessScore >= 0.55 ? "tracking" : "unstable",
      handPresent: true,
      handedness: String(observation.handedness || ""),
      handednessScore,
      landmarksCount: Number(observation.landmarksCount) || 0,
      confidence: handednessScore,
      rawX01,
      filteredX01,
      centeredX01: (filteredX01 - 0.5) * 2,
      lastSeenAtMs: Number(observation.observedAtMs) || 0,
    };
  }

  return {
    processObservation,
    reset,
  };
}
