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
