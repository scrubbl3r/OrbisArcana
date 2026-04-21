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
    neutralZone01: clamp01(config.neutralZone01 == null ? 0.12 : config.neutralZone01),
    deadbandEnter01: clamp01(config.deadbandEnter01 == null ? 0.16 : config.deadbandEnter01),
    deadbandExit01: clamp01(config.deadbandExit01 == null ? 0.10 : config.deadbandExit01),
    directionSwitch01: clamp01(config.directionSwitch01 == null ? 0.18 : config.directionSwitch01),
    responseExponent: Math.max(0.1, Number(config.responseExponent) || 1.6),
    maxIntent01: Math.max(0.01, Number(config.maxIntent01) || 1),
    maxSpeedPxPerSec: Math.max(1, Number(config.maxSpeedPxPerSec) || 860),
    accelPxPerSec2: Math.max(1, Number(config.accelPxPerSec2) || 3200),
    decelPxPerSec2: Math.max(1, Number(config.decelPxPerSec2) || 5600),
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
    latchedDirection: 0,
  };

  function deriveIntentX(centeredX01) {
    const centered = clampSigned(centeredX01, 1);
    const magnitude = Math.abs(centered);
    const direction = Math.sign(centered);
    if (direction === 0 || magnitude <= cfg.neutralZone01) {
      steeringState.latchedDirection = 0;
      return 0;
    }

    const exitDeadband = Math.max(cfg.neutralZone01, Math.min(cfg.deadbandEnter01, cfg.deadbandExit01));
    if (
      steeringState.latchedDirection !== 0 &&
      direction !== steeringState.latchedDirection &&
      magnitude < cfg.directionSwitch01
    ) {
      return 0;
    }

    const activeDeadband = steeringState.latchedDirection === 0 ? cfg.deadbandEnter01 : exitDeadband;
    if (magnitude <= activeDeadband) {
      return 0;
    }

    const normalized = clamp01((magnitude - activeDeadband) / Math.max(1e-6, 1 - activeDeadband));
    const curved = Math.pow(normalized, cfg.responseExponent);
    steeringState.latchedDirection = direction;
    return clampSigned(direction * curved, cfg.maxIntent01);
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

    const intentX = active ? deriveIntentX(centeredX01) : 0;
    if (!active) {
      steeringState.latchedDirection = 0;
    }
    steeringState.active = active;
    steeringState.reason = reason;
    steeringState.confidence = confidence;
    steeringState.centeredX01 = centeredX01;
    steeringState.intentX = intentX;
    steeringState.targetVX = intentX * cfg.maxSpeedPxPerSec;
    steeringState.accelX = active
      ? (intentX !== 0 ? cfg.accelPxPerSec2 : cfg.decelPxPerSec2)
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
      intentX: Number(steeringState.intentX) || 0,
      targetVX: Number(steeringState.targetVX) || 0,
      accelX: Number(steeringState.accelX) || 0,
      accelIntentX: Number(steeringState.accelIntentX) || 0,
      maxSpeedPxPerSec: Number(steeringState.maxSpeedPxPerSec) || 0,
      turnBrakePxPerSec2: Number(steeringState.turnBrakePxPerSec2) || 0,
      handedness: String(steeringState.handedness || ""),
      trackingState: String(steeringState.trackingState || "idle"),
      updatedAtMs: Number(steeringState.updatedAtMs) || 0,
      latchedDirection: Number(steeringState.latchedDirection) || 0,
    };
  }

  return {
    updateFromCameraState,
    getState,
  };
}
