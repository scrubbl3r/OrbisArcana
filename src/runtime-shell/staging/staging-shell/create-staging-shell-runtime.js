import { mountDevStaging } from "../dev-staging/dev-staging.js?v=20260420g";
import { createDevStagingPanelElementsFromView } from "../dev-staging/dev-staging-panel.js?v=20260420g";
import {
  allDevStagingDirectionLampsOff,
  clearDevStagingDirectionLampTimers,
  flashDevStagingDirectionLampPair,
  flashDevStagingDirectionLampSingle,
  flashDevStagingShakeLamp,
  forceDevStagingShakeLampOff,
  setDevStagingLamp,
} from "../dev-staging/dev-staging-lamps.js";
import { renderGameStaging } from "../game-staging/game-staging.js?v=20260420k";
import { LEVEL01 } from "../game-staging/levels/level01.js";
import { createGameStagingReceiverVfxDefaults, initGameStagingReceiverVfxRuntime } from "../game-staging/game-staging-vfx-runtime.js";
import { createGameStagingOrbActionBridge } from "../game-staging/game-staging-orb-action-bridge.js";
import { loadStagingInitModules } from "../load-staging-init-modules.js";
import { createReceiverStabilityVisualController } from "../../receiver/stability-visuals.js";
import { bootstrapShellReceiverHostRuntimeAssembly } from "./receiver-host-runtime-bootstrap.js";
import { attachShellReceiverHostImpulseAdapter } from "./receiver-host-impulse-adapter.js";
import { bootstrapShellPairingRuntime } from "./pairing-runtime-bootstrap.js?v=20260420g";
import { bootstrapShellKwsRuntimeBase } from "./kws-runtime-bootstrap.js";
import { INTERACTION_GRAPH_V2 } from "../../../content/interactions-v2/interaction-graph-v2.js";
import { createCameraRuntime } from "../../../game-runtime/camera/camera-runtime.js";
import { getOrbCastGateState as getSharedOrbCastGateState } from "../../../game-runtime/orb/orb-cast-policy.js";
import { resolveOrbGraceDefaultTtlMs } from "../../../game-runtime/orb/orb-grace.js";
import { resolveOrbSpinColor } from "../../../game-runtime/orb/orb-spin-color.js";
import { ACTIVE_WORDS_BY_ID } from "../../../voice/wordbook.js";
import { createCameraInputPopup } from "../../../ui/dev-console/camera-input/camera-input-popup.js?v=20260420g";
import { createCameraInputOrbBridge } from "./camera-input-orb-bridge.js?v=20260420d";

export const STAGING_SHELL_STATUS = Object.freeze({
  splitPrototype: "split-prototype",
  booting: "booting",
  sharedModulesReady: "shared-modules-ready",
  localStageReady: "local-stage-ready",
  pairingBooting: "pairing-booting",
  pairingReady: "pairing-ready",
  bootFailed: "boot-failed",
});

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

function resolveShellEventAtMs(value) {
  const atMs = Number(value);
  if (!Number.isFinite(atMs) || atMs < 100000000000) {
    return Date.now();
  }
  return atMs;
}

const STAGING_WORKER_BASE = "https://orb-token.mrgarthwilliams.workers.dev";
const SHELL_STAGE_UI_DEFAULTS = Object.freeze({
  gravityMul: 0.34,
  gravityMin: 0,
  gravityMax: 3,
  downDrag: -0.53,
  downDragMin: -1,
  downDragMax: 1,
});

const SHELL_IMPACT_MODEL = Object.freeze({
  mass: 1.0,
  gravityExp: 0.5,
  dragMirrorScale: 0.5,
});

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

function evenPx(value, min = 2, max = 4096) {
  let n = Math.round(Number(value) || 0);
  n = Math.max(min, Math.min(max, n));
  if (n % 2 === 1) n += 1;
  return n;
}

function evenStroke(value, min = 2, max = 20) {
  let n = Math.round(Number(value) || min);
  n = Math.max(min, Math.min(max, n));
  if (n % 2 === 1) n += 1;
  return n;
}

function rand(min, max) {
  return Number(min) + (Math.random() * (Number(max) - Number(min)));
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

function pickShakeMetric(d, newKey = "shake01", oldKey = "shake") {
  if (d && d[newKey] != null) {
    const n = Number(d[newKey]);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(d && d[oldKey]);
  return Number.isFinite(n) ? n : 0;
}

function computeLift01(groove01, smooth01, speed01) {
  const g = clamp01(groove01);
  const s = clamp01(smooth01);
  const p = clamp01(speed01);
  return clamp01(Math.pow(Math.max(0, g * s * p), 1 / 3));
}

function axisToColor01(axis) {
  const a = String(axis || "").trim().toLowerCase();
  if (a === "x") return { r: 0 / 255, g: 100 / 255, b: 253 / 255 };
  if (a === "z") return { r: 253 / 255, g: 241 / 255, b: 0 / 255 };
  return { r: 253 / 255, g: 78 / 255, b: 0 / 255 };
}

function buildShellStageInitialState(phys = {}) {
  const groundFromBottomPx = Number(phys.groundFromBottomPx) || 17;
  const groundLinePx = Number(phys.groundLinePx) || 2;
  const orbRadiusPx = Number(phys.orbRadiusPx) || 50;
  const WORLD_H = Number(phys.worldHeightPx) || 5000;
  const yW = WORLD_H - (groundFromBottomPx + groundLinePx + orbRadiusPx);
  return {
    yW,
    xW: 0,
    v: 0,
    vx: 0,
    lastTs: null,
    gravityMul: SHELL_STAGE_UI_DEFAULTS.gravityMul,
    lift01: 0,
    energy01: 0,
    dynamics01: 0,
    steerIntentX: 0,
    steerActive: false,
    onGround: true,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceActive: false,
    floatGraceUntilMs: 0,
    floatGraceAnchorY: yW,
    floatGracePhase: 0,
    teleportHoldActive: false,
    teleportHoldAnchorY: yW,
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
    if (refs.gSlider) refs.gSlider.value = String(Number(orbState && orbState.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul);
    if (refs.gVal) refs.gVal.textContent = (Number(orbState && orbState.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul).toFixed(2);
    if (refs.dSlider) refs.dSlider.value = String(Number(stage.phys.downDrag) || SHELL_STAGE_UI_DEFAULTS.downDrag);
    if (refs.dVal) refs.dVal.textContent = (Number(stage.phys.downDrag) || SHELL_STAGE_UI_DEFAULTS.downDrag).toFixed(2);
  };

  if (refs.gSlider) {
    refs.gSlider.addEventListener("input", () => {
      const next = clamp(refs.gSlider.value, SHELL_STAGE_UI_DEFAULTS.gravityMin, SHELL_STAGE_UI_DEFAULTS.gravityMax);
      if (stage.orbRuntimeState && typeof stage.orbRuntimeState.patch === "function") {
        stage.orbRuntimeState.patch({ gravityMul: next });
      }
      if (refs.gVal) refs.gVal.textContent = next.toFixed(2);
    });
  }

  if (refs.dSlider) {
    refs.dSlider.addEventListener("input", () => {
      const next = clamp(refs.dSlider.value, SHELL_STAGE_UI_DEFAULTS.downDragMin, SHELL_STAGE_UI_DEFAULTS.downDragMax);
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
  } = sharedModules;
  const createOrbRuntimeState = orbRuntimeStateModule && orbRuntimeStateModule.createOrbRuntimeState;
  const ORB_RUNTIME_CONFIG_DEFAULT = orbRuntimeConfigDefaultModule && orbRuntimeConfigDefaultModule.ORB_RUNTIME_CONFIG_DEFAULT;
  const ORB_STATUS_CONFIG_DEFAULT = orbStatusConfigDefaultModule && orbStatusConfigDefaultModule.ORB_STATUS_CONFIG_DEFAULT;
  const createEventBus = eventBusModule && eventBusModule.createEventBus;
  const syncOrbPhysicsToBaseVisualScale =
    sharedModules &&
    sharedModules.orbBaseStateModule &&
    sharedModules.orbBaseStateModule.syncOrbPhysicsToBaseVisualScale;
  if (typeof createOrbRuntimeState !== "function" || !ORB_RUNTIME_CONFIG_DEFAULT) return;

  const phys = cloneJsonLike(ORB_RUNTIME_CONFIG_DEFAULT.physics);
  if (typeof syncOrbPhysicsToBaseVisualScale === "function") {
    syncOrbPhysicsToBaseVisualScale(phys);
  }
  phys.downDrag = SHELL_STAGE_UI_DEFAULTS.downDrag;
  phys.worldHeightPx = shellWorldHeight(shellContext);
  const shieldDescent = cloneJsonLike(ORB_RUNTIME_CONFIG_DEFAULT.shieldDescent);
  const impact = cloneJsonLike(ORB_RUNTIME_CONFIG_DEFAULT.impact);
  const statusConfig = cloneJsonLike(ORB_STATUS_CONFIG_DEFAULT && ORB_STATUS_CONFIG_DEFAULT.grace);
  const initialState = buildShellStageInitialState(phys);
  initialState.xW = shellStageCenterX(shellContext);
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
  bindShellStageControls(shellContext);
}

function getShellOrbScaleFactor(shellContext) {
  const visualState = getShellOrbBaseVisualState(shellContext);
  return Math.max(0.01, Number(visualState && visualState.diameterPx) || 100) / 100;
}

function shellStageRect(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (runtime && runtime.frameMetrics && runtime.frameMetrics.rect) {
    return runtime.frameMetrics.rect;
  }
  if (runtime && runtime.stageRectCache) {
    return runtime.stageRectCache;
  }
  const physStage = shellContext && shellContext.stageEls ? shellContext.stageEls.physStage : null;
  if (!physStage || typeof physStage.getBoundingClientRect !== "function") {
    return { width: 0, height: 0 };
  }
  const rect = physStage.getBoundingClientRect();
  if (runtime) {
    runtime.stageRectCache = {
      width: Number(rect.width) || 0,
      height: Number(rect.height) || 0,
    };
  }
  return rect;
}

function shellWorldHeight(shellContext) {
  const levelWorld = shellContext && shellContext.currentLevel && shellContext.currentLevel.world
    ? shellContext.currentLevel.world
    : null;
  const heightPx = Number(levelWorld && levelWorld.heightPx);
  return Number.isFinite(heightPx) && heightPx > 0 ? heightPx : 5000;
}

function shellGroundCenterWorld(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  if (!stage || !stage.phys) return 0;
  const WORLD_H = Number(stage.phys.worldHeightPx) || shellWorldHeight(shellContext);
  const phys = stage.phys;
  return WORLD_H - (
    (Number(phys.groundFromBottomPx) || 17) +
    (Number(phys.groundLinePx) || 2) +
    (Number(phys.orbRadiusPx) || 50)
  );
}

function shellStageCenterX(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (runtime && runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.centerX))) {
    return Number(runtime.frameMetrics.centerX) || 0;
  }
  const rect = shellStageRect(shellContext);
  return (Number(rect.width) || 0) * 0.5;
}

function shellLateralBounds(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (runtime && runtime.frameMetrics && runtime.frameMetrics.lateralBounds) {
    return runtime.frameMetrics.lateralBounds;
  }
  const stage = runtime && runtime.stage ? runtime.stage : null;
  const rect = shellStageRect(shellContext);
  const orbRadiusPx = Number(stage && stage.phys && stage.phys.orbRadiusPx) || 50;
  const stageWidth = Number(rect.width) || 0;
  return {
    left: orbRadiusPx,
    right: Math.max(orbRadiusPx, stageWidth - orbRadiusPx),
  };
}

function shellCameraTopFor(shellContext, yW, stageH, nowMs = performance.now()) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const WORLD_H = Number(stage && stage.phys && stage.phys.worldHeightPx) || shellWorldHeight(shellContext);
  const maxCam = Math.max(0, WORLD_H - stageH);
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
  const effectiveYW = cameraRuntime && typeof cameraRuntime.resolveWorldY === "function"
    ? cameraRuntime.resolveWorldY({ baselineYW: yW, nowMs })
    : Number(yW || 0);
  return clamp((Number.isFinite(effectiveYW) ? effectiveYW : 0) - (stageH * 0.5), 0, maxCam);
}

function shellOrbScreenY(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (runtime && runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenY))) {
    return Number(runtime.frameMetrics.orbScreenY) || 0;
  }
  const orbState = runtime && runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const rect = shellStageRect(shellContext);
  const camTop = shellCameraTopFor(shellContext, orbState && orbState.yW, rect.height || 0);
  return Number(orbState && orbState.yW) - camTop;
}

function updateShellFrameMetrics(shellContext, nowMs = performance.now()) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const physStage = shellContext && shellContext.stageEls ? shellContext.stageEls.physStage : null;
  if (!runtime || !physStage || typeof physStage.getBoundingClientRect !== "function") return null;
  const rect = physStage.getBoundingClientRect();
  const safeRect = {
    width: Number(rect.width) || 0,
    height: Number(rect.height) || 0,
  };
  runtime.stageRectCache = safeRect;
  const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const stage = runtime.stage ? runtime.stage : null;
  const orbRadiusPx = Number(stage && stage.phys && stage.phys.orbRadiusPx) || 50;
  const camTop = shellCameraTopFor(shellContext, orbState && orbState.yW, safeRect.height || 0, nowMs);
  runtime.frameMetrics = {
    nowMs,
    rect: safeRect,
    centerX: safeRect.width * 0.5,
    camTop,
    orbScreenY: (Number(orbState && orbState.yW) || 0) - camTop,
    lateralBounds: {
      left: orbRadiusPx,
      right: Math.max(orbRadiusPx, safeRect.width - orbRadiusPx),
    },
  };
  return runtime.frameMetrics;
}

