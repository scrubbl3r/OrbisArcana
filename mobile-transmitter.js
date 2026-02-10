    (function setVhUnit(){
      const root = document.documentElement;

      const set = () => {
        const vv = window.visualViewport;
        const h = (vv && vv.height) ? vv.height : window.innerHeight;
        root.style.setProperty('--vh', (h * 0.01) + 'px');
      };

      set();

      window.addEventListener('resize', set, { passive: true });
      window.addEventListener('orientationchange', set, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', set, { passive: true });
        window.visualViewport.addEventListener('scroll', set, { passive: true });
      }
    })();
  
  (() => {
    // =========================================================================
    // UI — Start/Stop + Gesture Lab
    // =========================================================================
    const startBtn = document.getElementById('startBtn');
    const labBtn = document.getElementById('labBtn');
    const labModal = document.getElementById('labModal');
    const labClose = document.getElementById('labClose');
    const lockGravityBtn = document.getElementById('lockGravityBtn');
    const lockGravityBar = document.getElementById('lockGravityBar');
    const gravityReadout = document.getElementById('gravityReadout');
    const labelGroup = document.getElementById('labelGroup');
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const saveBtn = document.getElementById('saveBtn');
    const qualityBar = document.getElementById('qualityBar');
    const recordStatus = document.getElementById('recordStatus');
    const testToggle = document.getElementById('testToggle');
    const testReadout = document.getElementById('testReadout');
    const masterySlider = document.getElementById('masterySlider');
    const masteryReadout = document.getElementById('masteryReadout');
    const resetLabBtn = document.getElementById('resetLabBtn');

    const UI = { state: "idle" }; // "idle" | "running"

    function setBtn(label){ startBtn.textContent = label; }

    // =========================================================================
    // Keep phone glow mapping (background color), driven by energy
    // =========================================================================
    const BG0 = { r: 0,   g: 0,  b: 0  };
    const BG1 = { r: 255, g: 42, b: 0  };
    function setBgFromEnergy(e01) {
      const t = Math.max(0, Math.min(1, e01));
      const r = Math.round(BG0.r + (BG1.r - BG0.r) * t);
      const g = Math.round(BG0.g + (BG1.g - BG0.g) * t);
      const b = Math.round(BG0.b + (BG1.b - BG0.b) * t);
      document.body.style.backgroundColor = `rgb(${r},${g},${b})`;
    }
    setBgFromEnergy(0);

    // =========================================================================
    // Gesture Lab — user-taught gesture templates (mobile)
    // =========================================================================
    const DEBUG_GESTURE = false;

    const GESTURE_BANK_KEY = "orbis_gesture_bank_v1";
    const GRAVITY_LOCK_KEY = "orbis_gravity_lock_v1";
    const CALIB_BASIS_KEY = "orbis_calib_basis_v1";

    const MAX_REC_MS = 1200;
    const PRE_ROLL_MS = 100;
    const START_THR = 0.35;
    const MIN_REC_MS = 180;
    const RESAMPLE_N = 32;
    const MOTION_HIST_MS = 900;
    const HIT_WIN_MIN_MS = 180;
    const HIT_WIN_MAX_MS = 500;
    const CALIB_MS = 2000;
    const IMPULSE_WIN_MS = 360;
    const DIR_MIN_THR = 0.35;
    const PHONE_TOP_AXIS = { x:0, y:1, z:0 };
    const SHIELD_AXIS_WIN_MS = 1500;
    const DEBUG_SHIELD = true;

    const gestureBank = {
      templates: {},
      mastery: 0.35
    };

    let gravityLock = null; // {x,y,z}
    let calibBasis = null; // { up, right, forward }
    let calibR = null;     // 3x3 rotation at calibration time
    let calibAlpha0 = null;

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
      lastMatch: null
    };

    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    let orientState = { alpha:0, beta:0, gamma:0, has:false, R:null };
    const shieldAxisHist = []; // {t, x, y, z} in calibrated frame
    let shieldRGB = null;

    function vDot(a,b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
    function vCross(a,b){
      return {
        x: a.y*b.z - a.z*b.y,
        y: a.z*b.x - a.x*b.z,
        z: a.x*b.y - a.y*b.x
      };
    }
    function vNorm(v){
      const m = Math.hypot(v.x, v.y, v.z);
      if (!(m > 1e-6)) return { x:0, y:0, z:0, mag:0 };
      return { x:v.x/m, y:v.y/m, z:v.z/m, mag:m };
    }
    function vScale(v,s){ return { x:v.x*s, y:v.y*s, z:v.z*s }; }
    function vSub(a,b){ return { x:a.x-b.x, y:a.y-b.y, z:a.z-b.z }; }
    function matMul(a,b){
      return [
        [
          a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0],
          a[0][0]*b[0][1] + a[0][1]*b[1][1] + a[0][2]*b[2][1],
          a[0][0]*b[0][2] + a[0][1]*b[1][2] + a[0][2]*b[2][2],
        ],
        [
          a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0],
          a[1][0]*b[0][1] + a[1][1]*b[1][1] + a[1][2]*b[2][1],
          a[1][0]*b[0][2] + a[1][1]*b[1][2] + a[1][2]*b[2][2],
        ],
        [
          a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0],
          a[2][0]*b[0][1] + a[2][1]*b[1][1] + a[2][2]*b[2][1],
          a[2][0]*b[0][2] + a[2][1]*b[1][2] + a[2][2]*b[2][2],
        ],
      ];
    }
    function matT(m){
      return [
        [m[0][0], m[1][0], m[2][0]],
        [m[0][1], m[1][1], m[2][1]],
        [m[0][2], m[1][2], m[2][2]],
      ];
    }
    function matVec(m,v){
      return {
        x: m[0][0]*v.x + m[0][1]*v.y + m[0][2]*v.z,
        y: m[1][0]*v.x + m[1][1]*v.y + m[1][2]*v.z,
        z: m[2][0]*v.x + m[2][1]*v.y + m[2][2]*v.z,
      };
    }

    function rotFromEuler(alpha, beta, gamma){
      // Z (alpha), X (beta), Y (gamma) intrinsic rotation
      const _x = (beta || 0)  * Math.PI / 180;
      const _y = (gamma || 0) * Math.PI / 180;
      const _z = (alpha || 0) * Math.PI / 180;

      const cX = Math.cos(_x), sX = Math.sin(_x);
      const cY = Math.cos(_y), sY = Math.sin(_y);
      const cZ = Math.cos(_z), sZ = Math.sin(_z);

      const Rz = [
        [ cZ, -sZ, 0 ],
        [ sZ,  cZ, 0 ],
        [  0,   0, 1 ],
      ];
      const Rx = [
        [ 1,  0,   0 ],
        [ 0, cX, -sX ],
        [ 0, sX,  cX ],
      ];
      const Ry = [
        [ cY, 0, sY ],
        [  0, 1,  0 ],
        [ -sY,0, cY ],
      ];
      return matMul(matMul(Rz, Rx), Ry);
    }

    function updateShieldAxis(nowMs, omegaUnit){
      if (!orientState || !orientState.R) return;
      if (!calibBasis) return;
      if (!omegaUnit) return;

      const wWorld = matVec(orientState.R, omegaUnit);
      const x = vDot(wWorld, calibBasis.right);
      const y = vDot(wWorld, calibBasis.forward);
      const z = vDot(wWorld, calibBasis.up);
      const v = vNorm({ x, y, z });
      if (!(v.mag > 1e-6)) return;

      shieldAxisHist.push({ t: nowMs, x: v.x, y: v.y, z: v.z });
      const cutoff = nowMs - SHIELD_AXIS_WIN_MS;
      while (shieldAxisHist.length && shieldAxisHist[0].t < cutoff) shieldAxisHist.shift();

      let sx = 0, sy = 0, sz = 0;
      for (const s of shieldAxisHist){
        sx += Math.abs(s.x);
        sy += Math.abs(s.y);
        sz += Math.abs(s.z);
      }
      const a = vNorm({ x: sx, y: sy, z: sz });
      if (!(a.mag > 1e-6)) return;

      shieldRGB = {
        r: clamp01(a.x),
        g: clamp01(a.y),
        b: clamp01(a.z)
      };
    }

    function loadCalibBasis(){
      try{
        const raw = localStorage.getItem(CALIB_BASIS_KEY);
        if (!raw) return;
        const j = JSON.parse(raw);
        if (j && j.up && j.right && j.forward){
          const up = vNorm(j.up);
          const right = vNorm(j.right);
          const forward = vNorm(j.forward);
          if (up.mag > 0.5 && right.mag > 0.5 && forward.mag > 0.5){
            calibBasis = {
              up: {x:up.x,y:up.y,z:up.z},
              right: {x:right.x,y:right.y,z:right.z},
              forward: {x:forward.x,y:forward.y,z:forward.z}
            };
          }
        }
        if (j && j.r && Array.isArray(j.r) && j.r.length === 3){
          calibR = j.r;
        }
        if (j && typeof j.alpha0 === "number"){
          calibAlpha0 = j.alpha0;
        }
      }catch(_){}
    }

    function saveCalibBasis(){
      if (!calibBasis) return;
      try{
        localStorage.setItem(CALIB_BASIS_KEY, JSON.stringify({
          up: calibBasis.up,
          right: calibBasis.right,
          forward: calibBasis.forward,
          r: calibR,
          alpha0: calibAlpha0
        }));
      }catch(_){}
    }


    function loadGestureBank(){
      try{
        const raw = localStorage.getItem(GESTURE_BANK_KEY);
        if (!raw) return;
        const j = JSON.parse(raw);
        if (j && typeof j === "object"){
          if (j.templates && typeof j.templates === "object") gestureBank.templates = j.templates;
          if (typeof j.mastery === "number") gestureBank.mastery = clamp01(j.mastery);
        }
      }catch(_){}
    }

    function saveGestureBank(){
      try{
        localStorage.setItem(GESTURE_BANK_KEY, JSON.stringify({
          templates: gestureBank.templates,
          mastery: gestureBank.mastery
        }));
      }catch(_){}
    }

    function loadGravityLock(){
      try{
        const raw = localStorage.getItem(GRAVITY_LOCK_KEY);
        if (!raw) return;
        const j = JSON.parse(raw);
        if (j && isFinite(j.x) && isFinite(j.y) && isFinite(j.z)){
          const g = vNorm({ x:j.x, y:j.y, z:j.z });
          if (g.mag > 0.5) gravityLock = { x:g.x, y:g.y, z:g.z };
        }
      }catch(_){}
    }

    function saveGravityLock(){
      if (!gravityLock) return;
      try{
        localStorage.setItem(GRAVITY_LOCK_KEY, JSON.stringify(gravityLock));
      }catch(_){}
    }

    function clearGestureBank(){
      gestureBank.templates = {};
      saveGestureBank();
      gravityLock = null;
      try{
        localStorage.removeItem(GRAVITY_LOCK_KEY);
      }catch(_){}
    }

    function setLabOpen(on){
      lab.open = !!on;
      labModal.classList.toggle("on", lab.open);
      labModal.setAttribute("aria-hidden", lab.open ? "false" : "true");
    }

    function setLabelSelection(label){
      lab.selectedLabel = label;
      const btns = labelGroup ? labelGroup.querySelectorAll(".labLabelBtn") : [];
      btns.forEach((b) => b.classList.toggle("on", b.dataset.label === label));
    }

    function setProgress(el, v01){
      if (!el) return;
      const p = clamp01(v01) * 100;
      el.style.width = p.toFixed(1) + "%";
    }

    function updateGravityReadout(){
      if (!gravityReadout) return;
      if (!gravityLock){
        gravityReadout.textContent = "g: —";
        return;
      }
      gravityReadout.textContent =
        `g: ${gravityLock.x.toFixed(2)}, ${gravityLock.y.toFixed(2)}, ${gravityLock.z.toFixed(2)}`;
    }

    function updateMasteryUI(){
      const m = clamp01(gestureBank.mastery);
      if (masterySlider) masterySlider.value = String(m);
      if (masteryReadout) masteryReadout.textContent = m.toFixed(2);
    }

    function basisFromGravity(gHat){
      const zAxis = { x:-gHat.x, y:-gHat.y, z:-gHat.z }; // up
      let ref = { x:0, y:1, z:0 };
      if (Math.abs(vDot(ref, zAxis)) > 0.95) ref = { x:1, y:0, z:0 };
      const xAxis = vNorm(vCross(ref, zAxis));
      const yAxis = vCross(zAxis, xAxis);
      return { xAxis, yAxis, zAxis };
    }


    // =========================================================================
    // RELAY (Ably via Cloudflare Worker token) — logic preserved
    // =========================================================================
    const WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";
    const TOKEN_URL = WORKER_BASE + "/token";

    function normalizeRoom(input){
      let r = String(input || "").trim();
      if (!r) r = "orb:test";
      if (r.indexOf(":") === -1) r = "orb:" + r;
      const code = stripOrbPrefix(r).trim();
      if (!code) r = "orb:test";
      return r;
    }

    function stripOrbPrefix(room){
      return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
    }

    function parseRoom() {
      const u = new URL(window.location.href);
      const raw = (u.searchParams.get("room") || "").trim();
      const channelName = normalizeRoom(raw);
      const roomCode = stripOrbPrefix(channelName);
      return { raw, roomCode, channelName };
    }

    let ably = null;
    let ablyChannel = null;

    const roomInfo = parseRoom();
    const room = roomInfo.channelName;
    const roomCode = roomInfo.roomCode;

    async function connectRelay() {
      try { if (ablyChannel) ablyChannel.detach(); } catch(e) {}
      try { if (ably) ably.close(); } catch(e) {}
      ably = null; ablyChannel = null;

      const authUrl =
        TOKEN_URL +
        "?room=" + encodeURIComponent(roomCode) +
        "&clientId=" + encodeURIComponent("phone-" + Math.random().toString(16).slice(2,6));

      // Quick preflight (kept)
      try {
        const r = await fetch(authUrl, { method: "GET", cache: "no-store" });
        const j = await r.json();
        if (!r.ok || !j.token) return false;
      } catch (e) {
        return false;
      }

      ably = new Ably.Realtime({ authUrl, autoConnect: true });
      ablyChannel = ably.channels.get(room);

      // Await attach so we don’t publish into a not-yet-attached channel.
      await new Promise((resolve) => {
        ablyChannel.attach(() => resolve());
      });

      try { ablyChannel.unsubscribe("ctl"); } catch(_) {}
      ablyChannel.subscribe("ctl", (msg) => {
        const d = (msg && msg.data) ? msg.data : {};
        if (d && d.calibrate){
          startCalibration();
        }
      });

      return true;
    }

    function disconnectRelay() {
      try { if (ablyChannel) ablyChannel.detach(); } catch(e) {}
      try { if (ably) ably.close(); } catch(e) {}
      ably = null; ablyChannel = null;
    }

    // =========================================================================
    // NETWORK THROTTLE (unchanged)
    // =========================================================================
    const SEND_HZ = 12;
    const SEND_MIN_MS = 1000 / SEND_HZ;

    // =========================================================================
    // TELEMETRY SIZE SWITCH
    // =========================================================================
    const TELEMETRY = false;
    const TELEMETRY_URL = (() => {
      try {
        const u = new URL(location.href);
        return (u.searchParams.get("telemetry") === "1");
      } catch { return false; }
    })();
    const TELEMETRY_ON = TELEMETRY || TELEMETRY_URL;

    // =========================================================================
    // 1) FALL DRAG DEFAULT (requested)
    // =========================================================================
    const FALL_DRAG_DEFAULT = 1.0;

    // EPS for signature-gated publishing
    const EPS = {
      energy01:    0.006,
      groove01:    0.008,
      dynamics01:  0.008,
      smooth01:    0.008,
      speed01:     0.008,
      shake01:     0.015,
      hz:          0.030,

      // NEW: streamed vectors (quantized) eps
      ag:          0.15, // m/s^2-ish scale
      rr:          2.0,  // deg/sec scale
    };

    let nextSendAtMs = 0;
    let lastSig = null;

    function roundN(x, n=4){
      const v = Number(x);
      if (!isFinite(v)) return 0;
      const p = Math.pow(10, n);
      return Math.round(v * p) / p;
    }

    function buildSigFromPayload(p){
      // streamed vectors are intentionally quantized for size + stability
      const ag = p.ag || [0,0,0];
      const rr = p.rr || [0,0,0];

      return {
        energy01:    roundN(p.energy01, 4),
        groove01:    roundN(p.groove01, 4),
        dynamics01:  roundN(p.dynamics01, 4),
        smooth01:    roundN(p.smooth01, 4),
        speed01:     roundN(p.speed01, 4),
        shake01:     roundN(p.shake01, 4),
        locked:      !!p.locked,
        shakeHit:    !!p.shakeHit,
        hz:          roundN(p.hz, 3),

        // NEW: streamed vectors (sig uses same quantization as payload)
        agx: roundN(ag[0], 2),
        agy: roundN(ag[1], 2),
        agz: roundN(ag[2], 2),

        rrx: roundN(rr[0], 1),
        rry: roundN(rr[1], 1),
        rrz: roundN(rr[2], 1),
      };
    }

    function sigChanged(sig){
      if (!lastSig) return true;

      if (sig.shakeHit && !lastSig.shakeHit) return true;
      if (sig.locked !== lastSig.locked) return true;

      if (Math.abs(sig.energy01   - lastSig.energy01)   > EPS.energy01) return true;
      if (Math.abs(sig.groove01   - lastSig.groove01)   > EPS.groove01) return true;
      if (Math.abs(sig.dynamics01 - lastSig.dynamics01) > EPS.dynamics01) return true;
      if (Math.abs(sig.smooth01   - lastSig.smooth01)   > EPS.smooth01) return true;
      if (Math.abs(sig.speed01    - lastSig.speed01)    > EPS.speed01) return true;
      if (Math.abs(sig.shake01    - lastSig.shake01)    > EPS.shake01) return true;
      if (Math.abs(sig.hz         - lastSig.hz)         > EPS.hz) return true;

      // NEW: streamed vectors gating
      if (Math.abs(sig.agx - lastSig.agx) > EPS.ag) return true;
      if (Math.abs(sig.agy - lastSig.agy) > EPS.ag) return true;
      if (Math.abs(sig.agz - lastSig.agz) > EPS.ag) return true;

      if (Math.abs(sig.rrx - lastSig.rrx) > EPS.rr) return true;
      if (Math.abs(sig.rry - lastSig.rry) > EPS.rr) return true;
      if (Math.abs(sig.rrz - lastSig.rrz) > EPS.rr) return true;

      return false;
    }

    // =========================================================================
    // publishDynamics trims payload when TELEMETRY_ON is false
    // =========================================================================
    function publishDynamics(payload, dt, force=false) {
      if (!ablyChannel) return;

      const now = performance.now();
      if (!force && now < nextSendAtMs) return;

      const sig = buildSigFromPayload(payload);
      if (!force && !sigChanged(sig)) return;

      lastSig = sig;
      nextSendAtMs = now + SEND_MIN_MS;


      const out = {
        room: payload.room,
        fallDrag: FALL_DRAG_DEFAULT,

        energy01:   sig.energy01,
        groove01:   sig.groove01,
        dynamics01: sig.dynamics01,
        smooth01:   sig.smooth01,
        speed01:    sig.speed01,
        shake01:    sig.shake01,
        locked:     sig.locked,
        shakeHit:   sig.shakeHit,
        hz:         sig.hz,

        // Compact payload (keep)
        a: [sig.agx, sig.agy, sig.agz],  // accelIncludingGravity
        r: [sig.rrx, sig.rry, sig.rrz],  // rotationRate
      };

      if (payload.sd) out.sd = payload.sd;
      if (payload.calib) out.calib = payload.calib;


      if (TELEMETRY_ON) {
        out.t     = roundN(payload.t, 1);
        out.dt    = roundN(payload.dt, 4);
        out.wRaw  = roundN(payload.wRaw, 2);
        out.wCap  = roundN(payload.wCap, 2);
        out.wFilt = roundN(payload.wFilt, 2);
        out.cap   = roundN(payload.cap, 2);

        out.d_r2      = roundN(payload.d_r2, 4);
        out.d_r3      = roundN(payload.d_r3, 4);
        out.d_gate    = roundN(payload.d_gate, 4);
        out.d_balance = roundN(payload.d_balance, 4);
        out.d_couple  = roundN(payload.d_couple, 4);
      }

      ablyChannel.publish("orb", out, (err) => {
        if (err) console.warn("[ably publish err]", err);
      });
    }

    // =========================================================================
    // DIAL PACK v4 — base detection (PRESERVED)
    // =========================================================================
    const OMEGA_LPF = 0.22;

    const HUNT_WINDOW_SEC   = .80;
    const STABLE_WINDOW_SEC = 1.60;

    const MIN_WINDOW_SAMPLES = 28;
    const MAX_WINDOW_SAMPLES = 260;

    const MIN_OMEGA = 0.02;

    const LOCK_ON  = 0.30;
    const LOCK_OFF = 0.22;

    const MIN_HZ = 0.55;
    const MAX_HZ = 2.30;

    const JERK_TIGHT = 220.0;
    const JERK_LOOSE = 2600.0;

    // =========================================================================
    // DYNAMICS — v4.0 (DIRECTIONAL DIVERSITY, 1s window) — functionally same
    // =========================================================================
    const DYNAMICS_WINDOW_SEC = 1.00;
    const DYNAMICS_FLOOR = 0.18;

    const DYNAMICS_UI_EXP  = 1.0;
    const DYNAMICS_UI_GAIN = 3.5;

    const DYNAMICS_ACTIVITY_MIN01 = 0.06;
    const DYNAMICS_ACTIVITY_POW   = 1.15;

    const ENERGY_GAIN_LOCKED = 1.25;
    const ENERGY_GAIN_FREE   = 0.65;

    const ENERGY_DECAY       = 0.1;

    const UI_SMOOTH   = 0.10;
    const LOCK_SMOOTH = 0.14;

    const GROOVE_EXP    = 0.70;
    const SMOOTH_EXP    = 0.70;
    const DYNAMICS_EXP  = 1.00;

    const EARN_SCALE = 1.00;

    const COAST_QUALITY_MIN  = 0.28;
    const COAST_DECAY_MULT   = 0.65;

    const SMOOTH_KILL_THRESH     = 0.12;
    const SMOOTH_KILL_DECAY_MULT = 3.25;
    const SMOOTH_KILL_UNLOCK     = true;

    const GRACE_SEC = 0.75;

    const RECENTER_SEC = 0.85;
    const RECENTER_GROOVE_MAX = 0.22;

    const NORM_ALPHA = 0.10;

    // ============================================================================
    // SPEED METER — tuned for “force” (rotationRate magnitude, deg/sec)
    // ============================================================================
    const SPEED_DEAD_DPS = 8.0;
    const SPEED_CAP_DPS  = 360.0;

    const SPEED_EMA_CUTOFF_FAST_HZ = 1.5;
    const SPEED_EMA_CUTOFF_SLOW_HZ = .10;

    const SPEED_ADAPT_START_DPS = 18.0;
    const SPEED_ADAPT_END_DPS   = 130.0;

    const SPEED_ADAPT_POW = 1.0;

    const SPEED_NORM_DPS = 300.0;
    const SPEED_MAP_POW  = 1.10;

    const SPEED_ATTACK_HZ  = 5.0;
    const SPEED_RELEASE_HZ = 8.0;

    // =========================================================================
    // DISRUPTOR v3 — SHAKE (FAST HIT + SLOW METER) + LOW-SMOOTH BOOST
    // =========================================================================
    const SHAKE_BASELINE_HZ = 0.75;
    const SHAKE_HP_DEAD_G   = 0.35;
    const SHAKE_JERK_DEAD   = 6.0;

    const SHAKE_HP_WEIGHT   = 1.00;
    const SHAKE_JERK_WEIGHT = 0.35;

    const SHAKE_METER_GAIN  = 2.60;
    const SHAKE_METER_DECAY = 2.60;

    const SHAKE_SMOOTH_BOOST_START   = 0.45;
    const SHAKE_SMOOTH_THR_DROP_MAX  = 0.60;

    // =========================================================================
    // NEW SHAKE WIN RULE:
    // "When shake meter hits 100% twice in 500ms" => shakeHit
    // =========================================================================
    const SHAKE_WIN_WINDOW_SEC = 0.90;
    const SHAKE_FULL_HI = 0.50;

    // =========================================================================
    // AUDIO MAPPING (preserved)
    // =========================================================================
    const AUDIO_GATE   = 0.02;
    const AUDIO_MIN_DB = -42;
    const AUDIO_MAX_DB = -6;
    const AUDIO_EXP    = 1.15;

    const MASTER_GAIN  = 2.2;

    const TONE_BASE_HZ    = 180;
    const TONE_MAX_ADD_HZ = 220;

    // =========================================================================
    // Helpers
    // =========================================================================
    const lerp = (a,b,t) => a + (b-a)*t;
    const mag3 = (x,y,z) => Math.sqrt(x*x+y*y+z*z);
    const dbToGain = (db) => Math.pow(10, db/20);

    function alphaFromCutoff(dt, cutoffHz){
      const tau = 1 / (2 * Math.PI * cutoffHz);
      return 1 / (1 + tau / Math.max(1e-4, dt));
    }

    function median(arr) {
      if (!arr.length) return 0;
      const a = arr.slice().sort((x,y) => x - y);
      const mid = (a.length - 1) / 2;
      const lo = Math.floor(mid), hi = Math.ceil(mid);
      return (a[lo] + a[hi]) / 2;
    }

    function energyToGain(e) {
      if (e <= AUDIO_GATE) return 0;
      const x = (e - AUDIO_GATE) / (1 - AUDIO_GATE);
      const shaped = Math.pow(clamp01(x), AUDIO_EXP);
      const db = AUDIO_MIN_DB + (AUDIO_MAX_DB - AUDIO_MIN_DB) * shaped;
      return dbToGain(db);
    }

    function autocorrPeak(signal, dt) {
      const n = signal.length;
      if (n < 24) return {peak: 0, lag: 0, hz: 0};

      let mean=0;
      for (let i=0;i<n;i++) mean += signal[i];
      mean /= n;

      let varr=0;
      for (let i=0;i<n;i++) {
        const d = signal[i]-mean;
        varr += d*d;
      }
      if (varr < 1e-9) return {peak: 0, lag: 0, hz: 0};

      const minLag = Math.max(2, Math.floor(1/(MAX_HZ*dt)));
      const maxLag = Math.min(n-3, Math.floor(1/(MIN_HZ*dt)));

      let best = -1;
      let bestLag = 0;

      for (let lag=minLag; lag<=maxLag; lag++) {
        let c=0;
        for (let i=0;i<n-lag;i++) c += (signal[i]-mean) * (signal[i+lag]-mean);
        const r = c / varr;
        if (r > best) { best = r; bestLag = lag; }
      }

      const hz = bestLag > 0 ? (1/(bestLag*dt)) : 0;
      return {peak: clamp01(best), lag: bestLag, hz};
    }

    function smoothnessFromJerk(avgJerk) {
      const t = (JERK_LOOSE - avgJerk) / (JERK_LOOSE - JERK_TIGHT);
      return clamp01(t);
    }

    function dynamicsActivityGate(speed01){
      const v = clamp01(speed01 || 0);
      const x = (v - DYNAMICS_ACTIVITY_MIN01) / (1 - DYNAMICS_ACTIVITY_MIN01);
      return Math.pow(clamp01(x), DYNAMICS_ACTIVITY_POW);
    }

    function computeAvg(arr) {
      if (!arr.length) return 0;
      let s=0;
      for (const x of arr) s+=x;
      return s/arr.length;
    }

    function trimToWindow(dtMean, targetSec, omegaMag, omegaNorm, omegaVec, jerkBuf, dtBuf) {
      let targetN = dtMean > 1e-4 ? Math.round(targetSec / dtMean) : MAX_WINDOW_SAMPLES;
      targetN = Math.max(MIN_WINDOW_SAMPLES, Math.min(MAX_WINDOW_SAMPLES, targetN));

      while (omegaMag.length  > targetN) omegaMag.shift();
      while (omegaNorm.length > targetN) omegaNorm.shift();
      while (omegaVec.length  > targetN) omegaVec.shift();
      while (jerkBuf.length   > targetN) jerkBuf.shift();
      while (dtBuf.length     > targetN) dtBuf.shift();

      return targetN;
    }

    // =========================================================================
    // Dynamics diversity window buffer (time-based, ~1000ms)
    // =========================================================================
    const dynamicsVecBuf = [];
    const dynamicsDtBuf  = [];

    function dynamicsBufPush(vec, dt){
      const d = Math.max(1e-4, Number(dt) || 0);
      dynamicsVecBuf.push(vec);
      dynamicsDtBuf.push(d);

      let acc = 0;
      for (let i = dynamicsDtBuf.length - 1; i >= 0; i--){
        acc += dynamicsDtBuf[i];
        if (acc >= 2.5) {
          dynamicsVecBuf.splice(0, i);
          dynamicsDtBuf.splice(0, i);
          break;
        }
      }
    }

    function dynamicsDiversityLastSec(windowSec){
      const W = Math.max(0.2, Number(windowSec) || 1.0);

      let sumW = 0;
      let sx = 0, sy = 0, sz = 0;

      for (let i = dynamicsVecBuf.length - 1; i >= 0; i--){
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
      const mx = sx * inv, my = sy * inv, mz = sz * inv;
      const R = clamp01(Math.sqrt(mx*mx + my*my + mz*mz));
      const div01 = clamp01(1 - R);

      return { div01, R, n: dynamicsVecBuf.length };
    }

    // =========================================================================
    // Meter continuity (logic preserved; no UI)
    // =========================================================================
    const METER_HOLD_SEC = 0.55;
    const METER_FADE_HZ  = 3.0;

    // =========================================================================
    // State
    // =========================================================================
    let running = false;
    let lastT = null;

    let ox=0, oy=0, oz=0;

    const omegaMag  = [];
    const omegaNorm = [];
    const omegaVec  = [];
    const jerkBuf   = [];
    const dtBuf     = [];

    let emaMean = 0;
    let emaVar  = 1;

    let lock = false;
    let lockStrength = 0;
    let grooveHz = 0;

    let graceLeft = 0;
    let recenterBadTime = 0;

    let energy = 0;
    let energyUI = 0;

    let mSpeedEMA = 0;
    let speedOut  = 0;

    let meterHoldLeft = 0;
    let lastGrooveUI = 0;
    let lastDynamicsUI  = 0;
    let lastSmoothUI = 0;

    // SHAKE state
    let shake01 = 0;

    let accelBaseMag = 9.81;
    let prevAx = 0, prevAy = 0, prevAz = 0;
    let prevAmag = 9.81;

    let shakeFullTimes = [];

    let audioCtx = null, osc = null, gainNode = null;

    function ensureAudio() {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;

      osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = TONE_BASE_HZ;

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
    }

    function setAudio(eUI, groove, locked) {
      if (!audioCtx || !gainNode || !osc) return;

      const gBase = energyToGain(clamp01(eUI));
      const gGroove = locked ? (0.30 + 0.70*groove) : (0.08 + 0.22*groove);
      const g = MASTER_GAIN * gBase * gGroove;

      const f = TONE_BASE_HZ
              + TONE_MAX_ADD_HZ * (locked ? groove : 0.30*groove)
              + 60 * clamp01(eUI);

      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setTargetAtTime(g, now, 0.06);

      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setTargetAtTime(f, now, 0.06);
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

      const dtFade = Math.max(1e-3, dt || computeAvg(dtBuf.slice(-50)) || 1/60);
      const aFade = alphaFromCutoff(dtFade, METER_FADE_HZ);
      const holding = meterHoldLeft > 0;

      const grooveOut   = holding ? lastGrooveUI   : (1 - aFade) * lastGrooveUI;
      const dynamicsOut = holding ? lastDynamicsUI : (1 - aFade) * lastDynamicsUI;
      const smoothOut   = holding ? lastSmoothUI   : (1 - aFade) * lastSmoothUI;

      lastGrooveUI   = grooveOut;
      lastDynamicsUI = dynamicsOut;
      lastSmoothUI   = smoothOut;

      return { grooveOut, dynamicsOut, smoothOut };
    }

    function updateSpeedV0(wRawDps, dt) {
      const dtSafe = Math.max(1e-3, dt || 1/60);

      const wRaw = Math.max(0, wRawDps || 0);
      const cap  = SPEED_CAP_DPS;
      const wCap = Math.min(wRaw, cap);

      const wDz = Math.max(0, wCap - SPEED_DEAD_DPS);

      const denom = Math.max(1e-6, (SPEED_ADAPT_END_DPS - SPEED_ADAPT_START_DPS));
      let tAdapt = (wDz - SPEED_ADAPT_START_DPS) / denom;
      tAdapt = clamp01(tAdapt);
      tAdapt = Math.pow(tAdapt, SPEED_ADAPT_POW);

      const cutoffHz = lerp(SPEED_EMA_CUTOFF_FAST_HZ, SPEED_EMA_CUTOFF_SLOW_HZ, tAdapt);
      const aE = alphaFromCutoff(dtSafe, cutoffHz);

      mSpeedEMA = (mSpeedEMA === 0) ? wDz : ((1 - aE) * mSpeedEMA + aE * wDz);
      const wFilt = mSpeedEMA;

      const n = clamp01(wFilt / SPEED_NORM_DPS);
      const target = Math.pow(n, SPEED_MAP_POW);

      const aAtk = alphaFromCutoff(dtSafe, SPEED_ATTACK_HZ);
      const aRel = alphaFromCutoff(dtSafe, SPEED_RELEASE_HZ);
      const a = (target >= speedOut) ? aAtk : aRel;
      speedOut = (1 - a) * speedOut + a * target;

      return { cap, dt: dtSafe, wRaw, wCap, wDz, wFilt, speed: speedOut, cutoffHz, tAdapt };
    }

    // =========================================================================
    // SHAKE — meter unchanged; shakeHit double 100% within 500ms
    // =========================================================================
    function updateShake(e, t, dt, groove01=0, locked=false, smooth01=1){
      const acc = e.accelerationIncludingGravity || e.acceleration;
      const dtSafe = Math.max(1e-3, dt || 1/60);

      const prevShake = shake01;

      if (!acc) {
        shake01 = Math.max(0, shake01 - SHAKE_METER_DECAY * dtSafe);
        return { shake01, shakeHit:false, spike:0, amag:0, jerk:0 };
      }

      const ax = Number(acc.x) || 0;
      const ay = Number(acc.y) || 0;
      const az = Number(acc.z) || 0;

      const amag = mag3(ax, ay, az);

      // baseline magnitude (LPF)
      const aBase = alphaFromCutoff(dtSafe, SHAKE_BASELINE_HZ);
      accelBaseMag = (isFinite(accelBaseMag) ? accelBaseMag : amag);
      accelBaseMag = (1 - aBase) * accelBaseMag + aBase * amag;

      // high-pass impact
      const hp = Math.abs(amag - accelBaseMag);
      const hpSpike = Math.max(0, hp - SHAKE_HP_DEAD_G);

      // jerk (delta accel / sec)
      const dax = ax - prevAx;
      const day = ay - prevAy;
      const daz = az - prevAz;
      const jerk = mag3(dax, day, daz) / dtSafe;
      const jerkSpike = Math.max(0, jerk - SHAKE_JERK_DEAD);

      prevAx = ax; prevAy = ay; prevAz = az;
      prevAmag = amag;

      const spike = (SHAKE_HP_WEIGHT * hpSpike) + (SHAKE_JERK_WEIGHT * (jerkSpike / 80.0));

      shake01 = clamp01(shake01 + SHAKE_METER_GAIN * spike * dtSafe - SHAKE_METER_DECAY * dtSafe);

      // "full meter" rising edge tracking
      const hitFull = (prevShake < SHAKE_FULL_HI) && (shake01 >= SHAKE_FULL_HI);
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

    // =========================================================================
    // Gesture Lab — motion history + template pipeline
    // =========================================================================
    const motionHist = []; // { t, ax, ay, az }

    function pushMotionSample(tMs, ax, ay, az){
      motionHist.push({ t: tMs, ax, ay, az });
      const cutoff = tMs - MOTION_HIST_MS;
      while (motionHist.length && motionHist[0].t < cutoff) motionHist.shift();
    }

    function trimByImpulse(samples, gHat){
      let i0 = -1, i1 = -1;
      for (let i = 0; i < samples.length; i++){
        const s = samples[i];
        const aRaw = { x:s.ax, y:s.ay, z:s.az };
        const aLin = vSub(aRaw, vScale(gHat, vDot(aRaw, gHat)));
        const mag = Math.hypot(aLin.x, aLin.y, aLin.z);
        if (mag > START_THR){
          if (i0 === -1) i0 = i;
          i1 = i;
        }
      }
      if (i0 === -1 || i1 === -1 || i1 <= i0) return null;
      return { i0, i1 };
    }

    function resampleSamples(samples, t0, t1, n){
      const out = [];
      const dur = Math.max(1e-3, t1 - t0);
      let i = 0;
      for (let k = 0; k < n; k++){
        const tk = t0 + (dur * k) / (n - 1);
        while (i < samples.length - 1 && samples[i + 1].t < tk) i++;
        const s0 = samples[i];
        const s1 = samples[Math.min(i + 1, samples.length - 1)];
        const dt = (s1.t - s0.t);
        const u = dt > 1e-6 ? (tk - s0.t) / dt : 0;
        out.push({
          t: tk,
          ax: lerp(s0.ax, s1.ax, u),
          ay: lerp(s0.ay, s1.ay, u),
          az: lerp(s0.az, s1.az, u)
        });
      }
      return out;
    }

    function buildTemplateFromSamples(samples, gHat){
      if (!samples || samples.length < 4) return null;
      const trim = trimByImpulse(samples, gHat);
      if (!trim) return null;

      const s0 = samples[trim.i0];
      const s1 = samples[trim.i1];
      const t0 = s0.t;
      const t1 = s1.t;
      const dur = t1 - t0;
      if (dur < MIN_REC_MS) return null;

      const window = samples.slice(trim.i0, trim.i1 + 1);
      const resampled = resampleSamples(window, t0, t1, RESAMPLE_N);
      const basis = basisFromGravity(gHat);

      const seq = [];
      let peak = 0;
      for (const s of resampled){
        const aRaw = { x:s.ax, y:s.ay, z:s.az };
        const aLin = vSub(aRaw, vScale(gHat, vDot(aRaw, gHat)));
        const vx = vDot(aLin, basis.xAxis);
        const vy = vDot(aLin, basis.yAxis);
        const vz = vDot(aRaw, basis.zAxis);
        const mag = Math.hypot(vx, vy, vz);
        if (mag > peak) peak = mag;
        seq.push([vx, vy, vz]);
      }

      let sumSq = 0;
      for (const v of seq) sumSq += v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
      const rms = Math.sqrt(sumSq / Math.max(1, seq.length * 3));
      const eps = 1e-6;
      const norm = rms + eps;
      const shape = [];
      for (const v of seq){
        shape.push(v[0]/norm, v[1]/norm, v[2]/norm);
      }

      const quality = clamp01(peak / (rms * 3 + eps));

      return { shape, power: peak, rms, quality, dur };
    }

    function matchTemplates(candidate){
      if (!candidate || !candidate.shape || !candidate.shape.length) return null;
      const cand = candidate.shape;
      let candNorm = 0;
      for (const v of cand) candNorm += v*v;
      candNorm = Math.sqrt(Math.max(1e-6, candNorm));

      let best = null;
      let bestScore = -1;

      const POWER_MIN_FRAC = lerp(0.50, 0.78, mastery);

      for (const label of Object.keys(gestureBank.templates)){
        const t = gestureBank.templates[label];
        if (!t || !Array.isArray(t.shape) || !isFinite(t.power)) continue;
        if (t.shape.length !== cand.length) continue;
        let dot = 0;
        let tNorm = 0;
        for (let i = 0; i < cand.length; i++){
          dot += cand[i] * t.shape[i];
          tNorm += t.shape[i] * t.shape[i];
        }
        tNorm = Math.sqrt(Math.max(1e-6, tNorm));
        const similarity = dot / (candNorm * tNorm);
        const powerOk = (candidate.power >= (t.power * POWER_MIN_FRAC));
        const powerScale = clamp01(candidate.power / (t.power + 1e-6));
        const finalScore = similarity * powerScale;

        if (finalScore > bestScore){
          bestScore = finalScore;
          best = { label, score: finalScore, similarity, powerOk };
        }
      }

      if (!best) return null;
      const mastery = clamp01(gestureBank.mastery);
      const SCORE_THR = lerp(0.68, 0.82, mastery);
      if (!best.powerOk || best.score < SCORE_THR) return null;
      return best;
    }

    function recognizeGestureFromRecentBuffer(nowMs){
      if (!gravityLock) return null;
      const cutoff = nowMs - HIT_WIN_MAX_MS;
      const samples = motionHist.filter(s => s.t >= cutoff);
      if (!samples.length) return null;
      const candidate = buildTemplateFromSamples(samples, gravityLock);
      if (!candidate) return null;
      const match = matchTemplates(candidate);
      if (match) return match;
      return null;
    }

    function setRecordStatus(msg){
      if (recordStatus) recordStatus.textContent = msg;
    }

    function beginGravityLock(){
      lab.locking = true;
      lab.lockBuf.length = 0;
      setProgress(lockGravityBar, 0);
      setRecordStatus("Locking gravity… hold still");
    }

    function updateGravityLocking(aRaw){
      if (!lab.locking) return;
      const u = vNorm(aRaw);
      if (!(u.mag > 1e-6)) return;
      lab.lockBuf.push({ x:u.x, y:u.y, z:u.z });
      const LOCK_SAMPLES = 24;
      if (lab.lockBuf.length > LOCK_SAMPLES) lab.lockBuf.shift();

      let sx=0, sy=0, sz=0;
      for (const s of lab.lockBuf){ sx+=s.x; sy+=s.y; sz+=s.z; }
      const n = lab.lockBuf.length;
      const m = Math.hypot(sx,sy,sz);
      const resultant = (n > 0) ? (m / n) : 0;
      const progress = clamp01((lab.lockBuf.length / LOCK_SAMPLES) * ((resultant - 0.92) / 0.06));
      setProgress(lockGravityBar, progress);

      if (progress >= 1){
        const g = vNorm({ x:sx, y:sy, z:sz });
        gravityLock = { x:g.x, y:g.y, z:g.z };
        saveGravityLock();
        lab.locking = false;
        updateGravityReadout();
        setRecordStatus("Gravity locked");
      }
    }

    function beginRecording(nowMs){
      if (!gravityLock){
        setRecordStatus("Lock gravity first");
        return;
      }
      lab.recording = true;
      lab.recordSamples = [];
      lab.recordStartedAtMs = nowMs;
      lab.lastCandidate = null;
      setProgress(qualityBar, 0);
      setRecordStatus(`Recording ${lab.selectedLabel}…`);

      // pre-roll
      const preCut = nowMs - PRE_ROLL_MS;
      for (const s of motionHist){
        if (s.t >= preCut) lab.recordSamples.push({ ...s });
      }

      recordBtn.disabled = true;
      stopBtn.disabled = false;
      saveBtn.disabled = true;
    }

    function endRecording(){
      lab.recording = false;
      stopBtn.disabled = true;
      recordBtn.disabled = false;

      if (!gravityLock){
        setRecordStatus("Lock gravity first");
        return;
      }

      const candidate = buildTemplateFromSamples(lab.recordSamples, gravityLock);
      if (!candidate){
        lab.lastCandidate = null;
        setProgress(qualityBar, 0);
        setRecordStatus("Too short or too still");
        saveBtn.disabled = true;
        return;
      }

      lab.lastCandidate = candidate;
      lab.lastQuality = candidate.quality;
      setProgress(qualityBar, candidate.quality);
      setRecordStatus(`Captured ${lab.selectedLabel} (${candidate.dur.toFixed(0)}ms)`);
      saveBtn.disabled = false;
    }

    loadGestureBank();
    loadGravityLock();
    loadCalibBasis();
    updateMasteryUI();
    updateGravityReadout();
    setLabelSelection(lab.selectedLabel);

    if (labBtn) labBtn.onclick = () => setLabOpen(true);
    if (labClose) labClose.onclick = () => setLabOpen(false);

    if (labelGroup){
      labelGroup.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest(".labLabelBtn");
        if (!btn) return;
        const label = btn.dataset.label || "U";
        setLabelSelection(label);
      });
    }

    if (lockGravityBtn) lockGravityBtn.onclick = () => beginGravityLock();
    if (recordBtn) recordBtn.onclick = () => beginRecording(performance.now());
    if (stopBtn) stopBtn.onclick = () => endRecording();
    if (saveBtn) saveBtn.onclick = () => {
      if (!lab.lastCandidate) return;
      gestureBank.templates[lab.selectedLabel] = {
        shape: lab.lastCandidate.shape,
        power: lab.lastCandidate.power
      };
      saveGestureBank();
      setRecordStatus(`Saved ${lab.selectedLabel}`);
      saveBtn.disabled = true;
    };

    if (testToggle){
      testToggle.onchange = () => {
        lab.testMode = !!testToggle.checked;
        if (!lab.testMode && testReadout) testReadout.textContent = "Match: —";
      };
    }

    if (masterySlider){
      masterySlider.oninput = () => {
        gestureBank.mastery = clamp01(Number(masterySlider.value));
        updateMasteryUI();
        saveGestureBank();
      };
    }

    if (resetLabBtn){
      resetLabBtn.onclick = () => {
        clearGestureBank();
        updateGravityReadout();
        setProgress(qualityBar, 0);
        setProgress(lockGravityBar, 0);
        if (testReadout) testReadout.textContent = "Match: —";
        setRecordStatus("Reset");
      };
    }


    // =========================================================================
    // Calibration + Directional Impulse (phone-side)
    // =========================================================================
    const impulseHist = []; // { t, ax, ay, az }

    const calib = {
      active: false,
      startMs: 0,
      samples: [],
      ackPending: false,
      pendingReq: false
    };

    function startCalibration(){
      if (!running){
        calib.pendingReq = true;
        return;
      }
      calib.pendingReq = false;
      calib.active = true;
      calib.startMs = performance.now();
      calib.samples = [];
    }

    function finishCalibration(){
      if (!calib.samples.length) {
        calib.active = false;
        return;
      }
      let sx=0, sy=0, sz=0;
      for (const s of calib.samples){ sx+=s.ax; sy+=s.ay; sz+=s.az; }
      const n = calib.samples.length || 1;
      const gRaw = { x:sx/n, y:sy/n, z:sz/n };
      const gHatN = vNorm(gRaw);
      if (!(gHatN.mag > 0.5)) {
        calib.active = false;
        return;
      }

      if (!orientState || !orientState.R) {
        calib.active = false;
        return;
      }

      const gHat = { x:gHatN.x, y:gHatN.y, z:gHatN.z };
      const gHatWorld = matVec(orientState.R, gHat);
      const up = { x:-gHatWorld.x, y:-gHatWorld.y, z:-gHatWorld.z };

      // forward from phone top axis projected into desk plane (world frame)
      const topWorld = matVec(orientState.R, PHONE_TOP_AXIS);
      let f = vSub(topWorld, vScale(up, vDot(topWorld, up)));
      let fN = vNorm(f);
      if (!(fN.mag > 1e-6)){
        const alt = { x:1, y:0, z:0 };
        f = vSub(alt, vScale(up, vDot(alt, up)));
        fN = vNorm(f);
      }
      const forward = { x:fN.x, y:fN.y, z:fN.z };
      const rightN = vNorm(vCross(forward, up));
      const right = { x:rightN.x, y:rightN.y, z:rightN.z };

      calibBasis = { up, right, forward };
      calibR = orientState.R;
      calibAlpha0 = orientState && isFinite(orientState.alpha) ? orientState.alpha : calibAlpha0;
      saveCalibBasis();

      calib.active = false;
      calib.ackPending = true;
    }

    function classifyDirectionalShake(nowMs){
      if (!calibBasis) return null;
      if (!orientState || !orientState.R) return null;
      const t0 = nowMs - IMPULSE_WIN_MS;
      const basis = calibBasis;
      let sumUp = 0, sumRight = 0, sumForward = 0, n = 0;
      const gHat = { x:-basis.up.x, y:-basis.up.y, z:-basis.up.z };

      let meanUp = 0;
      for (let i = impulseHist.length - 1; i >= 0; i--){
        const s = impulseHist[i];
        if (s.t < t0) break;
        const aRaw = matVec(orientState.R, { x:s.ax, y:s.ay, z:s.az });
        meanUp += vDot(aRaw, basis.up);
        n++;
      }
      if (!n) return null;
      meanUp = meanUp / n;

      let upPos = { v:0, t:0 }, upNeg = { v:0, t:0 };
      let rPos = { v:0, t:0 }, rNeg = { v:0, t:0 };
      let fPos = { v:0, t:0 }, fNeg = { v:0, t:0 };
      for (let i = impulseHist.length - 1; i >= 0; i--){
        const s = impulseHist[i];
        if (s.t < t0) break;
        const aRaw = matVec(orientState.R, { x:s.ax, y:s.ay, z:s.az });
        const aLin = vSub(aRaw, vScale(gHat, vDot(aRaw, gHat)));
        const u = (vDot(aRaw, basis.up) - meanUp) * FLIP_U;
        const r = vDot(aLin, basis.right) * FLIP_R;
        const f = vDot(aLin, basis.forward) * FLIP_F;
        sumUp += u;
        sumRight += r;
        sumForward += f;
        if (u >= 0 && u > upPos.v) upPos = { v:u, t:s.t };
        if (u < 0 && -u > upNeg.v) upNeg = { v:-u, t:s.t };
        if (r >= 0 && r > rPos.v) rPos = { v:r, t:s.t };
        if (r < 0 && -r > rNeg.v) rNeg = { v:-r, t:s.t };
        if (f >= 0 && f > fPos.v) fPos = { v:f, t:s.t };
        if (f < 0 && -f > fNeg.v) fNeg = { v:-f, t:s.t };
      }

      const u = sumUp / n;
      const r = sumRight / n;
      const f = sumForward / n;

      const maxU = Math.max(upPos.v, upNeg.v);
      const maxR = Math.max(rPos.v, rNeg.v);
      const maxF = Math.max(fPos.v, fNeg.v);
      const maxAbs = Math.max(maxU, maxR, maxF);
      if (maxAbs < DIR_MIN_THR) return null;

      function pickSign(pos, neg){
        if (pos.v > 0 && neg.v > 0){
          // use earlier peak (drive) if opposite peak exists later
          return (pos.t < neg.t) ? 1 : -1;
        }
        if (pos.v > 0) return 1;
        if (neg.v > 0) return -1;
        return 0;
      }

      if (maxAbs === maxU) {
        const s = pickSign(upPos, upNeg);
        return (s >= 0) ? "U" : "D";
      }
      if (maxAbs === maxR) {
        const s = pickSign(rPos, rNeg);
        return (s >= 0) ? "R" : "L";
      }
      const s = pickSign(fPos, fNeg);
      return (s >= 0) ? "F" : "B";
    }

    const SD_SLOP_GATE = 0.18;
    const FLIP_U = 1;
    const FLIP_R = -1;
    const FLIP_F = -1;

    // =========================================================================
    // Motion listener helpers
    // =========================================================================
    function addMotionListener(){
      window.addEventListener('devicemotion', onMotion, { passive: true });
      window.addEventListener('deviceorientation', onOrient, { passive: true });
    }
    function removeMotionListener(){
      window.removeEventListener('devicemotion', onMotion);
      window.removeEventListener('deviceorientation', onOrient);
    }

    // =========================================================================
    // iOS permission gate (UI-less)
    // =========================================================================
    async function requestMotionPermissionIfNeeded() {
      const needs = (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function')
                 || (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function');

      if (!needs) return true;

      const reqs = [];

      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        reqs.push(DeviceMotionEvent.requestPermission().then(s => s === 'granted').catch(() => false));
      }

      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        reqs.push(DeviceOrientationEvent.requestPermission().then(s => s === 'granted').catch(() => false));
      }

      const results = await Promise.all(reqs);
      return results.every(Boolean);
    }

    function onOrient(e){
      // Option C: ignore yaw (alpha) to avoid drift; use gravity only (beta/gamma)
      const alpha = 0;
      const beta  = (e && e.beta  != null) ? Number(e.beta)  : 0;
      const gamma = (e && e.gamma != null) ? Number(e.gamma) : 0;
      orientState.alpha = isFinite(alpha) ? alpha : 0;
      orientState.beta = isFinite(beta) ? beta : 0;
      orientState.gamma = isFinite(gamma) ? gamma : 0;
      orientState.R = rotFromEuler(orientState.alpha, orientState.beta, orientState.gamma);
      orientState.has = true;
    }

    // =========================================================================
    // onMotion (core processing) — unchanged except:
    //  - we stream vectors: a=[agx,agy,agz], r=[rrx,rry,rrz]
    //  - no orientation flow / sd / oc/od
    // =========================================================================
    function onMotion(e) {
      if (!running) return;

      try {
        const t = performance.now() / 1000;
        const dt = (lastT == null) ? 0 : (t - lastT);
        const nowMs = t * 1000;
        lastT = t;

        if (dt > 0) dtBuf.push(dt);

        const lockedProxy = !!(lock || graceLeft > 0);
        const grooveProxy = clamp01(lockStrength || lastGrooveUI || 0);
        const smoothProxy = clamp01(lastSmoothUI || 0);

        const sh = updateShake(e, t, dt, grooveProxy, lockedProxy, smoothProxy);

        // NEW: streamed vectors (raw, then quantized in publishDynamics)
        const acc = e.accelerationIncludingGravity || e.acceleration;
        const agx = acc ? (Number(acc.x) || 0) : 0;
        const agy = acc ? (Number(acc.y) || 0) : 0;
        const agz = acc ? (Number(acc.z) || 0) : 0;

        pushMotionSample(nowMs, agx, agy, agz);
        updateGravityLocking({ x:agx, y:agy, z:agz });
        if (lab.recording){
          lab.recordSamples.push({ t: nowMs, ax: agx, ay: agy, az: agz });
          if (nowMs - lab.recordStartedAtMs >= MAX_REC_MS) endRecording();
        }

        impulseHist.push({ t: nowMs, ax: agx, ay: agy, az: agz });
        const impCutoff = nowMs - HIT_WIN_MAX_MS;
        while (impulseHist.length && impulseHist[0].t < impCutoff) impulseHist.shift();

        if (calib.active){
          calib.samples.push({ ax: agx, ay: agy, az: agz });
          if ((nowMs - calib.startMs) >= CALIB_MS){
            finishCalibration();
          }
        }

        const rr = e.rotationRate;
        // Keep same axis mapping you had (beta/gamma/alpha)
        const rrx = rr ? (rr.beta  ?? 0) : 0;
        const rry = rr ? (rr.gamma ?? 0) : 0;
        const rrz = rr ? (rr.alpha ?? 0) : 0;

        if (lab.testMode && testReadout){
          const live = recognizeGestureFromRecentBuffer(nowMs);
          lab.lastMatch = live;
          if (live) {
            testReadout.textContent = `Match: ${live.label} (${live.score.toFixed(2)})`;
          } else {
            testReadout.textContent = "Match: —";
          }
        }

        if (!rr) {
          const dtMean = Math.max(1e-3, computeAvg(dtBuf.slice(-50)) || 1/60);
          const dtForFilter = (dt > 0) ? dt : dtMean;
          const sv = updateSpeedV0(0, dtForFilter);

          if (dt > 0) {
            energy = Math.max(0, energy - ENERGY_DECAY * dt);
            energyUI = lerp(energyUI, energy, UI_SMOOTH);
          }

          const held = meterHoldOrFade(dt);

          const sd = (sh.shake01 > SD_SLOP_GATE) ? classifyDirectionalShake(nowMs) : null;
          const calibAck = calib.ackPending ? 1 : 0;
          const forceSend = !!calibAck || !!sh.shakeHit;
          if (calib.ackPending) calib.ackPending = false;

          publishDynamics({
            room,
            t: performance.now(),
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
            shieldRGB: shieldRGB ? [shieldRGB.r, shieldRGB.g, shieldRGB.b] : null,
            ...(DEBUG_SHIELD ? { calibOK: calibBasis ? 1 : 0, omegaOK: (mStability > MIN_OMEGA) ? 1 : 0 } : {}),

            ag: [agx, agy, agz],
            rr: [rrx, rry, rrz],

            d_r2: 0, d_r3: 0, d_gate: 0, d_balance: 0, d_couple: 0
          }, dt, forceSend);

          setBgFromEnergy(clamp01(energyUI));
          setAudio(energyUI, held.grooveOut, false);
          return;
        }

        const x = rrx;
        const y = rry;
        const z = rrz;

        const prevOx=ox, prevOy=oy, prevOz=oz;

        ox = lerp(ox, x, OMEGA_LPF);
        oy = lerp(oy, y, OMEGA_LPF);
        oz = lerp(oz, z, OMEGA_LPF);

        const mStability = mag3(ox,oy,oz);
        const dtMean = Math.max(1e-3, computeAvg(dtBuf.slice(-50)));
        const dtForFilter = (dt > 0) ? dt : dtMean;

        const wRaw = mag3(x, y, z);
        const sv = updateSpeedV0(wRaw, dtForFilter);

        if (dt > 0) graceLeft = Math.max(0, graceLeft - dt);

        if (mStability > MIN_OMEGA) {
          omegaMag.push(mStability);

          const d0 = mStability - emaMean;
          emaMean = emaMean + NORM_ALPHA * d0;

          const d2 = (mStability - emaMean);
          emaVar = emaVar + NORM_ALPHA * (d2*d2 - emaVar);

          const rms = Math.sqrt(Math.max(1e-6, emaVar));
          omegaNorm.push((mStability - emaMean) / rms);

          const invM = 1 / Math.max(1e-6, mStability);
          const vUnit = { x: ox*invM, y: oy*invM, z: oz*invM };
          omegaVec.push(vUnit);
          updateShieldAxis(nowMs, vUnit);

          if (dtForFilter > 0) dynamicsBufPush(vUnit, dtForFilter);

          if (dt > 0) {
            const dtSafe = Math.max(dt, dtMean * 0.5, 1/120);
            jerkBuf.push(mag3(ox-prevOx, oy-prevOy, oz-prevOz) / dtSafe);
          }
        } else {
          if (omegaMag.length) omegaMag.shift();
          if (omegaNorm.length) omegaNorm.shift();
          if (omegaVec.length) omegaVec.shift();
          if (jerkBuf.length)  jerkBuf.shift();
        }

        const inStableMode = lock || graceLeft > 0;
        const windowSec = inStableMode ? STABLE_WINDOW_SEC : HUNT_WINDOW_SEC;
        const nTarget = trimToWindow(dtMean, windowSec, omegaMag, omegaNorm, omegaVec, jerkBuf, dtBuf);

        if (omegaNorm.length < Math.min(MIN_WINDOW_SAMPLES, nTarget)) {
          if (dt > 0) {
            energy = Math.max(0, energy - ENERGY_DECAY * dt);
            energyUI = lerp(energyUI, energy, UI_SMOOTH);
          }

          const held = meterHoldOrFade(dt);

          publishDynamics({
            room,
            t: performance.now(),
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
            shieldRGB: shieldRGB ? [shieldRGB.r, shieldRGB.g, shieldRGB.b] : null,
            ...(DEBUG_SHIELD ? { calibOK: calibBasis ? 1 : 0, omegaOK: (mStability > MIN_OMEGA) ? 1 : 0 } : {}),

            ag: [agx, agy, agz],
            rr: [rrx, rry, rrz],

            d_r2: 0, d_r3: 0, d_gate: 0, d_balance: 0, d_couple: 0
          }, dt);

          setBgFromEnergy(clamp01(energyUI));
          setAudio(energyUI, held.grooveOut, false);
          return;
        }

        const ac = autocorrPeak(omegaNorm, dtMean);
        lockStrength = lerp(lockStrength, ac.peak, LOCK_SMOOTH);
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
        lastGrooveUI   = lockStrength;
        lastDynamicsUI = dynamicsUI;
        lastSmoothUI   = smoothScore;

        if (!lock) {
          if (lockStrength > LOCK_ON) { lock = true; graceLeft = 0; }
        } else {
          if (lockStrength < LOCK_OFF) { lock = false; graceLeft = GRACE_SEC; }
        }

        const inGrace = (!lock && graceLeft > 0);
        if (inGrace && lockStrength > LOCK_ON) { lock = true; graceLeft = 0; }

        if (dt > 0) {
          const badGroove = lockStrength <= RECENTER_GROOVE_MAX;
          const notLockedNow = !lock;
          if (badGroove && notLockedNow) recenterBadTime += dt;
          else recenterBadTime = Math.max(0, recenterBadTime - 1.5*dt);

          if (recenterBadTime >= RECENTER_SEC) {
            flushHistorySoft();
            recenterBadTime = 0;
          }
        }

        if (dt > 0) {
          const grooveTerm   = Math.pow(clamp01(lockStrength), GROOVE_EXP);
          const smoothTerm   = Math.pow(clamp01(smoothScore), SMOOTH_EXP);
          const dynamicsTerm = Math.pow(clamp01(dynamicsBonus), DYNAMICS_EXP);

          const qualityTerm = grooveTerm * smoothTerm;
          const earnBase = EARN_SCALE * grooveTerm * smoothTerm * dynamicsTerm;

          const effectivelyLocked = lock || inGrace;
          const gain = effectivelyLocked ? ENERGY_GAIN_LOCKED : ENERGY_GAIN_FREE;

          const smoothKill = (smoothScore < SMOOTH_KILL_THRESH);
          const earn = smoothKill ? 0 : (gain * earnBase);

          let decay = ENERGY_DECAY;
          if (qualityTerm >= COAST_QUALITY_MIN) decay *= COAST_DECAY_MULT;

          if (smoothKill) {
            decay *= SMOOTH_KILL_DECAY_MULT;
            if (SMOOTH_KILL_UNLOCK) { lock = false; graceLeft = 0; }
          }

          energy = Math.max(0, energy + (earn - decay) * dt);
          energyUI = lerp(energyUI, energy, UI_SMOOTH);
        }

        const lockedNow = !!(lock || inGrace);

        const sd = (sh.shake01 > SD_SLOP_GATE) ? classifyDirectionalShake(nowMs) : null;
        const calibAck = calib.ackPending ? 1 : 0;
        const forceSend = !!calibAck || !!sh.shakeHit;
        if (calib.ackPending) calib.ackPending = false;

        publishDynamics({
          room,
          t: performance.now(),
          dt: sv.dt,
          wRaw: sv.wRaw,
          wCap: sv.wCap,
          wFilt: sv.wFilt,
          cap: sv.cap,
          energy01: energyUI,
          groove01: lockStrength,
          dynamics01: dynamicsUI,
          smooth01: smoothScore,
          speed01: sv.speed,
          shake01: sh.shake01,
          shakeHit: sh.shakeHit,
          sd,
          calib: calibAck,
          locked: lockedNow,
          hz: grooveHz,
          shieldRGB: shieldRGB ? [shieldRGB.r, shieldRGB.g, shieldRGB.b] : null,
          ...(DEBUG_SHIELD ? { calibOK: calibBasis ? 1 : 0, omegaOK: (mStability > MIN_OMEGA) ? 1 : 0 } : {}),

          ag: [agx, agy, agz],
          rr: [rrx, rry, rrz],

          d_r2: dDiv.R,
          d_r3: dDiv.div01,
          d_gate: actGate,
          d_balance: 0,
          d_couple: 0
        }, dt, forceSend);

        setBgFromEnergy(clamp01(energyUI));
        setAudio(energyUI, lockStrength, lockedNow);

      } catch (err) {
        console.error("[onMotion crash]", err);
      }
    }

    // =========================================================================
    // Start/Stop
    // =========================================================================
    async function start() {
      if (!window.isSecureContext) return;

      startBtn.disabled = true;
      try {
        const ok = await requestMotionPermissionIfNeeded();
        if (!ok) return;

        ensureAudio();
        try { await audioCtx.resume(); } catch(e) {}

        nextSendAtMs = 0;
        lastSig = null;
        await connectRelay();

        running = true;
        lastT = null;

        ox=oy=oz=0;
        omegaMag.length  = 0;
        omegaNorm.length = 0;
        omegaVec.length  = 0;
        jerkBuf.length   = 0;
        dtBuf.length     = 0;

        dynamicsVecBuf.length = 0;
        dynamicsDtBuf.length  = 0;

        emaMean = 0;
        emaVar  = 1;

        lock = false;
        lockStrength = 0;
        grooveHz = 0;

        graceLeft = 0;
        recenterBadTime = 0;

        energy = 0;
        energyUI = 0;

        mSpeedEMA = 0;
        speedOut  = 0;

        meterHoldLeft = 0;
        lastGrooveUI   = 0;
        lastDynamicsUI = 0;
        lastSmoothUI   = 0;

        shake01 = 0;
        accelBaseMag = 9.81;

        prevAx = prevAy = prevAz = 0;
        prevAmag = 9.81;

        shakeFullTimes.length = 0;

        setAudio(0,0,false);
        setBgFromEnergy(0);

        addMotionListener();

        UI.state = "running";
        setBtn("Stop");

        if (calib.pendingReq) startCalibration();

      } finally {
        startBtn.disabled = false;
      }

      if (screen.orientation && screen.orientation.lock) {
        try { await screen.orientation.lock('portrait-primary'); }
        catch (e) { /* no-op */ }
      }
    }

    function stop() {
      running = false;
      calib.active = false;
      removeMotionListener();

      if (audioCtx && gainNode) {
        const now = audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(0, now, 0.05);
      }

      disconnectRelay();
      UI.state = "idle";
      setBtn("Start");
      setBgFromEnergy(0);
    }

    // =========================================================================
    // Final: Start/Stop click logic
    // =========================================================================
    startBtn.onclick = () => {
      if (UI.state === "idle") start();
      else stop();
    };

  })();
