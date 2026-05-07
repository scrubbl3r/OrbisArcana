export function attachShellReceiverHostImpulseAdapter({
  receiverHostState = null,
  runtime = null,
  runInputFramePipelineImported = null,
  inputDynamicsConfig = null,
  applyStabilityVisuals = null,
  computeLift01 = null,
  pickShakeMetric = null,
} = {}) {
  if (!receiverHostState || !runtime || typeof runInputFramePipelineImported !== "function") {
    return null;
  }

  const processIncomingImpulse = (d = {}) => {
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
    runInputFramePipelineImported({
      d,
      nowMs,
      values: {
        groove: frame ? frame.groove01 : pick01NewOrOld("groove01", "groove"),
        dynamics: frame ? frame.dynamics01 : pick01NewOrOld("dynamics01", "orbit01"),
        smooth: frame ? frame.smooth01 : pick01NewOrOld("smooth01", "smooth"),
        speed: frame ? frame.speed01 : pick01NewOrOld("speed01", "speed"),
        shake: frame ? frame.shake01 : (
          typeof pickShakeMetric === "function" ? pickShakeMetric(d, "shake01", "shake") : 0
        ),
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
      },
    });

  };

  return processIncomingImpulse;
}
