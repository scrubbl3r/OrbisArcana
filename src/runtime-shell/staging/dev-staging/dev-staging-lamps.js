export function setDevStagingLamp(el, on) {
  if (!el) return;
  el.classList.toggle("on", !!on);
}

function flashLamp(el, runtime, key, ms = 380) {
  if (!el || !runtime) return;
  if (!runtime.dirLampTO) runtime.dirLampTO = Object.create(null);
  el.classList.add("on");
  if (runtime.dirLampTO[key]) clearTimeout(runtime.dirLampTO[key]);
  runtime.dirLampTO[key] = setTimeout(() => {
    el.classList.remove("on");
    runtime.dirLampTO[key] = null;
  }, ms);
}

export function flashDevStagingDirectionLamp(refs, runtime, code, ms = 380) {
  if (!refs || !runtime) return;
  const map = {
    U: refs.lampUp,
    D: refs.lampDown,
    L: refs.lampLeft,
    R: refs.lampRight,
    F: refs.lampForward,
    B: refs.lampBack,
  };
  const c = String(code || "").trim().toUpperCase();
  if (!c || !map[c]) return;
  flashLamp(map[c], runtime, c, ms);
}

export function clearDevStagingDirectionLampTimers(runtime) {
  if (!runtime || !runtime.dirLampTO) return;
  for (const key of Object.keys(runtime.dirLampTO)) {
    if (runtime.dirLampTO[key]) {
      clearTimeout(runtime.dirLampTO[key]);
      runtime.dirLampTO[key] = 0;
    }
  }
}

export function allDevStagingDirectionLampsOff(refs) {
  if (!refs) return;
  [
    refs.lampUp,
    refs.lampDown,
    refs.lampLeft,
    refs.lampRight,
    refs.lampForward,
    refs.lampBack,
  ].forEach((el) => {
    if (el) el.classList.remove("on");
  });
}

export function flashDevStagingDirectionLampPair(refs, runtime, a, b, ms = 380) {
  clearDevStagingDirectionLampTimers(runtime);
  allDevStagingDirectionLampsOff(refs);
  flashDevStagingDirectionLamp(refs, runtime, a, ms);
  flashDevStagingDirectionLamp(refs, runtime, b, ms);
}

export function flashDevStagingDirectionLampSingle(refs, runtime, code, ms = 380) {
  clearDevStagingDirectionLampTimers(runtime);
  allDevStagingDirectionLampsOff(refs);
  flashDevStagingDirectionLamp(refs, runtime, code, ms);
}

export function flashDevStagingShakeLamp(refs, runtime, ms = 400) {
  if (!refs || !runtime || !refs.shakeLamp) return;
  refs.shakeLamp.classList.add("on");
  if (runtime.shakeLampTO) clearTimeout(runtime.shakeLampTO);
  runtime.shakeLampTO = setTimeout(() => {
    refs.shakeLamp.classList.remove("on");
    runtime.shakeLampTO = 0;
  }, ms);
}

export function forceDevStagingShakeLampOff(refs, runtime) {
  if (runtime && runtime.shakeLampTO) {
    clearTimeout(runtime.shakeLampTO);
    runtime.shakeLampTO = 0;
  }
  if (refs && refs.shakeLamp) refs.shakeLamp.classList.remove("on");
}
