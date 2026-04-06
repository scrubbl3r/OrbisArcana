export function attachShellReceiverHostImpulseAdapter({
  receiverHostState = null,
  runtime = null,
  runInputFramePipelineImported = null,
  inputDynamicsConfig = null,
  inputGestureConfig = null,
  applyStabilityVisuals = null,
  computeLift01 = null,
  pickShakeMetric = null,
  buildInputHudViewModel = null,
  renderInputHud = null,
} = {}) {
  if (!receiverHostState || !runtime || typeof runInputFramePipelineImported !== "function") {
    return null;
  }

  let pendingHudVm = null;
  let hudRaf = 0;

  function flushHud() {
    hudRaf = 0;
    if (!pendingHudVm || typeof renderInputHud !== "function") return;
    renderInputHud(pendingHudVm);
    pendingHudVm = null;
  }

  receiverHostState.processIncomingImpulse = (d = {}) => {
    const inputSystem = receiverHostState.inputSystem;
    const inputGestureSystem = receiverHostState.inputGestureSystem;
    const inputDynamicsSystem = receiverHostState.inputDynamicsSystem;
    const nowMs = performance.now();

    function pick01NewOrOld(newKey, oldKey) {
      if (d[newKey] != null) {
        const n = Number(d[newKey]);
        return Number.isFinite(n) ? n : 0;
      }
      const n = Number(d[oldKey]);
      if (!Number.isFinite(n)) return 0;
      return (n > 1.5) ? (n / 100) : n;
    }

    if (inputSystem && typeof inputSystem.ingest === "function") {
      inputSystem.ingest(d, nowMs);
    }
    const frame = (inputSystem && typeof inputSystem.getLatest === "function")
      ? inputSystem.getLatest()
      : null;
    const processed = runInputFramePipelineImported({
      d,
      frame,
      nowMs,
      values: {
        energyFromPhone: frame ? frame.energy01 : pick01NewOrOld("energy01", "energy"),
        groove: frame ? frame.groove01 : pick01NewOrOld("groove01", "groove"),
        dynamics: frame ? frame.dynamics01 : pick01NewOrOld("dynamics01", "orbit01"),
        smooth: frame ? frame.smooth01 : pick01NewOrOld("smooth01", "smooth"),
        speed: frame ? frame.speed01 : pick01NewOrOld("speed01", "speed"),
        shake: frame ? frame.shake01 : (
          typeof pickShakeMetric === "function" ? pickShakeMetric(d, "shake01", "shake") : 0
        ),
        locked: frame ? !!frame.locked : !!d.locked,
      },
      systems: {
        inputGestureSystem,
        inputDynamicsSystem,
      },
      runtime: {
        orbRuntimeState: runtime.orbRuntimeState,
      },
      configs: {
        inputDynamics: inputDynamicsConfig,
      },
      hooks: {
        computeLift01,
        setBgFromEnergy: () => {},
        setStabilityVisualGate: (next) => {
          receiverHostState.stabilityVisualGate = !!next;
        },
        applyStabilityVisuals,
        processShakeDoubleBang: (shakeVal01, atMs, groove01) => {
          if (inputGestureSystem && typeof inputGestureSystem.processShakeSample === "function") {
            inputGestureSystem.processShakeSample({
              shakeVal01,
              groove01,
              atMs,
            });
          }
        },
        setAudio: () => {},
      },
    });

    if (typeof buildInputHudViewModel === "function" && typeof renderInputHud === "function") {
      const vm = buildInputHudViewModel({
        processed,
        shakeCooldownUntil: (inputGestureSystem && typeof inputGestureSystem.getShakeCooldownUntil === "function")
          ? Number(inputGestureSystem.getShakeCooldownUntil()) || 0
          : 0,
        shakeLampThreshold: Number(inputGestureConfig && inputGestureConfig.shake && inputGestureConfig.shake.lampThreshold) || 1.65,
      });
      pendingHudVm = vm;
      if (!hudRaf) {
        hudRaf = requestAnimationFrame(flushHud);
      }
    }
  };

  return receiverHostState.processIncomingImpulse;
}
