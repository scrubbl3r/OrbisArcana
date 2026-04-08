export function createTransmitterPacketPublisher({
  rootWindow = window,
  sendHzRelay = 12,
  sendHzLan = 60,
  telemetryOn = false,
  fallDragDefault = 1.0,
  eps = {},
  publishRelay = () => false,
  sendImpulse = () => false,
} = {}) {
  let nextSendAtMs = 0;
  let lastSig = null;

  function roundN(x, n = 4) {
    const value = Number(x);
    if (!isFinite(value)) return 0;
    const p = Math.pow(10, n);
    return Math.round(value * p) / p;
  }

  function buildSigFromPayload(payload) {
    const ag = payload.ag || [0, 0, 0];
    const rr = payload.rr || [0, 0, 0];

    return {
      energy01: roundN(payload.energy01, 4),
      groove01: roundN(payload.groove01, 4),
      dynamics01: roundN(payload.dynamics01, 4),
      smooth01: roundN(payload.smooth01, 4),
      speed01: roundN(payload.speed01, 4),
      shake01: roundN(payload.shake01, 4),
      locked: !!payload.locked,
      shakeHit: !!payload.shakeHit,
      hz: roundN(payload.hz, 3),
      agx: roundN(ag[0], 2),
      agy: roundN(ag[1], 2),
      agz: roundN(ag[2], 2),
      rrx: roundN(rr[0], 1),
      rry: roundN(rr[1], 1),
      rrz: roundN(rr[2], 1),
    };
  }

  function sigChanged(sig) {
    if (!lastSig) return true;

    if (sig.shakeHit && !lastSig.shakeHit) return true;
    if (sig.locked !== lastSig.locked) return true;

    if (Math.abs(sig.energy01 - lastSig.energy01) > eps.energy01) return true;
    if (Math.abs(sig.groove01 - lastSig.groove01) > eps.groove01) return true;
    if (Math.abs(sig.dynamics01 - lastSig.dynamics01) > eps.dynamics01) return true;
    if (Math.abs(sig.smooth01 - lastSig.smooth01) > eps.smooth01) return true;
    if (Math.abs(sig.speed01 - lastSig.speed01) > eps.speed01) return true;
    if (Math.abs(sig.shake01 - lastSig.shake01) > eps.shake01) return true;
    if (Math.abs(sig.hz - lastSig.hz) > eps.hz) return true;

    if (Math.abs(sig.agx - lastSig.agx) > eps.ag) return true;
    if (Math.abs(sig.agy - lastSig.agy) > eps.ag) return true;
    if (Math.abs(sig.agz - lastSig.agz) > eps.ag) return true;

    if (Math.abs(sig.rrx - lastSig.rrx) > eps.rr) return true;
    if (Math.abs(sig.rry - lastSig.rry) > eps.rr) return true;
    if (Math.abs(sig.rrz - lastSig.rrz) > eps.rr) return true;

    return false;
  }

  function reset() {
    nextSendAtMs = 0;
    lastSig = null;
  }

  function publishDynamics(payload, dt, force = false, { lanActive = false } = {}) {
    const now = rootWindow.performance.now();
    if (!force && now < nextSendAtMs) return;

    const sig = buildSigFromPayload(payload);
    if (!force && !sigChanged(sig)) return;

    lastSig = sig;
    const activeHz = lanActive ? sendHzLan : sendHzRelay;
    const sendMinMs = 1000 / Math.max(1, activeHz);
    nextSendAtMs = now + sendMinMs;

    const out = {
      room: payload.room,
      fallDrag: fallDragDefault,
      energy01: sig.energy01,
      groove01: sig.groove01,
      dynamics01: sig.dynamics01,
      smooth01: sig.smooth01,
      speed01: sig.speed01,
      shake01: sig.shake01,
      locked: sig.locked,
      shakeHit: sig.shakeHit,
      hz: sig.hz,
      a: [sig.agx, sig.agy, sig.agz],
      r: [sig.rrx, sig.rry, sig.rrz],
    };

    if (payload.sd) out.sd = payload.sd;
    if (payload.calib) out.calib = payload.calib;
    if (payload.spinVector) out.spinVector = payload.spinVector;
    if (payload.spinDirection) out.spinDirection = payload.spinDirection;
    if (payload.calibOK != null) out.calibOK = payload.calibOK;
    if (payload.omegaOK != null) out.omegaOK = payload.omegaOK;
    if (payload.dbgTag) out.dbgTag = payload.dbgTag;

    if (telemetryOn) {
      out.t = roundN(payload.t, 1);
      out.dt = roundN(payload.dt, 4);
      out.wRaw = roundN(payload.wRaw, 2);
      out.wCap = roundN(payload.wCap, 2);
      out.wFilt = roundN(payload.wFilt, 2);
      out.cap = roundN(payload.cap, 2);
      out.d_r2 = roundN(payload.d_r2, 4);
      out.d_r3 = roundN(payload.d_r3, 4);
      out.d_gate = roundN(payload.d_gate, 4);
      out.d_balance = roundN(payload.d_balance, 4);
      out.d_couple = roundN(payload.d_couple, 4);
    }

    if (lanActive) {
      sendImpulse("impulse", out);
      return;
    }

    publishRelay("orb", out, (err) => {
      if (err) console.warn("[ably publish err]", err);
    });
  }

  return {
    reset,
    publishDynamics,
  };
}
