import { buildOrbBaseVisualState } from "../../game-runtime/orb/orb-base-state.js";
import { buildAuthoredLevelOverlayMarkup } from "../../game-runtime/stage/authored-level-overlay.js?v=20260507a";
import { createAuthoredStageController } from "../../game-runtime/stage/authored-stage-controller.js?v=20260514a";
import {
  resolveStageCameraFollowMode,
  resolveStageCameraZoom,
} from "../../game-runtime/level/authored-level-camera.js?v=20260507a";
import {
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  LEVEL_CAMERA_INITIAL_TARGET_FALLBACK,
  LEVEL_CAMERA_MODE_PREVIEW,
  LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX,
  normalizeLevelDefinition,
} from "../../game-runtime/level/normalize-level-definition.js";
import { resolveLevelWorldSize } from "../../game-runtime/level/resolve-level-world-size.js";
import { createGameStageDepth3dLayer } from "./game-stage/game-stage-depth3d.js?v=20260521173215s";

const AUTHORED_THREE_STAGE_DEFAULT_PREVIEW_ZOOM = 0.25;

function resolvePreviewZoom(level = null, fallback = AUTHORED_THREE_STAGE_DEFAULT_PREVIEW_ZOOM) {
  return resolveStageCameraZoom(level, LEVEL_CAMERA_MODE_PREVIEW, fallback);
}

function resolvePreviewFollowMode(level = null) {
  return resolveStageCameraFollowMode(level, LEVEL_CAMERA_MODE_PREVIEW, LEVEL_CAMERA_FOLLOW_MODE_FALLBACK);
}

function resolveLevel(level = null, fallbackLevel = null) {
  const sourceLevel = level && typeof level === "object" ? level : fallbackLevel;
  return sourceLevel && typeof sourceLevel === "object" ? normalizeLevelDefinition(sourceLevel) : null;
}

function buildDeathPanelMarkup({
  panelAttr = "",
  buttonAttr = "",
} = {}) {
  return `
        <div class="deathPanel off"${panelAttr} aria-hidden="true">
          <div class="deathCard" role="dialog" aria-label="You died">
            <div class="deathTitle">YOU DIED</div>
            <button class="stageButton"${buttonAttr} type="button">TRY AGAIN</button>
          </div>
        </div>`;
}

function buildGameStageSurfaceTemplate({
  worldWidthPx = 2048,
  worldHeightPx = 2048,
  title = "Game Stage",
} = {}) {
  return `
    <section class="gameStage" aria-label="Game stage">
      <div class="gameStageViewport">
        <div class="gameStageDepth3dLayer" data-game-stage-depth3d-layer="true" aria-hidden="true" hidden></div>
        <div class="gameStageWorldDock" aria-hidden="true">
          <div class="gameStageWorld">
            <svg class="gameStageWorldOverlay" viewBox="0 0 ${worldWidthPx} ${worldHeightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>
        <div class="gameStageActorDock" aria-hidden="true">
          <div class="gameStageActorWorld"></div>
        </div>
        <div class="gameStageTopArtDock" aria-hidden="true">
          <div class="gameStageTopArtWorld">
            <svg class="gameStageTopArtOverlay" viewBox="0 0 ${worldWidthPx} ${worldHeightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>
        <div class="gameStageLabel">
          <span class="gameStageLabelTitle">${title}</span>
          <span class="gameStageLabelMeta"></span>
          <span class="gameStageDepthReadout" data-game-stage-depth-readout="true"></span>
        </div>${buildDeathPanelMarkup({
          panelAttr: " data-game-stage-death-panel=\"true\"",
          buttonAttr: " data-game-stage-try-again=\"true\"",
        })}
      </div>
    </section>
  `;
}

