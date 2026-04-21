export const DEV_STAGING_TEMPLATE = `
  <section class="devStaging" aria-label="Dev staging">
    <div class="devStagingCard">
      <div class="devStagingHeader">Dev Stage</div>

      <div class="devStagingStat">
        <div class="devStagingStatusLine">
          <div>Status: <span id="status" class="devStagingDim">Auto-connecting…</span></div>
          <div class="devStagingStatusTools">
            <button id="cameraInputBtn" class="devStagingButton" type="button">CAM INPUT</button>
            <button id="pathBoardBtn" class="devStagingButton" type="button">PATH BOARD</button>
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
      </div>
      <div id="kwsLog" class="logPopupBody" aria-label="Debug log"></div>
    </div>

    <div id="pathBoardPopup" class="pathBoardPopup" aria-hidden="true">
      <div id="pathBoardPopupHeader" class="pathBoardPopupHeader runtimeShellPopupHeader">
        <div class="pathBoardPopupTitle">Path Board</div>
        <button class="devStagingButton devStagingPopupClose" id="pathBoardPopupClose" aria-label="Close path board" type="button">Close</button>
      </div>
      <div class="pathBoardMeta" aria-label="KWS status and tuning">
        <div class="pathBoardMetaReadout">
          <div class="pathBoardMetaLine"><span class="pathBoardMetaLabel">KWS::</span> <span id="kwsReadout" class="devStagingDim">idle</span></div>
          <div class="pathBoardMetaLine"><span class="pathBoardMetaLabel">Rules:</span> <span id="rulesReadout" class="devStagingDim">unknown</span></div>
        </div>
        <div class="devStagingTuneRow pathBoardTuneRow" aria-label="KWS infer tuning">
          <label>Infer TH <input id="kwsTokenThrInput" type="number" min="0" max="1" step="0.001" placeholder="0.150" /></label>
          <label>Infer CD <input id="kwsCooldownMsInput" type="number" min="0" max="5000" step="25" placeholder="600" /></label>
          <button id="kwsApplyTuneBtn" class="devStagingButton" type="button">Apply</button>
        </div>
      </div>
      <div id="pathBoardBody" class="pathBoardPopupBody" aria-label="Path board"></div>
    </div>

    <div id="cameraInputPopup" class="cameraInputPopup" aria-hidden="true">
      <div id="cameraInputPopupHeader" class="cameraInputPopupHeader runtimeShellPopupHeader">
        <div class="cameraInputPopupTitle">Camera Input</div>
        <button class="devStagingButton devStagingPopupClose" id="cameraInputPopupClose" aria-label="Close camera input" type="button">Close</button>
      </div>
      <div class="cameraInputMeta" aria-label="Camera input diagnostics">
        <div class="cameraInputMetaGrid">
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Status:</span> <span id="cameraInputStatusReadout" class="devStagingDim">cam:idle</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Lifecycle:</span> <span id="cameraInputLifecycleReadout" class="devStagingDim">idle / idle</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Permission:</span> <span id="cameraInputPermissionReadout" class="devStagingDim">unknown</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Tracking:</span> <span id="cameraInputTrackingReadout" class="devStagingDim">idle</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Hand:</span> <span id="cameraInputHandReadout" class="devStagingDim">-</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Failure:</span> <span id="cameraInputFailureReadout" class="devStagingDim" data-state="ok">none</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Steering:</span> <span id="cameraInputSteeringReadout" class="devStagingDim">idle</span></div>
          <div class="cameraInputMetaLine"><span class="cameraInputMetaLabel">Orb:</span> <span id="cameraInputOrbReadout" class="devStagingDim">x:0.00 vx:0.00</span></div>
        </div>
      </div>
      <div class="cameraInputSignalPanel">
        <div class="cameraInputSignalHeader">
          <div class="cameraInputSignalTitle">Horizontal Signal</div>
          <div class="cameraInputSignalConfidence">conf <span id="cameraInputSignalConfidence">0%</span></div>
        </div>
        <div id="cameraInputSignalTrack" class="cameraInputSignalTrack" data-tracking-state="idle" aria-label="Camera input horizontal signal">
          <div class="cameraInputSignalCenter"></div>
          <div id="cameraInputSignalFill" class="cameraInputSignalFill" data-side="right"></div>
          <div id="cameraInputSignalDot" class="cameraInputSignalDot"></div>
        </div>
        <div class="cameraInputMetricRow">
          <div class="cameraInputMetric"><span class="cameraInputMetricLabel">raw</span><span id="cameraInputRawXReadout" class="cameraInputMetricValue">0.500</span></div>
          <div class="cameraInputMetric"><span class="cameraInputMetricLabel">filtered</span><span id="cameraInputFilteredXReadout" class="cameraInputMetricValue">0.500</span></div>
          <div class="cameraInputMetric"><span class="cameraInputMetricLabel">centered</span><span id="cameraInputCenteredXReadout" class="cameraInputMetricValue">0.000</span></div>
          <div class="cameraInputMetric"><span class="cameraInputMetricLabel">conf</span><span id="cameraInputConfidenceReadout" class="cameraInputMetricValue">0.000</span></div>
          <div class="cameraInputMetric"><span class="cameraInputMetricLabel">fps</span><span id="cameraInputFpsReadout" class="cameraInputMetricValue">0.0</span></div>
        </div>
      </div>
    </div>
  </section>
`;
