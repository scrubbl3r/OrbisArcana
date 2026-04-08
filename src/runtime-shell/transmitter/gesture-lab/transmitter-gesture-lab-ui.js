export function createTransmitterGestureLabUi({ rootDocument = document } = {}) {
  const refs = {
    labBtn: rootDocument.getElementById("labBtn"),
    labModal: rootDocument.getElementById("labModal"),
    labClose: rootDocument.getElementById("labClose"),
    lockGravityBtn: rootDocument.getElementById("lockGravityBtn"),
    lockGravityBar: rootDocument.getElementById("lockGravityBar"),
    gravityReadout: rootDocument.getElementById("gravityReadout"),
    labelGroup: rootDocument.getElementById("labelGroup"),
    recordBtn: rootDocument.getElementById("recordBtn"),
    stopBtn: rootDocument.getElementById("stopBtn"),
    saveBtn: rootDocument.getElementById("saveBtn"),
    qualityBar: rootDocument.getElementById("qualityBar"),
    recordStatus: rootDocument.getElementById("recordStatus"),
    testToggle: rootDocument.getElementById("testToggle"),
    testReadout: rootDocument.getElementById("testReadout"),
    masterySlider: rootDocument.getElementById("masterySlider"),
    masteryReadout: rootDocument.getElementById("masteryReadout"),
    resetLabBtn: rootDocument.getElementById("resetLabBtn"),
  };

  function setLabOpen(isOpen) {
    if (!refs.labModal) return;
    refs.labModal.classList.toggle("on", !!isOpen);
    refs.labModal.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function setLabelSelection(label) {
    const buttons = refs.labelGroup ? refs.labelGroup.querySelectorAll(".labLabelBtn") : [];
    buttons.forEach((button) => {
      button.classList.toggle("on", button.dataset.label === label);
    });
  }

  function setProgress(el, value01) {
    if (!el) return;
    const progress = Math.max(0, Math.min(1, value01)) * 100;
    el.style.width = `${progress.toFixed(1)}%`;
  }

  function updateGravityReadout(gravityLock) {
    if (!refs.gravityReadout) return;
    if (!gravityLock) {
      refs.gravityReadout.textContent = "g: —";
      return;
    }
    refs.gravityReadout.textContent =
      `g: ${gravityLock.x.toFixed(2)}, ${gravityLock.y.toFixed(2)}, ${gravityLock.z.toFixed(2)}`;
  }

  function updateMasteryUi(mastery) {
    const clamped = Math.max(0, Math.min(1, mastery));
    if (refs.masterySlider) refs.masterySlider.value = String(clamped);
    if (refs.masteryReadout) refs.masteryReadout.textContent = clamped.toFixed(2);
  }

  function setRecordStatus(message) {
    if (refs.recordStatus) refs.recordStatus.textContent = message;
  }

  function bindControls(handlers) {
    if (refs.labBtn) refs.labBtn.onclick = () => handlers.onOpen();
    if (refs.labClose) refs.labClose.onclick = () => handlers.onClose();

    if (refs.labelGroup) {
      refs.labelGroup.addEventListener("click", (event) => {
        const button = event.target && event.target.closest(".labLabelBtn");
        if (!button || typeof handlers.onSelectLabel !== "function") return;
        handlers.onSelectLabel(button.dataset.label || "U");
      });
    }

    if (refs.lockGravityBtn) refs.lockGravityBtn.onclick = () => handlers.onLockGravity();
    if (refs.recordBtn) refs.recordBtn.onclick = () => handlers.onRecord();
    if (refs.stopBtn) refs.stopBtn.onclick = () => handlers.onStopRecord();
    if (refs.saveBtn) refs.saveBtn.onclick = () => handlers.onSave();

    if (refs.testToggle) {
      refs.testToggle.onchange = () => handlers.onToggleTest(!!refs.testToggle.checked);
    }

    if (refs.masterySlider) {
      refs.masterySlider.oninput = () => handlers.onMasteryInput(Number(refs.masterySlider.value));
    }

    if (refs.resetLabBtn) refs.resetLabBtn.onclick = () => handlers.onReset();
  }

  return {
    refs,
    setLabOpen,
    setLabelSelection,
    setProgress,
    updateGravityReadout,
    updateMasteryUi,
    setRecordStatus,
    bindControls,
  };
}
