export const INPUT_HUD_PANEL_TEMPLATE = `
  <div class="devStagingStackPanel devStagingDynamicsPanel" aria-hidden="false">
    <div class="devStagingStackPanelHeader runtimeShellPopupHeader">
      <div class="devStagingStackPanelTitle">Dynamics</div>
      <button class="devStagingButton devStagingPopupClose" id="dynamicsPanelClose" aria-label="Close dynamics" type="button">Close</button>
    </div>
    <div class="devStagingDynamicsBody">
    <div class="devStagingBars">
    <div class="devStagingBarLabel"><div>Lift</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bLift" class="devStagingFill" style="width:0%"></div></div>
      <div id="vLift" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingBarLabel"><div>Groove</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bGroove" class="devStagingFill" style="width:0%"></div></div>
      <div id="vGroove" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingBarLabel"><div>Smooth</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bSmooth" class="devStagingFill" style="width:0%"></div></div>
      <div id="vSmooth" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingBarLabel"><div>Speed</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bSpeed" class="devStagingFill" style="width:0%"></div></div>
      <div id="vSpeed" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingBarLabel"><div>Dynamics</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bDynamics" class="devStagingFill" style="width:0%"></div></div>
      <div id="dynLampStable" class="devStagingLamp" aria-hidden="true"></div>
      <div id="dynLampVar" class="devStagingLamp" aria-hidden="true"></div>
      <div id="vDynamics" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingBarLabel"><div>Energy</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bEnergy" class="devStagingFill" style="width:0%"></div></div>
      <div id="vEnergy" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingGroupGap"></div>

    <div class="devStagingBarLabel"><div>Shake</div><span class="devStagingDim"> </span></div>
    <div class="devStagingMeterRow">
      <div class="devStagingBar"><div id="bShake" class="devStagingFill" style="width:0%"></div></div>
      <div id="shakeLamp" class="devStagingLamp" aria-hidden="true"></div>
      <div id="vShake" class="devStagingMeterVal">0%</div>
    </div>

    <div class="devStagingDirRow" aria-label="Directional lamps">
      <div class="devStagingDirItem"><div id="lampUp" class="devStagingLamp" aria-hidden="true"></div><div class="devStagingDirLabel">UP</div></div>
      <div class="devStagingDirItem"><div id="lampDown" class="devStagingLamp" aria-hidden="true"></div><div class="devStagingDirLabel">DOWN</div></div>
      <div class="devStagingDirItem"><div id="lampLeft" class="devStagingLamp" aria-hidden="true"></div><div class="devStagingDirLabel">LEFT</div></div>
      <div class="devStagingDirItem"><div id="lampRight" class="devStagingLamp" aria-hidden="true"></div><div class="devStagingDirLabel">RIGHT</div></div>
      <div class="devStagingDirItem"><div id="lampForward" class="devStagingLamp" aria-hidden="true"></div><div class="devStagingDirLabel">FWD</div></div>
      <div class="devStagingDirItem"><div id="lampBack" class="devStagingLamp" aria-hidden="true"></div><div class="devStagingDirLabel">BACK</div></div>
    </div>

    <div class="devStagingGroupGap"></div>

    <div class="devStagingDynamicsControls runtimeShellPopupSubhead" aria-label="Orb stage tuning controls">
      <div class="devStagingControlRow">
        <div class="devStagingControlLabelRow">
          <span>Gravity</span>
          <strong><span id="gVal">0.34</span>x</strong>
        </div>
        <input id="gSlider" type="range" min="0" max="3" value="0.34" step="0.01" />
      </div>

      <div class="devStagingControlRow">
        <div class="devStagingControlLabelRow">
          <span>Fall Drag</span>
          <strong><span id="dVal">-1.70</span></strong>
        </div>
        <input id="dSlider" type="range" min="-5" max="1" value="-1.7" step="0.01" />
      </div>
    </div>
  </div>
  </div>
  </div>
`;