function buildOrbStageSurfaceTemplate({
  worldWidthPx = 2048,
  worldHeightPx = 2048,
  title = "Orb Stage",
} = {}) {
  return `
  <section class="orbStage" aria-label="Orb stage">
    <div class="orbStageCard">
      <div id="physStage" class="physStage" aria-label="Physics test stage">
        <div class="orbStageDepth3dLayer" data-orb-stage-depth3d-layer="true" aria-hidden="true" hidden></div>
        <div class="orbStageViewportLabel">
          <span class="orbStageViewportTitle">${title}</span>
          <span class="orbStageViewportMeta" data-orb-stage-label-meta="true"></span>
          <span class="orbStageDepthReadout" data-orb-stage-depth-readout="true"></span>
        </div>
        <div class="orbStageWorldDock" aria-hidden="true">
          <div class="orbStageWorld">
            <svg id="orbStageWorldOverlay" class="orbStageWorldOverlay" viewBox="0 0 ${Number(worldWidthPx) || 2048} ${Number(worldHeightPx) || 2048}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>
${buildDeathPanelMarkup({
          panelAttr: " id=\"deathPanel\"",
          buttonAttr: " id=\"tryAgainBtn\"",
        })}
      </div>
    </div>
  </section>
`;
}

function collectGameStageRefs(root) {
  return {
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
}

function collectOrbStageRefs(root) {
  return {
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
}

function resolveSurfaceConfig(config = {}) {
  const surface = config && typeof config === "object" ? config : {};
  return Object.freeze({
    kind: String(surface.kind || "game-stage").trim() || "game-stage",
    title: String(surface.title || surface.label || "Game Stage").trim() || "Game Stage",
    overlayId: String(surface.overlayId || "gameStageWorldOverlay").trim() || "gameStageWorldOverlay",
    stageStateDatasetKey: String(surface.stageStateDatasetKey || "gameStageState").trim() || "gameStageState",
    previewZoomFallback: Number.isFinite(Number(surface.previewZoomFallback))
      ? Number(surface.previewZoomFallback)
      : AUTHORED_THREE_STAGE_DEFAULT_PREVIEW_ZOOM,
    panelHeightCssVar: String(surface.panelHeightCssVar || "").trim(),
  });
}

function buildSurfaceTemplate(surface, worldSize) {
  if (surface.kind === "orb-stage") {
    return buildOrbStageSurfaceTemplate({
      worldWidthPx: worldSize.widthPx,
      worldHeightPx: worldSize.heightPx,
      title: surface.title,
    });
  }
  return buildGameStageSurfaceTemplate({
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
    title: surface.title,
  });
}

function collectSurfaceRefs(root, surface) {
  return surface.kind === "orb-stage" ? collectOrbStageRefs(root) : collectGameStageRefs(root);
}

export function renderAuthoredThreeStageSurface(root, {
  level = null,
  fallbackLevel = null,
  surface = {},
  externalCameraAuthority = false,
  perfTrace = null,
  createAdapter = () => null,
} = {}) {
  if (!root) return null;
  const resolvedLevel = resolveLevel(level, fallbackLevel);
  const mapSource = resolvedLevel && typeof resolvedLevel.mapSource === "object" ? resolvedLevel.mapSource : {};
  const worldSize = resolveLevelWorldSize(resolvedLevel, mapSource);
  const resolvedSurface = resolveSurfaceConfig(surface);
  const previewZoom = resolvePreviewZoom(resolvedLevel, resolvedSurface.previewZoomFallback);
  const previewFollowMode = resolvePreviewFollowMode(resolvedLevel);
  const orbBaseVisualState = buildOrbBaseVisualState();

  root.innerHTML = buildSurfaceTemplate(resolvedSurface, worldSize);
  if (resolvedLevel && resolvedLevel.id) root.dataset.levelId = String(resolvedLevel.id);
  if (resolvedSurface.panelHeightCssVar) {
    const stage = resolvedLevel && resolvedLevel.stage ? resolvedLevel.stage : {};
    root.style.setProperty(
      resolvedSurface.panelHeightCssVar,
      `${Number(stage.panelHeightPx) || LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX}px`
    );
  }

  const refs = collectSurfaceRefs(root, resolvedSurface);
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
      starsField: null,
      overlayId: resolvedSurface.overlayId,
    }),
    stageStateDatasetKey: resolvedSurface.stageStateDatasetKey,
    previewZoomFallback: resolvedSurface.previewZoomFallback,
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
    adapter: createAdapter({
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
