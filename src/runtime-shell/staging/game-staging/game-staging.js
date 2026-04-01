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
            <div id="orbInterior" class="orbInterior atOrigin" aria-hidden="true"></div>
            <svg id="orbCracks" class="orbCracks atOrigin" viewBox="-50 -50 100 100" aria-hidden="true"></svg>
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
          <strong><span id="gVal">0.33</span>x</strong>
        </div>
        <input id="gSlider" type="range" min="0" max="3" value="0.33" step="0.01" />

        <div style="height:10px"></div>

        <div class="sliderRow">
          <span>Fall Drag</span>
          <strong><span id="dVal">-0.24</span></strong>
        </div>
        <input id="dSlider" type="range" min="-1" max="1" value="-0.24" step="0.01" />
      </div>
    </div>
  </section>
`;

export function renderGameStaging(root) {
  if (!root) return null;
  root.innerHTML = GAME_STAGING_TEMPLATE;

  return {
    root,
    stageEl: root.querySelector("#physStage"),
    gravitySliderEl: root.querySelector("#gSlider"),
    dragSliderEl: root.querySelector("#dSlider"),
    tryAgainBtnEl: root.querySelector("#tryAgainBtn"),
  };
}

if (globalThis.document) {
  const root = document.getElementById("gameStagingRoot");
  if (root) renderGameStaging(root);
}
