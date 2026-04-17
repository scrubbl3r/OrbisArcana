import {
  buildWorldGlobeVisualState,
  rgbaFromWorldGlobeColor,
} from "../../../../src/game-runtime/world/world-globe-state.js?v=20260417a";

export function createWorldGlobePreview({ els, clamp }) {
  let samples = [];
  let rafId = 0;
  const field = (name) => els[name] || document.getElementById(name);

  function clear() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    for (const sample of samples) {
      try { sample.remove(); } catch (_) {}
    }
    samples = [];
  }

  function readRgb(prefix) {
    return {
      r: clamp(field(`${prefix}FillR`) && field(`${prefix}FillR`).value, 0, 255),
      g: clamp(field(`${prefix}FillG`) && field(`${prefix}FillG`).value, 0, 255),
      b: clamp(field(`${prefix}FillB`) && field(`${prefix}FillB`).value, 0, 255),
    };
  }

  function readStrokeRgb(prefix) {
    return {
      r: clamp(field(`${prefix}StrokeR`) && field(`${prefix}StrokeR`).value, 0, 255),
      g: clamp(field(`${prefix}StrokeG`) && field(`${prefix}StrokeG`).value, 0, 255),
      b: clamp(field(`${prefix}StrokeB`) && field(`${prefix}StrokeB`).value, 0, 255),
    };
  }

  function readStyle(prefix) {
    return {
      diameterPx: clamp(field(`${prefix}Size`) && field(`${prefix}Size`).value, 1, 400),
      fillRgb: readRgb(prefix),
      fillAlpha: clamp(field(`${prefix}FillAlpha`) && field(`${prefix}FillAlpha`).value, 0, 1),
      strokeRgb: readStrokeRgb(prefix),
      strokeAlpha: clamp(field(`${prefix}StrokeAlpha`) && field(`${prefix}StrokeAlpha`).value, 0, 1),
      strokeWidthPx: clamp(field(`${prefix}StrokeWidth`) && field(`${prefix}StrokeWidth`).value, 0, 40),
    };
  }

  function readState() {
    return buildWorldGlobeVisualState({
      idle: {
        ...readStyle("worldGlobeIdle"),
        driftPx: clamp(field("worldGlobeIdleDrift") && field("worldGlobeIdleDrift").value, 0, 200),
        bobPx: clamp(field("worldGlobeIdleBob") && field("worldGlobeIdleBob").value, 0, 200),
        bobHz: clamp(field("worldGlobeIdleBobHz") && field("worldGlobeIdleBobHz").value, 0, 20),
        pulseScale: clamp(field("worldGlobeIdlePulseScale") && field("worldGlobeIdlePulseScale").value, 0, 1),
        pulseHz: clamp(field("worldGlobeIdlePulseHz") && field("worldGlobeIdlePulseHz").value, 0, 20),
      },
      collected: readStyle("worldGlobeCollected"),
      consumed: readStyle("worldGlobeConsumed"),
    });
  }

  function createSample(className, label) {
    const wrap = document.createElement("div");
    wrap.className = "worldGlobeSample";
    const globe = document.createElement("div");
    globe.className = className;
    const caption = document.createElement("div");
    caption.className = "worldGlobeSampleLabel";
    caption.textContent = label;
    wrap.appendChild(globe);
    wrap.appendChild(caption);
    if (els.worldGlobePreviewLayer) els.worldGlobePreviewLayer.appendChild(wrap);
    samples.push(wrap);
    return globe;
  }

  function styleGlobe(el, state) {
    el.style.width = `${Number(state.diameterPx).toFixed(2)}px`;
    el.style.height = `${Number(state.diameterPx).toFixed(2)}px`;
    el.style.border = `${Number(state.strokeWidthPx).toFixed(2)}px solid ${rgbaFromWorldGlobeColor(state.strokeRgb, state.strokeAlpha)}`;
    el.style.background = rgbaFromWorldGlobeColor(state.fillRgb, state.fillAlpha);
  }

  function apply() {
    clear();
    if (!els.previewRoot || !els.worldGlobePreviewLayer) return;
    const state = readState();
    const idle = createSample("pickupGlobe worldGlobeIdleSample", "Idle");
    const collected = createSample("orbitGlobe worldGlobeCollectedSample", "Collected");
    const consumed = createSample("innerGlobe worldGlobeConsumedSample", "Consumed");
    styleGlobe(idle, state.idle);
    styleGlobe(collected, state.collected);
    styleGlobe(consumed, state.consumed);

    function animate() {
      const t = performance.now() / 1000;
      const bob = Math.sin(t * Math.PI * 2 * state.idle.bobHz) * state.idle.bobPx;
      const drift = Math.sin((t * Math.PI * 2 * 0.23) + 0.5) * state.idle.driftPx;
      const pulse = 1 + (Math.sin(t * Math.PI * 2 * state.idle.pulseHz) * state.idle.pulseScale);
      idle.style.transform = `translate(${drift.toFixed(2)}px, ${bob.toFixed(2)}px) scale(${pulse.toFixed(3)})`;
      rafId = requestAnimationFrame(animate);
    }
    animate();
  }

  function wire() {
    if (els.previewWorldGlobe) els.previewWorldGlobe.addEventListener("click", apply);
    [
      "IdleSize", "IdleFillR", "IdleFillG", "IdleFillB", "IdleFillAlpha",
      "IdleStrokeR", "IdleStrokeG", "IdleStrokeB", "IdleStrokeAlpha", "IdleStrokeWidth",
      "IdleDrift", "IdleBob", "IdleBobHz", "IdlePulseScale", "IdlePulseHz",
      "CollectedSize", "CollectedFillR", "CollectedFillG", "CollectedFillB", "CollectedFillAlpha",
      "CollectedStrokeR", "CollectedStrokeG", "CollectedStrokeB", "CollectedStrokeAlpha", "CollectedStrokeWidth",
      "ConsumedSize", "ConsumedFillR", "ConsumedFillG", "ConsumedFillB", "ConsumedFillAlpha",
      "ConsumedStrokeR", "ConsumedStrokeG", "ConsumedStrokeB", "ConsumedStrokeAlpha", "ConsumedStrokeWidth",
    ].forEach((suffix) => {
      const btn = field(`worldGlobeApply${suffix}Btn`);
      if (btn) btn.addEventListener("click", apply);
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
