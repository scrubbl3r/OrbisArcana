import { mountDevStaging } from "../dev-staging/dev-staging.js";
import { renderGameStaging } from "../game-staging/game-staging.js";
import { loadStagingInitModules } from "../load-staging-init-modules.js";

export const STAGING_SHELL_STATUS = Object.freeze({
  splitPrototype: "split-prototype",
  booting: "booting",
  sharedModulesReady: "shared-modules-ready",
  localStageReady: "local-stage-ready",
  pairingBooting: "pairing-booting",
  pairingReady: "pairing-ready",
  bootFailed: "boot-failed",
});

function updateShellBootUi(rootDocument, phase, detail, state = "booting") {
  const docEl = rootDocument && rootDocument.documentElement;
  const banner = rootDocument && rootDocument.getElementById("shellBootBanner");
  const phaseEl = rootDocument && rootDocument.getElementById("shellBootPhase");
  const detailEl = rootDocument && rootDocument.getElementById("shellBootDetail");
  if (docEl && phase) docEl.dataset.stagingShellBoot = String(phase);
  if (banner) banner.dataset.state = String(state || "booting");
  if (phaseEl && phase) phaseEl.textContent = String(phase);
  if (detailEl && detail) detailEl.textContent = String(detail);
}

function safeSetText(el, value) {
  if (!el) return;
  el.textContent = String(value || "");
}

function safeSetHtml(el, value) {
  if (!el) return;
  el.innerHTML = String(value || "");
}

const STAGING_WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";

function cloneJsonLike(value, fallback = {}) {
  if (!value || typeof value !== "object") return { ...fallback };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return { ...(value || fallback) };
  }
}

function clamp(n, min, max) {
  const value = Number(n);
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function buildShellStageInitialState(phys = {}) {
  const groundFromBottomPx = Number(phys.groundFromBottomPx) || 17;
  const groundLinePx = Number(phys.groundLinePx) || 2;
  const orbRadiusPx = Number(phys.orbRadiusPx) || 50;
  const WORLD_H = 5000;
  const yW = WORLD_H - (groundFromBottomPx + groundLinePx + orbRadiusPx);
  return {
    yW,
    v: 0,
    lastTs: null,
    gravityMul: 0.33,
    lift01: 0,
    energy01: 0,
    dynamics01: 0,
    onGround: true,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceActive: false,
    floatGraceUntilMs: 0,
    floatGraceAnchorY: yW,
    floatGracePhase: 0,
  };
}

function normalizeShellWorldItemSpawn(item, groundCenterWorldFn) {
  if (!item || String(item.kind || "") !== "energy_globe") return null;
  const s = item.spawn || {};
  const xNorm = clamp(Number(s.xNorm), 0, 1);
  const r = Math.max(1, Number(s.r) || 25);
  const yMode = String(s.yMode || "absolute");
  const yValue = Number(s.yValue) || 0;
  const yW = (yMode === "ground_center_offset")
    ? (groundCenterWorldFn() + yValue)
    : yValue;
  return {
    id: String(item.id || ""),
    xNorm: Number.isFinite(xNorm) ? xNorm : 0.5,
    yW,
    r,
  };
}

function bindShellStageControls(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.game : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!refs || !runtime || !runtime.stage) return;

  const stage = runtime.stage;
  const orbState = stage.orbRuntimeState && typeof stage.orbRuntimeState.get === "function"
    ? stage.orbRuntimeState.get()
    : null;

  const syncControls = () => {
    if (refs.gSlider) refs.gSlider.value = String(Number(orbState && orbState.gravityMul) || 0.33);
    if (refs.gVal) refs.gVal.textContent = (Number(orbState && orbState.gravityMul) || 0.33).toFixed(2);
    if (refs.dSlider) refs.dSlider.value = String(Number(stage.phys.downDrag) || -0.83);
    if (refs.dVal) refs.dVal.textContent = (Number(stage.phys.downDrag) || -0.83).toFixed(2);
  };

  if (refs.gSlider) {
    refs.gSlider.addEventListener("input", () => {
      const next = clamp(refs.gSlider.value, 0, 3);
      if (stage.orbRuntimeState && typeof stage.orbRuntimeState.patch === "function") {
        stage.orbRuntimeState.patch({ gravityMul: next });
      }
      if (refs.gVal) refs.gVal.textContent = next.toFixed(2);
    });
  }

  if (refs.dSlider) {
    refs.dSlider.addEventListener("input", () => {
      const next = clamp(refs.dSlider.value, -1, 1);
      stage.phys.downDrag = next;
      if (refs.dVal) refs.dVal.textContent = next.toFixed(2);
    });
  }

  syncControls();
}

