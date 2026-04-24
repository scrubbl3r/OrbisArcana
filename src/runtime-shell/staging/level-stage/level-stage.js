import { createCameraRuntime } from "../../../game-runtime/camera/camera-runtime.js";
import {
  resolveAuthoredLevelCameraTarget,
  resolveViewFloorBootOffsetYW,
} from "../../../game-runtime/level/authored-level-scene-model.js";
import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../game-runtime/orb/orb-base-state.js";
import {
  applyOrbFractureVisualCssVars,
  buildOrbFractureVisualState,
} from "../../../game-runtime/orb/orb-fracture-base-state.js";
import { createLevelStageRuntimeAdapter } from "./level-stage-runtime-adapter.js?v=20260424c";
import { loadAuthoredLevelScene } from "../load-authored-level-scene.js?v=20260424b";
import { buildAuthoredLevelOverlayMarkup } from "../authored-level-overlay.js?v=20260424a";
import {
  resolveStageCameraClampBounds,
  resolveStageCameraConfig,
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../authored-level-camera.js?v=20260424b";

const LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM = 0.25;
const LEVEL_STAGE_ORB_MARKUP = `
  <div class="levelStageOrbLayer" aria-hidden="true">
    <div class="orbWrap levelStageOrbWrap" data-level-stage-orb-wrap="true">
      <div class="origin" aria-hidden="true">
        <div class="electricLayer" data-level-stage-electric-layer="true" aria-hidden="true"></div>
        <div class="flameLayer" data-level-stage-flame-layer="true" aria-hidden="true"></div>
        <div class="shockLayer" data-level-stage-shock-layer="true" aria-hidden="true"></div>
        <div class="shield atOrigin levelStageShield" data-level-stage-shield="true"></div>
        <div class="orb atOrigin" data-level-stage-orb="true"></div>
        <svg class="orbCracks atOrigin" data-level-stage-orb-cracks="true" viewBox="-50 -50 100 100"></svg>
        <div class="orbInterior atOrigin" data-level-stage-orb-interior="true"></div>
        <svg class="orbShards atOrigin" data-level-stage-orb-shards="true" viewBox="-80 -80 160 160"></svg>
      </div>
    </div>
  </div>
`;

const LEVEL_STAGE_GLOBE_MARKUP = `
  <div class="pickupGlobe" data-level-stage-test-globe="true" aria-label="Energy globe"></div>
`;

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveLevelWorldSize(level = null, mapSource = {}) {
  const sourceScale = mapSource && typeof mapSource.scale === "object" ? mapSource.scale : {};
  const world = level && typeof level.world === "object" ? level.world : {};
  return Object.freeze({
    widthPx: Math.max(
      1,
      clampNumber(sourceScale.worldWidthPx, 0) ||
      clampNumber(world.widthPx, 0) ||
      clampNumber(mapSource.authoringViewBox && mapSource.authoringViewBox.width, 0) ||
      2048
    ),
    heightPx: Math.max(
      1,
      clampNumber(sourceScale.worldHeightPx, 0) ||
      clampNumber(world.heightPx, 0) ||
      clampNumber(mapSource.authoringViewBox && mapSource.authoringViewBox.height, 0) ||
      2048
    ),
  });
}

function resolvePreviewZoom(level = null) {
  return resolveStageCameraZoom(level, "preview", LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM);
}

function resolvePreviewFollowMode(level = null) {
  return resolveStageCameraFollowMode(level, "preview", "follow_target_center");
}

function resolvePreviewCameraConfig(level = null, {
  worldWidthPx = 0,
  worldHeightPx = 0,
  cameraAnchors = [],
} = {}) {
  return resolveStageCameraConfig(level, {
    mode: "preview",
    worldWidthPx,
    groundCenterWorld: () => Math.max(0, worldHeightPx) * 0.5,
    worldHeightPx,
    cameraAnchors,
  });
}

function updateLevelCamera(refs, state) {
  if (!refs || !refs.physStage || !refs.world) return;
  const rect = typeof refs.physStage.getBoundingClientRect === "function"
    ? refs.physStage.getBoundingClientRect()
    : { width: 0, height: 0 };
  const viewportWidthPx = Math.max(0, clampNumber(rect.width, 0));
  const viewportHeightPx = Math.max(0, clampNumber(rect.height, 0));
  if (viewportWidthPx < 1 || viewportHeightPx < 1) {
    return;
  }
  const cameraConfig = resolvePreviewCameraConfig(state.level, {
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
    cameraAnchors: state.cameraAnchors,
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
  const bootOffsetYW = resolveViewFloorBootOffsetYW({
    targetYW: target.yW,
    boundaryBox,
    viewFloorGuide,
    viewportHeightPx,
    zoom: Math.max(0.05, clampNumber(state.previewZoom, LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM)),
  });
  const frame = state.cameraRuntime && typeof state.cameraRuntime.resolveFrame === "function"
    ? state.cameraRuntime.resolveFrame({
      targetXW: clampNumber(target.xW, 0),
      targetYW: clampNumber(target.yW, 0) + bootOffsetYW,
      viewportWidthPx,
      viewportHeightPx,
      worldWidthPx: state.worldWidthPx,
      worldHeightPx: state.worldHeightPx,
      zoom: Math.max(0.05, clampNumber(state.previewZoom, LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM)),
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
  state.bootCamera = false;
  const translateX = -frame.camLeft * frame.zoom;
  const translateY = -frame.camTop * frame.zoom;
  refs.world.style.setProperty("--level-world-width", `${state.worldWidthPx}px`);
  refs.world.style.setProperty("--level-world-height", `${state.worldHeightPx}px`);
  refs.world.style.setProperty("--level-world-zoom", `${frame.zoom}`);
  refs.world.style.setProperty("--level-world-x", `${translateX}px`);
  refs.world.style.setProperty("--level-world-y", `${translateY}px`);
  if (refs.labelMeta) {
    const authoredSpawn = state.spawn && state.spawn.authoredCenter ? state.spawn.authoredCenter : null;
    refs.labelMeta.textContent = authoredSpawn
      ? `${state.previewFollowMode} | zoom ${frame.zoom.toFixed(2)} | spawn ${Math.round(authoredSpawn.x)}, ${Math.round(authoredSpawn.y)}`
      : `${state.previewFollowMode} | zoom ${frame.zoom.toFixed(2)} | spawn unresolved`;
  }
}

async function hydrateSvgLevelPreview(refs, state, level) {
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
    refs.worldOverlay.innerHTML = buildAuthoredLevelOverlayMarkup({
      loops: state.sceneModel.loops,
      lineArtShapes: state.sceneModel.lineArtShapes,
      viewFloorGuides: state.sceneModel.viewFloorGuides,
    });
    if (refs.stage) refs.stage.dataset.levelStageState = "ready";
    if (state.cameraRuntime && typeof state.cameraRuntime.reset === "function") {
      state.cameraRuntime.reset();
    }
    state.bootCamera = true;
    updateLevelCamera(refs, state);
  } catch (error) {
    if (refs.stage) refs.stage.dataset.levelStageState = "error";
    if (refs.labelMeta) refs.labelMeta.textContent = "svg load failed";
    console.error(error);
  }
}

function bindLevelStageResize(refs, state) {
  if (!refs || !refs.physStage) return () => {};
  const update = () => updateLevelCamera(refs, state);
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => update());
    observer.observe(refs.physStage);
    return () => observer.disconnect();
  }
  const win = globalThis.window || null;
  if (win && typeof win.addEventListener === "function") {
    win.addEventListener("resize", update);
    return () => win.removeEventListener("resize", update);
  }
  return () => {};
}

export function renderLevelStage(root, { level = null } = {}) {
  if (!root) return null;
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : {};
  const mapAssetUrl = String(mapSource.assetUrl || "").trim();
  const worldSize = resolveLevelWorldSize(level, mapSource);
  const previewZoom = resolvePreviewZoom(level);
  const previewFollowMode = resolvePreviewFollowMode(level);
  const orbBaseVisualState = buildOrbBaseVisualState();
  const orbFractureVisualState = buildOrbFractureVisualState();
  root.innerHTML = `
    <section class="levelStage" aria-label="Level stage">
      <div class="levelStageViewport">
        <div class="levelStageWorldDock" aria-hidden="true">
          <div class="levelStageWorld">
            <svg class="levelStageWorldOverlay" viewBox="0 0 ${worldSize.widthPx} ${worldSize.heightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
            ${LEVEL_STAGE_ORB_MARKUP}
            ${LEVEL_STAGE_GLOBE_MARKUP}
          </div>
        </div>
        <div class="levelStageLabel">
          <span class="levelStageLabelTitle">Level Stage</span>
          <span class="levelStageLabelMeta"></span>
        </div>
        <div class="deathPanel off" data-level-stage-death-panel="true" aria-hidden="true">
          <div class="deathCard" role="dialog" aria-label="You died">
            <div class="deathTitle">YOU DIED</div>
            <button class="stageButton" data-level-stage-try-again="true" type="button">TRY AGAIN</button>
          </div>
        </div>
      </div>
    </section>
  `;
  applyOrbBaseVisualCssVars(orbBaseVisualState, { root });
  applyOrbFractureVisualCssVars(orbFractureVisualState, { root });

  const refs = {
    root,
    stage: root.querySelector(".levelStage"),
    physStage: root.querySelector(".levelStageViewport"),
    worldDock: root.querySelector(".levelStageWorldDock"),
    world: root.querySelector(".levelStageWorld"),
    worldOverlay: root.querySelector(".levelStageWorldOverlay"),
    labelMeta: root.querySelector(".levelStageLabelMeta"),
    orbWrap: root.querySelector("[data-level-stage-orb-wrap='true']"),
    orb: root.querySelector("[data-level-stage-orb='true']"),
    orbInterior: root.querySelector("[data-level-stage-orb-interior='true']"),
    orbCracks: root.querySelector("[data-level-stage-orb-cracks='true']"),
    orbShards: root.querySelector("[data-level-stage-orb-shards='true']"),
    testGlobe: root.querySelector("[data-level-stage-test-globe='true']"),
    shield: root.querySelector("[data-level-stage-shield='true']"),
    shockLayer: root.querySelector("[data-level-stage-shock-layer='true']"),
    flameLayer: root.querySelector("[data-level-stage-flame-layer='true']"),
    electricLayer: root.querySelector("[data-level-stage-electric-layer='true']"),
    deathPanel: root.querySelector("[data-level-stage-death-panel='true']"),
    tryAgainBtn: root.querySelector("[data-level-stage-try-again='true']"),
  };

  const state = {
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
    previewZoom,
    previewFollowMode,
    initialTarget: String(level && level.camera && level.camera.initialTarget || "spawn").trim().toLowerCase(),
    level,
    cameraRuntime: createCameraRuntime(),
    bootCamera: true,
    cameraAnchors: [],
    spawn: null,
    summary: null,
    sceneModel: null,
  };

  updateLevelCamera(refs, state);
  const unbindResize = bindLevelStageResize(refs, state);
  void hydrateSvgLevelPreview(refs, state, level);

  return {
    root,
    refs,
    adapter: createLevelStageRuntimeAdapter({
      refs,
      level,
      state,
      unbindResize,
    }),
    level,
  };
}
