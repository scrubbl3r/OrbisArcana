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

export function setDevStagingStatus(refs, html, cls = "devStagingDim") {
  if (!refs || !refs.status) return;
  refs.status.className = cls;
  refs.status.innerHTML = String(html || "");
}

export function setDevStagingFatal(refs, message = "") {
  if (!refs || !refs.fatal) return;
  refs.fatal.textContent = String(message || "");
  refs.fatal.classList.toggle("on", !!message);
}

export function setDevStagingDebugNote(refs, text = "") {
  if (!refs || !refs.devSpinAuditNote) return;
  refs.devSpinAuditNote.textContent = String(text || "");
}

export function closeDevStagingTopmostPopup(refs) {
  if (!refs) return false;
  if (refs.wordBoardPopup && refs.wordBoardPopup.classList.contains("on") && refs.wordBoardPopupClose) {
    refs.wordBoardPopupClose.click();
    return true;
  }
  if (refs.logPopup && refs.logPopup.classList.contains("on") && refs.logPopupClose) {
    refs.logPopupClose.click();
    return true;
  }
  return false;
}

export function renderDevStagingHud(refs, vm) {
  if (!refs || !vm) return;
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
}

export function resetDevStagingHud(refs) {
  if (!refs) return;
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
}

export function projectDevStagingPanelRefs(refs = {}) {
  return {
    teleBtn: refs.teleBtn || null,
    wordBoardBtn: refs.wordBoardBtn || null,
    kwsReadout: refs.kwsReadout || null,
    kwsLog: refs.kwsLog || null,
    logTabKws: refs.logTabKws || null,
    logTabPhone: refs.logTabPhone || null,
    kwsTokenThrInput: refs.kwsTokenThrInput || null,
    kwsCooldownMsInput: refs.kwsCooldownMsInput || null,
    kwsApplyTuneBtn: refs.kwsApplyTuneBtn || null,
    logPopup: refs.logPopup || null,
    logPopupHeader: refs.logPopupHeader || null,
    logPopupClose: refs.logPopupClose || null,
    wordBoardPopup: refs.wordBoardPopup || null,
    wordBoardPopupHeader: refs.wordBoardPopupHeader || null,
    wordBoardPopupClose: refs.wordBoardPopupClose || null,
    wordBoardBody: refs.wordBoardBody || null,
    wordBoardDebugPanel: refs.wordBoardDebugPanel || null,
    wordBoardDebugToggle: refs.wordBoardDebugToggle || null,
    wordBoardDebugBadge: refs.wordBoardDebugBadge || null,
    wordBoardDebugBody: refs.wordBoardDebugBody || null,
  };
}