function applyShellGroundLine(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  if (!stage || !stage.phys || !gameStagingAdapter || typeof gameStagingAdapter.applyGroundLine !== "function") return;
  const rect = shellStageRect(shellContext);
  const groundLineWorldY = shellGroundCenterWorld(shellContext) +
    (Number(stage.phys.orbRadiusPx) || 50) +
    ((Number(stage.phys.groundLinePx) || 2) * 0.5);
  const camTop = shellCameraTopFor(shellContext, stage.orbRuntimeState.get().yW, rect.height || 0);
  const groundY = groundLineWorldY - camTop;
  const top = groundY - (((Number(stage.phys.groundLinePx) || 2) * 0.5));
  gameStagingAdapter.applyGroundLine({ top });
}

function applyShellOrbTransform(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  if (!runtime || !runtime.stage || !gameStagingAdapter || typeof gameStagingAdapter.applyOrbTransform !== "function") return;
  const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const bounds = shellLateralBounds(shellContext);
  const xW = clamp(Number(orbState && orbState.xW) || shellStageCenterX(shellContext), bounds.left, bounds.right);
  const y = shellOrbScreenY(shellContext);
  const top = y - (Number(runtime.stage.phys.orbRadiusPx) || 50);
  gameStagingAdapter.applyOrbTransform({ top, left: xW });
}

