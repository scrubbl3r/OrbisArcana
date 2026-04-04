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

  function createSignalProcessor(options){
    const settings = {
      energyBankCap: Number(options && options.energyBankCap) || 1000,
      energyChargeRatePps: Number(options && options.energyChargeRatePps) || 160,
      shakeLampThreshold: Number(options && options.shakeLampThreshold) || 1.45,
    };

    let energyBankPts = 0;
    let energyBankLastMs = 0;

    function reset(){
      energyBankPts = 0;
      energyBankLastMs = 0;
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
      const spinColor = pickVec3(packet, "spinColor") || pickVec3(packet, "shieldRGB");
      const spinAxis = pickVec3(packet, "spinAxis") || pickVec3(packet, "shieldAxis");
      const accel = pickVec3(packet, "accel") || pickVec3(packet, "a");
      const rotationRate = pickVec3(packet, "rotationRate") || pickVec3(packet, "r");
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
        direction: {
          vector: directionVector,
          yawDeg: directionAngles ? (((directionAngles.yaw % 360) + 360) % 360) : null,
          tiltDeg: directionAngles ? directionAngles.tilt : null,
          code: sd,
        },
        presentation: {
          spinColor,
        },
        debug: {
          spinAxis,
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
