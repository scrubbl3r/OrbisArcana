import { mountDevStaging } from "../dev-staging/dev-staging.js?v=20260421j";
import { createDevStagingPanelElementsFromView } from "../dev-staging/dev-staging-panel.js?v=20260421j";
import {
  allDevStagingDirectionLampsOff,
  clearDevStagingDirectionLampTimers,
  flashDevStagingDirectionLampPair,
  flashDevStagingDirectionLampSingle,
  flashDevStagingShakeLamp,
  forceDevStagingShakeLampOff,
  setDevStagingLamp,
} from "../dev-staging/dev-staging-lamps.js";
import { renderOrbStage } from "../orb-stage/orb-stage.js?v=20260425w";
import { LEVELS_BY_ID } from "../../../content/levels/registry.js";
import { normalizeLevelDefinition } from "../../../game-runtime/level/normalize-level-definition.js";
import { createOrbStageReceiverVfxDefaults, initOrbStageReceiverVfxRuntime } from "../orb-stage/orb-stage-vfx-runtime.js?v=20260506e";
import { createOrbStageActionBridge } from "../orb-stage/orb-stage-action-bridge.js?v=20260504a";
import { loadStagingInitModules } from "../load-staging-init-modules.js?v=20260428a";
import { createReceiverStabilityVisualController } from "../../receiver/stability-visuals.js";
import { bootstrapShellReceiverHostRuntimeAssembly } from "./receiver-host-runtime-bootstrap.js?v=20260429c";
import { attachShellReceiverHostImpulseAdapter } from "./receiver-host-impulse-adapter.js";
import { bootstrapShellPairingRuntime } from "./pairing-runtime-bootstrap.js?v=20260423a";
import { bootstrapShellKwsRuntimeBase } from "./kws-runtime-bootstrap.js";
import {
  createStagingShellModeController,
  STAGING_DEV_STAGE_VISIBILITY,
  STAGING_SHELL_MODE,
} from "./staging-shell-mode-controller.js?v=20260421a";
import { renderLevelStage } from "../level-stage/level-stage.js?v=20260506e";
import { INTERACTION_GRAPH_V2 } from "../../../content/interactions-v2/interaction-graph-v2.js?v=20260504a";
import { createCameraRuntime } from "../../../game-runtime/camera/camera-runtime.js";
import { getOrbCastGateState as getSharedOrbCastGateState } from "../../../game-runtime/orb/orb-cast-policy.js";
import { resolveOrbGraceDefaultTtlMs } from "../../../game-runtime/orb/orb-grace.js";
import { resolveOrbSpinColor } from "../../../game-runtime/orb/orb-spin-color.js?v=20260502b";
import { ACTIVE_WORDS_BY_ID } from "../../../voice/wordbook.js";
import { createCameraInputPanelController } from "../../../ui/dev-console/camera-input/camera-input-panel-controller.js?v=20260421i";
import { createCameraInputOrbBridge } from "./camera-input-orb-bridge.js?v=20260501e";
import {
  resolveLevelCameraAnchor,
  resolveLevelSpawnPoint,
} from "../../../game-runtime/level/resolve-level-spawn-point.js";
import { buildBoundarySegmentsFromLoops } from "../../../game-runtime/collision/boundary-segments.js?v=20260423g";
import { loadAuthoredLevelScene } from "../load-authored-level-scene.js?v=20260430a";
import {
  resolveStageCameraClampBounds,
  resolveStageCameraConfig,
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../authored-level-camera.js?v=20260424c";
import { createPerfTrace } from "../perf-trace.js?v=20260430b";

globalThis.__orbisStagingShellRuntimeVersion = "20260506d";

export const STAGING_SHELL_STATUS = Object.freeze({
  booting: "booting",
  sharedModulesReady: "shared-modules-ready",
  localStageReady: "local-stage-ready",
  pairingBooting: "pairing-booting",
  pairingReady: "pairing-ready",
  bootFailed: "boot-failed",
});

const DEFAULT_ORB_STAGE_LEVEL = normalizeLevelDefinition(LEVELS_BY_ID["orb-stage-level"] || null);
const DEFAULT_LEVEL_STAGE_LEVEL = normalizeLevelDefinition(LEVELS_BY_ID["level-mvp"] || null);

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
  downDrag: -1.7,
  downDragMin: -5,
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
    spawnHoldActive: false,
    spawnHoldAnchorX: 0,
    spawnHoldAnchorY: yW,
    spawnHoldStartedAtMs: 0,
  };
}

function bindShellStageControls(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!refs || !runtime || !runtime.stage) return;

  const stage = runtime.stage;
  const stageControlRuntime = runtime.stageControlRuntime || (runtime.stageControlRuntime = {
    boundGravityEl: null,
    boundDragEl: null,
  });

  const syncControls = () => {
    const orbState = stage.orbRuntimeState && typeof stage.orbRuntimeState.get === "function"
      ? stage.orbRuntimeState.get()
      : null;
    if (refs.gSlider) refs.gSlider.value = String(Number(orbState && orbState.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul);
    if (refs.gVal) refs.gVal.textContent = (Number(orbState && orbState.gravityMul) || SHELL_STAGE_UI_DEFAULTS.gravityMul).toFixed(2);
    if (refs.dSlider) refs.dSlider.value = String(Number(stage.phys.downDrag) || SHELL_STAGE_UI_DEFAULTS.downDrag);
    if (refs.dVal) refs.dVal.textContent = (Number(stage.phys.downDrag) || SHELL_STAGE_UI_DEFAULTS.downDrag).toFixed(2);
  };

  if (refs.gSlider && refs.gSlider !== stageControlRuntime.boundGravityEl) {
    stageControlRuntime.boundGravityEl = refs.gSlider;
    refs.gSlider.addEventListener("input", () => {
      const next = clamp(refs.gSlider.value, SHELL_STAGE_UI_DEFAULTS.gravityMin, SHELL_STAGE_UI_DEFAULTS.gravityMax);
      if (stage.orbRuntimeState && typeof stage.orbRuntimeState.patch === "function") {
        stage.orbRuntimeState.patch({ gravityMul: next });
      }
      if (refs.gVal) refs.gVal.textContent = next.toFixed(2);
    });
  }

  if (refs.dSlider && refs.dSlider !== stageControlRuntime.boundDragEl) {
    stageControlRuntime.boundDragEl = refs.dSlider;
    refs.dSlider.addEventListener("input", () => {
      const next = clamp(refs.dSlider.value, SHELL_STAGE_UI_DEFAULTS.downDragMin, SHELL_STAGE_UI_DEFAULTS.downDragMax);
      stage.phys.downDrag = next;
      if (refs.dVal) refs.dVal.textContent = next.toFixed(2);
    });
  }

  syncControls();
  const devStagingView = shellContext && shellContext.views ? shellContext.views.devStagingView : null;
  if (devStagingView && typeof devStagingView.subscribePanelState === "function" && !stageControlRuntime.unsubscribePanelState) {
    stageControlRuntime.unsubscribePanelState = devStagingView.subscribePanelState((state = {}) => {
      const openPanelIds = Array.isArray(state.openPanelIds) ? state.openPanelIds : [];
      if (!openPanelIds.includes("input-hud")) return;
      bindShellStageControls(shellContext);
    });
  }
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
  const spawnPoint = shellResolvedSpawnPoint(shellContext);
  initialState.xW = spawnPoint ? spawnPoint.xW : shellStageCenterX(shellContext);
  if (spawnPoint) {
    initialState.yW = spawnPoint.yW;
    initialState.onGround = false;
    initialState.floatGraceAnchorY = spawnPoint.yW;
    initialState.teleportHoldAnchorY = spawnPoint.yW;
    initialState.spawnHoldActive = true;
    initialState.spawnHoldAnchorX = spawnPoint.xW;
    initialState.spawnHoldAnchorY = spawnPoint.yW;
    initialState.spawnHoldStartedAtMs = performance.now();
  }
  const orbRuntimeState = createOrbRuntimeState({ initialState });
  const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
  if (cameraRuntime && typeof cameraRuntime.reset === "function") {
    cameraRuntime.reset();
  }
  if (cameraRuntime && typeof cameraRuntime.resolveFrame === "function") {
    const bootRect = shellStageRect(shellContext);
    const cameraConfig = shellGameplayCameraConfig(shellContext);
    const clampBounds = shellGameplayCameraClampBounds(shellContext);
    const bootTarget = spawnPoint || shellGameplayCameraTarget(shellContext, initialState);
    cameraRuntime.resolveFrame({
      targetXW: bootTarget.xW,
      targetYW: bootTarget.yW,
      viewportWidthPx: bootRect.width || 0,
      viewportHeightPx: bootRect.height || 0,
      worldWidthPx: shellWorldWidth(shellContext),
      worldHeightPx: shellWorldHeight(shellContext),
      zoom: shellGameplayCameraZoom(shellContext),
      followMode: "follow_target_center",
      fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
      fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
      screenAnchorX: cameraConfig.screenAnchorX,
      screenAnchorY: cameraConfig.screenAnchorY,
      deadzoneWidthPx: 0,
      deadzoneHeightPx: 0,
      deadzoneWidthRatio: 0,
      deadzoneHeightRatio: 0,
      followLerpX: 1,
      followLerpY: 1,
      clampLeftXW: clampBounds.leftXW,
      clampRightXW: clampBounds.rightXW,
      clampTopYW: clampBounds.topYW,
      clampBottomYW: clampBounds.bottomYW,
      clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
      clampInsetRightPx: cameraConfig.clampInsetRightPx,
      clampInsetTopPx: cameraConfig.clampInsetTopPx,
      clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
    });
  }

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
  const activeStageEls = getActiveShellStageElements(shellContext);
  const physStage = activeStageEls && activeStageEls.physStage ? activeStageEls.physStage : null;
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
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const runtimeWorldHeight = Number(stage && stage.phys && stage.phys.worldHeightPx);
  if (Number.isFinite(runtimeWorldHeight) && runtimeWorldHeight > 0) return runtimeWorldHeight;
  const gameplayLevel = shellGameplayLevel(shellContext);
  const levelWorld = gameplayLevel && gameplayLevel.world
    ? gameplayLevel.world
    : null;
  const heightPx = Number(levelWorld && levelWorld.heightPx);
  return Number.isFinite(heightPx) && heightPx > 0 ? heightPx : 5000;
}

function shellWorldWidth(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const runtimeWorldWidth = Number(stage && stage.phys && stage.phys.worldWidthPx);
  if (Number.isFinite(runtimeWorldWidth) && runtimeWorldWidth > 0) return runtimeWorldWidth;
  const gameplayLevel = shellGameplayLevel(shellContext);
  const levelWorld = gameplayLevel && gameplayLevel.world
    ? gameplayLevel.world
    : null;
  const widthPx = Number(levelWorld && levelWorld.widthPx);
  if (Number.isFinite(widthPx) && widthPx > 0) return widthPx;
  const rect = shellStageRect(shellContext);
  return Math.max(1, Number(rect.width) || 0);
}

function shellGameplayCameraFollowMode(shellContext) {
  const gameplayLevel = shellGameplayLevel(shellContext);
  return resolveStageCameraFollowMode(gameplayLevel, "gameplay", "follow_target_center");
}

function shellGameplayCameraZoom(shellContext) {
  const gameplayLevel = shellGameplayLevel(shellContext);
  return resolveStageCameraZoom(gameplayLevel, "gameplay", 1);
}

