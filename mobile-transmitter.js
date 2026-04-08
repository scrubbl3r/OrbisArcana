    const transmitterViewportBoot = window.__orbisTransmitterViewportBoot || null;
    if (transmitterViewportBoot && typeof transmitterViewportBoot.applyVhUnit === "function") {
      transmitterViewportBoot.applyVhUnit();
    } else {
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
    }
  
  (() => {
    // =========================================================================
    // UI — Start/Stop + Gesture Lab
    // =========================================================================
    const transmitterPageShell = window.__orbisTransmitterPageShell || null;
    const transmitterLifecycle = window.__orbisTransmitterLifecycle || null;
    const transmitterSessionBootstrap = window.__orbisTransmitterSessionBootstrap || null;
    const transmitterMotionInput = window.__orbisTransmitterMotionInput || null;
    const createTransmitterPacketPublisher = window.__orbisCreateTransmitterPacketPublisher || null;
    const transmitterAudioRuntime = window.__orbisTransmitterAudioRuntime || null;
    const createTransmitterMotionCore = window.__orbisCreateTransmitterMotionCore || null;
    const createTransmitterRuntimeReset = window.__orbisCreateTransmitterRuntimeReset || null;
    const createTransmitterLanSession = window.__orbisCreateTransmitterLanSession || null;
    const transmitterGestureLabLogic = window.__orbisTransmitterGestureLabLogic || null;
    const transmitterCalibrationLogic = window.__orbisTransmitterCalibrationLogic || null;
    const transmitterGestureLabUi = window.__orbisTransmitterGestureLabUi || null;
    const transmitterGestureLabState = window.__orbisTransmitterGestureLabState || {
      gestureBank: { templates: {}, mastery: 0.35 },
      lab: {
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
        lastMatch: null,
      },
      calibration: {
        gravityLock: null,
        calibBasis: null,
        calibR: null,
        calibAlpha0: null,
        calib: {
          active: false,
          startMs: 0,
          samples: [],
          ackPending: false,
          pendingReq: false,
        },
      },
      loadCalibBasis() {},
      saveCalibBasis() {},
      loadGestureBank() {},
      saveGestureBank() {},
      loadGravityLock() {},
      saveGravityLock() {},
      clearGestureBank() {
        this.gestureBank.templates = {};
        this.calibration.gravityLock = null;
      },
    };
    const transmitterUiBoot = window.__orbisTransmitterUiBoot || null;
    const VERSION_TAG = !transmitterUiBoot;
    const VERSION_TEXT = (transmitterUiBoot && transmitterUiBoot.versionText) || "vtag:shield-debug";
    const startBtn = transmitterPageShell && transmitterPageShell.refs
      ? transmitterPageShell.refs.startBtn
      : document.getElementById('startBtn');
    const lanConnecting = transmitterPageShell && transmitterPageShell.refs
      ? transmitterPageShell.refs.lanConnecting
      : document.getElementById('lanConnecting');
    const gestureLabRefs = transmitterGestureLabUi && transmitterGestureLabUi.refs
      ? transmitterGestureLabUi.refs
      : {};
    const lockGravityBar = gestureLabRefs.lockGravityBar || null;
    const recordBtn = gestureLabRefs.recordBtn || null;
    const stopBtn = gestureLabRefs.stopBtn || null;
    const saveBtn = gestureLabRefs.saveBtn || null;
    const qualityBar = gestureLabRefs.qualityBar || null;
    const testReadout = gestureLabRefs.testReadout || null;

    const UI = { state: "idle" }; // compatibility mirror
    let appReady = false;
    let startInFlight = false;

    function setBtn(label){
      if (transmitterLifecycle && typeof transmitterLifecycle.setMode === "function") {
        transmitterLifecycle.setMode(String(label || "").toLowerCase() === "stop" ? "running" : "idle");
        UI.state = transmitterLifecycle.isRunning() ? "running" : "idle";
        return;
      }
      if (transmitterPageShell && typeof transmitterPageShell.setButtonLabel === "function") {
        transmitterPageShell.setButtonLabel(label);
        return;
      }
      if (!startBtn) return;
      startBtn.textContent = label;
    }
    function setStartReady(ready){
      appReady = !!ready;
      if (transmitterLifecycle && typeof transmitterLifecycle.setReady === "function") {
        transmitterLifecycle.setReady(appReady);
        return;
      }
      if (transmitterPageShell && typeof transmitterPageShell.setStartReady === "function") {
        transmitterPageShell.setStartReady(appReady);
        return;
      }
      if (!startBtn) return;
      startBtn.style.visibility = appReady ? "visible" : "hidden";
      startBtn.disabled = !appReady;
    }
    function setJoinStatus(msg){
      if (transmitterPageShell && typeof transmitterPageShell.setJoinStatus === "function") {
        transmitterPageShell.setJoinStatus(msg);
        return;
      }
    }
    function showLanConnecting(){
      if (transmitterPageShell && typeof transmitterPageShell.showLanConnecting === "function") {
        transmitterPageShell.showLanConnecting();
        return;
      }
      if (!lanConnecting) return;
      lanConnecting.classList.add("on");
      lanConnecting.setAttribute("aria-hidden", "false");
    }
    function hideLanConnecting(){
      if (transmitterPageShell && typeof transmitterPageShell.hideLanConnecting === "function") {
        transmitterPageShell.hideLanConnecting();
        return;
      }
      if (!lanConnecting) return;
      lanConnecting.classList.remove("on");
      lanConnecting.setAttribute("aria-hidden", "true");
    }
    setStartReady(false);

    if (VERSION_TAG) {
      const tag = document.createElement("div");
      tag.textContent = VERSION_TEXT;
      tag.style.position = "fixed";
      tag.style.left = "50%";
      tag.style.bottom = "8px";
      tag.style.transform = "translateX(-50%)";
      tag.style.fontSize = "11px";
      tag.style.opacity = "0.65";
      tag.style.letterSpacing = "0.04em";
      tag.style.pointerEvents = "none";
      tag.style.color = "rgba(var(--accent-rgb), 0.9)";
      document.body.appendChild(tag);
    }

    // =========================================================================
    // Keep phone glow mapping (background color), driven by energy
    // =========================================================================
    function setBgFromEnergy(e01) {
      if (transmitterUiBoot && typeof transmitterUiBoot.setBgFromEnergy === "function") {
        transmitterUiBoot.setBgFromEnergy(e01);
        return;
      }
      const t = Math.max(0, Math.min(1, e01));
      const r = Math.round((255) * t);
      const g = Math.round(42 * t);
      const b = 0;
      document.body.style.backgroundColor = `rgb(${r},${g},${b})`;
    }
    setBgFromEnergy(0);

    // =========================================================================
    // Gesture Lab — user-taught gesture templates (mobile)
    // =========================================================================
    const MAX_REC_MS = 1200;
    const PRE_ROLL_MS = 100;
    const START_THR = 0.35;
    const MIN_REC_MS = 180;
    const RESAMPLE_N = 32;
    const MOTION_HIST_MS = 900;
    const HIT_WIN_MAX_MS = 500;
    const CALIB_MS = 2000;
    const IMPULSE_WIN_MS = 360;
    const DIR_MIN_THR = 0.35;
    const PHONE_TOP_AXIS = { x:0, y:1, z:0 };
    const DEBUG_SHIELD = true;

    const gestureBank = transmitterGestureLabState.gestureBank;
    const lab = transmitterGestureLabState.lab;
    const calibrationState = transmitterGestureLabState.calibration;

    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const clamp01x2 = (x) => Math.max(0, Math.min(2, x));
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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
    const loadCalibBasis = () => transmitterGestureLabState.loadCalibBasis();
    const saveCalibBasis = () => transmitterGestureLabState.saveCalibBasis();
    const loadGestureBank = () => transmitterGestureLabState.loadGestureBank();
    const saveGestureBank = () => transmitterGestureLabState.saveGestureBank();
    const loadGravityLock = () => transmitterGestureLabState.loadGravityLock();
    const saveGravityLock = () => transmitterGestureLabState.saveGravityLock();
    const clearGestureBank = () => transmitterGestureLabState.clearGestureBank();

    function setLabOpen(on){
      lab.open = !!on;
      if (transmitterGestureLabUi && typeof transmitterGestureLabUi.setLabOpen === "function") {
        transmitterGestureLabUi.setLabOpen(lab.open);
      }
    }

    function setLabelSelection(label){
      lab.selectedLabel = label;
      if (transmitterGestureLabUi && typeof transmitterGestureLabUi.setLabelSelection === "function") {
        transmitterGestureLabUi.setLabelSelection(label);
      }
    }

    function setProgress(el, v01){
      if (transmitterGestureLabUi && typeof transmitterGestureLabUi.setProgress === "function") {
        transmitterGestureLabUi.setProgress(el, v01);
        return;
      }
      if (!el) return;
      const p = clamp01(v01) * 100;
      el.style.width = p.toFixed(1) + "%";
    }

    function updateGravityReadout(){
      if (transmitterGestureLabUi && typeof transmitterGestureLabUi.updateGravityReadout === "function") {
        transmitterGestureLabUi.updateGravityReadout(calibrationState.gravityLock);
      }
    }

    function updateMasteryUI(){
      const m = clamp01(gestureBank.mastery);
      if (transmitterGestureLabUi && typeof transmitterGestureLabUi.updateMasteryUi === "function") {
        transmitterGestureLabUi.updateMasteryUi(m);
      }
    }

    const basisFromGravity = transmitterGestureLabLogic && typeof transmitterGestureLabLogic.basisFromGravity === "function"
      ? transmitterGestureLabLogic.basisFromGravity
      : function(gHat){
          const zAxis = { x:-gHat.x, y:-gHat.y, z:-gHat.z };
          let ref = { x:0, y:1, z:0 };
          if (Math.abs(vDot(ref, zAxis)) > 0.95) ref = { x:1, y:0, z:0 };
          const xAxis = vNorm(vCross(ref, zAxis));
          const yAxis = vCross(zAxis, xAxis);
          return { xAxis, yAxis, zAxis };
        };


    // =========================================================================
    // RELAY (Ably via Cloudflare Worker token) — logic preserved
    // =========================================================================
    const WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";
    const TOKEN_URL = WORKER_BASE + "/token";
    const stripOrbPrefix = transmitterSessionBootstrap && typeof transmitterSessionBootstrap.stripOrbPrefix === "function"
      ? transmitterSessionBootstrap.stripOrbPrefix
      : function(room){
          return String(room || "").startsWith("orb:") ? String(room).slice(4) : String(room || "");
        };
    const parseJoinParamsFromUrl = transmitterSessionBootstrap && typeof transmitterSessionBootstrap.parseJoinParamsFromUrl === "function"
      ? transmitterSessionBootstrap.parseJoinParamsFromUrl
      : function(raw){
          try {
            const u = new URL(raw || window.location.href);
            const room = (u.searchParams.get("room") || "").trim();
            const token = (u.searchParams.get("token") || "").trim();
            if (room && token) return { room, token };
          } catch (_) {}
          return null;
        };
    const roomInfo = transmitterSessionBootstrap && transmitterSessionBootstrap.roomInfo
      ? transmitterSessionBootstrap.roomInfo
      : (() => {
          const u = new URL(window.location.href);
          const raw = (u.searchParams.get("room") || "").trim();
          const channelName = !raw ? "orb:test" : (raw.indexOf(":") === -1 ? `orb:${raw}` : raw);
          const roomCode = stripOrbPrefix(channelName);
          return { raw, roomCode, channelName: roomCode ? channelName : "orb:test" };
        })();
    const room = roomInfo.channelName;
    async function initClassicFastPathJoinTransport(){
      if (transmitterSessionBootstrap && typeof transmitterSessionBootstrap.initClassicFastPathJoinTransport === "function") {
        return transmitterSessionBootstrap.initClassicFastPathJoinTransport();
      }
      return null;
    }
    function getClassicFastPathJoinTransport() {
      if (transmitterSessionBootstrap && typeof transmitterSessionBootstrap.getFastPathJoinTransport === "function") {
        return transmitterSessionBootstrap.getFastPathJoinTransport();
      }
      return null;
    }
    async function connectRelay() {
      if (transmitterSessionBootstrap && typeof transmitterSessionBootstrap.connectRelay === "function") {
        return transmitterSessionBootstrap.connectRelay();
      }
      return false;
    }
    function disconnectRelay() {
      if (transmitterSessionBootstrap && typeof transmitterSessionBootstrap.disconnectRelay === "function") {
        transmitterSessionBootstrap.disconnectRelay();
      }
    }

    // ===== LAN PARTY (P2P) BEGIN =====
    const impulseTransport = {
      sendImpulse(_type, _payload){ return false; },
      onImpulse(_handler){},
      close(){}
    };

    function setImpulseTransport(next){
      impulseTransport.sendImpulse = next.sendImpulse || impulseTransport.sendImpulse;
      impulseTransport.onImpulse = next.onImpulse || impulseTransport.onImpulse;
      impulseTransport.close = next.close || impulseTransport.close;
    }
    const lanSession = createTransmitterLanSession
      ? createTransmitterLanSession({
          rootWindow: window,
          ablyCtor: (typeof window.Ably !== "undefined" && window.Ably) ? window.Ably : null,
          tokenUrl: TOKEN_URL,
          stripOrbPrefix,
          stunServers: [{ urls: "stun:stun.l.google.com:19302" }],
          lanTokenTtlMs: 60 * 1000,
          setJoinStatus,
          showLanConnecting,
          hideLanConnecting,
          onCalibrate: () => startCalibration(),
          getUiState: () => UI.state,
          getClassicFastPathJoinTransport,
          setImpulseTransport,
        })
      : null;

    (async () => {
      const joinFromUrl = parseJoinParamsFromUrl(window.location.href);
      setStartReady(true);
      if (joinFromUrl && lanSession) {
        try {
          await lanSession.autoJoinFromPayload(joinFromUrl);
        } catch (_) {
          hideLanConnecting();
          setJoinStatus("Auto-join failed");
        }
      }
    })();
    // ===== LAN PARTY (P2P) END =====

    // =========================================================================
    // NETWORK THROTTLE (unchanged)
    // =========================================================================
    const SEND_HZ_RELAY = 12;
    const SEND_HZ_LAN = 60;

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
    const TELEMETRY_ON = false; // force telemetry off (ignore URL flag)

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

    const packetPublisher = createTransmitterPacketPublisher
      ? createTransmitterPacketPublisher({
          rootWindow: window,
          sendHzRelay: SEND_HZ_RELAY,
          sendHzLan: SEND_HZ_LAN,
          telemetryOn: TELEMETRY_ON,
          fallDragDefault: FALL_DRAG_DEFAULT,
          eps: EPS,
          publishRelay: (name, data, callback) => {
            if (!transmitterSessionBootstrap || typeof transmitterSessionBootstrap.publishRelay !== "function") return false;
            return transmitterSessionBootstrap.publishRelay(name, data, callback);
          },
          sendImpulse: (type, payload) => impulseTransport.sendImpulse(type, payload),
        })
      : null;
    const runtimeReset = createTransmitterRuntimeReset
      ? createTransmitterRuntimeReset({
          resetPacketPublisher: () => {
            if (packetPublisher && typeof packetPublisher.reset === "function") {
              packetPublisher.reset();
            }
          },
          resetAudio: () => setAudio(0, 0, false),
          resetBg: () => setBgFromEnergy(0),
        })
      : null;

    // =========================================================================
    // publishDynamics trims payload when TELEMETRY_ON is false
    // =========================================================================
    function publishDynamics(payload, dt, force=false) {
      if (packetPublisher && typeof packetPublisher.publishDynamics === "function") {
        packetPublisher.publishDynamics(payload, dt, force, { lanActive: !!(lanSession && lanSession.isActive()) });
      }
    }

    const motionCore = createTransmitterMotionCore
      ? createTransmitterMotionCore({
          rootWindow: window,
          room,
          versionText: VERSION_TEXT,
          debugShield: DEBUG_SHIELD,
          getRunning: () => running,
          getCalibrationBasis: () => calibrationState.calibBasis,
          isCalibrationReady: () => !!calibrationState.calibBasis,
          consumeCalibAck: () => {
            const ack = calib.ackPending ? 1 : 0;
            if (calib.ackPending) calib.ackPending = false;
            return ack;
          },
          handleLinearMotionSample: ({ nowMs, agx, agy, agz }) => {
            pushMotionSample(nowMs, agx, agy, agz);
            updateGravityLocking({ x: agx, y: agy, z: agz });

            if (lab.recording){
              lab.recordSamples.push({ t: nowMs, ax: agx, ay: agy, az: agz });
              if (nowMs - lab.recordStartedAtMs >= MAX_REC_MS) endRecording();
            }

            impulseHist.push({ t: nowMs, ax: agx, ay: agy, az: agz });
            const impCutoff = nowMs - HIT_WIN_MAX_MS;
            while (impulseHist.length && impulseHist[0].t < impCutoff) impulseHist.shift();

            if (calib.active){
              calib.samples.push({ ax: agx, ay: agy, az: agz });
              if ((nowMs - calib.startMs) >= CALIB_MS) finishCalibration();
            }

            if (lab.testMode && testReadout){
              const live = recognizeGestureFromRecentBuffer(nowMs);
              lab.lastMatch = live;
              testReadout.textContent = live
                ? `Match: ${live.label} (${live.score.toFixed(2)})`
                : "Match: —";
            }
          },
          classifyDirectionalShake: (nowMs) => classifyDirectionalShake(nowMs),
          publishDynamics,
          setBgFromEnergy,
          setAudio,
        })
      : null;

    let running = false;

    function ensureAudio() {
      if (transmitterAudioRuntime && typeof transmitterAudioRuntime.ensureAudio === "function") {
        return transmitterAudioRuntime.ensureAudio();
      }
      return null;
    }

    function setAudio(eUI, groove, locked) {
      if (transmitterAudioRuntime && typeof transmitterAudioRuntime.setAudio === "function") {
        transmitterAudioRuntime.setAudio(eUI, groove, locked);
      }
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

    const buildTemplateFromSamples = transmitterGestureLabLogic && typeof transmitterGestureLabLogic.buildTemplateFromSamples === "function"
      ? function(samples, gHat) {
          return transmitterGestureLabLogic.buildTemplateFromSamples(samples, gHat, {
            startThreshold: START_THR,
            minRecordMs: MIN_REC_MS,
            resampleN: RESAMPLE_N,
          });
        }
      : null;
    const matchTemplates = transmitterGestureLabLogic && typeof transmitterGestureLabLogic.matchGestureTemplates === "function"
      ? function(candidate) {
          return transmitterGestureLabLogic.matchGestureTemplates(candidate, gestureBank.templates, gestureBank.mastery);
        }
      : null;

    function recognizeGestureFromRecentBuffer(nowMs){
      if (!calibrationState.gravityLock) return null;
      const cutoff = nowMs - HIT_WIN_MAX_MS;
      const samples = motionHist.filter(s => s.t >= cutoff);
      if (!samples.length) return null;
      const candidate = buildTemplateFromSamples(samples, calibrationState.gravityLock);
      if (!candidate) return null;
      const match = matchTemplates ? matchTemplates(candidate) : null;
      if (match) return match;
      return null;
    }

    function setRecordStatus(msg){
      if (transmitterGestureLabUi && typeof transmitterGestureLabUi.setRecordStatus === "function") {
        transmitterGestureLabUi.setRecordStatus(msg);
      }
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
        calibrationState.gravityLock = { x:g.x, y:g.y, z:g.z };
        saveGravityLock();
        lab.locking = false;
        updateGravityReadout();
        setRecordStatus("Gravity locked");
      }
    }

    function beginRecording(nowMs){
      if (!calibrationState.gravityLock){
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

      if (!calibrationState.gravityLock){
        setRecordStatus("Lock gravity first");
        return;
      }

      const candidate = buildTemplateFromSamples(lab.recordSamples, calibrationState.gravityLock);
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

    if (transmitterGestureLabUi && typeof transmitterGestureLabUi.bindControls === "function") {
      transmitterGestureLabUi.bindControls({
        onOpen: () => setLabOpen(true),
        onClose: () => setLabOpen(false),
        onSelectLabel: (label) => setLabelSelection(label),
        onLockGravity: () => beginGravityLock(),
        onRecord: () => beginRecording(performance.now()),
        onStopRecord: () => endRecording(),
        onSave: () => {
          if (!lab.lastCandidate) return;
          gestureBank.templates[lab.selectedLabel] = {
            shape: lab.lastCandidate.shape,
            power: lab.lastCandidate.power
          };
          saveGestureBank();
          setRecordStatus(`Saved ${lab.selectedLabel}`);
          if (saveBtn) saveBtn.disabled = true;
        },
        onToggleTest: (enabled) => {
          lab.testMode = !!enabled;
          if (!lab.testMode && testReadout) testReadout.textContent = "Match: —";
        },
        onMasteryInput: (value) => {
          gestureBank.mastery = clamp01(Number(value));
          updateMasteryUI();
          saveGestureBank();
        },
        onReset: () => {
          clearGestureBank();
          updateGravityReadout();
          setProgress(qualityBar, 0);
          setProgress(lockGravityBar, 0);
          if (testReadout) testReadout.textContent = "Match: —";
          setRecordStatus("Reset");
        },
      });
    }


    // =========================================================================
    // Calibration + Directional Impulse (phone-side)
    // =========================================================================
    const impulseHist = []; // { t, ax, ay, az }

    const calib = calibrationState.calib;

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
    window.__orbisStartTransmitterCalibration = startCalibration;

    function finishCalibration(){
      if (!transmitterCalibrationLogic || typeof transmitterCalibrationLogic.computeCalibrationBasis !== "function") {
        calib.active = false;
        return;
      }
      const orientRuntime = motionCore && typeof motionCore.getOrientState === "function"
        ? motionCore.getOrientState()
        : null;
      const result = transmitterCalibrationLogic.computeCalibrationBasis(calib.samples, orientRuntime && orientRuntime.R, {
        phoneTopAxis: PHONE_TOP_AXIS,
        previousAlpha0: calibrationState.calibAlpha0,
        orientationAlpha: orientRuntime && orientRuntime.alpha,
      });
      if (!result) {
        calib.active = false;
        return;
      }
      calibrationState.calibBasis = result.basis;
      calibrationState.calibR = result.calibR;
      calibrationState.calibAlpha0 = result.calibAlpha0;
      saveCalibBasis();

      calib.active = false;
      calib.ackPending = true;
    }

    function classifyDirectionalShake(nowMs){
      if (!transmitterCalibrationLogic || typeof transmitterCalibrationLogic.classifyDirectionalImpulse !== "function") {
        return null;
      }
      const orientRuntime = motionCore && typeof motionCore.getOrientState === "function"
        ? motionCore.getOrientState()
        : null;
      const gravityVectorLp = motionCore && typeof motionCore.getGravityVectorLp === "function"
        ? motionCore.getGravityVectorLp()
        : null;
      return transmitterCalibrationLogic.classifyDirectionalImpulse({
        impulseHist,
        nowMs,
        orientRotation: orientRuntime && orientRuntime.R,
        calibBasis: calibrationState.calibBasis,
        gravityVectorLp,
        impulseWinMs: IMPULSE_WIN_MS,
        dirMinThreshold: DIR_MIN_THR,
        flipU: FLIP_U,
        flipR: FLIP_R,
        flipF: FLIP_F,
      });
    }

    const FLIP_U = 1;
    const FLIP_R = -1;
    const FLIP_F = -1;

    // =========================================================================
    // Motion listener helpers 
    // =========================================================================
    function addMotionListener(){
      if (transmitterMotionInput && typeof transmitterMotionInput.addListeners === "function") {
        transmitterMotionInput.addListeners({ onMotion, onOrient });
        return;
      }
      window.addEventListener('devicemotion', onMotion, { passive: true });
      window.addEventListener('deviceorientation', onOrient, { passive: true });
    }
    function removeMotionListener(){
      if (transmitterMotionInput && typeof transmitterMotionInput.removeListeners === "function") {
        transmitterMotionInput.removeListeners({ onMotion, onOrient });
        return;
      }
      window.removeEventListener('devicemotion', onMotion);
      window.removeEventListener('deviceorientation', onOrient);
    }

    // =========================================================================
    // iOS permission gate (UI-less)
    // =========================================================================
    async function requestMotionPermissionIfNeeded() {
      if (transmitterMotionInput && typeof transmitterMotionInput.requestPermissionIfNeeded === "function") {
        return transmitterMotionInput.requestPermissionIfNeeded();
      }
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
      if (motionCore && typeof motionCore.onOrient === "function") {
        motionCore.onOrient(e);
      }
    }

    // =========================================================================
    // onMotion (core processing) — unchanged except:
    //  - we stream vectors: a=[agx,agy,agz], r=[rrx,rry,rrz]
    //  - no orientation flow / sd / oc/od
    // =========================================================================
    function onMotion(e) {
      if (motionCore && typeof motionCore.onMotion === "function") {
        motionCore.onMotion(e);
      }
    }

    // =========================================================================
    // Start/Stop
    // =========================================================================
    async function start() {
      if (!window.isSecureContext || !appReady || startInFlight) return;

      startInFlight = true;
      if (transmitterLifecycle && typeof transmitterLifecycle.setBusy === "function") {
        transmitterLifecycle.setBusy(true);
      } else if (transmitterPageShell && typeof transmitterPageShell.setStartBusy === "function") {
        transmitterPageShell.setStartBusy(true);
      } else if (startBtn) {
        startBtn.disabled = true;
      }
      try {
        const ok = await requestMotionPermissionIfNeeded();
        if (!ok) return;

        ensureAudio();
        if (transmitterAudioRuntime && typeof transmitterAudioRuntime.resume === "function") {
          await transmitterAudioRuntime.resume();
        }
        if (!(lanSession && lanSession.isActive())) {
          await connectRelay();
        }

        running = true;
        if (runtimeReset && typeof runtimeReset.resetRuntimeState === "function") {
          runtimeReset.resetRuntimeState({});
        }
        if (motionCore && typeof motionCore.resetRuntimeState === "function") {
          motionCore.resetRuntimeState();
        }

        addMotionListener();

        UI.state = "running";
        setBtn("Stop");

        if (lanSession && lanSession.isActive()) {
          const classicFastPathJoinTransport = getClassicFastPathJoinTransport();
          if (classicFastPathJoinTransport && typeof classicFastPathJoinTransport.setRunning === "function") {
            classicFastPathJoinTransport.setRunning(true);
          } else {
            lanSession.armPhoneStartedHandshake();
          }
        }

        if (calib.pendingReq) startCalibration();

      } finally {
        startInFlight = false;
        if (transmitterLifecycle && typeof transmitterLifecycle.setBusy === "function") {
          transmitterLifecycle.setBusy(false);
        } else if (transmitterPageShell && typeof transmitterPageShell.setStartBusy === "function") {
          transmitterPageShell.setStartBusy(false);
        } else if (startBtn) {
          startBtn.disabled = false;
        }
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

      const classicFastPathJoinTransport = getClassicFastPathJoinTransport();
      if (classicFastPathJoinTransport && typeof classicFastPathJoinTransport.setRunning === "function") {
        classicFastPathJoinTransport.setRunning(false);
      }

      if (transmitterAudioRuntime && typeof transmitterAudioRuntime.silence === "function") {
        transmitterAudioRuntime.silence();
      }

      disconnectRelay();
      if (lanSession && typeof lanSession.disconnect === "function") {
        lanSession.disconnect();
      }
      UI.state = "idle";
      setBtn("Start");
      setBgFromEnergy(0);
    }

    // =========================================================================
    // Final: Start/Stop click logic
    // =========================================================================
    if (transmitterLifecycle && typeof transmitterLifecycle.attachToggle === "function") {
      transmitterLifecycle.attachToggle(start, stop);
    } else if (startBtn) {
      startBtn.onclick = () => {
        if (UI.state === "idle") start();
        else stop();
      };
    }

  })();