function resetShellOrbToGround(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stage = runtime && runtime.stage;
  if (!stage || !stage.orbRuntimeState || typeof stage.orbRuntimeState.patch !== "function") return;
  const yW = shellGroundCenterWorld(shellContext);
  const xW = shellStageCenterX(shellContext);
  stage.orbRuntimeState.patch({
    yW,
    xW,
    v: 0,
    vx: 0,
    steerIntentX: 0,
    steerActive: false,
    onGround: true,
    floatGraceAnchorY: yW,
    floatGracePhase: 0,
    gravityMul: Number(stage.orbRuntimeState.get().gravityMul) || 0.34,
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
  if (refs.gVal) refs.gVal.textContent = (Number(orbState.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul).toFixed(2);
  if (refs.dVal) refs.dVal.textContent = (Number(stage.phys.downDrag) || SHELL_STAGE_UI_DEFAULTS.downDrag).toFixed(2);
}

function computeShellImpactMetric(shellContext, rawImpactV) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stage = runtime && runtime.stage ? runtime.stage : null;
  const orbState = runtime && runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const v = Math.max(0, Number(rawImpactV) || 0);
  const gMul = Math.max(0.05, Number(orbState && orbState.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul);
  const fallDrag = clamp(Number(stage && stage.phys && stage.phys.downDrag) || 0, -1, 1);
  const eLike = 0.5 * SHELL_IMPACT_MODEL.mass * v * v;
  const gravityTerm = Math.pow(gMul, SHELL_IMPACT_MODEL.gravityExp);
  const dragMirror = clamp(1 - (fallDrag * SHELL_IMPACT_MODEL.dragMirrorScale), 0.05, 2.0);
  return Math.sqrt(eLike * 2) * gravityTerm * dragMirror;
}

const SHELL_STAGE_FLOOR_CONTACT_EPSILON_PX = 0.25;
const SHELL_STAGE_CEIL_CONTACT_EPSILON_PX = 0.25;

function activateShellStageVisuals(shellContext) {
  updateShellFrameMetrics(shellContext, performance.now());
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
  const gravityMul = clamp(
    Number(state.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul,
    SHELL_STAGE_UI_DEFAULTS.gravityMin,
    SHELL_STAGE_UI_DEFAULTS.gravityMax
  );
  const gBase = Number(phys.gBase) || 2200;
  const maxUpSpeed = Math.max(0, Number(phys.maxUpSpeed) || 2200);
  const maxDownSpeed = Math.max(0, Number(phys.maxDownSpeed) || 2800);
  const bounce = clamp(Number(phys.bounce) || 0.35, 0, 1);
  const upDrag = Math.max(0, Number(phys.upDrag) || 2.6);
  const downDrag = clamp(
    Number(phys.downDrag) || SHELL_STAGE_UI_DEFAULTS.downDrag,
    SHELL_STAGE_UI_DEFAULTS.downDragMin,
    SHELL_STAGE_UI_DEFAULTS.downDragMax
  );

  const yFloor = shellGroundCenterWorld(shellContext);
  const yCeil = Number(phys.orbRadiusPx) || 50;
  const nowMs = performance.now();

  if (state.floatGraceActive) {
    const untilMs = Number(state.floatGraceUntilMs) || 0;
    if (untilMs > nowMs) {
      const anchorY = Number.isFinite(Number(state.floatGraceAnchorY)) ? Number(state.floatGraceAnchorY) : Number(state.yW || yFloor);
      const phase = Number(state.floatGracePhase) || 0;
      const bob = Math.sin(phase + (nowMs * 0.008)) * 6;
      state.yW = clamp(anchorY + bob, yCeil, yFloor);
      state.v = 0;
      state.onGround = false;
      return;
    }
    state.floatGraceActive = false;
    state.floatGraceUntilMs = 0;
  }

  if (state.teleportHoldActive) {
    const anchorY = Number.isFinite(Number(state.teleportHoldAnchorY)) ? Number(state.teleportHoldAnchorY) : Number(state.yW || yFloor);
    state.yW = clamp(anchorY, yCeil, yFloor);
    state.v = 0;
    state.onGround = false;
    state.descendMs = 0;
    state.shieldDescentBlocked = false;
    return;
  }

  const g = gBase * gravityMul;
  const thrust = Math.max(0, Number(phys.thrustMax) || 0) * clamp01(state.lift01);

  let a = g - thrust;
  const drag = state.v >= 0 ? downDrag : upDrag;
  a += (-drag * state.v);
  state.v += a * dt;
  state.v = clamp(state.v, -maxUpSpeed, maxDownSpeed);
  state.yW += state.v * dt;
  state.onGround = false;

  if (state.yW >= (yFloor - SHELL_STAGE_FLOOR_CONTACT_EPSILON_PX)) {
    state.yW = yFloor;
    if (state.v > 0) state.v = 0;
    state.onGround = true;
  }

  if (state.yW <= (yCeil + SHELL_STAGE_CEIL_CONTACT_EPSILON_PX)) {
    state.yW = yCeil;
    if (state.v < 0) state.v = -state.v * bounce;
  }
}

function clearShellDirectionLampTimers(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  clearDevStagingDirectionLampTimers(runtime);
}

function allShellDirectionLampsOff(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  allDevStagingDirectionLampsOff(refs);
}

function flashShellDirectionLampPair(shellContext, a, b, ms = 380) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  flashDevStagingDirectionLampPair(refs, runtime, a, b, ms);
}

function flashShellDirectionLampSingle(shellContext, code, ms = 380) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  flashDevStagingDirectionLampSingle(refs, runtime, code, ms);
}

function flashShellShakeLamp(shellContext, ms = 400) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  flashDevStagingShakeLamp(refs, runtime, ms);
}

function forceShellShakeLampOff(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  forceDevStagingShakeLampOff(refs, runtime);
}

function createShellReceiverConfigs() {
  return {
    IMPACT_TH: 500,
    ENERGY_BANK_CAP: 1000,
    ENERGY_SHAKE_COST: 100,
    ENERGY_CHARGE_RATE_PPS: 160,
    INPUT_GESTURE_CFG: {
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
    },
    INPUT_DYNAMICS_CFG: {
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
    },
  };
}

function handleShellImpulseFrame(shellContext, data) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const devView = shellContext && shellContext.views ? shellContext.views.devStagingView : null;
  const receiverHostRuntime = runtime && runtime.receiverHostRuntime ? runtime.receiverHostRuntime : null;
  let inputPayload = data;

  if (runtime && runtime.signalProcessor && runtime.motionStore) {
    try {
      const motionState = runtime.signalProcessor.processPacket(data, performance.now(), {
        suppressShake: false,
      });
      runtime.motionStore.publish(motionState);
      updateShellSpinColorFromMotionState(shellContext, motionState);
      traceShellSpinDirection(shellContext, motionState);
      if (motionState && motionState.spin) {
        inputPayload = {
          ...(data || {}),
          spinVector: motionState.spin.vector,
          spinAxisDominance: motionState.spin.dominance,
          spinAxisGap: motionState.spin.gap,
          spinAxisLabel: motionState.spin.label,
          spinDirection: motionState.spin.direction,
        };
      }
    } catch (error) {
      try { console.warn("[staging-shell] signal processor failed", error); } catch (_) {}
    }
  }

  if (receiverHostRuntime && typeof receiverHostRuntime.processIncomingImpulse === "function") {
    receiverHostRuntime.processIncomingImpulse(inputPayload);
    renderShellHudFromMotionStore(shellContext);
    if (devView && typeof devView.setStatus === "function" && !runtime.liveInputStatusShown) {
      devView.setStatus('Phone calibrated <span class="devStagingDim">(live shell input)</span>', "devStagingDim");
      runtime.liveInputStatusShown = true;
    }
    return;
  }
  if (devView && typeof devView.setStatus === "function" && !runtime.pendingInputStatusShown) {
    devView.setStatus('Phone calibrated <span class="devStagingDim">(receiver host boot pending)</span>', "devStagingDim");
    runtime.pendingInputStatusShown = true;
  }
}

function traceShellSpinDirection(shellContext, motionState) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const spin = motionState && motionState.spin ? motionState.spin : null;
  const axis = String(spin && spin.label || "").trim().toLowerCase();
  const direction = String(spin && spin.direction || "").trim().toLowerCase();
  const dominance = Number(spin && spin.dominance) || 0;
  const gap = Number(spin && spin.gap) || 0;
  const traceKey = axis
    ? `${axis}:${direction || "-"}:${dominance.toFixed(2)}:${gap.toFixed(2)}`
    : "none";
  if (runtime && runtime.lastSpinDirectionTraceKey === traceKey) return;
  if (runtime) runtime.lastSpinDirectionTraceKey = traceKey;
  pushShellGeneralLog(
    shellContext,
    axis
      ? `TRACE spin:${axis}:${direction || "-"}:dom:${dominance.toFixed(2)}:gap:${gap.toFixed(2)}`
      : "TRACE spin:-",
    axis ? "muted" : "warn"
  );
}

function updateShellSpinColorFromMotionState(shellContext, motionState) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbColorRuntime = runtime && runtime.orbColorRuntime ? runtime.orbColorRuntime : null;
  if (!orbColorRuntime) return;
  const spin = motionState && motionState.spin ? motionState.spin : null;
  const axis = String(spin && spin.label || "").trim().toLowerCase();
  const direction = String(spin && spin.direction || "").trim().toLowerCase();
  const dominance = Number(spin && spin.dominance) || 0;
  const gap = Number(spin && spin.gap) || 0;
  const state = runtime.spinColorState || (runtime.spinColorState = {
    active: false,
    axis: "",
    direction: "",
  });
  const spinAcquire = !!axis && dominance >= 0.48 && gap >= 0.03;
  const spinHold = !!axis && dominance >= 0.38 && gap >= 0.015;

  if (state.active) {
    const sameAxis = axis === state.axis;
    if (!sameAxis || !spinHold) {
      state.active = false;
      state.axis = "";
      state.direction = "";
    }
  }

  if (!state.active && spinAcquire) {
    state.active = true;
    state.axis = axis;
    state.direction = "";
  }

  if (!state.active) {
    if (typeof orbColorRuntime.clearSpinColor === "function") {
      orbColorRuntime.clearSpinColor();
    }
    return;
  }

  if (axis && axis !== state.axis) {
    state.axis = axis;
    state.direction = "";
  }
  if (direction === "cw" || direction === "ccw") {
    state.direction = direction;
  }

  const color = resolveOrbSpinColor(state.axis, state.direction);
  if (color && typeof orbColorRuntime.applySpinColor === "function") {
    orbColorRuntime.applySpinColor(color);
    return;
  }
  if (typeof orbColorRuntime.clearSpinColor === "function") {
    orbColorRuntime.clearSpinColor();
  }
}

function setShellDebugNote(shellContext, text = "") {
  const devView = shellContext && shellContext.views ? shellContext.views.devStagingView : null;
  if (devView && typeof devView.setDebugNote === "function") {
    devView.setDebugNote(text);
  }
}

