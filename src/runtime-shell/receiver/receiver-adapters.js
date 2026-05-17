(function(global){
  function createReceiverPhysicsAdapter(options){
    const physState = options.physState;

    return function syncPhysicsFromMotion(state){
      const motion = state.motion;

      physState.lift01 = motion.lift01;
      physState.dynamics01 = motion.dynamics01;
      physState.motionTrust01 = motion.motionTrust01;
      physState.fallCatch01 = motion.fallCatch01;
    };
  }

  function createReceiverHudAdapter(options){
    const els = options.els;
    const clamp01 = options.clamp01;
    const setBar = options.setBar;

    return function renderHudFromMotion(state){
      const motion = state.motion;
      const direction = state.direction || {};
      const energyUI01 = clamp01(motion.energy01);
      const liftP = Math.round(clamp01(motion.lift01) * 100);
      const gP = Math.round(clamp01(motion.groove01) * 100);
      const sP = Math.round(clamp01(motion.smooth01) * 100);
      const sp = Math.round(clamp01(motion.speed01) * 100);
      const dP = Math.round(clamp01(motion.dynamics01) * 100);
      const ePts = Math.round(energyUI01 * 100);
      els.vLift.textContent = `${liftP}%`;
      els.vGroove.textContent = `${gP}%`;
      els.vSmooth.textContent = `${sP}%`;
      els.vSpeed.textContent = `${sp}%`;
      els.vDynamics.textContent = `${dP}%`;
      els.vEnergy.textContent = `${ePts}`;
      els.vShake.textContent = `${Math.max(0, motion.shakeDisplayValue).toFixed(2)}`;

      setBar(els.bLift, motion.lift01);
      setBar(els.bGroove, motion.groove01);
      setBar(els.bSmooth, motion.smooth01);
      setBar(els.bSpeed, motion.speed01);
      setBar(els.bDynamics, motion.dynamics01);
      setBar(els.bEnergy, energyUI01);
      setBar(els.bShake, motion.shakeMeter01);

      const over = (energyUI01 > 1);
      els.vEnergy.classList.toggle("over", over);
      els.bEnergy.classList.toggle("over", over);

      if (els.dirReadout){
        if (direction.vector){
          els.dirReadout.textContent = `${Number(direction.yawDeg || 0).toFixed(0)}° yaw  |  ${Number(direction.tiltDeg || 0).toFixed(0)}° tilt`;
        } else {
          els.dirReadout.textContent = "—";
        }
      }
    };
  }

  function createReceiverGameplayAdapter(options){
    const clamp01 = options.clamp01;
    const physState = options.physState;
    const setPendingDirection = options.setPendingDirection;
    const setStabilityVisualGate = options.setStabilityVisualGate;
    const applyStabilityVisuals = options.applyStabilityVisuals;
    const updateStability = options.updateStability;
    const updateVariability = options.updateVariability;
    const processShakeDoubleBang = options.processShakeDoubleBang;
    const stabilitySpeedMin = options.stabilitySpeedMin;

    return function applyGameplayFromMotion(state){
      const motion = state.motion;
      const direction = state.direction || {};
      const nowMs = state.receivedAtMs;

      if (direction.code) {
        setPendingDirection(direction.code, nowMs);
      }

      const stabilityVisualGate =
        (!physState.onGround) &&
        (clamp01(motion.speed01) >= stabilitySpeedMin) &&
        (!physState.shieldDescentBlocked);

      setStabilityVisualGate(stabilityVisualGate);
      applyStabilityVisuals();
      updateStability(motion.dynamics01, nowMs);
      updateVariability(motion.dynamics01, nowMs);
      processShakeDoubleBang(motion.shake01, nowMs, motion.groove01, motion.speed01);
    };
  }

  global.createReceiverPhysicsAdapter = createReceiverPhysicsAdapter;
  global.createReceiverHudAdapter = createReceiverHudAdapter;
  global.createReceiverGameplayAdapter = createReceiverGameplayAdapter;
})(window);
