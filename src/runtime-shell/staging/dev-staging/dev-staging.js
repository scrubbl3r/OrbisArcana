const DEV_STAGING_TEMPLATE = `
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

      <div class="devStagingNote">
        Transitional scaffold for the current left-hand staging role. Logs,
        flashboard, controls, and tuning will be extracted into this surface in
        later slices without locking in today’s layout as the final UX.
      </div>

      <div id="fatal" class="devStagingFatal" aria-live="polite"></div>
    </div>

    <div id="logPopup" class="logPopup" aria-hidden="true">
      <div id="logPopupHeader" class="logPopupHeader">
        <div class="logPopupTitle">KWS Log</div>
        <button class="devStagingButton devStagingPopupClose" id="logPopupClose" aria-label="Close log" type="button">Close</button>
      </div>
      <div class="logPopupTabs" aria-label="Debug log channel">
        <button id="logTabKws" class="devStagingButton logTabBtn active" type="button">KWS</button>
        <button id="logTabPhone" class="devStagingButton logTabBtn" type="button">Phone</button>
      </div>
      <div id="kwsLog" class="logPopupBody" aria-label="KWS debug log"></div>
    </div>

    <div id="wordBoardPopup" class="wordBoardPopup" aria-hidden="true">
      <div id="wordBoardPopupHeader" class="wordBoardPopupHeader">
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

function clamp01(x) {
  x = Number(x);
  return Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
}

function setBar(el, v01) {
  if (!el) return;
  const p = clamp01(v01) * 100;
  el.style.width = `${p.toFixed(1)}%`;
}

function setText(el, value) {
  if (!el) return;
  el.textContent = String(value);
}

export function mountDevStaging(root) {
  if (!root) return null;
  root.innerHTML = DEV_STAGING_TEMPLATE;

  const $ = (id) => root.querySelector(`#${id}`);
  const refs = {
    root,
    status: $("status"),
    fatal: $("fatal"),
    teleBtn: $("teleBtn"),
    wordBoardBtn: $("wordBoardBtn"),
    kwsReadout: $("kwsReadout"),
    rulesReadout: $("rulesReadout"),
    kwsLog: $("kwsLog"),
    logTabKws: $("logTabKws"),
    logTabPhone: $("logTabPhone"),
    kwsTokenThrInput: $("kwsTokenThrInput"),
    kwsCooldownMsInput: $("kwsCooldownMsInput"),
    kwsApplyTuneBtn: $("kwsApplyTuneBtn"),
    logPopup: $("logPopup"),
    logPopupHeader: $("logPopupHeader"),
    logPopupClose: $("logPopupClose"),
    wordBoardPopup: $("wordBoardPopup"),
    wordBoardPopupHeader: $("wordBoardPopupHeader"),
    wordBoardPopupClose: $("wordBoardPopupClose"),
    wordBoardBody: $("wordBoardBody"),
    wordBoardDebugPanel: $("wordBoardDebugPanel"),
    wordBoardDebugToggle: $("wordBoardDebugToggle"),
    wordBoardDebugBadge: $("wordBoardDebugBadge"),
    wordBoardDebugBody: $("wordBoardDebugBody"),
    vLift: $("vLift"),
    vGroove: $("vGroove"),
    vSmooth: $("vSmooth"),
    vSpeed: $("vSpeed"),
    vDynamics: $("vDynamics"),
    vEnergy: $("vEnergy"),
    vShake: $("vShake"),
    bLift: $("bLift"),
    bGroove: $("bGroove"),
    bSmooth: $("bSmooth"),
    bSpeed: $("bSpeed"),
    bDynamics: $("bDynamics"),
    bEnergy: $("bEnergy"),
    bShake: $("bShake"),
    dynLampStable: $("dynLampStable"),
    dynLampVar: $("dynLampVar"),
    shakeLamp: $("shakeLamp"),
    lampUp: $("lampUp"),
    lampDown: $("lampDown"),
    lampLeft: $("lampLeft"),
    lampRight: $("lampRight"),
    lampForward: $("lampForward"),
    lampBack: $("lampBack"),
  };

  const api = {
    root,
    refs,
    setStatus(html, cls = "devStagingDim") {
      if (!refs.status) return;
      refs.status.className = cls;
      refs.status.innerHTML = html;
    },
    setFatal(message = "") {
      if (!refs.fatal) return;
      refs.fatal.textContent = String(message || "");
      refs.fatal.classList.toggle("on", !!message);
    },
    closeTopmostPopup() {
      if (refs.wordBoardPopup && refs.wordBoardPopup.classList.contains("on") && refs.wordBoardPopupClose) {
        refs.wordBoardPopupClose.click();
        return true;
      }
      if (refs.logPopup && refs.logPopup.classList.contains("on") && refs.logPopupClose) {
        refs.logPopupClose.click();
        return true;
      }
      return false;
    },
    resetMeters() {
      setBar(refs.bLift, 0);
      setBar(refs.bGroove, 0);
      setBar(refs.bSmooth, 0);
      setBar(refs.bSpeed, 0);
      setBar(refs.bDynamics, 0);
      setBar(refs.bEnergy, 0);
      setBar(refs.bShake, 0);
      setText(refs.vLift, "0%");
      setText(refs.vGroove, "0%");
      setText(refs.vSmooth, "0%");
      setText(refs.vSpeed, "0%");
      setText(refs.vDynamics, "0%");
      setText(refs.vEnergy, "0");
      setText(refs.vShake, "0.00");
      refs.vEnergy && refs.vEnergy.classList.remove("over");
      refs.bEnergy && refs.bEnergy.classList.remove("over");
    },
    renderInputHud(vm) {
      if (!vm) return;
      setText(refs.vLift, `${vm.liftP}%`);
      setText(refs.vGroove, `${vm.gP}%${vm.locked ? " (locked)" : ""}`);
      setText(refs.vSmooth, `${vm.sP}%`);
      setText(refs.vSpeed, `${vm.sp}%`);
      setText(refs.vDynamics, `${vm.dP}%`);
      setText(refs.vEnergy, `${vm.ePts}`);
      setText(refs.vShake, `${Math.max(0, vm.sh).toFixed(2)}`);

      setBar(refs.bLift, vm.lift);
      setBar(refs.bGroove, vm.groove);
      setBar(refs.bSmooth, vm.smooth);
      setBar(refs.bSpeed, vm.speed);
      setBar(refs.bDynamics, vm.dynamics);
      setBar(refs.bEnergy, vm.energyUI01);
      setBar(refs.bShake, vm.shakeMeter);

      refs.vEnergy && refs.vEnergy.classList.toggle("over", !!vm.over);
      refs.bEnergy && refs.bEnergy.classList.toggle("over", !!vm.over);
    },
  };

  api.resetMeters();
  return api;
}

export function renderDevStaging(root) {
  return mountDevStaging(root);
}
