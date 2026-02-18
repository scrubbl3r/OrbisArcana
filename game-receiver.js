    const $ = (id) => document.getElementById(id);

    const els = {
      startScreen: $("startScreen"),
      startBtn: $("startBtn"),
      startQr: $("startQr"),

      pairBtn: $("pairBtn"),
      lanPartyBtn: $("lanPartyBtn"),
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
      orbInterior: $("orbInterior"),
      orbCracks: $("orbCracks"),
      orbShards: $("orbShards"),
      testGlobe: $("testGlobe"),
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

      calibOverlay: $("calibOverlay"),
      calibBtn: $("calibBtn"),
      calibStatus: $("calibStatus"),
      deathPanel: $("deathPanel"),
      tryAgainBtn: $("tryAgainBtn"),

      // ===== LAN PARTY (P2P) BEGIN =====
      lanModal: $("lanModal"),
      lanBackdrop: $("lanBackdrop"),
      lanClose: $("lanClose"),
      lanQr: $("lanQr"),
      lanUrlText: $("lanUrlText"),
      lanCopyUrl: $("lanCopyUrl"),
      lanRoomCode: $("lanRoomCode"),
      lanCode6: $("lanCode6"),
      lanConnState: $("lanConnState"),
      lanSafeState: $("lanSafeState"),
      lanEndBtn: $("lanEndBtn"),
      // ===== LAN PARTY (P2P) END =====
    };

    const LAST_MESSAGE_ON = false; // disable Last Message debug output

    const WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";

    function clamp01(x){ x = Number(x); return Math.max(0, Math.min(1, isFinite(x) ? x : 0)); }
    function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
    const lerp = (a,b,t) => a + (b-a)*t;

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

    // ===== LAN PARTY (P2P) BEGIN =====
    function randomTokenBytes(n=16){
      const arr = new Uint8Array(n);
      crypto.getRandomValues(arr);
      return arr;
    }
    function toHex(bytes){
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    function code6FromTokenHex(tokenHex){
      const tail = tokenHex.slice(-10);
      const n = parseInt(tail, 16) % 1000000;
      return String(n).padStart(6, "0");
    }
    function lanPairChannelFor(roomId){
      const code = String(roomId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "TEST";
      return "orb:" + code;
    }
    function lanJoinUrl(roomId, token){
      const base = mobilePageBaseUrl();
      return base + "?join=1&room=" + encodeURIComponent(roomId) + "&token=" + encodeURIComponent(token);
    }
    function nowTs(){ return Date.now(); }
    function nonce8(){ return toHex(randomTokenBytes(8)); }
    // ===== LAN PARTY (P2P) END =====

    function syncStartQrSizeToTitlePx(){
      if (!els.startBtn || !els.startQr) return 0;
      const titleEl = els.startBtn.querySelector("span");
      if (!titleEl) return 0;
      const titleWidthPx = Math.round(titleEl.getBoundingClientRect().width || 0);
      if (!(titleWidthPx > 0)) return 0;
      els.startQr.style.width = `${titleWidthPx}px`;
      els.startQr.style.height = `${titleWidthPx}px`;
      els.startQr.dataset.titleWidthPx = String(titleWidthPx);
      return titleWidthPx;
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

    function mobilePageBaseUrl(){
      try {
        return new URL("./mobile-transmitter.html", window.location.href).toString();
      } catch (_) {
        return "https://scrubbl3r.github.io/OrbisArcana/mobile-transmitter.html";
      }
    }

    function phoneUrlFor(roomChannel){
      const base = mobilePageBaseUrl();
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
    // CALIBRATION OVERLAY
    // =========================================================================
    let calibInFlight = false;
    let calibAvailable = false;

    function openCalibOverlay(){
      if (!els.calibOverlay) return;
      els.calibOverlay.classList.remove("off");
      els.calibOverlay.setAttribute("aria-hidden","false");
      if (els.calibBtn) els.calibBtn.disabled = !calibAvailable;
    }

    function closeCalibOverlay(){
      if (!els.calibOverlay) return;
      els.calibOverlay.classList.add("off");
      els.calibOverlay.setAttribute("aria-hidden","true");
      if (els.calibBtn) els.calibBtn.disabled = false;
      calibInFlight = false;
    }

    function setCalibStatus(msg){
      if (els.calibStatus) els.calibStatus.textContent = msg;
    }

    function openDeathOverlay(){
      if (!els.deathPanel) return;
      els.deathPanel.classList.remove("off");
      els.deathPanel.setAttribute("aria-hidden","false");
    }

    function closeDeathOverlay(){
      if (!els.deathPanel) return;
      els.deathPanel.classList.add("off");
      els.deathPanel.setAttribute("aria-hidden","true");
    }

    let deathOverlayTO = 0;
    function scheduleDeathOverlay(){
      if (deathOverlayTO) {
        clearTimeout(deathOverlayTO);
        deathOverlayTO = 0;
      }
      closeDeathOverlay();
      deathOverlayTO = setTimeout(() => {
        deathOverlayTO = 0;
        openDeathOverlay();
      }, DEATH_FLOW_DELAY_MS);
    }

    function clearDeathOverlaySchedule(){
      if (!deathOverlayTO) return;
      clearTimeout(deathOverlayTO);
      deathOverlayTO = 0;
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
        pulseMin: 0.30,
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

    const SHIELD_COLOR_SMOOTH = 1.00; // snap colors (no smoothing)
    let shieldColor01 = { r: 120/255, g: 210/255, b: 255/255 };

    function setShieldColor01(c){
      const r = Math.round(clamp01(c.r) * 255);
      const g = Math.round(clamp01(c.g) * 255);
      const b = Math.round(clamp01(c.b) * 255);
      setVar("--shield-r", String(r));
      setVar("--shield-g", String(g));
      setVar("--shield-b", String(b));
    }

    function evenStroke(n, min = 2, max = 20){
      n = Math.round(Number(n) || min);
      n = Math.max(min, Math.min(max, n));
      if (n % 2 === 1) n += 1;
      return n;
    }

    const SHIELD_DECAY_MS = 2000;
    const SHIELD_FADEIN_MS = 750;
    let shieldDecayTO = null;
    let shieldDecayActive = 0;
    let shieldFadeTO = null;
    let shieldFadeVal = 1;

    function cancelShieldDecay(){
      if (shieldDecayTO) {
        clearTimeout(shieldDecayTO);
        shieldDecayTO = null;
      }
      shieldDecayActive = 0;
      if (els.shield) els.shield.style.opacity = "";
    }
    function cancelShieldFade(){
      if (shieldFadeTO) {
        clearTimeout(shieldFadeTO);
        shieldFadeTO = null;
      }
    }
    function setShieldFade(v){
      shieldFadeVal = clamp01(v);
      if (els.shield) els.shield.style.setProperty("--shield-fade", String(shieldFadeVal));
    }

    function shieldOffNow(){
      if (!els.shield) return;
      cancelShieldDecay();
      cancelShieldFade();
      setShieldFade(1);
      els.shield.classList.remove("on");
      els.shield.style.opacity = "";
      els.shield.style.animation = "";
    }

    function shieldOnNow(){
      if (!els.shield) return;
      cancelShieldDecay();
      cancelShieldFade();

      const a  = clamp(VFX_DEFAULTS.shield.alpha, 0, 1);
      const pMax = Math.min(clamp(VFX_DEFAULTS.shield.pulseMax, 0, 1), a);
      const pMin = clamp(VFX_DEFAULTS.shield.pulseMin, 0, 1);
      const pMs  = Math.round(clamp(VFX_DEFAULTS.shield.pulseMs, 20, 700));

      setVar("--shield-alpha", a.toFixed(2));
      setVar("--shield-pulse-ms", pMs + "ms");
      setVar("--shield-pulse-min", pMin.toFixed(2));
      setVar("--shield-pulse-max", pMax.toFixed(2));

      if (!els.shield.classList.contains("on")) {
        shieldOffNow();
        void els.shield.offsetWidth;
        els.shield.classList.add("on");
      }

      // Fade in to target alpha (from current fade if mid-decay)
      els.shield.style.animation = "";
      els.shield.style.transition = `filter ${SHIELD_FADEIN_MS}ms linear`;
      requestAnimationFrame(() => {
        setShieldFade(1);
      });
      shieldFadeTO = setTimeout(() => {
        shieldFadeTO = null;
        els.shield.style.transition = "";
      }, SHIELD_FADEIN_MS);
    }

    function shieldDecay(){
      if (!els.shield) return;
      if (shieldDecayTO) return;
      shieldDecayActive = 1;
      els.shield.style.animation = "";
      els.shield.style.transition = `filter ${SHIELD_DECAY_MS}ms linear`;
      requestAnimationFrame(() => {
        setShieldFade(0);
      });
      shieldDecayTO = setTimeout(() => {
        shieldDecayTO = null;
        shieldDecayActive = 0;
        els.shield.style.transition = "";
        shieldOffNow();
      }, SHIELD_DECAY_MS);
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
      if (els.audioBtn){
        els.audioBtn.textContent = "Audio: On";
        els.audioBtn.classList.add("on");
        els.audioBtn.classList.remove("dim");
      }
    }

    function disableAudio() {
      audioEnabled = false;
      if (els.audioBtn){
        els.audioBtn.textContent = "Audio: Off";
        els.audioBtn.classList.remove("on");
      }
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
    if (els.audioBtn){
      els.audioBtn.addEventListener("click", async () => {
        if (!audioEnabled) await enableAudio();
        else disableAudio();
      });
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

    function flashDirLampSingle(code, ms=380){
      clearDirLampTimers();
      allDirLampOff();
      flashDirLamp(code, ms);
    }

    // =========================================================================
    // ENERGY BANK (receiver-side battery)
    // =========================================================================
    const ENERGY_BANK_CAP = 1000;
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
    // SHAKE THRESHOLD + energy-gated detonation (receiver-side gate)
    // =========================================================================
    const SHAKE_COOLDOWN_MS = 2500; // Minimum time between shake lamp triggers (ms)
    const SHAKE_MODE = 2; // 1=main only, 2=axis pairs (UD/LR/FB), 3=full 6-direction
    const SHAKE_REARM_THR = 0.10; // Shake01 must drop below this to re-arm after a hit
    const GROOVE_SHAKE_GATE = 0.20; // Hard gate: if groove01 is above this, shake is ignored
    const SHAKE_LAMP_THR = 1.65; // Receiver shake01 threshold to trigger shake lamp (0–2 scale)
    const SD_RECENT_MS = 750; // Direction label must arrive within this window (ms) to flash lamp

    let shakeCooldownUntil = 0;
    let shakeArmed = true;
    let pendingSd = null;
    let pendingSdAt = 0;

    function resetShakeDetector(){
      shakeCooldownUntil = 0;
      shakeArmed = true;
      forceShakeLampOff();
      pendingSd = null;
      pendingSdAt = 0;

      // ✅ NEW: hard-clear any queued direction timers
      clearDirLampTimers();
      allDirLampOff();
    }

    function resetShakeCachesAfterHit(){
      // Clear direction cache without killing lamp/cooldown
      pendingSd = null;
      pendingSdAt = 0;
    }

    function flashDirLampPair(a, b, ms=380){
      clearDirLampTimers();
      allDirLampOff();
      flashDirLamp(a, ms);
      flashDirLamp(b, ms);
    }

    function registerShakeHit(nowMs){
      if (nowMs < shakeCooldownUntil) return;

      if (isDiversityLampLit()){
        return;
      }

      if (!canSpendShake()) return;

      spendShake();
      flashShakeLamp(400);
      triggerShockwave();

      if (pendingSd && (nowMs - pendingSdAt) <= SD_RECENT_MS) {
        const code = String(pendingSd || "").trim().toUpperCase();
        if (SHAKE_MODE === 1) {
          clearDirLampTimers();
          allDirLampOff();
        } else if (SHAKE_MODE === 2) {
          if (code === "U" || code === "D") flashDirLampPair("U", "D", 420);
          else if (code === "L" || code === "R") flashDirLampPair("L", "R", 420);
          else if (code === "F" || code === "B") flashDirLampPair("F", "B", 420);
        } else {
          flashDirLampSingle(code, 420);
        }
      }

      // Reset shake-related caches after a successful hit (do not kill lamp/cooldown)
      resetShakeCachesAfterHit();
      shakeCooldownUntil = nowMs + SHAKE_COOLDOWN_MS;
    }

    function processShakeDoubleBang(shakeVal01, nowMs, groove01){
      const v = Number(shakeVal01);
      if (!isFinite(v)) return;
      // Hard gate: only allow shake when groove <= GROOVE_SHAKE_GATE
      if (Number(groove01) > GROOVE_SHAKE_GATE) return;

      if (nowMs < shakeCooldownUntil) forceShakeLampOff();
      // Cooldown gate only (meter can still rise during cooldown)
      if (nowMs < shakeCooldownUntil) return;
      if (v < SHAKE_LAMP_THR) return;
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
      else shieldDecay();

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

    if (els.pairBtn) {
      els.pairBtn.addEventListener("click", async () => {
        await launchLanPairingFlow();
      });
    }

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

    // ===== LAN PARTY (P2P) BEGIN =====
    const LAN_TOKEN_TTL_MS = 3 * 60 * 1000;
    const LAN_STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

    const lanParty = {
      active: false,
      roomId: "",
      token: "",
      code6: "",
      expiresAt: 0,
      pairRealtime: null,
      pairChannel: null,
      pc: null,
      dc: null,
      gameplayEnabled: false,
      offerSdp: "",
      offerRetryTO: null,
      expiryTO: null,
      helloSeen: false,
    };

    function setLanConnState(msg){
      if (els.lanConnState) els.lanConnState.textContent = "Status: " + msg;
    }
    function setLanSafeState(msg){
      if (els.lanSafeState) els.lanSafeState.textContent = "LAN SAFE: " + msg;
    }
    function openLanModal(){
      if (!els.lanModal) return;
      els.lanModal.classList.add("on");
      els.lanModal.setAttribute("aria-hidden", "false");
    }
    function closeLanModal(){
      if (!els.lanModal) return;
      els.lanModal.classList.remove("on");
      els.lanModal.setAttribute("aria-hidden", "true");
    }

    function cleanupLanSignaling(){
      try { if (lanParty.pairChannel) lanParty.pairChannel.unsubscribe(); } catch (_) {}
      try { if (lanParty.pairChannel) lanParty.pairChannel.detach(); } catch (_) {}
      try { if (lanParty.pairRealtime) lanParty.pairRealtime.close(); } catch (_) {}
      lanParty.pairChannel = null;
      lanParty.pairRealtime = null;
    }

    function cleanupLanPeer(){
      if (lanParty.offerRetryTO) {
        clearTimeout(lanParty.offerRetryTO);
        lanParty.offerRetryTO = null;
      }
      if (lanParty.expiryTO) {
        clearTimeout(lanParty.expiryTO);
        lanParty.expiryTO = null;
      }
      try { if (lanParty.dc) lanParty.dc.close(); } catch (_) {}
      try { if (lanParty.pc) lanParty.pc.close(); } catch (_) {}
      lanParty.dc = null;
      lanParty.pc = null;
      lanParty.offerSdp = "";
      lanParty.helloSeen = false;
    }

    function resetLanParty(){
      if (lanParty.active && lanParty.pairChannel) {
        publishLanSignal("abort", { reason: "host_closed" });
      }
      lanParty.active = false;
      lanParty.gameplayEnabled = false;
      cleanupLanPeer();
      cleanupLanSignaling();
      setLanConnState("Closed");
      setLanSafeState("Pending…");
    }

    async function renderQrInto(el, url, size){
      if (!el) return;
      el.innerHTML = "";
      if (typeof QRCode === "undefined" || !QRCode.toCanvas) {
        el.textContent = "QR unavailable";
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      el.appendChild(canvas);
      try {
        await QRCode.toCanvas(canvas, url, {
          width: Math.max(120, size - 20),
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" }
        });
      } catch (e) {
        el.textContent = "QR render error";
      }
    }

    async function renderLanQr(url){
      const startSize = syncStartQrSizeToTitlePx() || 280;
      await Promise.all([
        renderQrInto(els.lanQr, url, 280),
        renderQrInto(els.startQr, url, startSize),
      ]);
    }

    async function connectLanSignalChannel(roomId){
      const pairRoom = lanPairChannelFor(roomId);
      const authUrl = WORKER_BASE + "/token?room=" + encodeURIComponent(stripOrbPrefix(pairRoom)) + "&v=" + Date.now();
      const rt = new Ably.Realtime({ authUrl, echoMessages: false });
      const ch = rt.channels.get(pairRoom);
      await new Promise((resolve, reject) => {
        ch.attach((err) => err ? reject(err) : resolve());
      });
      lanParty.pairRealtime = rt;
      lanParty.pairChannel = ch;
    }

    function lanMsgValid(d){
      if (!d || typeof d !== "object") return false;
      if (!lanParty.active) return false;
      if (String(d.room || "") !== lanParty.roomId) return false;
      if (String(d.token || "") !== lanParty.token) return false;
      if (nowTs() > lanParty.expiresAt) {
        setLanConnState("Pair token expired");
        return false;
      }
      return true;
    }

    function publishLanSignal(t, extra){
      if (!lanParty.pairChannel) return;
      const msg = Object.assign({
        t,
        room: lanParty.roomId,
        token: lanParty.token,
        nonce: nonce8(),
        ts: nowTs(),
      }, extra || {});
      lanParty.pairChannel.publish("pair", msg);
    }

    async function detectLanSafety(pc){
      try {
        const stats = await pc.getStats();
        let pair = null;
        stats.forEach((r) => {
          if (r.type === "transport" && r.selectedCandidatePairId && stats.get(r.selectedCandidatePairId)) {
            pair = stats.get(r.selectedCandidatePairId);
          }
        });
        if (!pair) {
          stats.forEach((r) => {
            if (!pair && r.type === "candidate-pair" && (r.selected || r.nominated) && r.state === "succeeded") {
              pair = r;
            }
          });
        }
        if (!pair) return { safe: false, label: "NOT LAN SAFE ⚠️ (blocked)" };

        const local = stats.get(pair.localCandidateId);
        const remote = stats.get(pair.remoteCandidateId);
        const localType = String(local && local.candidateType || "");
        const remoteType = String(remote && remote.candidateType || "");
        if (localType === "relay" || remoteType === "relay") {
          return { safe: false, label: "NOT LAN SAFE ⚠️ (blocked)" };
        }
        if (localType === "host" && remoteType === "host") {
          return { safe: true, label: "LAN SAFE ✅" };
        }
        return { safe: true, label: "LAN OK ✅" };
      } catch (_) {
        return { safe: false, label: "NOT LAN SAFE ⚠️ (blocked)" };
      }
    }

    function onLanControlMessage(evt){
      let d = null;
      try { d = JSON.parse(String(evt.data || "")); } catch (_) { return; }
      if (d && d.t === "control" && d.name === "phone_started") {
        closeLanModal();
        if (els.startScreen) els.startScreen.classList.add("off");
        calibAvailable = true;
        setCalibStatus("Ready");
        openCalibOverlay();
        return;
      }
      if (!lanParty.gameplayEnabled) return;
      if (!d || d.t !== "impulse" || !d.payload) return;
      handleIncomingImpulse(d.payload);
    }

    async function buildAndPublishLanOffer(pc){
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      lanParty.offerSdp = offer.sdp;
      publishLanSignal("host_offer", { sdp: lanParty.offerSdp });
      setLanConnState("Offer sent");
    }

    async function startLanHostFlow(){
      resetLanParty();
      lanParty.active = true;
      lanParty.roomId = randCode(8);
      lanParty.token = toHex(randomTokenBytes(16));
      lanParty.code6 = code6FromTokenHex(lanParty.token);
      lanParty.expiresAt = nowTs() + LAN_TOKEN_TTL_MS;
      lanParty.gameplayEnabled = false;

      setLanConnState("Waiting for phone…");
      setLanSafeState("Pending…");
      if (els.lanRoomCode) els.lanRoomCode.textContent = lanParty.roomId;
      if (els.lanCode6) els.lanCode6.textContent = lanParty.code6;

      const joinUrl = lanJoinUrl(lanParty.roomId, lanParty.token);
      if (els.lanUrlText) els.lanUrlText.textContent = joinUrl;
      if (els.lanCopyUrl) {
        els.lanCopyUrl.onclick = async () => {
          try {
            await navigator.clipboard.writeText(joinUrl);
            els.lanCopyUrl.textContent = "Copied";
          } catch (_) {
            els.lanCopyUrl.textContent = "Nope";
          }
          setTimeout(() => { if (els.lanCopyUrl) els.lanCopyUrl.textContent = "Copy"; }, 800);
        };
      }
      await renderLanQr(joinUrl);

      await connectLanSignalChannel(lanParty.roomId);
      setLanConnState("Signal ready");

      const pc = new RTCPeerConnection({ iceServers: LAN_STUN_SERVERS });
      const dc = pc.createDataChannel("orb-control", { ordered: false, maxRetransmits: 0 });
      lanParty.pc = pc;
      lanParty.dc = dc;

      dc.onopen = async () => {
        setLanConnState("Connected");
        const lanSafety = await detectLanSafety(pc);
        setLanSafeState(lanSafety.label);
        lanParty.gameplayEnabled = !!lanSafety.safe;
        if (lanParty.offerRetryTO) {
          clearTimeout(lanParty.offerRetryTO);
          lanParty.offerRetryTO = null;
        }
      };
      dc.onclose = () => {
        lanParty.gameplayEnabled = false;
        setLanConnState("Disconnected");
      };
      dc.onmessage = onLanControlMessage;

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        publishLanSignal("ice", {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex,
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          lanParty.gameplayEnabled = false;
          setLanConnState("Connection failed");
        }
      };

      lanParty.pairChannel.subscribe("pair", async (msg) => {
        const d = msg && msg.data ? msg.data : {};
        if (!lanMsgValid(d)) return;
        if (d.t === "join_hello") {
          lanParty.helloSeen = true;
          setLanConnState("Join hello received");
          try {
            if (!lanParty.offerSdp) {
              await buildAndPublishLanOffer(pc);
            } else {
              publishLanSignal("host_offer", { sdp: lanParty.offerSdp });
              setLanConnState("Offer re-sent");
            }
          } catch (e) {
            console.error("LAN offer build failed:", e);
            setLanConnState("Offer failed");
          }
          return;
        }
        if (d.t === "join_answer" && d.sdp && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription({ type: "answer", sdp: d.sdp });
            setLanConnState("Connecting…");
          } catch (e) {
            console.error("LAN setRemote(answer) failed:", e);
            setLanConnState("Answer rejected");
          }
          return;
        }
        if (d.t === "ice" && d.candidate) {
          try {
            await pc.addIceCandidate({
              candidate: d.candidate,
              sdpMid: d.sdpMid,
              sdpMLineIndex: d.sdpMLineIndex
            });
          } catch (_) {}
        }
        if (d.t === "abort") {
          lanParty.gameplayEnabled = false;
          setLanConnState("Aborted");
        }
      });

      await buildAndPublishLanOffer(pc);
      const retryOffer = () => {
        if (!lanParty.active || !lanParty.pc || lanParty.pc.currentRemoteDescription) return;
        if (!lanParty.helloSeen) {
          setLanConnState("Waiting for join hello…");
        }
        publishLanSignal("host_offer", { sdp: lanParty.offerSdp });
        lanParty.offerRetryTO = setTimeout(retryOffer, 1000);
      };
      lanParty.offerRetryTO = setTimeout(retryOffer, 1000);
      setLanConnState("Pairing…");
      lanParty.expiryTO = setTimeout(() => {
        if (!lanParty.active || lanParty.gameplayEnabled) return;
        setLanConnState("Pair token expired");
      }, LAN_TOKEN_TTL_MS + 50);
      setStatus(`LAN host ready <span class="dim">(orb:${lanParty.roomId})</span>`, "ok");
    }

    async function launchLanPairingFlow(forceNew = false){
      if (lanParty.active && !forceNew) return;
      try {
        await startLanHostFlow();
      } catch (e) {
        console.error("LAN PARTY host error:", e);
        setLanConnState("Failed");
        setLanSafeState("NOT LAN SAFE ⚠️ (blocked)");
      }
    }

    if (els.lanPartyBtn) {
      els.lanPartyBtn.addEventListener("click", launchLanPairingFlow);
    }
    if (els.lanClose) els.lanClose.addEventListener("click", closeLanModal);
    if (els.lanEndBtn) {
      els.lanEndBtn.addEventListener("click", () => {
        resetLanParty();
        closeLanModal();
        setStatus("LAN room closed", "dim");
      });
    }
    // ===== LAN PARTY (P2P) END =====

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
      downDrag: -0.83,

      bounce: 0.35,
      maxUpSpeed: 2200,
      maxDownSpeed: 2800,
    };
    const IMPACT_TH = 500;
    const DEATH_FLOW_DELAY_MS = 3000;
    const IMPACT_MODEL = {
      mass: 1.0,
      gravityExp: 0.5,
      // Symmetric around 0:
      // +1 => softer impacts, -1 => harsher/faster impacts.
      dragMirrorScale: 0.5,
    };

    // ===== GAME MVP SYSTEMS (ORB STATE) BEGIN =====
    let mvp = null;
    let mvpShardRaf = 0;
    let mvpShardLastTs = 0;
    let mvpShards = [];

    function updateDebugReadout(){
      if (!els.dirReadout) return;
      if (!mvp || !mvp.gameState || !mvp.gameState.orb) {
        els.dirReadout.textContent = "HP: — | Hits: — | State: —";
        return;
      }
      const orb = mvp.gameState.orb;
      const hp = `${Math.round(Number(orb.health) || 0)}/${Math.round(Number(orb.maxHealth) || 0)}`;
      const hits = Math.round(Number(orb.hitsTaken) || 0);
      const state = String(orb.visualState || "pristine");
      let txt = `HP: ${hp} | Hits: ${hits} | State: ${state}`;
      if (mvp.lastImpact && Number.isFinite(mvp.lastImpact.impact)) {
        const rawV = Number(mvp.lastImpact.rawImpact) || 0;
        const gMul = Number(mvp.lastImpact.gravityMul) || 0;
        const drag = Number(mvp.lastImpact.fallDrag) || 0;
        txt += ` | IMPACT:${mvp.lastImpact.impact.toFixed(0)} TH:${IMPACT_TH.toFixed(0)} v:${rawV.toFixed(0)} g:${gMul.toFixed(2)} d:${drag.toFixed(2)} ${mvp.lastImpact.source || ""}`;
      }
      const p = pickupState && pickupState.test ? pickupState.test : null;
      const globeEl = els.testGlobe || document.getElementById("testGlobe");
      if (p) {
        const disp = globeEl ? (globeEl.style.display || "block") : "missing";
        const left = globeEl ? globeEl.style.left || "—" : "—";
        const top = globeEl ? globeEl.style.top || "—" : "—";
        const sy = pickupScreenY(Number(p.yW) || 0);
        txt += ` | GLOBE act:${p.active ? 1 : 0} mode:world yW:${Math.round(Number(p.yW) || 0)} sy:${Math.round(sy)} left:${left} top:${top} disp:${disp}`;
      }
      els.dirReadout.textContent = txt;
    }

    function computeImpactMetric(rawImpactV){
      const v = Math.max(0, Number(rawImpactV) || 0);
      const gMul = Math.max(0.05, Number(physState.gravityMul) || 0);
      const fallDrag = clamp(Number(PHYS.downDrag) || 0, -1, 1);

      // Energy-inspired impact metric:
      // velocity dominates; gravity + signed fall-drag shape severity symmetrically.
      const eLike = 0.5 * IMPACT_MODEL.mass * v * v;
      const gravityTerm = Math.pow(gMul, IMPACT_MODEL.gravityExp);
      const dragMirror = clamp(1 - (fallDrag * IMPACT_MODEL.dragMirrorScale), 0.05, 2.0);
      const metric = Math.sqrt(eLike * 2) * gravityTerm * dragMirror;
      return metric;
    }

    function lineToPath(seg){
      if (!seg || !seg.a || !seg.b) return "";
      return `M ${Number(seg.a.x).toFixed(2)} ${Number(seg.a.y).toFixed(2)} L ${Number(seg.b.x).toFixed(2)} ${Number(seg.b.y).toFixed(2)}`;
    }

    function renderOrbDamageVisuals(){
      if (!mvp || !els.orb || !els.orbCracks) return;
      const fx = mvp.fxSystem.getState();
      const shattered = (fx.visualState === "shattered");
      els.orb.classList.toggle("shattered", shattered);
      els.orb.style.opacity = shattered ? "0" : "";

      const paths = [];
      if (!shattered && Array.isArray(fx.crackSegments)) {
        for (const seg of fx.crackSegments) {
          const d = lineToPath(seg);
          if (d) paths.push(`<path d="${d}" />`);
        }
      }
      els.orbCracks.innerHTML = paths.join("");
    }

    function stopShardSim(){
      if (mvpShardRaf) cancelAnimationFrame(mvpShardRaf);
      mvpShardRaf = 0;
      mvpShardLastTs = 0;
    }

    function shardSimTick(ts){
      if (!mvpShards.length) {
        stopShardSim();
        return;
      }
      if (!mvpShardLastTs) mvpShardLastTs = ts;
      const dt = clamp((ts - mvpShardLastTs) / 1000, 0, 0.05);
      mvpShardLastTs = ts;
      const g = 980;
      for (const s of mvpShards){
        s.vy += g * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.a += s.av * dt;
        const deg = (s.a * 180 / Math.PI);
        s.el.setAttribute("transform", `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${deg.toFixed(2)} ${s.cx.toFixed(2)} ${s.cy.toFixed(2)})`);
      }
      mvpShardRaf = requestAnimationFrame(shardSimTick);
    }

    function pointsToPath(points){
      if (!Array.isArray(points) || points.length < 3) return "";
      const first = points[0];
      let d = `M ${Number(first.x).toFixed(2)} ${Number(first.y).toFixed(2)} `;
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        d += `L ${Number(p.x).toFixed(2)} ${Number(p.y).toFixed(2)} `;
      }
      d += "Z";
      return d;
    }

    function spawnShardFx(p){
      if (!els.orbShards) return;
      const d = pointsToPath(p.points);
      if (!d) return;
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("class", "orbShard");
      el.setAttribute("d", d);
      el.setAttribute("transform", "translate(0 0)");
      // Force shard look at element level so browser SVG class quirks can't fallback to black fill.
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", "rgba(50,255,117,0.95)");
      el.setAttribute("stroke-width", "1.2");
      el.setAttribute("stroke-linejoin", "round");
      el.setAttribute("stroke-linecap", "round");
      el.setAttribute("vector-effect", "non-scaling-stroke");
      els.orbShards.appendChild(el);
      const center = p.center || { x: 0, y: 0 };
      const cMag = Math.hypot(Number(center.x) || 0, Number(center.y) || 0) || 1;
      const jx = ((Number(center.x) || 0) / cMag) * 3.0;
      const jy = ((Number(center.y) || 0) / cMag) * 3.0;
      const s = {
        id: p.pieceId,
        el,
        cx: Number(center.x) || 0,
        cy: Number(center.y) || 0,
        x: jx,
        y: jy,
        vx: Number(p.vx) || 0,
        vy: Number(p.vy) || 0,
        a: 0,
        av: Number(p.angVel) || 0,
      };
      mvpShards.push(s);
      if (!mvpShardRaf) mvpShardRaf = requestAnimationFrame(shardSimTick);

      const ttl = Math.max(50, Number(p.ttlMs) || 300);
      setTimeout(() => {
        mvpShards = mvpShards.filter((x) => x !== s);
        try { s.el.remove(); } catch (_) {}
      }, ttl);
    }

    async function initMvpSystems(){
      try {
        const [{ createEventBus }, { createGameState }, { createOrbSystem }, { createFxSystem }, { createAudioSystem }] = await Promise.all([
          import("./src/events/event-bus.js"),
          import("./src/state/game-state.js"),
          import("./src/systems/orb-system.js"),
          import("./src/systems/fx-system.js"),
          import("./src/systems/audio-system.js"),
        ]);

        const eventBus = createEventBus();
        const gameState = createGameState({
          orb: {
            maxHealth: 300,
            health: 300,
            collisionDamage: 100,
            collisionThreshold: IMPACT_TH,
            collisionCooldownMs: 250,
          }
        });
        const orbSystem = createOrbSystem({ gameState, eventBus });
        const fxSystem = createFxSystem({ eventBus });
        const audioSystem = createAudioSystem({ eventBus });
        fxSystem.start();
        audioSystem.start();

        eventBus.on("orb.visual_state_changed", renderOrbDamageVisuals);
        eventBus.on("orb.shatter_piece_spawned", spawnShardFx);
        eventBus.on("orb.died", () => {
          orbInputSuppressed = true;
          clearOrbRuntimeFxForDeath();
          clearInnerGlobes();
          scheduleDeathOverlay();
          updateDebugReadout();
        });
        eventBus.on("orb.revived", () => {
          orbInputSuppressed = false;
          clearDeathOverlaySchedule();
          closeDeathOverlay();
          clearInnerGlobes();
          resetPickups();
          renderOrbDamageVisuals();
          updateDebugReadout();
        });
        eventBus.on("pickup.collected", () => {
          spawnInnerGlobe();
        });
        eventBus.on("orb.shatter_complete", () => {
          mvpShards = [];
          if (els.orbShards) els.orbShards.innerHTML = "";
          stopShardSim();
        });

        mvp = {
          eventBus,
          gameState,
          orbSystem,
          fxSystem,
          audioSystem,
          lastImpact: null,
          applyImpact(impact, source, meta = {}){
            this.lastImpact = {
              impact: Number(impact) || 0,
              source: source || "unknown",
              rawImpact: Number(meta.rawImpact) || 0,
              gravityMul: Number(meta.gravityMul) || 0,
              fallDrag: Number(meta.fallDrag) || 0,
              atMs: performance.now(),
            };
            orbSystem.applyImpact({ impact, source, atMs: performance.now() });
            renderOrbDamageVisuals();
            updateDebugReadout();
          },
        };
        mvp.orbSystem.revive({ health: 300, atMs: performance.now() });
        mvp.lastImpact = null;
        if (els.orbShards) els.orbShards.innerHTML = "";
        orbInputSuppressed = false;
        clearInnerGlobes();
        resetPickups();
        clearDeathOverlaySchedule();
        closeDeathOverlay();
        renderOrbDamageVisuals();
        updateDebugReadout();
      } catch (e) {
        console.warn("MVP systems init failed:", e);
      }
    }
    // ===== GAME MVP SYSTEMS (ORB STATE) END =====

    function groundCenterWorld(){
      return WORLD_H - (PHYS.groundFromBottomPx + PHYS.groundLinePx + PHYS.orbRadiusPx);
    }

    let physState = {
      yW: 0,
      v:  0,
      lastTs: null,
      gravityMul: 0.33,

      lift01: 0,
      energy01: 0,
      dynamics01: 0,

      onGround: false,

      descendMs: 0,
      shieldDescentBlocked: false,
    };

    // ===== WORLD PICKUPS (MVP SLICE) BEGIN =====
    const pickupState = {
      test: {
        id: "globe_mid_01",
        xNorm: 0.5,                          // centered horizontally in world/stage
        yW: groundCenterWorld() - 1000,      // 1000px above ground, world-space fixed
        r: 25,
        active: true,
        spawnedAtMs: 0,
        attracting: false,
        lastStepTs: 0,
      }
    };
    const PICKUP_ATTRACT_START_EDGE_GAP_PX = 120;
    const PICKUP_CONSUME_EDGE_GAP_PX = 30;

    function pickupScreenY(yW){
      const h = stageRect().height;
      const camTop = cameraTopFor(physState.yW, h);
      return yW - camTop;
    }

    function ensureTestGlobeEl(){
      if (els.testGlobe) return els.testGlobe;
      if (!els.physStage) return null;
      const el = document.createElement("div");
      el.id = "testGlobe";
      el.className = "pickupGlobe";
      el.setAttribute("aria-label", "Energy globe");
      els.physStage.appendChild(el);
      els.testGlobe = el;
      return el;
    }

    function renderPickups(){
      const p = pickupState.test;
      const globeEl = ensureTestGlobeEl();
      if (!globeEl || !p) return;
      if (!p.active) {
        globeEl.style.display = "none";
        return;
      }
      const stage = stageRect();
      const y = pickupScreenY(p.yW);
      const top = y - p.r;
      const d = p.r * 2;
      globeEl.style.display = "block";
      globeEl.style.width = `${d.toFixed(2)}px`;
      globeEl.style.height = `${d.toFixed(2)}px`;
      const left = ((Number(p.xNorm) || 0.5) * (stage.width || 0)) - p.r;
      globeEl.style.left = `${left.toFixed(2)}px`;
      globeEl.style.top = `${top.toFixed(2)}px`;
      globeEl.style.transform = "none";
      // Force visibility above stage layers while debugging placement.
      globeEl.style.zIndex = "40";
      globeEl.style.opacity = "1";
    }

    function resetPickups(){
      pickupState.test.active = true;
      pickupState.test.spawnedAtMs = performance.now();
      pickupState.test.attracting = false;
      pickupState.test.lastStepTs = 0;
      renderPickups();
    }

    function collectPickup(p, nowMs){
      p.active = false;
      renderPickups();
      if (mvp && mvp.eventBus && typeof mvp.eventBus.emit === "function") {
        mvp.eventBus.emit("pickup.collected", {
          id: p.id,
          type: "energy_globe",
          atMs: Number(nowMs) || performance.now(),
        });
      }
    }

    function checkPickupCollisions(nowMs){
      const p = pickupState.test;
      if (!p || !p.active) return;
      const stageW = stageRect().width || 0;
      const orbXNorm = 0.5;
      const orbYW = Number(physState.yW) || 0;
      const dxPx = ((orbXNorm - p.xNorm) * stageW);
      const dyPx = (orbYW - p.yW);
      let centerDist = Math.hypot(dxPx, dyPx);
      let edgeGapPx = centerDist - (PHYS.orbRadiusPx + p.r);

      if (edgeGapPx <= PICKUP_ATTRACT_START_EDGE_GAP_PX) {
        p.attracting = true;
      }

      if (p.attracting) {
        if (!p.lastStepTs) p.lastStepTs = Number(nowMs) || performance.now();
        const dt = clamp(((Number(nowMs) || performance.now()) - p.lastStepTs) / 1000, 0, 0.05);
        p.lastStepTs = Number(nowMs) || performance.now();

        // Exponential magnetic pull: gentle at range, stronger close in.
        const prox01 = clamp01(1 - (edgeGapPx / Math.max(1, PICKUP_ATTRACT_START_EDGE_GAP_PX)));
        const k = 2 + (10 * prox01 * prox01);
        const alpha = 1 - Math.exp(-k * dt);

        p.xNorm += (orbXNorm - p.xNorm) * alpha;
        p.yW += (orbYW - p.yW) * alpha;

        const dx2 = ((orbXNorm - p.xNorm) * stageW);
        const dy2 = (orbYW - p.yW);
        centerDist = Math.hypot(dx2, dy2);
        edgeGapPx = centerDist - (PHYS.orbRadiusPx + p.r);
      } else {
        p.lastStepTs = Number(nowMs) || performance.now();
      }

      if (edgeGapPx <= PICKUP_CONSUME_EDGE_GAP_PX) {
        collectPickup(p, nowMs);
      }
    }
    // ===== WORLD PICKUPS (MVP SLICE) END =====

    // ===== ORB INTERIOR GLOBES (MVP SLICE) BEGIN =====
    const innerGlobeState = {
      particles: [],
      nextId: 1,
    };

    function innerGlobeDiameterPx(){
      return PHYS.orbRadiusPx * 0.2; // 10% of orb diameter
    }

    function clearInnerGlobes(){
      innerGlobeState.particles = [];
      if (els.orbInterior) els.orbInterior.innerHTML = "";
    }

    function renderInnerGlobes(){
      if (!els.orbInterior) return;
      for (const p of innerGlobeState.particles){
        if (!p.el) {
          const el = document.createElement("div");
          el.className = "innerGlobe";
          p.el = el;
          els.orbInterior.appendChild(el);
        }
        const d = p.r * 2;
        p.el.style.width = `${d.toFixed(2)}px`;
        p.el.style.height = `${d.toFixed(2)}px`;
        p.el.style.left = `${(PHYS.orbRadiusPx + p.x - p.r).toFixed(2)}px`;
        p.el.style.top = `${(PHYS.orbRadiusPx + p.y - p.r).toFixed(2)}px`;
      }
    }

    function spawnInnerGlobe(){
      const r = innerGlobeDiameterPx() * 0.5;
      const speed = 360 + (Math.random() * 270); // ~3x faster than previous range
      const a = Math.random() * Math.PI * 2;
      innerGlobeState.particles.push({
        id: innerGlobeState.nextId++,
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r,
        el: null,
      });
      renderInnerGlobes();
    }

    function tickInnerGlobes(dt){
      if (!innerGlobeState.particles.length) return;
      const maxDistBase = PHYS.orbRadiusPx;
      for (const p of innerGlobeState.particles){
        // Add small random acceleration so motion stays lively/less predictable.
        p.vx += (Math.random() - 0.5) * 120 * dt;
        p.vy += (Math.random() - 0.5) * 120 * dt;
        const vMag = Math.hypot(p.vx, p.vy);
        const vCap = 900;
        if (vMag > vCap) {
          const s = vCap / (vMag || 1);
          p.vx *= s;
          p.vy *= s;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const dist = Math.hypot(p.x, p.y);
        const maxDist = maxDistBase - p.r;
        if (dist > maxDist && maxDist > 0) {
          const nx = p.x / (dist || 1);
          const ny = p.y / (dist || 1);
          p.x = nx * maxDist;
          p.y = ny * maxDist;
          const vn = (p.vx * nx) + (p.vy * ny);
          if (vn > 0) {
            p.vx = p.vx - (2 * vn * nx);
            p.vy = p.vy - (2 * vn * ny);
            // Tiny tangential kick on bounce to avoid repetitive paths.
            const tx = -ny;
            const ty = nx;
            const kick = (Math.random() - 0.5) * 120;
            p.vx += tx * kick;
            p.vy += ty * kick;
          }
        }
      }
      renderInnerGlobes();
    }
    // ===== ORB INTERIOR GLOBES (MVP SLICE) END =====

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
      renderPickups();
    }

    function setGravityMul(m){
      physState.gravityMul = clamp(Number(m) || 0, 0, 3);
      els.gVal.textContent = physState.gravityMul.toFixed(2);
    }
    setGravityMul(els.gSlider.value);
    els.gSlider.addEventListener("input", (e) => setGravityMul(e.target.value));

    function setDownDrag(v){
      PHYS.downDrag = clamp(Number(v) || 0, -1, 1);
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
      resetPickups();
      starResize(true);
      drawStars();
    });

    window.addEventListener("resize", () => {
      resetOrbToGround();
      renderPickups();
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
      if (mvp && mvp.orbSystem) mvp.orbSystem.tick(performance.now());
      const wasOnGround = !!physState.onGround;

      dt = clamp(dt, 0, 0.05);

      const g = PHYS.gBase * physState.gravityMul;
      const thrust = liftToThrustAccel(physState.lift01);

      let a = g - thrust;

      // Signed fall drag (downward only) mirrors around 0:
      // positive = resist fall, negative = assist fall ("magical" acceleration).
      const signedFallDrag = clamp(Number(PHYS.downDrag) || 0, -1, 1);
      const drag = (physState.v >= 0) ? signedFallDrag : PHYS.upDrag;
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
      let impactMag = 0;
      let impactSrc = "";
      const vyPreClamp = physState.v;
      const wasAtCeil = (physState.yW <= (yCeil + 0.25));

      physState.onGround = false;

      if (physState.yW > yFloor) {
        // Register ground impact once on landing transition only.
        if (!wasOnGround && vyPreClamp > 0) {
          impactMag = Math.max(impactMag, Math.abs(vyPreClamp));
          impactSrc = "ground";
        }
        physState.yW = yFloor;
        if (physState.v > 0) physState.v = 0;
        physState.onGround = true;
      }

      if (physState.yW < yCeil) {
        // Register ceiling hit once on first contact while moving upward.
        if (!wasAtCeil && vyPreClamp < 0) {
          impactMag = Math.max(impactMag, Math.abs(vyPreClamp));
          impactSrc = impactSrc || "ceiling";
        }
        physState.yW = yCeil;
        if (physState.v < 0) physState.v = -physState.v * PHYS.bounce;
      }

      if (mvp && impactMag > 0) {
        const impactMetric = computeImpactMetric(impactMag);
        mvp.applyImpact(impactMetric, impactSrc || "boundary", {
          rawImpact: impactMag,
          gravityMul: physState.gravityMul,
          fallDrag: PHYS.downDrag,
        });
      }

      drawStars();
      applyOrbTransform();
      tickInnerGlobes(dt);
      renderPickups();
      checkPickupCollisions(ts);
      updateDebugReadout();
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
    let orbInputSuppressed = false;

    function zeroAudioNow(){
      if (!audioCtx || !gainNode || !osc) return;
      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(TONE_BASE_HZ, now);
    }

    function clearOrbRuntimeFxForDeath(){
      // Stop all residual orb/VFX/audio state so death is a clean reset.
      lastData = null;
      rafPending = false;

      forceShakeLampOff();
      clearDirLampTimers();
      allDirLampOff();

      clearShock();
      shieldOffNow();
      shieldColor01 = { r: 120/255, g: 210/255, b: 255/255 };
      setShieldColor01(shieldColor01);

      resetShakeDetector();
      resetStability();
      resetVariability();
      resetEnergyBank();
      pendingSd = null;
      pendingSdAt = 0;

      physState.lift01 = 0;
      physState.energy01 = 0;
      physState.dynamics01 = 0;

      setBgFromEnergy(0);
      setBar(els.bLift, 0);
      setBar(els.bGroove, 0);
      setBar(els.bSmooth, 0);
      setBar(els.bSpeed, 0);
      setBar(els.bDynamics, 0);
      setBar(els.bEnergy, 0);
      setBar(els.bShake, 0);
      els.vLift.textContent = "0%";
      els.vGroove.textContent = "0%";
      els.vSmooth.textContent = "0%";
      els.vSpeed.textContent = "0%";
      els.vDynamics.textContent = "0%";
      els.vEnergy.textContent = "0";
      els.vShake.textContent = "0.00";
      els.vEnergy.classList.remove("over");
      els.bEnergy.classList.remove("over");

      zeroAudioNow();
    }

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

    function handleIncomingImpulse(data){
      idleMarkActivity();
      if (data && data.calib === 1){
        setCalibStatus("Calibrated");
        closeCalibOverlay();
      }
      if (!calibAvailable){
        calibAvailable = true;
        setCalibStatus("Ready");
      }
      if (orbInputSuppressed) return;
      teleMaybeLog(data);
      scheduleUIUpdate(data);
    }

    function sendCalibrationTrigger(){
      if (lanParty.active && lanParty.dc && lanParty.dc.readyState === "open") {
        try {
          lanParty.dc.send(JSON.stringify({ t: "control", name: "calibrate", ts: Date.now() }));
          return true;
        } catch (_) {}
      }
      if (channel) {
        channel.publish("ctl", { calibrate: 1, ts: Date.now() });
        return true;
      }
      return false;
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
      
      updateEnergyBankFromPhone(energyFromPhone, nowMs);

      const energyUI01 = energyBankPts / ENERGY_BANK_CAP;
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
      const shakeForUI = (nowMs < shakeCooldownUntil) ? 0 : shake;
      const shakeMeter = (SHAKE_LAMP_THR > 1e-6)
        ? clamp01((Number(shakeForUI) || 0) / SHAKE_LAMP_THR)
        : 0;
      const sh = (Number(shakeMeter) * SHAKE_LAMP_THR);
      const ePts = Math.round(energyBankPts);

      els.vLift.textContent     = `${liftP}%`;
      els.vGroove.textContent   = `${gP}%${locked ? " (locked)" : ""}`;
      els.vSmooth.textContent   = `${sP}%`;
      els.vSpeed.textContent    = `${sp}%`;
      els.vDynamics.textContent = `${dP}%`;
      els.vEnergy.textContent   = `${ePts}`;
      els.vShake.textContent    = `${Math.max(0, sh).toFixed(2)}`;

      if (d && Array.isArray(d.shieldRGB) && d.shieldRGB.length >= 3){
        const tr = clamp01(d.shieldRGB[0]);
        const tg = clamp01(d.shieldRGB[1]);
        const tb = clamp01(d.shieldRGB[2]);
        shieldColor01.r = lerp(shieldColor01.r, tr, SHIELD_COLOR_SMOOTH);
        shieldColor01.g = lerp(shieldColor01.g, tg, SHIELD_COLOR_SMOOTH);
        shieldColor01.b = lerp(shieldColor01.b, tb, SHIELD_COLOR_SMOOTH);
        setShieldColor01(shieldColor01);
      }

      setBar(els.bLift,  lift);
      setBar(els.bGroove, groove);
      setBar(els.bSmooth, smooth);
      setBar(els.bSpeed,  speed);
      setBar(els.bDynamics, dynamics);
      setBar(els.bEnergy, energyUI01);
      setBar(els.bShake,  shakeMeter);

      const over = (energyUI01 > 1);
      els.vEnergy.classList.toggle("over", over);
      els.bEnergy.classList.toggle("over", over);

      // Repurposed row: Orb debug readout.
      updateDebugReadout();

      // sd is only sent by the phone on shakeHit
      if (d && typeof d.sd === "string" && d.sd.trim()) {
        pendingSd = d.sd;
        pendingSdAt = nowMs;
      }

      stabilityVisualGate =
        (!physState.onGround) &&
        (clamp01(speed) >= STABILITY_SPEED_MIN) &&
        (!physState.shieldDescentBlocked);

      applyStabilityVisuals();

      updateStability(dynamics, nowMs);
      updateVariability(dynamics, nowMs);

      processShakeDoubleBang(shake, nowMs, groove);

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

      if (els.calibBtn){
        els.calibBtn.onclick = () => {
          if (!audioEnabled) {
            enableAudio().catch(() => {});
          } else if (audioCtx) {
            audioCtx.resume().catch(() => {});
          }
          if (!calibAvailable) return;
          if (calibInFlight) return;
          const ok = sendCalibrationTrigger();
          if (!ok) return;
          calibInFlight = true;
          els.calibBtn.disabled = true;
          setCalibStatus("Calibrating… (2s)");
        };
      }

      channel.subscribe("orb", (msg) => {
        const d = (msg && msg.data) ? msg.data : {};

        if (lanParty.active && lanParty.gameplayEnabled) return;

        if (LAST_MESSAGE_ON) {
          let s = "";
          try { s = JSON.stringify(d); } catch(_) { s = String(d); }
          if (s.length > 240) s = s.slice(0, 240) + " …";
          const sh = (d && d.shakeHit) ? "shakeHit:1 " : "shakeHit:0 ";
          const rgb = (d && Array.isArray(d.shieldRGB) && d.shieldRGB.length >= 3)
            ? `shieldRGB:${d.shieldRGB.map(v => Number(v).toFixed(2)).join(",")} `
            : "shieldRGB:— ";
          const axis = (d && Array.isArray(d.shieldAxis) && d.shieldAxis.length >= 3)
            ? `axis:${d.shieldAxis.map(v => Number(v).toFixed(2)).join(",")} `
            : "axis:— ";
          const dbg = (d && (d.calibOK != null || d.omegaOK != null))
            ? `calibOK:${Number(d.calibOK)||0} omegaOK:${Number(d.omegaOK)||0} `
            : "calibOK:— omegaOK:— ";
          const decay = `decay:${shieldDecayActive ? 1 : 0} `;
          els.last.textContent = rgb + decay + axis + dbg + sh + s;
        } else if (els.last.textContent) {
          els.last.textContent = "";
        }

        if (els.pairModal.classList.contains("on")) closePairModal();

        // If the start screen is still up for some reason, drop it on first msg.
        if (els.startScreen && !els.startScreen.classList.contains("off")) {
          els.startScreen.classList.add("off");
        }

        if (d && d.calib === 1){
          setCalibStatus("Calibrated");
          closeCalibOverlay();
        }
        if (!calibAvailable){
          calibAvailable = true;
          setCalibStatus("Ready");
          openCalibOverlay();
        }

        handleIncomingImpulse(d);
      });

      connecting = false;
    }

    // DEV button forces room=test always + launches QR
    if (els.newRoom) {
      els.newRoom.addEventListener("click", async () => {
        currentRoomChannel = "orb:test";
        resetShakeDetector();
        resetStability();
        resetVariability();
        resetEnergyBank();
        await connect({ auto:false });
        openPairModal();
      });
    }

    els.startBtn.addEventListener("click", async () => {
      // User gesture: ensure receiver audio is enabled on first run.
      if (!audioEnabled) await enableAudio();
      else if (audioCtx) {
        try { await audioCtx.resume(); } catch (_) {}
      }
      await launchLanPairingFlow(true);
    });

    if (els.tryAgainBtn) {
      els.tryAgainBtn.addEventListener("click", async () => {
        if (!mvp || !mvp.orbSystem || !mvp.gameState) return;
        // User gesture: keep audio alive across death/reset.
        if (!audioEnabled) await enableAudio();
        else if (audioCtx) {
          try { await audioCtx.resume(); } catch (_) {}
        }
        clearDeathOverlaySchedule();
        mvp.orbSystem.revive({ health: 300, atMs: performance.now() });
        mvp.lastImpact = null;
        mvpShards = [];
        if (els.orbShards) els.orbShards.innerHTML = "";
        stopShardSim();
        resetOrbToGround();
        resetPickups();
        closeDeathOverlay();
        renderOrbDamageVisuals();
        updateDebugReadout();
      });
    }

    (async function init(){
      initMvpSystems();
      connect({ auto:true });
      syncStartQrSizeToTitlePx();
      launchLanPairingFlow();
    })();

    window.addEventListener("resize", () => {
      syncStartQrSizeToTitlePx();
    });
