(function(global){
  function createReceiverPhysicsAdapter(options){
    const physState = options.physState;

    return function syncPhysicsFromMotion(state){
      const motion = state.motion;
      const energyBank = state.energyBank;

      physState.lift01 = motion.lift01;
      physState.energy01 = energyBank.level01;
      physState.dynamics01 = motion.dynamics01;
    };
  }

  function createReceiverHudAdapter(options){
    const els = options.els;
    const clamp01 = options.clamp01;
    const lerp = options.lerp;
    const setBgFromEnergy = options.setBgFromEnergy;
    const setBar = options.setBar;
    const setShieldColor01 = options.setShieldColor01;
    const shieldColor01 = options.shieldColor01;
    const shieldColorSmooth = options.shieldColorSmooth;

    return function renderHudFromMotion(state){
      const motion = state.motion;
      const direction = state.direction || {};
      const presentation = state.presentation || {};
      const energyUI01 = state.energyBank.level01;
      const liftP = Math.round(clamp01(motion.lift01) * 100);
      const gP = Math.round(clamp01(motion.groove01) * 100);
      const sP = Math.round(clamp01(motion.smooth01) * 100);
      const sp = Math.round(clamp01(motion.speed01) * 100);
      const dP = Math.round(clamp01(motion.dynamics01) * 100);
      const ePts = Math.round(state.energyBank.points);

      setBgFromEnergy(energyUI01);
      els.vLift.textContent = `${liftP}%`;
      els.vGroove.textContent = `${gP}%${motion.locked ? " (locked)" : ""}`;
      els.vSmooth.textContent = `${sP}%`;
      els.vSpeed.textContent = `${sp}%`;
      els.vDynamics.textContent = `${dP}%`;
      els.vEnergy.textContent = `${ePts}`;
      els.vShake.textContent = `${Math.max(0, motion.shakeDisplayValue).toFixed(2)}`;

      if (presentation.spinColor && presentation.spinColor.length >= 3){
        const tr = clamp01(presentation.spinColor[0]);
        const tg = clamp01(presentation.spinColor[1]);
        const tb = clamp01(presentation.spinColor[2]);
        shieldColor01.r = lerp(shieldColor01.r, tr, shieldColorSmooth);
        shieldColor01.g = lerp(shieldColor01.g, tg, shieldColorSmooth);
        shieldColor01.b = lerp(shieldColor01.b, tb, shieldColorSmooth);
        setShieldColor01(shieldColor01);
      }

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
    const setAudio = options.setAudio;
    const stabilitySpeedMin = options.stabilitySpeedMin;

    return function applyGameplayFromMotion(state){
      const motion = state.motion;
      const direction = state.direction || {};
      const nowMs = state.receivedAtMs;
      const energyUI01 = state.energyBank.level01;

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
      processShakeDoubleBang(motion.shake01, nowMs, motion.groove01);
      setAudio(energyUI01, motion.groove01, motion.locked);
    };
  }

  global.createReceiverPhysicsAdapter = createReceiverPhysicsAdapter;
  global.createReceiverHudAdapter = createReceiverHudAdapter;
  global.createReceiverGameplayAdapter = createReceiverGameplayAdapter;
})(window);
