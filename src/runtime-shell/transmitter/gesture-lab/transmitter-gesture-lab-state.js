export function createTransmitterGestureLabState({ rootStorage = localStorage } = {}) {
  const GESTURE_BANK_KEY = "orbis_gesture_bank_v1";
  const GRAVITY_LOCK_KEY = "orbis_gravity_lock_v1";
  const CALIB_BASIS_KEY = "orbis_calib_basis_v1";

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function vNorm(v) {
    const magnitude = Math.hypot(v.x, v.y, v.z);
    if (!(magnitude > 1e-6)) return { x: 0, y: 0, z: 0, mag: 0 };
    return { x: v.x / magnitude, y: v.y / magnitude, z: v.z / magnitude, mag: magnitude };
  }

  const gestureBank = {
    templates: {},
    mastery: 0.35,
  };

  const lab = {
    open: false,
    selectedLabel: "U",
    recording: false,
    recordSamples: [],
    recordStartedAtMs: 0,
    lastCandidate: null,
    lastQuality: 0,
    locking: false,
    lockBuf: [],
    testMode: false,
    lastMatch: null,
  };

  const calibration = {
    gravityLock: null,
    calibBasis: null,
    calibR: null,
    calibAlpha0: null,
    calib: {
      active: false,
      startMs: 0,
      samples: [],
      ackPending: false,
      pendingReq: false,
    },
  };

  function loadCalibBasis() {
    try {
      const raw = rootStorage.getItem(CALIB_BASIS_KEY);
      if (!raw) return;
      const json = JSON.parse(raw);
      if (json && json.up && json.right && json.forward) {
        const up = vNorm(json.up);
        const right = vNorm(json.right);
        const forward = vNorm(json.forward);
        if (up.mag > 0.5 && right.mag > 0.5 && forward.mag > 0.5) {
          calibration.calibBasis = {
            up: { x: up.x, y: up.y, z: up.z },
            right: { x: right.x, y: right.y, z: right.z },
            forward: { x: forward.x, y: forward.y, z: forward.z },
          };
        }
      }
      if (json && json.r && Array.isArray(json.r) && json.r.length === 3) {
        calibration.calibR = json.r;
      }
      if (json && typeof json.alpha0 === "number") {
        calibration.calibAlpha0 = json.alpha0;
      }
    } catch (_) {}
  }

  function saveCalibBasis() {
    if (!calibration.calibBasis) return;
    try {
      rootStorage.setItem(CALIB_BASIS_KEY, JSON.stringify({
        up: calibration.calibBasis.up,
        right: calibration.calibBasis.right,
        forward: calibration.calibBasis.forward,
        r: calibration.calibR,
        alpha0: calibration.calibAlpha0,
      }));
    } catch (_) {}
  }

  function loadGestureBank() {
    try {
      const raw = rootStorage.getItem(GESTURE_BANK_KEY);
      if (!raw) return;
      const json = JSON.parse(raw);
      if (json && typeof json === "object") {
        if (json.templates && typeof json.templates === "object") {
          gestureBank.templates = json.templates;
        }
        if (typeof json.mastery === "number") {
          gestureBank.mastery = clamp01(json.mastery);
        }
      }
    } catch (_) {}
  }

  function saveGestureBank() {
    try {
      rootStorage.setItem(GESTURE_BANK_KEY, JSON.stringify({
        templates: gestureBank.templates,
        mastery: gestureBank.mastery,
      }));
    } catch (_) {}
  }

  function loadGravityLock() {
    try {
      const raw = rootStorage.getItem(GRAVITY_LOCK_KEY);
      if (!raw) return;
      const json = JSON.parse(raw);
      if (json && isFinite(json.x) && isFinite(json.y) && isFinite(json.z)) {
        const gravity = vNorm({ x: json.x, y: json.y, z: json.z });
        if (gravity.mag > 0.5) {
          calibration.gravityLock = { x: gravity.x, y: gravity.y, z: gravity.z };
        }
      }
    } catch (_) {}
  }

  function saveGravityLock() {
    if (!calibration.gravityLock) return;
    try {
      rootStorage.setItem(GRAVITY_LOCK_KEY, JSON.stringify(calibration.gravityLock));
    } catch (_) {}
  }

  function clearGestureBank() {
    gestureBank.templates = {};
    saveGestureBank();
    calibration.gravityLock = null;
    try {
      rootStorage.removeItem(GRAVITY_LOCK_KEY);
    } catch (_) {}
  }

  return {
    gestureBank,
    lab,
    calibration,
    loadCalibBasis,
    saveCalibBasis,
    loadGestureBank,
    saveGestureBank,
    loadGravityLock,
    saveGravityLock,
    clearGestureBank,
  };
}
