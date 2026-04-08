export const DEV_STAGING_TEMPLATE = `
  <section class="devStaging" aria-label="Dev staging">
    <div class="devStagingCard">
      <div class="devStagingHeader">Orb Receiver</div>

      <div class="devStagingStat">
        <div class="devStagingStatusLine">
          <div>Status: <span id="status" class="devStagingDim">Auto-connecting…</span></div>
          <div class="devStagingStatusTools">
            <button id="wordBoardBtn" class="devStagingButton" type="button">WORDS</button>
            <button id="teleBtn" class="devStagingButton" type="button">LOG</button>
          </div>
        </div>
      </div>

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

      <div id="fatal" class="devStagingFatal" aria-live="polite"></div>
    </div>

    <div id="logPopup" class="logPopup" aria-hidden="true">
      <div id="logPopupHeader" class="logPopupHeader runtimeShellPopupHeader">
        <div class="logPopupTitle">Log</div>
        <button class="devStagingButton devStagingPopupClose" id="logPopupClose" aria-label="Close log" type="button">Close</button>
      </div>
      <div id="logPopupTabs" class="logPopupTabs runtimeShellPopupSubhead" data-active-channel="general" aria-label="Debug log channel">
        <button id="logTabGeneral" class="devStagingButton logTabBtn" type="button" data-channel="general" aria-pressed="true">GENERAL</button>
        <button id="logTabKws" class="devStagingButton logTabBtn" type="button" data-channel="kws" aria-pressed="false">KWS</button>
        <button id="logTabPhone" class="devStagingButton logTabBtn" type="button" data-channel="phone" aria-pressed="false">Phone</button>
        <button class="devStagingButton logTabBtn" type="button">GHONE</button>
      </div>
      <div id="kwsLog" class="logPopupBody" aria-label="Debug log"></div>
    </div>

    <div id="wordBoardPopup" class="wordBoardPopup" aria-hidden="true">
      <div id="wordBoardPopupHeader" class="wordBoardPopupHeader runtimeShellPopupHeader">
        <div class="wordBoardPopupTitle">WordFlashboard</div>
        <button class="devStagingButton devStagingPopupClose" id="wordBoardPopupClose" aria-label="Close word board" type="button">Close</button>
      </div>
      <div class="wordBoardMeta" aria-label="KWS status and tuning">
        <div class="wordBoardMetaReadout">
          <div class="wordBoardMetaLine"><span class="wordBoardMetaLabel">KWS::</span> <span id="kwsReadout" class="devStagingDim">idle</span></div>
          <div class="wordBoardMetaLine"><span class="wordBoardMetaLabel">Rules:</span> <span id="rulesReadout" class="devStagingDim">unknown</span></div>
        </div>
        <div class="devStagingTuneRow wordBoardTuneRow" aria-label="KWS infer tuning">
          <label>Infer TH <input id="kwsTokenThrInput" type="number" min="0" max="1" step="0.001" placeholder="0.150" /></label>
          <label>Infer CD <input id="kwsCooldownMsInput" type="number" min="0" max="5000" step="25" placeholder="600" /></label>
          <button id="kwsApplyTuneBtn" class="devStagingButton" type="button">Apply</button>
        </div>
      </div>
      <div id="wordBoardBody" class="wordBoardPopupBody" aria-label="Word flashboard"></div>
      <div id="wordBoardDebugPanel" class="wordBoardDebugPanel">
        <button id="wordBoardDebugToggle" class="wordBoardDebugToggle" type="button" aria-expanded="false" aria-controls="wordBoardDebugBody">
          <span>KWS Debug</span>
          <span id="wordBoardDebugBadge" class="wordBoardDebugBadge">idle</span>
        </button>
        <div id="wordBoardDebugBody" class="wordBoardDebugBody" aria-hidden="true"></div>
      </div>
    </div>
  </section>
`;
