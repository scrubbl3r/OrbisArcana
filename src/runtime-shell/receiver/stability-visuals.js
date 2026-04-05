export function getReceiverStabilityVisualState({
  inputDynamicsSystem = null,
  stabilityVisualGate = false,
} = {}) {
  const dynState = (inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
    ? (inputDynamicsSystem.getState() || { stabilityOn: false, variabilityOn: false })
    : { stabilityOn: false, variabilityOn: false };

  const showStable = !!dynState.stabilityOn && !!stabilityVisualGate;
  const showVar = !!dynState.variabilityOn && !!stabilityVisualGate;

  return {
    showStable,
    showVar,
    diversityLampLit: showVar,
  };
}

export function applyReceiverStabilityLampState({
  stableEl = null,
  varEl = null,
  state = null,
  setLamp = null,
} = {}) {
  const showStable = !!(state && state.showStable);
  const showVar = !!(state && state.showVar);

  if (typeof setLamp === "function") {
    setLamp(stableEl, showStable);
    setLamp(varEl, showVar);
    return;
  }

  if (stableEl && stableEl.classList) stableEl.classList.toggle("on", showStable);
  if (varEl && varEl.classList) varEl.classList.toggle("on", showVar);
}
