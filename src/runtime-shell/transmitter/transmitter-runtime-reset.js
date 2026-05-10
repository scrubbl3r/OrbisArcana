export function createTransmitterRuntimeReset({
  resetPacketPublisher = () => {},
  resetAudio = () => {},
  resetBg = () => {},
} = {}) {
  function resetRuntimeState(state) {
    if (state && typeof state === "object") {
      state.lastT = null;

      state.ox = 0;
      state.oy = 0;
      state.oz = 0;
      state.spinVector01 = null;
      state.spinDirection = null;

      if (state.spinVectorHist) state.spinVectorHist.length = 0;
      if (state.omegaMag) state.omegaMag.length = 0;
      if (state.omegaNorm) state.omegaNorm.length = 0;
      if (state.omegaVec) state.omegaVec.length = 0;
      if (state.jerkBuf) state.jerkBuf.length = 0;
      if (state.dtBuf) state.dtBuf.length = 0;
      if (state.dynamicsVecBuf) state.dynamicsVecBuf.length = 0;
      if (state.dynamicsDtBuf) state.dynamicsDtBuf.length = 0;
      if (state.shakeFullTimes) state.shakeFullTimes.length = 0;

      state.emaMean = 0;
      state.emaVar = 1;

      state.grooveStrength = 0;
      state.grooveHz = 0;
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
    }

    resetPacketPublisher();
    resetAudio();
    resetBg();
  }

  return {
    resetRuntimeState,
  };
}