function initializeShellStageRuntime(shellContext) {
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!sharedModules || !runtime) return;

  const {
    orbRuntimeStateModule,
    orbRuntimeConfigDefaultModule,
    orbStatusConfigDefaultModule,
    eventBusModule,
    worldSystemModule,
    worldItemsModule,
  } = sharedModules;
  const createOrbRuntimeState = orbRuntimeStateModule && orbRuntimeStateModule.createOrbRuntimeState;
  const ORB_RUNTIME_CONFIG_DEFAULT = orbRuntimeConfigDefaultModule && orbRuntimeConfigDefaultModule.ORB_RUNTIME_CONFIG_DEFAULT;
  const ORB_STATUS_CONFIG_DEFAULT = orbStatusConfigDefaultModule && orbStatusConfigDefaultModule.ORB_STATUS_CONFIG_DEFAULT;
  const createEventBus = eventBusModule && eventBusModule.createEventBus;
  const createWorldSystem = worldSystemModule && worldSystemModule.createWorldSystem;
  const WORLD_ITEMS = worldItemsModule && worldItemsModule.WORLD_ITEMS;
  if (typeof createOrbRuntimeState !== "function" || !ORB_RUNTIME_CONFIG_DEFAULT) return;

  const phys = cloneJsonLike(ORB_RUNTIME_CONFIG_DEFAULT.physics);
  const shieldDescent = cloneJsonLike(ORB_RUNTIME_CONFIG_DEFAULT.shieldDescent);
  const impact = cloneJsonLike(ORB_RUNTIME_CONFIG_DEFAULT.impact);
  const statusConfig = cloneJsonLike(ORB_STATUS_CONFIG_DEFAULT && ORB_STATUS_CONFIG_DEFAULT.floatGrace);
  const initialState = buildShellStageInitialState(phys);
  const orbRuntimeState = createOrbRuntimeState({ initialState });

  runtime.stage = {
    phys,
    shieldDescent,
    impact,
    statusConfig,
    orbRuntimeState,
    initialState,
    localEventBus: (typeof createEventBus === "function") ? createEventBus() : null,
    worldSystem: null,
  };
  runtime.orbRuntimeState = orbRuntimeState;

  const localEventBus = runtime.stage.localEventBus;
  if (typeof createWorldSystem === "function" && localEventBus) {
    const spawns = (Array.isArray(WORLD_ITEMS) ? WORLD_ITEMS : [])
      .map((item) => normalizeShellWorldItemSpawn(item, () => shellGroundCenterWorld(shellContext)))
      .filter(Boolean);
    runtime.stage.worldSystem = createWorldSystem({
      eventBus: localEventBus,
      stageEl: shellContext.stageEls.physStage,
      getStageRect: () => shellStageRect(shellContext),
      worldToScreenY: (yW) => {
        const rect = shellStageRect(shellContext);
        const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, rect.height || 0);
        return Number(yW || 0) - camTop;
      },
      getOrbWorldPosition: () => ({ xNorm: 0.5, yW: runtime.orbRuntimeState.get().yW }),
      orbRadiusPx: Number(phys.orbRadiusPx) || 50,
      spawns,
      spawn: {
        xNorm: 0.5,
        yW: shellGroundCenterWorld(shellContext) - 1000,
        r: 25,
      },
      getGlobeEl: () => shellContext.stageEls.testGlobe,
      setGlobeEl: (el) => { shellContext.stageEls.testGlobe = el; },
    });
  }
  bindShellStageControls(shellContext);
}

