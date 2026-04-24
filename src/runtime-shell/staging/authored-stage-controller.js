import { createCameraRuntime } from "../../game-runtime/camera/camera-runtime.js";
import {
  resolveAuthoredLevelCameraTarget,
  resolveViewFloorBootOffsetYW,
} from "../../game-runtime/level/authored-level-scene-model.js";
import { loadAuthoredLevelScene } from "./load-authored-level-scene.js";
import {
  resolveStageCameraClampBounds,
  resolveStageCameraConfig,
} from "./authored-level-camera.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function updateAuthoredStageCamera(refs, state, previewZoomFallback = 0.25) {
  if (!refs || !refs.physStage || !refs.world) return;
  const rect = typeof refs.physStage.getBoundingClientRect === "function"
    ? refs.physStage.getBoundingClientRect()
    : { width: 0, height: 0 };
  const viewportWidthPx = Math.max(0, clampNumber(rect.width, 0));
  const viewportHeightPx = Math.max(0, clampNumber(rect.height, 0));
  if (viewportWidthPx < 1 || viewportHeightPx < 1) return;

  const cameraConfig = resolveStageCameraConfig(state.level, {
    mode: "preview",
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
    cameraAnchors: state.cameraAnchors,
    groundCenterWorld: () => Math.max(0, state.worldHeightPx) * 0.5,
  });
  const sceneModel = state.sceneModel || null;
  const boundaryBox = sceneModel && sceneModel.boundaryBox ? sceneModel.boundaryBox : null;
  const viewFloorGuide = sceneModel && sceneModel.viewFloorGuide ? sceneModel.viewFloorGuide : null;
  const clampBounds = resolveStageCameraClampBounds({
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
    boundaryBox,
    viewFloorGuide,
  });
  const target = resolveAuthoredLevelCameraTarget({
    level: state.level,
    sceneModel,
    initialTarget: state.initialTarget,
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
  });
  const zoom = Math.max(0.05, clampNumber(state.previewZoom, previewZoomFallback));
  const bootOffsetYW = resolveViewFloorBootOffsetYW({
    targetYW: target.yW,
    boundaryBox,
    viewFloorGuide,
    viewportHeightPx,
    zoom,
  });
  const frame = state.cameraRuntime && typeof state.cameraRuntime.resolveFrame === "function"
    ? state.cameraRuntime.resolveFrame({
      targetXW: clampNumber(target.xW, 0),
      targetYW: clampNumber(target.yW, 0) + bootOffsetYW,
      viewportWidthPx,
      viewportHeightPx,
      worldWidthPx: state.worldWidthPx,
      worldHeightPx: state.worldHeightPx,
      zoom,
      followMode: state.bootCamera ? "follow_target_center" : state.previewFollowMode,
      fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
      fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
      screenAnchorX: cameraConfig.screenAnchorX,
      screenAnchorY: cameraConfig.screenAnchorY,
      deadzoneWidthPx: cameraConfig.deadzoneWidthPx,
      deadzoneHeightPx: cameraConfig.deadzoneHeightPx,
      deadzoneWidthRatio: cameraConfig.deadzoneWidthRatio,
      deadzoneHeightRatio: cameraConfig.deadzoneHeightRatio,
      followLerpX: state.bootCamera ? 1 : cameraConfig.followLerpX,
      followLerpY: state.bootCamera ? 1 : cameraConfig.followLerpY,
      clampLeftXW: state.bootCamera ? 0 : (boundaryBox ? clampNumber(boundaryBox.leftXW, 0) : 0),
      clampRightXW: state.bootCamera ? state.worldWidthPx : clampBounds.rightXW,
      clampTopYW: state.bootCamera ? 0 : clampBounds.topYW,
      clampBottomYW: state.bootCamera ? state.worldHeightPx : clampBounds.bottomYW,
      clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
      clampInsetRightPx: cameraConfig.clampInsetRightPx,
      clampInsetTopPx: cameraConfig.clampInsetTopPx,
      clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
    })
    : null;
  if (!frame) return;

  state.bootCamera = false;
  refs.world.style.setProperty("--level-world-width", `${state.worldWidthPx}px`);
  refs.world.style.setProperty("--level-world-height", `${state.worldHeightPx}px`);
  refs.world.style.setProperty("--level-world-zoom", `${frame.zoom}`);
  refs.world.style.setProperty("--level-world-x", `${-frame.camLeft * frame.zoom}px`);
  refs.world.style.setProperty("--level-world-y", `${-frame.camTop * frame.zoom}px`);

  if (refs.labelMeta) {
    const authoredSpawn = state.spawn && state.spawn.authoredCenter ? state.spawn.authoredCenter : null;
    refs.labelMeta.textContent = authoredSpawn
      ? `${state.previewFollowMode} | zoom ${frame.zoom.toFixed(2)} | spawn ${Math.round(authoredSpawn.x)}, ${Math.round(authoredSpawn.y)}`
      : `${state.previewFollowMode} | zoom ${frame.zoom.toFixed(2)} | spawn unresolved`;
  }
}

