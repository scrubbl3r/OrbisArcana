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
    steeringEaseFactor: clamp(Number(config.steeringEaseFactor == null ? 0.18 : config.steeringEaseFactor), 0.01, 1),
    maxIntent01: Math.max(0.01, Number(config.maxIntent01) || 1),
    maxSpeedPxPerSec: Math.max(1, Number(config.maxSpeedPxPerSec) || 780),
    maxAccelPxPerSec2: Math.max(1, Number(config.maxAccelPxPerSec2) || 300),
    decelPxPerSec2: Math.max(1, Number(config.decelPxPerSec2) || 5200),
    turnBrakePxPerSec2: Math.max(1, Number(config.turnBrakePxPerSec2) || 6800),
    inactiveDecelPxPerSec2: Math.max(1, Number(config.inactiveDecelPxPerSec2) || 7000),
  };

  const steeringState = {
    active: false,
    reason: "idle",
    confidence: 0,
    centeredX01: 0,
    intentX: 0,
    targetVX: 0,
    accelX: 0,
    accelIntentX: 0,
    maxSpeedPxPerSec: cfg.maxSpeedPxPerSec,
    turnBrakePxPerSec2: cfg.turnBrakePxPerSec2,
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
    return clampSigned(centered, cfg.maxIntent01);
  }

  function deriveAccelMagnitude(intentMagnitude01) {
    const t = clamp01(intentMagnitude01);
    return Math.max(0, cfg.maxAccelPxPerSec2 * t);
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
    const easedIntentX = steeringState.intentX + ((rawIntentX - steeringState.intentX) * cfg.steeringEaseFactor);
    const intentX = Math.abs(easedIntentX) <= cfg.centerEpsilon01 ? 0 : clampSigned(easedIntentX, cfg.maxIntent01);
    const accelMagnitude = active ? deriveAccelMagnitude(Math.abs(intentX)) : 0;
    steeringState.active = active;
    steeringState.reason = reason;
    steeringState.confidence = confidence;
    steeringState.centeredX01 = centeredX01;
    steeringState.rawIntentX = rawIntentX;
    steeringState.intentX = intentX;
    steeringState.targetVX = intentX * cfg.maxSpeedPxPerSec;
    steeringState.accelX = active
      ? (intentX !== 0 ? accelMagnitude : cfg.decelPxPerSec2)
      : cfg.inactiveDecelPxPerSec2;
    steeringState.accelIntentX = intentX;
    steeringState.maxSpeedPxPerSec = cfg.maxSpeedPxPerSec;
    steeringState.turnBrakePxPerSec2 = cfg.turnBrakePxPerSec2;
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
      accelX: Number(steeringState.accelX) || 0,
      accelIntentX: Number(steeringState.accelIntentX) || 0,
      maxSpeedPxPerSec: Number(steeringState.maxSpeedPxPerSec) || 0,
      turnBrakePxPerSec2: Number(steeringState.turnBrakePxPerSec2) || 0,
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
