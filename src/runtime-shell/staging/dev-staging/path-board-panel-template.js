export const PATH_BOARD_PANEL_TEMPLATE = `
  <div id="pathBoardPanel" class="devStagingStackPanel devStagingPathBoardPanel" aria-hidden="true">
    <div id="pathBoardPanelHeader" class="pathBoardPanelHeader runtimeShellPopupHeader">
      <div class="pathBoardPanelTitle">Path Board</div>
      <button class="devStagingButton devStagingPopupClose" id="pathBoardPanelClose" aria-label="Close path board" type="button">Close</button>
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
    <div id="pathBoardBody" class="pathBoardPanelBody" aria-label="Path board"></div>
  </div>
`;