function shellStageRect(shellContext) {
  const physStage = shellContext && shellContext.stageEls ? shellContext.stageEls.physStage : null;
  if (!physStage || typeof physStage.getBoundingClientRect !== "function") {
    return { width: 0, height: 0 };
  }
  return physStage.getBoundingClientRect();
}

function shellGroundCenterWorld(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  if (!stage || !stage.phys) return 0;
  const WORLD_H = 5000;
  const phys = stage.phys;
  return WORLD_H - (
    (Number(phys.groundFromBottomPx) || 17) +
    (Number(phys.groundLinePx) || 2) +
    (Number(phys.orbRadiusPx) || 50)
  );
}

function shellCameraTopFor(shellContext, yW, stageH) {
  const WORLD_H = 5000;
  const maxCam = Math.max(0, WORLD_H - stageH);
  const target = Number(yW || 0) - (stageH * 0.5);
  return clamp(target, 0, maxCam);
}

function shellOrbScreenY(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbState = runtime && runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const rect = shellStageRect(shellContext);
  const camTop = shellCameraTopFor(shellContext, orbState && orbState.yW, rect.height || 0);
  return Number(orbState && orbState.yW) - camTop;
}

function applyShellGroundLine(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const groundLine = shellContext && shellContext.stageEls ? shellContext.stageEls.groundLine : null;
  if (!stage || !stage.phys || !groundLine) return;
  const rect = shellStageRect(shellContext);
  const groundLineWorldY = shellGroundCenterWorld(shellContext) +
    (Number(stage.phys.orbRadiusPx) || 50) +
    ((Number(stage.phys.groundLinePx) || 2) * 0.5);
  const camTop = shellCameraTopFor(shellContext, stage.orbRuntimeState.get().yW, rect.height || 0);
  const groundY = groundLineWorldY - camTop;
  const top = groundY - (((Number(stage.phys.groundLinePx) || 2) * 0.5));
  groundLine.style.top = `${top.toFixed(2)}px`;
}

function applyShellOrbTransform(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbWrap = shellContext && shellContext.stageEls ? shellContext.stageEls.orbWrap : null;
  if (!runtime || !runtime.stage || !orbWrap) return;
  const y = shellOrbScreenY(shellContext);
  const top = y - (Number(runtime.stage.phys.orbRadiusPx) || 50);
  orbWrap.style.transform = `translate(-50%, ${top.toFixed(2)}px)`;
}

function resetShellOrbToGround(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stage = runtime && runtime.stage;
  if (!stage || !stage.orbRuntimeState || typeof stage.orbRuntimeState.patch !== "function") return;
  const yW = shellGroundCenterWorld(shellContext);
  stage.orbRuntimeState.patch({
    yW,
    v: 0,
    onGround: true,
    floatGraceAnchorY: yW,
    floatGracePhase: 0,
    gravityMul: Number(stage.orbRuntimeState.get().gravityMul) || 0.33,
  });
  applyShellGroundLine(shellContext);
  applyShellOrbTransform(shellContext);
  if (stage.worldSystem && typeof stage.worldSystem.render === "function") {
    stage.worldSystem.render(performance.now());
  }
}

function updateShellStageReadouts(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.game : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stage = runtime && runtime.stage;
  const orbState = stage && stage.orbRuntimeState && typeof stage.orbRuntimeState.get === "function"
    ? stage.orbRuntimeState.get()
    : null;
  if (!refs || !stage || !orbState) return;
  if (refs.gVal) refs.gVal.textContent = (Number(orbState.gravityMul) || 0.33).toFixed(2);
  if (refs.dVal) refs.dVal.textContent = (Number(stage.phys.downDrag) || -0.83).toFixed(2);
}

