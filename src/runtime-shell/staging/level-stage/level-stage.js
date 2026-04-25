import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../game-runtime/orb/orb-base-state.js";
import {
  applyOrbFractureVisualCssVars,
  buildOrbFractureVisualState,
} from "../../../game-runtime/orb/orb-fracture-base-state.js";
import { createLevelStageRuntimeAdapter } from "./level-stage-runtime-adapter.js?v=20260425b";
import { buildAuthoredLevelOverlayMarkup } from "../authored-level-overlay.js?v=20260425b";
import { createAuthoredStageController } from "../authored-stage-controller.js?v=20260425b";
import {
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../authored-level-camera.js?v=20260424c";

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

export function renderLevelStage(root, {
  level = null,
  externalCameraAuthority = false,
} = {}) {
  if (!root) return null;
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : {};
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

  const controller = createAuthoredStageController({
    refs,
    level,
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
    previewZoom,
    previewFollowMode,
    initialTarget: String(level && level.camera && level.camera.initialTarget || "spawn").trim().toLowerCase(),
    buildOverlayMarkup: (args = {}) => buildAuthoredLevelOverlayMarkup({
      ...args,
      overlayId: "levelStageWorldOverlay",
    }),
    previewZoomFallback: LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM,
  });
  const state = controller.state;
  state.externalCameraAuthority = !!externalCameraAuthority;

  if (!state.externalCameraAuthority) {
    controller.updateCamera();
  }
  void controller.hydrateScene();

  return {
    root,
    refs,
    controller,
    adapter: createLevelStageRuntimeAdapter({
      refs,
      level,
      state,
      unbindResize: () => controller.dispose(),
    }),
    level,
  };
}
