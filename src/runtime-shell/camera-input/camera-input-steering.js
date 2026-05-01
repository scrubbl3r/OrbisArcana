function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function createCameraInputSteering({
  smoothingAlpha = 1,
  holdMissingMs = 70,
  holdConfidenceFloor = 0.56,
} = {}) {
  const alpha = clamp01(smoothingAlpha) || 1;
  const holdMs = Math.max(0, Number(holdMissingMs) || 0);
  const holdFloor = clamp01(holdConfidenceFloor);
  let filteredX01 = 0.5;
  let lastHandAtMs = 0;
  let lastHandedness = "";
  let lastHandednessScore = 0;
  let lastLandmarksCount = 0;

  function reset() {
    filteredX01 = 0.5;
    lastHandAtMs = 0;
    lastHandedness = "";
    lastHandednessScore = 0;
    lastLandmarksCount = 0;
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
      const observedAtMs = Number(observation.observedAtMs) || 0;
      const holdAgeMs = lastHandAtMs && observedAtMs ? observedAtMs - lastHandAtMs : Infinity;
      if (holdMs > 0 && kind === "missing" && lastHandednessScore >= 0.55 && holdAgeMs >= 0 && holdAgeMs <= holdMs) {
        const holdProgress = holdMs > 0 ? Math.min(1, holdAgeMs / holdMs) : 1;
        const confidence = Math.max(holdFloor, lastHandednessScore * (1 - holdProgress * 0.35));
        return {
          state: "tracking",
          trackingState: "tracking_hold",
          handPresent: true,
          handedness: lastHandedness,
          handednessScore: lastHandednessScore,
          landmarksCount: lastLandmarksCount,
          confidence,
          rawX01: filteredX01,
          filteredX01,
          centeredX01: (filteredX01 - 0.5) * 2,
          lastSeenAtMs: lastHandAtMs,
          holdAgeMs,
          holdMissingMs: holdMs,
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
    const observedAtMs = Number(observation.observedAtMs) || 0;
    lastHandAtMs = observedAtMs;
    lastHandedness = String(observation.handedness || "");
    lastHandednessScore = handednessScore;
    lastLandmarksCount = Number(observation.landmarksCount) || 0;
    return {
      state: handednessScore >= 0.55 ? "tracking" : "unstable",
      trackingState: handednessScore >= 0.55 ? "tracking" : "unstable",
      handPresent: true,
      handedness: lastHandedness,
      handednessScore,
      landmarksCount: lastLandmarksCount,
      confidence: handednessScore,
      rawX01,
      filteredX01,
      centeredX01: (filteredX01 - 0.5) * 2,
      lastSeenAtMs: observedAtMs,
      holdAgeMs: 0,
      holdMissingMs: holdMs,
    };
  }

  return {
    processObservation,
    reset,
  };
}