function bindAuthoredStageResize(refs, onUpdate) {
  if (!refs || !refs.physStage || typeof onUpdate !== "function") return () => {};
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => onUpdate());
    observer.observe(refs.physStage);
    return () => observer.disconnect();
  }
  const win = globalThis.window || null;
  if (win && typeof win.addEventListener === "function") {
    win.addEventListener("resize", onUpdate);
    return () => win.removeEventListener("resize", onUpdate);
  }
  return () => {};
}

export function createAuthoredStageController({
  refs = {},
  level = null,
  worldWidthPx = 2048,
  worldHeightPx = 2048,
  previewZoom = 0.25,
  previewFollowMode = "follow_target_center",
  initialTarget = "spawn",
  buildOverlayMarkup = () => "",
  previewZoomFallback = 0.25,
} = {}) {
  const state = {
    worldWidthPx,
    worldHeightPx,
    previewZoom,
    previewFollowMode,
    initialTarget,
    level,
    cameraRuntime: createCameraRuntime(),
    bootCamera: true,
    cameraAnchors: [],
    spawn: null,
    summary: null,
    sceneModel: null,
  };

  const updateCamera = () => updateAuthoredStageCamera(refs, state, previewZoomFallback);
  const unbindResize = bindAuthoredStageResize(refs, updateCamera);

  async function hydrateScene() {
    const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : {};
    const mapAssetUrl = String(mapSource.assetUrl || "").trim();
    if (!mapAssetUrl || !refs || !refs.worldOverlay) return;
    if (refs.stage) refs.stage.dataset.levelStageState = "loading";
    if (refs.labelMeta) refs.labelMeta.textContent = "loading svg";
    try {
      const authoredScene = await loadAuthoredLevelScene({
        level,
        worldWidthPx: state.worldWidthPx,
        worldHeightPx: state.worldHeightPx,
      });
      if (!authoredScene) throw new Error("Level scene load failed");
      state.summary = authoredScene.summary;
      state.sceneModel = authoredScene.sceneModel;
      state.cameraAnchors = Array.isArray(state.sceneModel.cameraAnchors) ? state.sceneModel.cameraAnchors : [];
      state.spawn = state.sceneModel.spawn;
      refs.worldOverlay.setAttribute("viewBox", `0 0 ${state.worldWidthPx} ${state.worldHeightPx}`);
      refs.worldOverlay.innerHTML = buildOverlayMarkup({
        loops: state.sceneModel.loops,
        lineArtShapes: state.sceneModel.lineArtShapes,
        viewFloorGuides: state.sceneModel.viewFloorGuides,
      });
      if (refs.stage) refs.stage.dataset.levelStageState = "ready";
      if (state.cameraRuntime && typeof state.cameraRuntime.reset === "function") {
        state.cameraRuntime.reset();
      }
      state.bootCamera = true;
      updateCamera();
    } catch (error) {
      if (refs.stage) refs.stage.dataset.levelStageState = "error";
      if (refs.labelMeta) refs.labelMeta.textContent = "svg load failed";
      console.error(error);
    }
  }

  return Object.freeze({
    state,
    updateCamera,
    hydrateScene,
    dispose() {
      unbindResize();
    },
  });
}
