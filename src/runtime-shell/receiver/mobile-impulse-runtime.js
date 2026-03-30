export function createMobileImpulseSystem({
  idleMarkActivity,
  applyDataToUI,
  teleMaybeLog,
  onCalibrated,
  onCalibAvailable,
  isInputSuppressed,
}) {
  if (typeof idleMarkActivity !== "function") throw new Error("createMobileImpulseSystem requires idleMarkActivity");
  if (typeof applyDataToUI !== "function") throw new Error("createMobileImpulseSystem requires applyDataToUI");
  if (typeof teleMaybeLog !== "function") throw new Error("createMobileImpulseSystem requires teleMaybeLog");
  if (typeof isInputSuppressed !== "function") throw new Error("createMobileImpulseSystem requires isInputSuppressed");

  const state = {
    lastData: null,
    rafPending: false,
    calibAvailable: false,
  };

  function scheduleUIUpdate(data) {
    state.lastData = data;
    if (state.rafPending) return;
    state.rafPending = true;
    requestAnimationFrame(() => {
      state.rafPending = false;
      if (!state.lastData) return;
      applyDataToUI(state.lastData);
    });
  }

  function markCalibAvailable() {
    if (state.calibAvailable) return false;
    state.calibAvailable = true;
    if (typeof onCalibAvailable === "function") onCalibAvailable();
    return true;
  }

  function ingestImpulse(data) {
    idleMarkActivity();

    if (data && data.calib === 1) {
      if (typeof onCalibrated === "function") onCalibrated();
    }
    markCalibAvailable();

    if (isInputSuppressed()) return;

    teleMaybeLog(data);
    scheduleUIUpdate(data);
  }

  function isCalibAvailable() {
    return !!state.calibAvailable;
  }

  function resetFrameQueue() {
    state.lastData = null;
    state.rafPending = false;
  }

  return {
    ingestImpulse,
    markCalibAvailable,
    isCalibAvailable,
    resetFrameQueue,
  };
}