function shellGameplayCameraConfig(shellContext) {
  const gameplayLevel = shellGameplayLevel(shellContext);
  return resolveStageCameraConfig(gameplayLevel, {
    mode: "gameplay",
    worldWidthPx: shellWorldWidth(shellContext),
    worldHeightPx: shellWorldHeight(shellContext),
    groundCenterWorld: () => shellGroundCenterWorld(shellContext),
  });
}

function shellResolvedSpawnPoint(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const summary = runtime && runtime.currentLevelMapSummary ? runtime.currentLevelMapSummary : null;
  const svgSpawn = summary && Array.isArray(summary.spawnMarkers) && summary.spawnMarkers.length
    ? summary.spawnMarkers[0]
    : null;
  if (svgSpawn && svgSpawn.worldCenter) {
    return Object.freeze({
      xW: Number(svgSpawn.worldCenter.xW) || 0,
      yW: Number(svgSpawn.worldCenter.yW) || 0,
    });
  }
  return resolveLevelSpawnPoint(shellGameplayLevel(shellContext), {
    worldWidthPx: shellWorldWidth(shellContext),
    groundCenterWorld: () => shellGroundCenterWorld(shellContext),
  });
}

function shellResolvedCollisionBox(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const summary = runtime && runtime.currentLevelMapSummary ? runtime.currentLevelMapSummary : null;
  return summary && summary.boundaryBox ? summary.boundaryBox : null;
}

function shellResolvedBoundarySegments(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  return Array.isArray(runtime && runtime.currentLevelBoundarySegments)
    ? runtime.currentLevelBoundarySegments
    : [];
}

function shellResolvedCavityCollisionConfig(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const summary = runtime && runtime.currentLevelMapSummary ? runtime.currentLevelMapSummary : null;
  const depthLayers = Array.isArray(summary && summary.depthLayers) ? summary.depthLayers : [];
  const firstDepthLayer = depthLayers[0] || null;
  const segments = shellResolvedBoundarySegments(shellContext);
  if (!firstDepthLayer || !segments.length) return null;
  const config = runtime.cavityCollisionConfigCache || (runtime.cavityCollisionConfigCache = {
    segments: [],
    maxDepthBO: 0,
    orbZBO: 0,
  });
  config.segments = segments;
  config.maxDepthBO = Math.max(0, Number(firstDepthLayer.maxDepthBO) || 0);
  config.orbZBO = Math.max(0, Number(firstDepthLayer.orbZBO) || 0);
  return config;
}

function shellResolvedCameraBoundaryBox(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const summary = runtime && runtime.currentLevelMapSummary ? runtime.currentLevelMapSummary : null;
  return summary && summary.cameraBoundaryBox ? summary.cameraBoundaryBox : null;
}

function shellGameplayCameraClampBounds(shellContext) {
  return resolveStageCameraClampBounds({
    worldWidthPx: shellWorldWidth(shellContext),
    worldHeightPx: shellWorldHeight(shellContext),
    cameraBoundaryBox: shellResolvedCameraBoundaryBox(shellContext),
    boundaryBox: shellResolvedCollisionBox(shellContext),
  });
}

function shellGameplayCameraTarget(shellContext, orbState = null) {
  const gameplayLevel = shellGameplayLevel(shellContext);
  const camera = gameplayLevel && gameplayLevel.camera
    ? gameplayLevel.camera
    : null;
  const initialTarget = String(camera && camera.initialTarget || "spawn").trim().toLowerCase();
  const spawnPoint = shellResolvedSpawnPoint(shellContext);
  const anchorTarget = initialTarget.startsWith("anchor:")
    ? resolveLevelCameraAnchor(
        gameplayLevel,
        initialTarget.slice("anchor:".length),
        {
          worldWidthPx: shellWorldWidth(shellContext),
          groundCenterWorld: () => shellGroundCenterWorld(shellContext),
        }
      )
    : null;
  if (initialTarget === "orb" && orbState) {
    return {
      xW: Number(orbState.xW) || shellStageCenterX(shellContext),
      yW: Number(orbState.yW) || shellGroundCenterWorld(shellContext),
    };
  }
  if (orbState) {
    return {
      xW: Number(orbState.xW) || shellStageCenterX(shellContext),
      yW: Number(orbState.yW) || shellGroundCenterWorld(shellContext),
    };
  }
  if (initialTarget === "spawn" && spawnPoint) return spawnPoint;
  if (anchorTarget && anchorTarget.point) return anchorTarget.point;
  if (spawnPoint) return spawnPoint;
  return {
    xW: shellStageCenterX(shellContext),
    yW: shellGroundCenterWorld(shellContext),
  };
}

function shellGroundCenterWorld(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const collisionBox = shellResolvedCollisionBox(shellContext);
  if (collisionBox && stage && stage.phys) {
    return Math.max(0, Number(collisionBox.bottomYW) - (Number(stage.phys.orbRadiusPx) || 50));
  }
  if (!stage || !stage.phys) return 0;
  const WORLD_H = Number(stage.phys.worldHeightPx) || shellWorldHeight(shellContext);
  const phys = stage.phys;
  return WORLD_H - (
    (Number(phys.groundFromBottomPx) || 17) +
    (Number(phys.groundLinePx) || 2) +
    (Number(phys.orbRadiusPx) || 50)
  );
}

function shellCeilingWorld(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const collisionBox = shellResolvedCollisionBox(shellContext);
  if (collisionBox && stage && stage.phys) {
    return Math.max(0, Number(collisionBox.topYW) + (Number(stage.phys.orbRadiusPx) || 50));
  }
  return Number(stage && stage.phys && stage.phys.orbRadiusPx) || 50;
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
  const orbRadiusPx = Number(stage && stage.phys && stage.phys.orbRadiusPx) || 50;
  const collisionBox = shellResolvedCollisionBox(shellContext);
  if (collisionBox) {
    return {
      left: Math.max(orbRadiusPx, Number(collisionBox.leftXW) + orbRadiusPx),
      right: Math.max(
        orbRadiusPx,
        Number(collisionBox.rightXW) - orbRadiusPx
      ),
    };
  }
  const worldWidth = shellWorldWidth(shellContext);
  return {
    left: orbRadiusPx,
    right: Math.max(orbRadiusPx, worldWidth - orbRadiusPx),
  };
}

function shellCameraTopFor(shellContext, yW, stageH, nowMs = performance.now()) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (runtime && runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.camTop))) {
    return Number(runtime.frameMetrics.camTop) || 0;
  }
  const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
  const cameraConfig = shellGameplayCameraConfig(shellContext);
  const clampBounds = shellGameplayCameraClampBounds(shellContext);
  const target = shellGameplayCameraTarget(shellContext, { xW: shellStageCenterX(shellContext), yW });
  const frame = cameraRuntime && typeof cameraRuntime.resolveFrame === "function"
    ? cameraRuntime.resolveFrame({
        targetXW: target.xW,
        targetYW: target.yW,
        viewportWidthPx: shellStageRect(shellContext).width || 0,
        viewportHeightPx: stageH,
        worldWidthPx: shellWorldWidth(shellContext),
        worldHeightPx: shellWorldHeight(shellContext),
        zoom: shellGameplayCameraZoom(shellContext),
        followMode: shellGameplayCameraFollowMode(shellContext),
        fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
        fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
        screenAnchorX: cameraConfig.screenAnchorX,
        screenAnchorY: cameraConfig.screenAnchorY,
        deadzoneWidthPx: cameraConfig.deadzoneWidthPx,
        deadzoneHeightPx: cameraConfig.deadzoneHeightPx,
        deadzoneWidthRatio: cameraConfig.deadzoneWidthRatio,
        deadzoneHeightRatio: cameraConfig.deadzoneHeightRatio,
        followLerpX: cameraConfig.followLerpX,
        followLerpY: cameraConfig.followLerpY,
        clampLeftXW: clampBounds.leftXW,
        clampRightXW: clampBounds.rightXW,
        clampTopYW: clampBounds.topYW,
        clampBottomYW: clampBounds.bottomYW,
        clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
        clampInsetRightPx: cameraConfig.clampInsetRightPx,
        clampInsetTopPx: cameraConfig.clampInsetTopPx,
        clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
        nowMs,
      })
    : null;
  return Number(frame && frame.camTop) || 0;
}

function shellOrbScreenY(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (runtime && runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenY))) {
    return Number(runtime.frameMetrics.orbScreenY) || 0;
  }
  const orbState = runtime && runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
  const rect = shellStageRect(shellContext);
  const cameraConfig = shellGameplayCameraConfig(shellContext);
  const clampBounds = shellGameplayCameraClampBounds(shellContext);
  const target = shellGameplayCameraTarget(shellContext, orbState);
  const frame = cameraRuntime && typeof cameraRuntime.resolveFrame === "function"
    ? cameraRuntime.resolveFrame({
        targetXW: target.xW,
        targetYW: target.yW,
        viewportWidthPx: rect.width || 0,
        viewportHeightPx: rect.height || 0,
        worldWidthPx: shellWorldWidth(shellContext),
        worldHeightPx: shellWorldHeight(shellContext),
        zoom: shellGameplayCameraZoom(shellContext),
        followMode: shellGameplayCameraFollowMode(shellContext),
        fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
        fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
        screenAnchorX: cameraConfig.screenAnchorX,
        screenAnchorY: cameraConfig.screenAnchorY,
        deadzoneWidthPx: cameraConfig.deadzoneWidthPx,
        deadzoneHeightPx: cameraConfig.deadzoneHeightPx,
        deadzoneWidthRatio: cameraConfig.deadzoneWidthRatio,
        deadzoneHeightRatio: cameraConfig.deadzoneHeightRatio,
        followLerpX: cameraConfig.followLerpX,
        followLerpY: cameraConfig.followLerpY,
        clampLeftXW: clampBounds.leftXW,
        clampRightXW: clampBounds.rightXW,
        clampTopYW: clampBounds.topYW,
        clampBottomYW: clampBounds.bottomYW,
        clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
        clampInsetRightPx: cameraConfig.clampInsetRightPx,
        clampInsetTopPx: cameraConfig.clampInsetTopPx,
        clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
      })
    : null;
  return Number(frame && frame.targetScreenY) || 0;
}

function ensureShellFrameScratch(runtime = null) {
  if (!runtime) return null;
  return runtime.frameScratch || (runtime.frameScratch = {
    cameraFrameArgs: {
      camLeft: 0,
      camTop: 0,
      zoom: 1,
      worldWidthPx: 0,
      worldHeightPx: 0,
    },
    groundLineArgs: { top: 0 },
    orbTransformArgs: {
      top: 0,
      left: 0,
      xW: 0,
      yW: 0,
    },
    cameraResolvedFrame: {},
  });
}