function activateShellStageVisuals(shellContext) {
  resetShellOrbToGround(shellContext);
  updateShellStageReadouts(shellContext);
}

function tickShellStageRuntime(shellContext, dt) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stage = runtime && runtime.stage;
  const state = stage && stage.orbRuntimeState && typeof stage.orbRuntimeState.get === "function"
    ? stage.orbRuntimeState.get()
    : null;
  if (!stage || !state) return;

  const phys = stage.phys || {};
  const gravityMul = clamp(Number(state.gravityMul) || 0.33, 0, 3);
  const gBase = Number(phys.gBase) || 2200;
  const maxUpSpeed = Math.max(0, Number(phys.maxUpSpeed) || 2200);
  const maxDownSpeed = Math.max(0, Number(phys.maxDownSpeed) || 2800);
  const bounce = clamp(Number(phys.bounce) || 0.35, 0, 1);
  const upDrag = Math.max(0, Number(phys.upDrag) || 2.6);
  const downDrag = clamp(Number(phys.downDrag) || -0.83, -1, 1);

  const yFloor = shellGroundCenterWorld(shellContext);
  const yCeil = Number(phys.orbRadiusPx) || 50;
  const g = gBase * gravityMul;

  let a = g;
  const drag = state.v >= 0 ? downDrag : upDrag;
  a += (-drag * state.v);
  state.v += a * dt;
  state.v = clamp(state.v, -maxUpSpeed, maxDownSpeed);
  state.yW += state.v * dt;
  state.onGround = false;

  if (state.yW > yFloor) {
    state.yW = yFloor;
    if (state.v > 0) state.v = 0;
    state.onGround = true;
  }

  if (state.yW < yCeil) {
    state.yW = yCeil;
    if (state.v < 0) state.v = -state.v * bounce;
  }
}

function startShellStageLoop(shellContext) {
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const createOrbRuntimeLoop =
    sharedModules &&
    sharedModules.orbRuntimeLoopModule &&
    sharedModules.orbRuntimeLoopModule.createOrbRuntimeLoop;
  if (!runtime || typeof createOrbRuntimeLoop !== "function") return;

  if (runtime.stageLoop && typeof runtime.stageLoop.stop === "function") {
    runtime.stageLoop.stop();
  }

  runtime.stageLoop = createOrbRuntimeLoop({
    getState: () => (
      runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
        ? runtime.orbRuntimeState.get()
        : null
    ),
    isReady: () => true,
    clamp,
    runFrame: ({ dt }) => {
      tickShellStageRuntime(shellContext, dt);
      applyShellGroundLine(shellContext);
      applyShellOrbTransform(shellContext);
      if (runtime.stage && runtime.stage.worldSystem && typeof runtime.stage.worldSystem.tick === "function") {
        runtime.stage.worldSystem.tick(performance.now(), dt);
      }
      updateShellStageReadouts(shellContext);
    },
  });
  runtime.orbRuntimeLoop = runtime.stageLoop;
  runtime.stageLoop.start();
}

function bindShellStageResize(shellContext) {
  const win = shellContext && shellContext.rootDocument ? shellContext.rootDocument.defaultView : null;
  if (!win) return;
  const onResize = () => {
    activateShellStageVisuals(shellContext);
  };
  win.addEventListener("resize", onResize);
  shellContext.runtime.stageResizeListener = onResize;
}

function bindShellStageActions(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.game : null;
  if (!refs || !refs.tryAgainBtn) return;
  refs.tryAgainBtn.addEventListener("click", () => {
    resetShellOrbToGround(shellContext);
    const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
    if (stage && stage.worldSystem && typeof stage.worldSystem.reset === "function") {
      stage.worldSystem.reset(performance.now());
    }
  });
}

