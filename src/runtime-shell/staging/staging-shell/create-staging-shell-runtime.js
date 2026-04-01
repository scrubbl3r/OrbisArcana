import { mountDevStaging } from "../dev-staging/dev-staging.js";
import { renderGameStaging } from "../game-staging/game-staging.js";
import { loadStagingInitModules } from "../load-staging-init-modules.js";
import { INTERACTION_GRAPH_V2 } from "../../../content/interactions-v2/interaction-graph-v2.js";
import { ACTIVE_WORDS_BY_ID } from "../../../voice/wordbook.js";

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

function normalizeShellWordId(value) {
  return String(value || "").trim().toLowerCase().replace(/^word\./, "").replace(/^spell\./, "");
}

function normalizeShellToken(value) {
  return String(value || "").trim().toLowerCase();
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

function readNumberInputOrNull(el) {
  if (!el) return null;
  const raw = String(el.value == null ? "" : el.value).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function clamp01(n) {
  return clamp(n, 0, 1);
}

function pickImpulse01(d, newKey, oldKey) {
  if (d && d[newKey] != null) {
    const n = Number(d[newKey]);
    return Number.isFinite(n) ? clamp01(n) : 0;
  }
  const n = Number(d && d[oldKey]);
  if (!Number.isFinite(n)) return 0;
  return clamp01(n > 1.5 ? (n / 100) : n);
}

function computeLift01(groove01, smooth01, speed01) {
  const g = clamp01(groove01);
  const s = clamp01(smooth01);
  const p = clamp01(speed01);
  return clamp01(Math.pow(Math.max(0, g * s * p), 1 / 3));
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
  ensureShellStageBackdrop(shellContext);
  resetShellOrbToGround(shellContext);
  updateShellStageReadouts(shellContext);
  drawShellStars(shellContext);
  drawShellBackdrop(shellContext);
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
  const thrust = Math.max(0, Number(phys.thrustMax) || 0) * clamp01(state.lift01);

  let a = g - thrust;
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

function setLamp(el, on) {
  if (!el) return;
  el.classList.toggle("on", !!on);
}

function flashLamp(el, runtime, key, ms = 380) {
  if (!el || !runtime) return;
  if (!runtime.dirLampTO) runtime.dirLampTO = Object.create(null);
  el.classList.add("on");
  if (runtime.dirLampTO[key]) clearTimeout(runtime.dirLampTO[key]);
  runtime.dirLampTO[key] = setTimeout(() => {
    el.classList.remove("on");
    runtime.dirLampTO[key] = null;
  }, ms);
}

function flashDirectionLamp(shellContext, code, ms = 380) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!refs || !runtime) return;
  const map = {
    U: refs.lampUp,
    D: refs.lampDown,
    L: refs.lampLeft,
    R: refs.lampRight,
    F: refs.lampForward,
    B: refs.lampBack,
  };
  const c = String(code || "").trim().toUpperCase();
  if (!c || !map[c]) return;
  flashLamp(map[c], runtime, c, ms);
}

function handleShellImpulseFrame(shellContext, data) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const devView = shellContext && shellContext.views ? shellContext.views.devStagingView : null;
  const devRefs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const buildInputHudViewModel =
    sharedModules &&
    sharedModules.buildInputHudViewModelModule &&
    sharedModules.buildInputHudViewModelModule.buildInputHudViewModel;
  const stage = runtime && runtime.stage;
  if (!runtime || !stage || !stage.orbRuntimeState || typeof stage.orbRuntimeState.patch !== "function") return;

  const groove = pickImpulse01(data, "groove01", "groove");
  const smooth = pickImpulse01(data, "smooth01", "smooth");
  const speed = pickImpulse01(data, "speed01", "speed");
  const dynamics = pickImpulse01(data, "dynamics01", "orbit01");
  const shake = pickImpulse01(data, "shake01", "shake");
  const energy = pickImpulse01(data, "energy01", "energy");
  const locked = !!(data && data.locked);
  const lift = computeLift01(groove, smooth, speed);
  const nowMs = performance.now();

  stage.orbRuntimeState.patch({
    lift01: lift,
    energy01: energy,
    dynamics01: dynamics,
  });

  if (typeof buildInputHudViewModel === "function" && devView && typeof devView.renderInputHud === "function") {
    const vm = buildInputHudViewModel({
      processed: {
        nowMs,
        lift,
        groove,
        smooth,
        speed,
        dynamics,
        shake,
        locked,
        energyUI01: energy,
        energyBankPts: Math.round(energy * 1000),
        shieldRgb01: Array.isArray(data && data.shieldRGB) ? data.shieldRGB : null,
      },
      shakeCooldownUntil: 0,
      shakeLampThreshold: 1.65,
    });
    devView.renderInputHud(vm);
  }

  setLamp(devRefs && devRefs.shakeLamp, shake >= 0.72);
  setLamp(devRefs && devRefs.dynLampStable, dynamics >= 0.08 && speed >= 0.02);
  setLamp(devRefs && devRefs.dynLampVar, dynamics >= 0.8 && speed >= 0.02);

  if (data && typeof data.sd === "string" && data.sd.trim()) {
    flashDirectionLamp(shellContext, data.sd, 380);
  }

  if (devView && typeof devView.setStatus === "function") {
    devView.setStatus('Phone calibrated <span class="devStagingDim">(live shell input)</span>', "devStagingDim");
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
      drawShellStars(shellContext);
      drawShellBackdrop(shellContext);
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

function createShellDevStagingPanelElements(refs = {}) {
  return {
    teleBtn: refs.teleBtn || null,
    wordBoardBtn: refs.wordBoardBtn || null,
    kwsReadout: refs.kwsReadout || null,
    rulesReadout: refs.rulesReadout || null,
    kwsLog: refs.kwsLog || null,
    logTabKws: refs.logTabKws || null,
    logTabPhone: refs.logTabPhone || null,
    kwsTokenThrInput: refs.kwsTokenThrInput || null,
    kwsCooldownMsInput: refs.kwsCooldownMsInput || null,
    kwsApplyTuneBtn: refs.kwsApplyTuneBtn || null,
    logPopup: refs.logPopup || null,
    logPopupHeader: refs.logPopupHeader || null,
    logPopupClose: refs.logPopupClose || null,
    wordBoardPopup: refs.wordBoardPopup || null,
    wordBoardPopupHeader: refs.wordBoardPopupHeader || null,
    wordBoardPopupClose: refs.wordBoardPopupClose || null,
    wordBoardBody: refs.wordBoardBody || null,
    wordBoardDebugPanel: refs.wordBoardDebugPanel || null,
    wordBoardDebugToggle: refs.wordBoardDebugToggle || null,
    wordBoardDebugBadge: refs.wordBoardDebugBadge || null,
    wordBoardDebugBody: refs.wordBoardDebugBody || null,
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

function buildShellRootWakeWindowMap() {
  const rules = Array.isArray(INTERACTION_GRAPH_V2 && INTERACTION_GRAPH_V2.rules)
    ? INTERACTION_GRAPH_V2.rules
    : [];
  const bySignal = new Map();
  for (const rule of rules) {
    const onWordId = normalizeShellWordId(rule && rule.on && rule.on.word);
    const open = rule && rule.open && typeof rule.open === "object" ? rule.open : null;
    if (!onWordId || !open || (rule && rule.requires)) continue;
    const words = Array.isArray(open.words)
      ? open.words.map((wordId) => normalizeShellWordId(wordId)).filter(Boolean)
      : [];
    if (!words.length) continue;
    const wordMeta = ACTIVE_WORDS_BY_ID[onWordId];
    const phrase = normalizeShellToken(wordMeta && (wordMeta.phrase || wordMeta.id));
    const entry = Object.freeze({
      ruleId: String(rule && rule.id || "").trim().toLowerCase(),
      triggerWordId: onWordId,
      triggerPhrase: phrase,
      windowId: String(open.id || rule.id || "").trim().toLowerCase(),
      words,
      ttlMs: Math.max(0, Number(open.ttlMs) || 0),
    });
    bySignal.set(onWordId, entry);
    if (phrase) bySignal.set(phrase, entry);
  }
  return bySignal;
}

const SHELL_ROOT_WAKE_WINDOW_MAP = buildShellRootWakeWindowMap();

function resolveShellRootWakeWindow(payload = {}) {
  const wordId = normalizeShellWordId(
    (payload.word && payload.word.id)
    || (payload.spell && payload.spell.id)
    || payload.wordId
    || payload.spellId
  );
  if (wordId && SHELL_ROOT_WAKE_WINDOW_MAP.has(wordId)) {
    return SHELL_ROOT_WAKE_WINDOW_MAP.get(wordId);
  }
  const token = normalizeShellToken(payload.token || payload.transcript);
  if (token && SHELL_ROOT_WAKE_WINDOW_MAP.has(token)) {
    return SHELL_ROOT_WAKE_WINDOW_MAP.get(token);
  }
  return null;
}

function bindShellRootWakeWindows({ eventBus, receiverEvents = {}, kwsBridge = null } = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    return { dispose() {} };
  }
  const tokenEvent = String(receiverEvents.EVT_VOICE_TOKEN_DETECTED || "voice.token_detected");
  const wordEvent = String(receiverEvents.EVT_VOICE_WORD_DETECTED || "voice.word_detected");
  const lastOpenedAtByWindowId = new Map();
  const unsub = [];

  function maybeEmitWakeWindow(payload = {}, sourceEvent = "") {
    const wake = resolveShellRootWakeWindow(payload);
    if (!wake) return;
    const now = Number(payload.atMs) || Date.now();
    const prev = Number(lastOpenedAtByWindowId.get(wake.windowId) || 0);
    if (prev && (now - prev) < 180) return;
    lastOpenedAtByWindowId.set(wake.windowId, now);
    eventBus.emit("rule_engine.wake_win_opened", {
      ruleId: wake.ruleId,
      actionId: wake.windowId,
      windowId: wake.windowId,
      words: wake.words.slice(),
      ttlMs: wake.ttlMs,
      atMs: now,
      sourceEvent: String(sourceEvent || ""),
    });
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(`TRACE wake_open:${wake.windowId}`, "ok");
    }
  }

  unsub.push(eventBus.on(tokenEvent, (payload = {}) => {
    maybeEmitWakeWindow(payload, tokenEvent);
  }));
  unsub.push(eventBus.on(wordEvent, (payload = {}) => {
    maybeEmitWakeWindow(payload, wordEvent);
  }));

  return {
    dispose() {
      while (unsub.length) {
        const off = unsub.pop();
        try { off(); } catch (_) {}
      }
    },
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

function formatPhoneImpulseLogLine(d) {
  if (!d || typeof d !== "object") return "";
  const speed = Number.isFinite(Number(d.speed01 ?? d.speed)) ? Number(d.speed01 ?? d.speed).toFixed(3) : "0.000";
  const energy = Number.isFinite(Number(d.energy01 ?? d.energy)) ? Number(d.energy01 ?? d.energy).toFixed(3) : "0.000";
  const groove = Number.isFinite(Number(d.groove01 ?? d.groove)) ? Number(d.groove01 ?? d.groove).toFixed(3) : "0.000";
  const smooth = Number.isFinite(Number(d.smooth01 ?? d.smooth)) ? Number(d.smooth01 ?? d.smooth).toFixed(3) : "0.000";
  const dynamics = Number.isFinite(Number(d.dynamics01 ?? d.orbit01)) ? Number(d.dynamics01 ?? d.orbit01).toFixed(3) : "0.000";
  const shake = Number.isFinite(Number(d.shake01 ?? d.shake)) ? Number(d.shake01 ?? d.shake).toFixed(3) : "0.000";
  const hz = Number.isFinite(Number(d.hz)) ? Number(d.hz).toFixed(2) : "0.00";
  const locked = d.locked ? "1" : "0";
  return `PHONE speed:${speed} energy:${energy} groove:${groove} dyn:${dynamics} smooth:${smooth} shake:${shake} locked:${locked} hz:${hz}`;
}

function ensureShellStageBackdrop(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const refs = shellContext && shellContext.refs ? shellContext.refs.game : null;
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  if (!runtime || !refs || !refs.physStage || !refs.stars || !refs.terrain || !rootDocument) return;

  const rect = shellStageRect(shellContext);
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = Math.max(1, Math.min(2.5, (rootDocument.defaultView && rootDocument.defaultView.devicePixelRatio) || 1));
  const stageBackdrop = runtime.stageBackdrop || (runtime.stageBackdrop = Object.create(null));

  if (stageBackdrop.width === width && stageBackdrop.height === height && stageBackdrop.starCtx && stageBackdrop.terrainCtx) {
    return;
  }

  stageBackdrop.width = width;
  stageBackdrop.height = height;
  refs.stars.width = Math.floor(width * dpr);
  refs.stars.height = Math.floor(height * dpr);
  refs.stars.style.width = `${width}px`;
  refs.stars.style.height = `${height}px`;
  refs.terrain.width = Math.floor(width * dpr);
  refs.terrain.height = Math.floor(height * dpr);
  refs.terrain.style.width = `${width}px`;
  refs.terrain.style.height = `${height}px`;

  stageBackdrop.starCtx = refs.stars.getContext("2d", { alpha: false });
  stageBackdrop.terrainCtx = refs.terrain.getContext("2d", { alpha: true });
  if (stageBackdrop.starCtx) stageBackdrop.starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (stageBackdrop.terrainCtx) stageBackdrop.terrainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colorSets = [
    [255, 255, 255],
    [192, 208, 255],
    [255, 224, 164],
  ];
  stageBackdrop.layers = [
    { count: 56, rMin: 0.7, rMax: 1.3, aMin: 0.16, aMax: 0.46 },
    { count: 42, rMin: 0.8, rMax: 1.6, aMin: 0.22, aMax: 0.60 },
    { count: 24, rMin: 1.0, rMax: 2.0, aMin: 0.35, aMax: 0.82 },
  ].map((cfg, layerIndex) => ({
    cfg,
    stars: Array.from({ length: cfg.count }, (_, i) => {
      const seed = (i + 1) * (layerIndex + 3) * 97;
      return {
        x: (seed * 37) % width,
        yW: (seed * 91) % 5000,
        r: cfg.rMin + (((seed * 17) % 100) / 100) * (cfg.rMax - cfg.rMin),
        a: cfg.aMin + (((seed * 29) % 100) / 100) * (cfg.aMax - cfg.aMin),
        rgb: colorSets[layerIndex] || colorSets[0],
      };
    }),
  }));

  stageBackdrop.mountainPoints = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    return {
      x: Math.round(t * width),
      yOff: [58, 74, 52, 96, 66, 84, 61, 98, 76, 88][i] || 60,
    };
  });
}

function shellGroundLineScreenY(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  if (!stage || !stage.phys || !stage.orbRuntimeState || typeof stage.orbRuntimeState.get !== "function") return 0;
  const rect = shellStageRect(shellContext);
  const groundLineWorldY = shellGroundCenterWorld(shellContext) +
    (Number(stage.phys.orbRadiusPx) || 50) +
    ((Number(stage.phys.groundLinePx) || 2) * 0.5);
  const camTop = shellCameraTopFor(shellContext, stage.orbRuntimeState.get().yW, rect.height || 0);
  return groundLineWorldY - camTop;
}

function drawShellStars(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!stageBackdrop || !stageBackdrop.starCtx) return;
  const ctx = stageBackdrop.starCtx;
  const w = stageBackdrop.width || 0;
  const h = stageBackdrop.height || 0;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, h);
  for (const layer of stageBackdrop.layers || []) {
    for (const star of layer.stars || []) {
      const y = ((star.yW - camTop) % h + h) % h;
      ctx.fillStyle = `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},${star.a})`;
      ctx.beginPath();
      ctx.arc(star.x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, Math.min(w, h) * 0.10, w * 0.5, h * 0.42, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawShellBackdrop(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!stageBackdrop || !stageBackdrop.terrainCtx) return;
  const ctx = stageBackdrop.terrainCtx;
  const w = stageBackdrop.width || 0;
  const h = stageBackdrop.height || 0;
  const groundY = shellGroundLineScreenY(shellContext);
  const pts = stageBackdrop.mountainPoints || [];

  ctx.clearRect(0, 0, w, h);
  if (pts.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, groundY - pts[0].yOff);
  for (const p of pts) ctx.lineTo(p.x, groundY - p.yOff);
  ctx.lineTo(pts[pts.length - 1].x, groundY);
  ctx.lineTo(pts[0].x, groundY);
  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pts[0].x, groundY - pts[0].yOff);
  for (const p of pts) ctx.lineTo(p.x, groundY - p.yOff);
  ctx.strokeStyle = "rgba(132, 232, 164, 0.92)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "miter";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(132, 232, 164, 0.25)";
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
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

async function initShellKwsRuntime(shellContext) {
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const devRefs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  if (!sharedModules || !runtime || !devRefs) return null;

  const createEventBus = sharedModules.eventBusModule && sharedModules.eventBusModule.createEventBus;
  const bootstrapKwsStaging =
    sharedModules.bootstrapKwsStagingModule &&
    sharedModules.bootstrapKwsStagingModule.bootstrapKwsStaging;
  const createKwsPanelController =
    sharedModules.kwsPanelControllerModule &&
    sharedModules.kwsPanelControllerModule.createKwsPanelController;
  const createKwsRuntimeController =
    sharedModules.kwsRuntimeControllerModule &&
    sharedModules.kwsRuntimeControllerModule.createKwsRuntimeController;
  const createKwsBootOrchestrator =
    sharedModules.kwsBootOrchestratorModule &&
    sharedModules.kwsBootOrchestratorModule.createKwsBootOrchestrator;
  const bindKwsEventHandlers =
    sharedModules.kwsEventBindingsModule &&
    sharedModules.kwsEventBindingsModule.bindKwsEventHandlers;
  const createKwsListenPolicyController =
    sharedModules.kwsListenPolicyControllerModule &&
    sharedModules.kwsListenPolicyControllerModule.createKwsListenPolicyController;
  const bootstrapKwsVoiceRuntime =
    sharedModules.kwsProviderBootstrapModule &&
    sharedModules.kwsProviderBootstrapModule.bootstrapKwsVoiceRuntime;
  const createKwsRuntimeConfig =
    sharedModules.kwsConfigModule &&
    sharedModules.kwsConfigModule.createKwsRuntimeConfig;
  const createKwsReceiverBridge =
    sharedModules.kwsReceiverBridgeModule &&
    sharedModules.kwsReceiverBridgeModule.createKwsReceiverBridge;
  const receiverEventsModule = sharedModules.receiverEventsModule || {};
  const RECEIVER_EVENTS = {
    ...(receiverEventsModule.RECEIVER_EVENTS && typeof receiverEventsModule.RECEIVER_EVENTS === "object"
      ? receiverEventsModule.RECEIVER_EVENTS
      : {}),
  };
  const loadReceiverInitModules =
    sharedModules.receiverBootstrapModule &&
    sharedModules.receiverBootstrapModule.loadReceiverInitModules;

  if (
    typeof createEventBus !== "function" ||
    typeof bootstrapKwsStaging !== "function" ||
    typeof createKwsPanelController !== "function" ||
    typeof createKwsRuntimeController !== "function" ||
    typeof createKwsBootOrchestrator !== "function" ||
    typeof bindKwsEventHandlers !== "function" ||
    typeof createKwsListenPolicyController !== "function" ||
    typeof bootstrapKwsVoiceRuntime !== "function" ||
    typeof createKwsRuntimeConfig !== "function" ||
    typeof createKwsReceiverBridge !== "function" ||
    typeof loadReceiverInitModules !== "function"
  ) {
    return null;
  }

  const {
    createKwsProvider,
    createVoiceProviderManager,
    createOpenWakeWordBrowserBackendFactory,
    createRuleEnginePreviewSystem,
  } = await loadReceiverInitModules();

  if (
    typeof createKwsProvider !== "function" ||
    typeof createVoiceProviderManager !== "function" ||
    typeof createOpenWakeWordBrowserBackendFactory !== "function" ||
    typeof createRuleEnginePreviewSystem !== "function"
  ) {
    return null;
  }

  const hydrateReceiverBootstrapState =
    sharedModules.receiverBootstrapModule &&
    sharedModules.receiverBootstrapModule.hydrateReceiverBootstrapState;

  let kwsWordProvider = null;
  let kwsVoiceProvider = null;
  let voiceProviderManager = null;
  let kwsListenPolicyController = null;
  let kwsBackendKey = "openwakeword_browser";
  const kwsDebugState = { mode: "kws", backend: "openwakeword_browser" };
  const eventBus = createEventBus();

  const {
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    runtimeConfig,
  } = bootstrapKwsStaging({
    createKwsRuntimeConfig,
    createKwsReceiverBridge,
    createKwsPanelController,
    createKwsRuntimeController,
    createKwsBootOrchestrator,
    createDevStagingPanelElements: () => createShellDevStagingPanelElements(devRefs),
    getKwsWordProvider: () => kwsWordProvider,
    getKwsVoiceProvider: () => kwsVoiceProvider,
    getMvp: () => runtime.mvp,
    readTuneFromUi: () => ({
      inferThreshold: readNumberInputOrNull(devRefs.kwsTokenThrInput),
      inferCooldownMs: readNumberInputOrNull(devRefs.kwsCooldownMsInput),
    }),
    refreshKwsMicBtn: () => {},
    readout: {
      setDebugMode: (mode) => { kwsDebugState.mode = String(mode || "kws"); },
      setDebugBackend: (key) => { kwsDebugState.backend = String(key || "openwakeword_browser"); },
      receiverEvents: RECEIVER_EVENTS,
    },
    runtime: {
      defaultVoiceEngine: "kws",
      defaultBackendKey: "openwakeword_browser",
    },
  });

  const kwsVoiceRuntime = bootstrapKwsVoiceRuntime({
    eventBus,
    createKwsProvider,
    createVoiceProviderManager,
    createOpenWakeWordBrowserBackendFactory,
    kwsRuntimeController,
    defaultBackendKey: runtimeConfig.defaultBackendKey,
    defaultVoiceEngine: runtimeConfig.defaultVoiceEngine,
    syncKwsTuneUiFromStatus: (status) => kwsBridge.syncTuneUiFromStatus(status),
    refreshKwsMicBtn: () => {},
  });

  kwsWordProvider = kwsVoiceRuntime.kwsWordProvider || kwsVoiceRuntime.kwsVoiceProvider || null;
  kwsVoiceProvider = kwsVoiceRuntime.kwsVoiceProvider || kwsVoiceRuntime.kwsWordProvider || null;
  voiceProviderManager = kwsVoiceRuntime.voiceProviderManager || null;
  kwsBackendKey = String(kwsVoiceRuntime.kwsBackendKey || runtimeConfig.defaultBackendKey || "openwakeword_browser");
  kwsDebugState.backend = kwsBackendKey;

  kwsListenPolicyController = createKwsListenPolicyController({
    eventBus,
    kwsRuntimeController,
    initialMode: String(runtimeConfig.listenPolicyMode || "A"),
    nowMs: () => Date.now(),
  });
  if (kwsListenPolicyController && typeof kwsListenPolicyController.start === "function") {
    kwsListenPolicyController.start();
  }

  let ruleSchema = null;
  let runtimeWordIndex = Object.create(null);
  let runtimeSpellIndex = Object.create(null);
  if (typeof hydrateReceiverBootstrapState === "function") {
    hydrateReceiverBootstrapState(
      {
        ...sharedModules.receiverBootstrapModule,
        ...(
          await loadReceiverInitModules()
        ),
      },
      {
        applyRuntimeTheme: () => {},
        setBuildInputHudViewModelModule: () => {},
        setCreateSpellActionHandlersModule: () => {},
        setRunInputFramePipelineModule: () => {},
        setRunOrbRuntimePipelineModule: () => {},
        getOrbRuntimeConfig: () => ({ PHYS: {}, SHIELD_DESCENT: {}, IMPACT_MODEL: {}, IMPACT_TH: 0 }),
        setOrbRuntimeConfig: () => {},
        getOrbStatusConfig: () => ({
          FLOAT_GRACE_DEFAULT_MS: 0,
          DOMUS_FLOAT_GRACE_MS: 0,
          SUPER_GRACE_DEFAULT_MS: 0,
        }),
        setOrbStatusConfig: () => {},
        vfxDefaults: {},
        getInputConfigs: () => ({ INPUT_GESTURE_CFG: {}, INPUT_DYNAMICS_CFG: {} }),
        setInputConfigs: () => {},
        setRuntimeWordIndexes: (next = {}) => {
          runtimeWordIndex = next.runtimeWordIndex || Object.create(null);
          runtimeSpellIndex = next.runtimeSpellIndex || runtimeWordIndex;
        },
        setRuleSchema: (next = {}) => {
          ruleSchema = next && typeof next === "object" ? { ...next } : null;
        },
        initWordActionHandlers: () => {},
        createSpellCastExecutorContext: () => ({}),
        setSpellCastExecutor: () => {},
        setReceiverModulesReady: () => {},
      }
    );
  }

  let ruleEnginePreviewSystem = null;
  if (ruleSchema) {
    ruleEnginePreviewSystem = createRuleEnginePreviewSystem({
      eventBus,
      schema: ruleSchema,
      executeActions: false,
      getWakeWindowPadMs: () => 0,
    });
    if (ruleEnginePreviewSystem && typeof ruleEnginePreviewSystem.start === "function") {
      ruleEnginePreviewSystem.start();
    }
  }

  const kwsEventRuntime = bindKwsEventHandlers({
    eventBus,
    events: RECEIVER_EVENTS,
    state: kwsDebugState,
    deps: {
      canonicalKwsToken: (token) => kwsBridge.canonicalToken(token),
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
      isUngatedToken: () => false,
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
        if (kwsPanelController && typeof kwsPanelController.setSelectedSpinWord === "function") {
          kwsPanelController.setSelectedSpinWord(axis, spinWord);
        }
      },
      getKwsMode: () => String(kwsDebugState.mode || ""),
      getListenPolicyStatus: () => (
        kwsListenPolicyController && typeof kwsListenPolicyController.getStatus === "function"
          ? kwsListenPolicyController.getStatus()
          : null
      ),
      gateTimeoutMs: Math.max(0, Number(runtimeConfig.gateTimeoutMs) || 1500),
    },
  });

  const kwsRootWakeBridge = bindShellRootWakeWindows({
    eventBus,
    receiverEvents: RECEIVER_EVENTS,
    kwsBridge,
  });

  runtime.eventBus = eventBus;
  runtime.kws = {
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    kwsWordProvider,
    kwsVoiceProvider,
    voiceProviderManager,
    kwsListenPolicyController,
    ruleSchema,
    runtimeWordIndex,
    runtimeSpellIndex,
    ruleEnginePreviewSystem,
    kwsEventRuntime,
    kwsRootWakeBridge,
    kwsBackendKey,
    kwsDebugState,
    receiverEvents: RECEIVER_EVENTS,
  };

  try {
    if (typeof kwsRuntimeController.setKwsBackend === "function") {
      await kwsRuntimeController.setKwsBackend(runtimeConfig.defaultBackendKey);
    }
    if (typeof kwsRuntimeController.setVoiceEngine === "function") {
      kwsRuntimeController.setVoiceEngine();
    }
    if (typeof kwsRuntimeController.setKwsMicEnabled === "function") {
      await kwsRuntimeController.setKwsMicEnabled(true);
    }
    if (typeof kwsBridge.startAutostartWatchdog === "function") {
      kwsBridge.startAutostartWatchdog();
    }
  } catch (error) {
    if (typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(
        `kws boot warning: ${error && error.message ? String(error.message) : "unknown error"}`,
        "warn"
      );
    }
  }

  if (devRefs.rulesReadout) devRefs.rulesReadout.textContent = "boot:kws_ready";
  if (typeof kwsBridge.updateReadout === "function") kwsBridge.updateReadout();
  if (typeof kwsBridge.pushLogLine === "function") kwsBridge.pushLogLine("kws runtime active", "ok");

  return runtime.kws;
}

async function initShellPairingRuntime(shellContext) {
  const rootDocument = shellContext.rootDocument;
  const win = rootDocument.defaultView;
  const devView = shellContext.views.devStagingView;
  const shellKws = shellContext.runtime && shellContext.runtime.kws ? shellContext.runtime.kws : null;
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
    applyDataToUI: (data) => {
      handleShellImpulseFrame(shellContext, data);
    },
    teleMaybeLog: (data) => {
      const kwsPanelController = shellKws && shellKws.kwsPanelController;
      if (!kwsPanelController || typeof kwsPanelController.pushPhoneLogLine !== "function") return;
      const line = formatPhoneImpulseLogLine(data);
      if (!line) return;
      kwsPanelController.pushPhoneLogLine(line, "muted");
    },
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
    kwsPanelController: shellKws ? shellKws.kwsPanelController : null,
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
    updateShellBootUi(rootDocument, STAGING_SHELL_STATUS.sharedModulesReady, "Booting KWS runtime");
    await initShellKwsRuntime(shellContext);
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