function updateShellFrameMetrics(shellContext, nowMs = performance.now()) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  const activeStageEls = getActiveShellStageElements(shellContext);
  const physStage = activeStageEls && activeStageEls.physStage ? activeStageEls.physStage : null;
  if (!runtime || !physStage || typeof physStage.getBoundingClientRect !== "function") return null;
  const scratch = ensureShellFrameScratch(runtime);
  const rect = physStage.getBoundingClientRect();
  const metrics = runtime.frameMetrics || (runtime.frameMetrics = {
    nowMs: 0,
    rect: { width: 0, height: 0 },
    centerX: 0,
    camLeft: 0,
    camTop: 0,
    zoom: 1,
    worldWidthPx: 0,
    worldHeightPx: 0,
    orbScreenX: 0,
    orbScreenY: 0,
    lateralBounds: { left: 0, right: 0 },
  });
  const safeRect = metrics.rect || (metrics.rect = { width: 0, height: 0 });
  safeRect.width = Number(rect.width) || 0;
  safeRect.height = Number(rect.height) || 0;
  runtime.stageRectCache = safeRect;
  const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const stage = runtime.stage ? runtime.stage : null;
  const orbRadiusPx = Number(stage && stage.phys && stage.phys.orbRadiusPx) || 50;
  const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
  const cameraConfig = shellGameplayCameraConfig(shellContext);
  const clampBounds = shellGameplayCameraClampBounds(shellContext);
  const collisionBox = shellResolvedCollisionBox(shellContext);
  const target = shellGameplayCameraTarget(shellContext, orbState);
  const perfTrace = runtime.perfTrace || null;
  const frame = cameraRuntime && typeof cameraRuntime.resolveFrame === "function"
    ? (
        perfTrace && typeof perfTrace.measure === "function"
          ? perfTrace.measure("camera.resolve", () => cameraRuntime.resolveFrame({
              targetXW: target.xW,
              targetYW: target.yW,
              viewportWidthPx: safeRect.width || 0,
              viewportHeightPx: safeRect.height || 0,
              worldWidthPx: shellWorldWidth(shellContext),
              worldHeightPx: shellWorldHeight(shellContext),
              zoom: shellGameplayCameraZoom(shellContext),
              followMode: shellGameplayCameraFollowMode(shellContext),
              fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
              fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
              screenAnchorX: cameraConfig.screenAnchorX,
              screenAnchorY: cameraConfig.screenAnchorY,
              deadzoneWidthPx: cameraConfig.deadzoneWidthPx,
              deadzoneHeightPx: cameraConfig.deadzoneHeightPx,
              deadzoneWidthRatio: cameraConfig.deadzoneWidthRatio,
              deadzoneHeightRatio: cameraConfig.deadzoneHeightRatio,
              followLerpX: cameraConfig.followLerpX,
              followLerpY: cameraConfig.followLerpY,
              clampLeftXW: clampBounds.leftXW,
              clampRightXW: clampBounds.rightXW,
              clampTopYW: clampBounds.topYW,
              clampBottomYW: clampBounds.bottomYW,
              clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
              clampInsetRightPx: cameraConfig.clampInsetRightPx,
              clampInsetTopPx: cameraConfig.clampInsetTopPx,
              clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
              nowMs,
              target: scratch.cameraResolvedFrame,
            }))
          : cameraRuntime.resolveFrame({
        targetXW: target.xW,
        targetYW: target.yW,
        viewportWidthPx: safeRect.width || 0,
        viewportHeightPx: safeRect.height || 0,
        worldWidthPx: shellWorldWidth(shellContext),
        worldHeightPx: shellWorldHeight(shellContext),
        zoom: shellGameplayCameraZoom(shellContext),
        followMode: shellGameplayCameraFollowMode(shellContext),
        fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
        fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
        screenAnchorX: cameraConfig.screenAnchorX,
        screenAnchorY: cameraConfig.screenAnchorY,
        deadzoneWidthPx: cameraConfig.deadzoneWidthPx,
        deadzoneHeightPx: cameraConfig.deadzoneHeightPx,
        deadzoneWidthRatio: cameraConfig.deadzoneWidthRatio,
        deadzoneHeightRatio: cameraConfig.deadzoneHeightRatio,
        followLerpX: cameraConfig.followLerpX,
        followLerpY: cameraConfig.followLerpY,
        clampLeftXW: clampBounds.leftXW,
        clampRightXW: clampBounds.rightXW,
        clampTopYW: clampBounds.topYW,
        clampBottomYW: clampBounds.bottomYW,
        clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
        clampInsetRightPx: cameraConfig.clampInsetRightPx,
        clampInsetTopPx: cameraConfig.clampInsetTopPx,
        clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
        nowMs,
        target: scratch.cameraResolvedFrame,
      })
      )
    : null;
  const camLeft = Number(frame && frame.camLeft) || 0;
  const camTop = Number(frame && frame.camTop) || 0;
  const zoom = Number(frame && frame.zoom) || 1;
  metrics.nowMs = nowMs;
  metrics.centerX = safeRect.width * 0.5;
  metrics.camLeft = camLeft;
  metrics.camTop = camTop;
  metrics.zoom = zoom;
  metrics.worldWidthPx = shellWorldWidth(shellContext);
  metrics.worldHeightPx = shellWorldHeight(shellContext);
  metrics.orbScreenX = frame
    ? ((Number(orbState && orbState.xW) || 0) - camLeft) * zoom
    : (safeRect.width * 0.5);
  metrics.orbScreenY = frame
    ? ((Number(orbState && orbState.yW) || 0) - camTop) * zoom
    : ((Number(orbState && orbState.yW) || 0) - camTop);
  const lateralBounds = metrics.lateralBounds || (metrics.lateralBounds = { left: 0, right: 0 });
  lateralBounds.left = collisionBox
    ? Math.max(orbRadiusPx, Number(collisionBox.leftXW) + orbRadiusPx)
    : orbRadiusPx;
  lateralBounds.right = collisionBox
    ? Math.max(orbRadiusPx, Number(collisionBox.rightXW) - orbRadiusPx)
    : Math.max(orbRadiusPx, metrics.worldWidthPx - orbRadiusPx);
  if (activeStageAdapter && typeof activeStageAdapter.applyCameraFrame === "function") {
    const args = scratch.cameraFrameArgs;
    args.camLeft = camLeft;
    args.camTop = camTop;
    args.zoom = zoom;
    args.worldWidthPx = metrics.worldWidthPx;
    args.worldHeightPx = metrics.worldHeightPx;
    if (perfTrace && typeof perfTrace.measure === "function") {
      perfTrace.measure("stage.applyCameraFrame", () => activeStageAdapter.applyCameraFrame(args));
    } else {
      activeStageAdapter.applyCameraFrame(args);
    }
  }
  return metrics;
}

