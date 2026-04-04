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

  function deriveSpinStateFromVector(spinVector, spinDirection){
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
      direction: (typeof spinDirection === "string" && spinDirection)
        ? String(spinDirection).toLowerCase()
        : null,
    };
  }

  function deriveSpinState(rotationRate, receivedAtMs, spinRuntime){
    if (!Array.isArray(rotationRate) || rotationRate.length < 3) {
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
      return {
        vector: null,
        dominance: 0,
        gap: 0,
        label: null,
        direction: null,
      };
    }

    runtime.hist.push({ t: Number(receivedAtMs) || 0, x: unit.x, y: unit.y, z: unit.z });
    const cutoff = (Number(receivedAtMs) || 0) - 1500;
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
      { label: "x", magnitude: dominant.z, signed: unit.z },
      { label: "y", magnitude: dominant.y, signed: unit.y },
      { label: "z", magnitude: dominant.x, signed: unit.x },
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

    return {
      vector: [vectorByLabel.x, vectorByLabel.y, vectorByLabel.z],
      dominance: top.magnitude,
      gap: top.magnitude - second.magnitude,
      label: top.label,
      direction: top.signed >= 0 ? "cw" : "ccw",
    };
  }

  function createSignalProcessor(options){
    const settings = {
      energyBankCap: Number(options && options.energyBankCap) || 1000,
      energyChargeRatePps: Number(options && options.energyChargeRatePps) || 160,
      shakeLampThreshold: Number(options && options.shakeLampThreshold) || 1.45,
    };

    let energyBankPts = 0;
    let energyBankLastMs = 0;
    const spinRuntime = {
      ox: 0,
      oy: 0,
      oz: 0,
      hist: [],
    };

    function reset(){
      energyBankPts = 0;
      energyBankLastMs = 0;
      spinRuntime.ox = 0;
      spinRuntime.oy = 0;
      spinRuntime.oz = 0;
      spinRuntime.hist = [];
    }

    function spendEnergy(points){
      energyBankPts = clamp(energyBankPts - (Number(points) || 0), 0, settings.energyBankCap);
    }

    function getEnergyBankState(){
      return {
        points: energyBankPts,
        level01: settings.energyBankCap > 0 ? (energyBankPts / settings.energyBankCap) : 0,
      };
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
      const spin = deriveSpinStateFromVector(spinVector, packet && packet.spinDirection)
        || deriveSpinState(rotationRate, receivedAtMs, spinRuntime);
      const directionVector = pickDirVector(packet);
      const directionAngles = directionVector ? dirToYawTiltDeg(directionVector) : null;

      if (!energyBankLastMs) energyBankLastMs = receivedAtMs;
      let dt = (receivedAtMs - energyBankLastMs) / 1000;
      energyBankLastMs = receivedAtMs;
      dt = clamp(dt, 0, 0.25);

      energyBankPts = clamp(
        energyBankPts + (energy01 * settings.energyChargeRatePps * dt),
        0,
        settings.energyBankCap
      );

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
        energyBank: getEnergyBankState(),
      };
    }

    return {
      processPacket,
      reset,
      spendEnergy,
      getEnergyBankState,
    };
  }

  global.createSignalProcessor = createSignalProcessor;
})(window);
