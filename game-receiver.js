    const $ = (id) => document.getElementById(id);

    const els = {
      startScreen: $("startScreen"),
      startBtn: $("startBtn"),

      pairBtn: $("pairBtn"),
      newRoom: $("newRoom"),
      audioBtn: $("audioBtn"),
      teleBtn: $("teleBtn"),

      status: $("status"),
      last: $("last"),
      dirReadout: $("dirReadout"),

      vLift:  $("vLift"),
      vGroove: $("vGroove"),
      vSmooth: $("vSmooth"),
      vSpeed:  $("vSpeed"),
      vDynamics:  $("vDynamics"),
      vEnergy: $("vEnergy"),
      vShake:  $("vShake"),

      bLift:  $("bLift"),
      bGroove: $("bGroove"),
      bSmooth: $("bSmooth"),
      bSpeed:  $("bSpeed"),
      bDynamics:  $("bDynamics"),
      bEnergy: $("bEnergy"),
      bShake:  $("bShake"),

      dynLampStable: $("dynLampStable"),
      dynLampVar: $("dynLampVar"),
      shakeLamp: $("shakeLamp"),

      // Direction lamps (sd)
      lampUp: $("lampUp"),
      lampDown: $("lampDown"),
      lampLeft: $("lampLeft"),
      lampRight: $("lampRight"),
      lampForward: $("lampForward"),
      lampBack: $("lampBack"),

      fatal: $("fatal"),

      orbWrap: $("orbWrap"),
      orb: $("orb"),
      shield: $("shield"),

      /* [VFX] */
      shockLayer: $("shockLayer"),

      physStage: $("physStage"),
      stars: $("stars"),
      gSlider: $("gSlider"),
      gVal: $("gVal"),
      dSlider: $("dSlider"),
      dVal: $("dVal"),

      pairModal: $("pairModal"),
      pairBackdrop: $("pairBackdrop"),
      pairClose: $("pairClose"),
      qr: $("qr"),
      urlText: $("urlText"),
      copyUrl: $("copyUrl"),

      teleModal: $("teleModal"),
      teleBackdrop: $("teleBackdrop"),
      teleClose: $("teleClose"),
      teleRecBtn: $("teleRecBtn"),
      teleOut: $("teleOut"),

    orientOverlay: $("orientOverlay"),
      orientBtn: $("orientBtn"),
      orientMsg: $("orientMsg"),
      orientTitle: $("orientTitle"),
      orientHint: $("orientHint"),
      orientProgFill: $("orientProgFill"),
    orientStartBtn: $("orientStartBtn"),
    };

    const WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";

    function clamp01(x){ x = Number(x); return Math.max(0, Math.min(1, isFinite(x) ? x : 0)); }
    function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

    function setBar(el, v01){
      const p = clamp01(v01) * 100;
      el.style.width = p.toFixed(1) + "%";
    }

    function computeLift01(groove01, smooth01, speed01){
      const g = clamp01(groove01);
      const s = clamp01(smooth01);
      const p = clamp01(speed01);
      return clamp01(Math.pow(Math.max(0, g*s*p), 1/3));
    }

    function randCode(n=6){
      const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let s="";
      for(let i=0;i<n;i++) s += A[(Math.random()*A.length)|0];
      return s;
    }

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

    function phoneUrlFor(roomChannel){
      const base = "https://scrubbl3r.github.io/OrbisArcana/mobile-transmitter.html";
      const roomCode = stripOrbPrefix(roomChannel);
      return base + "?room=" + encodeURIComponent(roomCode);
    }

    function fatal(msg){
      els.fatal.style.display = "block";
      els.fatal.textContent = msg;
    }

    function setStatus(html, cls){
      els.status.className = cls || "dim";
      els.status.innerHTML = html;
    }

    // =========================================================================
    // BACKGROUND (driven by receiver energy bank UI)
    // =========================================================================
    const BG0 = { r: 0,   g: 0,  b: 0  };
    const BG1 = { r: 255, g: 42, b: 0  };
    function setBgFromEnergy(e01) {
      const t = clamp01(e01);
      const r = Math.round(BG0.r + (BG1.r - BG0.r) * t);
      const g = Math.round(BG0.g + (BG1.g - BG0.g) * t);
      const b = Math.round(BG0.b + (BG1.b - BG0.b) * t);

      document.body.style.backgroundColor = `rgb(${r},${g},${b})`;
      document.documentElement.style.setProperty("--charge", String(t));
      document.documentElement.style.setProperty("--bg-r", String(r));
      document.documentElement.style.setProperty("--bg-g", String(g));
      document.documentElement.style.setProperty("--bg-b", String(b));
    }
    setBgFromEnergy(0);

    // =========================================================================
    // [VFX] SHIELD + SHOCKWAVE (ported from VFX tester)
    // =========================================================================
    function setVar(name, value){
      document.documentElement.style.setProperty(name, value);
    }

    const VFX_DEFAULTS = {
      shield: {
        durationMs: 1170,
        alpha: 1.00,
        pulseMs: 80,
        pulseMin: 0.09,
        pulseMax: 1.00
      },
      shock: {
        startR: 43,
        endR: 169,
        rings: 2,
        spawnMs: 105,
        stroke: 4,
        decayMs: 150
      }
    };

    (function initVfxDefaults(){
      setVar("--shield-alpha", String(VFX_DEFAULTS.shield.alpha.toFixed(2)));
      setVar("--shield-pulse-ms", String(Math.round(VFX_DEFAULTS.shield.pulseMs)) + "ms");
      setVar("--shield-pulse-min", String(VFX_DEFAULTS.shield.pulseMin.toFixed(2)));
      setVar("--shield-pulse-max", String(Math.min(VFX_DEFAULTS.shield.pulseMax, VFX_DEFAULTS.shield.alpha).toFixed(2)));

      const stroke = evenStroke(VFX_DEFAULTS.shock.stroke, 2, 20);
      VFX_DEFAULTS.shock.stroke = stroke;
      setVar("--shock-stroke", stroke + "px");
    })();

    function evenStroke(n, min = 2, max = 20){
      n = Math.round(Number(n) || min);
      n = Math.max(min, Math.min(max, n));
      if (n % 2 === 1) n += 1;
      return n;
    }

    function shieldOffNow(){
      if (!els.shield) return;
      els.shield.classList.remove("on");
      els.shield.style.opacity = "";
      els.shield.style.animation = "";
    }

    function shieldOnNow(){
      if (!els.shield) return;

      const a  = clamp(VFX_DEFAULTS.shield.alpha, 0, 1);
      const pMax = Math.min(clamp(VFX_DEFAULTS.shield.pulseMax, 0, 1), a);
      const pMin = clamp(VFX_DEFAULTS.shield.pulseMin, 0, 1);
      const pMs  = Math.round(clamp(VFX_DEFAULTS.shield.pulseMs, 20, 700));

      setVar("--shield-alpha", a.toFixed(2));
      setVar("--shield-pulse-ms", pMs + "ms");
      setVar("--shield-pulse-min", pMin.toFixed(2));
      setVar("--shield-pulse-max", pMax.toFixed(2));

      if (els.shield.classList.contains("on")) return;

      shieldOffNow();
      void els.shield.offsetWidth;
      els.shield.classList.add("on");
    }

    let shockRAF = 0;
    let shockSvg = null;
    let spawnAcc = 0;
    const activeRings = [];

    function buildShockSVG(){
      const maxR = 1000;
      const size = (maxR * 2) + 40;
      const cx = size * 0.5;
      const cy = size * 0.5;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "shockSvg");
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
      svg.setAttribute("shape-rendering", "geometricPrecision");
      svg.__cx = cx;
      svg.__cy = cy;
      return svg;
    }

    function makeRingCircle(svg){
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", svg.__cx);
      c.setAttribute("cy", svg.__cy);
      c.setAttribute("r", "1");
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "var(--shock-color)");
      c.setAttribute("stroke-width", "var(--shock-stroke)");
      c.setAttribute("stroke-linecap", "round");
      c.setAttribute("opacity", "0");
      return c;
    }

    function clearShock(){
      if (shockRAF) cancelAnimationFrame(shockRAF);
      shockRAF = 0;
      spawnAcc = 0;
      activeRings.length = 0;

      if (shockSvg && shockSvg.parentNode) shockSvg.parentNode.removeChild(shockSvg);
      shockSvg = null;
    }

    function playShock(){
      if (!els.shockLayer) return;

      const stroke = evenStroke(VFX_DEFAULTS.shock.stroke, 2, 20);
      setVar("--shock-stroke", stroke + "px");

      const cfg = {
        startR: clamp(VFX_DEFAULTS.shock.startR, 1, 1000),
        endR: clamp(VFX_DEFAULTS.shock.endR, 1, 1000),
        rings: Math.round(clamp(VFX_DEFAULTS.shock.rings, 1, 6)),
        spawnMs: Math.round(clamp(VFX_DEFAULTS.shock.spawnMs, 1, 700)),
        decayMs: Math.round(clamp(VFX_DEFAULTS.shock.decayMs, 40, 2000)),
      };

      clearShock();

      shockSvg = buildShockSVG();
      els.shockLayer.appendChild(shockSvg);

      let last = performance.now();
      let spawned = 0;

      function tick(now){
        const dt = Math.max(0, now - last);
        last = now;

        spawnAcc += dt;
        while (spawned < cfg.rings && spawnAcc >= cfg.spawnMs){
          spawnAcc -= cfg.spawnMs;

          const circle = makeRingCircle(shockSvg);
          shockSvg.appendChild(circle);

          activeRings.push({ born: now, circle });
          spawned += 1;
        }

        for (let i = activeRings.length - 1; i >= 0; i--){
          const r0 = activeRings[i];
          const age = now - r0.born;
          const t01 = Math.max(0, Math.min(1, age / cfg.decayMs));

          const r = cfg.startR + (cfg.endR - cfg.startR) * t01;
          r0.circle.setAttribute("r", r.toFixed(2));

          const alpha = (t01 <= 0) ? 0 : (1 - t01);
          r0.circle.setAttribute("opacity", alpha.toFixed(3));

          if (t01 >= 1){
            if (r0.circle.parentNode) r0.circle.parentNode.removeChild(r0.circle);
            activeRings.splice(i, 1);
          }
        }

        const allSpawned = (spawned >= cfg.rings);
        const noneAlive = (activeRings.length === 0);

        if (allSpawned && noneAlive){
          clearShock();
          return;
        }

        shockRAF = requestAnimationFrame(tick);
      }

      shockRAF = requestAnimationFrame(tick);
    }

    function triggerShockwave(){
      playShock();
    }

    // =========================================================================
    // AUDIO (optional) — unchanged behavior
    // =========================================================================
    let audioEnabled = false;
    let audioCtx = null, osc = null, gainNode = null;

    const AUDIO_GATE   = 0.02;
    const AUDIO_MIN_DB = -42;
    const AUDIO_MAX_DB = -6;
    const AUDIO_EXP    = 1.15;
    const MASTER_GAIN  = 2.2;
    const TONE_BASE_HZ    = 180;
    const TONE_MAX_ADD_HZ = 220;

    const dbToGain = (db) => Math.pow(10, db/20);

    function energyToGain(e) {
      if (e <= AUDIO_GATE) return 0;
      const x = (e - AUDIO_GATE) / (1 - AUDIO_GATE);
      const shaped = Math.pow(clamp01(x), AUDIO_EXP);
      const db = AUDIO_MIN_DB + (AUDIO_MAX_DB - AUDIO_MIN_DB) * shaped;
      return dbToGain(db);
    }

    function ensureAudio() {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;

      osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = TONE_BASE_HZ;

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
    }

    async function enableAudio() {
      ensureAudio();
      try { await audioCtx.resume(); } catch(_) {}
      audioEnabled = true;
      els.audioBtn.textContent = "Audio: On";
      els.audioBtn.classList.add("on");
      els.audioBtn.classList.remove("dim");
    }

    function disableAudio() {
      audioEnabled = false;
      els.audioBtn.textContent = "Audio: Off";
      els.audioBtn.classList.remove("on");
      if (audioCtx && gainNode) {
        const now = audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(0, now, 0.06);
      }
    }

    function setAudio(eUI, groove, locked) {
      if (!audioEnabled || !audioCtx || !gainNode || !osc) return;
      const e01 = clamp01(eUI);

      const gBase = energyToGain(e01);
      const gGroove = locked ? (0.30 + 0.70*groove) : (0.08 + 0.22*groove);
      const g = MASTER_GAIN * gBase * gGroove;

      const f = TONE_BASE_HZ
              + TONE_MAX_ADD_HZ * (locked ? groove : 0.30*groove)
              + 60 * e01;

      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setTargetAtTime(g, now, 0.06);

      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setTargetAtTime(f, now, 0.06);
    }

    disableAudio();
    els.audioBtn.addEventListener("click", async () => {
      if (!audioEnabled) await enableAudio();
      else disableAudio();
    });

    // =========================================================================
    // SHAKE → BEST-GUESS DIRECTION (v0: raw omega winner-take-all)
    // =========================================================================
    let lastRawOmega = { x:0, y:0, z:0, has:0 };
    let lastRawAccel = { x:0, y:0, z:0, has:0 };

    function cacheRawOmegaFromMsg(d){
      // pull the raw omega vector exactly like telemetry does (supports omega / r / omegaX..)
      const v = telePickVecRaw(d, "omega"); // uses omega OR fallback r
      const has = teleHas(d, "omega");      // uses omega OR fallback r
      if (!has) return;
      lastRawOmega = { x: v.x, y: v.y, z: v.z, has: 1 };
    }

    function cacheRawAccelFromMsg(d){
      // prefer accelIncludingGravity (d.a), fallback to d.dir; support array/object/scalars like telePickVecRaw
      let src = null;
      if (d && d.a != null) src = d.a;
      else if (d && d.dir != null) src = d.dir;

      let v = { x:0, y:0, z:0 };
      if (Array.isArray(src) && src.length >= 3){
        v = { x: Number(src[0]), y: Number(src[1]), z: Number(src[2]) };
      } else if (src && typeof src === "object"){
        v = { x: Number(src.x), y: Number(src.y), z: Number(src.z) };
      } else {
        // fall back to dirX/dirY/dirZ scalars
        v = telePickVecRaw(d, "dir");
      }

      if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z)) return;
      const has = (d && (d.a != null || d.dir != null)) ||
        (isFinite(Number(d && d.dirX)) || isFinite(Number(d && d.dirY)) || isFinite(Number(d && d.dirZ)));
      if (!has) return;
      lastRawAccel = { x: v.x, y: v.y, z: v.z, has: 1 };
    }

    // =========================================================================
    // ORIENT PHONE — gravity-based calibration (receiver-only)
    // =========================================================================
    let lastGravity = { x:0, y:0, z:0, has:0 }; // from d.a (accelIncludingGravity)

    function cacheGravityFromMsg(d){
    // "dir" prefix in your tooling falls back to d.a already
    const g = telePickVecRaw(d, "dir");
    const has = teleHas(d, "dir");
    if (!has) return;
    // normalize
    const m = Math.hypot(g.x, g.y, g.z);
    if (!(m > 1e-6)) return;
    lastGravity = { x: g.x/m, y: g.y/m, z: g.z/m, has: 1 };
    }

    function vDot(a,b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
    function vScale(a,s){ return { x:a.x*s, y:a.y*s, z:a.z*s }; }
    function vSub(a,b){ return { x:a.x-b.x, y:a.y-b.y, z:a.z-b.z }; }
    function vNorm(a){
    const m = Math.hypot(a.x,a.y,a.z);
    return (m > 1e-6) ? { x:a.x/m, y:a.y/m, z:a.z/m, mag:m } : { x:0,y:0,z:0, mag:0 };
    }

    // --- recent motion history (for better shake-direction classification) ---
    const MOTION_HIST_MS = 220;         // keep ~0.22s
    const HIT_PICK_WIN_MS = 180;        // analyze last ~0.18s on detonation
    const motionHist = [];              // { t, ox, oy, oz, ax, ay, az, gx, gy, gz }

    let gLP = { x:0, y:0, z:1, has:0 }; // low-pass gravity estimate

    function updateGravityLP(){
    if (!lastGravity || !lastGravity.has) return;
    if (!gLP.has){
        gLP = { x:lastGravity.x, y:lastGravity.y, z:lastGravity.z, has:1 };
        return;
    }
    // small alpha = stable "down" even during shakes
    const a = 0.08;
    const x = gLP.x*(1-a) + lastGravity.x*a;
    const y = gLP.y*(1-a) + lastGravity.y*a;
    const z = gLP.z*(1-a) + lastGravity.z*a;
    const m = Math.hypot(x,y,z);
    if (m > 1e-6) gLP = { x:x/m, y:y/m, z:z/m, has:1 };
    }

    function pushMotionSample(nowMs){
    if (!lastRawOmega || !lastRawOmega.has) return;
    if (!lastRawAccel || !lastRawAccel.has) return;
    updateGravityLP();
    if (!gLP || !gLP.has) return;

    motionHist.push({
        t: nowMs,
        ox: lastRawOmega.x, oy: lastRawOmega.y, oz: lastRawOmega.z,
        ax: lastRawAccel.x, ay: lastRawAccel.y, az: lastRawAccel.z,
        gx: gLP.x, gy: gLP.y, gz: gLP.z
    });

    const cutoff = nowMs - MOTION_HIST_MS;
    while (motionHist.length && motionHist[0].t < cutoff) motionHist.shift();
    }

    function pickOmegaForHit(nowMs){
    // choose the peak-magnitude omega sample in the last HIT_PICK_WIN_MS
    const t0 = nowMs - HIT_PICK_WIN_MS;
    let best = null;
    let bestMag = -1;

    for (let i = motionHist.length - 1; i >= 0; i--){
        const s = motionHist[i];
        if (s.t < t0) break;
        const mag = Math.hypot(s.ox, s.oy, s.oz);
        if (mag > bestMag){
        bestMag = mag;
        best = s;
        }
    }
    return best;
    }

    function pickAccelForHit(nowMs){
    // choose the peak-magnitude linear-accel sample in the last HIT_PICK_WIN_MS
    const t0 = nowMs - HIT_PICK_WIN_MS;
    let best = null;
    let bestMag = -1;

    for (let i = motionHist.length - 1; i >= 0; i--){
        const s = motionHist[i];
        if (s.t < t0) break;
        const gHat = vNorm({ x:s.gx, y:s.gy, z:s.gz });
        const aRaw = { x:s.ax, y:s.ay, z:s.az };
        const aLin = projectToHorizon(aRaw, gHat);
        const mag = Math.hypot(aLin.x, aLin.y, aLin.z);
        if (mag > bestMag){
        bestMag = mag;
        best = { ...s, aLin };
        }
    }
    return best;
    }


    // remove gravity component: project onto plane perpendicular to gravity
    function projectToHorizon(v, gHat){
    const k = vDot(v, gHat);
    return vSub(v, vScale(gHat, k));
    }

    const ORIENT = {
        active: false, // true ONLY while sampling
        step: 0,       // 0=idle, 1=LR, 2=FB, 3=done

        // ✅ NEW: UI flow
        mode: "idle",  // "idle" | "prompt1" | "sample1" | "prompt2" | "sample2" | "done"

        // templates (unit vectors in horizon plane)
        T_lr: null,
        T_fb: null,

        // sampling
        sum: { x:0, y:0, z:0 },
        n: 0,

        // quality thresholds
        MIN_SAMPLES: 34,
        MIN_MAG: 0.55,
        MIN_RESULTANT: 0.82
    };


    const ORIENT_STORE_KEY = "orb_orient_v1";

    function orientLoad(){
    try{
        const raw = localStorage.getItem(ORIENT_STORE_KEY);
        if (!raw) return;
        const j = JSON.parse(raw);
        if (j && j.T_lr && j.T_fb){
        ORIENT.T_lr = vNorm(j.T_lr);
        ORIENT.T_fb = vNorm(j.T_fb);
        if (ORIENT.T_lr.mag > 0.8 && ORIENT.T_fb.mag > 0.8){
            // keep only unit
            ORIENT.T_lr = { x: ORIENT.T_lr.x, y: ORIENT.T_lr.y, z: ORIENT.T_lr.z };
            ORIENT.T_fb = { x: ORIENT.T_fb.x, y: ORIENT.T_fb.y, z: ORIENT.T_fb.z };
        } else {
            ORIENT.T_lr = null; ORIENT.T_fb = null;
        }
        }
    }catch(_){}
    }

    function orientSave(){
    try{
        if (!ORIENT.T_lr || !ORIENT.T_fb) return;
        localStorage.setItem(ORIENT_STORE_KEY, JSON.stringify({
        T_lr: ORIENT.T_lr,
        T_fb: ORIENT.T_fb,
        ts: Date.now()
        }));
    }catch(_){}
    }

    function orientResetAccum(){
    ORIENT.sum = { x:0, y:0, z:0 };
    ORIENT.n = 0;
    }

    function orientUI(showBtn, showMsg, showStart){
    if (els.orientBtn) els.orientBtn.style.display = showBtn ? "" : "none";
    if (els.orientMsg) els.orientMsg.style.display = showMsg ? "" : "none";
    if (els.orientStartBtn) els.orientStartBtn.style.display = showStart ? "" : "none";
    if (els.orientProgFill) els.orientProgFill.style.width = "0%";
    }


    function orientSetMessage(title, hint){
    if (els.orientTitle) els.orientTitle.textContent = title;
    if (els.orientHint) els.orientHint.textContent = hint;
    }

    function orientProgress(p01){
    if (!els.orientProgFill) return;
    const p = clamp01(p01) * 100;
    els.orientProgFill.style.width = p.toFixed(1) + "%";
    }


    function orientStart(){
        // Enter the flow (prompt step 1)
        ORIENT.active = false;
        ORIENT.step = 1;
        ORIENT.mode = "prompt1";

        orientResetAccum();
        orientProgress(0);

        // Hide the big ORIENT PHONE button; show modal + START
        orientUI(false, true, true);

        orientSetMessage(
            "Orient Phone",
            "Shake phone LEFT ↔ RIGHT to fill the meter. Press START when you’re ready."
        );

        // optional: clear lamps so the user focuses
        clearDirLampTimers();
        allDirLampOff();
        forceShakeLampOff();
    }

    function orientBeginSamplingForCurrentStep(){
        if (ORIENT.step !== 1 && ORIENT.step !== 2) return;

        ORIENT.active = true;
        ORIENT.mode = (ORIENT.step === 1) ? "sample1" : "sample2";

        orientResetAccum();
        orientProgress(0);

        // Hide START while sampling
        orientUI(false, true, false);

        orientSetMessage(
            "Orient Phone",
            (ORIENT.step === 1)
            ? "Shake phone LEFT ↔ RIGHT until the bar fills."
            : "Shake phone FORWARD ↔ BACK until the bar fills."
        );

        // keep gameplay shake effects off during sampling
        forceShakeLampOff();
    }


    function orientFinishStepAndAdvance(template){
        if (ORIENT.step === 1) ORIENT.T_lr = template;
        if (ORIENT.step === 2) ORIENT.T_fb = template;

        // stop sampling immediately
        ORIENT.active = false;

        if (ORIENT.step === 1){
            // Move to step 2 PROMPT (user must press START)
            ORIENT.step = 2;
            ORIENT.mode = "prompt2";

            orientResetAccum();
            orientProgress(0);

            // Show START again
            orientUI(false, true, true);

            orientSetMessage(
            "Orient Phone",
            "Shake phone FORWARD ↔ BACK to fill the meter. Press START when you’re ready."
            );
            return;
        }

        // DONE
        ORIENT.step = 3;
        ORIENT.mode = "done";
        ORIENT.active = false;

        orientSave();

        // ✅ remove orientation UI entirely
    if (els.orientOverlay) els.orientOverlay.style.display = "none";
    }


    function orientTryConsumeOmegaSample(rawOmega){
    // ✅ only consume samples while we are actively sampling
    if (!ORIENT.active) return;
    if (!(ORIENT.mode === "sample1" || ORIENT.mode === "sample2")) return;

    if (!rawOmega || !rawOmega.has) return;
    if (!lastGravity || !lastGravity.has) return;

    const gHat = lastGravity; // unit
    // horizon component of omega (gravity-removed)
    const oH = projectToHorizon({ x: rawOmega.x, y: rawOmega.y, z: rawOmega.z }, gHat);
    const u = vNorm(oH);
    if (!(u.mag > ORIENT.MIN_MAG)) return;

    // sign-correct so we learn an AXIS even if user shakes both directions:
    // flip sample to align with current running sum
    const sumMag = Math.hypot(ORIENT.sum.x, ORIENT.sum.y, ORIENT.sum.z);
    if (sumMag > 1e-6){
        const sumHat = { x: ORIENT.sum.x/sumMag, y: ORIENT.sum.y/sumMag, z: ORIENT.sum.z/sumMag };
        if (vDot(u, sumHat) < 0){
        u.x *= -1; u.y *= -1; u.z *= -1;
        }
    }

    ORIENT.sum.x += u.x;
    ORIENT.sum.y += u.y;
    ORIENT.sum.z += u.z;
    ORIENT.n += 1;

    // quality metrics
    const sumLen = Math.hypot(ORIENT.sum.x, ORIENT.sum.y, ORIENT.sum.z);

    const resultant = sumLen / Math.max(1, ORIENT.n); // 0..1, higher=cleaner

    // ✅ Progress should only hit 100% when BOTH conditions are met.
    // Use MIN() not product, so the bar cannot "lie".
    const pN   = ORIENT.n / ORIENT.MIN_SAMPLES;
    const pRes = resultant / ORIENT.MIN_RESULTANT;
    const p01  = clamp01(Math.min(pN, pRes));

    orientProgress(p01);

    // Optional debug hint (comment out later)
    /*
    if (els.orientHint){
    const pct = Math.round(p01 * 100);
    els.orientHint.textContent =
        (ORIENT.step === 1 ? "Shake phone LEFT ↔ RIGHT" : "Shake phone FORWARD ↔ BACK") +
        ` — ${pct}% (samples ${ORIENT.n}/${ORIENT.MIN_SAMPLES}, quality ${resultant.toFixed(2)}/${ORIENT.MIN_RESULTANT.toFixed(2)})`;
    }
    */


    if (ORIENT.n >= ORIENT.MIN_SAMPLES && resultant >= ORIENT.MIN_RESULTANT){
        const t = { x: ORIENT.sum.x / sumLen, y: ORIENT.sum.y / sumLen, z: ORIENT.sum.z / sumLen };
        orientFinishStepAndAdvance(t);
    }
    }

    // Replace v0 direction pick with calibrated classifier
    function pickShakeDirCodeCalibrated(rawOmega){
    if (!rawOmega || !rawOmega.has) return null;

    // If not calibrated, fallback to old behavior
    if (!ORIENT.T_lr || !ORIENT.T_fb || !lastGravity || !lastGravity.has){
        return pickShakeDirCodeFromOmega(rawOmega);
    }

    const gHat = lastGravity;

    // vertical axis score (Up/Down)
    const v = vNorm({ x: rawOmega.x, y: rawOmega.y, z: rawOmega.z });
    const sUD = vDot(v, gHat); // -1..1

    // horizontal classification for LR / FB
    const oH = projectToHorizon({ x: rawOmega.x, y: rawOmega.y, z: rawOmega.z }, gHat);
    const h = vNorm(oH);
    const sLR = vDot(h, ORIENT.T_lr); // -1..1
    const sFB = vDot(h, ORIENT.T_fb); // -1..1

    // choose dominant axis by absolute score (3-way)
    const aUD = Math.abs(sUD);
    const aLR = Math.abs(sLR);
    const aFB = Math.abs(sFB);

    const UD_WIN_THR = 0.72; // tune 0.65..0.80

    if (aUD >= aLR && aUD >= aFB && aUD >= UD_WIN_THR){
    return (sUD >= 0) ? "D" : "U";
    }


    if (aUD >= aLR && aUD >= aFB){
        // sign -> U/D (note: depending on your phone axis sign, you may want to invert)
        return (sUD >= 0) ? "D" : "U";
    } else if (aLR >= aFB){
        return (sLR >= 0) ? "R" : "L";
    } else {
        return (sFB >= 0) ? "F" : "B";
    }
    }

    function flashShakeDirectionFromLatestCalibrated(ms=420){
    if (!lastRawOmega || !lastRawOmega.has) return;
    const code = pickShakeDirCodeCalibrated(lastRawOmega);
    if (!code) return;
    flashDirLamp(code, ms);
    }

    function pickShakeDirCodeFromAccelSample(s){
    if (!s) return null;

    const gHat = vNorm({ x:s.gx, y:s.gy, z:s.gz });
    if (!(gHat.mag > 1e-6)) return null;

    const aRaw = { x:s.ax, y:s.ay, z:s.az };
    const aRawN = vNorm(aRaw);
    const sUD = (aRawN.mag > 1e-6) ? vDot(aRawN, gHat) : 0; // -1..1

    const aLin = s.aLin ? s.aLin : projectToHorizon(aRaw, gHat);
    const h = vNorm(aLin);
    if (!(h.mag > 1e-6)) return null;

    const UD_WIN_THR = 0.70;

    let sLR = 0, sFB = 0;
    let hasTemplates = false;
    if (ORIENT.T_lr && ORIENT.T_fb){
      const mLR = Math.hypot(ORIENT.T_lr.x, ORIENT.T_lr.y, ORIENT.T_lr.z);
      const mFB = Math.hypot(ORIENT.T_fb.x, ORIENT.T_fb.y, ORIENT.T_fb.z);
      if (mLR > 0.5 && mFB > 0.5){
        hasTemplates = true;
        sLR = vDot(h, ORIENT.T_lr);
        sFB = vDot(h, ORIENT.T_fb);
      }
    }

    if (hasTemplates){
      const aUD = Math.abs(sUD);
      const aLR = Math.abs(sLR);
      const aFB = Math.abs(sFB);

      if (aUD >= aLR && aUD >= aFB && aUD >= UD_WIN_THR){
        return (sUD >= 0) ? "D" : "U";
      }

      if (aLR >= aFB){
        return (sLR >= 0) ? "R" : "L";
      }
      return (sFB >= 0) ? "F" : "B";
    }

    // fallback: dominant axis on horizontal linear accel
    const ax = Math.abs(h.x), ay = Math.abs(h.y), az = Math.abs(h.z);
    if (ax >= ay && ax >= az) return (h.x >= 0) ? "R" : "L";
    if (ay >= ax && ay >= az) return (h.y >= 0) ? "F" : "B";
    return (h.z >= 0) ? "D" : "U";
    }

    // init persisted calibration on load
    orientLoad();

    // hook the button
    if (els.orientBtn){
    els.orientBtn.addEventListener("click", () => {
        orientStart();
    });
    }

    // hook the START button inside the orient modal
    if (els.orientStartBtn){
    els.orientStartBtn.addEventListener("click", () => {
        orientBeginSamplingForCurrentStep();
    });
    }


    function pickShakeDirCodeFromOmega(v){
      // pick dominant axis by absolute rotation-rate
      const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);

      if (ax >= ay && ax >= az){
        // X axis → LEFT/RIGHT
        return (v.x >= 0) ? "R" : "L";
      } else if (ay >= ax && ay >= az){
        // Y axis → UP/DOWN
        return (v.y >= 0) ? "U" : "D";
      } else {
        // Z axis → FORWARD/BACK
        return (v.z >= 0) ? "F" : "B";
      }
    }


    // =========================================================================
    // LAMPS — independent timers
    // =========================================================================
    let shakeLampTO = null;

    function flashShakeLamp(ms = 400){
      els.shakeLamp.classList.add("on");
      if (shakeLampTO) clearTimeout(shakeLampTO);
      shakeLampTO = setTimeout(() => {
        els.shakeLamp.classList.remove("on");
        shakeLampTO = null;
      }, ms);
    }

    function forceShakeLampOff(){
      if (shakeLampTO) { clearTimeout(shakeLampTO); shakeLampTO = null; }
      els.shakeLamp.classList.remove("on");
    }

    // Direction lamps (flash on sd from phone)
    const dirLampTO = { U:null, D:null, L:null, R:null, F:null, B:null };

    // ✅ NEW: clear any queued timeouts (prevents timer pile-ups / late callbacks)
    function clearDirLampTimers(){
      for (const k in dirLampTO){
        if (dirLampTO[k]) { clearTimeout(dirLampTO[k]); dirLampTO[k] = null; }
      }
    }

    function allDirLampOff(){
      if (els.lampUp) els.lampUp.classList.remove("on");
      if (els.lampDown) els.lampDown.classList.remove("on");
      if (els.lampLeft) els.lampLeft.classList.remove("on");
      if (els.lampRight) els.lampRight.classList.remove("on");
      if (els.lampForward) els.lampForward.classList.remove("on");
      if (els.lampBack) els.lampBack.classList.remove("on");
    }

    function flashDirLamp(code, ms=380){
      const c = String(code || "").trim().toUpperCase();
      if (!c) return;

      const map = {
        U: els.lampUp,
        D: els.lampDown,
        L: els.lampLeft,
        R: els.lampRight,
        F: els.lampForward,
        B: els.lampBack,
      };

      const el = map[c];
      if (!el) return;

      el.classList.add("on");

      if (dirLampTO[c]) clearTimeout(dirLampTO[c]);
      dirLampTO[c] = setTimeout(() => {
        el.classList.remove("on");
        dirLampTO[c] = null;
      }, ms);
    }

    // =========================================================================
    // ENERGY BANK (receiver-side battery)
    // =========================================================================
    const ENERGY_BANK_CAP = 200;
    const ENERGY_SHAKE_COST = 100;
    const ENERGY_CHARGE_RATE_PPS = 160;

    let energyBankPts = 0;
    let energyBankLastMs = 0;

    function resetEnergyBank(){
      energyBankPts = 0;
      energyBankLastMs = 0;
    }

    function updateEnergyBankFromPhone(energyFromPhone01, nowMs){
      const e = Math.max(0, Number(energyFromPhone01) || 0);
      if (!energyBankLastMs) energyBankLastMs = nowMs;
      let dt = (nowMs - energyBankLastMs) / 1000;
      energyBankLastMs = nowMs;
      dt = clamp(dt, 0, 0.25);

      energyBankPts = clamp(energyBankPts + (e * ENERGY_CHARGE_RATE_PPS * dt), 0, ENERGY_BANK_CAP);
    }

    function canSpendShake(){ return energyBankPts >= ENERGY_SHAKE_COST; }
    function spendShake(){ energyBankPts = clamp(energyBankPts - ENERGY_SHAKE_COST, 0, ENERGY_BANK_CAP); }

    // =========================================================================
    // SHAKE DOUBLE-BANG + energy-gated detonation
    // =========================================================================
    const DOUBLEBANG_MS    = 300;
    const SHAKE_COOLDOWN_MS = 2000;

    const SHAKE_HIT_THR = 0.998;
    const SHAKE_HIT_DEBOUNCE_MS = 130;

    let shakeFirstHitAt = 0;
    let shakeLastHitAt  = -1e9;
    let shakeCooldownUntil = 0;

    function resetShakeDetector(){
      shakeFirstHitAt = 0;
      shakeLastHitAt = -1e9;
      shakeCooldownUntil = 0;
      forceShakeLampOff();

      // ✅ NEW: hard-clear any queued direction timers
      clearDirLampTimers();
      allDirLampOff();
    }

    function registerShakeHit(nowMs){
      if (nowMs < shakeCooldownUntil) return;

      if (isDiversityLampLit()){
        shakeFirstHitAt = 0;
        return;
      }

      if (!shakeFirstHitAt){
        shakeFirstHitAt = nowMs;
        return;
      }

      const dt = nowMs - shakeFirstHitAt;

      if (dt <= DOUBLEBANG_MS){
        if (canSpendShake()){
          spendShake();
          flashShakeLamp(400);
          triggerShockwave();

            const s = pickAccelForHit(nowMs);
            if (s){
            // temporarily set "lastGravity" to the smoothed gravity at that sample time
            lastGravity = { x:s.gx, y:s.gy, z:s.gz, has:1 };
            const code = pickShakeDirCodeFromAccelSample(s);
            if (code) flashDirLamp(code, 420);
            }


          shakeCooldownUntil = nowMs + SHAKE_COOLDOWN_MS;
          shakeFirstHitAt = 0;
        } else {
          shakeFirstHitAt = 0;
        }
      } else {
        shakeFirstHitAt = nowMs;
      }
    }

    function processShakeDoubleBang(shakeVal01, nowMs){
      const v = Number(shakeVal01);
      if (!isFinite(v)) return;

      if (nowMs < shakeCooldownUntil) forceShakeLampOff();
      if (v < SHAKE_HIT_THR) return;

      if ((nowMs - shakeLastHitAt) < SHAKE_HIT_DEBOUNCE_MS) return;

      shakeLastHitAt = nowMs;
      registerShakeHit(nowMs);
    }

    // =========================================================================
    // STABILITY + VARIABILITY — no cooldown
    // =========================================================================
    const STABILITY_AVG_MS   = 250;
    const STABILITY_ARM_MS   = 220;

    const STABILITY_ON_THR   = 0.08;
    const STABILITY_OFF_THR  = 0.10;

    const VARIABILITY_ON_THR  = 0.80;
    const VARIABILITY_OFF_THR = 0.78;
    const VARIABILITY_ARM_MS  = 220;
    const VARIABILITY_AVG_MS  = 250;

    let dynSamples = [];
    let stabilityOn = false;
    let stabilityHoldMs = 0;
    let stabilityLastMs = 0;

    let varSamples = [];
    let variabilityOn = false;
    let variabilityHoldMs = 0;
    let variabilityLastMs = 0;

    const STABILITY_SPEED_MIN = 0.02;
    let stabilityVisualGate = true;

    let prevStableVisual = false;

    function applyStabilityVisuals(){
      const showStable = !!stabilityOn && !!stabilityVisualGate;
      const showVar = !!variabilityOn && !!stabilityVisualGate;

      els.dynLampStable.classList.toggle("on", showStable);
      els.dynLampVar.classList.toggle("on", showVar);

      if (showStable) shieldOnNow();
      else shieldOffNow();

      prevStableVisual = showStable;
    }

    function isDiversityLampLit(){
      return !!variabilityOn && !!stabilityVisualGate;
    }

    function setStability(on){
      stabilityOn = !!on;
      applyStabilityVisuals();
    }
    function setVariability(on){
      variabilityOn = !!on;
      applyStabilityVisuals();
    }

    function resetStability(){
      dynSamples = [];
      stabilityOn = false;
      stabilityHoldMs = 0;
      stabilityLastMs = 0;
      prevStableVisual = false;
      setStability(false);
      shieldOffNow();
    }
    function resetVariability(){
      varSamples = [];
      variabilityOn = false;
      variabilityHoldMs = 0;
      variabilityLastMs = 0;
      setVariability(false);
    }

    function updateStability(dyn01, nowMs){
      const v = clamp01(dyn01);

      if (!stabilityLastMs) stabilityLastMs = nowMs;
      let dt = nowMs - stabilityLastMs;
      stabilityLastMs = nowMs;
      dt = clamp(dt, 0, 80);

      dynSamples.push({ t: nowMs, v });
      const cutoff = nowMs - STABILITY_AVG_MS;
      while (dynSamples.length && dynSamples[0].t < cutoff) dynSamples.shift();

      if (!dynSamples.length){
        stabilityHoldMs = 0;
        if (stabilityOn) setStability(false);
        return;
      }

      let sum = 0;
      for (const s of dynSamples) sum += s.v;
      const avg = sum / dynSamples.length;

      const thr = stabilityOn ? STABILITY_OFF_THR : STABILITY_ON_THR;

      if (avg <= thr){
        stabilityHoldMs += dt;

        if (!stabilityOn && stabilityHoldMs >= STABILITY_ARM_MS){
          setStability(true);
        }
      } else {
        stabilityHoldMs = 0;
        if (stabilityOn) setStability(false);
      }
    }

    function updateVariability(dyn01, nowMs){
      const v = clamp01(dyn01);

      if (!variabilityLastMs) variabilityLastMs = nowMs;
      let dt = nowMs - variabilityLastMs;
      variabilityLastMs = nowMs;
      dt = clamp(dt, 0, 80);

      varSamples.push({ t: nowMs, v });
      const cutoff = nowMs - VARIABILITY_AVG_MS;
      while (varSamples.length && varSamples[0].t < cutoff) varSamples.shift();

      if (!varSamples.length){
        variabilityHoldMs = 0;
        if (variabilityOn) setVariability(false);
        return;
      }

      let sum = 0;
      for (const s of varSamples) sum += s.v;
      const avg = sum / varSamples.length;

      const thr = variabilityOn ? VARIABILITY_OFF_THR : VARIABILITY_ON_THR;

      if (avg >= thr){
        variabilityHoldMs += dt;

        if (!variabilityOn && variabilityHoldMs >= VARIABILITY_ARM_MS){
          setVariability(true);
        }
      } else {
        variabilityHoldMs = 0;
        if (variabilityOn) setVariability(false);
      }
    }

    // =========================================================================
    // PAIR MODAL (QR popup)
    // =========================================================================
    function openPairModal(){
      els.pairModal.classList.add("on");
      els.pairModal.setAttribute("aria-hidden","false");
      renderQR(currentRoomChannel);
    }
    function closePairModal(){
      els.pairModal.classList.remove("on");
      els.pairModal.setAttribute("aria-hidden","true");
    }

    els.pairBtn.addEventListener("click", async () => {
      currentRoomChannel = "orb:" + randCode(6);
      await connect({ auto:false });
      resetShakeDetector();
      resetStability();
      resetVariability();
      resetEnergyBank();
      openPairModal();
    });

    els.pairBackdrop.addEventListener("click", closePairModal);
    els.pairClose.addEventListener("click", closePairModal);

    async function renderQR(roomChannel){
      els.qr.innerHTML = "";
      const url = phoneUrlFor(roomChannel);
      els.urlText.textContent = url;

      els.copyUrl.onclick = async () => {
        try{
          await navigator.clipboard.writeText(url);
          els.copyUrl.textContent = "Copied";
          setTimeout(() => els.copyUrl.textContent = "Copy", 700);
        }catch(_){
          els.copyUrl.textContent = "Nope";
          setTimeout(() => els.copyUrl.textContent = "Copy", 700);
        }
      };

      if (typeof QRCode === "undefined" || !QRCode.toCanvas) {
        els.qr.style.background = "#fff";
        els.qr.textContent = "QR lib failed to load";
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 280; canvas.height = 280;
      els.qr.appendChild(canvas);

      try{
        await QRCode.toCanvas(canvas, url, {
          width: 260,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" }
        });
      }catch(e){
        els.qr.textContent = "QR render error";
        console.error("QR render error:", e);
      }
    }

    // =========================================================================
    // TELEMETRY MODAL — buffered writer (less GC churn) + fix double-assign typo
    // =========================================================================
    let teleRecording = false;
    let teleT0 = 0;
    let teleLast = 0;
    let teleLines = 0;

    // ✅ NEW: buffered append (reduces textContent += churn)
    let teleBuf = [];
    let teleBufChars = 0;
    let teleFlushRAF = 0;

    function teleFlushNow(){
      teleFlushRAF = 0;
      if (!teleBuf.length) return;
      const chunk = teleBuf.join("");
      teleBuf.length = 0;
      teleBufChars = 0;
      els.teleOut.textContent += chunk;
      // keep "follow" behavior
      if (teleLines % 40 === 0) els.teleOut.scrollTop = els.teleOut.scrollHeight;
      // cap
      if (els.teleOut.textContent.length > 220000) {
        els.teleOut.textContent += "\n(TRUNCATED: output capped)\n";
        stopTeleRecording();
      }
    }

    function teleQueue(line){
      teleBuf.push(line);
      teleBufChars += line.length;
      // flush either next frame, or if buffer is getting chunky
      if (!teleFlushRAF) teleFlushRAF = requestAnimationFrame(teleFlushNow);
      if (teleBufChars > 8000) teleFlushNow();
    }

    function openTele(){
      els.teleModal.classList.add("on");
      els.teleModal.setAttribute("aria-hidden","false");
    }
    function stopTeleRecording(){
      teleRecording = false;
      els.teleRecBtn.textContent = "Record";
      els.teleRecBtn.classList.remove("recOn");
      if (teleFlushRAF) { cancelAnimationFrame(teleFlushRAF); teleFlushRAF = 0; }
      teleFlushNow();
    }
    function closeTele(){
      stopTeleRecording();
      els.teleModal.classList.remove("on");
      els.teleModal.setAttribute("aria-hidden","true");
    }

    function startTeleRecording(){
      teleRecording = true;
      teleT0 = performance.now();
      teleLast = teleT0;
      teleLines = 0;

      teleBuf.length = 0;
      teleBufChars = 0;
      if (teleFlushRAF) { cancelAnimationFrame(teleFlushRAF); teleFlushRAF = 0; }

      // ✅ FIX: remove duplicate assignment typo
      els.teleOut.textContent =
        "ms\tdms\tspeed01\tenergy01\tgroove01\tdynamics01\tsmooth01\tshake01\tlocked\thz\t" +
        "dirX\tdirY\tdirZ\t" +
        "raw_dirX\traw_dirY\traw_dirZ\t" +
        "raw_omegaX\traw_omegaY\traw_omegaZ\t" +
        "has_dir\thas_omega\t" +
        "d_r2\td_r3\td_gate\td_balance\td_couple\n";

      els.teleRecBtn.textContent = "Stop";
      els.teleRecBtn.classList.add("recOn");
    }

    function toggleTeleRecord(){
      if (!teleRecording) startTeleRecording();
      else stopTeleRecording();
    }

    els.teleBtn.addEventListener("click", openTele);
    els.teleBackdrop.addEventListener("click", closeTele);
    els.teleClose.addEventListener("click", closeTele);
    els.teleRecBtn.addEventListener("click", toggleTeleRecord);

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (els.teleModal.classList.contains("on")) closeTele();
      else if (els.pairModal.classList.contains("on")) closePairModal();
    });

    function telePick01(d, newKey, oldKey){
      if (d[newKey] != null) {
        const n = Number(d[newKey]);
        return isFinite(n) ? n : 0;
      }
      const n = Number(d[oldKey]);
      if (!isFinite(n)) return 0;
      return (n > 1.5) ? (n / 100) : n;
    }
    function telePickNum(d, key){
      const n = Number(d && d[key]);
      return isFinite(n) ? n : 0;
    }

    function teleHas(d, key){
      if (!d) return 0;
      if (d[key] != null) return 1;

      // ✅ NEW fallbacks: a -> dir, r -> omega
      if (key === "dir" && d.a != null) return 1;
      if (key === "omega" && d.r != null) return 1;

      return 0;
    }

    function telePickVecRaw(d, prefix){
      // prefix = "dir" or "omega"
      // Accepts:
      //  - d.dir / d.omega (array/object)
      //  - scalar dirX/dirY/dirZ, omegaX/omegaY/omegaZ
      //  - ✅ NEW fallbacks: d.a (for dir), d.r (for omega)
      const fallbackKey = (prefix === "dir") ? "a" : (prefix === "omega") ? "r" : null;

      const src = (d && (d[prefix] != null ? d[prefix] : (fallbackKey ? d[fallbackKey] : null)));

      let x = 0, y = 0, z = 0;

      if (Array.isArray(src) && src.length >= 3){
        x = Number(src[0]); y = Number(src[1]); z = Number(src[2]);
      } else if (src && typeof src === "object"){
        x = Number(src.x); y = Number(src.y); z = Number(src.z);
      } else {
        // scalar fields: dirX/dirY/dirZ or omegaX/omegaY/omegaZ
        x = Number(d && d[prefix + "X"]);
        y = Number(d && d[prefix + "Y"]);
        z = Number(d && d[prefix + "Z"]);
      }

      if (!isFinite(x) || !isFinite(y) || !isFinite(z)){
        return { x:0, y:0, z:0 };
      }
      return { x, y, z };
    }

    function teleMaybeLog(d){
      if (!teleRecording) return;

      const now = performance.now();
      const ms  = Math.max(0, now - teleT0);
      const dms = Math.max(0, now - teleLast);
      teleLast = now;

      const energy   = telePick01(d, "energy01", "energy");
      const groove   = telePick01(d, "groove01", "groove");
      const dynamics = telePick01(d, "dynamics01", "orbit01");
      const smooth   = telePick01(d, "smooth01", "smooth");
      const speed    = telePick01(d, "speed01", "speed");
      const shake    = telePick01(d, "shake01", "shake");

      const locked = !!d.locked;
      const hz = (d.hz != null && isFinite(Number(d.hz))) ? Number(d.hz) : 0;

      // normalized for telemetry (your existing function later in file)
      const dirV = pickDirVec(d);
      const dirX = dirV ? dirV.x : 0;
      const dirY = dirV ? dirV.y : 0;
      const dirZ = dirV ? dirV.z : 0;

      const d_r2      = (d.d_r2 != null) ? telePickNum(d, "d_r2") : telePickNum(d, "o_r2");
      const d_r3      = (d.d_r3 != null) ? telePickNum(d, "d_r3") : telePickNum(d, "o_r3");
      const d_gate    = (d.d_gate != null) ? telePickNum(d, "d_gate") : telePickNum(d, "o_gate");
      const d_balance = (d.d_balance != null) ? telePickNum(d, "d_balance") : telePickNum(d, "o_balance");
      const d_couple  = (d.d_couple != null) ? telePickNum(d, "d_couple") : telePickNum(d, "o_couple");

      // raw vector probes
      const rawDir   = telePickVecRaw(d, "dir");
      const rawOmega = telePickVecRaw(d, "omega");
      const hasDir   = teleHas(d, "dir");
      const hasOmega = teleHas(d, "omega");

      const line =
        `${ms.toFixed(1)}\t${dms.toFixed(1)}\t` +
        `${speed.toFixed(4)}\t${energy.toFixed(4)}\t${groove.toFixed(4)}\t${dynamics.toFixed(4)}\t${smooth.toFixed(4)}\t${shake.toFixed(4)}\t` +
        `${locked ? 1 : 0}\t${hz.toFixed(3)}\t` +
        `${dirX.toFixed(4)}\t${dirY.toFixed(4)}\t${dirZ.toFixed(4)}\t` +
        `${rawDir.x.toFixed(4)}\t${rawDir.y.toFixed(4)}\t${rawDir.z.toFixed(4)}\t` +
        `${rawOmega.x.toFixed(4)}\t${rawOmega.y.toFixed(4)}\t${rawOmega.z.toFixed(4)}\t` +
        `${hasDir}\t${hasOmega}\t` +
        `${d_r2.toFixed(4)}\t${d_r3.toFixed(4)}\t${d_gate.toFixed(4)}\t${d_balance.toFixed(4)}\t${d_couple.toFixed(4)}\n`;

      teleLines++;
      // ✅ NEW: queue instead of immediate textContent +=
      teleQueue(line);
    }

    // =========================================================================
    // ROOM STATE
    // =========================================================================
    function readUrlRoomOrNull(){
      try{
        const u = new URL(location.href);
        const r = (u.searchParams.get("room") || "").trim();
        if (!r) return null;
        return normalizeRoom(r);
      }catch(_){
        return null;
      }
    }
    let currentRoomChannel = normalizeRoom(readUrlRoomOrNull() || "orb:test");

    // =========================================================================
    // PHYSICS + STARFIELD — unchanged (with tiny grounded flag)
    // =========================================================================
    const WORLD_H = 5000;

    const SHIELD_DESCENT = {
      vDownThr: 60,
      graceMs: 260
    };

    const PHYS = {
      groundFromBottomPx: 17,
      groundLinePx: 2,
      orbRadiusPx: 50,

      gBase: 2200,
      thrustMax: 3000,

      upDrag:   2.6,
      downDrag: 1.0,

      bounce: 0.35,
      maxUpSpeed: 2200,
      maxDownSpeed: 2800,
    };

    function groundCenterWorld(){
      return WORLD_H - (PHYS.groundFromBottomPx + PHYS.groundLinePx + PHYS.orbRadiusPx);
    }

    let physState = {
      yW: 0,
      v:  0,
      lastTs: null,
      gravityMul: 0.40,

      lift01: 0,
      energy01: 0,
      dynamics01: 0,

      onGround: false,

      descendMs: 0,
      shieldDescentBlocked: false,
    };

    function stageRect(){
      return els.physStage.getBoundingClientRect();
    }

    function cameraTopFor(yW, stageH){
      const maxCam = Math.max(0, WORLD_H - stageH);
      const target = yW - stageH * 0.5;
      return clamp(target, 0, maxCam);
    }

    function orbScreenY(){
      const h = stageRect().height;
      const camTop = cameraTopFor(physState.yW, h);
      return physState.yW - camTop;
    }

    function applyOrbTransform(){
      const y = orbScreenY();
      const top = y - PHYS.orbRadiusPx;
      els.orbWrap.style.transform = `translate(-50%, ${top.toFixed(2)}px)`;
    }

    function resetOrbToGround(){
      physState.yW = groundCenterWorld();
      physState.v = 0;
      physState.onGround = true;
      applyOrbTransform();
    }

    function setGravityMul(m){
      physState.gravityMul = clamp(Number(m) || 0, 0, 3);
      els.gVal.textContent = physState.gravityMul.toFixed(2);
    }
    setGravityMul(els.gSlider.value);
    els.gSlider.addEventListener("input", (e) => setGravityMul(e.target.value));

    function setDownDrag(v){
      PHYS.downDrag = clamp(Number(v) || 0, 0, 10);
      els.dVal.textContent = PHYS.downDrag.toFixed(2);
    }
    setDownDrag(els.dSlider.value);
    els.dSlider.addEventListener("input", (e) => setDownDrag(e.target.value));

    const STAR = {
      layers: [
        { count: 110, rMin: 0.6, rMax: 1.6, aMin: 0.25, aMax: 0.75 },
        { count:  70, rMin: 1.0, rMax: 2.4, aMin: 0.30, aMax: 0.95 },
      ],
    };

    const STAR_COLORS = [
      [240,240,243],
      [245,231,214],
      [236,194,133],
      [219,150, 85],
      [192,132, 74],
      [185, 41,  7],
      [ 73,124,154],
      [ 40, 83,134],
      [ 90, 68,106],
      [120, 59, 87],
    ];

    let starCtx = null;
    let starW = 0, starH = 0;
    let starLayers = [];

    function r01(){ return Math.random(); }
    function rIn(a,b){ return a + (b-a) * r01(); }

    function wrap(v, size){
      v = v % size;
      return (v < 0) ? (v + size) : v;
    }

    function pickStarRGB(layerIndex){
      const n = STAR_COLORS.length;
      if (layerIndex === 0){
        const warmBias = (r01() < 0.72);
        if (warmBias){
          const idx = [0,1,2,3,4][(Math.random()*5)|0];
          return STAR_COLORS[idx];
        }
      }
      return STAR_COLORS[(Math.random()*n)|0];
    }

    function starResize(regen=false){
      const c = els.stars;
      if (!c) return;

      const rect = stageRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));

      if (!regen && w === starW && h === starH && c.width === Math.floor(w*dpr) && c.height === Math.floor(h*dpr)) return;

      starW = w; starH = h;

      c.width  = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";

      starCtx = c.getContext("2d", { alpha: false });
      if (starCtx) starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      starLayers = STAR.layers.map((L, layerIndex) => {
        const arr = [];
        for (let i=0;i<L.count;i++){
          const rgb = pickStarRGB(layerIndex);
          arr.push({
            x: rIn(0, w),
            yW: rIn(0, WORLD_H),
            r: rIn(L.rMin, L.rMax),
            a: rIn(L.aMin, L.aMax),
            cr: rgb[0], cg: rgb[1], cb: rgb[2],
          });
        }
        return { cfg: L, stars: arr };
      });
    }

    function drawStars(){
      if (!starCtx) return;
      const ctx = starCtx;
      const w = starW, h = starH;

      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,w,h);

      const camTop = cameraTopFor(physState.yW, h);

      for (const layer of starLayers){
        for (const s of layer.stars){
          const x = s.x;
          const y = wrap((s.yW - camTop), h);

          ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${s.a})`;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI*2);
          ctx.fill();
        }
      }

      const vg = ctx.createRadialGradient(w*0.5, h*0.42, Math.min(w,h)*0.10, w*0.5, h*0.42, Math.max(w,h)*0.75);
      vg.addColorStop(0, "rgba(0,0,0,0.0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0,0,w,h);
    }

    requestAnimationFrame(() => {
      resetOrbToGround();
      starResize(true);
      drawStars();
    });

    window.addEventListener("resize", () => {
      resetOrbToGround();
      starResize(true);
      drawStars();
    });

    function liftToThrustAccel(l01){
      return PHYS.thrustMax * clamp01(l01);
    }

    function physicsStep(ts){
      if (physState.lastTs == null) physState.lastTs = ts;
      let dt = (ts - physState.lastTs) / 1000;
      physState.lastTs = ts;

      dt = clamp(dt, 0, 0.05);

      const g = PHYS.gBase * physState.gravityMul;
      const thrust = liftToThrustAccel(physState.lift01);

      let a = g - thrust;

      const drag = (physState.v >= 0) ? PHYS.downDrag : PHYS.upDrag;
      a += (-drag * physState.v);

      physState.v += a * dt;
      physState.v = clamp(physState.v, -PHYS.maxUpSpeed, PHYS.maxDownSpeed);

      physState.yW += physState.v * dt;

      const dtMs = dt * 1000;

      if (physState.v > SHIELD_DESCENT.vDownThr) {
        physState.descendMs = Math.min(SHIELD_DESCENT.graceMs * 2, physState.descendMs + dtMs);
      } else {
        physState.descendMs = 0;
      }

      physState.shieldDescentBlocked = (physState.descendMs >= SHIELD_DESCENT.graceMs);

      const yFloor = groundCenterWorld();
      const yCeil  = PHYS.orbRadiusPx;

      physState.onGround = false;

      if (physState.yW > yFloor) {
        physState.yW = yFloor;
        if (physState.v > 0) physState.v = 0;
        physState.onGround = true;
      }

      if (physState.yW < yCeil) {
        physState.yW = yCeil;
        if (physState.v < 0) physState.v = -physState.v * PHYS.bounce;
      }

      drawStars();
      applyOrbTransform();
      requestAnimationFrame(physicsStep);
    }
    requestAnimationFrame(physicsStep);

    // =========================================================================
    // ABLY RECEIVER — unchanged plumbing
    // =========================================================================
    let realtime = null;
    let channel = null;

    const IDLE = {
      idleMs: 1 * 60 * 1000,
      warnMs: 90 * 1000,
      hardMaxMs: 15 * 60 * 1000,
      checkEveryMs: 1000
    };

    let idleLastMsgAt = performance.now();
    let idleWarned = false;
    let idleInterval = null;
    let idleHardTO = null;

    function idleMarkActivity(){
      idleLastMsgAt = performance.now();
      idleWarned = false;
    }

    function idleClearTimers(){
      if (idleInterval) { clearInterval(idleInterval); idleInterval = null; }
      if (idleHardTO) { clearTimeout(idleHardTO); idleHardTO = null; }
    }

    function idleDisconnect(reason){
      idleClearTimers();
      try { if (channel) channel.unsubscribe(); } catch(_) {}
      try { if (channel) channel.detach(); } catch(_) {}
      try { if (realtime) realtime.close(); } catch(_) {}
      channel = null;
      realtime = null;
      setStatus(reason, "bad");
    }

    function idleStartTimers(){
      idleClearTimers();
      idleMarkActivity();

      idleInterval = setInterval(() => {
        const now = performance.now();
        const dt = now - idleLastMsgAt;

        if (!idleWarned && dt >= IDLE.warnMs && dt < IDLE.idleMs){
          idleWarned = true;
          setStatus(`Idle soon… <span class="dim">(no messages)</span>`, "dim");
        }

        if (dt >= IDLE.idleMs){
          idleDisconnect("Idle timeout — refresh page");
        }
      }, IDLE.checkEveryMs);

      idleHardTO = setTimeout(() => {
        idleDisconnect("Session cap reached — refresh page");
      }, IDLE.hardMaxMs);
    }

    let lastData = null;
    let rafPending = false;

    function scheduleUIUpdate(data){
      lastData = data;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!lastData) return;
        applyDataToUI(lastData);
      });
    }

    function pickDirVec(d){
      // Priority:
      // 1) d.dir
      // 2) d.a   (accelIncludingGravity)
      // 3) d.omega
      // 4) d.r   (rotationRate)
      // 5) scalar dirX.. / omegaX..
      const src =
        (d && (d.dir != null ? d.dir :
          d.a   != null ? d.a   :
          d.omega != null ? d.omega :
          d.r   != null ? d.r   :
          null));

      let x=0,y=0,z=0;

      if (Array.isArray(src) && src.length >= 3){
        x = Number(src[0]); y = Number(src[1]); z = Number(src[2]);
      } else if (src && typeof src === "object"){
        x = Number(src.x); y = Number(src.y); z = Number(src.z);
      } else {
        // scalar fields (prefer dir*, then omega*)
        x = Number(d && (d.dirX != null ? d.dirX : d.omegaX));
        y = Number(d && (d.dirY != null ? d.dirY : d.omegaY));
        z = Number(d && (d.dirZ != null ? d.dirZ : d.omegaZ));
      }

      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return null;

      const m = Math.hypot(x,y,z);
      if (!(m > 1e-6)) return null;

      return { x:x/m, y:y/m, z:z/m, mag:m };
    }

    function dirToYawTiltDeg(v){
      // yaw around vertical axis (x/y plane), tilt from horizon via z
      const yaw = Math.atan2(v.y, v.x) * 180/Math.PI;   // -180..180
      const tilt = Math.asin(clamp(v.z, -1, 1)) * 180/Math.PI; // -90..90
      return { yaw, tilt };
    }

    function applyDataToUI(d){
      function pick01NewOrOld(newKey, oldKey){
        if (d[newKey] != null) {
          const n = Number(d[newKey]);
          return isFinite(n) ? n : 0;
        }
        const n = Number(d[oldKey]);
        if (!isFinite(n)) return 0;
        return (n > 1.5) ? (n / 100) : n;
      }

      const nowMs = performance.now();

      const energyFromPhone   = pick01NewOrOld("energy01", "energy");
      const groove   = pick01NewOrOld("groove01", "groove");
      const dynamics = pick01NewOrOld("dynamics01", "orbit01");
      const smooth   = pick01NewOrOld("smooth01", "smooth");
      const speed    = pick01NewOrOld("speed01", "speed");
      const shake    = pick01NewOrOld("shake01", "shake");
      const locked   = !!d.locked;
      
      // cache gravity + raw omega/accel (foundation + shake)
      cacheGravityFromMsg(d);
      cacheRawOmegaFromMsg(d);
      cacheRawAccelFromMsg(d);
      pushMotionSample(nowMs);

      // if calibrating, consume samples continuously from the incoming stream
      orientTryConsumeOmegaSample(lastRawOmega);

      updateEnergyBankFromPhone(energyFromPhone, nowMs);

      const energyUI01 = energyBankPts / 100;
      const lift = computeLift01(groove, smooth, speed);

      physState.lift01 = lift;
      physState.energy01 = Math.max(0, Number(energyUI01) || 0);
      physState.dynamics01 = dynamics;

      setBgFromEnergy(energyUI01);

      const liftP = Math.round(clamp01(lift) * 100);
      const gP = Math.round(clamp01(groove) * 100);
      const sP = Math.round(clamp01(smooth) * 100);
      const sp = Math.round(clamp01(speed) * 100);
      const dP = Math.round(clamp01(dynamics) * 100);
      const sh = Math.round(Math.max(0, Number(shake) || 0) * 100);
      const ePts = Math.round(energyBankPts);

      els.vLift.textContent     = `${liftP}%`;
      els.vGroove.textContent   = `${gP}%${locked ? " (locked)" : ""}`;
      els.vSmooth.textContent   = `${sP}%`;
      els.vSpeed.textContent    = `${sp}%`;
      els.vDynamics.textContent = `${dP}%`;
      els.vEnergy.textContent   = `${ePts}%`;
      els.vShake.textContent    = `${Math.max(0, sh)}%`;

      setBar(els.bLift,  lift);
      setBar(els.bGroove, groove);
      setBar(els.bSmooth, smooth);
      setBar(els.bSpeed,  speed);
      setBar(els.bDynamics, dynamics);
      setBar(els.bEnergy, energyUI01);
      setBar(els.bShake,  shake);

      const over = (energyUI01 > 1);
      els.vEnergy.classList.toggle("over", over);
      els.bEnergy.classList.toggle("over", over);

      // --- Direction readout (optional; does nothing if phone isn't sending it yet)
      const dirV = pickDirVec(d);
      if (els.dirReadout){
        if (dirV){
          const a = dirToYawTiltDeg(dirV);
          const yaw = ((a.yaw % 360) + 360) % 360; // 0..360
          els.dirReadout.textContent = `${yaw.toFixed(0)}° yaw  |  ${a.tilt.toFixed(0)}° tilt`;
        } else {
          els.dirReadout.textContent = "—";
        }
      }

      // sd is only sent by the phone on shakeHit (lean)
      if (d && typeof d.sd === "string" && d.sd.trim()) {
        flashDirLamp(d.sd, 420);
      }

      stabilityVisualGate =
        (!physState.onGround) &&
        (clamp01(speed) >= STABILITY_SPEED_MIN) &&
        (!physState.shieldDescentBlocked);

      applyStabilityVisuals();

      updateStability(dynamics, nowMs);
      updateVariability(dynamics, nowMs);

      // During orientation training, we pause shake gameplay (no energy spend / detonation)
      if (!ORIENT.active){
        processShakeDoubleBang(shake, nowMs);
      } else {
        // keep shake lamp OFF during training
        forceShakeLampOff();
      }

      setAudio(energyUI01, groove, locked);
    }

    let connecting = false;

    async function connect(opts = {}){
      if (connecting) return;
      connecting = true;

      const roomChannel = currentRoomChannel;

      if (typeof Ably === "undefined" || !Ably.Realtime) {
        fatal("Ably library failed to load. Check DevTools → Console/Network for blocked CDN scripts.");
        setStatus("FAILED — Ably lib missing", "bad");
        connecting = false;
        return;
      }

      setStatus(
        opts.auto
          ? `Auto-connecting… <span class="dim">(${roomChannel})</span>`
          : `Connecting… <span class="dim">(${roomChannel})</span>`,
        "ok"
      );

      idleClearTimers();

      try { if (channel) channel.unsubscribe(); } catch(e) {}
      try { if (realtime) realtime.close(); } catch(e) {}
      realtime = null; channel = null;

      const roomCode = stripOrbPrefix(roomChannel);
      const authUrl = WORKER_BASE + "/token?room=" + encodeURIComponent(roomCode) + "&v=" + Date.now();

      realtime = new Ably.Realtime({ authUrl, echoMessages:false });

      realtime.connection.on("connected", () => setStatus(`Connected ✓ <span class="dim">(${roomChannel})</span>`, "ok"));
      realtime.connection.on("failed", (st) => { console.error("Ably failed:", st); setStatus("FAILED — see console", "bad"); });
      realtime.connection.on("disconnected", () => setStatus("Disconnected <span class=\"dim\">(refresh page)</span>", "bad"));

      channel = realtime.channels.get(roomChannel);

      channel.attach((err) => {
        if (err) { console.error("Channel attach failed:", err); setStatus("Channel attach FAILED — see console", "bad"); return; }
        setStatus(`Connected ✓ (listening…) <span class="dim">(${roomChannel})</span>`, "ok");
        idleStartTimers();
      });

      channel.subscribe("orb", (msg) => {
        idleMarkActivity();

        const d = (msg && msg.data) ? msg.data : {};

        let s = "";
        try { s = JSON.stringify(d); } catch(_) { s = String(d); }
        if (s.length > 240) s = s.slice(0, 240) + " …";
        els.last.textContent = s;

        if (els.pairModal.classList.contains("on")) closePairModal();

        // If the start screen is still up for some reason, drop it on first msg.
        if (els.startScreen && !els.startScreen.classList.contains("off")) {
          els.startScreen.classList.add("off");
        }

        teleMaybeLog(d);
        scheduleUIUpdate(d);
      });

      connecting = false;
    }

    // DEV button forces room=test always + launches QR
    els.newRoom.addEventListener("click", async () => {
      currentRoomChannel = "orb:test";
      resetShakeDetector();
      resetStability();
      resetVariability();
      resetEnergyBank();
      await connect({ auto:false });
      openPairModal();
    });

    els.startBtn.addEventListener("click", async () => {
      // This click is a user gesture → allowed to start AudioContext
      if (!audioEnabled) await enableAudio();

      // Hide immediately (visual intent), then run exact same behavior as Pair Phone.
      els.startScreen.classList.add("off");
      els.pairBtn.click();
    });

    (async function init(){
      connect({ auto:true });
    })();
