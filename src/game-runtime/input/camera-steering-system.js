function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clampSigned(value, maxMagnitude = 1) {
  const max = Math.max(0, Number(maxMagnitude) || 0);
  return clamp(value, -max, max);
}

export function createCameraSteeringSystem({
  config = {},
} = {}) {
  const cfg = {
    preferredHand: String(config.preferredHand || "Left"),
    confidenceMin: clamp01(config.confidenceMin == null ? 0.55 : config.confidenceMin),
    centerEpsilon01: clamp01(config.centerEpsilon01 == null ? 0.002 : config.centerEpsilon01),
    velocityEaseFactor: clamp(Number(config.velocityEaseFactor == null ? 0.16 : config.velocityEaseFactor), 0.01, 1),
    maxIntent01: Math.max(0.01, Number(config.maxIntent01) || 1),
    maxSpeedPxPerSec: Math.max(1, Number(config.maxSpeedPxPerSec) || 300),
    rampWindow01: clamp(Number(config.rampWindow01 == null ? 0.5 : config.rampWindow01), 0.05, 1),
  };

  const steeringState = {
    active: false,
    reason: "idle",
    confidence: 0,
    centeredX01: 0,
    intentX: 0,
    targetVX: 0,
    maxSpeedPxPerSec: cfg.maxSpeedPxPerSec,
    velocityEaseFactor: cfg.velocityEaseFactor,
    handedness: "",
    trackingState: "idle",
    updatedAtMs: 0,
    rawIntentX: 0,
  };

  function deriveIntentX(centeredX01) {
    const centered = clampSigned(centeredX01, 1);
    const magnitude = Math.abs(centered);
    if (magnitude <= cfg.centerEpsilon01) {
      return 0;
    }
    const halfRampWindow = Math.max(0.025, cfg.rampWindow01 * 0.5);
    const normalized = clamp01(magnitude / halfRampWindow);
    return clampSigned(Math.sign(centered) * normalized, cfg.maxIntent01);
  }

  function updateFromCameraState(cameraState = null, atMs = Date.now()) {
    const tracking = cameraState && cameraState.tracking ? cameraState.tracking : {};
    const lifecycle = cameraState && cameraState.lifecycle ? cameraState.lifecycle : {};
    const trackingState = String(tracking.state || "idle");
    const handedness = String(tracking.handedness || "");
    const confidence = clamp01(tracking.confidence);
    const centeredX01 = clampSigned(tracking.centeredX01, 1);

    let reason = "idle";
    let active = false;
    if (lifecycle.permissionState === "denied") {
      reason = "camera_denied";
    } else if (trackingState === "wrong_hand") {
      reason = "wrong_hand";
    } else if (trackingState === "tracking" && confidence >= cfg.confidenceMin) {
      active = true;
      reason = "tracking";
    } else if (trackingState === "unstable") {
      reason = "unstable";
    } else if (trackingState === "no_hand") {
      reason = "no_hand";
    } else if (trackingState === "tracking") {
      reason = "low_confidence";
    } else if (lifecycle.streamState === "active") {
      reason = "searching";
    }

    const rawIntentX = active ? deriveIntentX(centeredX01) : 0;
    const intentX = rawIntentX;
    steeringState.active = active;
    steeringState.reason = reason;
    steeringState.confidence = confidence;
    steeringState.centeredX01 = centeredX01;
    steeringState.rawIntentX = rawIntentX;
    steeringState.intentX = intentX;
    steeringState.targetVX = intentX * cfg.maxSpeedPxPerSec;
    steeringState.maxSpeedPxPerSec = cfg.maxSpeedPxPerSec;
    steeringState.velocityEaseFactor = cfg.velocityEaseFactor;
    steeringState.handedness = handedness;
    steeringState.trackingState = trackingState;
    steeringState.updatedAtMs = Number(atMs) || Date.now();
    return getState();
  }

  function getState() {
    return {
      active: !!steeringState.active,
      reason: String(steeringState.reason || "idle"),
      confidence: Number(steeringState.confidence) || 0,
      centeredX01: Number(steeringState.centeredX01) || 0,
      rawIntentX: Number(steeringState.rawIntentX) || 0,
      intentX: Number(steeringState.intentX) || 0,
      targetVX: Number(steeringState.targetVX) || 0,
      maxSpeedPxPerSec: Number(steeringState.maxSpeedPxPerSec) || 0,
      velocityEaseFactor: Number(steeringState.velocityEaseFactor) || 0,
      handedness: String(steeringState.handedness || ""),
      trackingState: String(steeringState.trackingState || "idle"),
      updatedAtMs: Number(steeringState.updatedAtMs) || 0,
    };
  }

  return {
    updateFromCameraState,
    getState,
  };
}
