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
    // Flame AOE (ported from VFX lab)
    // =========================================================================
    let flameRAF = 0;
    let flameSvg = null;
    let flameCore = null;
    const flameTendrils = [];
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

    function polarPoint(cx, cy, angle, r){
      return { x: cx + (Math.cos(angle) * r), y: cy + (Math.sin(angle) * r) };
    }

    function toWorld(base, fwd, nrm, along, lateral){
      return {
        x: base.x + (fwd.x * along) + (nrm.x * lateral),
        y: base.y + (fwd.y * along) + (nrm.y * lateral),
      };
    }

    function smoothQuadPath(points){
      if (!points || points.length < 2) return "";
      let d = `M ${points[0].x.toFixed(4)} ${points[0].y.toFixed(4)}`;
      for (let i = 1; i < points.length - 1; i++){
        const p = points[i];
        const n = points[i + 1];
        const mx = (p.x + n.x) * 0.5;
        const my = (p.y + n.y) * 0.5;
        d += ` Q ${p.x.toFixed(4)} ${p.y.toFixed(4)} ${mx.toFixed(4)} ${my.toFixed(4)}`;
      }
      const last = points[points.length - 1];
      d += ` T ${last.x.toFixed(4)} ${last.y.toFixed(4)}`;
      return d;
    }

    function clearFlame(){
      if (flameRAF) cancelAnimationFrame(flameRAF);
      flameRAF = 0;
      flameTendrils.length = 0;
      flameCore = null;
      if (flameSvg && flameSvg.parentNode) flameSvg.parentNode.removeChild(flameSvg);
      flameSvg = null;
    }

    function buildFlameAOE(cfg){
      const pad = 180;
      const size = evenPx(cfg.diameter + pad, 2, 4096);
      const cx = size * 0.5;
      const cy = size * 0.5;
      const radius = cfg.diameter * 0.5;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "flameSvg");
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
      svg.setAttribute("shape-rendering", "geometricPrecision");
      svg.__cx = cx;
      svg.__cy = cy;
      svg.__r = radius;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("fill", "rgba(255, 96, 24, 0.30)");
      group.setAttribute("stroke", "var(--flame-stroke)");
      group.setAttribute("stroke-width", "2");
      group.setAttribute("stroke-linecap", "round");
      group.setAttribute("stroke-linejoin", "round");

      const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      core.setAttribute("cx", String(cx));
      core.setAttribute("cy", String(cy));
      core.setAttribute("r", String(radius.toFixed(2)));
      core.setAttribute("fill", "var(--flame-fill)");
      core.setAttribute("stroke", "var(--flame-stroke)");
      core.setAttribute("stroke-width", "6");
      core.setAttribute("opacity", "1");

      const tendrilCount = 28;
      for (let i = 0; i < tendrilCount; i++){
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const step = (Math.PI * 2) / tendrilCount;
        const ang = step * i;
        const baseLen = radius * 0.20;
        const baseAmp = radius * 0.11;
        const baseWidth = radius * 0.23;
        const lenScale = (i % 2 === 0) ? 2.25 : 1.0;
        const lateralFlip = (i % 2 === 0) ? 1 : -1;
        p.setAttribute("opacity", "0.95");
        group.appendChild(p);
        flameTendrils.push({
          path: p,
          ang,
          baseLen,
          baseAmp,
          baseWidth,
          lenScale,
          lateralFlip,
        });
      }

      if (FLAME_SHOW_CORE) svg.appendChild(core);
      svg.appendChild(group);
      flameSvg = svg;
      flameCore = core;
    }

    function playFlameAoe(){
      if (!els.flameLayer) return;
      clearFlame();

      const cfg = {
        diameter: evenPx(clamp(VFX_DEFAULTS.flame.diameter, 120, 900), 2, 2000),
        durationMs: Math.max(200, Number(VFX_DEFAULTS.flame.durationMs) || 10000),
      };
      buildFlameAOE(cfg);
      els.flameLayer.appendChild(flameSvg);

      const start = performance.now();
      const cx = flameSvg.__cx;
      const cy = flameSvg.__cy;
      const radius = flameSvg.__r;

      function renderFrame(elapsed){
        const t01 = Math.max(0, Math.min(1, elapsed / cfg.durationMs));
        const life = 1 - t01;
        const innerR = radius + 2;

        if (FLAME_SHOW_CORE && flameCore){
          const coreScale = 1 + (Math.sin(elapsed * 0.0032) * 0.008);
          flameCore.setAttribute("r", (radius * coreScale).toFixed(2));
          flameCore.setAttribute("opacity", (0.92 + (Math.sin(elapsed * 0.0045) * 0.08) * life).toFixed(3));
        }

        for (let i = 0; i < flameTendrils.length; i++){
          const t = flameTendrils[i];
          const motionTime = elapsed * 6;
          const dirBase = t.ang;
          const len = Math.max(16, (t.baseLen * t.lenScale));
          const amp = Math.max(4, t.baseAmp);
          const widthBase = Math.max(10, t.baseWidth);
          const tipWidth = Math.max(0.8, widthBase * 0.05);
          const wigglePhase = motionTime * 0.0086;

          const baseCenter = polarPoint(cx, cy, dirBase, innerR);
          const fwd = { x: Math.cos(dirBase), y: Math.sin(dirBase) };
          const nrm = { x: -Math.sin(dirBase), y: Math.cos(dirBase) };

          const samples = 9;
          const left = [];
          const right = [];

          for (let s = 0; s < samples; s++){
            const u = s / (samples - 1);
            const along = len * u;
            const envelope = Math.sin(Math.PI * u);
            const lateral = Math.sin((u * Math.PI * 2) + wigglePhase) * amp * envelope * t.lateralFlip;
            const taper = Math.pow(1 - u, 1.85);
            const bloat = Math.sin(Math.PI * u) * (1 - (u * 0.35));
            const width = tipWidth
              + ((widthBase - tipWidth) * taper)
              + (widthBase * 0.12 * bloat);
            const c = toWorld(baseCenter, fwd, nrm, along, lateral);
            left.push(toWorld(c, fwd, nrm, 0, width * 0.5));
            right.push(toWorld(c, fwd, nrm, 0, -width * 0.5));
          }

          const baseHalf = widthBase * 0.5;
          const aEdge = Math.min(0.55, Math.asin(Math.min(0.999, baseHalf / Math.max(1, innerR))));
          const leftBase = polarPoint(cx, cy, dirBase + aEdge, innerR);
          const rightBase = polarPoint(cx, cy, dirBase - aEdge, innerR);
          left[0] = leftBase;
          right[0] = rightBase;

          const leftD = smoothQuadPath(left);
          const rightBack = right.slice().reverse();
          const rightD = smoothQuadPath(rightBack).replace(/^M [^QTLCAZ]+/, "");
          const d = [
            leftD,
            rightD,
            `A ${innerR.toFixed(4)} ${innerR.toFixed(4)} 0 0 1 ${leftBase.x.toFixed(4)} ${leftBase.y.toFixed(4)}`,
            "Z",
          ].join(" ");

          t.path.setAttribute("d", d);
          t.path.setAttribute("opacity", (0.70 + (0.30 * life)).toFixed(3));
        }
      }

      function tick(now){
        const elapsed = now - start;
        renderFrame(elapsed);
        if (elapsed >= cfg.durationMs){
          clearFlame();
          return;
        }
        flameRAF = requestAnimationFrame(tick);
      }

      flameRAF = requestAnimationFrame(tick);
    }

    // =========================================================================
    // Electric AOE (ported from VFX lab)
    // =========================================================================
    let electricRAF = 0;
    let electricCanvas = null;
    let electricCtx = null;
    let electricParticles = [];
    let electricNodes = [];
    let electricConfig = null;
    let electricEndAt = 0;

    function electricDistSq(x1, y1, x2, y2){
      const dx = x2 - x1;
      const dy = y2 - y1;
      return (dx * dx) + (dy * dy);
    }

    function clearElectric(){
      if (electricRAF) cancelAnimationFrame(electricRAF);
      electricRAF = 0;
      electricParticles = [];
      electricNodes = [];
      electricConfig = null;
      electricEndAt = 0;
      electricCtx = null;
      if (electricCanvas && electricCanvas.parentNode){
        electricCanvas.parentNode.removeChild(electricCanvas);
      }
      electricCanvas = null;
    }

    function buildElectricCanvas(cfg){
      const size = evenPx((cfg.endR * 2) + 24, 2, 4096);
      const canvas = document.createElement("canvas");
      canvas.className = "electricCanvas";
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      electricCanvas = canvas;
      electricCtx = ctx;
      electricConfig = {
        size,
        cx: size * 0.5,
        cy: size * 0.5,
        startR: cfg.startR,
        endR: cfg.endR,
        durationMs: cfg.durationMs,
        maxBoltJumpSq: cfg.maxBoltJumpSq,
        particleCount: cfg.particleCount,
        nodeCount: cfg.nodeCount,
        particleSpeed: cfg.particleSpeed,
        startJitterRatio: cfg.startJitterRatio,
      };
    }

    function initElectricParticles(){
      const cfg = electricConfig;
      electricParticles = [];
      for (let i = 0; i < cfg.particleCount; i++){
        const a = rand(0, Math.PI * 2);
        const u = Math.random();
        const r = Math.sqrt((u * ((cfg.endR * cfg.endR) - (cfg.startR * cfg.startR))) + (cfg.startR * cfg.startR));
        const x = cfg.cx + (Math.cos(a) * r);
        const y = cfg.cy + (Math.sin(a) * r);
        const vA = rand(0, Math.PI * 2);
        electricParticles.push({
          x, y,
          vx: Math.cos(vA) * cfg.particleSpeed,
          vy: Math.sin(vA) * cfg.particleSpeed,
        });
      }
    }

    function initElectricNodes(){
      const cfg = electricConfig;
      electricNodes = [];
      for (let i = 0; i < cfg.nodeCount; i++){
        const angle = rand(0, Math.PI * 2);
        const startJitterPx = rand(-(cfg.startR * cfg.startJitterRatio), (cfg.startR * cfg.startJitterRatio));
        const emitR = clamp(cfg.startR + startJitterPx, 2, cfg.endR - 2);
        electricNodes.push({
          angle,
          spin: rand(-0.06, 0.06),
          startJitterPx,
          emitR,
          x: cfg.cx + (Math.cos(angle) * emitR),
          y: cfg.cy + (Math.sin(angle) * emitR),
        });
      }
    }

    function updateElectricNodes(){
      const cfg = electricConfig;
      for (let i = 0; i < electricNodes.length; i++){
        const n = electricNodes[i];
        n.emitR = clamp(cfg.startR + n.startJitterPx, 2, cfg.endR - 2);
        n.x = cfg.cx + (Math.cos(n.angle) * n.emitR);
        n.y = cfg.cy + (Math.sin(n.angle) * n.emitR);
        n.angle += n.spin;
        n.spin += rand(-0.004, 0.004);
        n.spin = clamp(n.spin, -0.1, 0.1);
      }
    }

    function updateElectricParticles(){
      const cfg = electricConfig;
      for (let i = 0; i < electricParticles.length; i++){
        const p = electricParticles[i];
        p.x += p.vx;
        p.y += p.vy;

        const dx = p.x - cfg.cx;
        const dy = p.y - cfg.cy;
        const d = Math.sqrt((dx * dx) + (dy * dy)) || 1;
        if (d > cfg.endR || d < cfg.startR){
          p.vx *= -1;
          p.vy *= -1;
          const clampedR = clamp(d, cfg.startR + 0.5, cfg.endR - 0.5);
          p.x = cfg.cx + ((dx / d) * clampedR);
          p.y = cfg.cy + ((dy / d) * clampedR);
        }
      }
    }

    function drawElectricBolt(node){
      const cfg = electricConfig;
      const ctx = electricCtx;
      let px = node.x;
      let py = node.y;
      let oldPx = px;
      let oldPy = py;
      let lastEdgeDist = node.emitR;

      for (let hops = 0; hops < 18; hops++){
        let found = false;
        let lowestDistSq = Number.POSITIVE_INFINITY;
        let next = null;
        let nextEdgeDist = 0;

        for (let i = 0; i < electricParticles.length; i++){
          const p = electricParticles[i];
          const distSq = electricDistSq(px, py, p.x, p.y);
          if (distSq >= lowestDistSq) continue;
          if (distSq > cfg.maxBoltJumpSq || distSq < 20) continue;

          const cdx = p.x - cfg.cx;
          const cdy = p.y - cfg.cy;
          const edgeDist = Math.sqrt((cdx * cdx) + (cdy * cdy));
          if (edgeDist <= lastEdgeDist) continue;
          if (edgeDist > cfg.endR) continue;

          lowestDistSq = distSq;
          next = p;
          nextEdgeDist = edgeDist;
          found = true;
        }

        if (!found || !next) break;
        px = next.x;
        py = next.y;
        lastEdgeDist = nextEdgeDist;

        const xc = (oldPx + px) * 0.5;
        const yc = (oldPy + py) * 0.5;
        ctx.quadraticCurveTo(oldPx, oldPy, xc, yc);
        oldPx = px;
        oldPy = py;
      }
    }

    function drawElectricFrame(){
      const cfg = electricConfig;
      const ctx = electricCtx;
      ctx.clearRect(0, 0, cfg.size, cfg.size);

      const ring = ctx.createRadialGradient(cfg.cx, cfg.cy, cfg.startR, cfg.cx, cfg.cy, cfg.endR);
      ring.addColorStop(0, "rgba(255, 250, 180, 0.82)");
      ring.addColorStop(0.6, "rgba(255, 235, 95, 0.55)");
      ring.addColorStop(1, "rgba(255, 220, 64, 0.12)");
      ctx.strokeStyle = ring;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255, 225, 90, 1)";
      ctx.shadowBlur = 30;

      ctx.beginPath();
      for (let i = 0; i < electricNodes.length; i++){
        const n = electricNodes[i];
        ctx.moveTo(n.x, n.y);
        drawElectricBolt(n);
      }
      ctx.stroke();
      ctx.closePath();
      ctx.shadowBlur = 0;
    }

    function tickElectric(now){
      updateElectricNodes();
      updateElectricParticles();
      drawElectricFrame();
      if (now >= electricEndAt){
        clearElectric();
        return;
      }
      electricRAF = requestAnimationFrame(tickElectric);
    }

    function playElectricAoe(){
      if (!els.electricLayer) return;
      clearElectric();

      const cfg = {
        startR: Math.round(clamp(VFX_DEFAULTS.electric.startR, 2, 500)),
        endR: Math.round(clamp(VFX_DEFAULTS.electric.endR, 8, 1000)),
        durationMs: Math.max(200, Number(VFX_DEFAULTS.electric.durationMs) || 10000),
        nodeCount: Math.max(1, Math.round(Number(VFX_DEFAULTS.electric.nodeCount) || 13)),
        particleCount: Math.max(50, Math.round(Number(VFX_DEFAULTS.electric.particleCount) || 340)),
        particleSpeed: Math.max(0.05, Number(VFX_DEFAULTS.electric.particleSpeed) || 0.62),
        maxBoltJumpSq: Math.max(100, Number(VFX_DEFAULTS.electric.maxBoltJumpSq) || 1200),
        startJitterRatio: clamp(Number(VFX_DEFAULTS.electric.startJitterRatio) || 0.30, 0, 1),
      };
      if (cfg.endR <= cfg.startR + 4) cfg.endR = cfg.startR + 4;

      buildElectricCanvas(cfg);
      initElectricParticles();
      initElectricNodes();
      els.electricLayer.appendChild(electricCanvas);

      electricEndAt = performance.now() + electricConfig.durationMs;
      electricRAF = requestAnimationFrame(tickElectric);
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
    let resourcesSystem = null;
    let inputSystem = null;
    let inputGestureSystem = null;
    let inputSystemsBundle = null;
    let runtimeSpellIndex = Object.create(null);
    let castActionRegistryIndex = Object.create(null);
    let spellActionHandlers = Object.create(null);
    let spellCastExecutor = null;
    let createSpellActionHandlersModule = null;
    let buildInputHudViewModelModule = null;
    let runInputFramePipelineModule = null;
    let runOrbRuntimePipelineModule = null;
    let mvpShardRaf = 0;
    let mvpShardLastTs = 0;
    let mvpShards = [];
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

    function castActionMetaForId(castActionId){
      const id = String(castActionId || "").toLowerCase();
      return castActionRegistryIndex[id] || null;
    }

    function initSpellActionHandlers(){
      if (typeof createSpellActionHandlersModule === "function") {
        spellActionHandlers = createSpellActionHandlersModule({
          playElectricAoe,
          playFlameAoe,
          teleportOrbToSpawnNeutralizePhysics,
          activateSanctusShield,
          domusTeleportAboveGroundPx: DOMUS_TELEPORT_ABOVE_GROUND_PX,
          sanctusShieldMs: SANCTUS_SHIELD_MS,
        });
        return;
      }

      spellActionHandlers = {
        play_electric_aoe(payload = {}) {
          void payload;
          playElectricAoe();
        },
        play_flame_aoe(payload = {}) {
          void payload;
          playFlameAoe();
        },
        domus_teleport_orb(payload = {}) {
          void payload;
          teleportOrbToSpawnNeutralizePhysics(DOMUS_TELEPORT_ABOVE_GROUND_PX);
        },
        activate_sanctum_shield(payload = {}) {
          activateSanctusShield(payload.axis || "y", SANCTUS_SHIELD_MS);
        },
      };
    }

    function executeSpellCastAction(castActionId, context = {}){
      if (spellCastExecutor && typeof spellCastExecutor.execute === "function") {
        return spellCastExecutor.execute(castActionId, context);
      }

      const actionId = String(castActionId || "").toLowerCase();
      const p = context.payload || {};
      const meta = castActionMetaForId(actionId);
      const handlerKey = String(meta && meta.handlerKey || "");
      const floatGracePolicy = String(meta && meta.floatGracePolicy || "default");
      const handler = spellActionHandlers[handlerKey];
      let handled = false;
      let grantGrace = true;
      let floatGraceMs = Number(p && p.floatGraceMs);

      if (typeof handler === "function") {
        handler(p);
        handled = true;
      }

      if (floatGracePolicy === "none") {
        grantGrace = false;
      } else if (floatGracePolicy === "domus") {
        floatGraceMs = DOMUS_FLOAT_GRACE_MS;
      }

      if (grantGrace) {
        if (!Number.isFinite(floatGraceMs)) floatGraceMs = FLOAT_GRACE_DEFAULT_MS;
        grantFloatGrace(floatGraceMs);
      }

      return { handled, floatGraceMs, grantGrace };
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
      if (!els.orbShards) return;
      const d = pointsToPath(p.points);
      if (!d) return;
      const palette = shardPaletteSnapshot || captureCurrentOrbPalette();
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("class", "orbShard");
      el.setAttribute("d", d);
      el.setAttribute("transform", "translate(0 0)");
      // Freeze shard palette to orb palette at death-time.
      el.setAttribute("fill", palette.fillRgb);
      el.setAttribute("fill-opacity", String(Number(palette.fillAlpha).toFixed(3)));
      el.setAttribute("stroke", palette.strokeRgb);
      el.setAttribute("stroke-width", "1.2");
      el.setAttribute("stroke-linejoin", "round");
      el.setAttribute("stroke-linecap", "round");
      el.setAttribute("vector-effect", "non-scaling-stroke");
      el.style.fill = palette.fillRgb;
      el.style.fillOpacity = String(Number(palette.fillAlpha).toFixed(3));
      el.style.stroke = palette.strokeRgb;
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
          { createInputSystemsBundle },
          { createWorldSystem },
          { createResourcesSystem },
          { createOrbFxSystem },
          { createVoiceRecognitionSystem },
          { createSpellDispatchSystem },
          { createVoiceHudSystem },
          { createSpellActionHandlers: createSpellActionHandlersImported },
          { createSpellCastExecutor },
          { runOrbRuntimePipeline: runOrbRuntimePipelineImported },
          { GAME_THEME_DEFAULT },
          { applyThemeCssVars },
          { buildInputHudViewModel: buildInputHudViewModelImported },
          { runInputFramePipeline: runInputFramePipelineImported },
          { BUBBLE_SHIELD_PRESET_DEFAULT, SHOCKWAVE_PRESET_DEFAULT, FLAME_AOE_PRESET_DEFAULT, ELECTRIC_AOE_PRESET_DEFAULT, hydrateReceiverVfxDefaults },
          { INPUT_GESTURE_CONFIG_DEFAULT },
          { INPUT_DYNAMICS_CONFIG_DEFAULT },
          { CAST_ACTION_REGISTRY_BY_ID },
          { RUNTIME_SPELLS_BY_ID },
          { WORLD_ITEMS_V1 },
        ] = await Promise.all([
          import("./src/events/event-bus.js"),
          import("./src/state/game-state.js"),
          import("./src/systems/orb-system.js"),
          import("./src/systems/fx-system.js"),
          import("./src/systems/audio-system.js"),
          import("./src/systems/input-systems-bundle.js"),
          import("./src/systems/world-system.js"),
          import("./src/systems/resources-system.js"),
          import("./src/systems/orb-fx-system.js"),
          import("./src/systems/voice-recognition-system.js"),
          import("./src/systems/spell-dispatch-system.js"),
          import("./src/systems/voice-hud-system.js"),
          import("./src/systems/spell-action-handlers.js"),
          import("./src/systems/spell-cast-executor.js"),
          import("./src/systems/orb-runtime-pipeline.js"),
          import("./src/content/theme/game-theme-default.js"),
          import("./src/ui/apply-theme-css-vars.js"),
          import("./src/ui/build-input-hud-view-model.js"),
          import("./src/systems/input-frame-pipeline.js"),
          import("./src/vfx/presets/index.js"),
          import("./src/content/input/gesture-config-default.js"),
          import("./src/content/input/dynamics-config-default.js"),
          import("./src/content/spells/cast-action-registry.js"),
          import("./src/content/spells/runtime-spells.js"),
          import("./src/content/world-items/default-world-items.js"),
        ]);
        if (GAME_THEME_DEFAULT) {
          applyThemeCssVars(GAME_THEME_DEFAULT);
          applyRuntimeTheme(GAME_THEME_DEFAULT);
        }
        if (typeof buildInputHudViewModelImported === "function") {
          buildInputHudViewModelModule = buildInputHudViewModelImported;
        }
        if (typeof createSpellActionHandlersImported === "function") {
          createSpellActionHandlersModule = createSpellActionHandlersImported;
        }
        if (typeof runInputFramePipelineImported === "function") {
          runInputFramePipelineModule = runInputFramePipelineImported;
        }
        if (typeof runOrbRuntimePipelineImported === "function") {
          runOrbRuntimePipelineModule = runOrbRuntimePipelineImported;
        }
        if (typeof hydrateReceiverVfxDefaults === "function") {
          hydrateReceiverVfxDefaults(VFX_DEFAULTS, {
            bubbleShield: BUBBLE_SHIELD_PRESET_DEFAULT,
            shockwave: SHOCKWAVE_PRESET_DEFAULT,
            flameAoe: FLAME_AOE_PRESET_DEFAULT,
            electricAoe: ELECTRIC_AOE_PRESET_DEFAULT,
          });
        }
        if (INPUT_GESTURE_CONFIG_DEFAULT && typeof INPUT_GESTURE_CONFIG_DEFAULT === "object") {
          INPUT_GESTURE_CFG = INPUT_GESTURE_CONFIG_DEFAULT;
        }
        if (INPUT_DYNAMICS_CONFIG_DEFAULT && typeof INPUT_DYNAMICS_CONFIG_DEFAULT === "object") {
          INPUT_DYNAMICS_CFG = INPUT_DYNAMICS_CONFIG_DEFAULT;
        }
        runtimeSpellIndex = RUNTIME_SPELLS_BY_ID || Object.create(null);
        castActionRegistryIndex = CAST_ACTION_REGISTRY_BY_ID || Object.create(null);
        initSpellActionHandlers();
        if (typeof createSpellCastExecutor === "function") {
          spellCastExecutor = createSpellCastExecutor({
            castActionRegistryById: castActionRegistryIndex,
            handlers: spellActionHandlers,
            grantFloatGrace,
            floatGraceDefaultMs: FLOAT_GRACE_DEFAULT_MS,
            floatGraceDomusMs: DOMUS_FLOAT_GRACE_MS,
          });
        }

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
          getOrbWorldPosition: () => ({ xNorm: 0.5, yW: physState.yW }),
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
          shardPaletteSnapshot = captureCurrentOrbPalette();
          orbInputSuppressed = true;
          clearFloatGrace();
          clearOrbRuntimeFxForDeath();
          scheduleDeathOverlay();
          updateDebugReadout();
        });
        eventBus.on("orb.revived", () => {
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
        eventBus.on("orb.shatter_complete", () => {
          mvpShards = [];
          if (els.orbShards) els.orbShards.innerHTML = "";
          stopShardSim();
        });
        eventBus.on("voice.spell_cast", (p = {}) => {
          const intent = String(p.intent || "");
          const spellId = String(p.spellId || "").toLowerCase();
          const castActionId = castActionForSpellId(spellId);
          executeSpellCastAction(castActionId, { payload: p, intent });
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
          inputSystemsBundle,
          inputSystem,
          inputDynamicsSystem,
          inputGestureSystem,
          resourcesSystem,
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

    function physicsStep(ts){
      if (physState.lastTs == null) physState.lastTs = ts;
      let dt = (ts - physState.lastTs) / 1000;
      physState.lastTs = ts;
      const nowMs = performance.now();
      const wasOnGround = !!physState.onGround;

      dt = clamp(dt, 0, 0.05);

      if (typeof runOrbRuntimePipelineModule === "function") {
        runOrbRuntimePipelineModule({
          ts,
          dt,
          nowMs,
          wasOnGround,
          physState,
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
        requestAnimationFrame(physicsStep);
        return;
      }

      if (mvp && mvp.orbSystem) mvp.orbSystem.tick(nowMs);

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
      const shakeCooldownUntil = (inputGestureSystem && typeof inputGestureSystem.getShakeCooldownUntil === "function")
        ? Number(inputGestureSystem.getShakeCooldownUntil()) || 0
        : 0;
      const shakeLampThr = Number(INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.lampThreshold) || 1.65;
      if (typeof buildInputHudViewModelModule === "function") {
        return buildInputHudViewModelModule({
          processed,
          shakeCooldownUntil,
          shakeLampThreshold: shakeLampThr,
        });
      }

      if (!processed) return null;
      const shakeForUI = (processed.nowMs < shakeCooldownUntil) ? 0 : processed.shake;
      const shakeMeter = (shakeLampThr > 1e-6)
        ? clamp01((Number(shakeForUI) || 0) / shakeLampThr)
        : 0;
      return {
        nowMs: processed.nowMs,
        lift: processed.lift,
        groove: processed.groove,
        smooth: processed.smooth,
        speed: processed.speed,
        dynamics: processed.dynamics,
        shake: processed.shake,
        locked: processed.locked,
        energyUI01: processed.energyUI01,
        liftP: Math.round(clamp01(processed.lift) * 100),
        gP: Math.round(clamp01(processed.groove) * 100),
        sP: Math.round(clamp01(processed.smooth) * 100),
        sp: Math.round(clamp01(processed.speed) * 100),
        dP: Math.round(clamp01(processed.dynamics) * 100),
        shakeMeter,
        sh: (Number(shakeMeter) * shakeLampThr),
        ePts: Math.round(Number(processed.energyBankPts) || 0),
        over: (processed.energyUI01 > 1),
        shieldRgb01: processed.shieldRgb01,
      };
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

      if (typeof runInputFramePipelineModule === "function") {
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
            physState,
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

      updateEnergyBankFromPhone(energyFromPhone, nowMs);
      const energyBankPts = getEnergyBankPts();
      const energyUI01 = energyBankPts / getEnergyBankCap();
      const lift = computeLift01(groove, smooth, speed);
      physState.lift01 = lift;
      physState.energy01 = Math.max(0, Number(energyUI01) || 0);
      physState.dynamics01 = dynamics;
      setBgFromEnergy(energyUI01);
      const shieldRgb01 = (frame && Array.isArray(frame.shieldRGB) && frame.shieldRGB.length >= 3)
        ? frame.shieldRGB
        : (d && Array.isArray(d.shieldRGB) && d.shieldRGB.length >= 3 ? d.shieldRGB : null);
      if (d && typeof d.sd === "string" && d.sd.trim()) {
        if (inputGestureSystem && typeof inputGestureSystem.setPendingDirection === "function") {
          inputGestureSystem.setPendingDirection(d.sd, nowMs);
        }
      }
      stabilityVisualGate =
        (!physState.onGround) &&
        (clamp01(speed) >= (Number(INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.speedMin01) || 0.02)) &&
        (!physState.shieldDescentBlocked);
      const dynStateBefore = (inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
        ? inputDynamicsSystem.getState()
        : { stabilityOn: false, variabilityOn: false };
      applyStabilityVisuals();
      if (inputGestureSystem && typeof inputGestureSystem.processFlatSpinFrame === "function") {
        inputGestureSystem.processFlatSpinFrame({
          raw: d,
          atMs: nowMs,
          stabilityOn: !!dynStateBefore.stabilityOn,
          stabilityVisualGate,
        });
      }
      if (inputDynamicsSystem && typeof inputDynamicsSystem.processFrame === "function") {
        inputDynamicsSystem.processFrame({ dynamics01: dynamics, atMs: nowMs });
      }
      applyStabilityVisuals();
      processShakeDoubleBang(shake, nowMs, groove);
      setAudio(energyUI01, groove, locked);
      return { nowMs, lift, groove, smooth, speed, dynamics, shake, locked, energyUI01, energyBankPts, shieldRgb01 };
    }

    function applyDataToUI(d){
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
