export function createTransmitterLifecycle({
  pageShell = null,
  startButton = null,
} = {}) {
  const state = {
    mode: "idle",
    ready: false,
    busy: false,
  };

  function setButtonLabel(label) {
    if (pageShell && typeof pageShell.setButtonLabel === "function") {
      pageShell.setButtonLabel(label);
      return;
    }
    if (!startButton) return;
    startButton.textContent = label;
  }

  function setReady(ready) {
    state.ready = !!ready;
    if (pageShell && typeof pageShell.setStartReady === "function") {
      pageShell.setStartReady(state.ready);
      return;
    }
    if (!startButton) return;
    startButton.style.visibility = state.ready ? "visible" : "hidden";
    startButton.disabled = !state.ready;
  }

  function setBusy(busy) {
    state.busy = !!busy;
    if (pageShell && typeof pageShell.setStartBusy === "function") {
      pageShell.setStartBusy(state.busy);
      return;
    }
    if (!startButton) return;
    startButton.disabled = state.busy;
  }

  function setMode(mode) {
    state.mode = mode === "running" ? "running" : "idle";
    if (pageShell && typeof pageShell.setMode === "function") {
      pageShell.setMode(state.mode);
    }
    setButtonLabel(state.mode === "running" ? "Stop" : "Start");
  }

  function isIdle() {
    return state.mode === "idle";
  }

  function isRunning() {
    return state.mode === "running";
  }

  function isReady() {
    return state.ready;
  }

  function isBusy() {
    return state.busy;
  }

  function attachToggle(onStart, onStop) {
    if (!startButton) return;
    startButton.onclick = () => {
      if (isIdle()) onStart();
      else onStop();
    };
  }

  setReady(false);
  setMode("idle");

  return {
    setReady,
    setBusy,
    setMode,
    isIdle,
    isRunning,
    isReady,
    isBusy,
    attachToggle,
  };
}
