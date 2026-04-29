import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { applyAuthoredStarsFieldParallax } from "../authored-level-overlay.js?v=20260425w";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function applyCameraVarsToWorld(worldEl, {
  worldWidthPx = 0,
  worldHeightPx = 0,
  zoom = 1,
  camLeft = 0,
  camTop = 0,
} = {}) {
  if (!worldEl) return;
  worldEl.style.setProperty("--level-world-width", `${worldWidthPx}px`);
  worldEl.style.setProperty("--level-world-height", `${worldHeightPx}px`);
  worldEl.style.setProperty("--level-world-zoom", `${Number(zoom || 1)}`);
  worldEl.style.setProperty("--level-world-x", `${(-Number(camLeft || 0) * Number(zoom || 1)).toFixed(2)}px`);
  worldEl.style.setProperty("--level-world-y", `${(-Number(camTop || 0) * Number(zoom || 1)).toFixed(2)}px`);
}

export function createLevelStageRuntimeAdapter({
  refs = {},
  level = null,
  state = null,
  depth3dRuntime = null,
  orbDiameterWorldUnits = LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS,
  unbindResize = () => {},
} = {}) {
  const core = createStageRuntimeAdapterCore({
    refs,
    level,
    state,
    getOrbWrapPosition: ({ top = 0, left = "50%", xW = null, yW = null } = {}) => {
      const orbRadiusWorldUnits = Math.max(1, Number(orbDiameterWorldUnits) || LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS) * 0.5;
      if (Number.isFinite(Number(xW)) && Number.isFinite(Number(yW))) {
        return {
          left: `${Number(xW).toFixed(2)}px`,
          transform: `translate(-50%, ${Math.max(0, Number(yW) - orbRadiusWorldUnits).toFixed(2)}px)`,
        };
      }
      return {
        left: (typeof left === "number")
          ? `${Number(left || 0).toFixed(2)}px`
          : String(left || "50%"),
        transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
      };
    },
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
      core.applyOrbTransform(args);
    },
    playOrbNod3d(payload = {}) {
      return depth3dRuntime && typeof depth3dRuntime.playOrbNod3d === "function"
        ? depth3dRuntime.playOrbNod3d(payload)
        : { handled: false, skipped: "depth3d_runtime_missing" };
    },
    getSpawnMarker() {
      return state && state.spawn ? state.spawn : null;
    },
    getPreviewZoom() {
      return state ? state.previewZoom : 0;
    },
    getPreviewFollowMode() {
      return state ? state.previewFollowMode : "";
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
      const cameraVars = {
        worldWidthPx: state.worldWidthPx,
        worldHeightPx: state.worldHeightPx,
        zoom: frameZoom,
        camLeft,
        camTop,
      };
      applyCameraVarsToWorld(refs.world, cameraVars);
      applyCameraVarsToWorld(refs.actorWorld, cameraVars);
      applyCameraVarsToWorld(refs.topArtWorld, cameraVars);
      applyAuthoredStarsFieldParallax(state.starsParallaxRefs, {
        camLeft: Number(camLeft || 0),
        camTop: Number(camTop || 0),
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
