export function createLegacyDevStagingAdapter({
  els,
  setBar,
  renderDevStagingHud = null,
  resetDevStagingHud = null,
} = {}) {
  return {
    refs: {
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
    },
    setStatus(html, cls){
      if (!els.status) return;
      els.status.className = cls || "dim";
      els.status.innerHTML = html;
    },
    setFatal(message = "") {
      if (!els.fatal) return;
      const hasMessage = !!String(message || "");
      els.fatal.style.display = hasMessage ? "block" : "none";
      els.fatal.textContent = hasMessage ? String(message) : "";
    },
    setDebugNote(text = "") {
      if (!els.devSpinAuditNote) return;
      els.devSpinAuditNote.textContent = String(text || "");
    },
    closeTopmostPopup() {
      if (this.refs.wordBoardPopup && this.refs.wordBoardPopup.classList.contains("on") && this.refs.wordBoardPopupClose) {
        this.refs.wordBoardPopupClose.click();
        return true;
      }
      if (this.refs.logPopup && this.refs.logPopup.classList.contains("on") && this.refs.logPopupClose) {
        this.refs.logPopupClose.click();
        return true;
      }
      return false;
    },
    resetMeters() {
      if (typeof resetDevStagingHud === "function") {
        resetDevStagingHud(els);
        return;
      }
      setBar(els.bLift, 0);
      setBar(els.bGroove, 0);
      setBar(els.bSmooth, 0);
      setBar(els.bSpeed, 0);
      setBar(els.bDynamics, 0);
      setBar(els.bEnergy, 0);
      setBar(els.bShake, 0);
      els.vLift.textContent = "0%";
      els.vGroove.textContent = "0%";
      els.vSmooth.textContent = "0%";
      els.vSpeed.textContent = "0%";
      els.vDynamics.textContent = "0%";
      els.vEnergy.textContent = "0";
      els.vShake.textContent = "0.00";
      els.vEnergy.classList.remove("over");
      els.bEnergy.classList.remove("over");
    },
    renderInputHud(vm) {
      if (!vm) return;
      if (typeof renderDevStagingHud === "function") {
        renderDevStagingHud(els, vm);
        return;
      }
      els.vLift.textContent = `${vm.liftP}%`;
      els.vGroove.textContent = `${vm.gP}%${vm.locked ? " (locked)" : ""}`;
      els.vSmooth.textContent = `${vm.sP}%`;
      els.vSpeed.textContent = `${vm.sp}%`;
      els.vDynamics.textContent = `${vm.dP}%`;
      els.vEnergy.textContent = `${vm.ePts}`;
      els.vShake.textContent = `${Math.max(0, vm.sh).toFixed(2)}`;

      setBar(els.bLift, vm.lift);
      setBar(els.bGroove, vm.groove);
      setBar(els.bSmooth, vm.smooth);
      setBar(els.bSpeed, vm.speed);
      setBar(els.bDynamics, vm.dynamics);
      setBar(els.bEnergy, vm.energyUI01);
      setBar(els.bShake, vm.shakeMeter);

      els.vEnergy.classList.toggle("over", vm.over);
      els.bEnergy.classList.toggle("over", vm.over);
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