function getShellMotionStoreHudViewModel(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const store = runtime && runtime.motionStore;
  if (!store || typeof store.getState !== "function") return null;
  const state = store.getState();
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

function renderShellHudFromMotionStore(shellContext) {
  const devView = shellContext && shellContext.views ? shellContext.views.devStagingView : null;
  if (!devView || typeof devView.renderInputHud !== "function") return;
  const vm = getShellMotionStoreHudViewModel(shellContext);
  if (!vm) return;
  devView.renderInputHud(vm);
}

function pushShellGeneralLog(shellContext, text = "", kind = "") {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const kwsPanelController = runtime && runtime.kws ? runtime.kws.kwsPanelController : null;
  if (kwsPanelController && typeof kwsPanelController.pushGeneralLogLine === "function") {
    kwsPanelController.pushGeneralLogLine(text, kind);
  }
}

function startShellStageLoop(shellContext) {
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const createOrbRuntimeLoop =
    sharedModules &&
    sharedModules.orbRuntimeLoopModule &&
    sharedModules.orbRuntimeLoopModule.createOrbRuntimeLoop;
  const runOrbRuntimePipeline =
    sharedModules &&
    sharedModules.orbRuntimePipelineModule &&
    sharedModules.orbRuntimePipelineModule.runOrbRuntimePipeline;
  if (!runtime || typeof createOrbRuntimeLoop !== "function" || typeof runOrbRuntimePipeline !== "function") return;

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
    runFrame: ({ ts, dt, nowMs, wasOnGround }) => {
      updateShellFrameMetrics(shellContext, nowMs);
      const receiverHostRuntime = runtime.receiverHostRuntime || null;
      const mvp = (receiverHostRuntime && receiverHostRuntime.mvp) || runtime.mvp || null;
      const orbFxSystem =
        (receiverHostRuntime && receiverHostRuntime.runtimeContext && receiverHostRuntime.runtimeContext.orbFxSystem) ||
        (mvp && mvp.orbFxSystem) ||
        null;
      runOrbRuntimePipeline({
        ts,
        dt,
        nowMs,
        wasOnGround,
        orbRuntimeState: runtime.orbRuntimeState,
        phys: runtime.stage ? runtime.stage.phys : {},
        shieldDescent: runtime.stage ? runtime.stage.shieldDescent : {},
        mvp,
        orbFxSystem,
        worldSystem: runtime.stage ? runtime.stage.worldSystem : null,
        hooks: {
          clamp,
          getLateralBounds: () => shellLateralBounds(shellContext),
          getCameraSteeringState: () => (
            runtime.cameraInputOrbBridge && typeof runtime.cameraInputOrbBridge.getState === "function"
              ? runtime.cameraInputOrbBridge.getState()
              : null
          ),
          liftToThrustAccel: (l01) => {
            const phys = runtime.stage ? runtime.stage.phys : null;
            return Math.max(0, Number(phys && phys.thrustMax) || 0) * clamp01(l01);
          },
          isFloatGraceActive: (frameNowMs) => {
            const state = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
              ? runtime.orbRuntimeState.get()
              : null;
            return !!(state && state.floatGraceActive && Number(state.floatGraceUntilMs) > Number(frameNowMs || 0));
          },
          clearFloatGrace: () => {
            patchShellOrbRuntime(shellContext, {
              floatGraceActive: false,
              floatGraceUntilMs: 0,
            });
          },
          groundCenterWorld: () => shellGroundCenterWorld(shellContext),
          computeImpactMetric: (rawImpactV) => computeShellImpactMetric(shellContext, rawImpactV),
          drawStars: () => drawShellStars(shellContext),
          drawWorldBackdrop: () => drawShellBackdrop(shellContext),
          updateOrbStrokeColor: (frameDt) => updateShellOrbStrokeColor(shellContext, frameDt),
          applyOrbTransform: () => {
            applyShellGroundLine(shellContext);
            applyShellOrbTransform(shellContext);
          },
          updateDebugReadout: () => updateShellStageReadouts(shellContext),
        },
      });
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
    const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
    const receiverHostRuntime = runtime && runtime.receiverHostRuntime ? runtime.receiverHostRuntime : null;
    const mvp = (receiverHostRuntime && receiverHostRuntime.mvp) || (runtime && runtime.mvp) || null;
    resetShellOrbToGround(shellContext);
    const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
    clearShellDeathOverlaySchedule(shellContext);
    if (mvp && mvp.orbSystem && typeof mvp.orbSystem.revive === "function") {
      mvp.orbSystem.revive({ health: 300, atMs: performance.now() });
      mvp.lastImpact = null;
    }
    stopShellShardSim(shellContext);
    if (stage && stage.worldSystem && typeof stage.worldSystem.reset === "function") {
      stage.worldSystem.reset(performance.now());
    }
    const orbFxSystem =
      (receiverHostRuntime && receiverHostRuntime.runtimeContext && receiverHostRuntime.runtimeContext.orbFxSystem) ||
      (mvp && mvp.orbFxSystem) ||
      null;
    if (orbFxSystem && typeof orbFxSystem.reset === "function") {
      orbFxSystem.reset();
    }
    closeShellDeathOverlay(shellContext);
    renderShellOrbDamageVisuals(shellContext);
  });
}

function patchShellOrbRuntime(shellContext, patch = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbRuntimeState = runtime && runtime.orbRuntimeState;
  if (!orbRuntimeState || typeof orbRuntimeState.patch !== "function") return;
  orbRuntimeState.patch(patch);
}

function getShellOrbRuntime(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbRuntimeState = runtime && runtime.orbRuntimeState;
  if (!orbRuntimeState || typeof orbRuntimeState.get !== "function") return null;
  return orbRuntimeState.get();
}

function getShellOrbBaseVisualState(shellContext) {
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const buildOrbBaseVisualState =
    sharedModules &&
    sharedModules.orbBaseStateModule &&
    sharedModules.orbBaseStateModule.buildOrbBaseVisualState;
  if (typeof buildOrbBaseVisualState !== "function") {
    throw new Error("Missing orb base visual SSOT in shared staging modules");
  }
  const phys = runtime && runtime.stage ? runtime.stage.phys : null;
  return buildOrbBaseVisualState({ physics: phys });
}

function updateShellOrbStrokeColor(shellContext, dt) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbColorRuntime = runtime && runtime.orbColorRuntime;
  if (orbColorRuntime && typeof orbColorRuntime.update === "function") {
    orbColorRuntime.update(dt);
  }
}

function renderShellOrbDamageVisuals(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const mvp = runtime && runtime.receiverHostRuntime ? runtime.receiverHostRuntime.mvp : (runtime && runtime.mvp ? runtime.mvp : null);
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  if (!mvp || !mvp.orbDamageVisualsRuntime || !gameStagingAdapter || typeof gameStagingAdapter.renderOrbDamageVisuals !== "function") return;
  const fx = mvp.orbDamageVisualsRuntime.getState();
  gameStagingAdapter.renderOrbDamageVisuals({ fx });
}

function openShellDeathOverlay(shellContext) {
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  if (!gameStagingAdapter || typeof gameStagingAdapter.openDeathOverlay !== "function") return;
  gameStagingAdapter.openDeathOverlay();
}

function closeShellDeathOverlay(shellContext) {
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  if (!gameStagingAdapter || typeof gameStagingAdapter.closeDeathOverlay !== "function") return;
  gameStagingAdapter.closeDeathOverlay();
}

function clearShellDeathOverlaySchedule(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!runtime || !runtime.deathOverlayTO) return;
  clearTimeout(runtime.deathOverlayTO);
  runtime.deathOverlayTO = 0;
}

function scheduleShellDeathOverlay(shellContext, delayMs = 3000) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!runtime) return;
  clearShellDeathOverlaySchedule(shellContext);
  closeShellDeathOverlay(shellContext);
  runtime.deathOverlayTO = setTimeout(() => {
    runtime.deathOverlayTO = 0;
    openShellDeathOverlay(shellContext);
  }, Math.max(0, Number(delayMs) || 3000));
}

function stopShellShardSim(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const controller = runtime && runtime.orbShatterController;
  if (controller && typeof controller.stopShardSim === "function") {
    controller.stopShardSim();
    return;
  }
  const shatterRuntime = runtime && runtime.vfx && runtime.vfx.orbShatterRuntime;
  if (shatterRuntime && typeof shatterRuntime.clear === "function") {
    shatterRuntime.clear();
  }
}

function spawnShellShardFx(shellContext, payload) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
  if (shellVfx && typeof shellVfx.playOrbShatter === "function") {
    const result = shellVfx.playOrbShatter(payload);
    if (result && result.handled) return;
  }
  const controller = runtime && runtime.orbShatterController;
  if (!controller || typeof controller.spawnShardFx !== "function") return;
  controller.spawnShardFx(payload);
}

function clearShellOrbRuntimeFxForDeath(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
  if (shellVfx && shellVfx.shockwaveRuntime && typeof shellVfx.shockwaveRuntime.clear === "function") {
    shellVfx.shockwaveRuntime.clear();
  }
  if (shellVfx && shellVfx.flameAoeRuntime && typeof shellVfx.flameAoeRuntime.clear === "function") {
    shellVfx.flameAoeRuntime.clear();
  }
  if (shellVfx && shellVfx.electricAoeRuntime && typeof shellVfx.electricAoeRuntime.clear === "function") {
    shellVfx.electricAoeRuntime.clear();
  }
  if (shellVfx && shellVfx.bubbleShieldRuntime && typeof shellVfx.bubbleShieldRuntime.off === "function") {
    shellVfx.bubbleShieldRuntime.off();
  }
  if (shellVfx && shellVfx.orbNodRuntime && typeof shellVfx.orbNodRuntime.clear === "function") {
    shellVfx.orbNodRuntime.clear();
  }
  if (shellVfx && shellVfx.teleportRuntime && typeof shellVfx.teleportRuntime.clear === "function") {
    shellVfx.teleportRuntime.clear();
  }
  if (
    runtime &&
    runtime.cameraRuntime &&
    typeof runtime.cameraRuntime.clearTravel === "function"
  ) {
    runtime.cameraRuntime.clearTravel({ handled: false, canceled: true, reason: "death" });
  }
  shellClearColorize(shellContext);
}

function resetShellInputProcessingState(shellContext, atMs = performance.now()) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const receiverHostRuntime = runtime && runtime.receiverHostRuntime ? runtime.receiverHostRuntime : null;
  if (
    receiverHostRuntime &&
    receiverHostRuntime.inputSystemsBundle &&
    typeof receiverHostRuntime.inputSystemsBundle.resetProcessingState === "function"
  ) {
    receiverHostRuntime.inputSystemsBundle.resetProcessingState(atMs);
    return;
  }
  if (receiverHostRuntime && receiverHostRuntime.inputSystem && typeof receiverHostRuntime.inputSystem.reset === "function") {
    receiverHostRuntime.inputSystem.reset(atMs);
  }
  if (
    receiverHostRuntime &&
    receiverHostRuntime.inputDynamicsSystem &&
    typeof receiverHostRuntime.inputDynamicsSystem.reset === "function"
  ) {
    receiverHostRuntime.inputDynamicsSystem.reset(atMs);
  }
  if (
    receiverHostRuntime &&
    receiverHostRuntime.inputGestureSystem &&
    typeof receiverHostRuntime.inputGestureSystem.reset === "function"
  ) {
    receiverHostRuntime.inputGestureSystem.reset(atMs);
  }
}

function shellTeleportOrbToSpawnNeutralizePhysics(shellContext, aboveGroundPx = 0) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStageActions = runtime && runtime.gameStageActions ? runtime.gameStageActions : null;
  if (!gameStageActions || typeof gameStageActions.teleportOrbToSpawnNeutralizePhysics !== "function") {
    return { handled: false };
  }
  return gameStageActions.teleportOrbToSpawnNeutralizePhysics({
    aboveGroundPx,
    teleportOrbRuntimeToSpawn:
      runtime &&
      runtime.receiverSpellRuntime &&
      runtime.receiverSpellRuntime.teleportOrbRuntimeToSpawn,
  });
}

