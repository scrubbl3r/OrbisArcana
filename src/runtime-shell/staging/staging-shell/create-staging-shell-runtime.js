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
import { renderOrbStage } from "../orb-stage/orb-stage.js?v=20260507v";
import { getLevelById } from "../../../content/levels/registry.js";
import {
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  LEVEL_CAMERA_INITIAL_TARGET_FALLBACK,
  LEVEL_CAMERA_MODE_GAMEPLAY,
} from "../../../game-runtime/level/normalize-level-definition.js";
import { resolveLevelWorldSize } from "../../../game-runtime/level/resolve-level-world-size.js";
import { createOrbStageReceiverVfxDefaults, initOrbStageReceiverVfxRuntime } from "../orb-stage/orb-stage-vfx-runtime.js?v=20260507ae";
import { createOrbStageActionBridge } from "../orb-stage/orb-stage-action-bridge.js?v=20260507e";
import { loadStagingInitModules } from "../load-staging-init-modules.js?v=20260507j";
import { createReceiverStabilityVisualController } from "../../receiver/stability-visuals.js";
import { bootstrapShellReceiverHostRuntimeAssembly } from "./receiver-host-runtime-bootstrap.js?v=20260507k";
import { createShellReceiverConfigs } from "./receiver-configs.js";
import { bootstrapShellPairingRuntime } from "./pairing-runtime-bootstrap.js?v=20260423a";
import { bootstrapShellKwsRuntimeBase } from "./kws-runtime-bootstrap.js";
import {
  bindShellRootWakeWindows,
  bindShellWakeWindowVisuals,
} from "./kws-wake-window-bridge.js";
import { bindShellRuleActionRuntime } from "./shell-rule-action-runtime.js";
import {
  executeShellWordCastAction,
  handleShellVoiceSpellCast,
} from "./shell-voice-spell-runtime.js";
import { createShellSpellActionRuntime } from "./shell-spell-action-runtime.js";
import { bindShellKwsEventRuntime } from "./shell-kws-event-runtime.js";
import { bindShellKwsTraceRuntime } from "./shell-kws-trace-runtime.js";
import {
  createStagingShellModeController,
  STAGING_DEV_STAGE_VISIBILITY,
  STAGING_SHELL_MODE,
} from "./staging-shell-mode-controller.js?v=20260421a";
import { renderGameStage } from "../game-stage/game-stage.js?v=20260506e";
import { createCameraRuntime } from "../../../game-runtime/camera/camera-runtime.js";
import { resolveOrbSpinColor } from "../../../game-runtime/orb/orb-spin-color.js?v=20260502b";
import { createCameraInputPanelController } from "../../../ui/dev-console/camera-input/camera-input-panel-controller.js?v=20260421i";
import { createCameraInputOrbBridge } from "./camera-input-orb-bridge.js?v=20260501e";
import {
  resolveLevelCameraAnchor,
  resolveLevelSpawnPoint,
} from "../../../game-runtime/level/resolve-level-spawn-point.js";
import { buildBoundarySegmentsFromLoops } from "../../../game-runtime/collision/boundary-segments.js?v=20260423g";
import { loadAuthoredLevelScene } from "../../../game-runtime/level/load-authored-level-scene.js?v=20260506a";
import {
  AUTHORED_LEVEL_READ_MODEL_KEY_BOUNDARY_BOX,
  AUTHORED_LEVEL_READ_MODEL_KEY_CAMERA_BOUNDARY_BOX,
  AUTHORED_LEVEL_READ_MODEL_KEY_DEPTH_LAYERS,
  AUTHORED_LEVEL_READ_MODEL_KEY_LOOPS,
  AUTHORED_LEVEL_READ_MODEL_KEY_WORLD_ITEMS,
  resolveAuthoredLevelReadModelArray,
  resolveAuthoredLevelReadModelBox,
  resolveAuthoredLevelReadModelSpawn,
} from "../../../game-runtime/level/authored-level-read-model.js";
import {
  resolveStageCameraClampBounds,
  resolveStageCameraConfig,
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../../../game-runtime/level/authored-level-camera.js?v=20260506a";
import { createPerfTrace } from "../perf-trace.js?v=20260430b";
import {
  shellGroundLineScreenY as resolveShellGroundLineScreenY,
} from "./shell-ground-line.js";

globalThis.__orbisStagingShellRuntimeVersion = "20260507ci";

export const STAGING_SHELL_STATUS = Object.freeze({
  booting: "booting",
  sharedModulesReady: "shared-modules-ready",
  localStageReady: "local-stage-ready",
  pairingBooting: "pairing-booting",
  pairingReady: "pairing-ready",
  bootFailed: "boot-failed",
});

const DEFAULT_ORB_HANGAR = getLevelById("orb-hangar");
const DEFAULT_GAME_STAGE_LEVEL = getLevelById("reactor-shaft");

function safeSetText(el, value) {
  if (!el) return;
  el.textContent = String(value || "");
}

function safeSetHtml(el, value) {
  if (!el) return;
  el.innerHTML = String(value || "");
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
    const bootTarget = spawnPoint || shellActiveStageCameraTarget(shellContext, initialState);
    cameraRuntime.resolveFrame(buildShellCameraResolveArgs(shellContext, {
      targetXW: bootTarget.xW,
      targetYW: bootTarget.yW,
      viewportWidthPx: bootRect.width || 0,
      viewportHeightPx: bootRect.height || 0,
      followMode: LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
      deadzoneWidthPx: 0,
      deadzoneHeightPx: 0,
      deadzoneWidthRatio: 0,
      deadzoneHeightRatio: 0,
      followLerpX: 1,
      followLerpY: 1,
    }));
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
  return Math.max(0.01, shellOrbVisualDiameterPx(shellContext)) / 100;
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
  const worldSize = shellActiveStageWorldSize(shellContext);
  return worldSize.heightPx;
}

function shellWorldWidth(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const runtimeWorldWidth = Number(stage && stage.phys && stage.phys.worldWidthPx);
  if (Number.isFinite(runtimeWorldWidth) && runtimeWorldWidth > 0) return runtimeWorldWidth;
  const worldSize = shellActiveStageWorldSize(shellContext);
  return worldSize.widthPx;
}

function shellActiveStageWorldSize(shellContext) {
  const activeLevel = shellActiveStageLevel(shellContext);
  if (activeLevel) {
    const levelWorldSize = resolveLevelWorldSize(activeLevel);
    const widthPx = Number(levelWorldSize && levelWorldSize.widthPx);
    const heightPx = Number(levelWorldSize && levelWorldSize.heightPx);
    if (
      Number.isFinite(widthPx) &&
      widthPx > 0 &&
      Number.isFinite(heightPx) &&
      heightPx > 0
    ) {
      return { widthPx, heightPx };
    }
  }
  const rect = shellStageRect(shellContext);
  return {
    widthPx: Math.max(1, Number(rect.width) || 0),
    heightPx: 5000,
  };
}

function shellActiveStageCameraFollowMode(shellContext) {
  const activeLevel = shellActiveStageLevel(shellContext);
  return resolveStageCameraFollowMode(activeLevel, LEVEL_CAMERA_MODE_GAMEPLAY, LEVEL_CAMERA_FOLLOW_MODE_FALLBACK);
}

function shellActiveStageCameraZoom(shellContext) {
  const activeLevel = shellActiveStageLevel(shellContext);
  return resolveStageCameraZoom(activeLevel, LEVEL_CAMERA_MODE_GAMEPLAY, 1);
}

function shellActiveStageCameraConfig(shellContext) {
  const activeLevel = shellActiveStageLevel(shellContext);
  return resolveStageCameraConfig(activeLevel, {
    mode: LEVEL_CAMERA_MODE_GAMEPLAY,
    worldWidthPx: shellWorldWidth(shellContext),
    worldHeightPx: shellWorldHeight(shellContext),
    groundCenterWorld: () => shellGroundCenterWorld(shellContext),
  });
}

function shellResolvedSpawnPoint(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const readModelSpawn = resolveAuthoredLevelReadModelSpawn(runtime);
  if (readModelSpawn) return readModelSpawn;
  return resolveLevelSpawnPoint(shellActiveStageLevel(shellContext), {
    worldWidthPx: shellWorldWidth(shellContext),
    groundCenterWorld: () => shellGroundCenterWorld(shellContext),
  });
}

function shellResolvedCollisionBox(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  return resolveAuthoredLevelReadModelBox(runtime, AUTHORED_LEVEL_READ_MODEL_KEY_BOUNDARY_BOX);
}

function shellResolvedBoundarySegments(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  return Array.isArray(runtime && runtime.authoredLevelBoundarySegments)
    ? runtime.authoredLevelBoundarySegments
    : [];
}

function buildShellBoundarySegmentsFromReadModel(readModel = null) {
  const loops = resolveAuthoredLevelReadModelArray(readModel, AUTHORED_LEVEL_READ_MODEL_KEY_LOOPS);
  return buildBoundarySegmentsFromLoops(loops);
}

function clearShellAuthoredLevelReadModel(runtime = null) {
  if (!runtime) return;
  runtime.authoredLevelReadModel = null;
  runtime.authoredLevelBoundarySegments = null;
}

function applyShellAuthoredLevelReadModel(runtime = null, readModel = null) {
  if (!runtime) return null;
  const summary = readModel && readModel.summary ? readModel.summary : null;
  runtime.authoredLevelReadModel = readModel || null;
  runtime.authoredLevelBoundarySegments = buildShellBoundarySegmentsFromReadModel(readModel);
  return summary;
}

function shellResolvedWorldItems(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const readModelWorldItems = resolveAuthoredLevelReadModelArray(runtime, AUTHORED_LEVEL_READ_MODEL_KEY_WORLD_ITEMS);
  if (readModelWorldItems.length) return readModelWorldItems;
  const getWorldItems = getActiveShellStageMethod(shellContext, "getWorldItems");
  return getWorldItems
    ? getWorldItems.method.call(getWorldItems.activeAdapter)
    : [];
}

function shellResolvedDepthLayers(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  return resolveAuthoredLevelReadModelArray(runtime, AUTHORED_LEVEL_READ_MODEL_KEY_DEPTH_LAYERS);
}

function shellResolvedCavityCollisionConfig(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const depthLayers = shellResolvedDepthLayers(shellContext);
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
  return resolveAuthoredLevelReadModelBox(runtime, AUTHORED_LEVEL_READ_MODEL_KEY_CAMERA_BOUNDARY_BOX);
}

function shellActiveStageCameraClampBounds(shellContext) {
  return resolveStageCameraClampBounds({
    worldWidthPx: shellWorldWidth(shellContext),
    worldHeightPx: shellWorldHeight(shellContext),
    cameraBoundaryBox: shellResolvedCameraBoundaryBox(shellContext),
    boundaryBox: shellResolvedCollisionBox(shellContext),
  });
}

function shellActiveStageCameraTarget(shellContext, orbState = null) {
  const activeLevel = shellActiveStageLevel(shellContext);
  const camera = activeLevel && activeLevel.camera
    ? activeLevel.camera
    : null;
  const initialTarget = String(camera && camera.initialTarget || LEVEL_CAMERA_INITIAL_TARGET_FALLBACK).trim().toLowerCase();
  const spawnPoint = shellResolvedSpawnPoint(shellContext);
  const anchorTarget = initialTarget.startsWith("anchor:")
    ? resolveLevelCameraAnchor(
        activeLevel,
        initialTarget.slice("anchor:".length),
        {
          worldWidthPx: shellWorldWidth(shellContext),
          groundCenterWorld: () => shellGroundCenterWorld(shellContext),
        }
      )
    : null;
  if (orbState) {
    return {
      xW: Number(orbState.xW) || shellStageCenterX(shellContext),
      yW: Number(orbState.yW) || shellGroundCenterWorld(shellContext),
    };
  }
  if (initialTarget === LEVEL_CAMERA_INITIAL_TARGET_FALLBACK && spawnPoint) return spawnPoint;
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
    return Math.max(0, Number(collisionBox.bottomYW) - shellOrbRadiusPx(shellContext));
  }
  if (!stage || !stage.phys) return 0;
  const WORLD_H = Number(stage.phys.worldHeightPx) || shellWorldHeight(shellContext);
  const phys = stage.phys;
  return WORLD_H - (
    (Number(phys.groundFromBottomPx) || 17) +
    (Number(phys.groundLinePx) || 2) +
    shellOrbRadiusPx(shellContext)
  );
}

