function clamp01(x) {
  x = Number(x);
  return Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
}

function setBar(el, v01) {
  if (!el) return;
  const p = clamp01(v01) * 100;
  el.style.width = `${p.toFixed(1)}%`;
}

function setText(el, value) {
  if (!el) return;
  el.textContent = String(value);
}

export function renderDevStagingHud(refs, vm) {
  if (!refs || !vm) return;
  setText(refs.vLift, `${vm.liftP}%`);
  setText(refs.vGroove, `${vm.gP}%`);
  setText(refs.vSmooth, `${vm.sP}%`);
  setText(refs.vSpeed, `${vm.sp}%`);
  setText(refs.vDynamics, `${vm.dP}%`);
  setText(refs.vFallCatch, `${vm.fcP || 0}%`);
  setText(refs.vSimFallDrag, Number.isFinite(Number(vm.simFallDrag)) ? Number(vm.simFallDrag).toFixed(2) : "-1.70");
  setText(refs.vEnergy, `${vm.ePts}`);
  setText(refs.vShake, `${Math.max(0, vm.sh).toFixed(2)}`);

  setBar(refs.bLift, vm.lift);
  setBar(refs.bGroove, vm.groove);
  setBar(refs.bSmooth, vm.smooth);
  setBar(refs.bSpeed, vm.speed);
  setBar(refs.bDynamics, vm.dynamics);
  setBar(refs.bEnergy, vm.energyUI01);
  setBar(refs.bShake, vm.shakeMeter);

  refs.vEnergy && refs.vEnergy.classList.toggle("over", !!vm.over);
  refs.bEnergy && refs.bEnergy.classList.toggle("over", !!vm.over);
}

export function resetDevStagingHud(refs) {
  if (!refs) return;
  setBar(refs.bLift, 0);
  setBar(refs.bGroove, 0);
  setBar(refs.bSmooth, 0);
  setBar(refs.bSpeed, 0);
  setBar(refs.bDynamics, 0);
  setBar(refs.bEnergy, 0);
  setBar(refs.bShake, 0);
  setText(refs.vLift, "0%");
  setText(refs.vGroove, "0%");
  setText(refs.vSmooth, "0%");
  setText(refs.vSpeed, "0%");
  setText(refs.vDynamics, "0%");
  setText(refs.vFallCatch, "0%");
  setText(refs.vSimFallDrag, "-1.70");
  setText(refs.vEnergy, "0");
  setText(refs.vShake, "0.00");
  refs.vEnergy && refs.vEnergy.classList.remove("over");
  refs.bEnergy && refs.bEnergy.classList.remove("over");
}
