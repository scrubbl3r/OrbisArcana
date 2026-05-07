import { getLevelById } from "../../../content/levels/registry.js";
import {
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  LEVEL_CAMERA_INITIAL_TARGET_FALLBACK,
  LEVEL_CAMERA_MODE_PREVIEW,
  LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX,
  normalizeLevelDefinition,
} from "../../../game-runtime/level/normalize-level-definition.js";
import {
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../../../game-runtime/level/authored-level-camera.js?v=20260506a";
import { resolveLevelWorldSize } from "../../../game-runtime/level/resolve-level-world-size.js";
import { createOrbStageRuntimeAdapter } from "./orb-stage-runtime-adapter.js?v=20260507z";
import { createGameStageDepth3dLayer } from "../game-stage/game-stage-depth3d.js?v=20260506e";
import { buildOrbBaseVisualState } from "../../../game-runtime/orb/orb-base-state.js";
import { buildAuthoredLevelOverlayMarkup } from "../../../game-runtime/stage/authored-level-overlay.js?v=20260506a";
import { createAuthoredStageController } from "../../../game-runtime/stage/authored-stage-controller.js?v=20260506a";

const ORB_STAGE_DEFAULT_PREVIEW_ZOOM = 0.25;

function resolvePreviewZoom(level = null) {
  return resolveStageCameraZoom(level, LEVEL_CAMERA_MODE_PREVIEW, ORB_STAGE_DEFAULT_PREVIEW_ZOOM);
}

function resolvePreviewFollowMode(level = null) {
  return resolveStageCameraFollowMode(level, LEVEL_CAMERA_MODE_PREVIEW, LEVEL_CAMERA_FOLLOW_MODE_FALLBACK);
}

function buildOrbStageTemplate({ worldWidthPx = 2048, worldHeightPx = 2048 } = {}) {
  return `
  <section class="orbStage" aria-label="Orb stage">
    <div class="orbStageCard">
      <div id="physStage" class="physStage" aria-label="Physics test stage">
        <div class="orbStageDepth3dLayer" data-orb-stage-depth3d-layer="true" aria-hidden="true" hidden></div>
        <div class="orbStageViewportLabel">
          <span class="orbStageViewportTitle">Orb Stage</span>
          <span class="orbStageViewportMeta" data-orb-stage-label-meta="true"></span>
          <span class="orbStageDepthReadout" data-orb-stage-depth-readout="true"></span>
        </div>
        <div class="orbStageWorldDock" aria-hidden="true">
          <div class="orbStageWorld">
            <svg id="orbStageWorldOverlay" class="orbStageWorldOverlay" viewBox="0 0 ${Number(worldWidthPx) || 2048} ${Number(worldHeightPx) || 2048}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>

        <div id="deathPanel" class="deathPanel off" aria-hidden="true">
          <div class="deathCard" role="dialog" aria-label="You died">
            <div class="deathTitle">YOU DIED</div>
            <button id="tryAgainBtn" class="stageButton" type="button">TRY AGAIN</button>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
}

const DEFAULT_LEVEL = getLevelById("orb-hangar");

export function renderOrbStage(root, {
  level = DEFAULT_LEVEL,
  externalCameraAuthority = false,
  perfTrace = null,
} = {}) {
  if (!root) return null;
  const resolvedLevel = normalizeLevelDefinition(level || DEFAULT_LEVEL);
  const worldSize = resolveLevelWorldSize(resolvedLevel);
  const previewZoom = resolvePreviewZoom(resolvedLevel);
  const previewFollowMode = resolvePreviewFollowMode(resolvedLevel);
  root.innerHTML = buildOrbStageTemplate({
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
  });
  const stage = resolvedLevel && resolvedLevel.stage ? resolvedLevel.stage : {};
  const orbBaseVisualState = buildOrbBaseVisualState();
  root.dataset.levelId = String(resolvedLevel && resolvedLevel.id || "orb-hangar");
  root.style.setProperty("--orb-stage-panel-height", `${Number(stage.panelHeightPx) || LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX}px`);

  const refs = {
    root,
    stage: root.querySelector(".orbStage"),
    physStage: root.querySelector("#physStage"),
    depth3dLayer: root.querySelector("[data-orb-stage-depth3d-layer='true']"),
    worldDock: root.querySelector(".orbStageWorldDock"),
    world: root.querySelector(".orbStageWorld"),
    worldOverlay: root.querySelector("#orbStageWorldOverlay"),
    labelMeta: root.querySelector("[data-orb-stage-label-meta='true']"),
    depthReadout: root.querySelector("[data-orb-stage-depth-readout='true']"),
    deathPanel: root.querySelector("#deathPanel"),
    tryAgainBtn: root.querySelector("#tryAgainBtn"),
  };
  const depth3dRuntime = createGameStageDepth3dLayer({
    root: refs.depth3dLayer,
    labelEl: refs.labelMeta,
    debugEl: refs.depthReadout,
    orbDiameterWorldUnits: orbBaseVisualState.diameterPx,
    perfTrace,
  });
  const controller = createAuthoredStageController({
    refs,
    level: resolvedLevel,
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
    previewZoom,
    previewFollowMode,
    initialTarget: String(
      resolvedLevel && resolvedLevel.camera && resolvedLevel.camera.initialTarget || LEVEL_CAMERA_INITIAL_TARGET_FALLBACK
    ).trim().toLowerCase(),
    buildOverlayMarkup: (args = {}) => buildAuthoredLevelOverlayMarkup({
      ...args,
      overlayId: "orbStageWorldOverlay",
    }),
    stageStateDatasetKey: "orbStageState",
    previewZoomFallback: ORB_STAGE_DEFAULT_PREVIEW_ZOOM,
    onSceneHydrated: (authoredScene, state) => {
      if (depth3dRuntime && typeof depth3dRuntime.loadScene === "function") {
        void depth3dRuntime.loadScene(authoredScene, state);
      }
    },
    onCameraFrame: (frame) => {
      if (depth3dRuntime && typeof depth3dRuntime.renderFrame === "function") {
        depth3dRuntime.renderFrame(frame);
      }
    },
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
    adapter: createOrbStageRuntimeAdapter({
      refs,
      level: resolvedLevel,
      state,
      depth3dRuntime,
      orbDiameterWorldUnits: orbBaseVisualState.diameterPx,
      unbindResize: () => controller.dispose(),
    }),
    level: resolvedLevel,
    stageEl: refs.physStage,
    tryAgainBtnEl: refs.tryAgainBtn,
  };
}

if (globalThis.document) {
  const root = document.getElementById("orbStageRoot");
  if (root) renderOrbStage(root, { level: DEFAULT_LEVEL });
}
