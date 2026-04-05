export function createReceiverDevLampVisuals({ getRefs } = {}) {
  let shakeLampTO = null;
  const dirLampTO = { U: null, D: null, L: null, R: null, F: null, B: null };

  function refs() {
    return (typeof getRefs === "function") ? (getRefs() || {}) : {};
  }

  function flashShakeLamp(ms = 400) {
    const currentRefs = refs();
    if (currentRefs.shakeLamp) currentRefs.shakeLamp.classList.add("on");
    if (shakeLampTO) clearTimeout(shakeLampTO);
    shakeLampTO = setTimeout(() => {
      const nextRefs = refs();
      if (nextRefs.shakeLamp) nextRefs.shakeLamp.classList.remove("on");
      shakeLampTO = null;
    }, ms);
  }

  function forceShakeLampOff() {
    const currentRefs = refs();
    if (shakeLampTO) {
      clearTimeout(shakeLampTO);
      shakeLampTO = null;
    }
    if (currentRefs.shakeLamp) currentRefs.shakeLamp.classList.remove("on");
  }

  function clearDirLampTimers() {
    Object.keys(dirLampTO).forEach((key) => {
      if (dirLampTO[key]) {
        clearTimeout(dirLampTO[key]);
        dirLampTO[key] = null;
      }
    });
  }

  function allDirLampOff() {
    const currentRefs = refs();
    if (currentRefs.lampUp) currentRefs.lampUp.classList.remove("on");
    if (currentRefs.lampDown) currentRefs.lampDown.classList.remove("on");
    if (currentRefs.lampLeft) currentRefs.lampLeft.classList.remove("on");
    if (currentRefs.lampRight) currentRefs.lampRight.classList.remove("on");
    if (currentRefs.lampForward) currentRefs.lampForward.classList.remove("on");
    if (currentRefs.lampBack) currentRefs.lampBack.classList.remove("on");
  }

  function flashDirLamp(code, ms = 380) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return;

    const currentRefs = refs();
    const map = {
      U: currentRefs.lampUp,
      D: currentRefs.lampDown,
      L: currentRefs.lampLeft,
      R: currentRefs.lampRight,
      F: currentRefs.lampForward,
      B: currentRefs.lampBack,
    };

    const el = map[c];
    if (!el) return;

    el.classList.add("on");

    if (dirLampTO[c]) clearTimeout(dirLampTO[c]);
    dirLampTO[c] = setTimeout(() => {
      el.classList.remove("on");
      dirLampTO[c] = null;
    }, ms);
  }

  function flashDirLampSingle(code, ms = 380) {
    clearDirLampTimers();
    allDirLampOff();
    flashDirLamp(code, ms);
  }

  function flashDirLampPair(a, b, ms = 380) {
    clearDirLampTimers();
    allDirLampOff();
    flashDirLamp(a, ms);
    flashDirLamp(b, ms);
  }

  return {
    flashShakeLamp,
    forceShakeLampOff,
    clearDirLampTimers,
    allDirLampOff,
    flashDirLamp,
    flashDirLampPair,
    flashDirLampSingle,
  };
}

export function createInlineReceiverDevLampVisuals({ refs } = {}) {
  let shakeLampTO = null;
  const dirLampTO = { U: null, D: null, L: null, R: null, F: null, B: null };

  function flashShakeLamp(ms = 400) {
    if (refs && refs.shakeLamp) refs.shakeLamp.classList.add("on");
    if (shakeLampTO) clearTimeout(shakeLampTO);
    shakeLampTO = setTimeout(() => {
      if (refs && refs.shakeLamp) refs.shakeLamp.classList.remove("on");
      shakeLampTO = null;
    }, ms);
  }

  function forceShakeLampOff() {
    if (shakeLampTO) {
      clearTimeout(shakeLampTO);
      shakeLampTO = null;
    }
    if (refs && refs.shakeLamp) refs.shakeLamp.classList.remove("on");
  }

  function clearDirLampTimers() {
    Object.keys(dirLampTO).forEach((key) => {
      if (dirLampTO[key]) {
        clearTimeout(dirLampTO[key]);
        dirLampTO[key] = null;
      }
    });
  }

  function allDirLampOff() {
    if (refs && refs.lampUp) refs.lampUp.classList.remove("on");
    if (refs && refs.lampDown) refs.lampDown.classList.remove("on");
    if (refs && refs.lampLeft) refs.lampLeft.classList.remove("on");
    if (refs && refs.lampRight) refs.lampRight.classList.remove("on");
    if (refs && refs.lampForward) refs.lampForward.classList.remove("on");
    if (refs && refs.lampBack) refs.lampBack.classList.remove("on");
  }

  function flashDirLamp(code, ms = 380) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return;

    const map = {
      U: refs && refs.lampUp,
      D: refs && refs.lampDown,
      L: refs && refs.lampLeft,
      R: refs && refs.lampRight,
      F: refs && refs.lampForward,
      B: refs && refs.lampBack,
    };

    const el = map[c];
    if (!el) return;

    el.classList.add("on");

    if (dirLampTO[c]) clearTimeout(dirLampTO[c]);
    dirLampTO[c] = setTimeout(() => {
      el.classList.remove("on");
      dirLampTO[c] = null;
    }, ms);
  }

  function flashDirLampSingle(code, ms = 380) {
    clearDirLampTimers();
    allDirLampOff();
    flashDirLamp(code, ms);
  }

  function flashDirLampPair(a, b, ms = 380) {
    clearDirLampTimers();
    allDirLampOff();
    flashDirLamp(a, ms);
    flashDirLamp(b, ms);
  }

  return {
    flashShakeLamp,
    forceShakeLampOff,
    clearDirLampTimers,
    allDirLampOff,
    flashDirLamp,
    flashDirLampPair,
    flashDirLampSingle,
  };
}