function traceShellCameraInput(shellContext, nowMs = performance.now()) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const perfTrace = runtime && runtime.perfTrace ? runtime.perfTrace : null;
  const cameraInput = runtime && runtime.cameraInput ? runtime.cameraInput : null;
  if (!runtime || !perfTrace || !cameraInput || typeof cameraInput.getState !== "function") return null;
  const state = cameraInput.getState() || {};
  const tracking = state.tracking || {};
  const debug = state.debug || {};
  const steering = runtime.cameraInputOrbBridge && typeof runtime.cameraInputOrbBridge.getState === "function"
    ? runtime.cameraInputOrbBridge.getState()
    : null;
  const inputAgeMs = Math.max(0, nowMs - (Number(state.updatedAtMs) || nowMs));
  const detectMs = Math.max(0, Number(debug.detectMs) || 0);
  const inputFrameMs = Math.max(0, Number(debug.frameMs) || 0);
  if (typeof perfTrace.record === "function") {
    perfTrace.record("camera.inputAge", inputAgeMs, 80, { event: false });
    perfTrace.record("camera.detectMs", detectMs, 20, { event: false });
    perfTrace.record("camera.inputFrameMs", inputFrameMs, 45, { event: false });
  }
  const handPresent = Boolean(tracking.handPresent);
  const trackingLabel = String(tracking.trackingState || tracking.state || "");
  const scratch = runtime.perfCameraTrace || (runtime.perfCameraTrace = {
    handPresent,
    missingFrames: 0,
    detectorMissingBurstFrames: 0,
    detectorMissingBurstStartedAtMs: 0,
    staleFrames: 0,
    runtimeMarked: false,
  });
  const detectorMissing = String(debug.detectorResultReason || "") === "no_landmarks";
  if (detectorMissing) {
    if (!scratch.detectorMissingBurstStartedAtMs) scratch.detectorMissingBurstStartedAtMs = nowMs;
    scratch.detectorMissingBurstFrames += 1;
  } else {
    scratch.detectorMissingBurstStartedAtMs = 0;
    scratch.detectorMissingBurstFrames = 0;
  }
  const detectorMissingBurstMs = scratch.detectorMissingBurstStartedAtMs
    ? Math.max(0, nowMs - scratch.detectorMissingBurstStartedAtMs)
    : 0;
  if (!scratch.runtimeMarked && typeof perfTrace.mark === "function") {
    scratch.runtimeMarked = true;
    perfTrace.mark("camera.runtime", {
      modelAssetUrl: String(debug.modelAssetUrl || ""),
      wasmRootUrl: String(debug.wasmRootUrl || ""),
      wasmSimdSupported: Boolean(debug.wasmSimdSupported),
      preloadMs: Math.round((Number(debug.preloadMs) || 0) * 10) / 10,
      loadedAssets: String(debug.loadedWasmAssets || ""),
      detectorLoop: String(debug.detectorLoop || ""),
      detectorBackend: String(debug.detectorBackend || ""),
      detectorTargetFps: Math.round((Number(debug.detectorTargetFps) || 0) * 10) / 10,
      detectorDetectMsEma: Math.round((Number(debug.detectorDetectMsEma) || 0) * 10) / 10,
      detectorBlobWeight: Math.round((Number(debug.detectorBlobWeight) || 0) * 10) / 10,
      detectorMaskPixels: Math.round(Number(debug.detectorMaskPixels) || 0),
      detectorComponentCount: Math.round(Number(debug.detectorComponentCount) || 0),
      detectorComponentPixels: Math.round(Number(debug.detectorComponentPixels) || 0),
      detectorCoreX01: Math.round((Number(debug.detectorCoreX01) || 0) * 1000) / 1000,
      detectorOuterX01: Math.round((Number(debug.detectorOuterX01) || 0) * 1000) / 1000,
      detectorEdgeX01: Math.round((Number(debug.detectorEdgeX01) || 0) * 1000) / 1000,
      detectorPriorX01: Math.round((Number(debug.detectorPriorX01) || 0) * 1000) / 1000,
      detectorPriorAgeMs: Math.round((Number(debug.detectorPriorAgeMs) || 0) * 10) / 10,
      detectorPriorDistance01: Math.round((Number(debug.detectorPriorDistance01) || 0) * 1000) / 1000,
      detectorContinuityMultiplier: Math.round((Number(debug.detectorContinuityMultiplier) || 0) * 1000) / 1000,
      detectorOutputCenterX01: Math.round((Number(debug.detectorOutputCenterX01) || 0) * 1000) / 1000,
      detectorOutputGain: Math.round((Number(debug.detectorOutputGain) || 0) * 100) / 100,
      detectorResultReason: String(debug.detectorResultReason || ""),
      detectorLandmarkGroups: Math.round(Number(debug.detectorLandmarkGroups) || 0),
      detectorHandednessGroups: Math.round(Number(debug.detectorHandednessGroups) || 0),
      detectorBestScore: Math.round((Number(debug.detectorBestScore) || 0) * 1000) / 1000,
      detectorBestLandmarks: Math.round(Number(debug.detectorBestLandmarks) || 0),
      detectorBestIndex: Math.round(Number(debug.detectorBestIndex) || -1),
      detectorPalmCameraX01: Math.round((Number(debug.detectorPalmCameraX01) || 0) * 1000) / 1000,
      detectorPalmScreenX01: Math.round((Number(debug.detectorPalmScreenX01) || 0) * 1000) / 1000,
      detectorDetectedHandedness: String(debug.detectorDetectedHandedness || ""),
      steeringMaxSpeedPxPerSec: Math.round(Number(steering && steering.maxSpeedPxPerSec) || 0),
      steeringCenterEpsilon01: Math.round((Number(steering && steering.centerEpsilon01) || 0) * 10000) / 10000,
      steeringRampWindow01: Math.round((Number(steering && steering.rampWindow01) || 0) * 1000) / 1000,
      video: `${Math.round(Number(debug.videoWidth) || 0)}x${Math.round(Number(debug.videoHeight) || 0)}`,
      detectorInput: `${Math.round(Number(debug.detectorInputWidth) || 0)}x${Math.round(Number(debug.detectorInputHeight) || 0)}`,
      track: `${Math.round(Number(debug.trackWidth) || 0)}x${Math.round(Number(debug.trackHeight) || 0)}@${Math.round((Number(debug.trackFrameRate) || 0) * 10) / 10}`,
    });
  }
  if (handPresent) {
    scratch.missingFrames = 0;
  } else {
    scratch.missingFrames += 1;
  }
  if (inputAgeMs >= 80) {
    scratch.staleFrames += 1;
  } else {
    scratch.staleFrames = 0;
  }
  if (scratch.handPresent !== handPresent) {
    scratch.handPresent = handPresent;
    if (typeof perfTrace.mark === "function") {
      perfTrace.mark(handPresent ? "camera.hand_reacquired" : "camera.hand_lost", {
        inputAgeMs: Math.round(inputAgeMs),
        trackingState: trackingLabel,
        detectorResultReason: String(debug.detectorResultReason || ""),
        detectorBestScore: Math.round((Number(debug.detectorBestScore) || 0) * 1000) / 1000,
        detectorLandmarkGroups: Math.round(Number(debug.detectorLandmarkGroups) || 0),
        detectorBestLandmarks: Math.round(Number(debug.detectorBestLandmarks) || 0),
        detectorMissingBurstFrames: scratch.detectorMissingBurstFrames,
        detectorMissingBurstMs: Math.round(detectorMissingBurstMs),
      });
    }
  }
  if (scratch.staleFrames === 1 && typeof perfTrace.mark === "function") {
    perfTrace.mark("camera.input_stale", {
      inputAgeMs: Math.round(inputAgeMs),
      trackingState: trackingLabel,
    });
  }
  return {
    status: String(debug.statusLine || ""),
    trackingState: trackingLabel,
    handPresent,
    fps: Math.round(Number(debug.fps) || 0),
    detectMs: Math.round(detectMs * 10) / 10,
    inputFrameMs: Math.round(inputFrameMs * 10) / 10,
    inputAgeMs: Math.round(inputAgeMs),
    videoWidth: Math.round(Number(debug.videoWidth) || 0),
    videoHeight: Math.round(Number(debug.videoHeight) || 0),
    detectorInputWidth: Math.round(Number(debug.detectorInputWidth) || 0),
    detectorInputHeight: Math.round(Number(debug.detectorInputHeight) || 0),
    detectorBlobWeight: Math.round((Number(debug.detectorBlobWeight) || 0) * 10) / 10,
    detectorMaskPixels: Math.round(Number(debug.detectorMaskPixels) || 0),
    detectorRawX01: Math.round((Number(debug.detectorRawX01) || 0) * 1000) / 1000,
    detectorCoreX01: Math.round((Number(debug.detectorCoreX01) || 0) * 1000) / 1000,
    detectorOuterX01: Math.round((Number(debug.detectorOuterX01) || 0) * 1000) / 1000,
    detectorEdgeX01: Math.round((Number(debug.detectorEdgeX01) || 0) * 1000) / 1000,
    detectorWeightedX01: Math.round((Number(debug.detectorWeightedX01) || 0) * 1000) / 1000,
    detectorComponentCount: Math.round(Number(debug.detectorComponentCount) || 0),
    detectorComponentPixels: Math.round(Number(debug.detectorComponentPixels) || 0),
    detectorComponentWidthPx: Math.round(Number(debug.detectorComponentWidthPx) || 0),
    detectorComponentHeightPx: Math.round(Number(debug.detectorComponentHeightPx) || 0),
    detectorCoreWidthPx: Math.round(Number(debug.detectorCoreWidthPx) || 0),
    detectorComponentScore: Math.round((Number(debug.detectorComponentScore) || 0) * 10) / 10,
    detectorPriorX01: Math.round((Number(debug.detectorPriorX01) || 0) * 1000) / 1000,
    detectorPriorAgeMs: Math.round((Number(debug.detectorPriorAgeMs) || 0) * 10) / 10,
    detectorPriorDistance01: Math.round((Number(debug.detectorPriorDistance01) || 0) * 1000) / 1000,
    detectorContinuityMultiplier: Math.round((Number(debug.detectorContinuityMultiplier) || 0) * 1000) / 1000,
    detectorOutputX01: Math.round((Number(debug.detectorOutputX01) || 0) * 1000) / 1000,
    detectorOutputCenterX01: Math.round((Number(debug.detectorOutputCenterX01) || 0) * 1000) / 1000,
    detectorOutputGain: Math.round((Number(debug.detectorOutputGain) || 0) * 100) / 100,
    detectorResultReason: String(debug.detectorResultReason || ""),
    detectorLandmarkGroups: Math.round(Number(debug.detectorLandmarkGroups) || 0),
    detectorHandednessGroups: Math.round(Number(debug.detectorHandednessGroups) || 0),
    detectorBestScore: Math.round((Number(debug.detectorBestScore) || 0) * 1000) / 1000,
    detectorBestLandmarks: Math.round(Number(debug.detectorBestLandmarks) || 0),
    detectorBestIndex: Math.round(Number(debug.detectorBestIndex) || -1),
    detectorPalmCameraX01: Math.round((Number(debug.detectorPalmCameraX01) || 0) * 1000) / 1000,
    detectorPalmScreenX01: Math.round((Number(debug.detectorPalmScreenX01) || 0) * 1000) / 1000,
    detectorDetectedHandedness: String(debug.detectorDetectedHandedness || ""),
    detectorMissingBurstFrames: scratch.detectorMissingBurstFrames,
    detectorMissingBurstMs: Math.round(detectorMissingBurstMs * 10) / 10,
    trackWidth: Math.round(Number(debug.trackWidth) || 0),
    trackHeight: Math.round(Number(debug.trackHeight) || 0),
    trackFrameRate: Math.round((Number(debug.trackFrameRate) || 0) * 10) / 10,
    wasmSimdSupported: Boolean(debug.wasmSimdSupported),
    loadedWasmAssets: String(debug.loadedWasmAssets || ""),
    detectorLoop: String(debug.detectorLoop || ""),
    detectorBackend: String(debug.detectorBackend || ""),
    detectorTargetFps: Math.round((Number(debug.detectorTargetFps) || 0) * 10) / 10,
    detectorDetectMsEma: Math.round((Number(debug.detectorDetectMsEma) || 0) * 10) / 10,
    missingFrames: scratch.missingFrames,
    staleFrames: scratch.staleFrames,
    rawX01: Math.round((Number(tracking.rawX01) || 0) * 1000) / 1000,
    filteredX01: Math.round((Number(tracking.filteredX01) || 0) * 1000) / 1000,
    centeredX01: Math.round((Number(tracking.centeredX01) || 0) * 1000) / 1000,
    holdAgeMs: Math.round((Number(tracking.holdAgeMs) || 0) * 10) / 10,
    holdMissingMs: Math.round((Number(tracking.holdMissingMs) || 0) * 10) / 10,
    steeringActive: Boolean(steering && steering.active),
    steeringReason: String(steering && steering.reason || ""),
    steeringCenteredX01: Math.round((Number(steering && steering.centeredX01) || 0) * 1000) / 1000,
    steeringRawIntentX: Math.round((Number(steering && steering.rawIntentX) || 0) * 1000) / 1000,
    steeringIntentX: Math.round((Number(steering && steering.intentX) || 0) * 1000) / 1000,
    steeringTargetVX: Math.round((Number(steering && steering.targetVX) || 0) * 10) / 10,
    steeringMaxSpeedPxPerSec: Math.round(Number(steering && steering.maxSpeedPxPerSec) || 0),
    steeringVelocityEaseFactor: Math.round((Number(steering && steering.velocityEaseFactor) || 0) * 1000) / 1000,
    steeringCenterEpsilon01: Math.round((Number(steering && steering.centerEpsilon01) || 0) * 10000) / 10000,
    steeringRampWindow01: Math.round((Number(steering && steering.rampWindow01) || 0) * 1000) / 1000,
  };
}

function applyShellGroundLine(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!stage || !stage.phys || !activeStageAdapter || typeof activeStageAdapter.applyGroundLine !== "function") return;
  const rect = shellStageRect(shellContext);
  const groundLineWorldY = shellGroundCenterWorld(shellContext) +
    (Number(stage.phys.orbRadiusPx) || 50) +
    ((Number(stage.phys.groundLinePx) || 2) * 0.5);
  const camTop = shellCameraTopFor(shellContext, stage.orbRuntimeState.get().yW, rect.height || 0);
  const groundY = groundLineWorldY - camTop;
  const top = groundY - (((Number(stage.phys.groundLinePx) || 2) * 0.5));
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const scratch = ensureShellFrameScratch(runtime);
  const args = scratch ? scratch.groundLineArgs : { top: 0 };
  args.top = top;
  activeStageAdapter.applyGroundLine(args);
}

function applyShellOrbTransform(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!runtime || !runtime.stage || !activeStageAdapter || typeof activeStageAdapter.applyOrbTransform !== "function") return;
  const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const screenX = runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenX))
    ? Number(runtime.frameMetrics.orbScreenX)
    : shellStageCenterX(shellContext);
  const y = runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenY))
    ? Number(runtime.frameMetrics.orbScreenY)
    : shellOrbScreenY(shellContext);
  const top = y - (Number(runtime.stage.phys.orbRadiusPx) || 50);
  const scratch = ensureShellFrameScratch(runtime);
  const args = scratch.orbTransformArgs;
  const xW = Number(orbState && orbState.xW);
  const yW = Number(orbState && orbState.yW);
  args.top = top;
  args.left = screenX;
  args.xW = xW;
  args.yW = yW;
  activeStageAdapter.applyOrbTransform(args);
}

function resetShellOrbToGround(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const stage = runtime && runtime.stage;
  if (!stage || !stage.orbRuntimeState || typeof stage.orbRuntimeState.patch !== "function") return;
  const spawnPoint = shellResolvedSpawnPoint(shellContext);
  const yW = spawnPoint ? spawnPoint.yW : shellGroundCenterWorld(shellContext);
  const xW = spawnPoint ? spawnPoint.xW : shellStageCenterX(shellContext);
  const onGround = !spawnPoint;
  stage.orbRuntimeState.patch({
    yW,
    xW,
    v: 0,
    vx: 0,
    steerIntentX: 0,
    steerActive: false,
    onGround,
    floatGraceAnchorY: yW,
    floatGracePhase: 0,
    teleportHoldAnchorY: yW,
    spawnHoldActive: !!spawnPoint,
    spawnHoldAnchorX: xW,
    spawnHoldAnchorY: yW,
    spawnHoldStartedAtMs: performance.now(),
    gravityMul: Number(stage.orbRuntimeState.get().gravityMul) || 0.34,
  });
  applyShellGroundLine(shellContext);
  applyShellOrbTransform(shellContext);
  if (stage.worldSystem && typeof stage.worldSystem.render === "function") {
    stage.worldSystem.render(performance.now());
  }
}