function createShellSurfaceRefs({ devStagingView, gameStagingView } = {}) {
  return {
    dev: devStagingView && devStagingView.refs ? devStagingView.refs : Object.create(null),
    game: gameStagingView && gameStagingView.refs ? gameStagingView.refs : Object.create(null),
  };
}

function createLegacyLikeStageElements(surfaceRefs = {}) {
  const game = surfaceRefs.game || Object.create(null);
  return {
    physStage: game.physStage || null,
    stars: game.stars || null,
    terrain: game.terrain || null,
    groundLine: game.groundLine || null,
    orbWrap: game.orbWrap || null,
    orb: game.orb || null,
    orbInterior: game.orbInterior || null,
    orbCracks: game.orbCracks || null,
    orbShards: game.orbShards || null,
    testGlobe: game.testGlobe || null,
    shield: game.shield || null,
    shockLayer: game.shockLayer || null,
    flameLayer: game.flameLayer || null,
    electricLayer: game.electricLayer || null,
    deathPanel: game.deathPanel || null,
    tryAgainBtn: game.tryAgainBtn || null,
    gSlider: game.gSlider || null,
    gVal: game.gVal || null,
    dSlider: game.dSlider || null,
    dVal: game.dVal || null,
  };
}

function createStagingShellContext({
  rootDocument,
  devStagingView,
  gameStagingView,
  sharedModules,
} = {}) {
  const surfaceRefs = createShellSurfaceRefs({ devStagingView, gameStagingView });
  const stageEls = createLegacyLikeStageElements(surfaceRefs);
  return {
    rootDocument,
    views: {
      devStagingView,
      gameStagingView,
    },
    refs: surfaceRefs,
    stageEls,
    sharedModules,
    runtime: {
      bootStatus: STAGING_SHELL_STATUS.sharedModulesReady,
      receiverModulesReady: false,
      mvp: null,
      eventBus: null,
      worldSystem: null,
      orbRuntimeLoop: null,
      orbRuntimeState: null,
      stage: null,
    },
  };
}

function exposeShellContext(rootDocument, shellContext) {
  const win = rootDocument && rootDocument.defaultView;
  if (!win) return;
  win.__orbisStagingShell = shellContext;
}

function syncShellStartQrSize(rootDocument) {
  const startBtn = rootDocument.getElementById("startBtn");
  const startQr = rootDocument.getElementById("startQr");
  if (!startBtn || !startQr) return 0;
  const titleEl = startBtn.querySelector("span");
  if (!titleEl || typeof titleEl.getBoundingClientRect !== "function") return 0;
  const titleWidthPx = Math.ceil(titleEl.getBoundingClientRect().width);
  if (!(titleWidthPx > 0)) return 0;
  startQr.style.width = `${titleWidthPx}px`;
  startQr.style.height = `${titleWidthPx}px`;
  startQr.dataset.titleWidthPx = String(titleWidthPx);
  return titleWidthPx;
}

function stagingMobilePageBaseUrl(rootDocument) {
  try {
    return new URL("../../../../mobile-transmitter.html", rootDocument.defaultView.location.href).toString();
  } catch (_) {
    return "https://scrubbl3r.github.io/OrbisArcana/mobile-transmitter.html";
  }
}

