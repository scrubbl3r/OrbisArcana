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

export function createReceiverStabilityVisualController({
  getInputDynamicsSystem = null,
  getStabilityVisualGate = null,
  getRefs = null,
  setLamp = null,
} = {}) {
  function computeState() {
    return getReceiverStabilityVisualState({
      inputDynamicsSystem: (typeof getInputDynamicsSystem === "function") ? getInputDynamicsSystem() : null,
      stabilityVisualGate: (typeof getStabilityVisualGate === "function") ? !!getStabilityVisualGate() : false,
    });
  }

  function apply() {
    const refs = (typeof getRefs === "function") ? (getRefs() || {}) : {};
    applyReceiverStabilityLampState({
      stableEl: refs.dynLampStable || null,
      varEl: refs.dynLampVar || null,
      state: computeState(),
      setLamp,
    });
  }

  function isDiversityLampLit() {
    return !!computeState().diversityLampLit;
  }

  return {
    apply,
    isDiversityLampLit,
  };
}

export function createInlineReceiverStabilityVisualController({
  inputDynamicsSystem = null,
  stabilityVisualGate = false,
  refs = {},
} = {}) {
  function computeState() {
    return getReceiverStabilityVisualState({
      inputDynamicsSystem,
      stabilityVisualGate,
    });
  }

  function apply() {
    applyReceiverStabilityLampState({
      stableEl: refs.dynLampStable || null,
      varEl: refs.dynLampVar || null,
      state: computeState(),
    });
  }

  function isDiversityLampLit() {
    return !!computeState().diversityLampLit;
  }

  return {
    apply,
    isDiversityLampLit,
  };
}
