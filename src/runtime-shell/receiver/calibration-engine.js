(function(global){
  function createCalibrationSession(){
    const state = {
      active: false,
      startMs: 0,
      samples: [],
      ackPending: false,
      pendingReq: false,
    };

    function requestStart(isRunning, nowMs){
      if (!isRunning){
        state.pendingReq = true;
        return false;
      }
      state.pendingReq = false;
      state.active = true;
      state.startMs = Number(nowMs) || 0;
      state.samples = [];
      return true;
    }

    function addSample(sample){
      if (!state.active) return;
      state.samples.push(sample);
    }

    function shouldFinish(nowMs, durationMs){
      if (!state.active) return false;
      return (Number(nowMs) - state.startMs) >= Number(durationMs);
    }

    function finishWithAck(){
      state.active = false;
      state.ackPending = true;
    }

    function cancel(){
      state.active = false;
      state.samples = [];
    }

    function consumeAck(){
      const ack = state.ackPending ? 1 : 0;
      state.ackPending = false;
      return ack;
    }

    function takePendingRequest(){
      const pending = !!state.pendingReq;
      state.pendingReq = false;
      return pending;
    }

    return {
      state,
      requestStart,
      addSample,
      shouldFinish,
      finishWithAck,
      cancel,
      consumeAck,
      takePendingRequest,
    };
  }

  global.createCalibrationSession = createCalibrationSession;
})(window);
//