function shellGrantOrbGrace(shellContext, grace = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStageActions = runtime && runtime.gameStageActions ? runtime.gameStageActions : null;
  if (!gameStageActions || typeof gameStageActions.grantOrbGrace !== "function") return;
  gameStageActions.grantOrbGrace({
    grace,
    grantOrbGraceRuntime:
      runtime &&
      runtime.receiverSpellRuntime &&
      runtime.receiverSpellRuntime.grantOrbGraceRuntime,
  });
}

function createShellReceiverVfxDefaults() {
  return createGameStagingReceiverVfxDefaults({ evenStroke });
}

function initShellReceiverVfxRuntime(shellContext, mods = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const createVfxRuntimesBundle =
    sharedModules &&
    sharedModules.vfxRuntimesBundleModule &&
    sharedModules.vfxRuntimesBundleModule.createVfxRuntimesBundle;
  if (!runtime || typeof createVfxRuntimesBundle !== "function") return null;

  const {
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
  } = mods || {};
  const rootStyle = (
    shellContext &&
    shellContext.rootDocument &&
    shellContext.rootDocument.documentElement &&
    shellContext.rootDocument.documentElement.style
  ) || null;
  const vfxDefaults = runtime.vfxDefaults || createShellReceiverVfxDefaults();
  return initGameStagingReceiverVfxRuntime({
    runtime,
    stageEls: shellContext.stageEls || {},
    createVfxRuntimesBundle,
    rootStyle,
    vfxDefaults,
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
    clamp,
    clamp01,
    evenPx,
    evenStroke,
    rand,
    getOrbScaleFactor: () => getShellOrbScaleFactor(shellContext),
    getOrbDiameterPx: () => {
      const visualState = getShellOrbBaseVisualState(shellContext);
      return Math.max(1, Number(visualState && visualState.diameterPx) || 100);
    },
    requestCameraTravel: (payload = {}) => {
      const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
      return cameraRuntime && typeof cameraRuntime.requestTravel === "function"
        ? cameraRuntime.requestTravel(payload)
        : Promise.resolve({ handled: false });
    },
    cancelCameraTravel: () => {
      const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
      if (cameraRuntime && typeof cameraRuntime.clearTravel === "function") {
        cameraRuntime.clearTravel({ handled: false, canceled: true, reason: "teleport-clear" });
      }
    },
  });
}

function shellActivateBubbleShield(shellContext, { durationMs = 8000 } = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStageActions = runtime && runtime.gameStageActions ? runtime.gameStageActions : null;
  if (!gameStageActions || typeof gameStageActions.activateBubbleShield !== "function") return;
  gameStageActions.activateBubbleShield({ durationMs });
}

function shellApplyColorize(shellContext, payload = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStageActions = runtime && runtime.gameStageActions ? runtime.gameStageActions : null;
  if (!gameStageActions || typeof gameStageActions.applyColorize !== "function") return;
  gameStageActions.applyColorize(payload);
}

function shellClearColorize(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStageActions = runtime && runtime.gameStageActions ? runtime.gameStageActions : null;
  if (!gameStageActions || typeof gameStageActions.clearColorize !== "function") return;
  gameStageActions.clearColorize();
}

async function initShellReceiverHostRuntime(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const shellKws = runtime && runtime.kws ? runtime.kws : null;
  if (!runtime || !sharedModules || !shellKws) return null;

  const {
    IMPACT_TH,
    ENERGY_BANK_CAP,
    ENERGY_SHAKE_COST,
    ENERGY_CHARGE_RATE_PPS,
    INPUT_GESTURE_CFG,
    INPUT_DYNAMICS_CFG,
  } = createShellReceiverConfigs();

  const assembly = await bootstrapShellReceiverHostRuntimeAssembly({
    shellContext,
    runtime,
    sharedModules,
    shellKws,
    receiverConfigs: {
      ENERGY_BANK_CAP,
      ENERGY_SHAKE_COST,
      ENERGY_CHARGE_RATE_PPS,
      IMPACT_TH,
      INPUT_GESTURE_CFG,
      INPUT_DYNAMICS_CFG,
    },
    createReceiverStabilityVisualController,
    setLamp: setDevStagingLamp,
    stageAdapters: {
      normalizeWorldItemSpawn: (item) => (
        shellContext &&
        shellContext.gameStagingAdapter &&
        typeof shellContext.gameStagingAdapter.normalizeWorldItemSpawn === "function"
          ? shellContext.gameStagingAdapter.normalizeWorldItemSpawn(item, {
              groundCenterWorld: () => shellGroundCenterWorld(shellContext),
              clamp,
            })
          : null
      ),
      groundCenterWorld: () => shellGroundCenterWorld(shellContext),
      stageRect: () => shellStageRect(shellContext),
      pickupScreenY: (yW) => {
        const rect = shellStageRect(shellContext);
        const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, rect.height || 0);
        return (
          shellContext &&
          shellContext.gameStagingAdapter &&
          typeof shellContext.gameStagingAdapter.pickupScreenY === "function"
            ? shellContext.gameStagingAdapter.pickupScreenY(yW, { camTop })
            : (Number(yW || 0) - camTop)
        );
      },
      getOrbRuntime: () => (
        runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
          ? runtime.orbRuntimeState.get()
          : { yW: 0 }
      ),
      getOrbScreenX: () => {
        const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
          ? runtime.orbRuntimeState.get()
          : null;
        const bounds = shellLateralBounds(shellContext);
        return clamp(Number(orbState && orbState.xW) || shellStageCenterX(shellContext), bounds.left, bounds.right);
      },
      getOrbScreenY: () => shellOrbScreenY(shellContext),
      getOrbVisualRadiusPx: () => {
        const visualState = getShellOrbBaseVisualState(shellContext);
        const visualRadiusPx = Number(visualState && visualState.radiusPx);
        if (Number.isFinite(visualRadiusPx) && visualRadiusPx > 0) return visualRadiusPx;
        return Number(runtime.stage && runtime.stage.phys && runtime.stage.phys.orbRadiusPx) || 0;
      },
      axisToColor01,
      getPhys: () => (runtime.stage ? runtime.stage.phys : {}),
      getWorldSystem: () => (runtime.stage ? runtime.stage.worldSystem : null),
      getWorldItemSpawns: () => (
        shellContext &&
        shellContext.gameStagingAdapter &&
        typeof shellContext.gameStagingAdapter.getWorldItemSpawns === "function"
          ? shellContext.gameStagingAdapter.getWorldItemSpawns()
          : []
      ),
      getOrbRuntimeLoop: () => runtime.orbRuntimeLoop,
    },
    shellHooks: {
      flashShakeLamp: () => flashShellShakeLamp(shellContext, 400),
      triggerShockwave: () => {
        const shellVfx = runtime.vfx || null;
        if (shellVfx && typeof shellVfx.triggerShockwave === "function") {
          shellVfx.triggerShockwave();
        }
      },
      forceShakeLampOff: () => forceShellShakeLampOff(shellContext),
      clearDirLampTimers: () => clearShellDirectionLampTimers(shellContext),
      allDirLampOff: () => allShellDirectionLampsOff(shellContext),
      flashDirLampPair: (a, b, ms) => flashShellDirectionLampPair(shellContext, a, b, ms),
      flashDirLampSingle: (code, ms) => flashShellDirectionLampSingle(shellContext, code, ms),
      renderOrbDamageVisuals: () => renderShellOrbDamageVisuals(shellContext),
      spawnShardFx: (payload) => spawnShellShardFx(shellContext, payload),
      clearOrbRuntimeFxForDeath: () => clearShellOrbRuntimeFxForDeath(shellContext),
      scheduleDeathOverlay: () => scheduleShellDeathOverlay(shellContext, 3000),
      clearDeathOverlaySchedule: () => clearShellDeathOverlaySchedule(shellContext),
      closeDeathOverlay: () => closeShellDeathOverlay(shellContext),
      stopShardSim: () => stopShellShardSim(shellContext),
      orbShatterController: runtime.orbShatterController || null,
      setOrbInputSuppressed: (next) => { runtime.orbInputSuppressed = !!next; },
      playElectricAoe: () => {
        const shellVfx = runtime.vfx || null;
        return shellVfx && typeof shellVfx.playElectricAoe === "function" ? shellVfx.playElectricAoe() : { handled: false };
      },
      playOrbNod: (payload = {}) => {
        const shellVfx = runtime.vfx || null;
        return shellVfx && typeof shellVfx.playOrbNod === "function" ? shellVfx.playOrbNod(payload) : { handled: false };
      },
      grantOrbGrace: (grace) => shellGrantOrbGrace(shellContext, grace),
      clearFloatGrace: () => {
        patchShellOrbRuntime(shellContext, { floatGraceActive: false, floatGraceUntilMs: 0 });
      },
      resetOrbStrokeColor: () => shellClearColorize(shellContext),
      updateDebugReadout: () => {},
    },
  });
  if (!assembly) return null;

  const {
    receiverHostState,
    runtimeContext,
    runInputFramePipelineImported,
    applyStabilityVisuals,
  } = assembly;

  if (runtime.stage) {
    runtime.stage.worldSystem = runtimeContext && runtimeContext.worldSystem ? runtimeContext.worldSystem : null;
  }

  const processIncomingImpulse = attachShellReceiverHostImpulseAdapter({
    receiverHostState,
    runtime,
    runInputFramePipelineImported,
    inputDynamicsConfig: INPUT_DYNAMICS_CFG,
    inputGestureConfig: INPUT_GESTURE_CFG,
    applyStabilityVisuals,
    computeLift01,
    pickShakeMetric,
  });
  if (runtime.receiverHostRuntime && typeof processIncomingImpulse === "function") {
    runtime.receiverHostRuntime.processIncomingImpulse = processIncomingImpulse;
  }
  return runtime.receiverHostRuntime;
}