function shellCeilingWorld(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  const collisionBox = shellResolvedCollisionBox(shellContext);
  if (collisionBox && stage && stage.phys) {
    return Math.max(0, Number(collisionBox.topYW) + shellOrbRadiusPx(shellContext));
  }
  return shellOrbRadiusPx(shellContext);
}

function shellOrbRadiusPx(shellContext) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  return Number(stage && stage.phys && stage.phys.orbRadiusPx) || 50;
}

function shellOrbVisualRadiusPx(shellContext) {
  const visualState = getShellOrbBaseVisualState(shellContext);
  const visualRadiusPx = Number(visualState && visualState.radiusPx);
  if (Number.isFinite(visualRadiusPx) && visualRadiusPx > 0) return visualRadiusPx;
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  return Number(stage && stage.phys && stage.phys.orbRadiusPx) || 0;
}

function shellOrbVisualDiameterPx(shellContext) {
  const visualState = getShellOrbBaseVisualState(shellContext);
  return Math.max(1, Number(visualState && visualState.diameterPx) || 100);
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
  const orbRadiusPx = shellOrbRadiusPx(shellContext);
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
  const target = shellActiveStageCameraTarget(shellContext, { xW: shellStageCenterX(shellContext), yW });
  const frame = cameraRuntime && typeof cameraRuntime.resolveFrame === "function"
    ? cameraRuntime.resolveFrame(buildShellCameraResolveArgs(shellContext, {
        targetXW: target.xW,
        targetYW: target.yW,
        viewportWidthPx: shellStageRect(shellContext).width || 0,
        viewportHeightPx: stageH,
        nowMs,
      }))
    : null;
  return Number(frame && frame.camTop) || 0;
}