function updateShellStageReadouts(shellContext) {
  const refs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
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
  const fallDrag = clamp(
    Number(stage && stage.phys && stage.phys.downDrag) || 0,
    SHELL_STAGE_UI_DEFAULTS.downDragMin,
    SHELL_STAGE_UI_DEFAULTS.downDragMax
  );
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
  const yCeil = shellCeilingWorld(shellContext);
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
    IMPACT_TH: 750,
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
    runtime.liveInputStatusShown = true;
    return;
  }
  runtime.pendingInputStatusShown = true;
}

function updateShellSpinColorFromMotionState(shellContext, motionState) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbColorRuntime = runtime && runtime.orbColorRuntime ? runtime.orbColorRuntime : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  const canApply3dSpin = !!(activeStageAdapter && typeof activeStageAdapter.applyOrbSpinColor === "function");
  const canClear3dSpin = !!(activeStageAdapter && typeof activeStageAdapter.clearOrbSpinColor === "function");
  if (!orbColorRuntime && !canApply3dSpin && !canClear3dSpin) return;
  const spin = motionState && motionState.spin ? motionState.spin : null;
  const axis = String(spin && spin.label || "").trim().toLowerCase();
  const direction = String(spin && spin.direction || "").trim().toLowerCase();
  const dominance = Number(spin && spin.dominance) || 0;
  const gap = Number(spin && spin.gap) || 0;
  const state = runtime.spinColorState || (runtime.spinColorState = {
    active: false,
    axis: "",
    direction: "",
    applied3dColorKey: "",
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
    if (orbColorRuntime && typeof orbColorRuntime.clearSpinColor === "function") {
      orbColorRuntime.clearSpinColor();
    }
    if (canClear3dSpin && state.applied3dColorKey) {
      activeStageAdapter.clearOrbSpinColor();
      state.applied3dColorKey = "";
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
  if (color) {
    if (orbColorRuntime && typeof orbColorRuntime.applySpinColor === "function") {
      orbColorRuntime.applySpinColor(color);
    }
    const colorKey = `${state.axis}:${state.direction}`;
    if (canApply3dSpin && state.applied3dColorKey !== colorKey) {
      activeStageAdapter.applyOrbSpinColor(color);
      state.applied3dColorKey = colorKey;
    }
    return;
  }
  if (orbColorRuntime && typeof orbColorRuntime.clearSpinColor === "function") {
    orbColorRuntime.clearSpinColor();
  }
  if (canClear3dSpin && state.applied3dColorKey) {
    activeStageAdapter.clearOrbSpinColor();
    state.applied3dColorKey = "";
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
  if (runtime.stageLoopMonitorId) {
    clearInterval(runtime.stageLoopMonitorId);
    runtime.stageLoopMonitorId = 0;
  }

  const perfTrace = runtime.perfTrace || null;
  const traceMeasure = (name, fn) => (
    perfTrace && typeof perfTrace.measure === "function"
      ? perfTrace.measure(name, fn)
      : (typeof fn === "function" ? fn() : undefined)
  );
  const stageLoopTrace = {
    frameCount: 0,
    startedAtMs: performance.now(),
    lastFrameAtMs: 0,
    lastStallMarkAtMs: 0,
  };
  const pipelineHooks = {
    clamp,
    getLateralBounds: () => traceMeasure("bounds.lateral", () => shellLateralBounds(shellContext)),
    getCeilingWorld: () => traceMeasure("bounds.ceiling", () => shellCeilingWorld(shellContext)),
    getCameraSteeringState: () => (
      runtime.cameraInputOrbBridge && typeof runtime.cameraInputOrbBridge.getState === "function"
        ? runtime.cameraInputOrbBridge.getState()
        : null
    ),
    liftToThrustAccel: (l01) => {
      const phys = runtime.stage ? runtime.stage.phys : null;
      return Math.max(0, Number(phys && phys.thrustMax) || 0) * clamp01(l01);
    },
    getSpawnHoldConfig: () => (
      runtime.vfxDefaults &&
      runtime.vfxDefaults.spawn &&
      typeof runtime.vfxDefaults.spawn === "object"
        ? runtime.vfxDefaults.spawn
        : Object.create(null)
    ),
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
    groundCenterWorld: () => traceMeasure("world.groundCenter", () => shellGroundCenterWorld(shellContext)),
    computeImpactMetric: (rawImpactV) => traceMeasure("impact.metric", () => computeShellImpactMetric(shellContext, rawImpactV)),
    drawStars: () => traceMeasure("draw.stars", () => drawShellStars(shellContext)),
    drawWorldBackdrop: () => traceMeasure("draw.backdrop", () => drawShellBackdrop(shellContext)),
    updateOrbStrokeColor: (frameDt) => traceMeasure("orb.stroke", () => updateShellOrbStrokeColor(shellContext, frameDt)),
    applyOrbTransform: () => traceMeasure("orb.applyTransform", () => {
      applyShellGroundLine(shellContext);
      applyShellOrbTransform(shellContext);
    }),
    getBoundarySegments: () => traceMeasure("collision.segments", () => shellResolvedBoundarySegments(shellContext)),
    getCavityCollisionConfig: () => traceMeasure("collision.config", () => shellResolvedCavityCollisionConfig(shellContext)),
    updateDebugReadout: () => traceMeasure("debug.readout", () => updateShellStageReadouts(shellContext)),
    traceMeasure,
  };

  runtime.stageLoop = createOrbRuntimeLoop({
    getState: () => (
      runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
        ? runtime.orbRuntimeState.get()
        : null
    ),
    isReady: () => true,
    clamp,
    runFrame: ({ ts, dt, nowMs, wasOnGround }) => {
      stageLoopTrace.frameCount += 1;
      stageLoopTrace.lastFrameAtMs = performance.now();
      const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
        ? runtime.orbRuntimeState.get()
        : null;
      if (perfTrace && typeof perfTrace.frameStart === "function") {
        const metrics = runtime.frameMetrics || {};
        perfTrace.frameStart({
          ts,
          xW: Number(orbState && orbState.xW) || 0,
          yW: Number(orbState && orbState.yW) || 0,
          camLeft: Number(metrics.camLeft) || 0,
          camTop: Number(metrics.camTop) || 0,
        });
      }
      traceMeasure("frame.metrics", () => updateShellFrameMetrics(shellContext, nowMs));
      const cameraTrace = traceShellCameraInput(shellContext, nowMs);
      const receiverHostRuntime = runtime.receiverHostRuntime || null;
      const mvp = (receiverHostRuntime && receiverHostRuntime.mvp) || runtime.mvp || null;
      const orbFxSystem =
        (receiverHostRuntime && receiverHostRuntime.runtimeContext && receiverHostRuntime.runtimeContext.orbFxSystem) ||
        (mvp && mvp.orbFxSystem) ||
        null;
      traceMeasure("orb.pipeline", () => runOrbRuntimePipeline({
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
        hooks: pipelineHooks,
      }));
      if (perfTrace && typeof perfTrace.frameEnd === "function") {
        const metrics = runtime.frameMetrics || {};
        const rootDocument = shellContext.rootDocument || document;
        const rootWindow = rootDocument && rootDocument.defaultView ? rootDocument.defaultView : globalThis;
        const bloomTrace = rootWindow && rootWindow.__orbisDepth3dBloomTrace
          ? rootWindow.__orbisDepth3dBloomTrace
          : null;
        perfTrace.frameEnd({
          camLeft: Number(metrics.camLeft) || 0,
          camTop: Number(metrics.camTop) || 0,
          zoom: Number(metrics.zoom) || 1,
          camera: cameraTrace,
          depth3dModuleVersion: rootWindow && rootWindow.__orbisDepth3dModuleVersion || "",
          depth3dBloom: bloomTrace ? {
            config: bloomTrace.config,
            renderCalls: bloomTrace.renderCalls,
            resizeCalls: bloomTrace.resizeCalls,
            lastSize: bloomTrace.lastSize,
            sceneChildren: bloomTrace.sceneChildren,
            sceneObjectNames: bloomTrace.sceneObjectNames,
            camera: bloomTrace.camera,
          } : null,
        });
      }
    },
  });
  runtime.orbRuntimeLoop = runtime.stageLoop;
  runtime.stageLoop.start();
  if (perfTrace && typeof perfTrace.mark === "function") {
    perfTrace.mark("stage.loop.started", {
      hasLoop: !!runtime.stageLoop,
      hasState: !!(runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"),
    });
  }
  runtime.stageLoopMonitorId = setInterval(() => {
    const now = performance.now();
    const last = stageLoopTrace.lastFrameAtMs || stageLoopTrace.startedAtMs;
    const ageMs = Math.max(0, now - last);
    if (perfTrace && typeof perfTrace.record === "function") {
      perfTrace.record("stage.loopAge", ageMs, 1000, { event: false });
    }
    if (
      perfTrace &&
      typeof perfTrace.mark === "function" &&
      ageMs >= 1000 &&
      now - stageLoopTrace.lastStallMarkAtMs >= 1000
    ) {
      stageLoopTrace.lastStallMarkAtMs = now;
      const loopMeta = runtime.stageLoop && typeof runtime.stageLoop.getState === "function"
        ? runtime.stageLoop.getState()
        : null;
      const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
        ? runtime.orbRuntimeState.get()
        : null;
      perfTrace.mark("stage.loop.stalled", {
        ageMs: Math.round(ageMs),
        frameCount: stageLoopTrace.frameCount,
        loop: loopMeta,
        hasOrbState: !!orbState,
        lastTs: orbState && Number.isFinite(Number(orbState.lastTs)) ? Math.round(Number(orbState.lastTs)) : null,
        visibility: shellContext.rootDocument && shellContext.rootDocument.visibilityState || "",
      });
    }
  }, 1000);
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
  const adapters = [
    shellContext && shellContext.orbStageAdapter ? shellContext.orbStageAdapter : null,
    shellContext && shellContext.levelStageAdapter ? shellContext.levelStageAdapter : null,
  ].filter(Boolean);
  const buttons = adapters
    .map((adapter) => (
      adapter && typeof adapter.getStageElements === "function"
        ? adapter.getStageElements().tryAgainBtn
        : null
    ))
    .filter(Boolean);
  if (!buttons.length) return;
  const onTryAgain = () => {
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
  };
  for (const button of buttons) {
    button.addEventListener("click", onTryAgain);
  }
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
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!mvp || !mvp.orbDamageVisualsRuntime || !activeStageAdapter || typeof activeStageAdapter.renderOrbDamageVisuals !== "function") return;
  const fx = mvp.orbDamageVisualsRuntime.getState();
  activeStageAdapter.renderOrbDamageVisuals({ fx });
}

function openShellDeathOverlay(shellContext) {
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!activeStageAdapter || typeof activeStageAdapter.openDeathOverlay !== "function") return;
  activeStageAdapter.openDeathOverlay();
}

function closeShellDeathOverlay(shellContext) {
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!activeStageAdapter || typeof activeStageAdapter.closeDeathOverlay !== "function") return;
  activeStageAdapter.closeDeathOverlay();
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
  const orbStageActions = runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
  if (!orbStageActions || typeof orbStageActions.teleportOrbToSpawnNeutralizePhysics !== "function") {
    return { handled: false };
  }
  return orbStageActions.teleportOrbToSpawnNeutralizePhysics({
    aboveGroundPx,
    spawnPoint: shellResolvedSpawnPoint(shellContext),
    resolveSpawnPoint: () => shellResolvedSpawnPoint(shellContext),
    teleportOrbRuntimeToSpawn:
      runtime &&
      runtime.receiverSpellRuntime &&
      runtime.receiverSpellRuntime.teleportOrbRuntimeToSpawn,
  });
}

function bindShellPerfTraceControls(shellContext) {
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const perfTrace = runtime && runtime.perfTrace ? runtime.perfTrace : null;
  if (!rootDocument || !perfTrace) return;
  const resetBtn = rootDocument.getElementById("shellPerfTraceReset");
  const captureBtn = rootDocument.getElementById("shellPerfTraceCapture");

  const setButtonText = (button, text, resetText) => {
    if (!button) return;
    button.textContent = text;
    if (!resetText) return;
    rootDocument.defaultView.setTimeout(() => {
      button.textContent = resetText;
    }, 900);
  };

  async function copyTraceSnapshot() {
    const text = JSON.stringify(
      typeof perfTrace.snapshot === "function" ? perfTrace.snapshot() : {},
      null,
      2
    );
    const nav = rootDocument.defaultView && rootDocument.defaultView.navigator
      ? rootDocument.defaultView.navigator
      : null;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      await nav.clipboard.writeText(text);
      return text;
    }
    const textarea = rootDocument.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    rootDocument.body.appendChild(textarea);
    textarea.select();
    const copied = rootDocument.execCommand && rootDocument.execCommand("copy");
    textarea.parentNode.removeChild(textarea);
    if (!copied) throw new Error("perf_trace_copy_failed");
    return text;
  }

  if (resetBtn && typeof perfTrace.reset === "function") {
    resetBtn.addEventListener("click", () => {
      perfTrace.reset();
      if (runtime) runtime.perfCameraTrace = null;
      setButtonText(resetBtn, "Reset OK", "Reset");
    });
  }

  if (captureBtn && typeof perfTrace.snapshot === "function") {
    captureBtn.addEventListener("click", async () => {
      try {
        await copyTraceSnapshot();
        setButtonText(captureBtn, "Copied", "Capture");
      } catch (_) {
        setButtonText(captureBtn, "Failed", "Capture");
      }
    });
  }
}

