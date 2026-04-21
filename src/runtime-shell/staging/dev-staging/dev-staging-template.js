export const DEV_STAGING_TEMPLATE = `
  <section class="devStaging" aria-label="Dev staging">
    <div class="devStagingCard">
      <div class="devStagingHeader">Dev Stage</div>

      <div class="devStagingStat">
        <div class="devStagingStatusLine">
          <div class="devStagingStatusTools">
            <button id="cameraInputBtn" class="devStagingButton" type="button">CAM INPUT</button>
            <button id="pathBoardBtn" class="devStagingButton" type="button">PATH BOARD</button>
            <button id="teleBtn" class="devStagingButton" type="button">LOG</button>
          </div>
        </div>
      </div>

      <div id="devStagingPanelStack" class="devStagingPanelStack" aria-label="Dev staging panel stack"></div>

      <div id="fatal" class="devStagingFatal" aria-live="polite"></div>
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