function buildShellCameraResolveArgs(shellContext, args = {}) {
  const cameraConfig = shellActiveStageCameraConfig(shellContext);
  const clampBounds = shellActiveStageCameraClampBounds(shellContext);
  return {
    worldWidthPx: shellWorldWidth(shellContext),
    worldHeightPx: shellWorldHeight(shellContext),
    zoom: shellActiveStageCameraZoom(shellContext),
    followMode: shellActiveStageCameraFollowMode(shellContext),
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
    ...args,
  };
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
  const target = shellActiveStageCameraTarget(shellContext, orbState);
  const frame = cameraRuntime && typeof cameraRuntime.resolveFrame === "function"
    ? cameraRuntime.resolveFrame(buildShellCameraResolveArgs(shellContext, {
        targetXW: target.xW,
        targetYW: target.yW,
        viewportWidthPx: rect.width || 0,
        viewportHeightPx: rect.height || 0,
      }))
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
  const orbRadiusPx = shellOrbRadiusPx(shellContext);
  const cameraRuntime = runtime && runtime.cameraRuntime ? runtime.cameraRuntime : null;
  const collisionBox = shellResolvedCollisionBox(shellContext);
  const target = shellActiveStageCameraTarget(shellContext, orbState);
  const perfTrace = runtime.perfTrace || null;
  const cameraResolveArgs = buildShellCameraResolveArgs(shellContext, {
    targetXW: target.xW,
    targetYW: target.yW,
    viewportWidthPx: safeRect.width || 0,
    viewportHeightPx: safeRect.height || 0,
    nowMs,
    target: scratch.cameraResolvedFrame,
  });
  const frame = cameraRuntime && typeof cameraRuntime.resolveFrame === "function"
    ? (
        perfTrace && typeof perfTrace.measure === "function"
          ? perfTrace.measure("camera.resolve", () => cameraRuntime.resolveFrame(cameraResolveArgs))
          : cameraRuntime.resolveFrame(cameraResolveArgs)
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
  const applyCameraFrame = getActiveShellStageMethod(shellContext, "applyCameraFrame");
  if (applyCameraFrame) {
    const args = scratch.cameraFrameArgs;
    args.camLeft = camLeft;
    args.camTop = camTop;
    args.zoom = zoom;
    args.worldWidthPx = metrics.worldWidthPx;
    args.worldHeightPx = metrics.worldHeightPx;
    if (perfTrace && typeof perfTrace.measure === "function") {
      perfTrace.measure("stage.applyCameraFrame", () => applyCameraFrame.method.call(applyCameraFrame.activeAdapter, args));
    } else {
      applyCameraFrame.method.call(applyCameraFrame.activeAdapter, args);
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
  const applyGroundLine = getActiveShellStageMethod(shellContext, "applyGroundLine");
  if (!stage || !stage.phys || !applyGroundLine) return;
  const rect = shellStageRect(shellContext);
  const groundLineWorldY = shellGroundCenterWorld(shellContext) +
    shellOrbRadiusPx(shellContext) +
    ((Number(stage.phys.groundLinePx) || 2) * 0.5);
  const camTop = shellCameraTopFor(shellContext, stage.orbRuntimeState.get().yW, rect.height || 0);
  const groundY = groundLineWorldY - camTop;
  const top = groundY - (((Number(stage.phys.groundLinePx) || 2) * 0.5));
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const scratch = ensureShellFrameScratch(runtime);
  const args = scratch ? scratch.groundLineArgs : { top: 0 };
  args.top = top;
  applyGroundLine.method.call(applyGroundLine.activeAdapter, args);
}

function applyShellOrbTransform(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const applyOrbTransform = getActiveShellStageMethod(shellContext, "applyOrbTransform");
  if (!runtime || !runtime.stage || !applyOrbTransform) return;
  const orbState = runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function"
    ? runtime.orbRuntimeState.get()
    : null;
  const screenX = runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenX))
    ? Number(runtime.frameMetrics.orbScreenX)
    : shellStageCenterX(shellContext);
  const y = runtime.frameMetrics && Number.isFinite(Number(runtime.frameMetrics.orbScreenY))
    ? Number(runtime.frameMetrics.orbScreenY)
    : shellOrbScreenY(shellContext);
  const top = y - shellOrbRadiusPx(shellContext);
  const scratch = ensureShellFrameScratch(runtime);
  const args = scratch.orbTransformArgs;
  const xW = Number(orbState && orbState.xW);
  const yW = Number(orbState && orbState.yW);
  args.top = top;
  args.left = screenX;
  args.xW = xW;
  args.yW = yW;
  applyOrbTransform.method.call(applyOrbTransform.activeAdapter, args);
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

function redrawShellStageVisuals(shellContext, {
  clearFrameCache = false,
  resetOrbToGround = false,
  applyOrbFrame = false,
} = {}) {
  if (!shellContext) return;
  const runtime = shellContext.runtime || null;
  if (clearFrameCache && runtime) {
    runtime.stageRectCache = null;
    runtime.frameMetrics = null;
  }
  updateShellFrameMetrics(shellContext, performance.now());
  if (resetOrbToGround) {
    resetShellOrbToGround(shellContext);
  }
  updateShellStageReadouts(shellContext);
  if (applyOrbFrame) {
    applyShellGroundLine(shellContext);
    applyShellOrbTransform(shellContext);
  }
}

function activateShellStageVisuals(shellContext) {
  redrawShellStageVisuals(shellContext, { resetOrbToGround: true });
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

function handleShellImpulseFrame(shellContext, data) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const devView = shellContext && shellContext.views ? shellContext.views.devStagingView : null;
  const receiverImpulseRuntime = runtime && runtime.receiverImpulseRuntime ? runtime.receiverImpulseRuntime : null;
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

  if (receiverImpulseRuntime && typeof receiverImpulseRuntime.processIncomingImpulse === "function") {
    receiverImpulseRuntime.processIncomingImpulse(inputPayload);
    renderShellHudFromMotionStore(shellContext);
    runtime.liveInputStatusShown = true;
    return;
  }
  runtime.pendingInputStatusShown = true;
}

function updateShellSpinColorFromMotionState(shellContext, motionState) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbColorRuntime = runtime && runtime.orbColorRuntime ? runtime.orbColorRuntime : null;
  const apply3dSpin = getActiveShellStageMethod(shellContext, "applyOrbSpinColor");
  const clear3dSpin = getActiveShellStageMethod(shellContext, "clearOrbSpinColor");
  const canApply3dSpin = !!apply3dSpin;
  const canClear3dSpin = !!clear3dSpin;
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
      clear3dSpin.method.call(clear3dSpin.activeAdapter);
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
      apply3dSpin.method.call(apply3dSpin.activeAdapter, color);
      state.applied3dColorKey = colorKey;
    }
    return;
  }
  if (orbColorRuntime && typeof orbColorRuntime.clearSpinColor === "function") {
    orbColorRuntime.clearSpinColor();
  }
  if (canClear3dSpin && state.applied3dColorKey) {
    clear3dSpin.method.call(clear3dSpin.activeAdapter);
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
      runtime.vfxDefaults.orbSpawn &&
      typeof runtime.vfxDefaults.orbSpawn === "object"
        ? runtime.vfxDefaults.orbSpawn
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
      const receiverRuntime = resolveShellReceiverRuntime(runtime);
      const orbFxSystem = receiverRuntime && receiverRuntime.orbFxSystem ? receiverRuntime.orbFxSystem : null;
      traceMeasure("orb.pipeline", () => runOrbRuntimePipeline({
        ts,
        dt,
        nowMs,
        wasOnGround,
        orbRuntimeState: runtime.orbRuntimeState,
        phys: runtime.stage ? runtime.stage.phys : {},
        shieldDescent: runtime.stage ? runtime.stage.shieldDescent : {},
        receiverRuntime,
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
  const adapters = getShellStageAdapters(shellContext);
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
    const receiverRuntime = resolveShellReceiverRuntime(runtime);
    resetShellOrbToGround(shellContext);
    const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
    clearShellDeathOverlaySchedule(shellContext);
    if (receiverRuntime && receiverRuntime.orbSystem && typeof receiverRuntime.orbSystem.revive === "function") {
      receiverRuntime.orbSystem.revive({ health: 300, atMs: performance.now() });
      receiverRuntime.lastImpact = null;
    }
    stopShellOrbStageLegacyDomOrbShatterShardSim(shellContext);
    if (stage && stage.worldSystem && typeof stage.worldSystem.reset === "function") {
      stage.worldSystem.reset(performance.now());
    }
    const orbFxSystem = receiverRuntime && receiverRuntime.orbFxSystem ? receiverRuntime.orbFxSystem : null;
    if (orbFxSystem && typeof orbFxSystem.reset === "function") {
      orbFxSystem.reset();
    }
    closeShellDeathOverlay(shellContext);
    renderShellOrbStageLegacyDomOrbDamageVisuals(shellContext);
  };
  for (const button of buttons) {
    button.addEventListener("click", onTryAgain);
  }
}

function resolveShellReceiverRuntime(runtime = null) {
  return runtime && runtime.receiverRuntime ? runtime.receiverRuntime : null;
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

function renderShellOrbStageLegacyDomOrbDamageVisuals(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const receiverRuntime = resolveShellReceiverRuntime(runtime);
  if (!receiverRuntime || !receiverRuntime.orbDamageVisualsRuntime) return;
  const fx = receiverRuntime.orbDamageVisualsRuntime.getState();
  const orbStageLegacyDomRenderMethod = getActiveShellStageMethod(shellContext, "renderOrbStageLegacyDomOrbDamageVisuals");
  if (orbStageLegacyDomRenderMethod) {
    orbStageLegacyDomRenderMethod.method.call(orbStageLegacyDomRenderMethod.activeAdapter, { fx });
  }
}

function openShellDeathOverlay(shellContext) {
  callActiveShellStageVoidMethod(shellContext, "openDeathOverlay");
}

function closeShellDeathOverlay(shellContext) {
  callActiveShellStageVoidMethod(shellContext, "closeDeathOverlay");
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

function stopShellOrbStageLegacyDomOrbShatterShardSim(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbStageLegacyDomOrbShatterController = runtime && runtime.legacyDomOrbShatterController;
  if (
    orbStageLegacyDomOrbShatterController &&
    typeof orbStageLegacyDomOrbShatterController.stopShardSim === "function"
  ) {
    orbStageLegacyDomOrbShatterController.stopShardSim();
    return;
  }
  const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
  if (shellVfx && typeof shellVfx.clearLegacyDomOrbShatterRuntime === "function") {
    shellVfx.clearLegacyDomOrbShatterRuntime();
  }
}

function spawnShellOrbStageLegacyDomOrbShatterShardVfx(shellContext, payload) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
  if (shellVfx && typeof shellVfx.playOrbShatter === "function") {
    const result = shellVfx.playOrbShatter(payload);
    if (result && result.handled) return;
  }
  const orbStageLegacyDomOrbShatterController = runtime && runtime.legacyDomOrbShatterController;
  if (
    !orbStageLegacyDomOrbShatterController ||
    typeof orbStageLegacyDomOrbShatterController.spawnShardVfx !== "function"
  ) return;
  orbStageLegacyDomOrbShatterController.spawnShardVfx(payload);
}

function clearShellOrbDeathRuntimeVfx(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const shellVfx = runtime && runtime.vfx ? runtime.vfx : null;
  if (shellVfx && typeof shellVfx.clearLegacyDomOrbDeathVfx === "function") {
    shellVfx.clearLegacyDomOrbDeathVfx();
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
  const receiverRuntime = resolveShellReceiverRuntime(runtime);
  if (
    receiverRuntime &&
    receiverRuntime.inputSystemsBundle &&
    typeof receiverRuntime.inputSystemsBundle.resetProcessingState === "function"
  ) {
    receiverRuntime.inputSystemsBundle.resetProcessingState(atMs);
    return;
  }
  if (receiverRuntime && receiverRuntime.inputSystem && typeof receiverRuntime.inputSystem.reset === "function") {
    receiverRuntime.inputSystem.reset(atMs);
  }
  if (
    receiverRuntime &&
    receiverRuntime.inputDynamicsSystem &&
    typeof receiverRuntime.inputDynamicsSystem.reset === "function"
  ) {
    receiverRuntime.inputDynamicsSystem.reset(atMs);
  }
  if (
    receiverRuntime &&
    receiverRuntime.inputGestureSystem &&
    typeof receiverRuntime.inputGestureSystem.reset === "function"
  ) {
    receiverRuntime.inputGestureSystem.reset(atMs);
  }
}

function shellTeleportOrbToSpawnNeutralizePhysics(shellContext, aboveGroundPx = 0) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const orbStageActions = getShellOrbStageActions(shellContext);
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
  const orbStageActions = getShellOrbStageActions(shellContext);
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
  const createLegacyDomVfxRuntimesBundle =
    sharedModules &&
    sharedModules.legacyDomVfxRuntimesBundleModule &&
    sharedModules.legacyDomVfxRuntimesBundleModule.createLegacyDomVfxRuntimesBundle;
  if (!runtime || typeof createLegacyDomVfxRuntimesBundle !== "function") return null;

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
    orbStageLegacyDomEls: getShellOrbStageLegacyDomElements(shellContext),
    createLegacyDomVfxRuntimesBundle,
    rootStyle,
    vfxDefaults,
    playElectricAoeRuntime,
    playFlameAoeRuntime,
    triggerShockwaveRuntime,
    playOrbNod3dRuntime: (payload = {}) => callActiveShellStageMethod(shellContext, "playOrbNod3d", payload, "active_stage_orb_nod3d_missing"),
    playOrbTeleport3dRuntime: (payload = {}) => callActiveShellStageMethod(shellContext, "playOrbTeleport3d", payload, "active_stage_orb_teleport3d_missing"),
    playBubbleShield3dRuntime: (payload = {}) => callActiveShellStageMethod(shellContext, "playBubbleShield3d", payload, "active_stage_bubble_shield3d_missing"),
    playShockwave3dRuntime: (payload = {}) => callActiveShellStageMethod(shellContext, "playShockwave3d", payload, "active_stage_shockwave3d_missing"),
    playFlameAoe3dRuntime: (payload = {}) => callActiveShellStageMethod(shellContext, "playFlameAoe3d", payload, "active_stage_flame_aoe3d_missing"),
    clamp,
    clamp01,
    evenPx,
    evenStroke,
    rand,
    getOrbScaleFactor: () => getShellOrbScaleFactor(shellContext),
    getOrbDiameterPx: () => shellOrbVisualDiameterPx(shellContext),
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
  const orbStageActions = getShellOrbStageActions(shellContext);
  if (!orbStageActions || typeof orbStageActions.activateBubbleShield !== "function") return;
  orbStageActions.activateBubbleShield({ durationMs });
}

function shellPlayFlameAoe(shellContext, payload = {}) {
  const orbStageActions = getShellOrbStageActions(shellContext);
  if (!orbStageActions || typeof orbStageActions.playFlameAoe !== "function") return { handled: false };
  return orbStageActions.playFlameAoe(payload);
}

function shellApplyColorize(shellContext, payload = {}) {
  const orbStageActions = getShellOrbStageActions(shellContext);
  if (!orbStageActions || typeof orbStageActions.applyColorize !== "function") return;
  orbStageActions.applyColorize(payload);
}

function shellClearColorize(shellContext) {
  const orbStageActions = getShellOrbStageActions(shellContext);
  if (!orbStageActions || typeof orbStageActions.clearColorize !== "function") return;
  orbStageActions.clearColorize();
}

async function initShellReceiverHostRuntime(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const sharedModules = shellContext && shellContext.sharedModules ? shellContext.sharedModules : null;
  const shellKws = runtime && runtime.kws ? runtime.kws : null;
  if (!runtime || !sharedModules || !shellKws) return null;

  const {
    IMPACT_TH,
    INPUT_GESTURE_CFG,
    INPUT_DYNAMICS_CFG,
  } = createShellReceiverConfigs();

  const assembly = await bootstrapShellReceiverHostRuntimeAssembly({
    shellContext,
    runtime,
    sharedModules,
    shellKws,
    receiverConfigs: {
      IMPACT_TH,
      INPUT_GESTURE_CFG,
      INPUT_DYNAMICS_CFG,
    },
    createReceiverStabilityVisualController,
    setLamp: setDevStagingLamp,
    stageAdapters: {
      normalizeWorldItemSpawn: (item) => {
        const normalizeWorldItemSpawn = getActiveShellStageMethod(shellContext, "normalizeWorldItemSpawn");
        return normalizeWorldItemSpawn
          ? normalizeWorldItemSpawn.method.call(normalizeWorldItemSpawn.activeAdapter, item, {
              groundCenterWorld: () => shellGroundCenterWorld(shellContext),
              clamp,
            })
          : null;
      },
      groundCenterWorld: () => shellGroundCenterWorld(shellContext),
      stageRect: () => shellStageRect(shellContext),
      pickupScreenY: (yW) => {
        const rect = shellStageRect(shellContext);
        const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, rect.height || 0);
        const pickupScreenY = getActiveShellStageMethod(shellContext, "pickupScreenY");
        return pickupScreenY
          ? pickupScreenY.method.call(pickupScreenY.activeAdapter, yW, { camTop })
          : (Number(yW || 0) - camTop);
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
      getOrbVisualRadiusPx: () => shellOrbVisualRadiusPx(shellContext),
      axisToColor01,
      bindGlobe3dRuntime: (args = {}) => (
        getActiveShellStageMethod(shellContext, "bindGlobe3dRuntime")
          ? callActiveShellStageMethod(shellContext, "bindGlobe3dRuntime", args)
          : null
      ),
      getPhys: () => (runtime.stage ? runtime.stage.phys : {}),
      getWorldSystem: () => (runtime.stage ? runtime.stage.worldSystem : null),
      getWorldItems: () => shellResolvedWorldItems(shellContext),
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
      renderLegacyDomOrbDamageVisuals: () => renderShellOrbStageLegacyDomOrbDamageVisuals(shellContext),
      spawnLegacyDomOrbShatterShardVfx: (payload) => spawnShellOrbStageLegacyDomOrbShatterShardVfx(shellContext, payload),
      clearOrbDeathRuntimeVfx: () => clearShellOrbDeathRuntimeVfx(shellContext),
      scheduleDeathOverlay: () => scheduleShellDeathOverlay(shellContext, 3000),
      clearDeathOverlaySchedule: () => clearShellDeathOverlaySchedule(shellContext),
      closeDeathOverlay: () => closeShellDeathOverlay(shellContext),
      stopLegacyDomOrbShatterShardSim: () => stopShellOrbStageLegacyDomOrbShatterShardSim(shellContext),
      legacyDomOrbShatterController: runtime.legacyDomOrbShatterController || null,
      setOrbInputSuppressed: (next) => { runtime.orbInputSuppressed = !!next; },
      playElectricAoe: () => {
        const shellVfx = runtime.vfx || null;
        return shellVfx && typeof shellVfx.playElectricAoe === "function" ? shellVfx.playElectricAoe() : { handled: false };
      },
      playOrbNod: (payload = {}) => {
        const shellVfx = runtime.vfx || null;
        return shellVfx && typeof shellVfx.playOrbNod === "function" ? shellVfx.playOrbNod(payload) : { handled: false };
      },
      executeWordCastAction: (castActionId, context = {}) => executeShellWordCastAction(shellContext, castActionId, context),
      grantOrbGrace: (grace) => shellGrantOrbGrace(shellContext, grace),
      clearFloatGrace: () => {
        patchShellOrbRuntime(shellContext, { floatGraceActive: false, floatGraceUntilMs: 0 });
      },
      resetOrbStrokeColor: () => shellClearColorize(shellContext),
      updateDebugReadout: () => {},
    },
    impulseAdapterHooks: {
      computeLift01,
      pickShakeMetric,
    },
  });
  if (!assembly) return null;

  const {
    runtimeContext,
  } = assembly;

  if (runtime.stage) {
    runtime.stage.worldSystem = runtimeContext && runtimeContext.worldSystem ? runtimeContext.worldSystem : null;
  }

  return runtime.receiverImpulseRuntime;
}

function createShellSurfaceRefs({ devStagingView, orbStageView, gameStageView } = {}) {
  return {
    dev: devStagingView && devStagingView.refs ? devStagingView.refs : Object.create(null),
    orb: orbStageView && orbStageView.refs ? orbStageView.refs : Object.create(null),
    game: gameStageView && gameStageView.refs ? gameStageView.refs : Object.create(null),
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
      modeController.setMode(STAGING_SHELL_MODE.gameStage);
      return;
    }
    if (key === "d") {
      const state = modeController.getState();
      if (state.mode !== STAGING_SHELL_MODE.gameStage) return;
      event.preventDefault();
      modeController.toggleDevStageVisibility();
    }
  };

  rootDocument.defaultView.addEventListener("keydown", onKeyDown);
  return () => {
    rootDocument.defaultView.removeEventListener("keydown", onKeyDown);
  };
}

function createShellStageAdapter(stageView = null) {
  return (
    stageView &&
    stageView.adapter &&
    typeof stageView.adapter.getStageElements === "function"
  )
    ? stageView.adapter
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

function getShellStageAdapters(shellContext) {
  return [
    shellContext && shellContext.orbStageAdapter ? shellContext.orbStageAdapter : null,
    shellContext && shellContext.gameStageAdapter ? shellContext.gameStageAdapter : null,
  ].filter(Boolean);
}

function resolveShellStageAdapterForMode(shellContext, modeState = null) {
  if (!shellContext) return null;
  const mode = modeState && modeState.mode ? modeState.mode : STAGING_SHELL_MODE.splitLab;
  return mode === STAGING_SHELL_MODE.gameStage
    ? shellContext.gameStageAdapter
    : shellContext.orbStageAdapter;
}

function getActiveShellStageElements(shellContext) {
  const adapter = getActiveShellStageAdapter(shellContext);
  return adapter && typeof adapter.getStageElements === "function"
    ? adapter.getStageElements()
    : {};
}

function getShellOrbStageLegacyDomElements(shellContext) {
  const adapter = getActiveShellStageAdapter(shellContext);
  return adapter && typeof adapter.getOrbStageLegacyDomElements === "function"
    ? adapter.getOrbStageLegacyDomElements()
    : {};
}

function getActiveShellStageRoot(shellContext) {
  const adapter = getActiveShellStageAdapter(shellContext);
  return adapter && adapter.refs ? adapter.refs.root || null : null;
}

function getShellOrbStageActions(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  return runtime && runtime.orbStageActions ? runtime.orbStageActions : null;
}

function getActiveShellStageMethod(shellContext, methodName) {
  const activeAdapter = getActiveShellStageAdapter(shellContext);
  const method = activeAdapter && methodName ? activeAdapter[methodName] : null;
  return typeof method === "function" ? { activeAdapter, method } : null;
}

function createShellOrbStageLegacyDomOrbShatterController(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!runtime) return null;
  const createOrbStageLegacyDomOrbShatterController = getActiveShellStageMethod(
    shellContext,
    "createOrbStageLegacyDomOrbShatterController"
  );
  const orbStageLegacyDomOrbShatterRuntime = (
    runtime.vfx &&
    typeof runtime.vfx.getLegacyDomOrbShatterRuntime === "function"
  )
    ? runtime.vfx.getLegacyDomOrbShatterRuntime()
    : null;
  if (!createOrbStageLegacyDomOrbShatterController || !orbStageLegacyDomOrbShatterRuntime) return null;
  return createOrbStageLegacyDomOrbShatterController.method.call(createOrbStageLegacyDomOrbShatterController.activeAdapter, {
    root: getActiveShellStageRoot(shellContext),
    getOrbShatterRuntime: () => (
      runtime &&
      runtime.vfx &&
      typeof runtime.vfx.getLegacyDomOrbShatterRuntime === "function"
        ? runtime.vfx.getLegacyDomOrbShatterRuntime()
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
  });
}

function callActiveShellStageMethod(shellContext, methodName, payload = {}, skipped = "active_stage_method_missing") {
  const target = getActiveShellStageMethod(shellContext, methodName);
  return target
    ? target.method.call(target.activeAdapter, payload)
    : { handled: false, skipped };
}

function callActiveShellStageVoidMethod(shellContext, methodName) {
  const target = getActiveShellStageMethod(shellContext, methodName);
  if (target) target.method.call(target.activeAdapter);
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

function createShellOrbStageActions(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  if (!runtime) return null;
  return createOrbStageActionBridge({
    runtime,
    legacyDomBubbleShieldEl: getShellOrbStageLegacyDomElements(shellContext).shield || null,
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

  runtime.orbStageActions = createShellOrbStageActions(shellContext);
  runtime.legacyDomOrbShatterController = createShellOrbStageLegacyDomOrbShatterController(shellContext);
}

function syncActiveStageGlobe3dRuntime(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const bindGlobe3dRuntime = getActiveShellStageMethod(shellContext, "bindGlobe3dRuntime");
  if (!runtime || !bindGlobe3dRuntime) return;
  const spawns = shellResolvedWorldItems(shellContext);
  bindGlobe3dRuntime.method.call(bindGlobe3dRuntime.activeAdapter, {
    eventBus: runtime.eventBus,
    spawns,
  });
}

function syncActiveShellStage(shellContext) {
  if (!shellContext) return null;
  const modeState = getShellModeState(shellContext);
  const activeStageAdapter = resolveShellStageAdapterForMode(shellContext, modeState);
  shellContext.activeStageAdapter = activeStageAdapter || shellContext.orbStageAdapter || null;
  refreshShellActiveStageRuntimeBindings(shellContext);
  const runtime = shellContext.runtime || null;
  if (runtime) {
    runtime.stageRectCache = null;
    runtime.frameMetrics = null;
  }
  void hydrateShellAuthoredLevelReadModel(shellContext).then(() => {
    const stage = runtime && runtime.stage ? runtime.stage : null;
    if (stage && stage.phys) {
      stage.phys.worldHeightPx = shellWorldHeight(shellContext);
      stage.phys.worldWidthPx = shellWorldWidth(shellContext);
    }
    if (stage && stage.worldSystem && typeof stage.worldSystem.setSpawns === "function") {
      const nextSpawns = shellResolvedWorldItems(shellContext);
      stage.worldSystem.setSpawns(nextSpawns, performance.now());
      syncActiveStageGlobe3dRuntime(shellContext);
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
  redrawShellStageVisuals(shellContext, {
    clearFrameCache: true,
    applyOrbFrame: true,
  });
}

function shellActiveStageLevel(shellContext) {
  if (!shellContext) return null;
  const modeState = getShellModeState(shellContext);
  if (modeState.mode === STAGING_SHELL_MODE.gameStage) {
    return shellContext.gameStageLevel || shellContext.orbStageLevel || null;
  }
  return shellContext.orbStageLevel || shellContext.gameStageLevel || null;
}

function createStagingShellContext({
  rootDocument,
  devStagingView,
  orbStageView,
  gameStageView,
  orbStageLevel = DEFAULT_ORB_HANGAR,
  gameStageLevel = DEFAULT_GAME_STAGE_LEVEL,
  sharedModules,
  modeController = null,
  perfTrace = null,
} = {}) {
  const surfaceRefs = createShellSurfaceRefs({ devStagingView, orbStageView, gameStageView });
  const orbStageAdapter = createShellStageAdapter(orbStageView);
  const gameStageAdapter = createShellStageAdapter(gameStageView);
  const activeStageAdapter = orbStageAdapter || gameStageAdapter || null;
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
      gameStageView,
    },
    modeController,
    orbStageLevel,
    gameStageLevel,
    refs: surfaceRefs,
    orbStageAdapter,
    gameStageAdapter,
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
      receiverRuntime: null,
      frameMetrics: null,
      stageRectCache: null,
      perfTrace,
      eventBus: null,
      worldSystem: null,
      orbRuntimeLoop: null,
      orbRuntimeState: null,
      stage: null,
      authoredLevelReadModel: null,
      authoredLevelBoundarySegments: null,
      shellVfxMods: null,
      shellModeController: modeController,
      shellModeHotkeyOff: null,
      shellModeOff: null,
      legacyDomOrbShatterController: null,
    },
  };
}

async function hydrateShellAuthoredLevelReadModel(shellContext) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const level = shellActiveStageLevel(shellContext);
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : null;
  const assetUrl = String(mapSource && mapSource.assetUrl || "").trim();
  if (!runtime || !mapSource || !assetUrl) {
    clearShellAuthoredLevelReadModel(runtime);
    return null;
  }
  try {
    const getAuthoredSceneReadModel = getActiveShellStageMethod(shellContext, "getAuthoredSceneReadModel");
    const adapterReadModel = getAuthoredSceneReadModel
      ? getAuthoredSceneReadModel.method.call(getAuthoredSceneReadModel.activeAdapter)
      : null;
    const adapterLevel = adapterReadModel && adapterReadModel.level ? adapterReadModel.level : null;
    const adapterAssetUrl = String(
      adapterLevel &&
      adapterLevel.mapSource &&
      adapterLevel.mapSource.assetUrl ||
      ""
    ).trim();
    if (adapterReadModel && adapterReadModel.summary && adapterAssetUrl === assetUrl) {
      return applyShellAuthoredLevelReadModel(runtime, adapterReadModel);
    }
    const authoredScene = await loadAuthoredLevelScene({
      level,
      worldWidthPx: shellWorldWidth(shellContext),
      worldHeightPx: shellWorldHeight(shellContext),
    });
    return applyShellAuthoredLevelReadModel(runtime, authoredScene);
  } catch (error) {
    clearShellAuthoredLevelReadModel(runtime);
    try { console.warn("[staging-shell] failed to hydrate level read model", error); } catch (_) {}
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

function shellGroundLineScreenY(shellContext) {
  return resolveShellGroundLineScreenY(shellContext, {
    shellStageRect,
    shellGroundCenterWorld,
    shellCameraTopFor,
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
    kwsRuntimeCommands,
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
        vfxDefaults,
        setRuntimeWordIndexes: (next = {}) => {
          runtimeWordIndex = next.runtimeWordIndex || Object.create(null);
          runtimeSpellIndex = next.runtimeSpellIndex || runtimeWordIndex;
        },
        setRuleSchema: (next = {}) => {
          ruleSchema = next && typeof next === "object" ? { ...next } : null;
        },
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
  runtime.orbStageActions = createShellOrbStageActions(shellContext);

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

  const kwsEventRuntime = bindShellKwsEventRuntime({
    bindKwsEventHandlers,
    eventBus,
    receiverEvents: RECEIVER_EVENTS,
    kwsDebugState,
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsListenPolicyController,
    runtimeConfig,
  });

  const kwsTraceRuntime = bindShellKwsTraceRuntime({
    eventBus,
    kwsPanelController,
    kwsBridge,
  });
  const {
    kwsListenPolicySyncOff,
    kwsRuleTraceOff,
    kwsActionTraceOff,
  } = kwsTraceRuntime;

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

  runtime.eventBus = eventBus;

  const shellVoiceSpellCastOff = eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_CAST, (payload = {}) => {
    handleShellVoiceSpellCast(shellContext, payload);
  });
  const shellSpellRuntime = createShellSpellActionRuntime({
    runtime,
    eventBus,
    castActionRegistryById: CAST_ACTION_REGISTRY_BY_ID,
    createSpellActionHandlersImported,
    createSpellCastExecutor,
    receiverSpellRuntime: {
      teleportOrbRuntimeToSpawn,
      grantOrbGraceRuntime,
    },
    executors: {
      executeAoeElectric,
      executeAoeFlame,
      executeTeleport,
      executeShockwave,
      executeBubbleShield,
      executeColorize,
    },
    getRuntimeVfx,
    shellActions: {
      playFlameAoe: (payload = {}) => shellPlayFlameAoe(shellContext, payload),
      teleportOrbToSpawnNeutralizePhysics: (aboveGroundPx) => shellTeleportOrbToSpawnNeutralizePhysics(shellContext, aboveGroundPx),
      activateBubbleShield: ({ durationMs } = {}) => shellActivateBubbleShield(shellContext, { durationMs }),
      applyColorize: (payload) => shellApplyColorize(shellContext, payload),
      clearColorize: () => shellClearColorize(shellContext),
      grantOrbGrace: (grace) => shellGrantOrbGrace(shellContext, grace),
      resolveReceiverRuntime: resolveShellReceiverRuntime,
    },
  });
  if (!shellSpellRuntime) return null;
  runtime.receiverSpellRuntime = shellSpellRuntime.receiverSpellRuntime;
  const { shellSpellActionHandlers, shellSpellCastExecutor } = shellSpellRuntime;
  const executeShellWordCastActionForRule = (castActionId, context = {}) => {
    return executeShellWordCastAction(shellContext, castActionId, context);
  };
  const shellRuleActionRuntime = bindShellRuleActionRuntime({
    eventBus,
    ruleSchema,
    executeWordCastAction: executeShellWordCastActionForRule,
    kwsBridge,
  });

  runtime.kws = {
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    runtimeConfig,
    kwsWordProvider,
    kwsVoiceProvider,
    voiceProviderManager,
    kwsListenPolicyController,
    kwsRuntimeCommands,
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
      const receiverRuntime = resolveShellReceiverRuntime(runtime);
      if (receiverRuntime && receiverRuntime.eventBus && receiverEvents && receiverEvents.EVT_VOICE_SET_MODE) {
        receiverRuntime.eventBus.emit(receiverEvents.EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
      }
    },
  });
}

export async function createStagingShellRuntime({
  rootDocument = document,
  moduleCacheBustV = "20260507ae",
  bootStatus = null,
} = {}) {
  const docEl = rootDocument.documentElement;
  const devRoot = rootDocument.getElementById("devStagingMount");
  const orbRoot = rootDocument.getElementById("orbStageMount");
  const gameRoot = rootDocument.getElementById("gameStageMount");
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

  const orbStageLevel = DEFAULT_ORB_HANGAR;
  const gameStageLevel = DEFAULT_GAME_STAGE_LEVEL;
  const perfTrace = createPerfTrace();
  perfTrace.installGlobal(rootDocument && rootDocument.defaultView ? rootDocument.defaultView : window);
  const devStagingView = devRoot ? mountDevStaging(devRoot) : null;
  const orbStageView = orbRoot ? renderOrbStage(orbRoot, { level: orbStageLevel }) : null;
  const gameStageView = gameRoot
    ? renderGameStage(gameRoot, {
        level: gameStageLevel,
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
      gameStageView,
      orbStageLevel,
      gameStageLevel,
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
            return getActiveShellStageRoot(shellContext) || orbStageRoot || null;
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
    await hydrateShellAuthoredLevelReadModel(shellContext);
    initializeShellStageRuntime(shellContext);
    syncActiveStageGlobe3dRuntime(shellContext);
    await initShellReceiverHostRuntime(shellContext);
    refreshShellActiveStageRuntimeBindings(shellContext);
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
