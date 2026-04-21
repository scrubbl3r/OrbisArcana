export const DEV_STAGING_TEMPLATE = `
  <section class="devStaging" aria-label="Dev staging">
    <div class="devStagingCard">
      <div class="devStagingHeader">Dev Stage</div>

      <div class="devStagingStat">
        <div class="devStagingStatusLine">
          <div class="devStagingStatusTools">
            <button id="dynamicsBtn" class="devStagingButton" type="button">DYNAMICS</button>
            <button id="cameraInputBtn" class="devStagingButton" type="button">CAM INPUT</button>
            <button id="pathBoardBtn" class="devStagingButton" type="button">PATH BOARD</button>
            <button id="teleBtn" class="devStagingButton" type="button">LOG</button>
          </div>
        </div>
      </div>

      <div id="devStagingPanelStack" class="devStagingPanelStack" aria-label="Dev staging panel stack"></div>

      <div id="fatal" class="devStagingFatal" aria-live="polite"></div>
    </div>

  </section>
`;
