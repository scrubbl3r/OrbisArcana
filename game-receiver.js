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
      voiceReadout: $("voiceReadout"),

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
      terrain: $("terrain"),
      groundLine: $("groundLine"),
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
    let uiOverlaysSystem = null;
    let calibInFlight = false;
    let calibAvailable = false;

    async function initUiOverlaysSystem(){
      try {
        const { createUiOverlaysSystem } = await import("./src/systems/ui-overlays-system.js");
        uiOverlaysSystem = createUiOverlaysSystem({
          startScreenEl: els.startScreen,
          calibOverlayEl: els.calibOverlay,
          calibBtnEl: els.calibBtn,
          calibStatusEl: els.calibStatus,
          deathPanelEl: els.deathPanel,
          onCalibClosed: () => {
            calibInFlight = false;
          },
        });
      } catch (e) {
        uiOverlaysSystem = null;
        console.warn("UI overlays system init failed:", e);
      }
    }

    function hideStartScreen(){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.hideStartScreen();
        return;
      }
      if (els.startScreen) els.startScreen.classList.add("off");
    }

    function openCalibOverlay(){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.openCalibOverlay(calibAvailable);
        return;
      }
      if (!els.calibOverlay) return;
      els.calibOverlay.classList.remove("off");
      els.calibOverlay.setAttribute("aria-hidden","false");
      if (els.calibBtn) els.calibBtn.disabled = !calibAvailable;
    }

    function closeCalibOverlay(){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.closeCalibOverlay();
        return;
      }
      if (!els.calibOverlay) return;
      els.calibOverlay.classList.add("off");
      els.calibOverlay.setAttribute("aria-hidden","true");
      if (els.calibBtn) els.calibBtn.disabled = false;
      calibInFlight = false;
    }

    function setCalibStatus(msg){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.setCalibStatus(msg);
        return;
      }
      if (els.calibStatus) els.calibStatus.textContent = msg;
    }

    function openDeathOverlay(){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.openDeathOverlay();
        return;
      }
      if (!els.deathPanel) return;
      els.deathPanel.classList.remove("off");
      els.deathPanel.setAttribute("aria-hidden","false");
    }

    function closeDeathOverlay(){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.closeDeathOverlay();
        return;
      }
      if (!els.deathPanel) return;
      els.deathPanel.classList.add("off");
      els.deathPanel.setAttribute("aria-hidden","true");
    }

    let deathOverlayTO = 0;
    function scheduleDeathOverlay(){
      if (uiOverlaysSystem) {
        uiOverlaysSystem.scheduleDeathOverlay(DEATH_FLOW_DELAY_MS);
        return;
      }
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
      if (uiOverlaysSystem) {
        uiOverlaysSystem.clearDeathOverlaySchedule();
        return;
      }
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
    let sanctusShieldColorLocked = false;

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
      sanctusShieldColorLocked = false;
      els.shield.classList.remove("on");
      els.shield.style.opacity = "";
      els.shield.style.animation = "";
      els.shield.style.width = "";
      els.shield.style.height = "";
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

    function activateSanctusShield(axis, durationMs = SANCTUS_SHIELD_MS){
      if (!els.shield) return;
      const c = axisToColor01(axis);
      shieldColor01 = { r: c.r, g: c.g, b: c.b };
      setShieldColor01(shieldColor01);
      const baseShieldD = (PHYS.orbRadiusPx * 2) + 24;
      const sanctusD = Math.max(10, baseShieldD * SANCTUS_SHIELD_SCALE);
      shieldOnNow();
      // Apply custom Sanctus size after shieldOnNow; first activation path
      // calls shieldOffNow() internally, which clears width/height.
      els.shield.style.width = `${sanctusD.toFixed(2)}px`;
      els.shield.style.height = `${sanctusD.toFixed(2)}px`;
      sanctusShieldColorLocked = true;
      if (sanctusShieldTO) {
        clearTimeout(sanctusShieldTO);
        sanctusShieldTO = 0;
      }
      sanctusShieldTO = setTimeout(() => {
        sanctusShieldTO = 0;
        shieldDecay();
      }, Math.max(150, Number(durationMs) || SANCTUS_SHIELD_MS));
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
    const FLAT_SPIN_DOMINANCE_ON = 0.72;
    const FLAT_SPIN_DOMINANCE_OFF = 0.60;
    const FLAT_SPIN_DOMINANCE_GAP_ON = 0.14;
    const FLAT_SPIN_DOMINANCE_GAP_OFF = 0.09;
    const FLAT_SPIN_ON_HOLD_MS = 200;
    const FLAT_SPIN_OFF_HOLD_MS = 280;
    const FLAT_SPIN_GATE_REFRESH_MS = 1100;
    const FLAT_SPIN_MIN_SPEED01 = 0.02;

    let shakeCooldownUntil = 0;
    let shakeArmed = true;
    let pendingSd = null;
    let pendingSdAt = 0;
    const flatSpin = {
      active: false,
      axis: "",
      holdMs: 0,
      releaseMs: 0,
      lastTs: 0,
      lastGateRefreshMs: 0,
    };

    function axisFromShieldAxis(shieldAxis){
      if (!Array.isArray(shieldAxis) || shieldAxis.length < 3) return null;
      // Gameplay axis mapping:
      // X school = blue, Y school = green, Z school = red.
      // Incoming shieldAxis is [x,y,z], so remap as:
      // gameplayX <- z, gameplayY <- y, gameplayZ <- x
      const gx = Math.max(0, Number(shieldAxis[2]) || 0);
      const gy = Math.max(0, Number(shieldAxis[1]) || 0);
      const gz = Math.max(0, Number(shieldAxis[0]) || 0);
      const sum = gx + gy + gz;
      if (!(sum > 1e-6)) return null;
      const vals = [
        { axis: "x", v: gx / sum },
        { axis: "y", v: gy / sum },
        { axis: "z", v: gz / sum },
      ];
      vals.sort((a, b) => b.v - a.v);
      return {
        axis: vals[0].axis,
        v: vals[0].v,
        gap: vals[0].v - vals[1].v,
        source: "axis",
      };
    }

    function axisFromShieldRgb(shieldRGB){
      if (!Array.isArray(shieldRGB) || shieldRGB.length < 3) return null;
      const r = Math.max(0, Number(shieldRGB[0]) || 0);
      const g = Math.max(0, Number(shieldRGB[1]) || 0);
      const b = Math.max(0, Number(shieldRGB[2]) || 0);
      const sum = r + g + b;
      if (!(sum > 1e-6)) return null;
      const vals = [
        { axis: "x", v: b / sum }, // blue -> X
        { axis: "y", v: g / sum }, // green -> Y
        { axis: "z", v: r / sum }, // red -> Z
      ];
      vals.sort((a, b) => b.v - a.v);
      return {
        axis: vals[0].axis,
        v: vals[0].v,
        gap: vals[0].v - vals[1].v,
        source: "rgb",
      };
    }

    function axisFromSpinPayload(d){
      return axisFromShieldAxis(d && d.shieldAxis) || axisFromShieldRgb(d && d.shieldRGB);
    }

    function axisFromVisibleShield(d){
      return axisFromShieldAxis(d && d.shieldAxis) || axisFromShieldRgb(d && d.shieldRGB);
    }

    function openFlatSpinWindow(axis, nowMs){
      flatSpin.active = true;
      flatSpin.axis = axis;
      flatSpin.releaseMs = 0;
      flatSpin.lastGateRefreshMs = nowMs;
      setOrbStrokeColor01(axisToColor01(axis));
      if (!mvp || !mvp.eventBus) return;
      mvp.eventBus.emit("spell_window.flat_spin_opened", { axis, atMs: nowMs });
      mvp.eventBus.emit("voice.set_mode", { mode: "gated_window" });
      mvp.eventBus.emit("voice.open_gate", { reason: `flat_spin_${axis}`, timeoutMs: 4500 });
    }

    function closeFlatSpinWindow(reason, nowMs){
      if (!flatSpin.active) return;
      const axis = flatSpin.axis;
      flatSpin.active = false;
      flatSpin.axis = "";
      flatSpin.holdMs = 0;
      flatSpin.releaseMs = 0;
      flatSpin.lastGateRefreshMs = 0;
      resetOrbStrokeColor();
      if (!mvp || !mvp.eventBus) return;
      mvp.eventBus.emit("spell_window.flat_spin_closed", { axis, reason, atMs: nowMs });
      mvp.eventBus.emit("voice.close_gate", { reason: `flat_spin_${reason}` });
      mvp.eventBus.emit("voice.set_mode", { mode: "wake_token_open_world" });
    }

    function updateFlatSpinWindow(d, nowMs){
      const dt = flatSpin.lastTs ? clamp(nowMs - flatSpin.lastTs, 0, 120) : 0;
      flatSpin.lastTs = nowMs;
      const axisInfo = axisFromVisibleShield(d);
      const speed01 = clamp01(Number(d && (d.speed01 != null ? d.speed01 : d.speed)) || 0);
      const locked = !!(d && d.locked);
      const stableEnough = (!!stabilityOn && !!stabilityVisualGate) || (locked && (speed01 >= FLAT_SPIN_MIN_SPEED01));
      const canQualify = !!axisInfo && stableEnough;
      const isAxisSignal = !!(axisInfo && axisInfo.source === "axis");
      const domOnReq = isAxisSignal ? 0.56 : FLAT_SPIN_DOMINANCE_ON;
      const domOffReq = isAxisSignal ? 0.48 : FLAT_SPIN_DOMINANCE_OFF;
      const gapOnReq = isAxisSignal ? 0.06 : FLAT_SPIN_DOMINANCE_GAP_ON;
      const gapOffReq = isAxisSignal ? 0.03 : FLAT_SPIN_DOMINANCE_GAP_OFF;

      if (flatSpin.active) {
        const sameAxis = canQualify
          && axisInfo.axis === flatSpin.axis
          && axisInfo.v >= domOffReq
          && (Number(axisInfo.gap) >= gapOffReq);
        if (sameAxis) {
          setOrbStrokeColor01(axisToColor01(axisInfo.axis));
          flatSpin.releaseMs = 0;
          if ((nowMs - flatSpin.lastGateRefreshMs) >= FLAT_SPIN_GATE_REFRESH_MS) {
            flatSpin.lastGateRefreshMs = nowMs;
            if (mvp && mvp.eventBus) {
              mvp.eventBus.emit("voice.open_gate", {
                reason: `flat_spin_keepalive_${flatSpin.axis}`,
                timeoutMs: 4500
              });
            }
          }
          return;
        }
        flatSpin.releaseMs += dt;
        if (flatSpin.releaseMs >= FLAT_SPIN_OFF_HOLD_MS) {
          closeFlatSpinWindow("unstable", nowMs);
        }
        return;
      }

      const qualify = canQualify
        && axisInfo.v >= domOnReq
        && (Number(axisInfo.gap) >= gapOnReq);
      if (!qualify) {
        flatSpin.holdMs = 0;
        return;
      }

      if (flatSpin.axis && flatSpin.axis !== axisInfo.axis) {
        flatSpin.holdMs = 0;
      }
      flatSpin.axis = axisInfo.axis;
      flatSpin.holdMs += dt;
      if (flatSpin.holdMs >= FLAT_SPIN_ON_HOLD_MS) {
        openFlatSpinWindow(flatSpin.axis, nowMs);
      }
    }

    function shakeGroupFromCode(code){
      const c = String(code || "").trim().toUpperCase();
      if (c === "U" || c === "D") return "UD";
      if (c === "L" || c === "R") return "LR";
      if (c === "F" || c === "B") return "FB";
      return "";
    }

    function resetShakeDetector(){
      shakeCooldownUntil = 0;
      shakeArmed = true;
      forceShakeLampOff();
      pendingSd = null;
      pendingSdAt = 0;

      // ✅ NEW: hard-clear any queued direction timers
      clearDirLampTimers();
      allDirLampOff();
      closeFlatSpinWindow("reset", performance.now());
      flatSpin.lastTs = 0;
      flatSpin.holdMs = 0;
      flatSpin.releaseMs = 0;
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
      let shakeCode = "";

      if (pendingSd && (nowMs - pendingSdAt) <= SD_RECENT_MS) {
        const code = String(pendingSd || "").trim().toUpperCase();
        shakeCode = code;
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
      if (mvp && mvp.eventBus) {
        mvp.eventBus.emit("input.shake_triggered", {
          code: shakeCode,
          group: shakeGroupFromCode(shakeCode),
          atMs: nowMs,
        });
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
    let mobileImpulseSystem = null;
    let lanSession = null;

    async function initMobileImpulseSystem(){
      try {
        const { createMobileImpulseSystem } = await import("./src/systems/mobile-impulse-system.js");
        mobileImpulseSystem = createMobileImpulseSystem({
          idleMarkActivity,
          applyDataToUI,
          teleMaybeLog,
          onCalibrated: () => {
            setCalibStatus("Calibrated");
            closeCalibOverlay();
            if (mvp && mvp.eventBus) {
              mvp.eventBus.emit("voice.set_mode", { mode: "wake_token_open_world" });
            }
          },
          onCalibAvailable: () => {
            if (calibAvailable) return;
            calibAvailable = true;
            setCalibStatus("Ready");
            openCalibOverlay();
          },
          isInputSuppressed: () => !!orbInputSuppressed,
        });
      } catch (e) {
        mobileImpulseSystem = null;
        console.warn("Mobile impulse system init failed:", e);
      }
    }

    async function initLanSessionSystem(){
      try {
        const { createLanSessionSystem } = await import("./src/systems/lan-session-system.js");
        lanSession = createLanSessionSystem({
          AblyCtor: (typeof Ably !== "undefined" && Ably && Ably.Realtime) ? Ably.Realtime : null,
          QRCodeLib: (typeof QRCode !== "undefined") ? QRCode : null,
          workerBase: WORKER_BASE,
          ui: {
            lanModal: els.lanModal,
            lanQr: els.lanQr,
            startQr: els.startQr,
            lanUrlText: els.lanUrlText,
            lanCopyUrl: els.lanCopyUrl,
            lanRoomCode: els.lanRoomCode,
            lanCode6: els.lanCode6,
            lanConnState: els.lanConnState,
            lanSafeState: els.lanSafeState,
          },
          mobilePageBaseUrl,
          syncStartQrSizeToTitlePx,
          setStatus,
          onImpulse: handleIncomingImpulse,
          onPhoneStarted: () => {
            hideStartScreen();
            if (mobileImpulseSystem) mobileImpulseSystem.markCalibAvailable();
            else {
              calibAvailable = true;
              setCalibStatus("Ready");
            }
            openCalibOverlay();
          },
        });
      } catch (e) {
        lanSession = null;
        console.warn("LAN session init failed:", e);
      }
    }

    async function launchLanPairingFlow(forceNew = false){
      if (!lanSession) return;
      try {
        await lanSession.launch(forceNew);
      } catch (e) {
        console.error("LAN PARTY host error:", e);
        if (els.lanConnState) els.lanConnState.textContent = "Status: Failed";
        if (els.lanSafeState) els.lanSafeState.textContent = "LAN SAFE: NOT LAN SAFE ⚠️ (blocked)";
      }
    }

    if (els.lanPartyBtn) {
      els.lanPartyBtn.addEventListener("click", () => launchLanPairingFlow(false));
    }
    if (els.lanClose) {
      els.lanClose.addEventListener("click", () => {
        if (lanSession) lanSession.closeModal();
      });
    }
    if (els.lanEndBtn) {
      els.lanEndBtn.addEventListener("click", () => {
        if (lanSession) lanSession.end();
        setStatus("LAN room closed", "dim");
      });
    }
    // ===== LAN PARTY (P2P) END =====

    // =========================================================================
    // TELEMETRY + DEBUG SYSTEM
    // =========================================================================
    let telemetryDebugSystem = null;

    async function initTelemetryDebugSystem(){
      try {
        const { createTelemetryDebugSystem } = await import("./src/systems/telemetry-debug-system.js");
        telemetryDebugSystem = createTelemetryDebugSystem({
          debugReadoutEl: els.dirReadout,
          teleModalEl: els.teleModal,
          teleBtnEl: els.teleBtn,
          teleBackdropEl: els.teleBackdrop,
          teleCloseEl: els.teleClose,
          teleRecBtnEl: els.teleRecBtn,
          teleOutEl: els.teleOut,
          pickDirVec,
        });
        telemetryDebugSystem.bindUi();
      } catch (e) {
        telemetryDebugSystem = null;
        console.warn("Telemetry debug system init failed:", e);
      }
    }

    function updateDebugReadout(){
      if (telemetryDebugSystem) {
        telemetryDebugSystem.updateDebugReadout("—");
        return;
      }
      if (!els.dirReadout) return;
      els.dirReadout.textContent = "—";
    }

    function teleMaybeLog(d){
      if (telemetryDebugSystem) {
        telemetryDebugSystem.teleMaybeLog(d);
      }
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (telemetryDebugSystem && telemetryDebugSystem.isTeleOpen()) {
          telemetryDebugSystem.closeTele();
        } else if (els.pairModal.classList.contains("on")) {
          closePairModal();
        }
        return;
      }

      if (e.key === "v" || e.key === "V") {
        if (!mvp || !mvp.eventBus) return;
        const currentVoiceMode = (mvp.gameState && mvp.gameState.voice && mvp.gameState.voice.mode) || "off";
        if (e.shiftKey) {
          const mode = (currentVoiceMode === "wake_token_open_world") ? "off" : "wake_token_open_world";
          mvp.eventBus.emit("voice.set_mode", { mode });
        } else {
          mvp.eventBus.emit("voice.set_mode", { mode: "gated_window" });
          mvp.eventBus.emit("voice.open_gate", { reason: "keyboard", timeoutMs: 4500 });
        }
      }
    });

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
    const FLOAT_GRACE_DEFAULT_MS = 1000;
    const DOMUS_FLOAT_GRACE_MS = 5000;
    const DOMUS_TELEPORT_ABOVE_GROUND_PX = 300;
    const SANCTUS_SHIELD_MS = 8000;
    const SANCTUS_SHIELD_SCALE = 1.25;
    const IMPACT_MODEL = {
      mass: 1.0,
      gravityExp: 0.5,
      // Symmetric around 0:
      // +1 => softer impacts, -1 => harsher/faster impacts.
      dragMirrorScale: 0.5,
    };

    // ===== GAME MVP SYSTEMS (ORB STATE) BEGIN =====
    let mvp = null;
    let worldSystem = null;
    let orbFxSystem = null;
    let mvpShardRaf = 0;
    let mvpShardLastTs = 0;
    let mvpShards = [];
    let sanctusShieldTO = 0;

    function axisToColor01(axis){
      const a = String(axis || "").toLowerCase();
      if (a === "x") return { r: 0/255, g: 100/255, b: 253/255 };   // #0064fd
      if (a === "z") return { r: 253/255, g: 241/255, b: 0/255 };   // #fdf100
      return { r: 253/255, g: 78/255, b: 0/255 };                   // #fd4e00
    }

    const ORB_STROKE_DEFAULT = { r: 1.0, g: 1.0, b: 1.0 };
    const orbStrokeColor = {
      current: { ...ORB_STROKE_DEFAULT },
      target: { ...ORB_STROKE_DEFAULT },
      initialized: false,
    };

    function applyOrbStrokeColor01(c){
      const r = Math.round(clamp01(c.r) * 255);
      const g = Math.round(clamp01(c.g) * 255);
      const b = Math.round(clamp01(c.b) * 255);
      document.documentElement.style.setProperty("--orb-stroke-color", `rgb(${r},${g},${b})`);
      document.documentElement.style.setProperty("--orb-fill", `rgba(${r},${g},${b},0.50)`);
    }

    function setOrbStrokeColor01(c){
      const nx = clamp01(c.r);
      const ny = clamp01(c.g);
      const nz = clamp01(c.b);
      orbStrokeColor.target = { r: nx, g: ny, b: nz };
      if (!orbStrokeColor.initialized) {
        orbStrokeColor.current = { r: nx, g: ny, b: nz };
        orbStrokeColor.initialized = true;
        applyOrbStrokeColor01(orbStrokeColor.current);
      }
    }

    function updateOrbStrokeColor(dt){
      const a = 1 - Math.exp(-7 * clamp(dt, 0, 0.05));
      orbStrokeColor.current.r += (orbStrokeColor.target.r - orbStrokeColor.current.r) * a;
      orbStrokeColor.current.g += (orbStrokeColor.target.g - orbStrokeColor.current.g) * a;
      orbStrokeColor.current.b += (orbStrokeColor.target.b - orbStrokeColor.current.b) * a;
      applyOrbStrokeColor01(orbStrokeColor.current);
    }

    function resetOrbStrokeColor(immediate = false){
      orbStrokeColor.target = { ...ORB_STROKE_DEFAULT };
      if (immediate || !orbStrokeColor.initialized) {
        orbStrokeColor.current = { ...ORB_STROKE_DEFAULT };
        orbStrokeColor.initialized = true;
        applyOrbStrokeColor01(orbStrokeColor.current);
      }
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
        const [
          { createEventBus },
          { createGameState },
          { createOrbSystem },
          { createFxSystem },
          { createAudioSystem },
          { createWorldSystem },
          { createOrbFxSystem },
          { createVoiceRecognitionSystem },
          { createSpellDispatchSystem },
          { createVoiceHudSystem },
        ] = await Promise.all([
          import("./src/events/event-bus.js"),
          import("./src/state/game-state.js"),
          import("./src/systems/orb-system.js"),
          import("./src/systems/fx-system.js"),
          import("./src/systems/audio-system.js"),
          import("./src/systems/world-system.js"),
          import("./src/systems/orb-fx-system.js"),
          import("./src/systems/voice-recognition-system.js"),
          import("./src/systems/spell-dispatch-system.js"),
          import("./src/systems/voice-hud-system.js"),
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
        const spellDispatchSystem = createSpellDispatchSystem({ eventBus });
        const voiceRecognitionSystem = createVoiceRecognitionSystem({ eventBus });
        const voiceHudSystem = createVoiceHudSystem({
          eventBus,
          voiceReadoutEl: els.voiceReadout,
          voiceState: gameState.voice,
        });
        fxSystem.start();
        audioSystem.start();
        spellDispatchSystem.start();
        voiceRecognitionSystem.start();
        voiceHudSystem.start();
        worldSystem = createWorldSystem({
          eventBus,
          stageEl: els.physStage,
          getStageRect: () => stageRect(),
          worldToScreenY: (yW) => pickupScreenY(yW),
          getOrbWorldPosition: () => ({ xNorm: 0.5, yW: physState.yW }),
          orbRadiusPx: PHYS.orbRadiusPx,
          spawn: {
            xNorm: 0.5,
            yW: groundCenterWorld() - 1000,
            r: 25,
          },
          getGlobeEl: () => els.testGlobe,
          setGlobeEl: (el) => { els.testGlobe = el; },
        });
        orbFxSystem = createOrbFxSystem({
          eventBus,
          orbInteriorEl: els.orbInterior,
          stageEl: els.physStage,
          getOrbScreenY: () => orbScreenY(),
          orbRadiusPx: PHYS.orbRadiusPx,
          getAxisColor01: (axis) => axisToColor01(axis),
        });
        orbFxSystem.start();

        eventBus.on("orb.visual_state_changed", renderOrbDamageVisuals);
        eventBus.on("orb.shatter_piece_spawned", spawnShardFx);
        eventBus.on("orb.died", () => {
          orbInputSuppressed = true;
          clearFloatGrace();
          clearOrbRuntimeFxForDeath();
          scheduleDeathOverlay();
          updateDebugReadout();
        });
        eventBus.on("orb.revived", () => {
          orbInputSuppressed = false;
          clearFloatGrace();
          clearDeathOverlaySchedule();
          closeDeathOverlay();
          if (worldSystem) worldSystem.reset(performance.now());
          resetOrbStrokeColor(true);
          renderOrbDamageVisuals();
          updateDebugReadout();
        });
        eventBus.on("orb.shatter_complete", () => {
          mvpShards = [];
          if (els.orbShards) els.orbShards.innerHTML = "";
          stopShardSim();
        });
        eventBus.on("voice.spell_cast", (p = {}) => {
          const intent = String(p.intent || "");
          if (intent === "spell.school_shield") {
            activateSanctusShield(p.axis || "y", SANCTUS_SHIELD_MS);
            return;
          }
          if (intent === "spell.domus") {
            teleportOrbToSpawnNeutralizePhysics(DOMUS_TELEPORT_ABOVE_GROUND_PX);
            grantFloatGrace(DOMUS_FLOAT_GRACE_MS);
            return;
          }
          const graceMs = Number(p && p.floatGraceMs);
          grantFloatGrace(Number.isFinite(graceMs) ? graceMs : FLOAT_GRACE_DEFAULT_MS);
        });
        eventBus.on("orb.float_grace_grant", (p = {}) => {
          grantFloatGrace(p.ms);
        });
        eventBus.on("orb.float_grace_clear", () => {
          clearFloatGrace();
        });
        mvp = {
          eventBus,
          gameState,
          orbSystem,
          fxSystem,
          audioSystem,
          orbFxSystem,
          spellDispatchSystem,
          voiceRecognitionSystem,
          voiceHudSystem,
          grantFloatGrace,
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
        if (orbFxSystem) orbFxSystem.reset();
        if (worldSystem) worldSystem.reset(performance.now());
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
      floatGraceActive: false,
      floatGraceUntilMs: 0,
      floatGraceAnchorY: 0,
      floatGracePhase: 0,
    };

    // ===== WORLD PICKUPS (MVP SLICE) BEGIN =====
    function pickupScreenY(yW){
      const h = stageRect().height;
      const camTop = cameraTopFor(physState.yW, h);
      return yW - camTop;
    }
    // ===== WORLD PICKUPS (MVP SLICE) END =====

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
      physState.floatGraceAnchorY = physState.yW;
      physState.floatGracePhase = 0;
      applyOrbTransform();
      if (worldSystem) worldSystem.render(performance.now());
    }

    function teleportOrbToSpawnNeutralizePhysics(aboveGroundPx = 0){
      const yFloor = groundCenterWorld();
      const yCeil = PHYS.orbRadiusPx;
      const yTarget = clamp(yFloor - Math.max(0, Number(aboveGroundPx) || 0), yCeil, yFloor);
      physState.yW = yTarget;
      physState.v = 0;
      physState.onGround = !(yTarget < (yFloor - 0.5));
      physState.descendMs = 0;
      physState.shieldDescentBlocked = false;
      physState.floatGraceAnchorY = physState.yW;
      physState.floatGracePhase = 0;
      applyOrbTransform();
      if (worldSystem) worldSystem.render(performance.now());
      updateDebugReadout();
    }

    function clearFloatGrace(){
      physState.floatGraceActive = false;
      physState.floatGraceUntilMs = 0;
    }

    function grantFloatGrace(ms = FLOAT_GRACE_DEFAULT_MS){
      const dur = Math.max(50, Number(ms) || FLOAT_GRACE_DEFAULT_MS);
      const now = performance.now();
      physState.floatGraceActive = true;
      physState.floatGraceUntilMs = now + dur;
      physState.floatGraceAnchorY = physState.yW;
      physState.floatGracePhase = Math.random() * Math.PI * 2;
    }

    function isFloatGraceActive(nowMs){
      if (!physState.floatGraceActive) return false;
      if ((Number(nowMs) || 0) <= Number(physState.floatGraceUntilMs || 0)) return true;
      clearFloatGrace();
      return false;
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
    let terrainCtx = null;
    let terrainW = 0, terrainH = 0;
    let mountainLayers = [];

    function r01(){ return Math.random(); }
    function rIn(a,b){ return a + (b-a) * r01(); }

    function wrap(v, size){
      v = v % size;
      return (v < 0) ? (v + size) : v;
    }

    function groundLineWorldY(){
      return groundCenterWorld() + PHYS.orbRadiusPx + (PHYS.groundLinePx * 0.5);
    }

    function buildMountainLayer(w, cfg){
      const points = [];
      const step = Math.max(18, Number(cfg.step) || 28);
      const minOff = Math.max(20, Number(cfg.minOff) || 70);
      const maxOff = Math.max(minOff + 20, Number(cfg.maxOff) || 180);
      const jitter = Math.max(2, Number(cfg.jitter) || 18);
      let yOff = rIn(minOff, maxOff);
      for (let x = -80; x <= (w + 80); x += step){
        yOff += rIn(-jitter, jitter);
        yOff = clamp(yOff, minOff, maxOff);
        points.push({ x, yOff });
      }
      return {
        stroke: cfg.stroke || "rgba(50,255,117,0.95)",
        lineW: Math.max(1, Number(cfg.lineW) || 2),
        points,
      };
    }

    function regenMountains(w){
      mountainLayers = [buildMountainLayer(w, {
        step: 34,
        minOff: 56,
        maxOff: 186,
        jitter: 28,
        stroke: "rgba(50,255,117,0.95)",
        lineW: 2,
      })];
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
      const t = els.terrain;

      const rect = stageRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));

      const sameSize = (w === starW && h === starH && c.width === Math.floor(w*dpr) && c.height === Math.floor(h*dpr));
      if (!regen && sameSize) return;

      starW = w; starH = h;

      c.width  = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";

      starCtx = c.getContext("2d", { alpha: false });
      if (starCtx) starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (t) {
        terrainW = w;
        terrainH = h;
        t.width = Math.floor(w * dpr);
        t.height = Math.floor(h * dpr);
        t.style.width = w + "px";
        t.style.height = h + "px";
        terrainCtx = t.getContext("2d", { alpha: true });
        if (terrainCtx) terrainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        terrainCtx = null;
      }

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

      regenMountains(w);
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

    function drawWorldBackdrop(){
      const h = stageRect().height;
      const camTop = cameraTopFor(physState.yW, h);
      const groundY = groundLineWorldY() - camTop;

      if (els.groundLine) {
        const top = groundY - (PHYS.groundLinePx * 0.5);
        els.groundLine.style.top = `${top.toFixed(2)}px`;
      }

      if (!terrainCtx) return;
      const ctx = terrainCtx;
      const w = terrainW;
      const th = terrainH;
      ctx.clearRect(0, 0, w, th);

      for (const layer of mountainLayers) {
        const pts = Array.isArray(layer.points) ? layer.points : [];
        if (pts.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, groundY - pts[0].yOff);
        for (const p of pts) {
          ctx.lineTo(p.x, groundY - p.yOff);
        }
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.lineW;
        ctx.lineJoin = "miter";
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(50,255,117,0.28)";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    requestAnimationFrame(() => {
      resetOrbToGround();
      if (worldSystem) worldSystem.reset(performance.now());
      starResize(true);
      drawStars();
    });

    window.addEventListener("resize", () => {
      resetOrbToGround();
      if (worldSystem) worldSystem.render(performance.now());
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
      const nowMs = performance.now();
      if (mvp && mvp.orbSystem) mvp.orbSystem.tick(nowMs);
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

      if (isFloatGraceActive(nowMs)) {
        // Player climb intent cancels grace immediately so upward propulsion remains natural.
        const upwardIntent = (thrust > (g + 180)) || (physState.v < -22);
        if (upwardIntent) {
          clearFloatGrace();
        } else {
          // Adaptive equilibrium bob: scales subtly with gravity and signed fall drag.
          const dragFactor = Math.max(0, -Number(PHYS.downDrag) || 0);
          const bobAmp = clamp(1.8 + (physState.gravityMul * 1.2) + (dragFactor * 1.8), 1.8, 6.0);
          const bobHz = clamp(0.8 + (physState.gravityMul * 0.25) + (dragFactor * 0.15), 0.8, 1.7);
          physState.floatGracePhase += (Math.PI * 2 * bobHz * dt);
          const targetY = physState.floatGraceAnchorY + (Math.sin(physState.floatGracePhase) * bobAmp);

          const holdHz = clamp(8 + (physState.gravityMul * 3) + (dragFactor * 2), 8, 18);
          const alpha = 1 - Math.exp(-holdHz * dt);
          physState.yW += (targetY - physState.yW) * alpha;
          physState.v = 0;
        }
      }

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
      drawWorldBackdrop();
      updateOrbStrokeColor(dt);
      applyOrbTransform();
      if (orbFxSystem) orbFxSystem.tick(ts, dt);
      if (worldSystem) worldSystem.tick(ts, dt);
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
      if (mobileImpulseSystem) mobileImpulseSystem.resetFrameQueue();

      forceShakeLampOff();
      clearDirLampTimers();
      allDirLampOff();

      clearShock();
      if (sanctusShieldTO) {
        clearTimeout(sanctusShieldTO);
        sanctusShieldTO = 0;
      }
      shieldOffNow();
      resetOrbStrokeColor(true);
      sanctusShieldColorLocked = false;
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

    function handleIncomingImpulse(data){
      if (mobileImpulseSystem) {
        mobileImpulseSystem.ingestImpulse(data);
        return;
      }
      idleMarkActivity();
      if (orbInputSuppressed) return;
      teleMaybeLog(data);
      applyDataToUI(data);
    }

    function sendCalibrationTrigger(){
      if (lanSession && lanSession.sendControl("calibrate")) return true;
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

      if (!sanctusShieldColorLocked && d && Array.isArray(d.shieldRGB) && d.shieldRGB.length >= 3){
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
      updateFlatSpinWindow(d, nowMs);

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
          const canCalib = mobileImpulseSystem ? mobileImpulseSystem.isCalibAvailable() : calibAvailable;
          if (!canCalib) return;
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

        if (lanSession && lanSession.shouldIgnoreAblyImpulses()) return;

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
        if (els.startScreen && !els.startScreen.classList.contains("off")) hideStartScreen();

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
        if (worldSystem) worldSystem.reset(performance.now());
        if (orbFxSystem) orbFxSystem.reset();
        closeDeathOverlay();
        renderOrbDamageVisuals();
        updateDebugReadout();
      });
    }

    (async function init(){
      await initUiOverlaysSystem();
      await initTelemetryDebugSystem();
      await initMobileImpulseSystem();
      await initLanSessionSystem();
      initMvpSystems();
      connect({ auto:true });
      syncStartQrSizeToTitlePx();
      launchLanPairingFlow();
    })();

    window.addEventListener("resize", () => {
      syncStartQrSizeToTitlePx();
    });
