export function createLegacyDevStagingRefsFromElements(els = {}) {
  return {
    status: els.status,
    fatal: els.fatal,
    teleBtn: els.teleBtn,
    wordBoardBtn: els.wordBoardBtn,
    kwsReadout: els.kwsReadout,
    kwsLog: els.kwsLog,
    logTabKws: els.logTabKws,
    logTabPhone: els.logTabPhone,
    kwsTokenThrInput: els.kwsTokenThrInput,
    kwsCooldownMsInput: els.kwsCooldownMsInput,
    kwsApplyTuneBtn: els.kwsApplyTuneBtn,
    logPopup: els.logPopup,
    logPopupHeader: els.logPopupHeader,
    logPopupClose: els.logPopupClose,
    wordBoardPopup: els.wordBoardPopup,
    wordBoardPopupHeader: els.wordBoardPopupHeader,
    wordBoardPopupClose: els.wordBoardPopupClose,
    wordBoardBody: els.wordBoardBody,
    wordBoardDebugPanel: els.wordBoardDebugPanel,
    wordBoardDebugToggle: els.wordBoardDebugToggle,
    wordBoardDebugBadge: els.wordBoardDebugBadge,
    wordBoardDebugBody: els.wordBoardDebugBody,
    vLift: els.vLift,
    vGroove: els.vGroove,
    vSmooth: els.vSmooth,
    vSpeed: els.vSpeed,
    vDynamics: els.vDynamics,
    vEnergy: els.vEnergy,
    vShake: els.vShake,
    bLift: els.bLift,
    bGroove: els.bGroove,
    bSmooth: els.bSmooth,
    bSpeed: els.bSpeed,
    bDynamics: els.bDynamics,
    bEnergy: els.bEnergy,
    bShake: els.bShake,
    dynLampStable: els.dynLampStable,
    dynLampVar: els.dynLampVar,
    shakeLamp: els.shakeLamp,
    lampUp: els.lampUp,
    lampDown: els.lampDown,
    lampLeft: els.lampLeft,
    lampRight: els.lampRight,
    lampForward: els.lampForward,
    lampBack: els.lampBack,
    devSpinAuditNote: els.devSpinAuditNote,
  };
}

export function createLegacyDevStagingAdapter({
  els,
  setBar,
  renderDevStagingHud = null,
  resetDevStagingHud = null,
  setDevStagingStatus = null,
  setDevStagingFatal = null,
  setDevStagingDebugNote = null,
  closeDevStagingTopmostPopup = null,
} = {}) {
  const refs = createLegacyDevStagingRefsFromElements(els);
  return {
    refs,
    setStatus(html, cls){
      if (typeof setDevStagingStatus === "function") {
        setDevStagingStatus(refs, html, cls || "dim");
        return;
      }
      if (!refs.status) return;
      refs.status.className = cls || "dim";
      refs.status.innerHTML = html;
    },
    setFatal(message = "") {
      if (typeof setDevStagingFatal === "function") {
        setDevStagingFatal(refs, message);
        return;
      }
      if (!refs.fatal) return;
      const hasMessage = !!String(message || "");
      refs.fatal.style.display = hasMessage ? "block" : "none";
      refs.fatal.textContent = hasMessage ? String(message) : "";
    },
    setDebugNote(text = "") {
      if (typeof setDevStagingDebugNote === "function") {
        setDevStagingDebugNote(refs, text);
        return;
      }
      if (!refs.devSpinAuditNote) return;
      refs.devSpinAuditNote.textContent = String(text || "");
    },
    closeTopmostPopup() {
      if (typeof closeDevStagingTopmostPopup === "function") {
        return !!closeDevStagingTopmostPopup(refs);
      }
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
      if (typeof resetDevStagingHud === "function") {
        resetDevStagingHud(refs);
        return;
      }
      setBar(refs.bLift, 0);
      setBar(refs.bGroove, 0);
      setBar(refs.bSmooth, 0);
      setBar(refs.bSpeed, 0);
      setBar(refs.bDynamics, 0);
      setBar(refs.bEnergy, 0);
      setBar(refs.bShake, 0);
      refs.vLift.textContent = "0%";
      refs.vGroove.textContent = "0%";
      refs.vSmooth.textContent = "0%";
      refs.vSpeed.textContent = "0%";
      refs.vDynamics.textContent = "0%";
      refs.vEnergy.textContent = "0";
      refs.vShake.textContent = "0.00";
      refs.vEnergy.classList.remove("over");
      refs.bEnergy.classList.remove("over");
    },
    renderInputHud(vm) {
      if (!vm) return;
      if (typeof renderDevStagingHud === "function") {
        renderDevStagingHud(refs, vm);
        return;
      }
      refs.vLift.textContent = `${vm.liftP}%`;
      refs.vGroove.textContent = `${vm.gP}%${vm.locked ? " (locked)" : ""}`;
      refs.vSmooth.textContent = `${vm.sP}%`;
      refs.vSpeed.textContent = `${vm.sp}%`;
      refs.vDynamics.textContent = `${vm.dP}%`;
      refs.vEnergy.textContent = `${vm.ePts}`;
      refs.vShake.textContent = `${Math.max(0, vm.sh).toFixed(2)}`;

      setBar(refs.bLift, vm.lift);
      setBar(refs.bGroove, vm.groove);
      setBar(refs.bSmooth, vm.smooth);
      setBar(refs.bSpeed, vm.speed);
      setBar(refs.bDynamics, vm.dynamics);
      setBar(refs.bEnergy, vm.energyUI01);
      setBar(refs.bShake, vm.shakeMeter);

      refs.vEnergy.classList.toggle("over", vm.over);
      refs.bEnergy.classList.toggle("over", vm.over);
    },
  };
}

export function createDevStagingPanelElements(view) {
  const refs = view && view.refs ? view.refs : {};
  return {
    teleBtn: refs.teleBtn,
    wordBoardBtn: refs.wordBoardBtn,
    kwsReadout: refs.kwsReadout,
    kwsLog: refs.kwsLog,
    logTabKws: refs.logTabKws,
    logTabPhone: refs.logTabPhone,
    kwsTokenThrInput: refs.kwsTokenThrInput,
    kwsCooldownMsInput: refs.kwsCooldownMsInput,
    kwsApplyTuneBtn: refs.kwsApplyTuneBtn,
    logPopup: refs.logPopup,
    logPopupHeader: refs.logPopupHeader,
    logPopupClose: refs.logPopupClose,
    wordBoardPopup: refs.wordBoardPopup,
    wordBoardPopupHeader: refs.wordBoardPopupHeader,
    wordBoardPopupClose: refs.wordBoardPopupClose,
    wordBoardBody: refs.wordBoardBody,
    wordBoardDebugPanel: refs.wordBoardDebugPanel,
    wordBoardDebugToggle: refs.wordBoardDebugToggle,
    wordBoardDebugBadge: refs.wordBoardDebugBadge,
    wordBoardDebugBody: refs.wordBoardDebugBody,
  };
}
