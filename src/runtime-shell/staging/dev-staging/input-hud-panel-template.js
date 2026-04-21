export const INPUT_HUD_PANEL_TEMPLATE = `
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
  </div>
`;
