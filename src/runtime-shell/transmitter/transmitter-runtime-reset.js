export function createTransmitterRuntimeReset({
  resetPacketPublisher = () => {},
  resetAudio = () => {},
  resetBg = () => {},
} = {}) {
  function resetRuntimeState(state) {
    state.lastT = null;

    state.ox = 0;
    state.oy = 0;
    state.oz = 0;
    state.spinVector01 = null;
    state.spinDirection = null;

    state.spinVectorHist.length = 0;
    state.omegaMag.length = 0;
    state.omegaNorm.length = 0;
    state.omegaVec.length = 0;
    state.jerkBuf.length = 0;
    state.dtBuf.length = 0;
    state.dynamicsVecBuf.length = 0;
    state.dynamicsDtBuf.length = 0;
    state.shakeFullTimes.length = 0;

    state.emaMean = 0;
    state.emaVar = 1;

    state.lock = false;
    state.lockStrength = 0;
    state.grooveHz = 0;
    state.graceLeft = 0;
    state.recenterBadTime = 0;

    state.energy = 0;
    state.energyUI = 0;
    state.mSpeedEMA = 0;
    state.speedOut = 0;

    state.meterHoldLeft = 0;
    state.lastGrooveUI = 0;
    state.lastDynamicsUI = 0;
    state.lastSmoothUI = 0;

    state.shake01 = 0;
    state.accelBaseMag = 9.81;
    state.prevAx = 0;
    state.prevAy = 0;
    state.prevAz = 0;
    state.prevAmag = 9.81;

    resetPacketPublisher();
    resetAudio();
    resetBg();
  }

  return {
    resetRuntimeState,
  };
}
