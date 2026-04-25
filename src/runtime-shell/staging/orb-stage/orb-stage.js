import { LEVELS_BY_ID } from "../../../content/levels/registry.js";
import { normalizeLevelDefinition } from "../../../game-runtime/level/normalize-level-definition.js";
import { createOrbStageRuntimeAdapter } from "./orb-stage-runtime-adapter.js?v=20260424h";
import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../game-runtime/orb/orb-base-state.js";
import {
  applyOrbFractureVisualCssVars,
  buildOrbFractureVisualState,
} from "../../../game-runtime/orb/orb-fracture-base-state.js";
import {
  applyOrbGlobeVisualCssVars,
  buildOrbGlobeVisualState,
} from "../../../game-runtime/orb/orb-globe-base-state.js?v=20260418a";
import {
  applyWorldGlobeVisualCssVars,
  buildWorldGlobeVisualState,
} from "../../../game-runtime/world/world-globe-state.js?v=20260418a";
import { buildAuthoredLevelOverlayMarkup } from "../authored-level-overlay.js?v=20260424m";

const ORB_STAGE_TEMPLATE = `
  <section class="orbStage" aria-label="Orb stage">
    <div class="orbStageCard">
      <div id="physStage" class="physStage" aria-label="Physics test stage">
        <div class="orbStageViewportLabel">Orb Stage</div>
        <div class="orbStageWorldDock" aria-hidden="true">
          <div class="orbStageWorld">
            <svg id="orbStageWorldOverlay" class="orbStageWorldOverlay" viewBox="0 0 2048 2048" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>

        <div id="orbWrap" class="orbWrap" aria-hidden="true">
          <div id="origin" class="origin" aria-hidden="true">
            <div id="electricLayer" class="electricLayer" aria-hidden="true"></div>
            <div id="flameLayer" class="flameLayer" aria-hidden="true"></div>
            <div id="shockLayer" class="shockLayer" aria-hidden="true"></div>
            <div id="shield" class="shield atOrigin" aria-label="Stability shield"></div>
            <div id="orb" class="orb atOrigin" aria-label="Orb"></div>
            <svg id="orbCracks" class="orbCracks atOrigin" viewBox="-50 -50 100 100" aria-hidden="true"></svg>
            <div id="orbInterior" class="orbInterior atOrigin" aria-hidden="true"></div>
            <svg id="orbShards" class="orbShards atOrigin" viewBox="-80 -80 160 160" aria-hidden="true"></svg>
          </div>
        </div>

        <div id="testGlobe" class="pickupGlobe" aria-label="Energy globe"></div>

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

const DEFAULT_LEVEL = normalizeLevelDefinition(LEVELS_BY_ID["orb-stage-level"] || null);

export function renderOrbStage(root, { level = DEFAULT_LEVEL } = {}) {
  if (!root) return null;
  const resolvedLevel = normalizeLevelDefinition(level || DEFAULT_LEVEL);
  root.innerHTML = ORB_STAGE_TEMPLATE;
  const stage = resolvedLevel && resolvedLevel.stage ? resolvedLevel.stage : {};
  const orbBaseVisualState = buildOrbBaseVisualState();
  const orbFractureVisualState = buildOrbFractureVisualState();
  const orbGlobeVisualState = buildOrbGlobeVisualState();
  const worldGlobeVisualState = buildWorldGlobeVisualState(null, {
    orbDiameterPx: orbBaseVisualState.diameterPx,
  });
  root.dataset.levelId = String(resolvedLevel && resolvedLevel.id || "orb-stage-level");
  root.style.setProperty("--orb-stage-panel-height", `${Number(stage.panelHeightPx) || 800}px`);
  root.style.setProperty("--orb-stage-level-box-height", `${Number(stage.levelBoxHeightPx) || 640}px`);
  applyOrbBaseVisualCssVars(orbBaseVisualState, { root });
  applyOrbFractureVisualCssVars(orbFractureVisualState, { root });
  applyOrbGlobeVisualCssVars(orbGlobeVisualState, { root, orbRadiusPx: orbBaseVisualState.radiusPx });
  applyWorldGlobeVisualCssVars(worldGlobeVisualState, { root });

  const refs = {
    root,
    physStage: root.querySelector("#physStage"),
    worldDock: root.querySelector(".orbStageWorldDock"),
    world: root.querySelector(".orbStageWorld"),
    worldOverlay: root.querySelector("#orbStageWorldOverlay"),
    orbWrap: root.querySelector("#orbWrap"),
    orb: root.querySelector("#orb"),
    orbInterior: root.querySelector("#orbInterior"),
    orbCracks: root.querySelector("#orbCracks"),
    orbShards: root.querySelector("#orbShards"),
    testGlobe: root.querySelector("#testGlobe"),
    shield: root.querySelector("#shield"),
    shockLayer: root.querySelector("#shockLayer"),
    flameLayer: root.querySelector("#flameLayer"),
    electricLayer: root.querySelector("#electricLayer"),
    deathPanel: root.querySelector("#deathPanel"),
    tryAgainBtn: root.querySelector("#tryAgainBtn"),
  };

  return {
    root,
    refs,
    adapter: createOrbStageRuntimeAdapter({
      refs,
      level: resolvedLevel,
      buildOverlayMarkup: (lineArtShapes = [], starsField = null) => buildAuthoredLevelOverlayMarkup({
        starsField,
        loops: [],
        lineArtShapes,
        overlayId: "orbStageWorldOverlay",
      }),
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