function bindShellRuleActionRuntime({
  shellContext,
  eventBus,
  ruleSchema = null,
  executeWordCastAction = () => ({ handled: false }),
  kwsBridge = null,
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function") {
    return { dispose() {} };
  }
  const bindings = (ruleSchema && ruleSchema.eventRuntimeBindings && typeof ruleSchema.eventRuntimeBindings === "object")
    ? ruleSchema.eventRuntimeBindings
    : Object.create(null);
  const off = eventBus.on("rule_engine.action_executed", (p = {}) => {
    const actionType = String(p.actionType || "").trim().toLowerCase();
    const actionId = String(p.actionId || "").trim().toLowerCase();
    if (actionType !== "event") return;
    const binding = bindings[actionId] || null;
    const runtime = binding && binding.runtime && typeof binding.runtime === "object"
      ? binding.runtime
      : null;
    const kind = String(runtime && runtime.kind || "").trim().toLowerCase();
    if (kind !== "cast_action") return;
    const castActionId = String(runtime && runtime.castActionId || "").trim().toLowerCase();
    if (!castActionId) return;
    const result = executeWordCastAction(castActionId, {
      intent: "rule_engine.event",
      payload: {
        trigger: "rule_engine",
        actionId,
        ruleId: String(p.ruleId || ""),
        atMs: Number(p.atMs) || performance.now(),
        ...(p && typeof p.args === "object" ? p.args : {}),
      },
    });
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(`TRACE exec:${castActionId}:${result && result.handled ? "ok" : "miss"}`, result && result.handled ? "ok" : "warn");
    }
  });
  return {
    dispose() {
      try { off(); } catch (_) {}
    },
  };
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

function createGameStagingAdapter(gameStagingView = null) {
  if (gameStagingView && gameStagingView.adapter && typeof gameStagingView.adapter.getStageElements === "function") {
    return gameStagingView.adapter;
  }
  const refs = gameStagingView && gameStagingView.refs ? gameStagingView.refs : Object.create(null);
  return Object.freeze({
    refs,
    getStageElements() {
      return createLegacyLikeStageElements({ game: refs });
    },
  });
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
    const now = resolveShellEventAtMs(payload.atMs);
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
      kwsBridge.pushLogLine(
        `TRACE wake_open:${wake.windowId}:words:${Array.isArray(wake.words) && wake.words.length ? wake.words.join(",") : "-"}:ttl:${Number(wake.ttlMs) || 0}:at:${now}`,
        "ok"
      );
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

function bindShellWakeWindowVisuals({ eventBus, kwsPanelController = null, kwsBridge = null } = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || !kwsPanelController) {
    return { dispose() {} };
  }

  const activeWakeWindowTokensByWindowId = new Map();
  let wakeWindowExpiryTO = 0;

  function clearWakeWindowExpiryTimer() {
    if (!wakeWindowExpiryTO) return;
    clearTimeout(wakeWindowExpiryTO);
    wakeWindowExpiryTO = 0;
  }

  function syncWakeWindowVisualTokens() {
    if (typeof kwsPanelController.setManualWakeWindowTokens !== "function") return;
    const now = Date.now();
    const activeTokens = [];
    const activeWindows = [];
    const windowDebug = [];
    for (const [windowId, entry] of activeWakeWindowTokensByWindowId.entries()) {
      windowDebug.push(
        `${Array.isArray(entry.tokens) ? entry.tokens.join(",") : "-"}@${Number(entry.expiresAtMs || 0)}`
      );
      if (Number(entry.expiresAtMs || 0) <= now) continue;
      activeTokens.push(...entry.tokens);
      activeWindows.push({
        windowId,
        tokens: Array.isArray(entry.tokens) ? entry.tokens.slice() : [],
        expiresAtMs: Number(entry.expiresAtMs || 0),
      });
    }
    kwsPanelController.setManualWakeWindowTokens(Array.from(new Set(activeTokens)));
    if (typeof kwsPanelController.setManualWakeWindows === "function") {
      kwsPanelController.setManualWakeWindows(activeWindows);
    }
    if (typeof kwsPanelController.refreshPathBoard === "function") {
      kwsPanelController.refreshPathBoard();
    }
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(
        `TRACE tree.visual tokens:${activeTokens.length ? Array.from(new Set(activeTokens)).join(",") : "-"} windows:${windowDebug.length ? windowDebug.join("|") : "-"}`,
        "muted"
      );
    }
  }

  function scheduleWakeWindowExpirySweep() {
    clearWakeWindowExpiryTimer();
    let nextExpiry = 0;
    for (const entry of activeWakeWindowTokensByWindowId.values()) {
      const expiresAtMs = Number(entry.expiresAtMs || 0);
      if (!expiresAtMs) continue;
      if (!nextExpiry || expiresAtMs < nextExpiry) nextExpiry = expiresAtMs;
    }
    if (!nextExpiry) return;
    wakeWindowExpiryTO = setTimeout(() => {
      wakeWindowExpiryTO = 0;
      const now = Date.now();
      for (const [windowId, entry] of activeWakeWindowTokensByWindowId.entries()) {
        if (Number(entry.expiresAtMs || 0) <= now) {
          activeWakeWindowTokensByWindowId.delete(windowId);
        }
      }
      syncWakeWindowVisualTokens();
      scheduleWakeWindowExpirySweep();
    }, Math.max(0, nextExpiry - Date.now()));
  }

  const off = eventBus.on("rule_engine.wake_win_opened", (payload = {}) => {
    const windowId = String(payload.windowId || payload.actionId || "").trim().toLowerCase();
    const tokens = (Array.isArray(payload.words) ? payload.words : [])
      .map((token) => normalizeShellToken(token))
      .filter(Boolean);
    if (!windowId || !tokens.length) return;
    const atMs = resolveShellEventAtMs(payload.atMs);
    const ttlMs = Math.max(250, Number(payload.ttlMs) || 1500);
    activeWakeWindowTokensByWindowId.set(windowId, {
      tokens,
      expiresAtMs: atMs + ttlMs,
    });
    syncWakeWindowVisualTokens();
    scheduleWakeWindowExpirySweep();
  });

  return {
    dispose() {
      clearWakeWindowExpiryTimer();
      try { off(); } catch (_) {}
    },
  };
}

