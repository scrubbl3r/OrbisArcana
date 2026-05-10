export function createTransmitterMotionCore({
  rootWindow = window,
  room = "",
  versionText = "",
  debugShield = true,
  getRunning = () => false,
  getCalibrationBasis = () => null,
  isCalibrationReady = () => false,
  consumeCalibAck = () => 0,
  handleLinearMotionSample = () => {},
  classifyDirectionalShake = () => null,
  publishDynamics = () => {},
  setBgFromEnergy = () => {},
  setAudio = () => {},
} = {}) {
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const clamp01x2 = (x) => Math.max(0, Math.min(2, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mag3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);

  const SHIELD_AXIS_WIN_MS = 1500;
  const GRAV_LPF_HZ = 0.8;
  const SD_SLOP_GATE = 0.18;

  const OMEGA_LPF = 0.22;
  const HUNT_WINDOW_SEC = 0.5; // 0.8
  const STABLE_WINDOW_SEC = 1.6; // 1.6
  const MIN_WINDOW_SAMPLES = 28;
  const MAX_WINDOW_SAMPLES = 260;
  const MIN_OMEGA = 0.02; // 0.02
  const LOCK_ON = 0.1;
  const LOCK_OFF = 0.05;
  const GROOVE_FLOOR = 0;
  const GROOVE_FULL = 0.12;
  const MIN_HZ = 0.55;
  const MAX_HZ = 2.3;
  const JERK_TIGHT = 150.0; //220.0
  const JERK_LOOSE = 2600.0;

  const DYNAMICS_WINDOW_SEC = 1.0;
  const DYNAMICS_FLOOR = 0.18;
  const DYNAMICS_UI_EXP = 1.0;
  const DYNAMICS_UI_GAIN = 3.5;
  const DYNAMICS_ACTIVITY_MIN01 = 0.06;
  const DYNAMICS_ACTIVITY_POW = 1.15;
  const ENERGY_GAIN_LOCKED = 1.25;
  const ENERGY_GAIN_FREE = 0.65;
  const ENERGY_DECAY = 0.1;
  const UI_SMOOTH = 0.1;
  const LOCK_SMOOTH = 0.05;
  const GROOVE_EXP = 0.7;
  const SMOOTH_EXP = 0.7;
  const DYNAMICS_EXP = 1.0;
  const EARN_SCALE = 1.0;
  const COAST_QUALITY_MIN = 0.28;
  const COAST_DECAY_MULT = 0.65;
  const SMOOTH_KILL_THRESH = 0.12;
  const SMOOTH_KILL_DECAY_MULT = 3.25;
  const SMOOTH_KILL_UNLOCK = true;
  const GRACE_SEC = 0.75;
  const RECENTER_SEC = 0.85;
  const RECENTER_GROOVE_MAX = 0.22;
  const NORM_ALPHA = 0.1;

  const SPEED_DEAD_DPS = 8.0;
  const SPEED_CAP_DPS = 360.0;
  const SPEED_EMA_CUTOFF_FAST_HZ = 1.5;
  const SPEED_EMA_CUTOFF_SLOW_HZ = 0.1;
  const SPEED_ADAPT_START_DPS = 18.0;
  const SPEED_ADAPT_END_DPS = 130.0;
  const SPEED_ADAPT_POW = 1.0;
  const SPEED_NORM_DPS = 180.0;
  const SPEED_MAP_POW = 1.1;
  const SPEED_ATTACK_HZ = 5.0;
  const SPEED_RELEASE_HZ = 8.0;

  const SHAKE_BASELINE_HZ = 0.75;
  const SHAKE_HP_DEAD_G = 0.35;
  const SHAKE_JERK_DEAD = 6.0;
  const SHAKE_HP_WEIGHT = 1.0;
  const SHAKE_JERK_WEIGHT = 0.35;
  const SHAKE_METER_GAIN = 2.6;
  const SHAKE_METER_DECAY = 2.6;
  const SHAKE_WIN_WINDOW_SEC = 0.9;
  const SHAKE_FULL_HI = 0.5;

  const METER_HOLD_SEC = 0.55;
  const METER_FADE_HZ = 3.0;

  let orientState = { alpha: 0, beta: 0, gamma: 0, has: false, R: null };
  let gVecLP = { x: 0, y: 0, z: 0, has: false };

  const spinVectorHist = [];
  let spinVector01 = null;
  let spinDirection = null;

  let lastT = null;
  let ox = 0;
  let oy = 0;
  let oz = 0;

  const omegaMag = [];
  const omegaNorm = [];
  const omegaVec = [];
  const jerkBuf = [];
  const dtBuf = [];
  const dynamicsVecBuf = [];
  const dynamicsDtBuf = [];
  const shakeFullTimes = [];

  let emaMean = 0;
  let emaVar = 1;
  let lock = false;
  let lockStrength = 0;
  let grooveHz = 0;
  let graceLeft = 0;
  let recenterBadTime = 0;
  let grooveFlushCount = 0;
  let lastGrooveFlushAtMs = 0;
  let energy = 0;
  let energyUI = 0;
  let mSpeedEMA = 0;
  let speedOut = 0;
  let meterHoldLeft = 0;
  let lastGrooveUI = 0;
  let lastDynamicsUI = 0;
  let lastSmoothUI = 0;
  let shake01 = 0;
  let accelBaseMag = 9.81;
  let prevAx = 0;
  let prevAy = 0;
  let prevAz = 0;
  let prevAmag = 9.81;

  function vDot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function vNorm(v) {
    const m = Math.hypot(v.x, v.y, v.z);
    if (!(m > 1e-6)) return { x: 0, y: 0, z: 0, mag: 0 };
    return { x: v.x / m, y: v.y / m, z: v.z / m, mag: m };
  }

  function matMul(a, b) {
    return [
      [
        a[0][0] * b[0][0] + a[0][1] * b[1][0] + a[0][2] * b[2][0],
        a[0][0] * b[0][1] + a[0][1] * b[1][1] + a[0][2] * b[2][1],
        a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] * b[2][2],
      ],
      [
        a[1][0] * b[0][0] + a[1][1] * b[1][0] + a[1][2] * b[2][0],
        a[1][0] * b[0][1] + a[1][1] * b[1][1] + a[1][2] * b[2][1],
        a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] * b[2][2],
      ],
      [
        a[2][0] * b[0][0] + a[2][1] * b[1][0] + a[2][2] * b[2][0],
        a[2][0] * b[0][1] + a[2][1] * b[1][1] + a[2][2] * b[2][1],
        a[2][0] * b[0][2] + a[2][1] * b[1][2] + a[2][2] * b[2][2],
      ],
    ];
  }

  function matVec(m, v) {
    return {
      x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
      y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
      z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
    };
  }

  function rotFromEuler(alpha, beta, gamma) {
    const _x = (beta || 0) * Math.PI / 180;
    const _y = (gamma || 0) * Math.PI / 180;
    const _z = (alpha || 0) * Math.PI / 180;

    const cX = Math.cos(_x), sX = Math.sin(_x);
    const cY = Math.cos(_y), sY = Math.sin(_y);
    const cZ = Math.cos(_z), sZ = Math.sin(_z);

    const Rz = [[cZ, -sZ, 0], [sZ, cZ, 0], [0, 0, 1]];
    const Rx = [[1, 0, 0], [0, cX, -sX], [0, sX, cX]];
    const Ry = [[cY, 0, sY], [0, 1, 0], [-sY, 0, cY]];
    return matMul(matMul(Rz, Rx), Ry);
  }

  function alphaFromCutoff(dt, cutoffHz) {
    const tau = 1 / (2 * Math.PI * cutoffHz);
    return 1 / (1 + tau / Math.max(1e-4, dt));
  }

  function median(arr) {
    if (!arr.length) return 0;
    const a = arr.slice().sort((x, y) => x - y);
    const mid = (a.length - 1) / 2;
    const lo = Math.floor(mid);
    const hi = Math.ceil(mid);
    return (a[lo] + a[hi]) / 2;
  }

  function autocorrPeak(signal, dt) {
    const n = signal.length;
    if (n < 24) return { peak: 0, lag: 0, hz: 0 };

    let mean = 0;
    for (let i = 0; i < n; i += 1) mean += signal[i];
    mean /= n;

    let varr = 0;
    for (let i = 0; i < n; i += 1) {
      const d = signal[i] - mean;
      varr += d * d;
    }
    if (varr < 1e-9) return { peak: 0, lag: 0, hz: 0 };

    const minLag = Math.max(2, Math.floor(1 / (MAX_HZ * dt)));
    const maxLag = Math.min(n - 3, Math.floor(1 / (MIN_HZ * dt)));

    let best = -1;
    let bestLag = 0;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let c = 0;
      for (let i = 0; i < n - lag; i += 1) {
        c += (signal[i] - mean) * (signal[i + lag] - mean);
      }
      const r = c / varr;
      if (r > best) {
        best = r;
        bestLag = lag;
      }
    }

    const hz = bestLag > 0 ? 1 / (bestLag * dt) : 0;
    return { peak: clamp01(best), lag: bestLag, hz };
  }

  function smoothnessFromJerk(avgJerk) {
    const t = (JERK_LOOSE - avgJerk) / (JERK_LOOSE - JERK_TIGHT);
    return clamp01(t);
  }

  function mapGroove01(rawGroove) {
    const floor = clamp01(GROOVE_FLOOR);
    const full = Math.max(floor + 1e-6, clamp01(GROOVE_FULL));
    return clamp01((clamp01(rawGroove) - floor) / (full - floor));
  }

  function dynamicsActivityGate(speed01) {
    const v = clamp01(speed01 || 0);
    const x = (v - DYNAMICS_ACTIVITY_MIN01) / (1 - DYNAMICS_ACTIVITY_MIN01);
    return Math.pow(clamp01(x), DYNAMICS_ACTIVITY_POW);
  }

  function computeAvg(arr) {
    if (!arr.length) return 0;
    let s = 0;
    for (const x of arr) s += x;
    return s / arr.length;
  }

  function trimToWindow(dtMean, targetSec) {
    let targetN = dtMean > 1e-4 ? Math.round(targetSec / dtMean) : MAX_WINDOW_SAMPLES;
    targetN = Math.max(MIN_WINDOW_SAMPLES, Math.min(MAX_WINDOW_SAMPLES, targetN));

    while (omegaMag.length > targetN) omegaMag.shift();
    while (omegaNorm.length > targetN) omegaNorm.shift();
    while (omegaVec.length > targetN) omegaVec.shift();
    while (jerkBuf.length > targetN) jerkBuf.shift();
    while (dtBuf.length > targetN) dtBuf.shift();

    return targetN;
  }

  function dynamicsBufPush(vec, dt) {
    const d = Math.max(1e-4, Number(dt) || 0);
    dynamicsVecBuf.push(vec);
    dynamicsDtBuf.push(d);

    let acc = 0;
    for (let i = dynamicsDtBuf.length - 1; i >= 0; i -= 1) {
      acc += dynamicsDtBuf[i];
      if (acc >= 2.5) {
        dynamicsVecBuf.splice(0, i);
        dynamicsDtBuf.splice(0, i);
        break;
      }
    }
  }

  function dynamicsDiversityLastSec(windowSec) {
    const W = Math.max(0.2, Number(windowSec) || 1.0);
    let sumW = 0;
    let sx = 0, sy = 0, sz = 0;

    for (let i = dynamicsVecBuf.length - 1; i >= 0; i -= 1) {
      const dt = dynamicsDtBuf[i] || 0;
      if (sumW >= W) break;
      const w = Math.min(dt, W - sumW);
      const v = dynamicsVecBuf[i];
      if (v) {
        sx += (v.x || 0) * w;
        sy += (v.y || 0) * w;
        sz += (v.z || 0) * w;
      }
      sumW += w;
    }

    if (sumW < 0.25) return { div01: 0, R: 1, n: dynamicsVecBuf.length };

    const inv = 1 / sumW;
    const mx = sx * inv;
    const my = sy * inv;
    const mz = sz * inv;
    const R = clamp01(Math.sqrt(mx * mx + my * my + mz * mz));
    const div01 = clamp01(1 - R);
    return { div01, R, n: dynamicsVecBuf.length };
  }

  function flushHistorySoft() {
    const keep = Math.min(18, omegaMag.length);
    omegaMag.splice(0, Math.max(0, omegaMag.length - keep));
    omegaNorm.splice(0, Math.max(0, omegaNorm.length - keep));
    omegaVec.splice(0, Math.max(0, omegaVec.length - keep));
    jerkBuf.splice(0, Math.max(0, jerkBuf.length - keep));
    dtBuf.splice(0, Math.max(0, dtBuf.length - keep));
    dynamicsVecBuf.splice(0, Math.max(0, dynamicsVecBuf.length - keep));
    dynamicsDtBuf.splice(0, Math.max(0, dynamicsDtBuf.length - keep));
  }

  function meterHoldOrFade(dt) {
    if (dt > 0) meterHoldLeft = Math.max(0, meterHoldLeft - dt);

    const dtFade = Math.max(1e-3, dt || computeAvg(dtBuf.slice(-50)) || 1 / 60);
    const aFade = alphaFromCutoff(dtFade, METER_FADE_HZ);
    const holding = meterHoldLeft > 0;

    const grooveOut = holding ? lastGrooveUI : (1 - aFade) * lastGrooveUI;
    const dynamicsOut = holding ? lastDynamicsUI : (1 - aFade) * lastDynamicsUI;
    const smoothOut = holding ? lastSmoothUI : (1 - aFade) * lastSmoothUI;

    lastGrooveUI = grooveOut;
    lastDynamicsUI = dynamicsOut;
    lastSmoothUI = smoothOut;

    return { grooveOut, dynamicsOut, smoothOut };
  }

  function updateSpeedV0(wRawDps, dt) {
    const dtSafe = Math.max(1e-3, dt || 1 / 60);
    const wRaw = Math.max(0, wRawDps || 0);
    const cap = SPEED_CAP_DPS;
    const wCap = Math.min(wRaw, cap);
    const wDz = Math.max(0, wCap - SPEED_DEAD_DPS);

    const denom = Math.max(1e-6, SPEED_ADAPT_END_DPS - SPEED_ADAPT_START_DPS);
    let tAdapt = (wDz - SPEED_ADAPT_START_DPS) / denom;
    tAdapt = clamp01(tAdapt);
    tAdapt = Math.pow(tAdapt, SPEED_ADAPT_POW);

    const cutoffHz = lerp(SPEED_EMA_CUTOFF_FAST_HZ, SPEED_EMA_CUTOFF_SLOW_HZ, tAdapt);
    const aE = alphaFromCutoff(dtSafe, cutoffHz);

    mSpeedEMA = mSpeedEMA === 0 ? wDz : ((1 - aE) * mSpeedEMA + aE * wDz);
    const wFilt = mSpeedEMA;

    const n = clamp01(wFilt / SPEED_NORM_DPS);
    const target = Math.pow(n, SPEED_MAP_POW);
    const aAtk = alphaFromCutoff(dtSafe, SPEED_ATTACK_HZ);
    const aRel = alphaFromCutoff(dtSafe, SPEED_RELEASE_HZ);
    const a = target >= speedOut ? aAtk : aRel;
    speedOut = (1 - a) * speedOut + a * target;

    return { cap, dt: dtSafe, wRaw, wCap, wDz, wFilt, speed: speedOut, cutoffHz, tAdapt };
  }

  function updateShake(e, t, dt) {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    const dtSafe = Math.max(1e-3, dt || 1 / 60);
    const prevShake = shake01;

    if (!acc) {
      shake01 = Math.max(0, shake01 - SHAKE_METER_DECAY * dtSafe);
      return { shake01, shakeHit: false, spike: 0, amag: 0, jerk: 0 };
    }

    const ax = Number(acc.x) || 0;
    const ay = Number(acc.y) || 0;
    const az = Number(acc.z) || 0;
    const amag = mag3(ax, ay, az);

    const aBase = alphaFromCutoff(dtSafe, SHAKE_BASELINE_HZ);
    accelBaseMag = isFinite(accelBaseMag) ? accelBaseMag : amag;
    accelBaseMag = (1 - aBase) * accelBaseMag + aBase * amag;

    const hp = Math.abs(amag - accelBaseMag);
    const hpSpike = Math.max(0, hp - SHAKE_HP_DEAD_G);

    const dax = ax - prevAx;
    const day = ay - prevAy;
    const daz = az - prevAz;
    const jerk = mag3(dax, day, daz) / dtSafe;
    const jerkSpike = Math.max(0, jerk - SHAKE_JERK_DEAD);

    prevAx = ax;
    prevAy = ay;
    prevAz = az;
    prevAmag = amag;

    const spike = (SHAKE_HP_WEIGHT * hpSpike) + (SHAKE_JERK_WEIGHT * (jerkSpike / 80.0));
    shake01 = clamp01x2(shake01 + SHAKE_METER_GAIN * spike * dtSafe - SHAKE_METER_DECAY * dtSafe);

    const hitFull = prevShake < SHAKE_FULL_HI && shake01 >= SHAKE_FULL_HI;
    if (hitFull) {
      shakeFullTimes.push(t);
      const cutoff = t - SHAKE_WIN_WINDOW_SEC;
      while (shakeFullTimes.length && shakeFullTimes[0] < cutoff) shakeFullTimes.shift();
    } else if (shakeFullTimes.length) {
      const cutoff = t - SHAKE_WIN_WINDOW_SEC;
      while (shakeFullTimes.length && shakeFullTimes[0] < cutoff) shakeFullTimes.shift();
    }

    let shakeHit = false;
    if (hitFull) {
      shakeHit = true;
      shakeFullTimes.length = 0;
    }

    return { shake01, shakeHit, spike, amag, jerk };
  }

  function updateSpinVectorState(nowMs, omegaUnit) {
    const calibBasis = getCalibrationBasis();
    if (!orientState.R || !calibBasis || !omegaUnit) return;

    const wWorld = matVec(orientState.R, omegaUnit);
    const x = vDot(wWorld, calibBasis.right);
    const y = vDot(wWorld, calibBasis.forward);
    const z = vDot(wWorld, calibBasis.up);
    const v = vNorm({ x, y, z });
    if (!(v.mag > 1e-6)) return;

    spinVectorHist.push({ t: nowMs, x: v.x, y: v.y, z: v.z });
    const cutoff = nowMs - SHIELD_AXIS_WIN_MS;
    while (spinVectorHist.length && spinVectorHist[0].t < cutoff) spinVectorHist.shift();

    let sx = 0, sy = 0, sz = 0;
    let signedX = 0, signedY = 0, signedZ = 0;
    for (const s of spinVectorHist) {
      sx += Math.abs(s.x);
      sy += Math.abs(s.y);
      sz += Math.abs(s.z);
      signedX += s.x;
      signedY += s.y;
      signedZ += s.z;
    }
    const a = vNorm({ x: sx, y: sy, z: sz });
    if (!(a.mag > 1e-6)) return;

    spinVector01 = { x: a.z, y: a.y, z: a.x };

    const semantic = [
      { axis: "x", magnitude: spinVector01.x, signed: signedZ },
      { axis: "y", magnitude: spinVector01.y, signed: signedY },
      { axis: "z", magnitude: spinVector01.z, signed: signedX },
    ].sort((left, right) => right.magnitude - left.magnitude);
    spinDirection = semantic[0] && semantic[0].magnitude > 1e-6
      ? (semantic[0].signed >= 0 ? "cw" : "ccw")
      : null;
  }

  function onOrient(e) {
    const alpha = 0;
    const beta = (e && e.beta != null) ? Number(e.beta) : 0;
    const gamma = (e && e.gamma != null) ? Number(e.gamma) : 0;
    orientState.alpha = isFinite(alpha) ? alpha : 0;
    orientState.beta = isFinite(beta) ? beta : 0;
    orientState.gamma = isFinite(gamma) ? gamma : 0;
    orientState.R = rotFromEuler(orientState.alpha, orientState.beta, orientState.gamma);
    orientState.has = true;
  }

  function onMotion(e) {
    if (!getRunning()) return;

    try {
      const t = rootWindow.performance.now() / 1000;
      const dt = lastT == null ? 0 : (t - lastT);
      const nowMs = t * 1000;
      lastT = t;

      if (dt > 0) dtBuf.push(dt);

      const sh = updateShake(e, t, dt);
      const acc = e.accelerationIncludingGravity || e.acceleration;
      const agx = acc ? (Number(acc.x) || 0) : 0;
      const agy = acc ? (Number(acc.y) || 0) : 0;
      const agz = acc ? (Number(acc.z) || 0) : 0;

      if (orientState.R) {
        const gWorld = matVec(orientState.R, { x: agx, y: agy, z: agz });
        const aG = alphaFromCutoff(Math.max(1e-3, dt || 1 / 60), GRAV_LPF_HZ);
        if (!gVecLP.has) {
          gVecLP = { x: gWorld.x, y: gWorld.y, z: gWorld.z, has: true };
        } else {
          gVecLP.x = (1 - aG) * gVecLP.x + aG * gWorld.x;
          gVecLP.y = (1 - aG) * gVecLP.y + aG * gWorld.y;
          gVecLP.z = (1 - aG) * gVecLP.z + aG * gWorld.z;
        }
      }

      handleLinearMotionSample({ nowMs, agx, agy, agz });

      const rr = e.rotationRate;
      const rrx = rr ? (rr.beta ?? 0) : 0;
      const rry = rr ? (rr.gamma ?? 0) : 0;
      const rrz = rr ? (rr.alpha ?? 0) : 0;

      if (!rr) {
        const dtMean = Math.max(1e-3, computeAvg(dtBuf.slice(-50)) || 1 / 60);
        const dtForFilter = dt > 0 ? dt : dtMean;
        const sv = updateSpeedV0(0, dtForFilter);

        if (dt > 0) {
          energy = Math.max(0, energy - ENERGY_DECAY * dt);
          energyUI = lerp(energyUI, energy, UI_SMOOTH);
        }

        const held = meterHoldOrFade(dt);
        const sd = sh.shake01 > SD_SLOP_GATE ? classifyDirectionalShake(nowMs) : null;
        const calibAck = consumeCalibAck();
        const forceSend = !!calibAck || !!sh.shakeHit;

        publishDynamics({
          room,
          t: rootWindow.performance.now(),
          dt: sv.dt,
          wRaw: sv.wRaw,
          wCap: sv.wCap,
          wFilt: sv.wFilt,
          cap: sv.cap,
          energy01: energyUI,
          groove01: held.grooveOut,
          dynamics01: held.dynamicsOut,
          smooth01: held.smoothOut,
          speed01: sv.speed,
          shake01: sh.shake01,
          shakeHit: sh.shakeHit,
          sd,
          calib: calibAck,
          locked: false,
          hz: 0,
          spinVector: spinVector01 ? [spinVector01.x, spinVector01.y, spinVector01.z] : null,
          spinDirection,
          dbgTag: versionText,
          ...(debugShield ? { calibOK: isCalibrationReady() ? 1 : 0, omegaOK: 0 } : {}),
          ag: [agx, agy, agz],
          rr: [rrx, rry, rrz],
          d_r2: 0,
          d_r3: 0,
          d_gate: 0,
          d_balance: 0,
          d_couple: 0,
        }, dt, forceSend);

        setBgFromEnergy(clamp01(energyUI));
        setAudio(energyUI, held.grooveOut, false);
        return;
      }

      const prevOx = ox, prevOy = oy, prevOz = oz;
      ox = lerp(ox, rrx, OMEGA_LPF);
      oy = lerp(oy, rry, OMEGA_LPF);
      oz = lerp(oz, rrz, OMEGA_LPF);

      const mStability = mag3(ox, oy, oz);
      const dtMean = Math.max(1e-3, computeAvg(dtBuf.slice(-50)));
      const dtForFilter = dt > 0 ? dt : dtMean;
      const wRaw = mag3(rrx, rry, rrz);
      const sv = updateSpeedV0(wRaw, dtForFilter);

      if (dt > 0) graceLeft = Math.max(0, graceLeft - dt);

      if (mStability > MIN_OMEGA) {
        omegaMag.push(mStability);

        const d0 = mStability - emaMean;
        emaMean += NORM_ALPHA * d0;
        const d2 = mStability - emaMean;
        emaVar += NORM_ALPHA * (d2 * d2 - emaVar);

        const rms = Math.sqrt(Math.max(1e-6, emaVar));
        omegaNorm.push((mStability - emaMean) / rms);

        const invM = 1 / Math.max(1e-6, mStability);
        const vUnit = { x: ox * invM, y: oy * invM, z: oz * invM };
        omegaVec.push(vUnit);
        updateSpinVectorState(nowMs, vUnit);

        if (dtForFilter > 0) dynamicsBufPush(vUnit, dtForFilter);
        if (dt > 0) {
          const dtSafe = Math.max(dt, dtMean * 0.5, 1 / 120);
          jerkBuf.push(mag3(ox - prevOx, oy - prevOy, oz - prevOz) / dtSafe);
        }
      } else {
        if (omegaMag.length) omegaMag.shift();
        if (omegaNorm.length) omegaNorm.shift();
        if (omegaVec.length) omegaVec.shift();
        if (jerkBuf.length) jerkBuf.shift();
      }

      const inStableMode = false;
      const windowSec = inStableMode ? STABLE_WINDOW_SEC : HUNT_WINDOW_SEC;
      const nTarget = trimToWindow(dtMean, windowSec);

      if (omegaNorm.length < Math.min(MIN_WINDOW_SAMPLES, nTarget)) {
        if (dt > 0) {
          energy = Math.max(0, energy - ENERGY_DECAY * dt);
          energyUI = lerp(energyUI, energy, UI_SMOOTH);
        }

        const held = meterHoldOrFade(dt);
        publishDynamics({
          room,
          t: rootWindow.performance.now(),
          dt: sv.dt,
          wRaw: sv.wRaw,
          wCap: sv.wCap,
          wFilt: sv.wFilt,
          cap: sv.cap,
          energy01: energyUI,
          groove01: held.grooveOut,
          dynamics01: held.dynamicsOut,
          smooth01: held.smoothOut,
          speed01: sv.speed,
          shake01: sh.shake01,
          shakeHit: sh.shakeHit,
          locked: false,
          hz: 0,
          spinVector: spinVector01 ? [spinVector01.x, spinVector01.y, spinVector01.z] : null,
          spinDirection,
          dbgTag: versionText,
          ...(debugShield ? {
            calibOK: isCalibrationReady() ? 1 : 0,
            omegaOK: (mStability > MIN_OMEGA) ? 1 : 0,
            g_raw: 0,
            g_lock: lockStrength,
            g_n: omegaNorm.length,
            g_target: nTarget,
            g_win: windowSec,
            g_stable: inStableMode ? 1 : 0,
            g_recenter: recenterBadTime,
            g_flush: grooveFlushCount,
            g_flush_age: lastGrooveFlushAtMs ? Math.max(0, nowMs - lastGrooveFlushAtMs) : -1,
          } : {}),
          ag: [agx, agy, agz],
          rr: [rrx, rry, rrz],
          d_r2: 0,
          d_r3: 0,
          d_gate: 0,
          d_balance: 0,
          d_couple: 0,
        }, dt);

        setBgFromEnergy(clamp01(energyUI));
        setAudio(energyUI, held.grooveOut, false);
        return;
      }

      const ac = autocorrPeak(omegaNorm, dtMean);
      lockStrength = lerp(lockStrength, ac.peak, LOCK_SMOOTH);
      const groove01 = mapGroove01(lockStrength);
      grooveHz = ac.hz;

      const jerkWindow = jerkBuf.slice(-Math.min(jerkBuf.length, 70));
      const avgJerk = median(jerkWindow);
      const smoothScore = smoothnessFromJerk(avgJerk);
      const dDiv = dynamicsDiversityLastSec(DYNAMICS_WINDOW_SEC);
      const actGate = dynamicsActivityGate(sv.speed);
      const diversityGated = clamp01(dDiv.div01 * actGate);

      const dynamicsBonus = DYNAMICS_FLOOR + (1 - DYNAMICS_FLOOR) * diversityGated;
      const shapedCore = diversityGated;
      const dynamicsUI = clamp01(DYNAMICS_UI_GAIN * Math.pow(shapedCore, DYNAMICS_UI_EXP));

      meterHoldLeft = METER_HOLD_SEC;
      lastGrooveUI = groove01;
      lastDynamicsUI = dynamicsUI;
      lastSmoothUI = smoothScore;

      if (!lock) {
        if (lockStrength > LOCK_ON) {
          lock = true;
          graceLeft = 0;
        }
      } else if (lockStrength < LOCK_OFF) {
        lock = false;
        graceLeft = GRACE_SEC;
      }

      const inGrace = !lock && graceLeft > 0;
      if (inGrace && lockStrength > LOCK_ON) {
        lock = true;
        graceLeft = 0;
      }

      if (dt > 0) {
        recenterBadTime = 0;
      }

      if (dt > 0) {
        const grooveTerm = Math.pow(clamp01(groove01), GROOVE_EXP);
        const smoothTerm = Math.pow(clamp01(smoothScore), SMOOTH_EXP);
        const dynamicsTerm = Math.pow(clamp01(dynamicsBonus), DYNAMICS_EXP);
        const qualityTerm = grooveTerm * smoothTerm;
        const earnBase = EARN_SCALE * grooveTerm * smoothTerm * dynamicsTerm;
        const effectivelyLocked = lock || inGrace;
        const gain = effectivelyLocked ? ENERGY_GAIN_LOCKED : ENERGY_GAIN_FREE;
        const smoothKill = smoothScore < SMOOTH_KILL_THRESH;
        const earn = smoothKill ? 0 : (gain * earnBase);

        let decay = ENERGY_DECAY;
        if (qualityTerm >= COAST_QUALITY_MIN) decay *= COAST_DECAY_MULT;
        if (smoothKill) {
          decay *= SMOOTH_KILL_DECAY_MULT;
          if (SMOOTH_KILL_UNLOCK) {
            lock = false;
            graceLeft = 0;
          }
        }

        energy = Math.max(0, energy + (earn - decay) * dt);
        energyUI = lerp(energyUI, energy, UI_SMOOTH);
      }

      const lockedNow = !!(lock || inGrace);
      const sd = sh.shake01 > SD_SLOP_GATE ? classifyDirectionalShake(nowMs) : null;
      const calibAck = consumeCalibAck();
      const forceSend = !!calibAck || !!sh.shakeHit;

      publishDynamics({
        room,
        t: rootWindow.performance.now(),
        dt: sv.dt,
        wRaw: sv.wRaw,
        wCap: sv.wCap,
        wFilt: sv.wFilt,
        cap: sv.cap,
        energy01: energyUI,
        groove01,
        dynamics01: dynamicsUI,
        smooth01: smoothScore,
        speed01: sv.speed,
        shake01: sh.shake01,
        shakeHit: sh.shakeHit,
        sd,
        calib: calibAck,
        locked: lockedNow,
        hz: grooveHz,
        spinVector: spinVector01 ? [spinVector01.x, spinVector01.y, spinVector01.z] : null,
        spinDirection,
        dbgTag: versionText,
        ...(debugShield ? {
          calibOK: isCalibrationReady() ? 1 : 0,
          omegaOK: (mStability > MIN_OMEGA) ? 1 : 0,
          g_raw: ac.peak,
          g_lock: lockStrength,
          g_n: omegaNorm.length,
          g_target: nTarget,
          g_win: windowSec,
          g_stable: inStableMode ? 1 : 0,
          g_recenter: recenterBadTime,
          g_flush: grooveFlushCount,
          g_flush_age: lastGrooveFlushAtMs ? Math.max(0, nowMs - lastGrooveFlushAtMs) : -1,
        } : {}),
        ag: [agx, agy, agz],
        rr: [rrx, rry, rrz],
        d_r2: dDiv.R,
        d_r3: dDiv.div01,
        d_gate: actGate,
        d_balance: 0,
        d_couple: 0,
      }, dt, forceSend);

      setBgFromEnergy(clamp01(energyUI));
      setAudio(energyUI, groove01, lockedNow);
    } catch (err) {
      console.error("[onMotion crash]", err);
    }
  }

  function resetRuntimeState() {
    lastT = null;
    ox = 0;
    oy = 0;
    oz = 0;
    orientState = { alpha: 0, beta: 0, gamma: 0, has: false, R: null };
    gVecLP = { x: 0, y: 0, z: 0, has: false };
    spinVector01 = null;
    spinDirection = null;
    spinVectorHist.length = 0;
    omegaMag.length = 0;
    omegaNorm.length = 0;
    omegaVec.length = 0;
    jerkBuf.length = 0;
    dtBuf.length = 0;
    dynamicsVecBuf.length = 0;
    dynamicsDtBuf.length = 0;
    shakeFullTimes.length = 0;
    emaMean = 0;
    emaVar = 1;
    lock = false;
    lockStrength = 0;
    grooveHz = 0;
    graceLeft = 0;
    recenterBadTime = 0;
    grooveFlushCount = 0;
    lastGrooveFlushAtMs = 0;
    energy = 0;
    energyUI = 0;
    mSpeedEMA = 0;
    speedOut = 0;
    meterHoldLeft = 0;
    lastGrooveUI = 0;
    lastDynamicsUI = 0;
    lastSmoothUI = 0;
    shake01 = 0;
    accelBaseMag = 9.81;
    prevAx = 0;
    prevAy = 0;
    prevAz = 0;
    prevAmag = 9.81;
  }

  function getOrientState() {
    return orientState;
  }

  function getGravityVectorLp() {
    return gVecLP;
  }

  return {
    onOrient,
    onMotion,
    resetRuntimeState,
    getOrientState,
    getGravityVectorLp,
  };
}
