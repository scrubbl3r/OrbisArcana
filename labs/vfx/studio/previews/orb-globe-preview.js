import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../../src/game-runtime/orb/orb-base-state.js";
import {
  applyOrbGlobeVisualCssVars,
  buildOrbGlobeVisualState,
  getInnerGlobeDiameterPx,
  getPickupGlobeDiameterPx,
  getOrbitDistancePx,
  getOrbitGlobeRadiusPx,
} from "../../../../src/game-runtime/orb/orb-globe-base-state.js";

export function createOrbGlobePreview({ els, clamp, evenPx }) {
  let samples = [];

  function ensureSample(className) {
    const el = document.createElement("div");
    el.className = className;
    return el;
  }

  function clear() {
    for (const el of samples) {
      try { el.remove(); } catch (_) {}
    }
    samples = [];
    if (els.orbInterior) els.orbInterior.innerHTML = "";
  }

  function renderSamples(state) {
    clear();
    if (!els.orbInterior || !els.orbGlobePreviewLayer) return;

    const orbDiameter = Number(getComputedStyle(els.previewRoot).getPropertyValue("--orb-d").replace("px", "")) || 100;
    const orbRadius = orbDiameter * 0.5;
    const innerD = getInnerGlobeDiameterPx(orbRadius, state);
    const orbitR = getOrbitDistancePx(orbRadius, state);
    const orbitRadius = getOrbitGlobeRadiusPx(orbRadius, state);
    const pickupD = getPickupGlobeDiameterPx(orbRadius, state);

    const inner = ensureSample("innerGlobe");
    inner.style.width = `${innerD.toFixed(2)}px`;
    inner.style.height = `${innerD.toFixed(2)}px`;
    inner.style.left = `${(orbRadius - innerD * 0.5).toFixed(2)}px`;
    inner.style.top = `${(orbRadius - innerD * 0.5).toFixed(2)}px`;
    els.orbInterior.appendChild(inner);

    const orbit = ensureSample("orbitGlobe");
    const orbitD = orbitRadius * 2;
    orbit.style.width = `${orbitD.toFixed(2)}px`;
    orbit.style.height = `${orbitD.toFixed(2)}px`;
    orbit.style.left = `${(orbitR - orbitRadius).toFixed(2)}px`;
    orbit.style.top = `${(-orbitRadius).toFixed(2)}px`;
    els.orbGlobePreviewLayer.appendChild(orbit);

    const released = ensureSample("releasedGlobe");
    released.style.width = `${orbitD.toFixed(2)}px`;
    released.style.height = `${orbitD.toFixed(2)}px`;
    released.style.left = `${(-orbitRadius - 36).toFixed(2)}px`;
    released.style.top = `${(orbitRadius + 32).toFixed(2)}px`;
    els.orbGlobePreviewLayer.appendChild(released);

    const pickup = ensureSample("pickupGlobe");
    pickup.style.width = `${pickupD.toFixed(2)}px`;
    pickup.style.height = `${pickupD.toFixed(2)}px`;
    pickup.style.left = "50%";
    pickup.style.top = "22px";
    pickup.style.transform = "translate(-50%, 0)";
    els.orbGlobePreviewLayer.appendChild(pickup);

    samples = [orbit, released, pickup];
  }

  function apply() {
    const state = buildOrbGlobeVisualState({
      innerDiameterRatio: clamp(els.orbGlobeInnerDiameterRatio.value, 0.01, 1),
      orbitRadiusRatio: clamp(els.orbGlobeOrbitRadiusRatio.value, 0.01, 1),
      orbitDistanceOffsetPx: clamp(els.orbGlobeOrbitOffset.value, 0, 200),
      orbitDistanceRatio: clamp(els.orbGlobeOrbitDistanceRatio.value, 0.1, 3),
      orbitDistanceMinPx: clamp(els.orbGlobeOrbitDistanceMin.value, 0, 200),
      orbitRadiusMinPx: clamp(els.orbGlobeOrbitRadiusMin.value, 0, 100),
      pickupDiameterPx: evenPx(els.orbGlobePickupD.value, 2, 200),
      innerStrokeWidthPx: clamp(els.orbGlobeInnerStroke.value, 0, 12),
      releasedStrokeWidthPx: clamp(els.orbGlobeReleasedStroke.value, 0, 12),
      orbitStrokeWidthPx: clamp(els.orbGlobeOrbitStroke.value, 0, 12),
    });

    els.vOrbGlobeInnerDiameterRatio.textContent = state.innerDiameterRatio.toFixed(2);
    els.vOrbGlobeOrbitRadiusRatio.textContent = state.orbitRadiusRatio.toFixed(2);
    els.vOrbGlobeOrbitOffset.textContent = String(Math.round(state.orbitDistanceOffsetPx));
    els.vOrbGlobeOrbitDistanceRatio.textContent = state.orbitDistanceRatio.toFixed(2);
    els.vOrbGlobeOrbitDistanceMin.textContent = String(Math.round(state.orbitDistanceMinPx));
    els.vOrbGlobeOrbitRadiusMin.textContent = String(Math.round(state.orbitRadiusMinPx));
    els.vOrbGlobePickupD.textContent = String(Math.round(state.pickupDiameterPx));
    els.vOrbGlobeInnerStroke.textContent = String(Number(state.innerStrokeWidthPx).toFixed(1));
    els.vOrbGlobeReleasedStroke.textContent = String(Number(state.releasedStrokeWidthPx).toFixed(1));
    els.vOrbGlobeOrbitStroke.textContent = String(Number(state.orbitStrokeWidthPx).toFixed(1));

    const orbBaseVisualState = buildOrbBaseVisualState();
    applyOrbBaseVisualCssVars(orbBaseVisualState, {
      root: els.previewRoot,
    });
    applyOrbGlobeVisualCssVars(state, {
      root: els.previewRoot,
      orbRadiusPx: orbBaseVisualState.radiusPx,
    });
    renderSamples(state);
  }

  function wire() {
    if (els.previewOrbGlobe) els.previewOrbGlobe.addEventListener("click", apply);
    [
      els.orbGlobeInnerDiameterRatio,
      els.orbGlobeOrbitRadiusRatio,
      els.orbGlobeOrbitOffset,
      els.orbGlobeOrbitDistanceRatio,
      els.orbGlobeOrbitDistanceMin,
      els.orbGlobeOrbitRadiusMin,
      els.orbGlobePickupD,
      els.orbGlobeInnerStroke,
      els.orbGlobeReleasedStroke,
      els.orbGlobeOrbitStroke,
    ].forEach((el) => {
      if (el) el.addEventListener("input", apply);
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
