export const CAMERA_INPUT_PANEL_TEMPLATE = `
  <div id="cameraInputPanel" class="devStagingStackPanel devStagingCameraInputPanel" aria-hidden="true">
    <div id="cameraInputPanelHeader" class="cameraInputPanelHeader runtimeShellPopupHeader">
      <div class="cameraInputPanelTitle">Camera Input</div>
      <button class="devStagingButton devStagingPopupClose" id="cameraInputPanelClose" aria-label="Close camera input" type="button">Close</button>
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
`;
