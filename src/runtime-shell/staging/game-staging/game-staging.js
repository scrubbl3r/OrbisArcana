import { LEVEL01 } from "./levels/level01.js";
import { createGameStagingRuntimeAdapter } from "./game-staging-runtime-adapter.js";
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
} from "../../../game-runtime/orb/orb-globe-base-state.js?v=20260416b";
import {
  applyWorldGlobeVisualCssVars,
  buildWorldGlobeVisualState,
} from "../../../game-runtime/world/world-globe-state.js?v=20260418a";

const GAME_STAGING_TEMPLATE = `
  <section class="gameStaging" aria-label="Game staging">
    <div class="gameStagingCard">
      <div class="gameStagingHeader">Game Physics</div>

      <div id="physStage" class="physStage" aria-label="Physics test stage">
        <canvas id="stars" class="starCanvas" aria-hidden="true"></canvas>
        <canvas id="terrain" class="terrainCanvas" aria-hidden="true"></canvas>
        <div id="groundLine" class="groundLine" aria-label="Ground"></div>

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

      <div class="physControls">
        <div class="sliderRow">
          <span>Gravity</span>
          <strong><span id="gVal">0.34</span>x</strong>
        </div>
        <input id="gSlider" type="range" min="0" max="3" value="0.34" step="0.01" />

        <div style="height:10px"></div>

        <div class="sliderRow">
          <span>Fall Drag</span>
          <strong><span id="dVal">-0.53</span></strong>
        </div>
        <input id="dSlider" type="range" min="-1" max="1" value="-0.53" step="0.01" />
      </div>
    </div>
  </section>
`;

export function renderGameStaging(root, { level = LEVEL01 } = {}) {
  if (!root) return null;
  root.innerHTML = GAME_STAGING_TEMPLATE;
  const stage = level && level.stage ? level.stage : {};
  const orbBaseVisualState = buildOrbBaseVisualState();
  const orbFractureVisualState = buildOrbFractureVisualState();
  const orbGlobeVisualState = buildOrbGlobeVisualState();
  const worldGlobeVisualState = buildWorldGlobeVisualState(null, {
    orbDiameterPx: orbBaseVisualState.diameterPx,
  });
  root.dataset.levelId = String(level && level.id || "level01");
  root.style.setProperty("--game-staging-panel-height", `${Number(stage.panelHeightPx) || 800}px`);
  root.style.setProperty("--game-staging-level-box-height", `${Number(stage.levelBoxHeightPx) || 640}px`);
  applyOrbBaseVisualCssVars(orbBaseVisualState, { root });
  applyOrbFractureVisualCssVars(orbFractureVisualState, { root });
  applyOrbGlobeVisualCssVars(orbGlobeVisualState, { root, orbRadiusPx: orbBaseVisualState.radiusPx });
  applyWorldGlobeVisualCssVars(worldGlobeVisualState, { root });

  const refs = {
    root,
    physStage: root.querySelector("#physStage"),
    stars: root.querySelector("#stars"),
    terrain: root.querySelector("#terrain"),
    groundLine: root.querySelector("#groundLine"),
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
    gSlider: root.querySelector("#gSlider"),
    gVal: root.querySelector("#gVal"),
    dSlider: root.querySelector("#dSlider"),
    dVal: root.querySelector("#dVal"),
  };

  return {
    root,
    refs,
    adapter: createGameStagingRuntimeAdapter({ refs, level }),
    level,
    stageEl: refs.physStage,
    gravitySliderEl: refs.gSlider,
    dragSliderEl: refs.dSlider,
    tryAgainBtnEl: refs.tryAgainBtn,
  };
}

if (globalThis.document) {
  const root = document.getElementById("gameStagingRoot");
  if (root) renderGameStaging(root, { level: LEVEL01 });
}