function createStagingShellContext({
  rootDocument,
  devStagingView,
  gameStagingView,
  currentLevel = LEVEL01,
  sharedModules,
} = {}) {
  const surfaceRefs = createShellSurfaceRefs({ devStagingView, gameStagingView });
  const gameStagingAdapter = createGameStagingAdapter(gameStagingView);
  const stageEls = gameStagingAdapter.getStageElements();
  return {
    rootDocument,
    views: {
      devStagingView,
      gameStagingView,
    },
    currentLevel,
    refs: surfaceRefs,
    gameStagingAdapter,
    stageEls,
    sharedModules,
    runtime: {
      bootStatus: STAGING_SHELL_STATUS.sharedModulesReady,
      receiverModulesReady: false,
      signalProcessor: null,
      motionStore: null,
      cameraRuntime: createCameraRuntime({
        now: () => performance.now(),
      }),
      cameraInput: null,
      cameraInputOrbBridge: null,
      mvp: null,
      frameMetrics: null,
      stageRectCache: null,
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

function bindShellCameraInputPopup(shellContext) {
  const devRefs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const cameraInputRuntime = shellContext && shellContext.runtime ? shellContext.runtime.cameraInput : null;
  if (!devRefs || !cameraInputRuntime) return null;
  let latestCameraState = typeof cameraInputRuntime.getState === "function"
    ? cameraInputRuntime.getState()
    : null;
  let gameplayInterval = 0;

  const cameraInputPopup = createCameraInputPopup({
    els: devRefs,
    onOpenChange: (isOpen) => {
      if (isOpen) {
        if (latestCameraState) cameraInputPopup.renderState(latestCameraState);
        renderGameplayState();
        if (!gameplayInterval) {
          gameplayInterval = setInterval(renderGameplayState, 120);
        }
      } else if (gameplayInterval) {
        clearInterval(gameplayInterval);
        gameplayInterval = 0;
      }
    },
  });
  cameraInputPopup.bind();
  if (latestCameraState && cameraInputPopup.isOpen()) {
    cameraInputPopup.renderState(latestCameraState);
  }
  function renderGameplayState() {
    if (!cameraInputPopup.isOpen()) return;
    const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
    cameraInputPopup.renderGameplayState({
      steering: runtime && runtime.cameraInputOrbBridge && typeof runtime.cameraInputOrbBridge.getState === "function"
        ? runtime.cameraInputOrbBridge.getState()
        : null,
      orb: runtime && runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
        ? runtime.orbRuntimeState.get()
        : null,
    });
  }
  const unsubscribe = typeof cameraInputRuntime.subscribe === "function"
    ? cameraInputRuntime.subscribe((state) => {
        latestCameraState = state;
        if (cameraInputPopup.isOpen()) {
          cameraInputPopup.renderState(state);
        }
      })
    : () => {};

  return {
    cameraInputPopup,
    dispose() {
      if (gameplayInterval) clearInterval(gameplayInterval);
      try { unsubscribe(); } catch (_) {}
    },
  };
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
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  if (!runtime || !gameStagingAdapter || typeof gameStagingAdapter.ensureBackdrop !== "function" || !rootDocument) return;

  const rect = shellStageRect(shellContext);
  const terrainProfile = Array.isArray(shellContext && shellContext.currentLevel && shellContext.currentLevel.terrainProfile)
    ? shellContext.currentLevel.terrainProfile
    : [];
  gameStagingAdapter.ensureBackdrop({
    runtime,
    rootDocument,
    rect,
    worldHeight: shellWorldHeight(shellContext),
    terrainProfile,
    clamp01,
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
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !gameStagingAdapter || typeof gameStagingAdapter.drawStars !== "function" || !stageBackdrop) return;
  const h = stageBackdrop.height || 0;
  const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, h);
  gameStagingAdapter.drawStars({
    runtime,
    camTop,
  });
}

function drawShellBackdrop(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const gameStagingAdapter = shellContext && shellContext.gameStagingAdapter ? shellContext.gameStagingAdapter : null;
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !gameStagingAdapter || typeof gameStagingAdapter.drawBackdrop !== "function" || !stageBackdrop) return;
  const groundY = shellGroundLineScreenY(shellContext);
  gameStagingAdapter.drawBackdrop({
    runtime,
    groundY,
  });
}

function syncShellStartQrSize(rootDocument) {
  const startQr = rootDocument.getElementById("startQr");
  if (!startQr) return 0;
  const qrSizePx = Math.max(240, Math.round(Math.min(rootDocument.defaultView.innerWidth * 0.4, 320)));
  startQr.style.width = `${qrSizePx}px`;
  startQr.style.height = `${qrSizePx}px`;
  startQr.dataset.titleWidthPx = String(qrSizePx);
  return qrSizePx;
}

function stagingMobilePageBaseUrl(rootDocument) {
  try {
    return new URL("../../transmitter/mobile-transmitter.html", rootDocument.defaultView.location.href).toString();
  } catch (_) {
    return "https://scrubbl3r.github.io/OrbisArcana/src/runtime-shell/transmitter/mobile-transmitter.html";
  }
}

async function initShellKwsRuntime(shellContext) {
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const devRefs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  if (!sharedModules || !runtime || !devRefs) return null;
  const bindKwsEventHandlers =
    sharedModules.kwsEventBindingsModule &&
    sharedModules.kwsEventBindingsModule.bindKwsEventHandlers;

  if (
    typeof bindKwsEventHandlers !== "function"
  ) {
    return null;
  }

  const base = await bootstrapShellKwsRuntimeBase({
    sharedModules,
    runtime,
    devRefs,
    createDevStagingPanelElements: createDevStagingPanelElementsFromView,
    readNumberInputOrNull,
  });
  if (!base) return null;

  const {
    eventBus,
    receiverMods,
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    kwsWordProvider,
    kwsVoiceProvider,
    voiceProviderManager,
    kwsListenPolicyController,
    kwsDebugState,
    kwsBackendKey,
    runtimeConfig,
    receiverEvents: RECEIVER_EVENTS,
  } = base;

  const {
    createRuleEnginePreviewSystem,
    createSpellCastExecutor,
    createSpellActionHandlersImported,
    executeAoeElectric,
    executeAoeFlame,
    executeTeleport,
    executeBubbleShield,
    executeColorize,
    executeShockwave,
    CAST_ACTION_REGISTRY_BY_ID,
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
    teleportOrbRuntimeToSpawn,
    grantOrbGraceRuntime,
    hydrateReceiverVfxDefaults,
    BUBBLE_SHIELD_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    TELEPORT_PRESET_DEFAULT,
    ORB_NOD_PRESET_DEFAULT,
  } = receiverMods;

  if (
    typeof createRuleEnginePreviewSystem !== "function" ||
    typeof createSpellCastExecutor !== "function" ||
    typeof createSpellActionHandlersImported !== "function"
  ) {
    return null;
  }

  const hydrateReceiverBootstrapState =
    sharedModules.receiverBootstrapModule &&
    sharedModules.receiverBootstrapModule.hydrateReceiverBootstrapState;

  let ruleSchema = null;
  let runtimeWordIndex = Object.create(null);
  let runtimeSpellIndex = Object.create(null);
  const vfxDefaults = createShellReceiverVfxDefaults();
  if (typeof hydrateReceiverBootstrapState === "function") {
    hydrateReceiverBootstrapState(
      {
        ...sharedModules.receiverBootstrapModule,
        ...receiverMods,
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
          GRACE_DEFAULT_TTL_MS: 0,
        }),
        setOrbStatusConfig: () => {},
        vfxDefaults,
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
  if (typeof hydrateReceiverVfxDefaults === "function") {
    hydrateReceiverVfxDefaults(vfxDefaults, {
      bubbleShield: BUBBLE_SHIELD_PRESET_DEFAULT,
      shockwave: SHOCKWAVE_PRESET_DEFAULT,
      flameAoe: FLAME_AOE_PRESET_DEFAULT,
      electricAoe: ELECTRIC_AOE_PRESET_DEFAULT,
      teleport: TELEPORT_PRESET_DEFAULT,
      orbNod: ORB_NOD_PRESET_DEFAULT,
    });
  }
  runtime.vfxDefaults = vfxDefaults;
  const shellVfx = initShellReceiverVfxRuntime(shellContext, {
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
  });
  runtime.gameStageActions = createGameStagingOrbActionBridge({
    runtime,
    shieldEl: shellContext && shellContext.stageEls ? shellContext.stageEls.shield : null,
    patchOrbRuntime: (patch = {}) => patchShellOrbRuntime(shellContext, patch),
    getOrbRuntime: () => getShellOrbRuntime(shellContext),
    applyOrbTransform: () => applyShellOrbTransform(shellContext),
    applyGroundLine: () => applyShellGroundLine(shellContext),
    groundCenterWorld: () => shellGroundCenterWorld(shellContext),
    updateDebugReadout: () => updateShellStageReadouts(shellContext),
    resetInputProcessingState: (atMs) => resetShellInputProcessingState(shellContext, atMs),
    performanceNow: () => performance.now(),
    clamp,
  });

  let ruleEnginePreviewSystem = null;
  if (ruleSchema) {
    ruleEnginePreviewSystem = createRuleEnginePreviewSystem({
      eventBus,
      schema: ruleSchema,
      executeActions: true,
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

  const kwsListenPolicySyncOff = eventBus.on("voice.kws_listen_policy_changed", (payload = {}) => {
    const tokens = Array.isArray(payload.listenableTokens) ? payload.listenableTokens : [];
    if (kwsPanelController && typeof kwsPanelController.setManualListenableTokens === "function") {
      kwsPanelController.setManualListenableTokens(tokens);
    }
    if (kwsPanelController && typeof kwsPanelController.refreshPathBoard === "function") {
      kwsPanelController.refreshPathBoard();
    }
    if (kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine(
        `TRACE tree.policy tokens:${tokens.length ? tokens.join(",") : "-"}`,
        "muted"
      );
    }
  });

  const kwsRootWakeBridge = bindShellRootWakeWindows({
    eventBus,
    receiverEvents: RECEIVER_EVENTS,
    kwsBridge,
  });
  const kwsWakeWindowVisuals = bindShellWakeWindowVisuals({
    eventBus,
    kwsPanelController,
    kwsBridge,
  });

  const kwsRuleTraceOff = eventBus.on("rule_engine.preview_matched", (payload = {}) => {
    const ruleId = String(payload.ruleId || "").trim().toLowerCase();
    if (!ruleId || !kwsBridge || typeof kwsBridge.pushLogLine !== "function") return;
    kwsBridge.pushLogLine(`TRACE matched:${ruleId}`, "ok");
  });
  const kwsActionTraceOff = eventBus.on("rule_engine.action_executed", (payload = {}) => {
    const actionType = String(payload.actionType || "").trim().toLowerCase();
    const actionId = String(payload.actionId || "").trim().toLowerCase();
    if (!kwsBridge || typeof kwsBridge.pushLogLine !== "function") return;
    kwsBridge.pushLogLine(`TRACE action:${actionType}:${actionId}`, "ok");
  });
  const orbVisualTraceOff = () => {};
  const orbDiedTraceOff = () => {};
  const orbShatterStartTraceOff = () => {};
  const orbShatterCompleteTraceOff = () => {};
  runtime.eventBus = eventBus;
  runtime.receiverSpellRuntime = {
    teleportOrbRuntimeToSpawn: (typeof teleportOrbRuntimeToSpawn === "function") ? teleportOrbRuntimeToSpawn : null,
    grantOrbGraceRuntime: (typeof grantOrbGraceRuntime === "function") ? grantOrbGraceRuntime : null,
  };
  const shellSpellActionHandlers = createSpellActionHandlersImported({
    eventBus,
    playElectricAoe: () => (
      shellVfx && typeof shellVfx.playElectricAoe === "function"
        ? shellVfx.playElectricAoe()
        : { handled: false }
    ),
    playFlameAoe: () => (
      shellVfx && typeof shellVfx.playFlameAoe === "function"
        ? shellVfx.playFlameAoe()
        : { handled: false }
    ),
    playTeleport: (payload = {}) => (
      shellVfx && typeof shellVfx.playTeleport === "function"
        ? shellVfx.playTeleport(payload)
        : { handled: false }
    ),
    playFrostAoe: null,
    executeAoeElectric,
    executeAoeFlame,
    executeAoeFrost: null,
    executeTeleport,
    executeShockwave,
    executeBubbleShield,
    executeColorize,
    triggerShockwave: () => (
      shellVfx && typeof shellVfx.triggerShockwave === "function"
        ? shellVfx.triggerShockwave()
        : { handled: false }
    ),
    teleportOrbToSpawnNeutralizePhysics: (aboveGroundPx) => shellTeleportOrbToSpawnNeutralizePhysics(shellContext, aboveGroundPx),
    activateBubbleShield: ({ durationMs } = {}) => shellActivateBubbleShield(shellContext, { durationMs }),
    applyColorize: (payload) => shellApplyColorize(shellContext, payload),
    clearColorize: () => shellClearColorize(shellContext),
    domusTeleportAboveGroundPx: 300,
    bubbleShieldMs: 8000,
  });
  const getShellDefaultGraceTtlMs = () => resolveOrbGraceDefaultTtlMs(
    runtime && runtime.stage ? runtime.stage.statusConfig : null,
    2500
  );
  const shellSpellCastExecutor = createSpellCastExecutor({
    castActionRegistryById: CAST_ACTION_REGISTRY_BY_ID,
    handlers: shellSpellActionHandlers,
    grantOrbGrace: (grace) => shellGrantOrbGrace(shellContext, grace),
    getCastGateState: () => {
      const runtimeContext = runtime && runtime.receiverHostRuntime && runtime.receiverHostRuntime.runtimeContext
        ? runtime.receiverHostRuntime.runtimeContext
        : null;
      const orb = runtimeContext && runtimeContext.gameState ? runtimeContext.gameState.orb : null;
      return getSharedOrbCastGateState(orb);
    },
    defaultGraceTtlMs: getShellDefaultGraceTtlMs(),
  });
  const executeShellWordCastAction = (castActionId, context = {}) => {
    if (!shellSpellCastExecutor || typeof shellSpellCastExecutor.execute !== "function") {
      return { handled: false, skipped: "executor_unavailable" };
    }
    return shellSpellCastExecutor.execute(castActionId, context);
  };
  const shellRuleActionRuntime = bindShellRuleActionRuntime({
    shellContext,
    eventBus,
    ruleSchema,
    executeWordCastAction: executeShellWordCastAction,
    kwsBridge,
  });

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
    kwsListenPolicySyncOff,
    kwsRootWakeBridge,
    kwsWakeWindowVisuals,
    kwsRuleTraceOff,
    kwsActionTraceOff,
    orbVisualTraceOff,
    orbDiedTraceOff,
    orbShatterStartTraceOff,
    orbShatterCompleteTraceOff,
    shellSpellActionHandlers,
    shellSpellCastExecutor,
    shellRuleActionRuntime,
    receiverMods,
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
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const bootStatusController = shellContext && shellContext.bootStatus ? shellContext.bootStatus : null;
  const updateBootUi = (_rootDocument, phase, detail, state = "booting") => {
    if (!bootStatusController || typeof bootStatusController.setStatus !== "function") return;
    bootStatusController.setStatus({ phase, detail, state });
  };
  await bootstrapShellPairingRuntime({
    shellContext,
    workerBase: STAGING_WORKER_BASE,
    updateBootUi,
    bootStatus: STAGING_SHELL_STATUS,
    stagingMobilePageBaseUrl,
    syncStartQrSize: syncShellStartQrSize,
    handleImpulseFrame: (data) => handleShellImpulseFrame(shellContext, data),
    formatPhoneImpulseLogLine,
    onVoiceModeOpenWorld: () => {
      const shellKws = shellContext.runtime && shellContext.runtime.kws ? shellContext.runtime.kws : null;
      const receiverEvents = shellKws && shellKws.receiverEvents ? shellKws.receiverEvents : null;
      if (runtime && runtime.mvp && runtime.mvp.eventBus && receiverEvents && receiverEvents.EVT_VOICE_SET_MODE) {
        runtime.mvp.eventBus.emit(receiverEvents.EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
      }
    },
  });
}

export async function createStagingShellRuntime({
  rootDocument = document,
  moduleCacheBustV = "20260420l",
  bootStatus = null,
} = {}) {
  const docEl = rootDocument.documentElement;
  const devRoot = rootDocument.getElementById("devStagingMount");
  const gameRoot = rootDocument.getElementById("gameStagingMount");

  if (docEl) {
    docEl.dataset.stagingShell = STAGING_SHELL_STATUS.splitPrototype;
    docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.booting;
  }
  if (bootStatus && typeof bootStatus.setStatus === "function") {
    bootStatus.setStatus({
      phase: STAGING_SHELL_STATUS.booting,
      detail: "Mounting dev-staging and game-staging",
      state: "booting",
    });
  }

  const currentLevel = LEVEL01;
  const devStagingView = devRoot ? mountDevStaging(devRoot) : null;
  const gameStagingView = gameRoot ? renderGameStaging(gameRoot, { level: currentLevel }) : null;

  if (devStagingView && typeof devStagingView.setStatus === "function") {
    devStagingView.setStatus("Booting staging shell…", "devStagingDim");
  }
  if (devStagingView && devStagingView.refs) {
    safeSetText(devStagingView.refs.rulesReadout, "boot:staging-shell");
  }

  try {
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.booting,
        detail: "Loading shared staging modules",
        state: "booting",
      });
    }
    const sharedModules = await loadStagingInitModules(moduleCacheBustV);
    if (docEl) {
      docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.sharedModulesReady;
    }
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.sharedModulesReady,
        detail: "Shared staging modules loaded",
        state: "booting",
      });
    }
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
      currentLevel,
      sharedModules,
    });
    shellContext.bootStatus = bootStatus;
    const createOrbColorRuntime =
      sharedModules.orbColorRuntimeModule &&
      sharedModules.orbColorRuntimeModule.createOrbColorRuntime;
    const gameStagingRoot = gameStagingView && gameStagingView.root
      ? gameStagingView.root
      : null;
    shellContext.runtime.orbColorRuntime = (typeof createOrbColorRuntime === "function")
      ? createOrbColorRuntime({
          root: gameStagingRoot,
          getBaseVisualState: () => getShellOrbBaseVisualState(shellContext),
        })
      : null;
    if (shellContext.runtime.orbColorRuntime && typeof shellContext.runtime.orbColorRuntime.reset === "function") {
      shellContext.runtime.orbColorRuntime.reset(true);
    }
    shellContext.runtime.signalProcessor = (typeof window.createSignalProcessor === "function")
      ? window.createSignalProcessor({})
      : null;
    shellContext.runtime.motionStore = (typeof window.createMotionStore === "function")
      ? window.createMotionStore()
      : null;
    renderShellHudFromMotionStore(shellContext);
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.sharedModulesReady,
        detail: "Preloading camera input runtime",
        state: "booting",
      });
    }
    if (devStagingView && typeof devStagingView.setStatus === "function") {
      devStagingView.setStatus("Preloading camera input…", "devStagingDim");
    }
    const bootstrapCameraInput =
      sharedModules.cameraInputBootstrapModule &&
      sharedModules.cameraInputBootstrapModule.bootstrapCameraInput;
    if (typeof bootstrapCameraInput !== "function") {
      throw new Error("camera_input_bootstrap_missing");
    }
    shellContext.runtime.cameraInput = await bootstrapCameraInput({
      rootWindow: rootDocument.defaultView,
      rootDocument,
      eventBus: shellContext.runtime.eventBus,
      preferredHand: "Left",
    });
    shellContext.runtime.cameraInputOrbBridge = createCameraInputOrbBridge({
      cameraInputRuntime: shellContext.runtime.cameraInput,
    });
    shellContext.runtime.cameraInputDebug = bindShellCameraInputPopup(shellContext);
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.sharedModulesReady,
        detail: "Booting KWS runtime",
        state: "booting",
      });
    }
    await initShellKwsRuntime(shellContext);
    initializeShellStageRuntime(shellContext);
    const gameStagingAdapter = shellContext.gameStagingAdapter || null;
    shellContext.runtime.orbShatterController = (
      gameStagingAdapter &&
      typeof gameStagingAdapter.createOrbShatterController === "function" &&
      shellContext.runtime.vfx &&
      shellContext.runtime.vfx.orbShatterRuntime
    )
      ? gameStagingAdapter.createOrbShatterController({
          root: gameStagingRoot,
          getOrbShatterRuntime: () => (
            shellContext.runtime && shellContext.runtime.vfx
              ? shellContext.runtime.vfx.orbShatterRuntime
              : null
          ),
          getOrbColorState: () => (
            shellContext.runtime &&
            shellContext.runtime.orbColorRuntime &&
            typeof shellContext.runtime.orbColorRuntime.getCurrentState === "function"
              ? shellContext.runtime.orbColorRuntime.getCurrentState()
              : null
          ),
          getBaseFillAlpha: () => 0.20,
          clamp,
          clamp01,
        })
      : null;
    await initShellReceiverHostRuntime(shellContext);
    activateShellStageVisuals(shellContext);
    bindShellStageResize(shellContext);
    bindShellStageActions(shellContext);
    startShellStageLoop(shellContext);
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.localStageReady,
        detail: "Local game-staging runtime active",
        state: "booting",
      });
    }
    await initShellPairingRuntime(shellContext);
    exposeShellContext(rootDocument, shellContext);
    return shellContext;
  } catch (error) {
    if (docEl) {
      docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.bootFailed;
    }
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.bootFailed,
        detail: error && error.message ? String(error.message) : "Unknown staging shell boot error",
        state: "failed",
      });
    }
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
