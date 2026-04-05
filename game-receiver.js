    const $ = (id) => document.getElementById(id);

    const els = {
      startScreen: $("startScreen"),
      startBtn: $("startBtn"),
      startQr: $("startQr"),

      devStagingLegacy: $("devStagingLegacy"),
      devStagingMount: $("devStagingMount"),

      pairBtn: $("pairBtn"),
      lanPartyBtn: $("lanPartyBtn"),
      newRoom: $("newRoom"),
      teleBtn: $("teleBtn"),
      wordBoardBtn: $("wordBoardBtn"),

      status: $("status"),
      kwsReadout: $("kwsReadout"),
      rulesReadout: $("rulesReadout"),
      kwsLog: $("kwsLog"),
      logTabKws: $("logTabKws"),
      logTabPhone: $("logTabPhone"),
      kwsTokenThrInput: $("kwsTokenThrInput"),
      kwsCooldownMsInput: $("kwsCooldownMsInput"),
      kwsApplyTuneBtn: $("kwsApplyTuneBtn"),

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
      devSpinAuditNote: $("devSpinAuditNote"),

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
      logPopup: $("logPopup"),
      logPopupHeader: $("logPopupHeader"),
      logPopupClose: $("logPopupClose"),
      wordBoardPopup: $("wordBoardPopup"),
      wordBoardPopupHeader: $("wordBoardPopupHeader"),
      wordBoardPopupClose: $("wordBoardPopupClose"),
      wordBoardBody: $("wordBoardBody"),
      wordBoardDebugPanel: $("wordBoardDebugPanel"),
      wordBoardDebugToggle: $("wordBoardDebugToggle"),
      wordBoardDebugBadge: $("wordBoardDebugBadge"),
      wordBoardDebugBody: $("wordBoardDebugBody"),

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

    const WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";
    const ENABLE_MOUNTED_DEV_STAGING = false;

    function clamp01(x){ x = Number(x); return Math.max(0, Math.min(1, isFinite(x) ? x : 0)); }
    function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
    const lerp = (a,b,t) => a + (b-a)*t;

    function setBar(el, v01){
      const p = clamp01(v01) * 100;
      el.style.width = p.toFixed(1) + "%";
    }

    let createLegacyDevStagingAdapterFactory = null;
    let createDevStagingPanelElementsFactory = null;
    let createLegacyDevStagingRefsFactory = null;

    function createBootFallbackDevStagingAdapter() {
      const refs = (typeof createLegacyDevStagingRefsFactory === "function")
        ? createLegacyDevStagingRefsFactory(els)
        : {
            status: els.status,
            fatal: els.fatal,
            teleBtn: els.teleBtn,
            wordBoardBtn: els.wordBoardBtn,
            kwsReadout: els.kwsReadout,
            kwsLog: els.kwsLog,
            logTabKws: els.logTabKws,
            logTabPhone: els.logTabPhone,
            kwsTokenThrInput: els.kwsTokenThrInput,
            kwsCooldownMsInput: els.kwsCooldownMsInput,
            kwsApplyTuneBtn: els.kwsApplyTuneBtn,
            logPopup: els.logPopup,
            logPopupHeader: els.logPopupHeader,
            logPopupClose: els.logPopupClose,
            wordBoardPopup: els.wordBoardPopup,
            wordBoardPopupHeader: els.wordBoardPopupHeader,
            wordBoardPopupClose: els.wordBoardPopupClose,
            wordBoardBody: els.wordBoardBody,
            wordBoardDebugPanel: els.wordBoardDebugPanel,
            wordBoardDebugToggle: els.wordBoardDebugToggle,
            wordBoardDebugBadge: els.wordBoardDebugBadge,
            wordBoardDebugBody: els.wordBoardDebugBody,
            vLift: els.vLift,
            vGroove: els.vGroove,
            vSmooth: els.vSmooth,
            vSpeed: els.vSpeed,
            vDynamics: els.vDynamics,
            vEnergy: els.vEnergy,
            vShake: els.vShake,
            bLift: els.bLift,
            bGroove: els.bGroove,
            bSmooth: els.bSmooth,
            bSpeed: els.bSpeed,
            bDynamics: els.bDynamics,
            bEnergy: els.bEnergy,
            bShake: els.bShake,
            dynLampStable: els.dynLampStable,
            dynLampVar: els.dynLampVar,
            shakeLamp: els.shakeLamp,
            lampUp: els.lampUp,
            lampDown: els.lampDown,
            lampLeft: els.lampLeft,
            lampRight: els.lampRight,
            lampForward: els.lampForward,
            lampBack: els.lampBack,
            devSpinAuditNote: els.devSpinAuditNote,
          };
      if (typeof createLegacyDevStagingAdapterFactory === "function") {
        return createLegacyDevStagingAdapterFactory({
          els,
          setBar,
          renderDevStagingHud,
          resetDevStagingHud,
          setDevStagingStatus,
          setDevStagingFatal,
          setDevStagingDebugNote,
          closeDevStagingTopmostPopup,
        });
      }
      return {
        refs,
        setStatus(html, cls){
          if (typeof setDevStagingStatus === "function") {
            setDevStagingStatus(refs, html, cls || "dim");
            return;
          }
          if (!refs.status) return;
          refs.status.className = cls || "dim";
          refs.status.innerHTML = html;
        },
        setFatal(message = "") {
          if (typeof setDevStagingFatal === "function") {
            setDevStagingFatal(refs, message);
            return;
          }
          if (!refs.fatal) return;
          const hasMessage = !!String(message || "");
          refs.fatal.style.display = hasMessage ? "block" : "none";
          refs.fatal.textContent = hasMessage ? String(message) : "";
        },
        setDebugNote(text = "") {
          if (typeof setDevStagingDebugNote === "function") {
            setDevStagingDebugNote(refs, text);
            return;
          }
          if (!refs.devSpinAuditNote) return;
          refs.devSpinAuditNote.textContent = String(text || "");
        },
        closeTopmostPopup() {
          if (typeof closeDevStagingTopmostPopup === "function") {
            return !!closeDevStagingTopmostPopup(refs);
          }
          if (refs.wordBoardPopup && refs.wordBoardPopup.classList.contains("on") && refs.wordBoardPopupClose) {
            refs.wordBoardPopupClose.click();
            return true;
          }
          if (refs.logPopup && refs.logPopup.classList.contains("on") && refs.logPopupClose) {
            refs.logPopupClose.click();
            return true;
          }
          return false;
        },
        resetMeters() {
          if (typeof resetDevStagingHud === "function") {
            resetDevStagingHud(refs);
            return;
          }
          setBar(refs.bLift, 0);
          setBar(refs.bGroove, 0);
          setBar(refs.bSmooth, 0);
          setBar(refs.bSpeed, 0);
          setBar(refs.bDynamics, 0);
          setBar(refs.bEnergy, 0);
          setBar(refs.bShake, 0);
          refs.vLift.textContent = "0%";
          refs.vGroove.textContent = "0%";
          refs.vSmooth.textContent = "0%";
          refs.vSpeed.textContent = "0%";
          refs.vDynamics.textContent = "0%";
          refs.vEnergy.textContent = "0";
          refs.vShake.textContent = "0.00";
          refs.vEnergy.classList.remove("over");
          refs.bEnergy.classList.remove("over");
        },
        renderInputHud(vm) {
          if (!vm) return;
          if (typeof renderDevStagingHud === "function") {
            renderDevStagingHud(refs, vm);
            return;
          }
          refs.vLift.textContent = `${vm.liftP}%`;
          refs.vGroove.textContent = `${vm.gP}%${vm.locked ? " (locked)" : ""}`;
          refs.vSmooth.textContent = `${vm.sP}%`;
          refs.vSpeed.textContent = `${vm.sp}%`;
          refs.vDynamics.textContent = `${vm.dP}%`;
          refs.vEnergy.textContent = `${vm.ePts}`;
          refs.vShake.textContent = `${Math.max(0, vm.sh).toFixed(2)}`;

          setBar(refs.bLift, vm.lift);
          setBar(refs.bGroove, vm.groove);
          setBar(refs.bSmooth, vm.smooth);
          setBar(refs.bSpeed, vm.speed);
          setBar(refs.bDynamics, vm.dynamics);
          setBar(refs.bEnergy, vm.energyUI01);
          setBar(refs.bShake, vm.shakeMeter);

          refs.vEnergy.classList.toggle("over", vm.over);
          refs.bEnergy.classList.toggle("over", vm.over);
        },
      };
    }

    let renderDevStagingHud = null;
    let resetDevStagingHud = null;
    let setDevStagingStatus = null;
    let setDevStagingFatal = null;
    let setDevStagingDebugNote = null;
    let closeDevStagingTopmostPopup = null;
    let legacyDevStagingView = createBootFallbackDevStagingAdapter();
    let currentDevStagingView = legacyDevStagingView;
    let devStagingRefs = currentDevStagingView.refs;

    function createDevStagingPanelElements() {
      if (typeof createDevStagingPanelElementsFactory === "function") {
        return createDevStagingPanelElementsFactory(currentDevStagingView.refs || currentDevStagingView);
      }
      const refs = currentDevStagingView.refs || {};
      return (typeof createLegacyDevStagingRefsFactory === "function")
        ? createLegacyDevStagingRefsFactory(refs)
        : refs;
    }

    async function maybeMountDevStagingSurface() {
      if (!ENABLE_MOUNTED_DEV_STAGING) return null;
      if (!els.devStagingMount || !els.devStagingLegacy) return null;
      try {
        const {
          closeDevStagingTopmostPopup: closeDevStagingTopmostPopupModule,
          mountDevStaging,
          renderDevStagingHud: renderDevStagingHudModule,
          resetDevStagingHud: resetDevStagingHudModule,
          setDevStagingDebugNote: setDevStagingDebugNoteModule,
          setDevStagingFatal: setDevStagingFatalModule,
          setDevStagingStatus: setDevStagingStatusModule,
        } = await import("./src/runtime-shell/staging/dev-staging/dev-staging.js");
        closeDevStagingTopmostPopup = (typeof closeDevStagingTopmostPopupModule === "function")
          ? closeDevStagingTopmostPopupModule
          : null;
        renderDevStagingHud = (typeof renderDevStagingHudModule === "function")
          ? renderDevStagingHudModule
          : null;
        resetDevStagingHud = (typeof resetDevStagingHudModule === "function")
          ? resetDevStagingHudModule
          : null;
        setDevStagingDebugNote = (typeof setDevStagingDebugNoteModule === "function")
          ? setDevStagingDebugNoteModule
          : null;
        setDevStagingFatal = (typeof setDevStagingFatalModule === "function")
          ? setDevStagingFatalModule
          : null;
        setDevStagingStatus = (typeof setDevStagingStatusModule === "function")
          ? setDevStagingStatusModule
          : null;
        const mounted = (typeof mountDevStaging === "function")
          ? mountDevStaging(els.devStagingMount)
          : null;
        if (!mounted) return null;
        currentDevStagingView = mounted;
        devStagingRefs = currentDevStagingView.refs;
        els.devStagingLegacy.classList.add("off");
        els.devStagingLegacy.setAttribute("aria-hidden", "true");
        els.devStagingMount.classList.remove("off");
        els.devStagingMount.setAttribute("aria-hidden", "false");
        return mounted;
      } catch (err) {
        console.warn("Mounted dev-staging activation failed:", err);
        return null;
      }
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
      currentDevStagingView.setFatal(msg);
    }

    function setStatus(html, cls){
      currentDevStagingView.setStatus(html, cls);
    }

    // =========================================================================
    // CALIBRATION OVERLAY
    // =========================================================================
    let uiOverlaysSystem = null;
    let calibInFlight = false;
    let calibAvailable = false;

    async function initUiOverlaysSystem(){
      try {
        const { createUiOverlaysSystem } = await import("./src/ui/game/ui-overlays-system.js");
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
    let applyGameThemeCssVarsModule = null;

    function rgb255To01(c){
      return {
        r: clamp01((c && c.r) / 255),
        g: clamp01((c && c.g) / 255),
        b: clamp01((c && c.b) / 255),
      };
    }

    function themeAccentRgba(alpha = 1){
      const accent = (activeGameTheme && activeGameTheme.ui && activeGameTheme.ui.accentRgb)
        ? activeGameTheme.ui.accentRgb
        : { r: 50, g: 255, b: 117 };
      return `rgba(${clamp(Math.round(Number(accent.r) || 0), 0, 255)},${clamp(Math.round(Number(accent.g) || 0), 0, 255)},${clamp(Math.round(Number(accent.b) || 0), 0, 255)},${clamp01(alpha)})`;
    }

    function applyRuntimeTheme(theme){
      if (!theme || typeof theme !== "object") return;
      activeGameTheme = theme;
      if (typeof applyGameThemeCssVarsModule === "function") {
        applyGameThemeCssVarsModule(theme, { root: document.documentElement });
      }
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
      if (theme.orb) rebuildOrbBaseVisualState(theme);
      if (theme.shockwave && typeof VFX_DEFAULTS === "object" && VFX_DEFAULTS.shock) {
        if (Number.isFinite(Number(theme.shockwave.strokeWidthPx))) {
          VFX_DEFAULTS.shock.stroke = evenStroke(theme.shockwave.strokeWidthPx, 2, 20);
          setVar("--shock-stroke", VFX_DEFAULTS.shock.stroke + "px");
        }
      }
      resetOrbStrokeColor(true);
    }

    // =========================================================================
    // [VFX] SHIELD + SHOCKWAVE (ported from VFX tester)
    // =========================================================================
    function setVar(name, value){
      document.documentElement.style.setProperty(name, value);
    }

    const VFX_DEFAULTS = {
      shield: {
        colorRgb: { r: 120, g: 210, b: 255 },
        diameterPx: 124,
        strokeWidthPx: 4,
        durationMs: 8000,
        alpha: 1.00,
        pulseMs: 80,
        pulseMin: 0.30,
        pulseMax: 1.00
      },
      shock: {
        color: { r: 255, g: 255, b: 255, a: 0.65 },
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
      setVar("--shield-r", String(Math.round(Number(VFX_DEFAULTS.shield.colorRgb.r) || 120)));
      setVar("--shield-g", String(Math.round(Number(VFX_DEFAULTS.shield.colorRgb.g) || 210)));
      setVar("--shield-b", String(Math.round(Number(VFX_DEFAULTS.shield.colorRgb.b) || 255)));
      setVar("--shield-d", String(Math.round(Number(VFX_DEFAULTS.shield.diameterPx) || 124)) + "px");
      setVar("--shield-stroke", String(Math.round(Number(VFX_DEFAULTS.shield.strokeWidthPx) || 4)) + "px");
      setVar("--shield-alpha", String(VFX_DEFAULTS.shield.alpha.toFixed(2)));
      setVar("--shield-pulse-ms", String(Math.round(VFX_DEFAULTS.shield.pulseMs)) + "ms");
      setVar("--shield-pulse-min", String(VFX_DEFAULTS.shield.pulseMin.toFixed(2)));
      setVar("--shield-pulse-max", String(Math.min(VFX_DEFAULTS.shield.pulseMax, VFX_DEFAULTS.shield.alpha).toFixed(2)));

      const stroke = evenStroke(VFX_DEFAULTS.shock.stroke, 2, 20);
      VFX_DEFAULTS.shock.stroke = stroke;
    })();

    function evenStroke(n, min = 2, max = 20){
      n = Math.round(Number(n) || min);
      n = Math.max(min, Math.min(max, n));
      if (n % 2 === 1) n += 1;
      return n;
    }

    const SHIELD_DECAY_MS = 2000;
    const SHIELD_FADEIN_MS = 750;
    let shieldDecayActive = 0;

    function shieldOffNow(){
      if (bubbleShieldRuntime && typeof bubbleShieldRuntime.off === "function") {
        bubbleShieldRuntime.off();
      }
    }

    function shieldDecay(){
      if (bubbleShieldRuntime && typeof bubbleShieldRuntime.decay === "function") {
        bubbleShieldRuntime.decay();
      }
    }

    function activateBubbleShield({ durationMs = BUBBLE_SHIELD_DEFAULT_MS } = {}){
      if (!els.shield || !bubbleShieldRuntime || typeof bubbleShieldRuntime.activate !== "function") return;
      bubbleShieldRuntime.activate({
        durationMs: Math.max(150, Number(durationMs) || BUBBLE_SHIELD_DEFAULT_MS),
      });
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
      if (typeof triggerShockwaveRuntimeModule === "function") {
        const result = triggerShockwaveRuntimeModule({
          shockwaveRuntime,
          playShock,
        });
        if (result && result.handled) return;
      }
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
      if (typeof playFlameAoeRuntimeModule === "function") {
        const result = playFlameAoeRuntimeModule({
          flameAoeRuntime,
        });
        if (result && result.handled) return;
      }
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
      if (typeof playElectricAoeRuntimeModule === "function") {
        const result = playElectricAoeRuntimeModule({
          electricAoeRuntime,
        });
        if (result && result.handled) return;
      }
      if (electricAoeRuntime && typeof electricAoeRuntime.play === "function") {
        electricAoeRuntime.play();
      }
    }

    // =========================================================================
    // LAMPS — independent timers
    // =========================================================================
    let receiverDevLampVisuals = null;
    let shakeLampTO = null;

    function flashShakeLamp(ms = 400){
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.flashShakeLamp === "function") {
        receiverDevLampVisuals.flashShakeLamp(ms);
        return;
      }
      if (devStagingRefs.shakeLamp) devStagingRefs.shakeLamp.classList.add("on");
      if (shakeLampTO) clearTimeout(shakeLampTO);
      shakeLampTO = setTimeout(() => {
        if (devStagingRefs.shakeLamp) devStagingRefs.shakeLamp.classList.remove("on");
        shakeLampTO = null;
      }, ms);
    }

    function forceShakeLampOff(){
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.forceShakeLampOff === "function") {
        receiverDevLampVisuals.forceShakeLampOff();
        return;
      }
      if (shakeLampTO) { clearTimeout(shakeLampTO); shakeLampTO = null; }
      if (devStagingRefs.shakeLamp) devStagingRefs.shakeLamp.classList.remove("on");
    }

    // Direction lamps (flash on sd from phone)
    const dirLampTO = { U:null, D:null, L:null, R:null, F:null, B:null };

    // ✅ NEW: clear any queued timeouts (prevents timer pile-ups / late callbacks)
    function clearDirLampTimers(){
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.clearDirLampTimers === "function") {
        receiverDevLampVisuals.clearDirLampTimers();
        return;
      }
      for (const k in dirLampTO){
        if (dirLampTO[k]) { clearTimeout(dirLampTO[k]); dirLampTO[k] = null; }
      }
    }

    function allDirLampOff(){
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.allDirLampOff === "function") {
        receiverDevLampVisuals.allDirLampOff();
        return;
      }
      if (devStagingRefs.lampUp) devStagingRefs.lampUp.classList.remove("on");
      if (devStagingRefs.lampDown) devStagingRefs.lampDown.classList.remove("on");
      if (devStagingRefs.lampLeft) devStagingRefs.lampLeft.classList.remove("on");
      if (devStagingRefs.lampRight) devStagingRefs.lampRight.classList.remove("on");
      if (devStagingRefs.lampForward) devStagingRefs.lampForward.classList.remove("on");
      if (devStagingRefs.lampBack) devStagingRefs.lampBack.classList.remove("on");
    }

    function flashDirLamp(code, ms=380){
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.flashDirLamp === "function") {
        receiverDevLampVisuals.flashDirLamp(code, ms);
        return;
      }
      const c = String(code || "").trim().toUpperCase();
      if (!c) return;

      const map = {
        U: devStagingRefs.lampUp,
        D: devStagingRefs.lampDown,
        L: devStagingRefs.lampLeft,
        R: devStagingRefs.lampRight,
        F: devStagingRefs.lampForward,
        B: devStagingRefs.lampBack,
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
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.flashDirLampSingle === "function") {
        receiverDevLampVisuals.flashDirLampSingle(code, ms);
        return;
      }
      clearDirLampTimers();
      allDirLampOff();
      flashDirLamp(code, ms);
    }

    // =========================================================================
    // SHAKE THRESHOLD + receiver-side detonation gate
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
      if (receiverDevLampVisuals && typeof receiverDevLampVisuals.flashDirLampPair === "function") {
        receiverDevLampVisuals.flashDirLampPair(a, b, ms);
        return;
      }
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
    let getReceiverStabilityVisualState = null;
    let applyReceiverStabilityLampState = null;
    let receiverStabilityVisualController = null;

    function applyStabilityVisuals(){
      if (receiverStabilityVisualController && typeof receiverStabilityVisualController.apply === "function") {
        receiverStabilityVisualController.apply();
        return;
      }
      const state = (typeof getReceiverStabilityVisualState === "function")
        ? getReceiverStabilityVisualState({
            inputDynamicsSystem,
            stabilityVisualGate,
          })
        : {
            showStable: !!((inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
              ? (inputDynamicsSystem.getState() || {}).stabilityOn
              : false) && !!stabilityVisualGate,
            showVar: !!((inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
              ? (inputDynamicsSystem.getState() || {}).variabilityOn
              : false) && !!stabilityVisualGate,
          };

      if (typeof applyReceiverStabilityLampState === "function") {
        applyReceiverStabilityLampState({
          stableEl: devStagingRefs.dynLampStable,
          varEl: devStagingRefs.dynLampVar,
          state,
        });
        return;
      }

      if (devStagingRefs.dynLampStable) devStagingRefs.dynLampStable.classList.toggle("on", !!state.showStable);
      if (devStagingRefs.dynLampVar) devStagingRefs.dynLampVar.classList.toggle("on", !!state.showVar);
    }

    function isDiversityLampLit(){
      if (receiverStabilityVisualController && typeof receiverStabilityVisualController.isDiversityLampLit === "function") {
        return !!receiverStabilityVisualController.isDiversityLampLit();
      }
      if (typeof getReceiverStabilityVisualState === "function") {
        return !!getReceiverStabilityVisualState({
          inputDynamicsSystem,
          stabilityVisualGate,
        }).diversityLampLit;
      }
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
    let classicShadowPacketCount = 0;
    let classicShadowLastAtMs = 0;
    let classicReceiverTransport = null;
    let classicPairingServiceFactory = null;
    let classicFastPathHostTransportFactory = null;

    async function initClassicReceiverShadowCore(){
      try {
        const [
          ,
          ,
          ,
          stabilityVisualsModule,
          receiverDevLampsModule,
          legacyDevStagingAdapterModule,
        ] = await Promise.all([
          import("./src/runtime-shell/receiver/calibration-engine.js"),
          import("./src/runtime-shell/receiver/signal-processor.js"),
          import("./src/runtime-shell/receiver/motion-store.js"),
          import("./src/runtime-shell/receiver/stability-visuals.js"),
          import("./src/runtime-shell/receiver/dev-lamps.js"),
          import("./src/runtime-shell/staging/dev-staging/create-legacy-dev-staging-adapter.js"),
          import("./src/runtime-shell/session/relay-transport.js"),
          import("./src/runtime-shell/session/pairing-service.js"),
          import("./src/runtime-shell/session/fast-path-transport.js"),
        ]);
        getReceiverStabilityVisualState = stabilityVisualsModule.getReceiverStabilityVisualState || null;
        applyReceiverStabilityLampState = stabilityVisualsModule.applyReceiverStabilityLampState || null;
        receiverStabilityVisualController = (typeof stabilityVisualsModule.createReceiverStabilityVisualController === "function")
          ? stabilityVisualsModule.createReceiverStabilityVisualController({
              getInputDynamicsSystem: () => inputDynamicsSystem,
              getStabilityVisualGate: () => stabilityVisualGate,
              getRefs: () => devStagingRefs,
            })
          : null;
        receiverDevLampVisuals = (typeof receiverDevLampsModule.createReceiverDevLampVisuals === "function")
          ? receiverDevLampsModule.createReceiverDevLampVisuals({
              getRefs: () => devStagingRefs,
            })
          : null;
        createLegacyDevStagingAdapterFactory = legacyDevStagingAdapterModule.createLegacyDevStagingAdapter || null;
        createLegacyDevStagingRefsFactory = legacyDevStagingAdapterModule.createLegacyDevStagingRefsFromElements || null;
        createDevStagingPanelElementsFactory = legacyDevStagingAdapterModule.createDevStagingPanelElements || null;
        const nextLegacyDevStagingView = createBootFallbackDevStagingAdapter();
        if (currentDevStagingView === legacyDevStagingView) {
          legacyDevStagingView = nextLegacyDevStagingView;
          currentDevStagingView = legacyDevStagingView;
          devStagingRefs = currentDevStagingView.refs;
        } else {
          legacyDevStagingView = nextLegacyDevStagingView;
        }
        classicCalibrationSession = (typeof window.createCalibrationSession === "function")
          ? window.createCalibrationSession()
          : null;
        classicSignalProcessor = (typeof window.createSignalProcessor === "function")
          ? window.createSignalProcessor({})
          : null;
        classicMotionStore = (typeof window.createMotionStore === "function")
          ? window.createMotionStore()
          : null;
        classicReceiverTransport = (typeof window.createReceiverTransport === "function")
          ? window.createReceiverTransport({
              workerBase: WORKER_BASE,
              ablyCtor: (typeof Ably !== "undefined" && Ably) ? Ably : null,
            })
          : null;
        classicPairingServiceFactory = (typeof window.createPairingService === "function")
          ? window.createPairingService
          : null;
        classicFastPathHostTransportFactory = (typeof window.createFastPathHostTransport === "function")
          ? window.createFastPathHostTransport
          : null;
        window.__classicReceiverShadowCore = {
          calibrationSession: classicCalibrationSession,
          signalProcessor: classicSignalProcessor,
          motionStore: classicMotionStore,
          receiverTransport: classicReceiverTransport,
          pairingServiceFactory: classicPairingServiceFactory,
          fastPathHostTransportFactory: classicFastPathHostTransportFactory,
          getSnapshot: () => (classicMotionStore && typeof classicMotionStore.getState === "function")
            ? classicMotionStore.getState()
            : null,
          getPacketCount: () => classicShadowPacketCount,
          getLastAtMs: () => classicShadowLastAtMs,
        };
      } catch (e) {
        classicCalibrationSession = null;
        classicSignalProcessor = null;
        classicMotionStore = null;
        classicReceiverTransport = null;
        classicPairingServiceFactory = null;
        classicFastPathHostTransportFactory = null;
        console.warn("Classic receiver shadow core init failed:", e);
      }
    }

    async function initMobileImpulseSystem(){
      try {
        const { createMobileImpulseSystem } = await import("./src/runtime-shell/receiver/mobile-impulse-runtime.js");
        mobileImpulseSystem = createMobileImpulseSystem({
          idleMarkActivity,
          applyDataToUI,
          teleMaybeLog,
          onCalibrated: () => {
            if (classicCalibrationSession) {
              classicCalibrationSession.finishWithAck();
              classicCalibrationSession.consumeAck();
            }
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
        const { createLanSessionSystem } = await import("./src/runtime-shell/session/lan-session.js");
        lanSession = createLanSessionSystem({
          AblyCtor: (typeof Ably !== "undefined" && Ably && Ably.Realtime) ? Ably.Realtime : null,
          AblyNamespace: (typeof Ably !== "undefined") ? Ably : null,
          QRCodeLib: (typeof QRCode !== "undefined") ? QRCode : null,
          pairingServiceFactory: classicPairingServiceFactory,
          fastPathHostTransportFactory: classicFastPathHostTransportFactory,
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

    function formatVec3(value){
      if (!Array.isArray(value) || value.length < 3) return "—";
      return value.map((v) => Number(v).toFixed(2)).join("/");
    }

    function deriveIncomingSpinReadout(raw){
      if (!Array.isArray(raw && raw.spinVector) || raw.spinVector.length < 3) return null;
      const x = Math.max(0, Number(raw.spinVector[0]) || 0);
      const y = Math.max(0, Number(raw.spinVector[1]) || 0);
      const z = Math.max(0, Number(raw.spinVector[2]) || 0);
      const sum = x + y + z;
      if (!(sum > 1e-6)) return null;
      const ranked = [
        { axis: "x", value: x / sum },
        { axis: "y", value: y / sum },
        { axis: "z", value: z / sum },
      ].sort((left, right) => right.value - left.value);
      return {
        axis: ranked[0].axis,
        dominance: ranked[0].value,
        gap: ranked[0].value - (ranked[1] ? ranked[1].value : 0),
      };
    }

    function updateDebugReadout(){
      if (!currentDevStagingView || typeof currentDevStagingView.setDebugNote !== "function") return;
      const raw = lastImpulseSample;
      const state = (classicMotionStore && typeof classicMotionStore.getState === "function")
        ? classicMotionStore.getState()
        : null;
      const incoming = deriveIncomingSpinReadout(raw);
      const spin = state && state.spin ? state.spin : null;
      const canonicalLabel = spin && spin.label ? String(spin.label) : "—";
      const canonicalDom = spin && Number.isFinite(Number(spin.dominance)) ? Number(spin.dominance).toFixed(2) : "—";
      const canonicalGap = spin && Number.isFinite(Number(spin.gap)) ? Number(spin.gap).toFixed(2) : "—";
      const canonicalDir = spin && spin.direction ? String(spin.direction) : "—";
      const incomingLabel = incoming && incoming.axis ? incoming.axis : "—";
      const incomingDom = incoming && Number.isFinite(Number(incoming.dominance)) ? Number(incoming.dominance).toFixed(2) : "—";
      const incomingGap = incoming && Number.isFinite(Number(incoming.gap)) ? Number(incoming.gap).toFixed(2) : "—";
      const spinVector = raw && raw.spinVector ? raw.spinVector : (spin && spin.vector ? spin.vector : null);
      currentDevStagingView.setDebugNote(
        `Spin compare: incoming ${incomingLabel} d${incomingDom} g${incomingGap} | canonical ${canonicalLabel} d${canonicalDom} g${canonicalGap} dir:${canonicalDir} vec:${formatVec3(spinVector)}`
      );
    }

    let DEFAULT_VOICE_ENGINE = "kws";
    let DEFAULT_KWS_BACKEND_KEY = "openwakeword_browser";
    let DEFAULT_KWS_AUTOSTART_RETRY_MS = 2000;
    let DEFAULT_KWS_AUTOSTART_MAX_MS = 120000;
    let DEFAULT_KWS_AUTOSTART_REKICK_MS = 5000;
    let DEFAULT_KWS_START_STALL_MS = 8000;
    let DEFAULT_KWS_LISTEN_POLICY_MODE = "A";
    let DEFAULT_KWS_GATE_TIMEOUT_MS = 1500;
    let STRICT_A_WAKE_WINDOW_PAD_MS = 4000;
    let KWS_READOUT_TICK_MS = 250;
    let KWS_ROW_TOP = [];
    let KWS_ROW_BOTTOM = [];
    let KWS_WAKE_WINDOW_TOKENS = [];
    let KWS_AXIS_TOKENS = [];
    let KWS_WAKE_TOKENS = [];
    let KWS_WAKE_REQUIRED_TOKENS = [];
    let KWS_WORDFLASHBOARD_WORDS = [];
    let KWS_AXIS_WORD_BY_AXIS = Object.freeze({});
    let KWS_LOG_TOKENS = new Set();
    let TEMP_UNGATED_KWS_TOKENS = new Set();
    let KWS_TOKEN_CANONICAL_MAP = Object.freeze({});
    const kwsDebugState = {
      mode: DEFAULT_VOICE_ENGINE,
      backend: DEFAULT_KWS_BACKEND_KEY,
      lastToken: "",
      lastCandidate: "",
    };
    let kwsPanelController = null;
    let kwsRuntimeController = null;
    let kwsListenPolicyController = null;
    let kwsTokenUiState = null;
    let kwsConfigDebugLine = "";
    let teardownKwsRuntimeForReinit = null;
    let kwsBridge = {
      startReadoutTick() {},
      stopReadoutTick() {},
      clearWakeHudGateTimer() {},
      clearAutostartWatchdog() {},
      startAutostartWatchdog() {},
      canonicalToken() { return ""; },
      isWakeWindowActive() { return false; },
      shouldLogHeardWakeword() { return false; },
      resetHeardWakeWindowTokensForAxis() {},
      resetHeardWakeWindowTokensAllAxes() {},
      markHeardWakeWindowToken() {},
      setSelectedSpinWord() {},
      flashToken() {},
      openWakeHudGate() {},
      updateReadout() {},
      pushLogLine() {},
      syncTuneUiFromStatus() {},
    };

    async function teardownKwsForReinit() {
      if (typeof teardownKwsRuntimeForReinit !== "function") return;
      await teardownKwsRuntimeForReinit({
        clearAutostartWatchdog: () => kwsBridge.clearAutostartWatchdog(),
        stopReadoutTick: () => kwsBridge.stopReadoutTick(),
        clearWakeHudGateTimer: () => kwsBridge.clearWakeHudGateTimer(),
        eventBindings: kwsEventBindings,
        kwsListenPolicyController,
        setEventBindings: (next) => { kwsEventBindings = next; },
        setKwsListenPolicyController: (next) => { kwsListenPolicyController = next; },
        voiceProviderManager,
        kwsWordProvider,
        kwsVoiceProvider,
        setVoiceProviderManager: (next) => { voiceProviderManager = next; },
        setKwsWordProvider: (next) => { kwsWordProvider = next; },
        setKwsVoiceProvider: (next) => { kwsVoiceProvider = next; },
      });
    }

    function teleMaybeLog(d){
      if (!kwsPanelController || typeof kwsPanelController.pushPhoneLogLine !== "function" || !d || typeof d !== "object") return;
      const speed = Number.isFinite(Number(d.speed01 ?? d.speed)) ? Number(d.speed01 ?? d.speed).toFixed(3) : "0.000";
      const energy = Number.isFinite(Number(d.energy01 ?? d.energy)) ? Number(d.energy01 ?? d.energy).toFixed(3) : "0.000";
      const groove = Number.isFinite(Number(d.groove01 ?? d.groove)) ? Number(d.groove01 ?? d.groove).toFixed(3) : "0.000";
      const smooth = Number.isFinite(Number(d.smooth01 ?? d.smooth)) ? Number(d.smooth01 ?? d.smooth).toFixed(3) : "0.000";
      const dynamics = Number.isFinite(Number(d.dynamics01 ?? d.orbit01)) ? Number(d.dynamics01 ?? d.orbit01).toFixed(3) : "0.000";
      const shake = Number.isFinite(Number(d.shake01 ?? d.shake)) ? Number(d.shake01 ?? d.shake).toFixed(3) : "0.000";
      const hz = Number.isFinite(Number(d.hz)) ? Number(d.hz).toFixed(2) : "0.00";
      const locked = d.locked ? "1" : "0";
      const spinVector = Array.isArray(d.spinVector) && d.spinVector.length >= 3
        ? d.spinVector.map((v) => Math.max(0, Number(v) || 0))
        : null;
      let spinAxis = "—";
      if (spinVector) {
        const total = spinVector[0] + spinVector[1] + spinVector[2];
        if (total > 1e-6) {
          const ranked = [
            { axis: "x", value: spinVector[0] / total },
            { axis: "y", value: spinVector[1] / total },
            { axis: "z", value: spinVector[2] / total },
          ].sort((left, right) => right.value - left.value);
          spinAxis = ranked[0].axis;
        }
      }
      const spinDirection = (typeof d.spinDirection === "string" && d.spinDirection)
        ? String(d.spinDirection).toLowerCase()
        : "—";
      const spinVectorText = spinVector
        ? spinVector.map((v) => Number(v).toFixed(2)).join("/")
        : "—";
      kwsPanelController.pushPhoneLogLine(
        `PHONE speed:${speed} energy:${energy} groove:${groove} dyn:${dynamics} smooth:${smooth} shake:${shake} locked:${locked} hz:${hz} spin:${spinAxis} dir:${spinDirection} vec:${spinVectorText}`,
        "muted"
      );
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (currentDevStagingView.closeTopmostPopup()) {
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
        }
        return;
      }

      // Debug-only "nirvana" test: enhanced grace + input processing reset.
      if ((e.key === "n" || e.key === "N") && e.shiftKey) {
        executeWordCastAction("float_grace", { payload: { ms: SUPER_GRACE_DEFAULT_MS } });
      }
    });

    function readNumberInputOrNull(el) {
      if (!el) return null;
      const raw = String(el.value == null ? "" : el.value).trim();
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    function refreshKwsMicBtn() {}

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
    let FLOAT_GRACE_DEFAULT_MS = 1000;
    let DOMUS_FLOAT_GRACE_MS = 5000;
    let SUPER_GRACE_DEFAULT_MS = 2500;
    const DOMUS_TELEPORT_ABOVE_GROUND_PX = 300;
    const BUBBLE_SHIELD_DEFAULT_MS = 8000;
    let IMPACT_MODEL = {
      mass: 1.0,
      gravityExp: 0.5,
      // Symmetric around 0:
      // +1 => softer impacts, -1 => harsher/faster impacts.
      dragMirrorScale: 0.5,
    };

    // ===== GAME MVP SYSTEMS (ORB STATE) BEGIN =====
    let mvp = null;
    let eventBus = null;
    let worldSystem = null;
    let orbFxSystem = null;
    let orbSystemsBundle = null;
    let orbRuntimeLoop = null;
    let resourcesSystem = null;
    let voiceProviderManager = null;
    let kwsWordProvider = null;
    let kwsVoiceProvider = null;
    let kwsBackendKey = DEFAULT_KWS_BACKEND_KEY;
    let inputSystem = null;
    let inputGestureSystem = null;
    let inputSystemsBundle = null;
    let orbRuntimeState = null;
    let classicCalibrationSession = null;
    let classicSignalProcessor = null;
    let classicMotionStore = null;
    let lastImpulseSample = null;
    let runtimeWordIndex = Object.create(null);
    let runtimeSpellIndex = runtimeWordIndex;
    let castActionRegistryIndex = Object.create(null);
    let ruleSchema = null;
    let ruleEnginePreviewSystem = null;
    // Early fallback used before runtime modules finish loading.
    let RECEIVER_EVENTS = { EVT_VOICE_SET_MODE: "voice.set_mode" };
    let spellActionHandlers = Object.create(null);
    let spellCastExecutor = null;
    let createSpellActionHandlersModule = null;
    let executeTeleportSpellModule = null;
    let executeAoeElectricSpellModule = null;
    let executeAoeFlameSpellModule = null;
    let executeAoeFrostSpellModule = null;
    let teleportOrbRuntimeToSpawnModule = null;
    let executeShockwaveSpellModule = null;
    let triggerShockwaveRuntimeModule = null;
    let playElectricAoeRuntimeModule = null;
    let playFlameAoeRuntimeModule = null;
    let executeColorizeSpellModule = null;
    let executeBubbleShieldSpellModule = null;
    let executeFloatGraceSpellModule = null;
    let clearFloatGraceRuntimeModule = null;
    let grantFloatGraceRuntimeModule = null;
    let grantSuperGraceRuntimeModule = null;
    let isFloatGraceActiveRuntimeModule = null;
    let buildInputHudViewModelModule = null;
    let runInputFramePipelineModule = null;
    let runOrbRuntimePipelineModule = null;
    const DEFAULT_RULE_ENGINE_SOURCE_READOUT = Object.freeze({
      interactions_adapter: "V2 adapter",
      interactions_adapter_fallback: "V2 adapter (safe fallback)",
      interactions_bootstrap_disabled: "V2 bootstrap disabled (safe disabled)",
      interactions_adapter_missing_builder: "V2 adapter missing builder (safe disabled)",
    });
    let ruleEngineSourceReadout = DEFAULT_RULE_ENGINE_SOURCE_READOUT;
    const RULE_ENGINE_ACTION_EXECUTED_EVENT = "rule_engine.action_executed";
    const RULE_ENGINE_WAKE_WIN_OPENED_EVENT = "rule_engine.wake_win_opened";
    const RULE_ENGINE_PREVIEW_MATCHED_EVENT = "rule_engine.preview_matched";
    const RULE_ENGINE_SOURCE_EVENT_SUMMARY_EVENT = "rule_engine.source_event_summary";
    const RULE_ENGINE_TRIGGER = "rule_engine";
    const RULE_ENGINE_EXECUTE_ACTIONS = true;
    const RULE_CHAIN_TRACE_ENABLED = true;
    let bubbleShieldRuntime = null;
    let shockwaveRuntime = null;
    let orbShatterRuntime = null;
    let flameAoeRuntime = null;
    let electricAoeRuntime = null;
    let vfxRuntimesBundle = null;
    let receiverModulesReady = false;
    let kwsEventBindings = null;
    let buildOrbBaseVisualStateModule = null;
    let applyOrbBaseVisualCssVarsModule = null;
    let createOrbColorRuntimeModule = null;
    let orbColorRuntime = null;
    let createOrbShatterRuntimeControllerModule = null;
    let orbShatterController = null;
    const MODULE_CACHE_BUST_V = "20260330h";

    function axisToColor01(axis){
      const a = String(axis || "").toLowerCase();
      const axisColors = activeGameTheme && activeGameTheme.axisColors;
      if (axisColors && axisColors[a]) return rgb255To01(axisColors[a]);
      if (a === "x") return { r: 0/255, g: 100/255, b: 253/255 };   // #0064fd
      if (a === "z") return { r: 253/255, g: 241/255, b: 0/255 };   // #fdf100
      return { r: 253/255, g: 78/255, b: 0/255 };                   // #fd4e00
    }

    let orbBaseVisualState = null;
    let ORB_FILL_ALPHA = 0.20;
    let ORB_STROKE_DEFAULT = { r: 1.0, g: 1.0, b: 1.0 };
    function rebuildOrbBaseVisualState(theme = activeGameTheme){
      const next = (typeof buildOrbBaseVisualStateModule === "function")
        ? buildOrbBaseVisualStateModule({ theme, physics: PHYS })
        : {
            diameterPx: Math.max(2, Math.round((Number(PHYS && PHYS.orbRadiusPx) || 50) * 2)),
            radiusPx: Math.max(1, Number(PHYS && PHYS.orbRadiusPx) || 50),
            strokeWidthPx: 2,
            strokeDefaultRgb: { r: 255, g: 255, b: 255 },
            strokeDefault01: { r: 1.0, g: 1.0, b: 1.0 },
            fillAlpha: 0.20,
          };
      orbBaseVisualState = next;
      ORB_FILL_ALPHA = clamp01(next.fillAlpha);
      ORB_STROKE_DEFAULT = { ...next.strokeDefault01 };
      if (typeof applyOrbBaseVisualCssVarsModule === "function") {
        applyOrbBaseVisualCssVarsModule(next, { root: document.documentElement });
      }
      if (orbColorRuntime && typeof orbColorRuntime.reset === "function") {
        orbColorRuntime.reset(true);
      }
      return next;
    }

    function updateOrbStrokeColor(dt){
      if (orbColorRuntime && typeof orbColorRuntime.update === "function") {
        orbColorRuntime.update(dt);
      }
    }

    function resetOrbStrokeColor(immediate = false){
      if (orbColorRuntime && typeof orbColorRuntime.reset === "function") {
        orbColorRuntime.reset(immediate);
      }
    }

    function applyColorize(payload = {}){
      if (orbColorRuntime && typeof orbColorRuntime.applyColorize === "function") {
        orbColorRuntime.applyColorize(payload);
      }
    }

    function clearColorize(){
      if (orbColorRuntime && typeof orbColorRuntime.clearColorize === "function") {
        orbColorRuntime.clearColorize();
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
      const fx = mvp.orbDamageVisualsRuntime.getState();
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
      if (orbShatterController && typeof orbShatterController.stopShardSim === "function") {
        orbShatterController.stopShardSim();
        return;
      }
      if (orbShatterRuntime && typeof orbShatterRuntime.clear === "function") orbShatterRuntime.clear();
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

    function castActionForWordId(wordId){
      const id = String(wordId || "").toLowerCase();
      const def = runtimeWordIndex[id] || runtimeSpellIndex[id];
      return def ? String(def.castActionId || "") : "";
    }

    function initWordActionHandlers(){
      if (typeof createSpellActionHandlersModule !== "function") {
        throw new Error("spell-action-handlers module unavailable");
      }
      spellActionHandlers = createSpellActionHandlersModule({
        eventBus,
        playElectricAoe,
        playFlameAoe,
        playFrostAoe: null,
        executeAoeElectric: executeAoeElectricSpellModule,
        executeAoeFlame: executeAoeFlameSpellModule,
        executeAoeFrost: executeAoeFrostSpellModule,
        executeTeleport: executeTeleportSpellModule,
        executeShockwave: executeShockwaveSpellModule,
        executeBubbleShield: executeBubbleShieldSpellModule,
        executeFloatGrace: executeFloatGraceSpellModule,
        executeColorize: executeColorizeSpellModule,
        triggerShockwave,
        teleportOrbToSpawnNeutralizePhysics,
        activateBubbleShield,
        grantSuperGrace,
        applyColorize,
        clearColorize,
        domusTeleportAboveGroundPx: DOMUS_TELEPORT_ABOVE_GROUND_PX,
        bubbleShieldMs: BUBBLE_SHIELD_DEFAULT_MS,
      });
    }

    function executeWordCastAction(castActionId, context = {}){
      if (!receiverModulesReady) return { handled: false, skipped: "not_ready" };
      if (!spellCastExecutor || typeof spellCastExecutor.execute !== "function") {
        throw new Error("spell-cast-executor unavailable");
      }
      return spellCastExecutor.execute(castActionId, context);
    }

    function spawnShardFx(p){
      if (!orbShatterController || typeof orbShatterController.spawnShardFx !== "function") return;
      orbShatterController.spawnShardFx(p);
    }

    async function initMvpSystems(){
      try {
        if (els.rulesReadout) els.rulesReadout.textContent = "boot:init";
        receiverModulesReady = false;
        if (els.rulesReadout) els.rulesReadout.textContent = "boot:teardown";
        await teardownKwsForReinit();
        if (els.rulesReadout) els.rulesReadout.textContent = "boot:imports";
        const {
          receiverBootstrapModule: {
            loadReceiverInitModules,
            hydrateReceiverBootstrapState,
            RULE_ENGINE_SOURCE_READOUT: importedRuleEngineSourceReadout,
          },
          bootstrapKwsStagingModule: {
            bootstrapKwsStaging,
          },
          bootstrapGameStagingRuntimeModule: {
            bootstrapGameStagingRuntime,
          },
          bootstrapStagingRuntimeContextModule: {
            bootstrapStagingRuntimeContext,
          },
          bootstrapStagingMvpModule: {
            bootstrapStagingMvp,
          },
          bindStagingRuntimeEventsModule: {
            bindStagingRuntimeEvents,
          },
          receiverEventsModule,
          kwsPanelControllerModule: { createKwsPanelController },
          kwsRuntimeControllerModule: { createKwsRuntimeController },
          kwsBootOrchestratorModule: { createKwsBootOrchestrator },
          kwsEventBindingsModule: { bindKwsEventHandlers },
          kwsListenPolicyControllerModule: { createKwsListenPolicyController },
          kwsProviderBootstrapModule: { bootstrapKwsVoiceRuntime },
          kwsConfigModule: { createKwsRuntimeConfig },
          kwsMvpCommandsModule: { createKwsMvpCommands },
          kwsReinitTeardownModule: {
            teardownKwsRuntimeForReinit: importedTeardownKwsRuntimeForReinit,
          },
          kwsReceiverBridgeModule: { createKwsReceiverBridge },
          vfxRuntimesBundleModule: { createVfxRuntimesBundle },
          orbRuntimeStateModule: { createOrbRuntimeState },
          orbRuntimeLoopModule: { createOrbRuntimeLoop },
        } = await import(`./src/runtime-shell/staging/load-staging-init-modules.js?v=${MODULE_CACHE_BUST_V}`)
          .then(({ loadStagingInitModules }) => loadStagingInitModules(MODULE_CACHE_BUST_V));
        if (els.rulesReadout) els.rulesReadout.textContent = "boot:imports_ok";
        teardownKwsRuntimeForReinit = importedTeardownKwsRuntimeForReinit;
        if (importedRuleEngineSourceReadout && typeof importedRuleEngineSourceReadout === "object") {
          ruleEngineSourceReadout = importedRuleEngineSourceReadout;
        }
        if (receiverEventsModule && receiverEventsModule.RECEIVER_EVENTS && typeof receiverEventsModule.RECEIVER_EVENTS === "object") {
          RECEIVER_EVENTS = { ...RECEIVER_EVENTS, ...receiverEventsModule.RECEIVER_EVENTS };
        }
        ({
          kwsBridge,
          kwsPanelController,
          kwsTokenUiState,
          kwsRuntimeController,
          kwsBootOrchestrator,
          runtimeConfig: {
            defaultVoiceEngine: DEFAULT_VOICE_ENGINE,
            defaultBackendKey: DEFAULT_KWS_BACKEND_KEY,
            autostartRetryMs: DEFAULT_KWS_AUTOSTART_RETRY_MS,
            autostartMaxMs: DEFAULT_KWS_AUTOSTART_MAX_MS,
            autostartRekickMs: DEFAULT_KWS_AUTOSTART_REKICK_MS,
            startStallMs: DEFAULT_KWS_START_STALL_MS,
            listenPolicyMode: DEFAULT_KWS_LISTEN_POLICY_MODE,
            gateTimeoutMs: DEFAULT_KWS_GATE_TIMEOUT_MS,
            readoutTickMs: KWS_READOUT_TICK_MS,
            rowTop: KWS_ROW_TOP,
            rowBottom: KWS_ROW_BOTTOM,
            wakeWindowTokens: KWS_WAKE_WINDOW_TOKENS,
            axisTokens: KWS_AXIS_TOKENS,
            wakeTokens: KWS_WAKE_TOKENS,
            wakeRequiredTokens: KWS_WAKE_REQUIRED_TOKENS,
            wordFlashboardWords: KWS_WORDFLASHBOARD_WORDS,
            spinWordByAxis: KWS_AXIS_WORD_BY_AXIS,
            logTokens: KWS_LOG_TOKENS,
            tempUngatedTokens: TEMP_UNGATED_KWS_TOKENS,
            tokenCanonicalMap: KWS_TOKEN_CANONICAL_MAP,
            configDebugLine: kwsConfigDebugLine,
          },
        } = bootstrapKwsStaging({
          createKwsRuntimeConfig,
          createKwsReceiverBridge,
          createKwsPanelController,
          createKwsRuntimeController,
          createKwsBootOrchestrator,
          createDevStagingPanelElements,
          getKwsWordProvider: () => kwsWordProvider,
          getKwsVoiceProvider: () => kwsVoiceProvider,
          getMvp: () => mvp,
          readTuneFromUi: () => ({
            inferThreshold: readNumberInputOrNull(els.kwsTokenThrInput),
            inferCooldownMs: readNumberInputOrNull(els.kwsCooldownMsInput),
          }),
          refreshKwsMicBtn,
          readout: {
            setDebugMode: (mode) => { kwsDebugState.mode = String(mode || "kws"); },
            setDebugBackend: (key) => { kwsDebugState.backend = String(key || DEFAULT_KWS_BACKEND_KEY); },
            receiverEvents: RECEIVER_EVENTS,
          },
          runtime: {
            defaultVoiceEngine: DEFAULT_VOICE_ENGINE,
            defaultBackendKey: DEFAULT_KWS_BACKEND_KEY,
            autostartRetryMs: DEFAULT_KWS_AUTOSTART_RETRY_MS,
            autostartMaxMs: DEFAULT_KWS_AUTOSTART_MAX_MS,
            autostartRekickMs: DEFAULT_KWS_AUTOSTART_REKICK_MS,
            startStallMs: DEFAULT_KWS_START_STALL_MS,
            listenPolicyMode: DEFAULT_KWS_LISTEN_POLICY_MODE,
            gateTimeoutMs: DEFAULT_KWS_GATE_TIMEOUT_MS,
            readoutTickMs: KWS_READOUT_TICK_MS,
            rowTop: KWS_ROW_TOP,
            rowBottom: KWS_ROW_BOTTOM,
            wakeWindowTokens: KWS_WAKE_WINDOW_TOKENS,
            axisTokens: KWS_AXIS_TOKENS,
            wakeTokens: KWS_WAKE_TOKENS,
            wakeRequiredTokens: KWS_WAKE_REQUIRED_TOKENS,
            wordFlashboardWords: KWS_WORDFLASHBOARD_WORDS,
            spinWordByAxis: KWS_AXIS_WORD_BY_AXIS,
            logTokens: Array.from(KWS_LOG_TOKENS),
            tempUngatedTokens: Array.from(TEMP_UNGATED_KWS_TOKENS),
            tokenCanonicalMap: KWS_TOKEN_CANONICAL_MAP,
          },
        }));
        kwsDebugState.mode = DEFAULT_VOICE_ENGINE;
        kwsDebugState.backend = DEFAULT_KWS_BACKEND_KEY;
        const mods = await loadReceiverInitModules();
        executeTeleportSpellModule = (typeof mods.executeTeleport === "function")
          ? mods.executeTeleport
          : null;
        executeAoeElectricSpellModule = (typeof mods.executeAoeElectric === "function")
          ? mods.executeAoeElectric
          : null;
        executeAoeFlameSpellModule = (typeof mods.executeAoeFlame === "function")
          ? mods.executeAoeFlame
          : null;
        executeAoeFrostSpellModule = (typeof mods.executeAoeFrost === "function")
          ? mods.executeAoeFrost
          : null;
        teleportOrbRuntimeToSpawnModule = (typeof mods.teleportOrbRuntimeToSpawn === "function")
          ? mods.teleportOrbRuntimeToSpawn
          : null;
        executeShockwaveSpellModule = (typeof mods.executeShockwave === "function")
          ? mods.executeShockwave
          : null;
        triggerShockwaveRuntimeModule = (typeof mods.triggerShockwaveRuntime === "function")
          ? mods.triggerShockwaveRuntime
          : null;
        playElectricAoeRuntimeModule = (typeof mods.playElectricAoeRuntime === "function")
          ? mods.playElectricAoeRuntime
          : null;
        playFlameAoeRuntimeModule = (typeof mods.playFlameAoeRuntime === "function")
          ? mods.playFlameAoeRuntime
          : null;
        executeColorizeSpellModule = (typeof mods.executeColorize === "function")
          ? mods.executeColorize
          : null;
        executeBubbleShieldSpellModule = (typeof mods.executeBubbleShield === "function")
          ? mods.executeBubbleShield
          : null;
        executeFloatGraceSpellModule = (typeof mods.executeFloatGrace === "function")
          ? mods.executeFloatGrace
          : null;
        clearFloatGraceRuntimeModule = (typeof mods.clearFloatGraceRuntime === "function")
          ? mods.clearFloatGraceRuntime
          : null;
        grantFloatGraceRuntimeModule = (typeof mods.grantFloatGraceRuntime === "function")
          ? mods.grantFloatGraceRuntime
          : null;
        grantSuperGraceRuntimeModule = (typeof mods.grantSuperGraceRuntime === "function")
          ? mods.grantSuperGraceRuntime
          : null;
        isFloatGraceActiveRuntimeModule = (typeof mods.isFloatGraceActiveRuntime === "function")
          ? mods.isFloatGraceActiveRuntime
          : null;
        buildOrbBaseVisualStateModule = (typeof mods.buildOrbBaseVisualState === "function")
          ? mods.buildOrbBaseVisualState
          : null;
        applyGameThemeCssVarsModule = (typeof mods.applyGameThemeCssVars === "function")
          ? mods.applyGameThemeCssVars
          : null;
        applyOrbBaseVisualCssVarsModule = (typeof mods.applyOrbBaseVisualCssVars === "function")
          ? mods.applyOrbBaseVisualCssVars
          : null;
        createOrbColorRuntimeModule = (typeof mods.createOrbColorRuntime === "function")
          ? mods.createOrbColorRuntime
          : null;
        createOrbShatterRuntimeControllerModule = (typeof mods.createOrbShatterRuntimeController === "function")
          ? mods.createOrbShatterRuntimeController
          : null;
        orbColorRuntime = (typeof createOrbColorRuntimeModule === "function")
          ? createOrbColorRuntimeModule({
              root: document.documentElement,
              getBaseVisualState: () => orbBaseVisualState,
              clamp01,
              clamp,
            })
          : null;
        rebuildOrbBaseVisualState(activeGameTheme);
        if (els.rulesReadout) els.rulesReadout.textContent = "boot:mods";
        const setRuntimeWordIndexes = (next = {}) => {
          const index = (next.runtimeWordIndex && typeof next.runtimeWordIndex === "object")
            ? next.runtimeWordIndex
            : (next.runtimeSpellIndex && typeof next.runtimeSpellIndex === "object")
            ? next.runtimeSpellIndex
            : Object.create(null);
          runtimeWordIndex = index;
          runtimeSpellIndex = index;
          castActionRegistryIndex = next.castActionRegistryIndex || Object.create(null);
        };
        const receiverBootstrapCtx = {
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
            rebuildOrbBaseVisualState(activeGameTheme);
          },
          getOrbStatusConfig: () => ({ FLOAT_GRACE_DEFAULT_MS, DOMUS_FLOAT_GRACE_MS, SUPER_GRACE_DEFAULT_MS }),
          setOrbStatusConfig: (next = {}) => {
            if (Number.isFinite(Number(next.FLOAT_GRACE_DEFAULT_MS))) FLOAT_GRACE_DEFAULT_MS = Number(next.FLOAT_GRACE_DEFAULT_MS);
            if (Number.isFinite(Number(next.DOMUS_FLOAT_GRACE_MS))) DOMUS_FLOAT_GRACE_MS = Number(next.DOMUS_FLOAT_GRACE_MS);
            if (Number.isFinite(Number(next.SUPER_GRACE_DEFAULT_MS))) SUPER_GRACE_DEFAULT_MS = Number(next.SUPER_GRACE_DEFAULT_MS);
          },
          vfxDefaults: VFX_DEFAULTS,
          getInputConfigs: () => ({ INPUT_GESTURE_CFG, INPUT_DYNAMICS_CFG }),
          setInputConfigs: (next = {}) => {
            if (next.INPUT_GESTURE_CFG) INPUT_GESTURE_CFG = next.INPUT_GESTURE_CFG;
            if (next.INPUT_DYNAMICS_CFG) INPUT_DYNAMICS_CFG = next.INPUT_DYNAMICS_CFG;
          },
          setRuntimeWordIndexes,
          setRuleSchema: (next = {}) => {
            ruleSchema = {
              source: String(next.source || "").trim().toLowerCase() || "unknown",
              signals: Array.isArray(next.signals) ? next.signals.slice() : [],
              windows: Array.isArray(next.windows) ? next.windows.slice() : [],
              events: Array.isArray(next.events) ? next.events.slice() : [],
              rules: Array.isArray(next.rules) ? next.rules.slice() : [],
              debugBootstrap: (next.debugBootstrap && typeof next.debugBootstrap === "object")
                ? { ...next.debugBootstrap }
                : null,
              eventRuntimeBindings: (next.eventRuntimeBindings && typeof next.eventRuntimeBindings === "object")
                ? { ...next.eventRuntimeBindings }
                : Object.create(null),
              execution: (next.execution && typeof next.execution === "object")
                ? { ...next.execution }
                : Object.create(null),
              ruleActionLimitOverrides: (next.ruleActionLimitOverrides && typeof next.ruleActionLimitOverrides === "object")
                ? { ...next.ruleActionLimitOverrides }
                : Object.create(null),
              ruleCooldownScaleOverrides: (next.ruleCooldownScaleOverrides && typeof next.ruleCooldownScaleOverrides === "object")
                ? { ...next.ruleCooldownScaleOverrides }
                : Object.create(null),
              ruleMatchWindowScaleOverrides: (next.ruleMatchWindowScaleOverrides && typeof next.ruleMatchWindowScaleOverrides === "object")
                ? { ...next.ruleMatchWindowScaleOverrides }
                : Object.create(null),
              ruleEmitPreviewMatchedOverrides: (next.ruleEmitPreviewMatchedOverrides && typeof next.ruleEmitPreviewMatchedOverrides === "object")
                ? { ...next.ruleEmitPreviewMatchedOverrides }
                : Object.create(null),
              ruleEmitActionExecutedOverrides: (next.ruleEmitActionExecutedOverrides && typeof next.ruleEmitActionExecutedOverrides === "object")
                ? { ...next.ruleEmitActionExecutedOverrides }
                : Object.create(null),
              ruleEmitSourceEventSummaryOverrides: (next.ruleEmitSourceEventSummaryOverrides && typeof next.ruleEmitSourceEventSummaryOverrides === "object")
                ? { ...next.ruleEmitSourceEventSummaryOverrides }
                : Object.create(null),
              ruleSummaryIncludeSignalAndRuleIdsOverrides: (next.ruleSummaryIncludeSignalAndRuleIdsOverrides && typeof next.ruleSummaryIncludeSignalAndRuleIdsOverrides === "object")
                ? { ...next.ruleSummaryIncludeSignalAndRuleIdsOverrides }
                : Object.create(null),
              ruleSummaryIncludeBudgetCapsOverrides: (next.ruleSummaryIncludeBudgetCapsOverrides && typeof next.ruleSummaryIncludeBudgetCapsOverrides === "object")
                ? { ...next.ruleSummaryIncludeBudgetCapsOverrides }
                : Object.create(null),
              ruleActionExecutedEventTypeEnabledOverrides: (next.ruleActionExecutedEventTypeEnabledOverrides && typeof next.ruleActionExecutedEventTypeEnabledOverrides === "object")
                ? { ...next.ruleActionExecutedEventTypeEnabledOverrides }
                : Object.create(null),
              ruleExecuteActionsOverrides: (next.ruleExecuteActionsOverrides && typeof next.ruleExecuteActionsOverrides === "object")
                ? { ...next.ruleExecuteActionsOverrides }
                : Object.create(null),
              ruleActionTypeEnabledOverrides: (next.ruleActionTypeEnabledOverrides && typeof next.ruleActionTypeEnabledOverrides === "object")
                ? { ...next.ruleActionTypeEnabledOverrides }
                : Object.create(null),
              signalDebounceOverrides: (next.signalDebounceOverrides && typeof next.signalDebounceOverrides === "object")
                ? { ...next.signalDebounceOverrides }
                : Object.create(null),
              signalMaxMatchesOverrides: (next.signalMaxMatchesOverrides && typeof next.signalMaxMatchesOverrides === "object")
                ? { ...next.signalMaxMatchesOverrides }
                : Object.create(null),
              signalEmitPreviewMatchedOverrides: (next.signalEmitPreviewMatchedOverrides && typeof next.signalEmitPreviewMatchedOverrides === "object")
                ? { ...next.signalEmitPreviewMatchedOverrides }
                : Object.create(null),
              signalExecuteActionsOverrides: (next.signalExecuteActionsOverrides && typeof next.signalExecuteActionsOverrides === "object")
                ? { ...next.signalExecuteActionsOverrides }
                : Object.create(null),
              signalEmitActionExecutedOverrides: (next.signalEmitActionExecutedOverrides && typeof next.signalEmitActionExecutedOverrides === "object")
                ? { ...next.signalEmitActionExecutedOverrides }
                : Object.create(null),
              signalEmitSourceEventSummaryOverrides: (next.signalEmitSourceEventSummaryOverrides && typeof next.signalEmitSourceEventSummaryOverrides === "object")
                ? { ...next.signalEmitSourceEventSummaryOverrides }
                : Object.create(null),
              signalSummaryIncludeSignalAndRuleIdsOverrides: (next.signalSummaryIncludeSignalAndRuleIdsOverrides && typeof next.signalSummaryIncludeSignalAndRuleIdsOverrides === "object")
                ? { ...next.signalSummaryIncludeSignalAndRuleIdsOverrides }
                : Object.create(null),
              signalSummaryIncludeBudgetCapsOverrides: (next.signalSummaryIncludeBudgetCapsOverrides && typeof next.signalSummaryIncludeBudgetCapsOverrides === "object")
                ? { ...next.signalSummaryIncludeBudgetCapsOverrides }
                : Object.create(null),
              signalActionExecutedEventTypeEnabledOverrides: (next.signalActionExecutedEventTypeEnabledOverrides && typeof next.signalActionExecutedEventTypeEnabledOverrides === "object")
                ? { ...next.signalActionExecutedEventTypeEnabledOverrides }
                : Object.create(null),
              signalActionTypeEnabledOverrides: (next.signalActionTypeEnabledOverrides && typeof next.signalActionTypeEnabledOverrides === "object")
                ? { ...next.signalActionTypeEnabledOverrides }
                : Object.create(null),
              signalMatchWindowScaleOverrides: (next.signalMatchWindowScaleOverrides && typeof next.signalMatchWindowScaleOverrides === "object")
                ? { ...next.signalMatchWindowScaleOverrides }
                : Object.create(null),
              signalCooldownScaleOverrides: (next.signalCooldownScaleOverrides && typeof next.signalCooldownScaleOverrides === "object")
                ? { ...next.signalCooldownScaleOverrides }
                : Object.create(null),
              signalMaxActionsPerRuleMatchOverrides: (next.signalMaxActionsPerRuleMatchOverrides && typeof next.signalMaxActionsPerRuleMatchOverrides === "object")
                ? { ...next.signalMaxActionsPerRuleMatchOverrides }
                : Object.create(null),
              signalMaxRulesEvaluatedOverrides: (next.signalMaxRulesEvaluatedOverrides && typeof next.signalMaxRulesEvaluatedOverrides === "object")
                ? { ...next.signalMaxRulesEvaluatedOverrides }
                : Object.create(null),
              signalMaxActionsPerEventOverrides: (next.signalMaxActionsPerEventOverrides && typeof next.signalMaxActionsPerEventOverrides === "object")
                ? { ...next.signalMaxActionsPerEventOverrides }
                : Object.create(null),
              signalMaxActionsPerSignalOverrides: (next.signalMaxActionsPerSignalOverrides && typeof next.signalMaxActionsPerSignalOverrides === "object")
                ? { ...next.signalMaxActionsPerSignalOverrides }
                : Object.create(null),
              signalMaxMatchesPerEventOverrides: (next.signalMaxMatchesPerEventOverrides && typeof next.signalMaxMatchesPerEventOverrides === "object")
                ? { ...next.signalMaxMatchesPerEventOverrides }
                : Object.create(null),
              signalMaxSignalsPerEventOverrides: (next.signalMaxSignalsPerEventOverrides && typeof next.signalMaxSignalsPerEventOverrides === "object")
                ? { ...next.signalMaxSignalsPerEventOverrides }
                : Object.create(null),
              signalMaxSignalsEvaluatedPerEventOverrides: (next.signalMaxSignalsEvaluatedPerEventOverrides && typeof next.signalMaxSignalsEvaluatedPerEventOverrides === "object")
                ? { ...next.signalMaxSignalsEvaluatedPerEventOverrides }
                : Object.create(null),
              signalMaxRulesEvaluatedPerEventOverrides: (next.signalMaxRulesEvaluatedPerEventOverrides && typeof next.signalMaxRulesEvaluatedPerEventOverrides === "object")
                ? { ...next.signalMaxRulesEvaluatedPerEventOverrides }
                : Object.create(null),
              signalStopOnFirstSignalMatchPerEventOverrides: (next.signalStopOnFirstSignalMatchPerEventOverrides && typeof next.signalStopOnFirstSignalMatchPerEventOverrides === "object")
                ? { ...next.signalStopOnFirstSignalMatchPerEventOverrides }
                : Object.create(null),
              signalStopOnFirstMatchOverrides: (next.signalStopOnFirstMatchOverrides && typeof next.signalStopOnFirstMatchOverrides === "object")
                ? { ...next.signalStopOnFirstMatchOverrides }
                : Object.create(null),
              sourceEventEnabledOverrides: (next.sourceEventEnabledOverrides && typeof next.sourceEventEnabledOverrides === "object")
                ? { ...next.sourceEventEnabledOverrides }
                : Object.create(null),
              sourceEventDebounceOverrides: (next.sourceEventDebounceOverrides && typeof next.sourceEventDebounceOverrides === "object")
                ? { ...next.sourceEventDebounceOverrides }
                : Object.create(null),
              sourceEventMaxSignalsOverrides: (next.sourceEventMaxSignalsOverrides && typeof next.sourceEventMaxSignalsOverrides === "object")
                ? { ...next.sourceEventMaxSignalsOverrides }
                : Object.create(null),
              sourceEventMaxSignalsEvaluatedPerEventOverrides: (next.sourceEventMaxSignalsEvaluatedPerEventOverrides && typeof next.sourceEventMaxSignalsEvaluatedPerEventOverrides === "object")
                ? { ...next.sourceEventMaxSignalsEvaluatedPerEventOverrides }
                : Object.create(null),
              sourceEventMaxActionsPerSignalOverrides: (next.sourceEventMaxActionsPerSignalOverrides && typeof next.sourceEventMaxActionsPerSignalOverrides === "object")
                ? { ...next.sourceEventMaxActionsPerSignalOverrides }
                : Object.create(null),
              sourceEventMaxRulesEvaluatedOverrides: (next.sourceEventMaxRulesEvaluatedOverrides && typeof next.sourceEventMaxRulesEvaluatedOverrides === "object")
                ? { ...next.sourceEventMaxRulesEvaluatedOverrides }
                : Object.create(null),
              sourceEventMaxRulesEvaluatedPerEventOverrides: (next.sourceEventMaxRulesEvaluatedPerEventOverrides && typeof next.sourceEventMaxRulesEvaluatedPerEventOverrides === "object")
                ? { ...next.sourceEventMaxRulesEvaluatedPerEventOverrides }
                : Object.create(null),
              sourceEventMaxMatchesPerEventOverrides: (next.sourceEventMaxMatchesPerEventOverrides && typeof next.sourceEventMaxMatchesPerEventOverrides === "object")
                ? { ...next.sourceEventMaxMatchesPerEventOverrides }
                : Object.create(null),
              sourceEventMaxActionsPerEventOverrides: (next.sourceEventMaxActionsPerEventOverrides && typeof next.sourceEventMaxActionsPerEventOverrides === "object")
                ? { ...next.sourceEventMaxActionsPerEventOverrides }
                : Object.create(null),
              sourceEventStopOnFirstSignalMatchOverrides: (next.sourceEventStopOnFirstSignalMatchOverrides && typeof next.sourceEventStopOnFirstSignalMatchOverrides === "object")
                ? { ...next.sourceEventStopOnFirstSignalMatchOverrides }
                : Object.create(null),
              sourceEventEmitPreviewMatchedOverrides: (next.sourceEventEmitPreviewMatchedOverrides && typeof next.sourceEventEmitPreviewMatchedOverrides === "object")
                ? { ...next.sourceEventEmitPreviewMatchedOverrides }
                : Object.create(null),
              sourceEventEmitActionExecutedOverrides: (next.sourceEventEmitActionExecutedOverrides && typeof next.sourceEventEmitActionExecutedOverrides === "object")
                ? { ...next.sourceEventEmitActionExecutedOverrides }
                : Object.create(null),
              sourceEventEmitSourceEventSummaryOverrides: (next.sourceEventEmitSourceEventSummaryOverrides && typeof next.sourceEventEmitSourceEventSummaryOverrides === "object")
                ? { ...next.sourceEventEmitSourceEventSummaryOverrides }
                : Object.create(null),
              sourceEventSummaryIncludeSignalAndRuleIdsOverrides: (next.sourceEventSummaryIncludeSignalAndRuleIdsOverrides && typeof next.sourceEventSummaryIncludeSignalAndRuleIdsOverrides === "object")
                ? { ...next.sourceEventSummaryIncludeSignalAndRuleIdsOverrides }
                : Object.create(null),
              sourceEventSummaryIncludeBudgetCapsOverrides: (next.sourceEventSummaryIncludeBudgetCapsOverrides && typeof next.sourceEventSummaryIncludeBudgetCapsOverrides === "object")
                ? { ...next.sourceEventSummaryIncludeBudgetCapsOverrides }
                : Object.create(null),
              sourceEventActionTypeEnabledOverrides: (next.sourceEventActionTypeEnabledOverrides && typeof next.sourceEventActionTypeEnabledOverrides === "object")
                ? { ...next.sourceEventActionTypeEnabledOverrides }
                : Object.create(null),
              sourceEventActionExecutedEventTypeEnabledOverrides: (next.sourceEventActionExecutedEventTypeEnabledOverrides && typeof next.sourceEventActionExecutedEventTypeEnabledOverrides === "object")
                ? { ...next.sourceEventActionExecutedEventTypeEnabledOverrides }
                : Object.create(null),
              sourceEventExecuteActionsOverrides: (next.sourceEventExecuteActionsOverrides && typeof next.sourceEventExecuteActionsOverrides === "object")
                ? { ...next.sourceEventExecuteActionsOverrides }
                : Object.create(null),
              sourceEventCooldownScaleOverrides: (next.sourceEventCooldownScaleOverrides && typeof next.sourceEventCooldownScaleOverrides === "object")
                ? { ...next.sourceEventCooldownScaleOverrides }
                : Object.create(null),
              sourceEventMatchWindowScaleOverrides: (next.sourceEventMatchWindowScaleOverrides && typeof next.sourceEventMatchWindowScaleOverrides === "object")
                ? { ...next.sourceEventMatchWindowScaleOverrides }
                : Object.create(null),
              sourceEventMaxActionsPerRuleMatchOverrides: (next.sourceEventMaxActionsPerRuleMatchOverrides && typeof next.sourceEventMaxActionsPerRuleMatchOverrides === "object")
                ? { ...next.sourceEventMaxActionsPerRuleMatchOverrides }
                : Object.create(null),
              sourceEventStopOnFirstMatchOverrides: (next.sourceEventStopOnFirstMatchOverrides && typeof next.sourceEventStopOnFirstMatchOverrides === "object")
                ? { ...next.sourceEventStopOnFirstMatchOverrides }
                : Object.create(null),
              sourceEventMaxMatchesPerSignalOverrides: (next.sourceEventMaxMatchesPerSignalOverrides && typeof next.sourceEventMaxMatchesPerSignalOverrides === "object")
                ? { ...next.sourceEventMaxMatchesPerSignalOverrides }
                : Object.create(null),
              actionArgOverrides: (next.actionArgOverrides && typeof next.actionArgOverrides === "object")
                ? { ...next.actionArgOverrides }
                : Object.create(null),
            };
            if (els.rulesReadout) {
              const source = String(ruleSchema.source || "unknown");
              const debugBootstrap = (ruleSchema.debugBootstrap && typeof ruleSchema.debugBootstrap === "object")
                ? ruleSchema.debugBootstrap
                : null;
              const builtRules = Number(debugBootstrap && debugBootstrap.buildRules) || 0;
              const builtSignals = Number(debugBootstrap && debugBootstrap.buildSignals) || 0;
              const finalRules = Array.isArray(ruleSchema.rules) ? ruleSchema.rules.length : 0;
              const finalSignals = Array.isArray(ruleSchema.signals) ? ruleSchema.signals.length : 0;
              const stage = String(debugBootstrap && debugBootstrap.stage || "na");
              const fallback = !!(debugBootstrap && debugBootstrap.adapterFallbackUsed);
              els.rulesReadout.textContent =
                `${ruleEngineSourceReadout[source] || source || "unknown"} | build ${builtRules}/${builtSignals} -> live ${finalRules}/${finalSignals} | ${stage}${fallback ? " fallback" : ""}`;
            }
          },
          initWordActionHandlers,
          createSpellCastExecutorContext: () => ({
            castActionRegistryById: castActionRegistryIndex,
            handlers: spellActionHandlers,
            grantFloatGrace,
            floatGraceDefaultMs: FLOAT_GRACE_DEFAULT_MS,
            floatGraceDomusMs: DOMUS_FLOAT_GRACE_MS,
          }),
          setSpellCastExecutor: (executor) => { spellCastExecutor = executor; },
          setReceiverModulesReady: (v) => { receiverModulesReady = !!v; },
        };
        hydrateReceiverBootstrapState(mods, receiverBootstrapCtx);
        if (els.rulesReadout && ruleSchema && ruleSchema.source) {
          els.rulesReadout.textContent = String(ruleSchema.source);
        } else if (els.rulesReadout) {
          els.rulesReadout.textContent = "boot:no_schema";
        }
        ({
          vfxRuntimesBundle,
          bubbleShieldRuntime,
          shockwaveRuntime,
          orbShatterRuntime,
          flameAoeRuntime,
          electricAoeRuntime,
          orbShatterController,
          orbRuntimeState,
          orbRuntimeLoop,
        } = bootstrapGameStagingRuntime({
          createVfxRuntimesBundle,
          createOrbShatterRuntimeController: createOrbShatterRuntimeControllerModule,
          createOrbRuntimeState,
          createOrbRuntimeLoop,
          documentRoot: document.documentElement,
          els,
          orbColorRuntime,
          orbRuntimeFallbackState,
          existingOrbRuntimeLoop: orbRuntimeLoop,
          getOrbRuntime,
          runOrbRuntimePipelineModule,
          PHYS,
          SHIELD_DESCENT,
          mvp,
          orbFxSystem,
          worldSystem,
          getMvp: () => mvp,
          getOrbFxSystem: () => orbFxSystem,
          getWorldSystem: () => worldSystem,
          getPhys: () => PHYS,
          getShieldDescent: () => SHIELD_DESCENT,
          VFX_DEFAULTS,
          SHIELD_FADEIN_MS,
          SHIELD_DECAY_MS,
          FLAME_SHOW_CORE,
          ORB_FILL_ALPHA,
          shieldDecay: {
            setActive: (active) => { shieldDecayActive = active ? 1 : 0; },
          },
          hooks: {
            setVar,
            clamp,
            clamp01,
            evenStroke,
            evenPx,
            rand,
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
        }));
        const {
          createEventBus,
          createGameState,
          createOrbSystem,
          createOrbDamageVisualsRuntime,
          createAudioSystem,
          createInputSystemsBundle,
          createWorldSystem,
          createResourcesSystem,
          createOrbSystemsBundle,
          createOrbFxSystem,
          createVoiceProviderManager,
          createKwsProvider,
          createOpenWakeWordBrowserBackendFactory,
          createSpellDispatchSystem,
          createRuleEnginePreviewSystem,
          WORLD_ITEMS,
        } = mods;
        const createRuleEnginePreviewSystemFactory = createRuleEnginePreviewSystem;
        const worldItemSpawns = Array.isArray(WORLD_ITEMS) ? WORLD_ITEMS : [];

        const runtimeContext = bootstrapStagingRuntimeContext({
          createEventBus,
          createGameState,
          createOrbDamageVisualsRuntime,
          createAudioSystem,
          createInputSystemsBundle,
          createResourcesSystem,
          createSpellDispatchSystem,
          createRuleEnginePreviewSystem: createRuleEnginePreviewSystemFactory,
          createWorldSystem,
          createOrbSystemsBundle,
          createOrbSystem,
          createOrbFxSystem,
          els,
          IMPACT_TH,
          INPUT_DYNAMICS_CFG,
          INPUT_GESTURE_CFG,
          ruleSchema,
          RULE_ENGINE_EXECUTE_ACTIONS,
          DEFAULT_KWS_LISTEN_POLICY_MODE,
          STRICT_A_WAKE_WINDOW_PAD_MS,
          kwsListenPolicyController,
          kwsBridge,
          RULE_CHAIN_TRACE_ENABLED,
          PHYS,
          worldItemSpawns,
          normalizeWorldItemSpawn,
          groundCenterWorld,
          stageRect,
          pickupScreenY,
          getOrbRuntime,
          getOrbScreenY: () => orbScreenY(),
          axisToColor01,
          gestureHooks: {
            isDiversityLampLit,
            flashShakeLamp,
            triggerShockwave,
            forceShakeLampOff,
            clearDirLampTimers,
            allDirLampOff,
            flashDirLampPair,
            flashDirLampSingle,
          },
        });
        eventBus = runtimeContext.eventBus;
        const gameState = runtimeContext.gameState;
        const orbDamageVisualsRuntime = runtimeContext.orbDamageVisualsRuntime;
        const audioSystem = runtimeContext.audioSystem;
        inputSystemsBundle = runtimeContext.inputSystemsBundle;
        inputSystem = runtimeContext.inputSystem;
        inputDynamicsSystem = runtimeContext.inputDynamicsSystem;
        inputGestureSystem = runtimeContext.inputGestureSystem;
        resourcesSystem = runtimeContext.resourcesSystem;
        const spellDispatchSystem = runtimeContext.spellDispatchSystem;
        ruleEnginePreviewSystem = runtimeContext.ruleEnginePreviewSystem;
        worldSystem = runtimeContext.worldSystem;
        orbSystemsBundle = runtimeContext.orbSystemsBundle;
        const orbSystem = runtimeContext.orbSystem;
        orbFxSystem = runtimeContext.orbFxSystem;
        if (kwsEventBindings && typeof kwsEventBindings.dispose === "function") {
          kwsEventBindings.dispose();
        }
        kwsEventBindings = bindKwsEventHandlers({
          eventBus,
          events: RECEIVER_EVENTS,
          state: kwsDebugState,
          deps: {
            canonicalKwsToken: (rawToken) => kwsBridge.canonicalToken(rawToken),
            flashKwsToken: (token, ms) => kwsBridge.flashToken(token, ms),
            isWakeWindowActive: () => kwsBridge.isWakeWindowActive(),
            markHeardWakeWindowToken: (axis, token) => {
              if (kwsPanelController && typeof kwsPanelController.markHeardWakeWindowToken === "function") {
                kwsPanelController.markHeardWakeWindowToken(axis, token);
              }
            },
            getActiveSpinAxis: () => (kwsTokenUiState ? String(kwsTokenUiState.activeSpinAxis || "") : ""),
            openKwsWakeHudGate: (timeoutMs) => kwsBridge.openWakeHudGate(timeoutMs),
            shouldLogHeardWakeword: (rawToken) => kwsBridge.shouldLogHeardWakeword(rawToken),
            pushKwsLogLine: (text, kind) => kwsBridge.pushLogLine(text, kind),
            updateKwsReadout: () => kwsBridge.updateReadout(),
            isUngatedToken: (token) => TEMP_UNGATED_KWS_TOKENS.has(token),
            setActiveSpinAxis: (axis) => {
              if (kwsPanelController && typeof kwsPanelController.setActiveSpinAxis === "function") {
                kwsPanelController.setActiveSpinAxis(axis);
              }
            },
            clearActiveSpinState: () => {
              if (kwsPanelController && typeof kwsPanelController.clearActiveSpinState === "function") {
                kwsPanelController.clearActiveSpinState();
              } else {
                kwsBridge.resetHeardWakeWindowTokensAllAxes();
              }
            },
            resetHeardWakeWindowTokensForAxis: (axis) => kwsBridge.resetHeardWakeWindowTokensForAxis(axis),
            resetHeardWakeWindowTokensAllAxes: () => kwsBridge.resetHeardWakeWindowTokensAllAxes(),
            setSelectedSpinWord: (axis, spinWord) => {
              if (!kwsPanelController) return;
              if (typeof kwsPanelController.setSelectedSpinWord === "function") {
                kwsPanelController.setSelectedSpinWord(axis, spinWord);
              }
            },
            getKwsMode: () => String(kwsDebugState.mode || ""),
            getListenPolicyStatus: () => (
              kwsListenPolicyController && typeof kwsListenPolicyController.getStatus === "function"
                ? kwsListenPolicyController.getStatus()
                : null
            ),
            gateTimeoutMs: DEFAULT_KWS_GATE_TIMEOUT_MS,
          },
        });
        const kwsVoiceRuntime = bootstrapKwsVoiceRuntime({
          eventBus,
          createKwsProvider,
          createVoiceProviderManager,
          createOpenWakeWordBrowserBackendFactory,
          kwsRuntimeController,
          defaultBackendKey: DEFAULT_KWS_BACKEND_KEY,
          defaultVoiceEngine: DEFAULT_VOICE_ENGINE,
          syncKwsTuneUiFromStatus: (status) => kwsBridge.syncTuneUiFromStatus(status),
          refreshKwsMicBtn,
        });
        kwsWordProvider = kwsVoiceRuntime.kwsWordProvider || kwsVoiceRuntime.kwsVoiceProvider || null;
        kwsVoiceProvider = kwsVoiceRuntime.kwsVoiceProvider || kwsVoiceRuntime.kwsWordProvider || null;
        voiceProviderManager = kwsVoiceRuntime.voiceProviderManager;
        kwsBackendKey = kwsVoiceRuntime.kwsBackendKey;
        if (typeof createKwsListenPolicyController === "function") {
          kwsListenPolicyController = createKwsListenPolicyController({
            eventBus,
            kwsRuntimeController,
            initialMode: DEFAULT_KWS_LISTEN_POLICY_MODE,
            nowMs: () => Date.now(),
          });
          if (kwsListenPolicyController && typeof kwsListenPolicyController.start === "function") {
            kwsListenPolicyController.start();
          }
        }
        orbDamageVisualsRuntime.start();
        audioSystem.start();
        inputSystemsBundle.start();
        resourcesSystem.start();
        spellDispatchSystem.start();
        if (ruleEnginePreviewSystem && typeof ruleEnginePreviewSystem.start === "function") {
          ruleEnginePreviewSystem.start();
          if (RULE_CHAIN_TRACE_ENABLED) {
            kwsBridge.pushLogLine("TRACE rule_engine:start", "muted");
          }
        }
        if (orbSystemsBundle && typeof orbSystemsBundle.start === "function") {
          orbSystemsBundle.start();
        }
        if (eventBus && typeof eventBus.on === "function") {
          eventBus.on(RECEIVER_EVENTS.EVT_SPELL_WINDOW_SPIN_OPENED, (payload = {}) => {
            if (!kwsPanelController || typeof kwsPanelController.pushPhoneLogLine !== "function") return;
            const axis = String(payload.axis || "-");
            const atMs = Number(payload.atMs || 0);
            kwsPanelController.pushPhoneLogLine(`TRACE spin_open axis:${axis} at:${Math.round(atMs)}`, "ok");
          });
          eventBus.on(RECEIVER_EVENTS.EVT_SPELL_WINDOW_SPIN_CLOSED, (payload = {}) => {
            if (!kwsPanelController || typeof kwsPanelController.pushPhoneLogLine !== "function") return;
            const axis = String(payload.axis || "-");
            const reason = String(payload.reason || "-");
            const atMs = Number(payload.atMs || 0);
            kwsPanelController.pushPhoneLogLine(`TRACE spin_close axis:${axis} reason:${reason} at:${Math.round(atMs)}`, "muted");
          });
        }
        bindStagingRuntimeEvents({
          eventBus,
          RECEIVER_EVENTS,
          RULE_ENGINE_ACTION_EXECUTED_EVENT,
          RULE_ENGINE_PREVIEW_MATCHED_EVENT,
          RULE_ENGINE_WAKE_WIN_OPENED_EVENT,
          RULE_ENGINE_SOURCE_EVENT_SUMMARY_EVENT,
          RULE_ENGINE_TRIGGER,
          RULE_CHAIN_TRACE_ENABLED,
          DEFAULT_KWS_GATE_TIMEOUT_MS,
          kwsBridge,
          kwsListenPolicyController,
          kwsRuntimeController,
          kwsPanelController,
          kwsTokenUiState,
          TEMP_UNGATED_KWS_TOKENS,
          kwsDebugState,
          ruleSchema,
          runtimeWordIndex,
          runtimeSpellIndex,
          castActionForWordId,
          executeWordCastAction,
          playElectricAoe,
          grantFloatGrace,
          clearFloatGrace,
          renderOrbDamageVisuals,
          spawnShardFx,
          clearOrbRuntimeFxForDeath,
          scheduleDeathOverlay,
          updateDebugReadout,
          orbShatterController,
          stopShardSim,
          worldSystem,
          resetOrbStrokeColor,
          clearDeathOverlaySchedule,
          closeDeathOverlay,
          setOrbInputSuppressed: (next) => { orbInputSuppressed = !!next; },
        });
        const kwsMvpCommands = createKwsMvpCommands({
          kwsRuntimeController,
          kwsListenPolicyController,
          defaultBackendKey: DEFAULT_KWS_BACKEND_KEY,
          getCurrentBackendKey: () => kwsBackendKey,
          setCurrentBackendKey: (next) => { kwsBackendKey = String(next || DEFAULT_KWS_BACKEND_KEY); },
        });
        mvp = bootstrapStagingMvp({
          eventBus,
          gameState,
          orbSystem,
          orbDamageVisualsRuntime,
          audioSystem,
          inputSystemsBundle,
          inputSystem,
          inputDynamicsSystem,
          inputGestureSystem,
          orbRuntimeState,
          ruleSchema,
          ruleEnginePreviewSystem,
          RULE_ENGINE_EXECUTE_ACTIONS,
          resourcesSystem,
          orbFxSystem,
          orbSystemsBundle,
          orbRuntimeLoop,
          spellDispatchSystem,
          kwsWordProvider,
          voiceProviderManager,
          kwsVoiceProvider,
          kwsMvpCommands,
          kwsBootOrchestrator,
          grantFloatGrace,
          grantSuperGrace,
          orbShatterRuntime,
          worldSystem,
          clearDeathOverlaySchedule,
          closeDeathOverlay,
          renderOrbDamageVisuals,
          updateDebugReadout,
          setOrbInputSuppressed: (next) => { orbInputSuppressed = !!next; },
        });
      } catch (e) {
        try {
          await teardownKwsForReinit();
        } catch (_) {}
        receiverModulesReady = false;
        console.warn("MVP systems init failed:", e);
        const detail = e && e.message ? String(e.message) : String(e || "unknown_error");
        fatal(`Launch failed: ${detail}`);
        if (els.rulesReadout) {
          const short = detail.length > 72 ? `${detail.slice(0, 72)}...` : detail;
          els.rulesReadout.textContent = `boot:fail ${short}`;
        }
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
      if (typeof teleportOrbRuntimeToSpawnModule === "function") {
        const result = teleportOrbRuntimeToSpawnModule({
          patchOrbRuntime,
          applyOrbTransform,
          worldSystem,
          groundCenterWorld,
          phys: PHYS,
          aboveGroundPx,
          nowMs: performance.now(),
          updateDebugReadout,
        });
        if (result && result.handled) return;
      }
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
      if (typeof clearFloatGraceRuntimeModule === "function") {
        clearFloatGraceRuntimeModule({ patchOrbRuntime });
        return;
      }
      patchOrbRuntime({
        floatGraceActive: false,
        floatGraceUntilMs: 0,
      });
    }

    function grantFloatGrace(ms = FLOAT_GRACE_DEFAULT_MS){
      if (typeof grantFloatGraceRuntimeModule === "function") {
        grantFloatGraceRuntimeModule({
          patchOrbRuntime,
          getOrbRuntime,
          durationMs: ms,
          defaultMs: FLOAT_GRACE_DEFAULT_MS,
          nowMs: performance.now(),
        });
        return;
      }
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
      if (typeof grantSuperGraceRuntimeModule === "function") {
        grantSuperGraceRuntimeModule({
          resetInputProcessingState,
          grantFloatGrace,
          durationMs: ms,
          defaultMs: SUPER_GRACE_DEFAULT_MS,
          nowMs: performance.now(),
        });
        return;
      }
      const now = performance.now();
      resetInputProcessingState(now);
      grantFloatGrace(ms);
    }

    function isFloatGraceActive(nowMs){
      if (typeof isFloatGraceActiveRuntimeModule === "function") {
        return !!isFloatGraceActiveRuntimeModule({
          getOrbRuntime,
          clearFloatGrace,
          nowMs,
        });
      }
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
        stroke: cfg.stroke || themeAccentRgba(0.95),
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
        stroke: themeAccentRgba(0.95),
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
        ctx.shadowColor = themeAccentRgba(0.28);
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
      drawWorldBackdrop();
    });

    window.addEventListener("resize", () => {
      resetOrbToGround();
      if (worldSystem) worldSystem.render(performance.now());
      starResize(true);
      drawStars();
      drawWorldBackdrop();
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

    function clearOrbRuntimeFxForDeath(){
      // Stop all residual orb/VFX/audio state so death is a clean reset.
      if (mobileImpulseSystem) mobileImpulseSystem.resetFrameQueue();

      forceShakeLampOff();
      clearDirLampTimers();
      allDirLampOff();

      clearShock();
      clearFlame();
      clearElectric();
      shieldOffNow();
      resetOrbStrokeColor(true);

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

      currentDevStagingView.resetMeters();

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

    function bindCalibrationButton(){
      if (!els.calibBtn) return;
      els.calibBtn.onclick = () => {
        const canCalib = mobileImpulseSystem ? mobileImpulseSystem.isCalibAvailable() : calibAvailable;
        if (!canCalib) return;
        if (calibInFlight) return;
        if (classicCalibrationSession) {
          const started = classicCalibrationSession.requestStart(canCalib, performance.now());
          if (!started) return;
        }
        const ok = sendCalibrationTrigger();
        if (!ok) {
          if (classicCalibrationSession) classicCalibrationSession.cancel();
          return;
        }
        calibInFlight = true;
        els.calibBtn.disabled = true;
        setCalibStatus("Calibrating… (2s)");
      };
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

    function getClassicShadowHudViewModel(){
      if (!classicMotionStore || typeof classicMotionStore.getState !== "function") return null;
      const state = classicMotionStore.getState();
      if (!state || !state.motion) return null;
      const motion = state.motion;
      const energyUI01 = clamp01(motion.energy01);
      return {
        lift: Number(motion.lift01) || 0,
        groove: Number(motion.groove01) || 0,
        smooth: Number(motion.smooth01) || 0,
        speed: Number(motion.speed01) || 0,
        dynamics: Number(motion.dynamics01) || 0,
        energyUI01,
        liftP: Math.round(clamp01(motion.lift01) * 100),
        gP: Math.round(clamp01(motion.groove01) * 100),
        sP: Math.round(clamp01(motion.smooth01) * 100),
        sp: Math.round(clamp01(motion.speed01) * 100),
        dP: Math.round(clamp01(motion.dynamics01) * 100),
        ePts: Math.round(energyUI01 * 100),
        shakeMeter: Number(motion.shakeMeter01) || 0,
        sh: Number(motion.shakeDisplayValue) || 0,
        locked: !!motion.locked,
        over: false,
      };
    }

    function hasClassicShadowHudViewModel(){
      return !!getClassicShadowHudViewModel();
    }

    function applyClassicSpinToPayload(raw){
      if (!classicMotionStore || typeof classicMotionStore.getState !== "function") return raw;
      const state = classicMotionStore.getState();
      if (!state || !state.spin) return raw;
      return {
        ...(raw || {}),
        spinVector: state.spin.vector,
        spinAxisDominance: state.spin.dominance,
        spinAxisGap: state.spin.gap,
        spinAxisLabel: state.spin.label,
        spinDirection: state.spin.direction,
      };
    }

    function applyClassicShadowOrbRuntimeState(){
      if (!classicMotionStore || typeof classicMotionStore.getState !== "function") return;
      const state = classicMotionStore.getState();
      if (!state || !state.motion) return;
      patchOrbRuntime({
        lift01: Number(state.motion.lift01) || 0,
        dynamics01: Number(state.motion.dynamics01) || 0,
      });
    }

    function renderInputHud(vm){
      const nextVm = getClassicShadowHudViewModel() || vm;
      if (!nextVm) return;
      currentDevStagingView.renderInputHud(nextVm);

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
        skipPhysStatePatch: !!classicMotionStore,
        skipLegacyHudFields: !!classicMotionStore,
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
          computeLift01,
          setStabilityVisualGate: (v) => { stabilityVisualGate = !!v; },
          applyStabilityVisuals,
          processShakeDoubleBang,
        },
      });
    }

    function applyDataToUI(d){
      lastImpulseSample = d;
      if (classicSignalProcessor && classicMotionStore) {
        try {
          if (classicCalibrationSession && classicCalibrationSession.state && classicCalibrationSession.state.active) {
            classicCalibrationSession.addSample(d);
          }
          const classicState = classicSignalProcessor.processPacket(d, performance.now(), {
            suppressShake: !!orbInputSuppressed,
          });
          classicMotionStore.publish(classicState);
          classicShadowPacketCount += 1;
          classicShadowLastAtMs = Number(classicState && classicState.receivedAtMs) || performance.now();
        } catch (e) {
          console.warn("Classic receiver shadow process failed:", e);
        }
      }
      if (!receiverModulesReady) return;
      const nowMs = performance.now();
      const inputPayload = applyClassicSpinToPayload(d);
      const processed = processInputFrame(inputPayload, nowMs);
      applyClassicShadowOrbRuntimeState();
      const vm = hasClassicShadowHudViewModel() ? null : buildInputHudViewModel(processed);
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

      if (classicReceiverTransport && typeof classicReceiverTransport.disconnect === "function") {
        classicReceiverTransport.disconnect();
      }

      const roomCode = stripOrbPrefix(roomChannel);
      const authUrl = WORKER_BASE + "/token?room=" + encodeURIComponent(roomCode) + "&v=" + Date.now();
      bindCalibrationButton();

      if (classicReceiverTransport && typeof classicReceiverTransport.connect === "function") {
        const connected = classicReceiverTransport.connect({
          roomChannel,
          onConnectionConnected: () => setStatus(`Connected ✓ <span class="dim">(${roomChannel})</span>`, "ok"),
          onConnectionFailed: (st) => { console.error("Ably failed:", st); setStatus("FAILED — see console", "bad"); },
          onConnectionDisconnected: () => setStatus("Disconnected <span class=\"dim\">(refresh page)</span>", "bad"),
          onAttached: (err) => {
            if (err) {
              console.error("Channel attach failed:", err);
              setStatus("Channel attach FAILED — see console", "bad");
              return;
            }
            setStatus(`Connected ✓ (listening…) <span class="dim">(${roomChannel})</span>`, "ok");
            idleStartTimers();
          },
          onMessage: (d) => {
            if (lanSession && lanSession.shouldIgnoreAblyImpulses()) return;
            if (els.pairModal.classList.contains("on")) closePairModal();
            if (els.startScreen && !els.startScreen.classList.contains("off")) hideStartScreen();
            handleIncomingImpulse(d);
          },
        });
        realtime = connected ? connected.realtime : null;
        channel = connected ? connected.channel : null;
        connecting = false;
        return;
      }

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
        const d = (msg && msg.data) ? msg.data : {};

        if (lanSession && lanSession.shouldIgnoreAblyImpulses()) return;

        if (LAST_MESSAGE_ON) {
          let s = "";
          try { s = JSON.stringify(d); } catch(_) { s = String(d); }
          if (s.length > 240) s = s.slice(0, 240) + " …";
          const sh = (d && d.shakeHit) ? "shakeHit:1 " : "shakeHit:0 ";
          const spinVector = (d && Array.isArray(d.spinVector) && d.spinVector.length >= 3)
            ? `spinVector:${d.spinVector.map(v => Number(v).toFixed(2)).join(",")} `
            : "spinVector:— ";
          const spinDir = (d && typeof d.spinDirection === "string")
            ? `spinDir:${String(d.spinDirection)} `
            : "spinDir:— ";
          const dbg = (d && (d.calibOK != null || d.omegaOK != null))
            ? `calibOK:${Number(d.calibOK)||0} omegaOK:${Number(d.omegaOK)||0} `
            : "calibOK:— omegaOK:— ";
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
      await launchLanPairingFlow(true);
    });

    if (els.tryAgainBtn) {
      els.tryAgainBtn.addEventListener("click", async () => {
        if (!mvp || !mvp.orbSystem || !mvp.gameState) return;
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
      await maybeMountDevStagingSurface();
      await initClassicReceiverShadowCore();
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
