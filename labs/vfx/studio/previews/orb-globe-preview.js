import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../../src/game-runtime/orb/orb-base-state.js";
import {
  applyOrbGlobeVisualCssVars,
  buildOrbGlobeVisualState,
  getInnerGlobeDiameterPx,
  getOrbitDistancePx,
  getOrbitGlobeRadiusPx,
} from "../../../../src/game-runtime/orb/orb-globe-base-state.js";

export function createOrbGlobePreview({ els, clamp }) {
  let samples = [];
  let phaseGlobes = [];
  let nextPhaseGlobeId = 1;
  let rafId = 0;

  function createGlobeElement(className) {
    const el = document.createElement("div");
    el.className = className;
    return el;
  }

  function clearDom() {
    for (const el of samples) {
      try { el.remove(); } catch (_) {}
    }
    samples = [];
    if (els.orbInterior) els.orbInterior.innerHTML = "";
  }

  function stopAnimation() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function clear() {
    stopAnimation();
    phaseGlobes = [];
    clearDom();
  }

  function readSpeedRange() {
    const rawMin = clamp(els.orbGlobeSpeedMin && els.orbGlobeSpeedMin.value, 0, 12);
    const rawMax = clamp(els.orbGlobeSpeedMax && els.orbGlobeSpeedMax.value, 0, 12);
    return {
      min: Math.min(rawMin, rawMax),
      max: Math.max(rawMin, rawMax),
    };
  }

  function readDriftRange() {
    const rawMin = clamp(els.orbGlobeDriftMin && els.orbGlobeDriftMin.value, 0, 2);
    const rawMax = clamp(els.orbGlobeDriftMax && els.orbGlobeDriftMax.value, 0, 2);
    return {
      min: Math.min(rawMin, rawMax),
      max: Math.max(rawMin, rawMax),
    };
  }

  function readState() {
    return buildOrbGlobeVisualState({
      innerDiameterRatio: clamp(els.orbGlobeInnerDiameterRatio.value, 0.01, 1),
      orbitRadiusRatio: clamp(els.orbGlobeOrbitRadiusRatio.value, 0.01, 1),
      orbitDistanceOffsetPx: clamp(els.orbGlobeOrbitOffset.value, 0, 200),
      orbitDistanceRatio: clamp(els.orbGlobeOrbitDistanceRatio.value, 0.1, 3),
      orbitDistanceMinPx: clamp(els.orbGlobeOrbitDistanceMin.value, 0, 200),
      orbitRadiusMinPx: clamp(els.orbGlobeOrbitRadiusMin.value, 0, 100),
      orbitStrokeWidthPx: clamp(els.orbGlobeOrbitStroke.value, 0, 12),
    });
  }

  function randomBetween(min, max) {
    return min + (Math.random() * (max - min));
  }

  function randomAxis() {
    return {
      angle: Math.random() * Math.PI * 2,
      squash: randomBetween(0.22, 0.68),
    };
  }

  function renderPhaseGlobes(state) {
    clearDom();
    if (!els.orbInterior || !els.orbGlobePreviewLayer) return;
    if (!phaseGlobes.length) return;

    const orbDiameter = Number(getComputedStyle(els.previewRoot).getPropertyValue("--orb-d").replace("px", "")) || 100;
    const orbRadius = orbDiameter * 0.5;
    const innerD = getInnerGlobeDiameterPx(orbRadius, state);
    const orbitR = getOrbitDistancePx(orbRadius, state);
    const orbitRadius = getOrbitGlobeRadiusPx(orbRadius, state);
    const t = performance.now() / 1000;
    const loaded = phaseGlobes.filter((g) => g.state === "loaded");
    const bound = phaseGlobes.filter((g) => g.state === "bound");

    loaded.forEach((globe, index) => {
      const el = createGlobeElement("orbitGlobe");
      const orbitD = orbitRadius * 2;
      const direction = globe.direction || 1;
      const angle = globe.phase + (t * globe.speed * direction);
      const axis = globe.axis || { angle: 0, squash: 0.28 };
      const driftDirection = globe.driftDirection || 1;
      const axisAngle = axis.angle + (t * (globe.drift || 0) * driftDirection);
      const localX = Math.cos(angle) * orbitR;
      const localY = Math.sin(angle) * orbitR * axis.squash;
      const axisCos = Math.cos(axisAngle);
      const axisSin = Math.sin(axisAngle);
      const x = (localX * axisCos) - (localY * axisSin);
      const y = (localX * axisSin) + (localY * axisCos);
      el.style.width = `${orbitD.toFixed(2)}px`;
      el.style.height = `${orbitD.toFixed(2)}px`;
      el.style.left = `${(x - orbitRadius).toFixed(2)}px`;
      el.style.top = `${(y - orbitRadius).toFixed(2)}px`;
      el.style.opacity = `${Math.max(0.55, 1 - (index * 0.08)).toFixed(3)}`;
      els.orbGlobePreviewLayer.appendChild(el);
      samples.push(el);
    });

    bound.forEach((globe, index) => {
      const el = createGlobeElement("innerGlobe");
      const bounceT = t * (1.8 + (index * 0.25)) + globe.phase;
      const x = Math.cos(bounceT) * Math.max(4, orbRadius - innerD);
      const y = Math.sin(bounceT * 1.31) * Math.max(4, orbRadius - innerD);
      el.style.width = `${innerD.toFixed(2)}px`;
      el.style.height = `${innerD.toFixed(2)}px`;
      el.style.left = `${(orbRadius + x - innerD * 0.5).toFixed(2)}px`;
      el.style.top = `${(orbRadius + y - innerD * 0.5).toFixed(2)}px`;
      els.orbInterior.appendChild(el);
      samples.push(el);
    });
  }

  function tick() {
    if (!phaseGlobes.length) {
      stopAnimation();
      clearDom();
      return;
    }
    renderPhaseGlobes(readState());
    rafId = requestAnimationFrame(tick);
  }

  function startAnimation() {
    if (rafId || !phaseGlobes.length) return;
    rafId = requestAnimationFrame(tick);
  }

  function apply() {
    const state = readState();

    const orbBaseVisualState = buildOrbBaseVisualState();
    applyOrbBaseVisualCssVars(orbBaseVisualState, {
      root: els.previewRoot,
    });
    applyOrbGlobeVisualCssVars(state, {
      root: els.previewRoot,
      orbRadiusPx: orbBaseVisualState.radiusPx,
    });
    renderPhaseGlobes(state);
    startAnimation();
  }

  function addGlobe() {
    const speedRange = readSpeedRange();
    const driftRange = readDriftRange();
    phaseGlobes.push({
      id: nextPhaseGlobeId++,
      state: "loaded",
      phase: Math.random() * Math.PI * 2,
      axis: randomAxis(),
      direction: Math.random() < 0.5 ? -1 : 1,
      drift: randomBetween(driftRange.min, driftRange.max),
      driftDirection: Math.random() < 0.5 ? -1 : 1,
      speed: randomBetween(speedRange.min, speedRange.max),
    });
    apply();
    startAnimation();
  }

  function bindGlobe() {
    const globe = phaseGlobes.find((g) => g.state === "loaded");
    if (globe) {
      globe.state = "bound";
      globe.phase = Math.random() * Math.PI * 2;
      globe.axis = randomAxis();
      globe.direction = Math.random() < 0.5 ? -1 : 1;
    }
    apply();
    startAnimation();
  }

  function clearPhaseGlobes() {
    phaseGlobes = [];
    stopAnimation();
    clearDom();
    apply();
  }

  function wire() {
    if (els.previewOrbGlobe) els.previewOrbGlobe.addEventListener("click", apply);
    if (els.orbGlobeAddBtn) els.orbGlobeAddBtn.addEventListener("click", addGlobe);
    if (els.orbGlobeBindBtn) els.orbGlobeBindBtn.addEventListener("click", bindGlobe);
    if (els.orbGlobeClearBtn) els.orbGlobeClearBtn.addEventListener("click", clearPhaseGlobes);
    [
      els.orbGlobeApplyInnerDiameterRatioBtn,
      els.orbGlobeApplyOrbitRadiusRatioBtn,
      els.orbGlobeApplyOrbitOffsetBtn,
      els.orbGlobeApplyOrbitDistanceRatioBtn,
      els.orbGlobeApplyOrbitDistanceMinBtn,
      els.orbGlobeApplyOrbitRadiusMinBtn,
      els.orbGlobeApplyOrbitStrokeBtn,
      els.orbGlobeApplySpeedMinBtn,
      els.orbGlobeApplySpeedMaxBtn,
      els.orbGlobeApplyDriftMinBtn,
      els.orbGlobeApplyDriftMaxBtn,
    ].forEach((el) => {
      if (el) el.addEventListener("click", apply);
    });
    apply();
  }

  return {
    apply,
    clear,
    play: apply,
    wire,
  };
}
