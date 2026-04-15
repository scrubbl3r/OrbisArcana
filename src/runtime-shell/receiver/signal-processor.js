(function(global){
  function clamp01(x){
    x = Number(x);
    return Math.max(0, Math.min(1, isFinite(x) ? x : 0));
  }

  function clamp(v, lo, hi){
    return Math.max(lo, Math.min(hi, v));
  }

  function computeLift01(groove01, smooth01, speed01){
    const g = clamp01(groove01);
    const s = clamp01(smooth01);
    const p = clamp01(speed01);
    return clamp01(Math.pow(Math.max(0, g * s * p), 1 / 3));
  }

  function pick01NewOrOld(packet, newKey, oldKey){
    if (packet && packet[newKey] != null) {
      const n = Number(packet[newKey]);
      return isFinite(n) ? n : 0;
    }

    const n = Number(packet && packet[oldKey]);
    if (!isFinite(n)) return 0;
    return (n > 1.5) ? (n / 100) : n;
  }

  function pickVec3(packet, key){
    const src = packet && packet[key];
    if (Array.isArray(src) && src.length >= 3) {
      return [
        Number(src[0]) || 0,
        Number(src[1]) || 0,
        Number(src[2]) || 0,
      ];
    }

    if (src && typeof src === "object") {
      return [
        Number(src.x) || 0,
        Number(src.y) || 0,
        Number(src.z) || 0,
      ];
    }

    return null;
  }

  function pickDirVector(packet){
    const src =
      (packet && (packet.dir != null ? packet.dir :
        packet.a != null ? packet.a :
        packet.omega != null ? packet.omega :
        packet.r != null ? packet.r :
        null));

    let x = 0, y = 0, z = 0;
    if (Array.isArray(src) && src.length >= 3){
      x = Number(src[0]); y = Number(src[1]); z = Number(src[2]);
    } else if (src && typeof src === "object"){
      x = Number(src.x); y = Number(src.y); z = Number(src.z);
    } else {
      x = Number(packet && (packet.dirX != null ? packet.dirX : packet.omegaX));
      y = Number(packet && (packet.dirY != null ? packet.dirY : packet.omegaY));
      z = Number(packet && (packet.dirZ != null ? packet.dirZ : packet.omegaZ));
    }

    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return null;
    const mag = Math.hypot(x, y, z);
    if (!(mag > 1e-6)) return null;
    return { x: x / mag, y: y / mag, z: z / mag, mag };
  }

  function dirToYawTiltDeg(v){
    const yaw = Math.atan2(v.y, v.x) * 180 / Math.PI;
    const tilt = Math.asin(clamp(v.z, -1, 1)) * 180 / Math.PI;
    return { yaw, tilt };
  }

  function lerp(a, b, t){
    return Number(a) + (Number(b) - Number(a)) * Number(t);
  }

  function vNorm3(x, y, z){
    const mag = Math.hypot(x, y, z);
    if (!(mag > 1e-6)) return { x: 0, y: 0, z: 0, mag: 0 };
    return { x: x / mag, y: y / mag, z: z / mag, mag };
  }

  function deriveSpinStateFromVector(spinVector){
    if (!Array.isArray(spinVector) || spinVector.length < 3) {
      return null;
    }

    const rawX = Math.max(0, Number(spinVector[0]) || 0);
    const rawY = Math.max(0, Number(spinVector[1]) || 0);
    const rawZ = Math.max(0, Number(spinVector[2]) || 0);
    const total = rawX + rawY + rawZ;
    if (!(total > 1e-6)) return null;

    const x = rawX / total;
    const y = rawY / total;
    const z = rawZ / total;
    const ranked = [
      { label: "x", magnitude: x },
      { label: "y", magnitude: y },
      { label: "z", magnitude: z },
    ].sort((left, right) => right.magnitude - left.magnitude);
    const top = ranked[0];
    const second = ranked[1] || { magnitude: 0 };

    return {
      vector: [x, y, z],
      dominance: top.magnitude,
      gap: top.magnitude - second.magnitude,
      label: top.label,
      direction: null,
    };
  }

  const SPIN_AXIS_WINDOW_MS = 1500;
  const SPIN_DIRECTION_WINDOW_MS = 550;
  const SPIN_DIRECTION_ACQUIRE_BIAS = 0.16;
  const SPIN_DIRECTION_HOLD_BIAS = 0.08;
  const SPIN_DIRECTION_REVERSE_BIAS = 0.22;
  const SPIN_DIRECTION_ACQUIRE_TURN_RAD = 0.7;
  const SPIN_DIRECTION_HOLD_TURN_RAD = 0.35;

  function projectSpinSampleToAxisPlane(axisLabel, sample){
    const axis = String(axisLabel || "").trim().toLowerCase();
    if (!sample || typeof sample !== "object") return null;
    if (axis === "x") return { a: Number(sample.y) || 0, b: Number(sample.z) || 0 };
    if (axis === "y") return { a: Number(sample.z) || 0, b: Number(sample.x) || 0 };
    if (axis === "z") return { a: Number(sample.x) || 0, b: Number(sample.y) || 0 };
    return null;
  }

  function resolveSpinDirectionForAxis(axisLabel, history, runtime){
    const axis = String(axisLabel || "").trim().toLowerCase();
    if (!axis || !Array.isArray(history) || !history.length) {
      if (runtime) {
        runtime.directionAxis = null;
        runtime.direction = null;
        runtime.directionBias = 0;
        runtime.directionTurn = 0;
      }
      return null;
    }

    let signedTurn = 0;
    let absoluteTurn = 0;
    let previous = null;
    for (const sample of history) {
      const projected = projectSpinSampleToAxisPlane(axis, sample);
      if (!projected) continue;
      const mag = Math.hypot(projected.a, projected.b);
      if (!(mag > 1e-4)) continue;
      const current = { a: projected.a / mag, b: projected.b / mag };
      if (previous) {
        const cross = previous.a * current.b - previous.b * current.a;
        const dot = clamp(previous.a * current.a + previous.b * current.b, -1, 1);
        const theta = Math.atan2(cross, dot);
        signedTurn += theta;
        absoluteTurn += Math.abs(theta);
      }
      previous = current;
    }

    if (!(absoluteTurn > 1e-6)) {
      if (runtime) {
        runtime.directionAxis = null;
        runtime.direction = null;
        runtime.directionBias = 0;
        runtime.directionTurn = 0;
      }
      return null;
    }

    const bias = signedTurn / absoluteTurn;
    const priorAxis = runtime ? String(runtime.directionAxis || "") : "";
    const priorDirection = runtime ? String(runtime.direction || "") : "";
    const sameAxis = priorAxis === axis;

    let nextDirection = null;
    if (sameAxis && priorDirection === "cw") {
      if (bias <= -SPIN_DIRECTION_REVERSE_BIAS && absoluteTurn >= SPIN_DIRECTION_ACQUIRE_TURN_RAD) nextDirection = "ccw";
      else if (bias >= -SPIN_DIRECTION_HOLD_BIAS && absoluteTurn >= SPIN_DIRECTION_HOLD_TURN_RAD) nextDirection = "cw";
    } else if (sameAxis && priorDirection === "ccw") {
      if (bias >= SPIN_DIRECTION_REVERSE_BIAS && absoluteTurn >= SPIN_DIRECTION_ACQUIRE_TURN_RAD) nextDirection = "cw";
      else if (bias <= SPIN_DIRECTION_HOLD_BIAS && absoluteTurn >= SPIN_DIRECTION_HOLD_TURN_RAD) nextDirection = "ccw";
    } else if (bias >= SPIN_DIRECTION_ACQUIRE_BIAS && absoluteTurn >= SPIN_DIRECTION_ACQUIRE_TURN_RAD) {
      nextDirection = "cw";
    } else if (bias <= -SPIN_DIRECTION_ACQUIRE_BIAS && absoluteTurn >= SPIN_DIRECTION_ACQUIRE_TURN_RAD) {
      nextDirection = "ccw";
    }

    if (runtime) {
      runtime.directionAxis = nextDirection ? axis : null;
      runtime.direction = nextDirection;
      runtime.directionBias = bias;
      runtime.directionTurn = absoluteTurn;
    }
    return nextDirection;
  }

  function deriveSpinState(rotationRate, receivedAtMs, spinRuntime){
    if (!Array.isArray(rotationRate) || rotationRate.length < 3) {
        if (spinRuntime) {
          spinRuntime.directionAxis = null;
          spinRuntime.direction = null;
          spinRuntime.directionBias = 0;
          spinRuntime.directionTurn = 0;
        }
        return {
          vector: null,
          dominance: 0,
          gap: 0,
          label: null,
        direction: null,
      };
    }

    const rx = Number(rotationRate[0]) || 0;
    const ry = Number(rotationRate[1]) || 0;
    const rz = Number(rotationRate[2]) || 0;

    const runtime = spinRuntime || { ox: 0, oy: 0, oz: 0, hist: [] };
    runtime.ox = lerp(runtime.ox, rx, 0.22);
    runtime.oy = lerp(runtime.oy, ry, 0.22);
    runtime.oz = lerp(runtime.oz, rz, 0.22);

    const unit = vNorm3(runtime.ox, runtime.oy, runtime.oz);
    if (!(unit.mag > 1e-6)) {
      runtime.directionAxis = null;
      runtime.direction = null;
      runtime.directionBias = 0;
      runtime.directionTurn = 0;
      return {
        vector: null,
        dominance: 0,
        gap: 0,
        label: null,
        direction: null,
      };
    }

    runtime.hist.push({ t: Number(receivedAtMs) || 0, x: unit.x, y: unit.y, z: unit.z });
    const cutoff = (Number(receivedAtMs) || 0) - SPIN_AXIS_WINDOW_MS;
    while (runtime.hist.length && runtime.hist[0].t < cutoff) runtime.hist.shift();

    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const sample of runtime.hist) {
      sx += Math.abs(sample.x);
      sy += Math.abs(sample.y);
      sz += Math.abs(sample.z);
    }

    const dominant = vNorm3(sx, sy, sz);
    if (!(dominant.mag > 1e-6)) {
      runtime.directionAxis = null;
      runtime.direction = null;
      runtime.directionBias = 0;
      runtime.directionTurn = 0;
      return {
        vector: null,
        axis: null,
        dominance: 0,
        gap: 0,
        label: null,
        direction: null,
      };
    }

    // Preserve current live axis semantics:
    // legacy shield mapping effectively resolves labels from [z, y, x].
    const mapped = [
      { label: "x", magnitude: dominant.z },
      { label: "y", magnitude: dominant.y },
      { label: "z", magnitude: dominant.x },
    ].sort((a, b) => b.magnitude - a.magnitude);

    const top = mapped[0];
    const second = mapped[1] || { magnitude: 0 };
    const vectorByLabel = {
      x: 0,
      y: 0,
      z: 0,
    };
    mapped.forEach((item) => {
      vectorByLabel[item.label] = item.magnitude;
    });

    const directionHistoryCutoff = (Number(receivedAtMs) || 0) - SPIN_DIRECTION_WINDOW_MS;
    const directionHistory = runtime.hist.filter((sample) => sample.t >= directionHistoryCutoff);
    const direction = resolveSpinDirectionForAxis(top.label, directionHistory, runtime);

    return {
      vector: [vectorByLabel.x, vectorByLabel.y, vectorByLabel.z],
      dominance: top.magnitude,
      gap: top.magnitude - second.magnitude,
      label: top.label,
      direction,
    };
  }

  function createSignalProcessor(options){
    const settings = {
      shakeLampThreshold: Number(options && options.shakeLampThreshold) || 1.45,
    };
    const spinRuntime = {
      ox: 0,
      oy: 0,
      oz: 0,
      hist: [],
      directionAxis: null,
      direction: null,
      directionBias: 0,
      directionTurn: 0,
    };

    function reset(){
      spinRuntime.ox = 0;
      spinRuntime.oy = 0;
      spinRuntime.oz = 0;
      spinRuntime.hist = [];
      spinRuntime.directionAxis = null;
      spinRuntime.direction = null;
      spinRuntime.directionBias = 0;
      spinRuntime.directionTurn = 0;
    }

    function processPacket(packet, nowMs, options){
      const receivedAtMs = Number(nowMs) || 0;
      const groove01 = clamp01(pick01NewOrOld(packet, "groove01", "groove"));
      const smooth01 = clamp01(pick01NewOrOld(packet, "smooth01", "smooth"));
      const speed01 = clamp01(pick01NewOrOld(packet, "speed01", "speed"));
      const dynamics01 = clamp01(pick01NewOrOld(packet, "dynamics01", "orbit01"));
      const energy01 = clamp01(pick01NewOrOld(packet, "energy01", "energy"));
      const shake01 = Math.max(0, Number(pick01NewOrOld(packet, "shake01", "shake")) || 0);
      const locked = !!(packet && packet.locked);
      const hz = (packet && isFinite(Number(packet.hz))) ? Number(packet.hz) : 0;
      const shakeHit = !!(packet && packet.shakeHit);
      const sd = (packet && typeof packet.sd === "string" && packet.sd.trim()) ? packet.sd.trim().toUpperCase() : null;
      const spinVector = pickVec3(packet, "spinVector");
      const accel = pickVec3(packet, "accel") || pickVec3(packet, "a");
      const rotationRate = pickVec3(packet, "rotationRate") || pickVec3(packet, "r");
      const vectorSpin = deriveSpinStateFromVector(spinVector);
      const derivedSpin = deriveSpinState(rotationRate, receivedAtMs, spinRuntime);
      const spin = vectorSpin
        ? {
            ...vectorSpin,
            direction: derivedSpin && derivedSpin.direction
              ? derivedSpin.direction
              : vectorSpin.direction,
          }
        : derivedSpin;
      const directionVector = pickDirVector(packet);
      const directionAngles = directionVector ? dirToYawTiltDeg(directionVector) : null;

      const suppressShake = !!(options && options.suppressShake);
      const shakeForUi = suppressShake ? 0 : shake01;
      const shakeMeter01 = (settings.shakeLampThreshold > 1e-6)
        ? clamp01(shakeForUi / settings.shakeLampThreshold)
        : 0;

      return {
        receivedAtMs,
        packet,
        motion: {
          energy01,
          groove01,
          dynamics01,
          smooth01,
          speed01,
          shake01,
          lift01: computeLift01(groove01, smooth01, speed01),
          locked,
          hz,
          shakeHit,
          shakeMeter01,
          shakeDisplayValue: shakeMeter01 * settings.shakeLampThreshold,
          accel,
          rotationRate,
        },
        spin,
        direction: {
          vector: directionVector,
          yawDeg: directionAngles ? (((directionAngles.yaw % 360) + 360) % 360) : null,
          tiltDeg: directionAngles ? directionAngles.tilt : null,
          code: sd,
        },
        debug: {
          spinVector: spin.vector,
          spinAxisDominance: spin.dominance,
          spinAxisGap: spin.gap,
          spinAxisLabel: spin.label,
          spinDirection: spin.direction,
          calibOK: (packet && packet.calibOK != null) ? Number(packet.calibOK) || 0 : null,
          omegaOK: (packet && packet.omegaOK != null) ? Number(packet.omegaOK) || 0 : null,
          tag: (packet && packet.dbgTag != null) ? String(packet.dbgTag) : null,
        },
      };
    }

    return {
      processPacket,
      reset,
    };
  }

  global.createSignalProcessor = createSignalProcessor;
})(window);