async function initShellPairingRuntime(shellContext) {
  const rootDocument = shellContext.rootDocument;
  const win = rootDocument.defaultView;
  const devView = shellContext.views.devStagingView;
  const statusSet = (html, cls = "devStagingDim") => {
    if (devView && typeof devView.setStatus === "function") {
      devView.setStatus(html, cls);
    }
  };

  const startScreenEl = rootDocument.getElementById("startScreen");
  const startBtn = rootDocument.getElementById("startBtn");
  const startQr = rootDocument.getElementById("startQr");
  const calibOverlayEl = rootDocument.getElementById("calibOverlay");
  const calibBtnEl = rootDocument.getElementById("calibBtn");
  const calibStatusEl = rootDocument.getElementById("calibStatus");

  let calibInFlight = false;
  let calibAvailable = false;
  let uiOverlaysSystem = null;
  let mobileImpulseSystem = null;
  let lanSession = null;

  updateShellBootUi(rootDocument, STAGING_SHELL_STATUS.pairingBooting, "Loading pairing systems");

  const { createUiOverlaysSystem } = await import("../../../ui/game/ui-overlays-system.js");
  const { createMobileImpulseSystem } = await import("../../receiver/mobile-impulse-runtime.js");
  const { createLanSessionSystem } = await import("../../session/lan-session.js");

  uiOverlaysSystem = createUiOverlaysSystem({
    startScreenEl,
    calibOverlayEl,
    calibBtnEl,
    calibStatusEl,
    deathPanelEl: shellContext.stageEls.deathPanel,
    onCalibClosed: () => {
      calibInFlight = false;
    },
  });

  const openCalibOverlay = () => uiOverlaysSystem.openCalibOverlay(calibAvailable);
  const closeCalibOverlay = () => uiOverlaysSystem.closeCalibOverlay();
  const setCalibStatus = (msg) => uiOverlaysSystem.setCalibStatus(msg);
  const hideStartScreen = () => uiOverlaysSystem.hideStartScreen();

  mobileImpulseSystem = createMobileImpulseSystem({
    idleMarkActivity: () => {},
    applyDataToUI: () => {},
    teleMaybeLog: () => {},
    onCalibrated: () => {
      setCalibStatus("Calibrated");
      closeCalibOverlay();
      statusSet('Phone calibrated <span class="devStagingDim">(staging shell)</span>', "devStagingDim");
    },
    onCalibAvailable: () => {
      if (calibAvailable) return;
      calibAvailable = true;
      setCalibStatus("Ready");
      openCalibOverlay();
    },
    isInputSuppressed: () => false,
  });

  lanSession = createLanSessionSystem({
    AblyCtor: (win.Ably && win.Ably.Realtime) ? win.Ably.Realtime : null,
    QRCodeLib: (win.QRCode) ? win.QRCode : null,
    workerBase: STAGING_WORKER_BASE,
    ui: {
      lanModal: null,
      lanQr: null,
      startQr,
      lanUrlText: null,
      lanCopyUrl: null,
      lanRoomCode: null,
      lanCode6: null,
      lanConnState: null,
      lanSafeState: null,
    },
    mobilePageBaseUrl: () => stagingMobilePageBaseUrl(rootDocument),
    syncStartQrSizeToTitlePx: () => syncShellStartQrSize(rootDocument),
    setStatus: statusSet,
    onImpulse: (payload) => {
      if (mobileImpulseSystem) mobileImpulseSystem.ingestImpulse(payload);
    },
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

  const launchLanPairingFlow = async (forceNew = false) => {
    if (!lanSession) return;
    updateShellBootUi(
      rootDocument,
      STAGING_SHELL_STATUS.pairingBooting,
      forceNew ? "Launching fresh QR pairing room" : "Launching QR pairing room"
    );
    await lanSession.launch(forceNew);
    updateShellBootUi(
      rootDocument,
      STAGING_SHELL_STATUS.pairingReady,
      "QR ready. Pair phone to continue.",
      "ready"
    );
  };

  const sendCalibrationTrigger = () => {
    if (lanSession && lanSession.sendControl("calibrate")) return true;
    return false;
  };

  if (calibBtnEl) {
    calibBtnEl.onclick = () => {
      const canCalibrate = mobileImpulseSystem ? mobileImpulseSystem.isCalibAvailable() : calibAvailable;
      if (!canCalibrate) return;
      if (calibInFlight) return;
      const ok = sendCalibrationTrigger();
      if (!ok) return;
      calibInFlight = true;
      calibBtnEl.disabled = true;
      setCalibStatus("Calibrating… (2s)");
    };
  }

  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      await launchLanPairingFlow(true);
    });
  }

  shellContext.runtime.pairing = {
    uiOverlaysSystem,
    mobileImpulseSystem,
    lanSession,
    launchLanPairingFlow,
    sendCalibrationTrigger,
    hideStartScreen,
    openCalibOverlay,
    closeCalibOverlay,
    setCalibStatus,
  };

  syncShellStartQrSize(rootDocument);
  await launchLanPairingFlow(false);
}

