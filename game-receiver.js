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
      electricLayer: $("electricLayer"),
      flameLayer: $("flameLayer"),
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
    let activeGameTheme = null;
    let BG0 = { r: 0,   g: 0,  b: 0  };
    let BG1 = { r: 255, g: 42, b: 0  };

    function rgb255To01(c){
      return {
        r: clamp01((c && c.r) / 255),
        g: clamp01((c && c.g) / 255),
        b: clamp01((c && c.b) / 255),
      };
    }

    function applyRuntimeTheme(theme){
      if (!theme || typeof theme !== "object") return;
      activeGameTheme = theme;
      const bg = theme.world && theme.world.energyBackground;
      if (bg && bg.startRgb && bg.endRgb) {
        BG0 = {
          r: clamp(Math.round(Number(bg.startRgb.r) || 0), 0, 255),
          g: clamp(Math.round(Number(bg.startRgb.g) || 0), 0, 255),
          b: clamp(Math.round(Number(bg.startRgb.b) || 0), 0, 255),
        };
        BG1 = {
          r: clamp(Math.round(Number(bg.endRgb.r) || 0), 0, 255),
          g: clamp(Math.round(Number(bg.endRgb.g) || 0), 0, 255),
          b: clamp(Math.round(Number(bg.endRgb.b) || 0), 0, 255),
        };
      }
      if (theme.orb) {
        ORB_FILL_ALPHA = clamp01(theme.orb.fillAlpha);
        if (theme.orb.strokeDefaultRgb) {
          ORB_STROKE_DEFAULT = rgb255To01(theme.orb.strokeDefaultRgb);
        }
      }
      if (theme.shield && typeof VFX_DEFAULTS === "object" && VFX_DEFAULTS.shield) {
        if (Number.isFinite(Number(theme.shield.alpha))) VFX_DEFAULTS.shield.alpha = clamp01(theme.shield.alpha);
        if (Number.isFinite(Number(theme.shield.pulseMs))) VFX_DEFAULTS.shield.pulseMs = Math.max(0, Number(theme.shield.pulseMs));
        if (Number.isFinite(Number(theme.shield.pulseMin))) VFX_DEFAULTS.shield.pulseMin = clamp01(theme.shield.pulseMin);
        if (Number.isFinite(Number(theme.shield.pulseMax))) VFX_DEFAULTS.shield.pulseMax = clamp01(theme.shield.pulseMax);
        setVar("--shield-alpha", String(VFX_DEFAULTS.shield.alpha.toFixed(2)));
        setVar("--shield-pulse-ms", String(Math.round(VFX_DEFAULTS.shield.pulseMs)) + "ms");
        setVar("--shield-pulse-min", String(VFX_DEFAULTS.shield.pulseMin.toFixed(2)));
        setVar("--shield-pulse-max", String(Math.min(VFX_DEFAULTS.shield.pulseMax, VFX_DEFAULTS.shield.alpha).toFixed(2)));
      }
      if (theme.shockwave && typeof VFX_DEFAULTS === "object" && VFX_DEFAULTS.shock) {
        if (Number.isFinite(Number(theme.shockwave.strokeWidthPx))) {
          VFX_DEFAULTS.shock.stroke = evenStroke(theme.shockwave.strokeWidthPx, 2, 20);
          setVar("--shock-stroke", VFX_DEFAULTS.shock.stroke + "px");
        }
      }
      if (theme.shield && theme.shield.colorRgb) {
        shieldColor01 = rgb255To01(theme.shield.colorRgb);
        setShieldColor01(shieldColor01);
      }
      resetOrbStrokeColor(true);
      setBgFromEnergy(0);
    }
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
      },
      flame: {
        diameter: 200,
        durationMs: 10000,
      },
      electric: {
        startR: 80,
        endR: 200,
        durationMs: 10000,
        nodeCount: 13,
        particleCount: 340,
        particleSpeed: 0.62,
        maxBoltJumpSq: 1200,
        startJitterRatio: 0.30,
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
    let shieldDecayActive = 0;
    let sanctusShieldColorLocked = false;

    function shieldOffNow(){
      sanctusShieldColorLocked = false;
      if (bubbleShieldRuntime && typeof bubbleShieldRuntime.off === "function") {
        bubbleShieldRuntime.off();
      }
    }

    function shieldOnNow(){
      if (bubbleShieldRuntime && typeof bubbleShieldRuntime.on === "function") {
        bubbleShieldRuntime.on();
      }
    }

    function shieldDecay(){
      if (bubbleShieldRuntime && typeof bubbleShieldRuntime.decay === "function") {
        bubbleShieldRuntime.decay();
      }
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

    function clearShock(){
      if (shockwaveRuntime && typeof shockwaveRuntime.clear === "function") {
        shockwaveRuntime.clear();
      }
    }

    function playShock(){
      if (shockwaveRuntime && typeof shockwaveRuntime.play === "function") {
        shockwaveRuntime.play();
      }
    }

    function triggerShockwave(){
      if (shockwaveRuntime && typeof shockwaveRuntime.trigger === "function") {
        shockwaveRuntime.trigger();
        return;
      }
      playShock();
    }

    // =========================================================================
    // Flame AOE (ported from VFX lab)
    // =========================================================================
    const FLAME_SHOW_CORE = false;

    function evenPx(n, min = 2, max = 4096){
      n = Math.round(Number(n) || 0);
      n = Math.max(min, Math.min(max, n));
      if (n % 2 === 1) n += 1;
      return n;
    }

    function rand(min, max){
      return min + (Math.random() * (max - min));
    }

    function clearFlame(){
      if (flameAoeRuntime && typeof flameAoeRuntime.clear === "function") {
        flameAoeRuntime.clear();
      }
    }

    function playFlameAoe(){
      if (flameAoeRuntime && typeof flameAoeRuntime.play === "function") {
        flameAoeRuntime.play();
      }
    }

    // =========================================================================
    // Electric AOE (ported from VFX lab)
    // =========================================================================
    function clearElectric(){
      if (electricAoeRuntime && typeof electricAoeRuntime.clear === "function") {
        electricAoeRuntime.clear();
      }
    }

    function playElectricAoe(){
      if (electricAoeRuntime && typeof electricAoeRuntime.play === "function") {
        electricAoeRuntime.play();
      }
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
    // ENERGY BANK (resources-system-backed)
    // =========================================================================
    const ENERGY_BANK_CAP = 1000;
    const ENERGY_SHAKE_COST = 100;
    const ENERGY_CHARGE_RATE_PPS = 160;

    function resetEnergyBank(){
      if (resourcesSystem && typeof resourcesSystem.resetEnergyBank === "function") {
        resourcesSystem.resetEnergyBank(performance.now());
      }
    }

    function updateEnergyBankFromPhone(energyFromPhone01, nowMs){
      if (resourcesSystem && typeof resourcesSystem.updateEnergyBankFromPhone === "function") {
        resourcesSystem.updateEnergyBankFromPhone(energyFromPhone01, nowMs);
      }
    }

    function getEnergyBankPts(){
      if (resourcesSystem && typeof resourcesSystem.getEnergyBankPts === "function") {
        return Number(resourcesSystem.getEnergyBankPts()) || 0;
      }
      return 0;
    }

    function getEnergyBankCap(){
      if (resourcesSystem && typeof resourcesSystem.getEnergyBankCap === "function") {
        return Math.max(1, Number(resourcesSystem.getEnergyBankCap()) || ENERGY_BANK_CAP);
      }
      return ENERGY_BANK_CAP;
    }

    function canSpendShake(){
      if (resourcesSystem && typeof resourcesSystem.canSpendShake === "function") {
        return !!resourcesSystem.canSpendShake();
      }
      return false;
    }

    function spendShake(){
      if (resourcesSystem && typeof resourcesSystem.spendShake === "function") {
        resourcesSystem.spendShake(performance.now());
      }
    }

    // =========================================================================
    // SHAKE THRESHOLD + energy-gated detonation (receiver-side gate)
    // =========================================================================
    let INPUT_GESTURE_CFG = {
      shake: {
        cooldownMs: 2500,
        mode: 2,
        grooveGate: 0.20,
        lampThreshold: 1.65,
        directionRecentMs: 750,
        rearmThreshold: 0.10,
      },
      flatSpin: {
        dominanceOn: 0.72,
        dominanceOff: 0.60,
        dominanceGapOn: 0.14,
        dominanceGapOff: 0.09,
        onHoldMs: 200,
        offHoldMs: 280,
        gateRefreshMs: 1100,
        minSpeed01: 0.02,
      },
    };

    function resetShakeDetector(){
      if (inputGestureSystem && typeof inputGestureSystem.reset === "function") {
        inputGestureSystem.reset(performance.now());
      } else {
        forceShakeLampOff();
        clearDirLampTimers();
        allDirLampOff();
      }
    }

    function flashDirLampPair(a, b, ms=380){
      clearDirLampTimers();
      allDirLampOff();
      flashDirLamp(a, ms);
      flashDirLamp(b, ms);
    }

    function processShakeDoubleBang(shakeVal01, nowMs, groove01){
      if (!inputGestureSystem || typeof inputGestureSystem.processShakeSample !== "function") return;
      inputGestureSystem.processShakeSample({
        shakeVal01,
        groove01,
        atMs: nowMs,
      });
    }

    // =========================================================================
    // STABILITY + VARIABILITY — no cooldown 
    // =========================================================================
    let INPUT_DYNAMICS_CFG = {
      stability: {
        avgMs: 250,
        armMs: 220,
        onThreshold: 0.08,
        offThreshold: 0.10,
        speedMin01: 0.02,
      },
      variability: {
        avgMs: 250,
        armMs: 220,
        onThreshold: 0.80,
        offThreshold: 0.78,
      },
    };
    let stabilityVisualGate = true;
    let inputDynamicsSystem = null;

    function applyStabilityVisuals(){
      const dynState = (inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
        ? inputDynamicsSystem.getState()
        : { stabilityOn: false, variabilityOn: false };
      const showStable = !!dynState.stabilityOn && !!stabilityVisualGate;
      const showVar = !!dynState.variabilityOn && !!stabilityVisualGate;

      els.dynLampStable.classList.toggle("on", showStable);
      els.dynLampVar.classList.toggle("on", showVar);
    }

    function isDiversityLampLit(){
      const dynState = (inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
        ? inputDynamicsSystem.getState()
        : { variabilityOn: false };
      return !!dynState.variabilityOn && !!stabilityVisualGate;
    }

    function resetStability(){
      if (inputDynamicsSystem && typeof inputDynamicsSystem.reset === "function") {
        inputDynamicsSystem.reset();
      }
      applyStabilityVisuals();
      shieldOffNow();
    }
    function resetVariability(){
      if (inputDynamicsSystem && typeof inputDynamicsSystem.reset === "function") {
        inputDynamicsSystem.reset();
      }
      applyStabilityVisuals();
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
              mvp.eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
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
          mvp.eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_SET_MODE, { mode });
        } else {
          mvp.eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_SET_MODE, { mode: "gated_window" });
          mvp.eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_OPEN_GATE, { reason: "keyboard", timeoutMs: 4500 });
        }
        return;
      }

      // Debug-only "nirvana" test: enhanced grace + input processing reset.
      if ((e.key === "n" || e.key === "N") && e.shiftKey) {
        executeSpellCastAction("orb_super_grace", { payload: { ms: SUPER_GRACE_DEFAULT_MS } });
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

    let SHIELD_DESCENT = {
      vDownThr: 60,
      graceMs: 260
    };

    let PHYS = {
      groundFromBottomPx: 17,
      groundLinePx: 2,
      orbRadiusPx: 50,

      gBase: 2200,
      thrustMax: 3000,

      upDrag:   2.6,
      downDrag: -0.24,

      bounce: 0.35,
      maxUpSpeed: 2200,
      maxDownSpeed: 2800,
    };
    let IMPACT_TH = 500;
    const DEATH_FLOW_DELAY_MS = 3000;
    const FLOAT_GRACE_DEFAULT_MS = 1000;
    const DOMUS_FLOAT_GRACE_MS = 5000;
    const SUPER_GRACE_DEFAULT_MS = 2500;
    const DOMUS_TELEPORT_ABOVE_GROUND_PX = 300;
    const SANCTUS_SHIELD_MS = 8000;
    const SANCTUS_SHIELD_SCALE = 1.25;
    let IMPACT_MODEL = {
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
    let orbSystemsBundle = null;
    let orbRuntimeLoop = null;
    let resourcesSystem = null;
    let inputSystem = null;
    let inputGestureSystem = null;
    let inputSystemsBundle = null;
    let orbRuntimeState = null;
    let runtimeSpellIndex = Object.create(null);
    let castActionRegistryIndex = Object.create(null);
    let RECEIVER_EVENTS = {
      EVT_VOICE_SET_MODE: "voice.set_mode",
      EVT_VOICE_OPEN_GATE: "voice.open_gate",
      EVT_VOICE_SPELL_CAST: "voice.spell_cast",
      EVT_ORB_VISUAL_STATE_CHANGED: "orb.visual_state_changed",
      EVT_ORB_SHATTER_PIECE_SPAWNED: "orb.shatter_piece_spawned",
      EVT_ORB_DIED: "orb.died",
      EVT_ORB_REVIVED: "orb.revived",
      EVT_ORB_SHATTER_COMPLETE: "orb.shatter_complete",
      EVT_ORB_FLOAT_GRACE_GRANT: "orb.float_grace_grant",
      EVT_ORB_FLOAT_GRACE_CLEAR: "orb.float_grace_clear",
    };
    let spellActionHandlers = Object.create(null);
    let spellCastExecutor = null;
    let createSpellActionHandlersModule = null;
    let buildInputHudViewModelModule = null;
    let runInputFramePipelineModule = null;
    let runOrbRuntimePipelineModule = null;
    let bubbleShieldRuntime = null;
    let shockwaveRuntime = null;
    let orbShatterRuntime = null;
    let flameAoeRuntime = null;
    let electricAoeRuntime = null;
    let vfxRuntimesBundle = null;
    let receiverModulesReady = false;
    let shardPaletteSnapshot = null;
    let sanctusShieldTO = 0;

    function axisToColor01(axis){
      const a = String(axis || "").toLowerCase();
      const axisColors = activeGameTheme && activeGameTheme.axisColors;
      if (axisColors && axisColors[a]) return rgb255To01(axisColors[a]);
      if (a === "x") return { r: 0/255, g: 100/255, b: 253/255 };   // #0064fd
      if (a === "z") return { r: 253/255, g: 241/255, b: 0/255 };   // #fdf100
      return { r: 253/255, g: 78/255, b: 0/255 };                   // #fd4e00
    }

    let ORB_FILL_ALPHA = 0.20;
    let ORB_STROKE_DEFAULT = { r: 1.0, g: 1.0, b: 1.0 };
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
      document.documentElement.style.setProperty("--orb-fill", `rgba(${r},${g},${b},${ORB_FILL_ALPHA.toFixed(2)})`);
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
      const gMul = Math.max(0.05, Number(getOrbRuntime().gravityMul) || 0);
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
      if (orbShatterRuntime && typeof orbShatterRuntime.clear === "function") {
        orbShatterRuntime.clear();
      }
    }

    function normalizeWorldItemSpawn(item){
      if (!item || String(item.kind || "") !== "energy_globe") return null;
      const s = item.spawn || {};
      const xNorm = clamp(Number(s.xNorm), 0, 1);
      const r = Math.max(1, Number(s.r) || 25);
      const yMode = String(s.yMode || "absolute");
      const yValue = Number(s.yValue) || 0;
      const yW = (yMode === "ground_center_offset")
        ? (groundCenterWorld() + yValue)
        : yValue;
      return {
        id: String(item.id || ""),
        xNorm: isFinite(xNorm) ? xNorm : 0.5,
        yW,
        r,
      };
    }

    function castActionForSpellId(spellId){
      const id = String(spellId || "").toLowerCase();
      const def = runtimeSpellIndex[id];
      return def ? String(def.castActionId || "") : "";
    }

    function initSpellActionHandlers(){
      if (typeof createSpellActionHandlersModule !== "function") {
        throw new Error("spell-action-handlers module unavailable");
      }
      spellActionHandlers = createSpellActionHandlersModule({
        playElectricAoe,
        playFlameAoe,
        teleportOrbToSpawnNeutralizePhysics,
        activateSanctusShield,
        grantSuperGrace,
        domusTeleportAboveGroundPx: DOMUS_TELEPORT_ABOVE_GROUND_PX,
        sanctusShieldMs: SANCTUS_SHIELD_MS,
      });
    }

    function executeSpellCastAction(castActionId, context = {}){
      if (!receiverModulesReady) return { handled: false, skipped: "not_ready" };
      if (!spellCastExecutor || typeof spellCastExecutor.execute !== "function") {
        throw new Error("spell-cast-executor unavailable");
      }
      return spellCastExecutor.execute(castActionId, context);
    }

    function parseRgbLike(colorText){
      const text = String(colorText || "").trim();
      // Supports rgb(...) and rgba(...) values used by orb CSS vars.
      const m = text.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i);
      if (!m) return null;
      const r = clamp(Math.round(Number(m[1]) || 0), 0, 255);
      const g = clamp(Math.round(Number(m[2]) || 0), 0, 255);
      const b = clamp(Math.round(Number(m[3]) || 0), 0, 255);
      const a = clamp01(m[4] == null ? 1 : Number(m[4]));
      return { r, g, b, a };
    }

    function captureCurrentOrbPalette(){
      const rootStyle = getComputedStyle(document.documentElement);
      const orbStyle = els.orb ? getComputedStyle(els.orb) : null;

      // Prefer live CSS vars actually being rendered.
      const strokeFromVar = parseRgbLike(rootStyle.getPropertyValue("--orb-stroke-color"));
      const fillFromVar = parseRgbLike(rootStyle.getPropertyValue("--orb-fill"));

      const fallbackR = Math.round(clamp01(orbStrokeColor.current.r) * 255);
      const fallbackG = Math.round(clamp01(orbStrokeColor.current.g) * 255);
      const fallbackB = Math.round(clamp01(orbStrokeColor.current.b) * 255);
      const stroke = strokeFromVar || { r: fallbackR, g: fallbackG, b: fallbackB, a: 1 };
      const fill = fillFromVar || { r: fallbackR, g: fallbackG, b: fallbackB, a: ORB_FILL_ALPHA };

      // If orb opacity is modulated at runtime, preserve that in shard fill alpha snapshot.
      const orbOpacity = orbStyle ? clamp01(Number(orbStyle.opacity) || 1) : 1;

      return {
        strokeRgb: `rgb(${stroke.r},${stroke.g},${stroke.b})`,
        fillRgb: `rgb(${fill.r},${fill.g},${fill.b})`,
        fillAlpha: clamp01(fill.a * orbOpacity),
      };
    }

    function spawnShardFx(p){
      const palette = shardPaletteSnapshot || captureCurrentOrbPalette();
      if (!orbShatterRuntime || typeof orbShatterRuntime.spawnPiece !== "function") return;
      orbShatterRuntime.spawnPiece(p, palette);
    }

    async function initMvpSystems(){
      try {
        receiverModulesReady = false;
        const [
          { loadReceiverInitModules, hydrateReceiverBootstrapState },
          receiverEventContracts,
          { createVfxRuntimesBundle },
          { createOrbRuntimeState },
          { createOrbRuntimeLoop },
        ] = await Promise.all([
          import("./src/runtime/receiver-bootstrap.js"),
          import("./src/contracts/events.js"),
          import("./src/vfx/effects/vfx-runtimes-bundle.js"),
          import("./src/systems/orb-runtime-state.js"),
          import("./src/systems/orb-runtime-loop.js"),
        ]);
        if (receiverEventContracts && typeof receiverEventContracts === "object") {
          RECEIVER_EVENTS = { ...RECEIVER_EVENTS, ...receiverEventContracts };
        }
        const mods = await loadReceiverInitModules();
        hydrateReceiverBootstrapState(mods, {
          applyRuntimeTheme,
          setBuildInputHudViewModelModule: (fn) => { buildInputHudViewModelModule = fn; },
          setCreateSpellActionHandlersModule: (fn) => { createSpellActionHandlersModule = fn; },
          setRunInputFramePipelineModule: (fn) => { runInputFramePipelineModule = fn; },
          setRunOrbRuntimePipelineModule: (fn) => { runOrbRuntimePipelineModule = fn; },
          getOrbRuntimeConfig: () => ({ PHYS, SHIELD_DESCENT, IMPACT_MODEL, IMPACT_TH }),
          setOrbRuntimeConfig: (next = {}) => {
            if (next.PHYS) PHYS = next.PHYS;
            if (next.SHIELD_DESCENT) SHIELD_DESCENT = next.SHIELD_DESCENT;
            if (next.IMPACT_MODEL) IMPACT_MODEL = next.IMPACT_MODEL;
            if (Number.isFinite(Number(next.IMPACT_TH))) IMPACT_TH = Number(next.IMPACT_TH);
          },
          vfxDefaults: VFX_DEFAULTS,
          getInputConfigs: () => ({ INPUT_GESTURE_CFG, INPUT_DYNAMICS_CFG }),
          setInputConfigs: (next = {}) => {
            if (next.INPUT_GESTURE_CFG) INPUT_GESTURE_CFG = next.INPUT_GESTURE_CFG;
            if (next.INPUT_DYNAMICS_CFG) INPUT_DYNAMICS_CFG = next.INPUT_DYNAMICS_CFG;
          },
          setRuntimeSpellIndexes: (next = {}) => {
            runtimeSpellIndex = next.runtimeSpellIndex || Object.create(null);
            castActionRegistryIndex = next.castActionRegistryIndex || Object.create(null);
          },
          initSpellActionHandlers,
          createSpellCastExecutorContext: () => ({
            castActionRegistryById: castActionRegistryIndex,
            handlers: spellActionHandlers,
            grantFloatGrace,
            floatGraceDefaultMs: FLOAT_GRACE_DEFAULT_MS,
            floatGraceDomusMs: DOMUS_FLOAT_GRACE_MS,
          }),
          setSpellCastExecutor: (executor) => { spellCastExecutor = executor; },
          setReceiverModulesReady: (v) => { receiverModulesReady = !!v; },
        });
        if (typeof createVfxRuntimesBundle === "function") {
          vfxRuntimesBundle = createVfxRuntimesBundle({
            bubbleShield: {
              shieldEl: els.shield,
              getConfig: () => ({
                alpha: VFX_DEFAULTS.shield.alpha,
                pulseMs: VFX_DEFAULTS.shield.pulseMs,
                pulseMin: VFX_DEFAULTS.shield.pulseMin,
                pulseMax: VFX_DEFAULTS.shield.pulseMax,
              }),
              setCssVar: (name, value) => setVar(name, value),
              clamp,
              clamp01,
              fadeInMs: SHIELD_FADEIN_MS,
              decayMs: SHIELD_DECAY_MS,
              onDecayActiveChange: (active) => { shieldDecayActive = active ? 1 : 0; },
            },
            shockwave: {
              layerEl: els.shockLayer,
              getConfig: () => ({
                startR: VFX_DEFAULTS.shock.startR,
                endR: VFX_DEFAULTS.shock.endR,
                rings: VFX_DEFAULTS.shock.rings,
                spawnMs: VFX_DEFAULTS.shock.spawnMs,
                decayMs: VFX_DEFAULTS.shock.decayMs,
                stroke: VFX_DEFAULTS.shock.stroke,
              }),
              setShockStrokeCssVar: (strokePx) => setVar("--shock-stroke", `${strokePx}px`),
              clamp,
              normalizeStroke: evenStroke,
            },
            orbShatter: {
              layerEl: els.orbShards,
              clamp,
            },
            flameAoe: {
              layerEl: els.flameLayer,
              getConfig: () => ({
                diameter: VFX_DEFAULTS.flame.diameter,
                durationMs: VFX_DEFAULTS.flame.durationMs,
              }),
              clamp,
              evenPx,
              showCore: FLAME_SHOW_CORE,
            },
            electricAoe: {
              layerEl: els.electricLayer,
              getConfig: () => ({
                startR: VFX_DEFAULTS.electric.startR,
                endR: VFX_DEFAULTS.electric.endR,
                durationMs: VFX_DEFAULTS.electric.durationMs,
                nodeCount: VFX_DEFAULTS.electric.nodeCount,
                particleCount: VFX_DEFAULTS.electric.particleCount,
                particleSpeed: VFX_DEFAULTS.electric.particleSpeed,
                maxBoltJumpSq: VFX_DEFAULTS.electric.maxBoltJumpSq,
                startJitterRatio: VFX_DEFAULTS.electric.startJitterRatio,
              }),
              clamp,
              evenPx,
              rand,
            },
          });
          bubbleShieldRuntime = vfxRuntimesBundle.bubbleShieldRuntime;
          shockwaveRuntime = vfxRuntimesBundle.shockwaveRuntime;
          orbShatterRuntime = vfxRuntimesBundle.orbShatterRuntime;
          flameAoeRuntime = vfxRuntimesBundle.flameAoeRuntime;
          electricAoeRuntime = vfxRuntimesBundle.electricAoeRuntime;
        }
        if (typeof createOrbRuntimeState === "function") {
          orbRuntimeState = createOrbRuntimeState({ initialState: orbRuntimeFallbackState });
        }
        if (typeof createOrbRuntimeLoop === "function") {
          if (orbRuntimeLoop && typeof orbRuntimeLoop.stop === "function") {
            orbRuntimeLoop.stop();
          }
          orbRuntimeLoop = createOrbRuntimeLoop({
            getState: () => getOrbRuntime(),
            isReady: () => (typeof runOrbRuntimePipelineModule === "function"),
            clamp,
            runFrame: ({ ts, dt, nowMs, wasOnGround }) => {
              runOrbRuntimePipelineModule({
                ts,
                dt,
                nowMs,
                wasOnGround,
                orbRuntimeState,
                phys: PHYS,
                shieldDescent: SHIELD_DESCENT,
                mvp,
                orbFxSystem,
                worldSystem,
                hooks: {
                  clamp,
                  liftToThrustAccel,
                  isFloatGraceActive,
                  clearFloatGrace,
                  groundCenterWorld,
                  computeImpactMetric,
                  drawStars,
                  drawWorldBackdrop,
                  updateOrbStrokeColor,
                  applyOrbTransform,
                  updateDebugReadout,
                },
              });
            },
          });
          orbRuntimeLoop.start();
        }
        const {
          createEventBus,
          createGameState,
          createOrbSystem,
          createFxSystem,
          createAudioSystem,
          createInputSystemsBundle,
          createWorldSystem,
          createResourcesSystem,
          createOrbSystemsBundle,
          createOrbFxSystem,
          createVoiceRecognitionSystem,
          createSpellDispatchSystem,
          createVoiceHudSystem,
          WORLD_ITEMS_V1,
        } = mods;

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
        const fxSystem = createFxSystem({ eventBus });
        const audioSystem = createAudioSystem({ eventBus });
        inputSystemsBundle = createInputSystemsBundle({
          eventBus,
          dynamicsConfig: {
            stabilityAvgMs: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.avgMs,
            stabilityArmMs: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.armMs,
            stabilityOnThr: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.onThreshold,
            stabilityOffThr: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.offThreshold,
            variabilityAvgMs: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.avgMs,
            variabilityArmMs: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.armMs,
            variabilityOnThr: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.onThreshold,
            variabilityOffThr: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.offThreshold,
          },
          gestureConfig: {
            shakeCooldownMs: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.cooldownMs,
            shakeMode: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.mode,
            grooveShakeGate: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.grooveGate,
            shakeLampThr: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.lampThreshold,
            sdRecentMs: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.directionRecentMs,
            flatSpinDominanceOn: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceOn,
            flatSpinDominanceOff: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceOff,
            flatSpinDominanceGapOn: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceGapOn,
            flatSpinDominanceGapOff: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceGapOff,
            flatSpinOnHoldMs: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.onHoldMs,
            flatSpinOffHoldMs: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.offHoldMs,
            flatSpinGateRefreshMs: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.gateRefreshMs,
            flatSpinMinSpeed01: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.minSpeed01,
          },
          gestureHooks: {
            canSpendShake,
            spendShake,
            isDiversityLampLit,
            flashShakeLamp,
            triggerShockwave,
            forceShakeLampOff,
            clearDirLampTimers,
            allDirLampOff,
            flashDirLampPair,
            flashDirLampSingle,
            setOrbStrokeColorByAxis(axis) {
              setOrbStrokeColor01(axisToColor01(axis));
            },
            resetOrbStrokeColor: () => {
              resetOrbStrokeColor();
            },
          },
        });
        inputSystem = inputSystemsBundle.inputSystem;
        inputDynamicsSystem = inputSystemsBundle.inputDynamicsSystem;
        inputGestureSystem = inputSystemsBundle.inputGestureSystem;
        resourcesSystem = createResourcesSystem({
          eventBus,
          config: {
            energyBankCap: ENERGY_BANK_CAP,
            energyShakeCost: ENERGY_SHAKE_COST,
            energyChargeRatePps: ENERGY_CHARGE_RATE_PPS,
          },
        });
        const spellDispatchSystem = createSpellDispatchSystem({ eventBus, resources: resourcesSystem });
        const voiceRecognitionSystem = createVoiceRecognitionSystem({ eventBus });
        const voiceHudSystem = createVoiceHudSystem({
          eventBus,
          voiceReadoutEl: els.voiceReadout,
          voiceState: gameState.voice,
        });
        fxSystem.start();
        audioSystem.start();
        inputSystemsBundle.start();
        resourcesSystem.start();
        spellDispatchSystem.start();
        voiceRecognitionSystem.start();
        voiceHudSystem.start();
        const globeSpawns = (Array.isArray(WORLD_ITEMS_V1) ? WORLD_ITEMS_V1 : [])
          .map(normalizeWorldItemSpawn)
          .filter(Boolean);
        const fallbackSpawn = {
          id: "globe_mid_01",
          xNorm: 0.5,
          yW: groundCenterWorld() - 1000,
          r: 25,
        };
        const resolvedGlobeSpawns = globeSpawns.length ? globeSpawns : [fallbackSpawn];

        worldSystem = createWorldSystem({
          eventBus,
          stageEl: els.physStage,
          getStageRect: () => stageRect(),
          worldToScreenY: (yW) => pickupScreenY(yW),
          getOrbWorldPosition: () => ({ xNorm: 0.5, yW: getOrbRuntime().yW }),
          orbRadiusPx: PHYS.orbRadiusPx,
          spawns: resolvedGlobeSpawns,
          spawn: {
            xNorm: 0.5,
            yW: groundCenterWorld() - 1000,
            r: 25,
          },
          getGlobeEl: () => els.testGlobe,
          setGlobeEl: (el) => { els.testGlobe = el; },
        });
        orbSystemsBundle = createOrbSystemsBundle({
          createOrbSystem,
          createOrbFxSystem,
          gameState,
          eventBus,
          orbFxOptions: {
            orbInteriorEl: els.orbInterior,
            stageEl: els.physStage,
            getOrbScreenY: () => orbScreenY(),
            orbRadiusPx: PHYS.orbRadiusPx,
            getAxisColor01: (axis) => axisToColor01(axis),
          },
        });
        const orbSystem = orbSystemsBundle && orbSystemsBundle.orbSystem;
        orbFxSystem = orbSystemsBundle && orbSystemsBundle.orbFxSystem;
        if (orbSystemsBundle && typeof orbSystemsBundle.start === "function") {
          orbSystemsBundle.start();
        }

        eventBus.on(RECEIVER_EVENTS.EVT_ORB_VISUAL_STATE_CHANGED, renderOrbDamageVisuals);
        eventBus.on(RECEIVER_EVENTS.EVT_ORB_SHATTER_PIECE_SPAWNED, spawnShardFx);
        eventBus.on(RECEIVER_EVENTS.EVT_ORB_DIED, () => {
          shardPaletteSnapshot = captureCurrentOrbPalette();
          orbInputSuppressed = true;
          clearFloatGrace();
          clearOrbRuntimeFxForDeath();
          scheduleDeathOverlay();
          updateDebugReadout();
        });
        eventBus.on(RECEIVER_EVENTS.EVT_ORB_REVIVED, () => {
          shardPaletteSnapshot = null;
          orbInputSuppressed = false;
          clearFloatGrace();
          clearDeathOverlaySchedule();
          closeDeathOverlay();
          if (worldSystem) worldSystem.reset(performance.now());
          resetOrbStrokeColor(true);
          renderOrbDamageVisuals();
          updateDebugReadout();
        });
        eventBus.on(RECEIVER_EVENTS.EVT_ORB_SHATTER_COMPLETE, () => {
          stopShardSim();
        });
        eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_CAST, (p = {}) => {
          const intent = String(p.intent || "");
          const spellId = String(p.spellId || "").toLowerCase();
          const spellDef = runtimeSpellIndex[spellId] || null;
          const castActionId = spellDef ? String(spellDef.castActionId || "") : castActionForSpellId(spellId);
          const result = executeSpellCastAction(castActionId, { payload: p, intent });
          if (result && result.handled && spellDef) {
            const postCastActions = Array.isArray(spellDef.postCastActions) ? spellDef.postCastActions : null;
            if (postCastActions) {
              for (const action of postCastActions) {
                const actionId = String(action && action.id || "");
                if (!actionId) continue;
                const payload = (action && typeof action.payload === "object" && action.payload)
                  ? { ...p, ...action.payload }
                  : p;
                executeSpellCastAction(actionId, { payload, intent });
              }
            } else if (Array.isArray(spellDef.postCastActionIds)) {
              for (const actionId of spellDef.postCastActionIds) {
                executeSpellCastAction(String(actionId || ""), { payload: p, intent });
              }
            }
          }
        });
        eventBus.on(RECEIVER_EVENTS.EVT_ORB_FLOAT_GRACE_GRANT, (p = {}) => {
          grantFloatGrace(p.ms);
        });
        eventBus.on(RECEIVER_EVENTS.EVT_ORB_FLOAT_GRACE_CLEAR, () => {
          clearFloatGrace();
        });
        mvp = {
          eventBus,
          gameState,
          orbSystem,
          fxSystem,
          audioSystem,
          inputSystemsBundle,
          inputSystem,
          inputDynamicsSystem,
          inputGestureSystem,
          orbRuntimeState,
          resourcesSystem,
          orbFxSystem,
          orbSystemsBundle,
          orbRuntimeLoop,
          spellDispatchSystem,
          voiceRecognitionSystem,
          voiceHudSystem,
          grantFloatGrace,
          grantSuperGrace,
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
        if (orbShatterRuntime && typeof orbShatterRuntime.clear === "function") orbShatterRuntime.clear();
        orbInputSuppressed = false;
        if (orbFxSystem) orbFxSystem.reset();
        if (worldSystem) worldSystem.reset(performance.now());
        clearDeathOverlaySchedule();
        closeDeathOverlay();
        renderOrbDamageVisuals();
        updateDebugReadout();
      } catch (e) {
        receiverModulesReady = false;
        console.warn("MVP systems init failed:", e);
      }
    }
    // ===== GAME MVP SYSTEMS (ORB STATE) END =====

    function groundCenterWorld(){
      return WORLD_H - (PHYS.groundFromBottomPx + PHYS.groundLinePx + PHYS.orbRadiusPx);
    }

    let orbRuntimeFallbackState = {
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

    function getOrbRuntime(){
      if (orbRuntimeState && typeof orbRuntimeState.get === "function") {
        return orbRuntimeState.get();
      }
      return orbRuntimeFallbackState;
    }

    function patchOrbRuntime(next = {}){
      if (orbRuntimeState && typeof orbRuntimeState.patch === "function") {
        return orbRuntimeState.patch(next);
      }
      Object.assign(orbRuntimeFallbackState, next || {});
      return orbRuntimeFallbackState;
    }

    // ===== WORLD PICKUPS (MVP SLICE) BEGIN =====
    function pickupScreenY(yW){
      const orbRt = getOrbRuntime();
      const h = stageRect().height;
      const camTop = cameraTopFor(orbRt.yW, h);
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
      const orbRt = getOrbRuntime();
      const h = stageRect().height;
      const camTop = cameraTopFor(orbRt.yW, h);
      return orbRt.yW - camTop;
    }

    function applyOrbTransform(){
      const y = orbScreenY();
      const top = y - PHYS.orbRadiusPx;
      els.orbWrap.style.transform = `translate(-50%, ${top.toFixed(2)}px)`;
    }

    function resetOrbToGround(){
      const yW = groundCenterWorld();
      patchOrbRuntime({
        yW,
        v: 0,
        onGround: true,
        floatGraceAnchorY: yW,
        floatGracePhase: 0,
      });
      applyOrbTransform();
      if (worldSystem) worldSystem.render(performance.now());
    }

    function teleportOrbToSpawnNeutralizePhysics(aboveGroundPx = 0){
      const yFloor = groundCenterWorld();
      const yCeil = PHYS.orbRadiusPx;
      const yTarget = clamp(yFloor - Math.max(0, Number(aboveGroundPx) || 0), yCeil, yFloor);
      const onGround = !(yTarget < (yFloor - 0.5));
      patchOrbRuntime({
        yW: yTarget,
        v: 0,
        onGround,
        descendMs: 0,
        shieldDescentBlocked: false,
        floatGraceAnchorY: yTarget,
        floatGracePhase: 0,
      });
      applyOrbTransform();
      if (worldSystem) worldSystem.render(performance.now());
      updateDebugReadout();
    }

    function clearFloatGrace(){
      patchOrbRuntime({
        floatGraceActive: false,
        floatGraceUntilMs: 0,
      });
    }

    function grantFloatGrace(ms = FLOAT_GRACE_DEFAULT_MS){
      const dur = Math.max(50, Number(ms) || FLOAT_GRACE_DEFAULT_MS);
      const now = performance.now();
      patchOrbRuntime({
        floatGraceActive: true,
        floatGraceUntilMs: now + dur,
        floatGraceAnchorY: getOrbRuntime().yW,
        floatGracePhase: Math.random() * Math.PI * 2,
      });
    }

    function resetInputProcessingState(atMs = performance.now()){
      if (inputSystemsBundle && typeof inputSystemsBundle.resetProcessingState === "function") {
        inputSystemsBundle.resetProcessingState(atMs);
        return;
      }
      if (inputSystem && typeof inputSystem.reset === "function") inputSystem.reset(atMs);
      if (inputDynamicsSystem && typeof inputDynamicsSystem.reset === "function") inputDynamicsSystem.reset(atMs);
      if (inputGestureSystem && typeof inputGestureSystem.reset === "function") inputGestureSystem.reset(atMs);
    }

    function grantSuperGrace(ms = SUPER_GRACE_DEFAULT_MS){
      const now = performance.now();
      resetInputProcessingState(now);
      grantFloatGrace(ms);
    }

    function isFloatGraceActive(nowMs){
      const orbRt = getOrbRuntime();
      if (!orbRt.floatGraceActive) return false;
      if ((Number(nowMs) || 0) <= Number(orbRt.floatGraceUntilMs || 0)) return true;
      clearFloatGrace();
      return false;
    }

    function setGravityMul(m){
      const gravityMul = clamp(Number(m) || 0, 0, 3);
      patchOrbRuntime({ gravityMul });
      els.gVal.textContent = getOrbRuntime().gravityMul.toFixed(2);
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
        fill: cfg.fill || "rgba(0,0,0,1.0)",
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
        fill: "rgba(0,0,0,1.0)",
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

      const camTop = cameraTopFor(getOrbRuntime().yW, h);

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
      const camTop = cameraTopFor(getOrbRuntime().yW, h);
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

        // Fill mountain body to ground with opaque black.
        ctx.beginPath();
        ctx.moveTo(pts[0].x, groundY - pts[0].yOff);
        for (const p of pts) {
          ctx.lineTo(p.x, groundY - p.yOff);
        }
        ctx.lineTo(pts[pts.length - 1].x, groundY);
        ctx.lineTo(pts[0].x, groundY);
        ctx.closePath();
        ctx.fillStyle = layer.fill || "rgba(0,0,0,1.0)";
        ctx.fill();

        // Draw the classic green jagged ridgeline.
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
      clearFlame();
      clearElectric();
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
      if (inputSystem && typeof inputSystem.reset === "function") inputSystem.reset(performance.now());
      resetEnergyBank();

      patchOrbRuntime({
        lift01: 0,
        energy01: 0,
        dynamics01: 0,
      });

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

    function renderInputHud(vm){
      if (!vm) return;

      els.vLift.textContent     = `${vm.liftP}%`;
      els.vGroove.textContent   = `${vm.gP}%${vm.locked ? " (locked)" : ""}`;
      els.vSmooth.textContent   = `${vm.sP}%`;
      els.vSpeed.textContent    = `${vm.sp}%`;
      els.vDynamics.textContent = `${vm.dP}%`;
      els.vEnergy.textContent   = `${vm.ePts}`;
      els.vShake.textContent    = `${Math.max(0, vm.sh).toFixed(2)}`;

      if (!sanctusShieldColorLocked && vm.shieldRgb01){
        const tr = clamp01(vm.shieldRgb01[0]);
        const tg = clamp01(vm.shieldRgb01[1]);
        const tb = clamp01(vm.shieldRgb01[2]);
        shieldColor01.r = lerp(shieldColor01.r, tr, SHIELD_COLOR_SMOOTH);
        shieldColor01.g = lerp(shieldColor01.g, tg, SHIELD_COLOR_SMOOTH);
        shieldColor01.b = lerp(shieldColor01.b, tb, SHIELD_COLOR_SMOOTH);
        setShieldColor01(shieldColor01);
      }

      setBar(els.bLift,  vm.lift);
      setBar(els.bGroove, vm.groove);
      setBar(els.bSmooth, vm.smooth);
      setBar(els.bSpeed,  vm.speed);
      setBar(els.bDynamics, vm.dynamics);
      setBar(els.bEnergy, vm.energyUI01);
      setBar(els.bShake,  vm.shakeMeter);

      els.vEnergy.classList.toggle("over", vm.over);
      els.bEnergy.classList.toggle("over", vm.over);

      // Repurposed row: Orb debug readout.
      updateDebugReadout();
    }

    function buildInputHudViewModel(processed){
      if (typeof buildInputHudViewModelModule !== "function") {
        throw new Error("build-input-hud-view-model module unavailable");
      }
      const shakeCooldownUntil = (inputGestureSystem && typeof inputGestureSystem.getShakeCooldownUntil === "function")
        ? Number(inputGestureSystem.getShakeCooldownUntil()) || 0
        : 0;
      const shakeLampThr = Number(INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.lampThreshold) || 1.65;
      return buildInputHudViewModelModule({
        processed,
        shakeCooldownUntil,
        shakeLampThreshold: shakeLampThr,
      });
    }

    function processInputFrame(d, nowMs){
      function pick01NewOrOld(newKey, oldKey){
        if (d[newKey] != null) {
          const n = Number(d[newKey]);
          return isFinite(n) ? n : 0;
        }
        const n = Number(d[oldKey]);
        if (!isFinite(n)) return 0;
        return (n > 1.5) ? (n / 100) : n;
      }

      if (inputSystem && typeof inputSystem.ingest === "function") {
        inputSystem.ingest(d, nowMs);
      }
      const frame = (inputSystem && typeof inputSystem.getLatest === "function")
        ? inputSystem.getLatest()
        : null;
      const energyFromPhone = frame ? frame.energy01 : pick01NewOrOld("energy01", "energy");
      const groove = frame ? frame.groove01 : pick01NewOrOld("groove01", "groove");
      const dynamics = frame ? frame.dynamics01 : pick01NewOrOld("dynamics01", "orbit01");
      const smooth = frame ? frame.smooth01 : pick01NewOrOld("smooth01", "smooth");
      const speed = frame ? frame.speed01 : pick01NewOrOld("speed01", "speed");
      const shake = frame ? frame.shake01 : pick01NewOrOld("shake01", "shake");
      const locked = frame ? !!frame.locked : !!d.locked;

      if (typeof runInputFramePipelineModule !== "function") {
        throw new Error("input-frame-pipeline module unavailable");
      }
      return runInputFramePipelineModule({
        d,
        frame,
        nowMs,
        values: {
          energyFromPhone,
          groove,
          dynamics,
          smooth,
          speed,
          shake,
          locked,
        },
        systems: {
          inputGestureSystem,
          inputDynamicsSystem,
        },
        runtime: {
          orbRuntimeState,
        },
        configs: {
          inputDynamics: INPUT_DYNAMICS_CFG,
        },
        hooks: {
          updateEnergyBankFromPhone,
          getEnergyBankPts,
          getEnergyBankCap,
          computeLift01,
          setBgFromEnergy,
          setStabilityVisualGate: (v) => { stabilityVisualGate = !!v; },
          applyStabilityVisuals,
          processShakeDoubleBang,
          setAudio,
        },
      });
    }

    function applyDataToUI(d){
      if (!receiverModulesReady) return;
      const nowMs = performance.now();
      const processed = processInputFrame(d, nowMs);
      const vm = buildInputHudViewModel(processed);
      renderInputHud(vm);
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
        if (inputSystem && typeof inputSystem.reset === "function") inputSystem.reset(performance.now());
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
