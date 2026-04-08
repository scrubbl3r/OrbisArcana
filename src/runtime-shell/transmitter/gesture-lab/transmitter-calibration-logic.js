function vDot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vCross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function vNorm(v) {
  const magnitude = Math.hypot(v.x, v.y, v.z);
  if (!(magnitude > 1e-6)) return { x: 0, y: 0, z: 0, mag: 0 };
  return { x: v.x / magnitude, y: v.y / magnitude, z: v.z / magnitude, mag: magnitude };
}

function vScale(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function matVec(m, v) {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  };
}

export function createTransmitterCalibrationLogic() {
  function computeCalibrationBasis(samples, orientRotation, {
    phoneTopAxis = { x: 0, y: 1, z: 0 },
    previousAlpha0 = null,
    orientationAlpha = null,
  } = {}) {
    if (!samples || !samples.length) return null;
    if (!orientRotation) return null;

    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const sample of samples) {
      sx += sample.ax;
      sy += sample.ay;
      sz += sample.az;
    }

    const n = samples.length || 1;
    const gRaw = { x: sx / n, y: sy / n, z: sz / n };
    const gHatN = vNorm(gRaw);
    if (!(gHatN.mag > 0.5)) return null;

    const gHat = { x: gHatN.x, y: gHatN.y, z: gHatN.z };
    const gHatWorld = matVec(orientRotation, gHat);
    const up = { x: -gHatWorld.x, y: -gHatWorld.y, z: -gHatWorld.z };

    let forwardBase = matVec(orientRotation, phoneTopAxis);
    forwardBase = vSub(forwardBase, vScale(up, vDot(forwardBase, up)));
    let forwardNorm = vNorm(forwardBase);
    if (!(forwardNorm.mag > 1e-6)) {
      const alt = { x: 1, y: 0, z: 0 };
      const altForward = vSub(alt, vScale(up, vDot(alt, up)));
      forwardNorm = vNorm(altForward);
    }

    const forward = { x: forwardNorm.x, y: forwardNorm.y, z: forwardNorm.z };
    const rightNorm = vNorm(vCross(forward, up));
    const right = { x: rightNorm.x, y: rightNorm.y, z: rightNorm.z };

    return {
      basis: { up, right, forward },
      calibR: orientRotation,
      calibAlpha0: Number.isFinite(orientationAlpha) ? orientationAlpha : previousAlpha0,
    };
  }

  function classifyDirectionalImpulse({
    impulseHist,
    nowMs,
    orientRotation,
    calibBasis,
    gravityVectorLp,
    impulseWinMs = 360,
    dirMinThreshold = 0.35,
    flipU = 1,
    flipR = -1,
    flipF = -1,
  }) {
    if (!calibBasis) return null;
    if (!orientRotation) return null;

    const t0 = nowMs - impulseWinMs;
    const basis = calibBasis;
    const gHat = { x: -basis.up.x, y: -basis.up.y, z: -basis.up.z };

    let n = 0;
    for (let i = impulseHist.length - 1; i >= 0; i -= 1) {
      const sample = impulseHist[i];
      if (sample.t < t0) break;
      n += 1;
    }
    if (!n) return null;

    let upPos = { v: 0, t: 0 };
    let upNeg = { v: 0, t: 0 };
    let rPos = { v: 0, t: 0 };
    let rNeg = { v: 0, t: 0 };
    let fPos = { v: 0, t: 0 };
    let fNeg = { v: 0, t: 0 };

    for (let i = impulseHist.length - 1; i >= 0; i -= 1) {
      const sample = impulseHist[i];
      if (sample.t < t0) break;
      const aRaw = matVec(orientRotation, { x: sample.ax, y: sample.ay, z: sample.az });
      const aLin = vSub(aRaw, vScale(gHat, vDot(aRaw, gHat)));
      const gBias = gravityVectorLp && gravityVectorLp.has ? vDot(gravityVectorLp, basis.up) : 0;
      const u = (vDot(aRaw, basis.up) - gBias) * flipU;
      const r = vDot(aLin, basis.right) * flipR;
      const f = vDot(aLin, basis.forward) * flipF;

      if (u >= 0 && u > upPos.v) upPos = { v: u, t: sample.t };
      if (u < 0 && -u > upNeg.v) upNeg = { v: -u, t: sample.t };
      if (r >= 0 && r > rPos.v) rPos = { v: r, t: sample.t };
      if (r < 0 && -r > rNeg.v) rNeg = { v: -r, t: sample.t };
      if (f >= 0 && f > fPos.v) fPos = { v: f, t: sample.t };
      if (f < 0 && -f > fNeg.v) fNeg = { v: -f, t: sample.t };
    }

    const maxU = Math.max(upPos.v, upNeg.v);
    const maxR = Math.max(rPos.v, rNeg.v);
    const maxF = Math.max(fPos.v, fNeg.v);
    const maxAbs = Math.max(maxU, maxR, maxF);
    if (maxAbs < dirMinThreshold) return null;

    function pickSign(pos, neg) {
      if (pos.v > 0 && neg.v > 0) return pos.t < neg.t ? 1 : -1;
      if (pos.v > 0) return 1;
      if (neg.v > 0) return -1;
      return 0;
    }

    if (maxAbs === maxU) {
      const sign = pickSign(upPos, upNeg);
      return sign >= 0 ? "U" : "D";
    }
    if (maxAbs === maxR) {
      const sign = pickSign(rPos, rNeg);
      return sign >= 0 ? "R" : "L";
    }
    const sign = pickSign(fPos, fNeg);
    return sign >= 0 ? "F" : "B";
  }

  return {
    computeCalibrationBasis,
    classifyDirectionalImpulse,
  };
}