export async function createStagingShellRuntime({
  rootDocument = document,
  moduleCacheBustV = "20260330h",
} = {}) {
  const docEl = rootDocument.documentElement;
  const devRoot = rootDocument.getElementById("devStagingMount");
  const gameRoot = rootDocument.getElementById("gameStagingMount");

  if (docEl) {
    docEl.dataset.stagingShell = STAGING_SHELL_STATUS.splitPrototype;
    docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.booting;
  }
  updateShellBootUi(rootDocument, STAGING_SHELL_STATUS.booting, "Mounting dev-staging and game-staging");

  const devStagingView = devRoot ? mountDevStaging(devRoot) : null;
  const gameStagingView = gameRoot ? renderGameStaging(gameRoot) : null;

  if (devStagingView && typeof devStagingView.setStatus === "function") {
    devStagingView.setStatus("Booting staging shell…", "devStagingDim");
  }
  if (devStagingView && devStagingView.refs) {
    safeSetText(devStagingView.refs.rulesReadout, "boot:staging-shell");
  }

  try {
    updateShellBootUi(rootDocument, STAGING_SHELL_STATUS.booting, "Loading shared staging modules");
    const sharedModules = await loadStagingInitModules(moduleCacheBustV);
    if (docEl) {
      docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.sharedModulesReady;
    }
    updateShellBootUi(rootDocument, STAGING_SHELL_STATUS.sharedModulesReady, "Shared staging modules loaded");
    if (devStagingView && typeof devStagingView.setStatus === "function") {
      devStagingView.setStatus(
        'Staging shell ready <span class="devStagingDim">(shared modules loaded)</span>',
        "devStagingDim"
      );
    }
    if (devStagingView && devStagingView.refs) {
      safeSetHtml(devStagingView.refs.kwsReadout, "shell:modules_ready");
      safeSetText(devStagingView.refs.rulesReadout, "boot:shared_modules_ready");
    }
    const shellContext = createStagingShellContext({
      rootDocument,
      devStagingView,
      gameStagingView,
      sharedModules,
    });
    initializeShellStageRuntime(shellContext);
    activateShellStageVisuals(shellContext);
    bindShellStageResize(shellContext);
    bindShellStageActions(shellContext);
    startShellStageLoop(shellContext);
    updateShellBootUi(rootDocument, STAGING_SHELL_STATUS.localStageReady, "Local game-staging runtime active");
    await initShellPairingRuntime(shellContext);
    exposeShellContext(rootDocument, shellContext);
    return shellContext;
  } catch (error) {
    if (docEl) {
      docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.bootFailed;
    }
    updateShellBootUi(
      rootDocument,
      STAGING_SHELL_STATUS.bootFailed,
      error && error.message ? String(error.message) : "Unknown staging shell boot error",
      "failed"
    );
    if (devStagingView && typeof devStagingView.setStatus === "function") {
      devStagingView.setStatus("Staging shell boot failed", "devStagingFatal on");
    }
    if (devStagingView && typeof devStagingView.setFatal === "function") {
      devStagingView.setFatal(
        error && error.message ? `Shell boot failed: ${String(error.message)}` : "Shell boot failed."
      );
    }
    if (devStagingView && devStagingView.refs) {
      safeSetText(devStagingView.refs.rulesReadout, "boot:failed");
    }
    throw error;
  }
}