function shellGrantOrbGrace(shellContext, grace = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbStageActions = runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
  if (!orbStageActions || typeof orbStageActions.grantOrbGrace !== "function") return;
  orbStageActions.grantOrbGrace({
    grace,
    grantOrbGraceRuntime:
      runtime &&
      runtime.receiverSpellRuntime &&
      runtime.receiverSpellRuntime.grantOrbGraceRuntime,
  });
}

function createShellReceiverVfxDefaults() {
  return createOrbStageReceiverVfxDefaults({ evenStroke });
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
  if (runtime) {
    runtime.shellVfxMods = {
      playElectricAoeRuntime,
      playFlameAoeRuntime,
      triggerShockwaveRuntime,
    };
  }
  const rootStyle = (
    shellContext &&
    shellContext.rootDocument &&
    shellContext.rootDocument.documentElement &&
    shellContext.rootDocument.documentElement.style
  ) || null;
  const vfxDefaults = runtime.vfxDefaults || createShellReceiverVfxDefaults();
  return initOrbStageReceiverVfxRuntime({
    runtime,
    stageEls: shellContext.stageEls || {},
    createVfxRuntimesBundle,
    rootStyle,
    vfxDefaults,
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
    playOrbNod3dRuntime: (payload = {}) => {
      const activeAdapter = getActiveShellStageAdapter(shellContext);
      return activeAdapter && typeof activeAdapter.playOrbNod3d === "function"
        ? activeAdapter.playOrbNod3d(payload)
        : { handled: false, skipped: "active_stage_orb_nod3d_missing" };
    },
    playOrbTeleport3dRuntime: (payload = {}) => {
      const activeAdapter = getActiveShellStageAdapter(shellContext);
      return activeAdapter && typeof activeAdapter.playOrbTeleport3d === "function"
        ? activeAdapter.playOrbTeleport3d(payload)
        : { handled: false, skipped: "active_stage_orb_teleport3d_missing" };
    },
    playBubbleShield3dRuntime: (payload = {}) => {
      const activeAdapter = getActiveShellStageAdapter(shellContext);
      return activeAdapter && typeof activeAdapter.playBubbleShield3d === "function"
        ? activeAdapter.playBubbleShield3d(payload)
        : { handled: false, skipped: "active_stage_bubble_shield3d_missing" };
    },
    playShockwave3dRuntime: (payload = {}) => {
      const activeAdapter = getActiveShellStageAdapter(shellContext);
      return activeAdapter && typeof activeAdapter.playShockwave3d === "function"
        ? activeAdapter.playShockwave3d(payload)
        : { handled: false, skipped: "active_stage_shockwave3d_missing" };
    },
    playFlameAoe3dRuntime: (payload = {}) => {
      const activeAdapter = getActiveShellStageAdapter(shellContext);
      return activeAdapter && typeof activeAdapter.playFlameAoe3d === "function"
        ? activeAdapter.playFlameAoe3d(payload)
        : { handled: false, skipped: "active_stage_flame_aoe3d_missing" };
    },
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
  const orbStageActions = runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
  if (!orbStageActions || typeof orbStageActions.activateBubbleShield !== "function") return;
  orbStageActions.activateBubbleShield({ durationMs });
}

function shellPlayFlameAoe(shellContext, payload = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbStageActions = runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
  if (!orbStageActions || typeof orbStageActions.playFlameAoe !== "function") return { handled: false };
  return orbStageActions.playFlameAoe(payload);
}

function shellApplyColorize(shellContext, payload = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbStageActions = runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
  if (!orbStageActions || typeof orbStageActions.applyColorize !== "function") return;
  orbStageActions.applyColorize(payload);
}

function shellClearColorize(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbStageActions = runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
  if (!orbStageActions || typeof orbStageActions.clearColorize !== "function") return;
  orbStageActions.clearColorize();
}

function shellExecuteWordCastAction(shellContext, castActionId, context = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellKws = runtime && runtime.kws ? runtime.kws : null;
  const shellSpellCastExecutor = shellKws && shellKws.shellSpellCastExecutor ? shellKws.shellSpellCastExecutor : null;
  if (!shellSpellCastExecutor || typeof shellSpellCastExecutor.execute !== "function") {
    return { handled: false, skipped: "executor_unavailable" };
  }
  try {
    const result = shellSpellCastExecutor.execute(castActionId, context);
    return result && typeof result === "object" ? result : { handled: !!result };
  } catch (error) {
    return {
      handled: false,
      skipped: "action_threw",
      reason: error && error.message ? String(error.message) : String(error || "unknown_error"),
    };
  }
}

function shellHandleVoiceSpellCast(shellContext, payload = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellKws = runtime && runtime.kws ? runtime.kws : null;
  if (!runtime || !shellKws) return { handled: false, skipped: "shell_kws_unavailable" };
  const runtimeWordIndex = shellKws.runtimeWordIndex || Object.create(null);
  const runtimeSpellIndex = shellKws.runtimeSpellIndex || runtimeWordIndex;
  const intent = String(payload.intent || "");
  const wordId = String((payload.sourceWordId || payload.wordId || payload.spellId) || "").trim().toLowerCase();
  const payloadCastActionId = String(payload.castActionId || "").trim().toLowerCase();
  const wordDef = runtimeWordIndex[wordId] || runtimeSpellIndex[wordId] || null;
  const castActionId = payloadCastActionId || String((wordDef && wordDef.castActionId) || wordId || "");
  if (runtime.perfTrace && typeof runtime.perfTrace.mark === "function") {
    runtime.perfTrace.mark("spell.voice_cast", {
      wordId,
      castActionId,
      slot: String(payload.slot || payload.directionGroup || ""),
      trigger: String(payload.trigger || ""),
    });
  }
  const result = shellExecuteWordCastAction(shellContext, castActionId, { payload, intent });
  if (runtime.perfTrace && typeof runtime.perfTrace.mark === "function") {
    runtime.perfTrace.mark("spell.action_result", {
      castActionId,
      handled: !!(result && result.handled),
      skipped: String(result && result.skipped || ""),
      blocked: !!(result && result.blocked),
      reason: String(result && result.reason || ""),
    });
  }
  if (!(result && result.handled) || !wordDef) return result;
  const postCastActions = Array.isArray(wordDef.postCastActions) ? wordDef.postCastActions : null;
  if (postCastActions) {
    for (const action of postCastActions) {
      const actionId = String(action && action.id || "");
      if (!actionId) continue;
      const nextPayload = (action && typeof action.payload === "object" && action.payload)
        ? { ...payload, ...action.payload }
        : payload;
      shellExecuteWordCastAction(shellContext, actionId, { payload: nextPayload, intent });
    }
  } else if (Array.isArray(wordDef.postCastActionIds)) {
    for (const actionId of wordDef.postCastActionIds) {
      shellExecuteWordCastAction(shellContext, String(actionId || ""), { payload, intent });
    }
  }
  return result;
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
        getActiveShellStageAdapter(shellContext) &&
        typeof getActiveShellStageAdapter(shellContext).normalizeWorldItemSpawn === "function"
          ? getActiveShellStageAdapter(shellContext).normalizeWorldItemSpawn(item, {
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
          getActiveShellStageAdapter(shellContext) &&
          typeof getActiveShellStageAdapter(shellContext).pickupScreenY === "function"
            ? getActiveShellStageAdapter(shellContext).pickupScreenY(yW, { camTop })
            : (Number(yW || 0) - camTop)
        );
      },
      getOrbRuntime: () => (
        runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
          ? runtime.orbRuntimeState.get()
          : { yW: 0 }
      ),
      getOrbScreenX: () => {
        if (runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenX))) {
          return Number(runtime.frameMetrics.orbScreenX);
        }
        return shellStageCenterX(shellContext);
      },
      getOrbScreenY: () => shellOrbScreenY(shellContext),
      getOrbVisualRadiusPx: () => {
        const visualState = getShellOrbBaseVisualState(shellContext);
        const visualRadiusPx = Number(visualState && visualState.radiusPx);
        if (Number.isFinite(visualRadiusPx) && visualRadiusPx > 0) return visualRadiusPx;
        return Number(runtime.stage && runtime.stage.phys && runtime.stage.phys.orbRadiusPx) || 0;
      },
      axisToColor01,
      bindGlobe3dRuntime: (args = {}) => (
        shellContext.levelStageAdapter &&
        typeof shellContext.levelStageAdapter.bindGlobe3dRuntime === "function"
          ? shellContext.levelStageAdapter.bindGlobe3dRuntime(args)
          : null
      ),
      getPhys: () => (runtime.stage ? runtime.stage.phys : {}),
      getWorldSystem: () => (runtime.stage ? runtime.stage.worldSystem : null),
      getWorldItemSpawns: () => (
        (
          runtime &&
          runtime.currentLevelMapSummary &&
          Array.isArray(runtime.currentLevelMapSummary.worldItemSpawns) &&
          runtime.currentLevelMapSummary.worldItemSpawns.length
        )
          ? runtime.currentLevelMapSummary.worldItemSpawns
          : (
              getActiveShellStageAdapter(shellContext) &&
              typeof getActiveShellStageAdapter(shellContext).getWorldItemSpawns === "function"
                ? getActiveShellStageAdapter(shellContext).getWorldItemSpawns()
                : []
            )
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
      executeWordCastAction: (castActionId, context = {}) => shellExecuteWordCastAction(shellContext, castActionId, context),
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

function createShellSurfaceRefs({ devStagingView, orbStageView, levelStageView } = {}) {
  return {
    dev: devStagingView && devStagingView.refs ? devStagingView.refs : Object.create(null),
    orb: orbStageView && orbStageView.refs ? orbStageView.refs : Object.create(null),
    level: levelStageView && levelStageView.refs ? levelStageView.refs : Object.create(null),
  };
}

function isShellEditableTarget(target) {
  const el = target && target.nodeType === 1 ? target : null;
  if (!el) return false;
  if (typeof el.closest === "function" && el.closest("input, textarea, select, [contenteditable='true']")) {
    return true;
  }
  return !!(el.isContentEditable);
}

function bindShellModeHotkeys(shellContext) {
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  const modeController = shellContext && shellContext.modeController ? shellContext.modeController : null;
  if (!rootDocument || !modeController || !rootDocument.defaultView) return () => {};

  const onKeyDown = (event) => {
    if (!event || event.defaultPrevented) return;
    if (!event.metaKey || !event.shiftKey || event.ctrlKey || event.altKey) return;
    if (isShellEditableTarget(event.target)) return;
    const key = String(event.key || "").toLowerCase();
    const code = String(event.code || "");
    if (code === "Digit1") {
      event.preventDefault();
      modeController.setMode(STAGING_SHELL_MODE.splitLab);
      return;
    }
    if (code === "Digit2") {
      event.preventDefault();
      modeController.setDevStageVisibility(STAGING_DEV_STAGE_VISIBILITY.hidden);
      modeController.setMode(STAGING_SHELL_MODE.levelStage);
      return;
    }
    if (key === "d") {
      const state = modeController.getState();
      if (state.mode !== STAGING_SHELL_MODE.levelStage) return;
      event.preventDefault();
      modeController.toggleDevStageVisibility();
    }
  };

  rootDocument.defaultView.addEventListener("keydown", onKeyDown);
  return () => {
    rootDocument.defaultView.removeEventListener("keydown", onKeyDown);
  };
}

function createOrbStageAdapter(orbStageView = null) {
  return (
    orbStageView &&
    orbStageView.adapter &&
    typeof orbStageView.adapter.getStageElements === "function"
  )
    ? orbStageView.adapter
    : null;
}

function createLevelStageAdapter(levelStageView = null) {
  return (
    levelStageView &&
    levelStageView.adapter &&
    typeof levelStageView.adapter.getStageElements === "function"
  )
    ? levelStageView.adapter
    : null;
}

function getShellModeState(shellContext) {
  const modeController = shellContext && shellContext.modeController ? shellContext.modeController : null;
  return modeController && typeof modeController.getState === "function"
    ? modeController.getState()
    : { mode: STAGING_SHELL_MODE.splitLab };
}

function getActiveShellStageAdapter(shellContext) {
  return shellContext && shellContext.activeStageAdapter ? shellContext.activeStageAdapter : null;
}

function getActiveShellStageElements(shellContext) {
  const adapter = getActiveShellStageAdapter(shellContext);
  return adapter && typeof adapter.getStageElements === "function"
    ? adapter.getStageElements()
    : {};
}

function assignShellStageElements(shellContext, nextStageEls = {}) {
  if (!shellContext) return {};
  if (!shellContext.stageEls || typeof shellContext.stageEls !== "object") {
    shellContext.stageEls = {};
  }
  const target = shellContext.stageEls;
  for (const key of Object.keys(target)) {
    if (!Object.prototype.hasOwnProperty.call(nextStageEls, key)) {
      delete target[key];
    }
  }
  for (const [key, value] of Object.entries(nextStageEls || {})) {
    target[key] = value;
  }
  return target;
}

function refreshShellActiveStageRuntimeBindings(shellContext) {
  if (!shellContext) return;
  const runtime = shellContext.runtime || null;
  const activeStageEls = getActiveShellStageElements(shellContext);
  assignShellStageElements(shellContext, activeStageEls);
  if (!runtime) return;

  if (runtime.vfxDefaults && runtime.shellVfxMods) {
    initShellReceiverVfxRuntime(shellContext, runtime.shellVfxMods);
  }

  runtime.orbStageActions = createOrbStageActionBridge({
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

  const activeAdapter = getActiveShellStageAdapter(shellContext);
  const activeRoot = activeAdapter && activeAdapter.refs ? activeAdapter.refs.root : null;
  runtime.orbShatterController = (
    activeAdapter &&
    typeof activeAdapter.createOrbShatterController === "function" &&
    runtime.vfx &&
    runtime.vfx.orbShatterRuntime
  )
    ? activeAdapter.createOrbShatterController({
        root: activeRoot,
        getOrbShatterRuntime: () => (
          runtime && runtime.vfx
            ? runtime.vfx.orbShatterRuntime
            : null
        ),
        getOrbColorState: () => (
          runtime &&
          runtime.orbColorRuntime &&
          typeof runtime.orbColorRuntime.getCurrentState === "function"
            ? runtime.orbColorRuntime.getCurrentState()
            : null
        ),
        getBaseFillAlpha: () => 0.20,
        clamp,
        clamp01,
      })
    : null;
}

function syncLevelStageGlobe3dRuntime(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const levelAdapter = shellContext && shellContext.levelStageAdapter ? shellContext.levelStageAdapter : null;
  if (!runtime || !levelAdapter || typeof levelAdapter.bindGlobe3dRuntime !== "function") return;
  const levelSpawns = typeof levelAdapter.getWorldItemSpawns === "function"
    ? levelAdapter.getWorldItemSpawns()
    : [];
  const summarySpawns = (
    runtime.currentLevelMapSummary &&
    Array.isArray(runtime.currentLevelMapSummary.worldItemSpawns)
  )
    ? runtime.currentLevelMapSummary.worldItemSpawns
    : [];
  const spawns = Array.isArray(summarySpawns) && summarySpawns.length ? summarySpawns : levelSpawns;
  levelAdapter.bindGlobe3dRuntime({
    eventBus: runtime.eventBus,
    spawns,
  });
}

function syncActiveShellStage(shellContext) {
  if (!shellContext) return null;
  const modeState = getShellModeState(shellContext);
  const activeStageAdapter = modeState.mode === STAGING_SHELL_MODE.levelStage
    ? shellContext.levelStageAdapter
    : shellContext.orbStageAdapter;
  shellContext.activeStageAdapter = activeStageAdapter || shellContext.orbStageAdapter || null;
  refreshShellActiveStageRuntimeBindings(shellContext);
  const runtime = shellContext.runtime || null;
  if (runtime) {
    runtime.stageRectCache = null;
    runtime.frameMetrics = null;
  }
  void hydrateShellCurrentLevelMapSummary(shellContext).then(() => {
    const stage = runtime && runtime.stage ? runtime.stage : null;
    if (stage && stage.phys) {
      stage.phys.worldHeightPx = shellWorldHeight(shellContext);
      stage.phys.worldWidthPx = shellWorldWidth(shellContext);
    }
    if (stage && stage.worldSystem && typeof stage.worldSystem.setSpawns === "function") {
      const nextSpawns = (
        runtime &&
        runtime.currentLevelMapSummary &&
        Array.isArray(runtime.currentLevelMapSummary.worldItemSpawns)
      )
        ? runtime.currentLevelMapSummary.worldItemSpawns
        : (
            shellContext.activeStageAdapter &&
            typeof shellContext.activeStageAdapter.getWorldItemSpawns === "function"
              ? shellContext.activeStageAdapter.getWorldItemSpawns()
              : []
          );
      stage.worldSystem.setSpawns(nextSpawns, performance.now());
      syncLevelStageGlobe3dRuntime(shellContext);
    }
    if (runtime && runtime.cameraRuntime && typeof runtime.cameraRuntime.reset === "function") {
      runtime.cameraRuntime.reset();
    }
    if (runtime && runtime.stage) {
      resetShellOrbToGround(shellContext);
      activateShellStageVisuals(shellContext);
    }
  });
  return shellContext.activeStageAdapter;
}

function refreshShellOverlayLayout(shellContext) {
  if (!shellContext) return;
  const runtime = shellContext.runtime || null;
  if (runtime) {
    runtime.stageRectCache = null;
    runtime.frameMetrics = null;
  }
  updateShellFrameMetrics(shellContext, performance.now());
  ensureShellStageBackdrop(shellContext);
  updateShellStageReadouts(shellContext);
  drawShellStars(shellContext);
  drawShellBackdrop(shellContext);
  applyShellGroundLine(shellContext);
  applyShellOrbTransform(shellContext);
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

function shellGameplayLevel(shellContext) {
  if (!shellContext) return null;
  const modeState = getShellModeState(shellContext);
  if (modeState.mode === STAGING_SHELL_MODE.levelStage) {
    return shellContext.designLevel || shellContext.gameplayLevel || null;
  }
  return shellContext.gameplayLevel || shellContext.designLevel || null;
}

function createStagingShellContext({
  rootDocument,
  devStagingView,
  orbStageView,
  levelStageView,
  gameplayLevel = DEFAULT_ORB_STAGE_LEVEL,
  designLevel = DEFAULT_LEVEL_STAGE_LEVEL,
  sharedModules,
  modeController = null,
  perfTrace = null,
} = {}) {
  const surfaceRefs = createShellSurfaceRefs({ devStagingView, orbStageView, levelStageView });
  const orbStageAdapter = createOrbStageAdapter(orbStageView);
  const levelStageAdapter = createLevelStageAdapter(levelStageView);
  const activeStageAdapter = orbStageAdapter || levelStageAdapter || null;
  const stageEls = (
    activeStageAdapter && typeof activeStageAdapter.getStageElements === "function"
      ? { ...activeStageAdapter.getStageElements() }
      : {}
  );
  return {
    rootDocument,
    views: {
      devStagingView,
      orbStageView,
      levelStageView,
    },
    modeController,
    gameplayLevel,
    designLevel,
    refs: surfaceRefs,
    orbStageAdapter,
    levelStageAdapter,
    activeStageAdapter,
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
      perfTrace,
      eventBus: null,
      worldSystem: null,
      orbRuntimeLoop: null,
      orbRuntimeState: null,
      stage: null,
      currentLevelMapSummary: null,
      currentLevelBoundarySegments: null,
      shellVfxMods: null,
      shellModeController: modeController,
      shellModeHotkeyOff: null,
      shellModeOff: null,
    },
  };
}

async function hydrateShellCurrentLevelMapSummary(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const level = shellGameplayLevel(shellContext);
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : null;
  const assetUrl = String(mapSource && mapSource.assetUrl || "").trim();
  if (!runtime || !mapSource || !assetUrl) {
    if (runtime) {
      runtime.currentLevelMapSummary = null;
      runtime.currentLevelBoundarySegments = null;
    }
    return null;
  }
  try {
    const authoredScene = await loadAuthoredLevelScene({
      level,
      worldWidthPx: shellWorldWidth(shellContext),
      worldHeightPx: shellWorldHeight(shellContext),
    });
    const summary = authoredScene ? authoredScene.summary : null;
    runtime.currentLevelMapSummary = summary;
    runtime.currentLevelBoundarySegments = buildBoundarySegmentsFromLoops(summary && summary.loops);
    return summary;
  } catch (error) {
    runtime.currentLevelMapSummary = null;
    runtime.currentLevelBoundarySegments = null;
    try { console.warn("[staging-shell] failed to hydrate level map summary", error); } catch (_) {}
    return null;
  }
}

function exposeShellContext(rootDocument, shellContext) {
  const win = rootDocument && rootDocument.defaultView;
  if (!win) return;
  win.__orbisStagingShell = shellContext;
}

function bindShellCameraInputPanel(shellContext) {
  const devRefs = shellContext && shellContext.refs ? shellContext.refs.dev : null;
  const cameraInputRuntime = shellContext && shellContext.runtime ? shellContext.runtime.cameraInput : null;
  if (!devRefs || !cameraInputRuntime) return null;
  let latestCameraState = typeof cameraInputRuntime.getState === "function"
    ? cameraInputRuntime.getState()
    : null;
  let gameplayInterval = 0;

  const cameraInputPanel = createCameraInputPanelController({
    els: devRefs,
    onOpenChange: (isOpen) => {
      if (isOpen) {
        if (latestCameraState) cameraInputPanel.renderState(latestCameraState);
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
  cameraInputPanel.bind();
  if (latestCameraState && cameraInputPanel.isOpen()) {
    cameraInputPanel.renderState(latestCameraState);
  }
  function renderGameplayState() {
    if (!cameraInputPanel.isOpen()) return;
    const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
    cameraInputPanel.renderGameplayState({
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
        if (cameraInputPanel.isOpen()) {
          cameraInputPanel.renderState(state);
        }
      })
    : () => {};

  return {
    cameraInputPanel,
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
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!runtime || !activeStageAdapter || typeof activeStageAdapter.ensureBackdrop !== "function" || !rootDocument) return;

  const rect = shellStageRect(shellContext);
  const gameplayLevel = shellGameplayLevel(shellContext);
  const terrainProfile = Array.isArray(gameplayLevel && gameplayLevel.terrain && gameplayLevel.terrain.profile)
    ? gameplayLevel.terrain.profile
    : (Array.isArray(gameplayLevel && gameplayLevel.terrainProfile)
        ? gameplayLevel.terrainProfile
        : []);
  activeStageAdapter.ensureBackdrop({
    runtime,
    rootDocument,
    rect,
    worldHeight: shellWorldHeight(shellContext),
    terrainProfile,
    lineArtShapes: Array.isArray(runtime.currentLevelMapSummary && runtime.currentLevelMapSummary.lineArtShapes)
      ? runtime.currentLevelMapSummary.lineArtShapes
      : [],
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
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !activeStageAdapter || typeof activeStageAdapter.drawStars !== "function" || !stageBackdrop) return;
  const h = stageBackdrop.height || 0;
  const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, h);
  activeStageAdapter.drawStars({
    runtime,
    camTop,
  });
}

function drawShellBackdrop(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !activeStageAdapter || typeof activeStageAdapter.drawBackdrop !== "function" || !stageBackdrop) return;
  const groundY = shellGroundLineScreenY(shellContext);
  activeStageAdapter.drawBackdrop({
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
    BUBBLE_SHIELD_3D_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    SHOCKWAVE_3D_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    FLAME_AOE_3D_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    TELEPORT_PRESET_DEFAULT,
    ORB_NOD_PRESET_DEFAULT,
    ORB_NOD_3D_PRESET_DEFAULT,
    ORB_SPAWN_PRESET_DEFAULT,
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
      bubbleShield3d: BUBBLE_SHIELD_3D_PRESET_DEFAULT,
      shockwave: SHOCKWAVE_PRESET_DEFAULT,
      shockwave3d: SHOCKWAVE_3D_PRESET_DEFAULT,
      flameAoe: FLAME_AOE_PRESET_DEFAULT,
      flameAoe3d: FLAME_AOE_3D_PRESET_DEFAULT,
      electricAoe: ELECTRIC_AOE_PRESET_DEFAULT,
      teleport: TELEPORT_PRESET_DEFAULT,
      orbNod: ORB_NOD_PRESET_DEFAULT,
      orbNod3d: ORB_NOD_3D_PRESET_DEFAULT,
      orbSpawn: ORB_SPAWN_PRESET_DEFAULT,
    });
  }
  runtime.vfxDefaults = vfxDefaults;
  const shellVfx = initShellReceiverVfxRuntime(shellContext, {
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
  });
  const getRuntimeVfx = () => (
    runtime && runtime.vfx ? runtime.vfx : shellVfx || null
  );
  runtime.orbStageActions = createOrbStageActionBridge({
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

  const shellVoiceSpellCastOff = eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_CAST, (payload = {}) => {
    shellHandleVoiceSpellCast(shellContext, payload);
  });
  runtime.receiverSpellRuntime = {
    teleportOrbRuntimeToSpawn: (typeof teleportOrbRuntimeToSpawn === "function") ? teleportOrbRuntimeToSpawn : null,
    grantOrbGraceRuntime: (typeof grantOrbGraceRuntime === "function") ? grantOrbGraceRuntime : null,
  };
  const shellSpellActionHandlers = createSpellActionHandlersImported({
    eventBus,
    playElectricAoe: () => (
      getRuntimeVfx() && typeof getRuntimeVfx().playElectricAoe === "function"
        ? getRuntimeVfx().playElectricAoe()
        : { handled: false }
    ),
    playFlameAoe: (payload = {}) => (
      shellPlayFlameAoe(shellContext, payload)
    ),
    playTeleport: (payload = {}) => (
      getRuntimeVfx() && typeof getRuntimeVfx().playTeleport === "function"
        ? getRuntimeVfx().playTeleport(payload)
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
      getRuntimeVfx() && typeof getRuntimeVfx().triggerShockwave === "function"
        ? getRuntimeVfx().triggerShockwave()
        : { handled: false }
    ),
    teleportOrbToSpawnNeutralizePhysics: (aboveGroundPx) => shellTeleportOrbToSpawnNeutralizePhysics(shellContext, aboveGroundPx),
    activateBubbleShield: ({ durationMs } = {}) => shellActivateBubbleShield(shellContext, { durationMs }),
    applyColorize: (payload) => shellApplyColorize(shellContext, payload),
    clearColorize: () => shellClearColorize(shellContext),
    domusTeleportAboveGroundPx: 0,
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
    return shellExecuteWordCastAction(shellContext, castActionId, context);
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
    shellVoiceSpellCastOff,
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
  moduleCacheBustV = "20260504c",
  bootStatus = null,
} = {}) {
  const docEl = rootDocument.documentElement;
  const devRoot = rootDocument.getElementById("devStagingMount");
  const orbRoot = rootDocument.getElementById("orbStageMount");
  const levelRoot = rootDocument.getElementById("levelStageMount");
  const modeController = createStagingShellModeController({
    rootDocument,
    defaultMode: STAGING_SHELL_MODE.splitLab,
    defaultDevStageVisibility: STAGING_DEV_STAGE_VISIBILITY.shown,
  });

  if (docEl) {
    docEl.dataset.stagingShellBoot = STAGING_SHELL_STATUS.booting;
  }
  if (bootStatus && typeof bootStatus.setStatus === "function") {
    bootStatus.setStatus({
      phase: STAGING_SHELL_STATUS.booting,
      detail: "Mounting shell surfaces",
      state: "booting",
    });
  }

  const gameplayLevel = DEFAULT_ORB_STAGE_LEVEL;
  const designLevel = DEFAULT_LEVEL_STAGE_LEVEL;
  const perfTrace = createPerfTrace();
  perfTrace.installGlobal(rootDocument && rootDocument.defaultView ? rootDocument.defaultView : window);
  const devStagingView = devRoot ? mountDevStaging(devRoot) : null;
  const orbStageView = orbRoot ? renderOrbStage(orbRoot, { level: gameplayLevel }) : null;
  const levelStageView = levelRoot
    ? renderLevelStage(levelRoot, {
        level: designLevel,
        externalCameraAuthority: true,
        perfTrace,
      })
    : null;

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
    if (devStagingView && devStagingView.refs) {
      safeSetHtml(devStagingView.refs.kwsReadout, "shell:modules_ready");
      safeSetText(devStagingView.refs.rulesReadout, "boot:shared_modules_ready");
    }
    const shellContext = createStagingShellContext({
      rootDocument,
      devStagingView,
      orbStageView,
      levelStageView,
      gameplayLevel,
      designLevel,
      sharedModules,
      modeController,
      perfTrace,
    });
    shellContext.bootStatus = bootStatus;
    syncActiveShellStage(shellContext);
    if (modeController && typeof modeController.subscribe === "function") {
      let previousModeState = modeController.getState();
      shellContext.runtime.shellModeOff = modeController.subscribe((nextModeState) => {
        const previousMode = previousModeState && previousModeState.mode;
        const nextMode = nextModeState && nextModeState.mode;
        const previousVisibility = previousModeState && previousModeState.devStageVisibility;
        const nextVisibility = nextModeState && nextModeState.devStageVisibility;
        previousModeState = nextModeState;

        if (previousMode !== nextMode) {
          syncActiveShellStage(shellContext);
          return;
        }

        if (previousVisibility !== nextVisibility) {
          refreshShellOverlayLayout(shellContext);
        }
      });
    }
    shellContext.runtime.shellModeHotkeyOff = bindShellModeHotkeys(shellContext);
    const createOrbColorRuntime =
      sharedModules.orbColorRuntimeModule &&
      sharedModules.orbColorRuntimeModule.createOrbColorRuntime;
    const orbStageRoot = orbStageView && orbStageView.root
      ? orbStageView.root
      : null;
    shellContext.runtime.orbColorRuntime = (typeof createOrbColorRuntime === "function")
      ? createOrbColorRuntime({
          root: orbStageRoot,
          getRoot: () => {
            const activeAdapter = getActiveShellStageAdapter(shellContext);
            const activeRoot = activeAdapter && activeAdapter.refs ? activeAdapter.refs.root : null;
            return activeRoot || orbStageRoot || null;
          },
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
      preferredHand: "Any",
      cameraInputBackend: "orb-control-worker",
    });
    shellContext.runtime.cameraInputOrbBridge = createCameraInputOrbBridge({
      cameraInputRuntime: shellContext.runtime.cameraInput,
    });
    shellContext.runtime.cameraInputDebug = bindShellCameraInputPanel(shellContext);
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.sharedModulesReady,
        detail: "Booting KWS runtime",
        state: "booting",
      });
    }
    await initShellKwsRuntime(shellContext);
    await hydrateShellCurrentLevelMapSummary(shellContext);
    initializeShellStageRuntime(shellContext);
    syncLevelStageGlobe3dRuntime(shellContext);
    const orbStageAdapter = shellContext.orbStageAdapter || null;
    shellContext.runtime.orbShatterController = (
      orbStageAdapter &&
      typeof orbStageAdapter.createOrbShatterController === "function" &&
      shellContext.runtime.vfx &&
      shellContext.runtime.vfx.orbShatterRuntime
    )
      ? orbStageAdapter.createOrbShatterController({
          root: orbStageRoot,
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
    bindShellPerfTraceControls(shellContext);
    startShellStageLoop(shellContext);
    if (bootStatus && typeof bootStatus.setStatus === "function") {
      bootStatus.setStatus({
        phase: STAGING_SHELL_STATUS.localStageReady,
        detail: "Local orb-stage runtime active",
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
