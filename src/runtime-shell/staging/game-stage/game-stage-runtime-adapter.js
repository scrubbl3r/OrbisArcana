import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { applyAuthoredStageCameraVars } from "../../../game-runtime/stage/authored-stage-frame.js";
import { resolveAuthoredLevelReadModelPrimarySpawn } from "../../../game-runtime/level/authored-level-read-model.js";

const GAME_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function createGameStageRuntimeAdapter({
  refs = {},
  level = null,
  state = null,
  depth3dRuntime = null,
  orbDiameterWorldUnits = GAME_STAGE_ORB_DIAMETER_WORLD_UNITS,
  unbindResize = () => {},
} = {}) {
  const core = createStageRuntimeAdapterCore({
    refs,
    level,
    state,
  });
  return Object.freeze({
    ...core,
    applyOrbTransform(args = {}) {
      if (depth3dRuntime && typeof depth3dRuntime.setOrbWorldPosition === "function") {
        depth3dRuntime.setOrbWorldPosition({
          xW: args.xW,
          yW: args.yW,
          bo: orbDiameterWorldUnits,
        });
      }
    },
    playOrbNod3d(payload = {}) {
      return depth3dRuntime && typeof depth3dRuntime.playOrbNod3d === "function"
        ? depth3dRuntime.playOrbNod3d(payload)
        : { handled: false, skipped: "depth3d_runtime_missing" };
    },
    playOrbTeleport3d(payload = {}) {
      return depth3dRuntime && typeof depth3dRuntime.playOrbTeleport3d === "function"
        ? depth3dRuntime.playOrbTeleport3d(payload)
        : { handled: false, skipped: "depth3d_runtime_missing" };
    },
    playBubbleShield3d(payload = {}) {
      return depth3dRuntime && typeof depth3dRuntime.playBubbleShield3d === "function"
        ? depth3dRuntime.playBubbleShield3d(payload)
        : { handled: false, skipped: "depth3d_runtime_missing" };
    },
    playShockwave3d(payload = {}) {
      return depth3dRuntime && typeof depth3dRuntime.playShockwave3d === "function"
        ? depth3dRuntime.playShockwave3d(payload)
        : { handled: false, skipped: "depth3d_runtime_missing" };
    },
    playFlameAoe3d(payload = {}) {
      return depth3dRuntime && typeof depth3dRuntime.playFlameAoe3d === "function"
        ? depth3dRuntime.playFlameAoe3d(payload)
        : { handled: false, skipped: "depth3d_runtime_missing" };
    },
    applyOrbSpinColor(color = {}) {
      if (depth3dRuntime && typeof depth3dRuntime.applyOrbSpinColor === "function") {
        depth3dRuntime.applyOrbSpinColor(color);
      }
    },
    clearOrbSpinColor() {
      if (depth3dRuntime && typeof depth3dRuntime.clearOrbSpinColor === "function") {
        depth3dRuntime.clearOrbSpinColor();
      }
    },
    bindGlobe3dRuntime(args = {}) {
      if (depth3dRuntime && typeof depth3dRuntime.bindGlobe3dRuntime === "function") {
        depth3dRuntime.bindGlobe3dRuntime(args);
      }
    },
    getPrimarySpawn() {
      return resolveAuthoredLevelReadModelPrimarySpawn(state);
    },
    getPreviewZoom() {
      return state ? state.previewZoom : 0;
    },
    getPreviewFollowMode() {
      return state ? state.previewFollowMode : "";
    },
    getAuthoredSceneReadModel() {
      if (!state || !state.summary || !state.sceneModel) return null;
      return Object.freeze({
        level,
        summary: state.summary,
        sceneModel: state.sceneModel,
        levelGraphicsModel: state.levelGraphicsModel || null,
      });
    },
    applyCameraFrame({
      camLeft = 0,
      camTop = 0,
      zoom = state && state.previewZoom,
    } = {}) {
      if (!refs.world || !state) return;
      const rect = refs.physStage && typeof refs.physStage.getBoundingClientRect === "function"
        ? refs.physStage.getBoundingClientRect()
        : { width: 0, height: 0 };
      const frameZoom = Number(zoom || state.previewZoom);
      state.externalCameraAuthority = true;
      applyAuthoredStageCameraVars({
        refs,
        starsParallaxRefs: state.starsParallaxRefs,
        worldWidthPx: state.worldWidthPx,
        worldHeightPx: state.worldHeightPx,
        camLeft,
        camTop,
        zoom: frameZoom,
        viewportWidthPx: clampNumber(rect.width, 0),
        viewportHeightPx: clampNumber(rect.height, 0),
      });
      if (depth3dRuntime && typeof depth3dRuntime.renderFrame === "function") {
        depth3dRuntime.renderFrame({
          camLeft: Number(camLeft || 0),
          camTop: Number(camTop || 0),
          zoom: frameZoom,
          viewportWidthPx: clampNumber(rect.width, 0),
          viewportHeightPx: clampNumber(rect.height, 0),
          worldWidthPx: state.worldWidthPx,
          worldHeightPx: state.worldHeightPx,
        });
      }
    },
    dispose() {
      if (depth3dRuntime && typeof depth3dRuntime.dispose === "function") {
        depth3dRuntime.dispose();
      }
      unbindResize();
    },
  });
}
