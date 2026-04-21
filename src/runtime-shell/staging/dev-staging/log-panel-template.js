export const LOG_PANEL_TEMPLATE = `
  <div id="logPanel" class="devStagingStackPanel devStagingLogPanel" aria-hidden="true">
    <div id="logPanelHeader" class="logPanelHeader runtimeShellPopupHeader">
      <div class="logPanelTitle">Log</div>
      <button class="devStagingButton devStagingPopupClose" id="logPanelClose" aria-label="Close log" type="button">Close</button>
    </div>
    <div id="logPanelTabs" class="logPanelTabs runtimeShellPopupSubhead" data-active-channel="general" aria-label="Debug log channel">
      <button id="logTabGeneral" class="devStagingButton logTabBtn" type="button" data-channel="general" aria-pressed="true">GENERAL</button>
      <button id="logTabKws" class="devStagingButton logTabBtn" type="button" data-channel="kws" aria-pressed="false">KWS</button>
      <button id="logTabPhone" class="devStagingButton logTabBtn" type="button" data-channel="phone" aria-pressed="false">Phone</button>
    </div>
    <div id="kwsLog" class="logPanelBody" aria-label="Debug log"></div>
  </div>
`;
