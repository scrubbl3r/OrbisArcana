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

  function createMotionStore(options){
    const settings = {
      energyBankCap: Number(options && options.energyBankCap) || 1000,
      energyChargeRatePps: Number(options && options.energyChargeRatePps) || 160,
      shakeLampThreshold: Number(options && options.shakeLampThreshold) || 1.45,
    };

    let state = {
      receivedAtMs: 0,
      packet: null,
      motion: {
        energy01: 0,
        groove01: 0,
        dynamics01: 0,
        smooth01: 0,
        speed01: 0,
        shake01: 0,
        lift01: 0,
        locked: false,
        hz: 0,
        shakeHit: false,
        shakeMeter01: 0,
        shakeDisplayValue: 0,
        sd: null,
        shieldRGB: null,
        shieldAxis: null,
        accel: null,
        rotationRate: null,
      },
      energyBank: {
        points: 0,
        level01: 0,
      },
    };

    let energyBankPts = 0;
    let energyBankLastMs = 0;
    const subscribers = new Set();

    function snapshot(){
      return state;
    }

    function notify(){
      const next = snapshot();
      subscribers.forEach((subscriber) => subscriber(next));
    }

    function subscribe(subscriber){
      subscribers.add(subscriber);
      return function unsubscribe(){
        subscribers.delete(subscriber);
      };
    }

    function reset(){
      energyBankPts = 0;
      energyBankLastMs = 0;
      state = {
        receivedAtMs: 0,
        packet: null,
        motion: {
          energy01: 0,
          groove01: 0,
          dynamics01: 0,
          smooth01: 0,
          speed01: 0,
          shake01: 0,
          lift01: 0,
          locked: false,
          hz: 0,
          shakeHit: false,
          shakeMeter01: 0,
          shakeDisplayValue: 0,
          sd: null,
          shieldRGB: null,
          shieldAxis: null,
          accel: null,
          rotationRate: null,
        },
        energyBank: {
          points: 0,
          level01: 0,
        },
      };
      notify();
    }

    function spendEnergy(points){
      energyBankPts = clamp(energyBankPts - (Number(points) || 0), 0, settings.energyBankCap);
      state = {
        ...state,
        energyBank: {
          points: energyBankPts,
          level01: settings.energyBankCap > 0 ? (energyBankPts / settings.energyBankCap) : 0,
        },
      };
      notify();
    }

    function ingestPacket(packet, nowMs, options){
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
      const shieldRGB = pickVec3(packet, "shieldRGB");
      const shieldAxis = pickVec3(packet, "shieldAxis");
      const accel = pickVec3(packet, "a");
      const rotationRate = pickVec3(packet, "r");

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

      state = {
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
          sd,
          shieldRGB,
          shieldAxis,
          accel,
          rotationRate,
        },
        energyBank: {
          points: energyBankPts,
          level01: settings.energyBankCap > 0 ? (energyBankPts / settings.energyBankCap) : 0,
        },
      };

      notify();
      return state;
    }

    return {
      getState: snapshot,
      ingestPacket,
      reset,
      spendEnergy,
      subscribe,
    };
  }

  global.createMotionStore = createMotionStore;
})(window);
