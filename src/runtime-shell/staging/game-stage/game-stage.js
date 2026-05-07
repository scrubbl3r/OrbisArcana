import { buildOrbBaseVisualState } from "../../../game-runtime/orb/orb-base-state.js";
import { createGameStageRuntimeAdapter } from "./game-stage-runtime-adapter.js?v=20260506a";
import { createGameStageDepth3dLayer } from "./game-stage-depth3d.js?v=20260506e";
import { buildAuthoredLevelOverlayMarkup } from "../../../game-runtime/stage/authored-level-overlay.js?v=20260506a";
import { createAuthoredStageController } from "../../../game-runtime/stage/authored-stage-controller.js?v=20260506a";
import {
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../../../game-runtime/level/authored-level-camera.js?v=20260506a";
import {
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  LEVEL_CAMERA_INITIAL_TARGET_FALLBACK,
  LEVEL_CAMERA_MODE_PREVIEW,
  normalizeLevelDefinition,
} from "../../../game-runtime/level/normalize-level-definition.js";
import { resolveLevelWorldSize } from "../../../game-runtime/level/resolve-level-world-size.js";

const GAME_STAGE_DEFAULT_PREVIEW_ZOOM = 0.25;

function resolvePreviewZoom(level = null) {
  return resolveStageCameraZoom(level, LEVEL_CAMERA_MODE_PREVIEW, GAME_STAGE_DEFAULT_PREVIEW_ZOOM);
}

function resolvePreviewFollowMode(level = null) {
  return resolveStageCameraFollowMode(level, LEVEL_CAMERA_MODE_PREVIEW, LEVEL_CAMERA_FOLLOW_MODE_FALLBACK);
}

export function renderGameStage(root, {
  level = null,
  externalCameraAuthority = false,
  perfTrace = null,
} = {}) {
  if (!root) return null;
  const resolvedLevel = level && typeof level === "object" ? normalizeLevelDefinition(level) : null;
  const mapSource = resolvedLevel && typeof resolvedLevel.mapSource === "object" ? resolvedLevel.mapSource : {};
  const worldSize = resolveLevelWorldSize(resolvedLevel, mapSource);
  const previewZoom = resolvePreviewZoom(resolvedLevel);
  const previewFollowMode = resolvePreviewFollowMode(resolvedLevel);
  const orbBaseVisualState = buildOrbBaseVisualState();
  root.innerHTML = `
    <section class="gameStage" aria-label="Game stage">
      <div class="gameStageViewport">
        <div class="gameStageDepth3dLayer" data-game-stage-depth3d-layer="true" aria-hidden="true" hidden></div>
        <div class="gameStageWorldDock" aria-hidden="true">
          <div class="gameStageWorld">
            <svg class="gameStageWorldOverlay" viewBox="0 0 ${worldSize.widthPx} ${worldSize.heightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>
        <div class="gameStageActorDock" aria-hidden="true">
          <div class="gameStageActorWorld"></div>
        </div>
        <div class="gameStageTopArtDock" aria-hidden="true">
          <div class="gameStageTopArtWorld">
            <svg class="gameStageTopArtOverlay" viewBox="0 0 ${worldSize.widthPx} ${worldSize.heightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>
        <div class="gameStageLabel">
          <span class="gameStageLabelTitle">Game Stage</span>
          <span class="gameStageLabelMeta"></span>
          <span class="gameStageDepthReadout" data-game-stage-depth-readout="true"></span>
        </div>
        <div class="deathPanel off" data-game-stage-death-panel="true" aria-hidden="true">
          <div class="deathCard" role="dialog" aria-label="You died">
            <div class="deathTitle">YOU DIED</div>
            <button class="stageButton" data-game-stage-try-again="true" type="button">TRY AGAIN</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const refs = {
    root,
    stage: root.querySelector(".gameStage"),
    physStage: root.querySelector(".gameStageViewport"),
    depth3dLayer: root.querySelector("[data-game-stage-depth3d-layer='true']"),
    worldDock: root.querySelector(".gameStageWorldDock"),
    world: root.querySelector(".gameStageWorld"),
    actorWorld: root.querySelector(".gameStageActorWorld"),
    topArtWorld: root.querySelector(".gameStageTopArtWorld"),
    worldOverlay: root.querySelector(".gameStageWorldOverlay"),
    topArtOverlay: root.querySelector(".gameStageTopArtOverlay"),
    labelMeta: root.querySelector(".gameStageLabelMeta"),
    depthReadout: root.querySelector("[data-game-stage-depth-readout='true']"),
    deathPanel: root.querySelector("[data-game-stage-death-panel='true']"),
    tryAgainBtn: root.querySelector("[data-game-stage-try-again='true']"),
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
      overlayId: "gameStageWorldOverlay",
    }),
    stageStateDatasetKey: "gameStageState",
    previewZoomFallback: GAME_STAGE_DEFAULT_PREVIEW_ZOOM,
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
    adapter: createGameStageRuntimeAdapter({
      refs,
      level: resolvedLevel,
      state,
      depth3dRuntime,
      orbDiameterWorldUnits: orbBaseVisualState.diameterPx,
      unbindResize: () => controller.dispose(),
    }),
    level: resolvedLevel,
  };
}
