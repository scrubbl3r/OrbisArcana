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
  let lastTickMs = 0;

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
    lastTickMs = 0;
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

  function readInnerSpeedRange() {
    const rawMin = clamp(els.orbGlobeInnerSpeedMin && els.orbGlobeInnerSpeedMin.value, 0, 600);
    const rawMax = clamp(els.orbGlobeInnerSpeedMax && els.orbGlobeInnerSpeedMax.value, 0, 600);
    return {
      min: Math.min(rawMin, rawMax),
      max: Math.max(rawMin, rawMax),
    };
  }

  function readInnerDriftRange() {
    const rawMin = clamp(els.orbGlobeInnerDriftMin && els.orbGlobeInnerDriftMin.value, 0, 1.5);
    const rawMax = clamp(els.orbGlobeInnerDriftMax && els.orbGlobeInnerDriftMax.value, 0, 1.5);
    return {
      min: Math.min(rawMin, rawMax),
      max: Math.max(rawMin, rawMax),
    };
  }

  function readInnerPaddingPx() {
    return clamp(els.orbGlobeInnerPaddingPx && els.orbGlobeInnerPaddingPx.value, 0, 120);
  }

  function readState() {
    return buildOrbGlobeVisualState({
      innerDiameterRatio: clamp(els.orbGlobeInnerDiameterRatio.value, 0.01, 1),
      orbitDiameterRatio: clamp(els.orbGlobeOrbitDiameterRatio.value, 0.01, 1),
      orbitDistanceRatio: clamp(els.orbGlobeOrbitDistanceRatio.value, 0.1, 3),
      orbitDistanceMinPx: clamp(els.orbGlobeOrbitDistanceMin.value, 0, 200),
      orbitRadiusMinPx: clamp(els.orbGlobeOrbitRadiusMin.value, 0, 100),
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

  function rotateVector(vx, vy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: (vx * cos) - (vy * sin),
      y: (vx * sin) + (vy * cos),
    };
  }

  function initializeInnerMotion(globe) {
    const speedRange = readInnerSpeedRange();
    const driftRange = readInnerDriftRange();
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(speedRange.min, speedRange.max);
    globe.innerX = 0;
    globe.innerY = 0;
    globe.innerVx = Math.cos(angle) * speed;
    globe.innerVy = Math.sin(angle) * speed;
    globe.innerDriftMin = driftRange.min;
    globe.innerDriftMax = driftRange.max;
  }

  function updateInnerGlobes(state, dt) {
    if (!dt) return;

    const orbDiameter = Number(getComputedStyle(els.previewRoot).getPropertyValue("--orb-d").replace("px", "")) || 100;
    const orbRadius = orbDiameter * 0.5;
    const innerD = getInnerGlobeDiameterPx(orbRadius, state);
    const wallRadius = Math.max(0, orbRadius - (innerD * 0.5) - readInnerPaddingPx());

    phaseGlobes
      .filter((g) => g.state === "bound")
      .forEach((globe) => {
        if (!Number.isFinite(globe.innerVx) || !Number.isFinite(globe.innerVy)) {
          initializeInnerMotion(globe);
        }

        globe.innerX += globe.innerVx * dt;
        globe.innerY += globe.innerVy * dt;

        const dist = Math.hypot(globe.innerX, globe.innerY);
        if (dist <= wallRadius || wallRadius <= 0) return;

        const nx = globe.innerX / dist;
        const ny = globe.innerY / dist;
        globe.innerX = nx * wallRadius;
        globe.innerY = ny * wallRadius;

        const velocityAlongNormal = (globe.innerVx * nx) + (globe.innerVy * ny);
        globe.innerVx -= 2 * velocityAlongNormal * nx;
        globe.innerVy -= 2 * velocityAlongNormal * ny;

        const driftMin = Number.isFinite(globe.innerDriftMin) ? globe.innerDriftMin : 0;
        const driftMax = Number.isFinite(globe.innerDriftMax) ? globe.innerDriftMax : driftMin;
        const drift = randomBetween(Math.min(driftMin, driftMax), Math.max(driftMin, driftMax));
        const driftDirection = Math.random() < 0.5 ? -1 : 1;
        const drifted = rotateVector(globe.innerVx, globe.innerVy, drift * driftDirection);
        globe.innerVx = drifted.x;
        globe.innerVy = drifted.y;
      });
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
      if (!Number.isFinite(globe.innerX) || !Number.isFinite(globe.innerY)) {
        initializeInnerMotion(globe);
      }
      el.style.width = `${innerD.toFixed(2)}px`;
      el.style.height = `${innerD.toFixed(2)}px`;
      el.style.left = `${(orbRadius + globe.innerX - innerD * 0.5).toFixed(2)}px`;
      el.style.top = `${(orbRadius + globe.innerY - innerD * 0.5).toFixed(2)}px`;
      el.style.opacity = "1";
      els.orbInterior.appendChild(el);
      samples.push(el);
    });
  }

  function tick(nowMs) {
    if (!phaseGlobes.length) {
      stopAnimation();
      clearDom();
      return;
    }
    const dt = lastTickMs ? Math.min(0.05, Math.max(0, (nowMs - lastTickMs) / 1000)) : 0;
    lastTickMs = nowMs;
    const state = readState();
    updateInnerGlobes(state, dt);
    renderPhaseGlobes(state);
    rafId = requestAnimationFrame(tick);
  }

  function startAnimation() {
    if (rafId || !phaseGlobes.length) return;
    lastTickMs = 0;
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

  function refreshInnerMotion() {
    phaseGlobes
      .filter((g) => g.state === "bound")
      .forEach((globe) => initializeInnerMotion(globe));
    apply();
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
      initializeInnerMotion(globe);
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
      els.orbGlobeApplyOrbitDiameterRatioBtn,
      els.orbGlobeApplyOrbitDistanceRatioBtn,
      els.orbGlobeApplyOrbitDistanceMinBtn,
      els.orbGlobeApplyOrbitRadiusMinBtn,
      els.orbGlobeApplySpeedMinBtn,
      els.orbGlobeApplySpeedMaxBtn,
      els.orbGlobeApplyDriftMinBtn,
      els.orbGlobeApplyDriftMaxBtn,
    ].forEach((el) => {
      if (el) el.addEventListener("click", apply);
    });
    [
      els.orbGlobeApplyInnerSpeedMinBtn,
      els.orbGlobeApplyInnerSpeedMaxBtn,
      els.orbGlobeApplyInnerDriftMinBtn,
      els.orbGlobeApplyInnerDriftMaxBtn,
      els.orbGlobeApplyInnerPaddingBtn,
    ].forEach((el) => {
      if (el) el.addEventListener("click", refreshInnerMotion);
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
