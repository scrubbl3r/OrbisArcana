import {
  applyOrbGlobeVisualCssVars,
  buildOrbGlobeVisualState,
  getPickupGlobeDiameterPx,
} from "../../../../src/game-runtime/orb/orb-globe-base-state.js";

export function createWorldGlobePreview({ els }) {
  let sample = null;
  let rafId = 0;

  function clear() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    try { if (sample) sample.remove(); } catch (_) {}
    sample = null;
  }

  function ensureSample() {
    if (sample && sample.isConnected) return sample;
    sample = document.createElement("div");
    sample.className = "pickupGlobe";
    if (els.worldGlobePreviewLayer) els.worldGlobePreviewLayer.appendChild(sample);
    return sample;
  }

  function apply() {
    clear();
    if (!els.previewRoot || !els.worldGlobePreviewLayer) return;
    const state = buildOrbGlobeVisualState();
    const orbDiameter = Number(getComputedStyle(els.previewRoot).getPropertyValue("--orb-d").replace("px", "")) || 100;
    const pickupD = getPickupGlobeDiameterPx(orbDiameter * 0.5, state);
    applyOrbGlobeVisualCssVars(state, {
      root: els.previewRoot,
      orbRadiusPx: orbDiameter * 0.5,
    });
    const el = ensureSample();
    el.style.width = `${pickupD.toFixed(2)}px`;
    el.style.height = `${pickupD.toFixed(2)}px`;
    el.style.left = "50%";
    el.style.top = "50%";
    el.style.transform = "translate(-50%, -50%)";
    el.style.display = "block";
    animate();
  }

  function animate() {
    if (!sample) return;
    const t = performance.now() / 1000;
    const bob = Math.sin(t * Math.PI * 2 * 0.65) * 7;
    const pulse = 1 + (Math.sin(t * Math.PI * 2 * 0.9) * 0.045);
    sample.style.transform = `translate(-50%, calc(-50% + ${bob.toFixed(2)}px)) scale(${pulse.toFixed(3)})`;
    rafId = requestAnimationFrame(animate);
  }

  function wire() {
    if (els.previewWorldGlobe) els.previewWorldGlobe.addEventListener("click", apply);
    apply();
  }

  return {
    apply,
    clear,
    play: apply,
    wire,
  };
}
