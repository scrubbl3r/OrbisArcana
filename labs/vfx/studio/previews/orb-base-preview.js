import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../../src/game-runtime/orb/orb-base-state.js";

export function createOrbBasePreview({ els, evenPx, clamp, clampByte }) {
  function apply() {
    const diameterPx = evenPx(els.orbBaseD.value, 2, 2000);
    const strokeWidthPx = evenPx(els.orbBaseStroke.value, 2, 40);
    const strokeAlpha = clamp(els.orbBaseStrokeAlpha.value, 0, 1);
    const fillAlpha = clamp(els.orbBaseFillAlpha.value, 0, 1);
    const strokeDefaultRgb = {
      r: clampByte(els.orbBaseStrokeR.value),
      g: clampByte(els.orbBaseStrokeG.value),
      b: clampByte(els.orbBaseStrokeB.value),
    };
    const fillDefaultRgb = {
      r: clampByte(els.orbBaseFillR.value),
      g: clampByte(els.orbBaseFillG.value),
      b: clampByte(els.orbBaseFillB.value),
    };

    els.orbBaseD.value = String(diameterPx);
    els.orbBaseStroke.value = String(strokeWidthPx);
    els.vOrbBaseD.textContent = String(diameterPx);
    els.vOrbBaseStroke.textContent = String(strokeWidthPx);
    els.vOrbBaseStrokeAlpha.textContent = strokeAlpha.toFixed(2);
    els.vOrbBaseFillAlpha.textContent = fillAlpha.toFixed(2);
    els.vOrbBaseStrokeR.textContent = String(strokeDefaultRgb.r);
    els.vOrbBaseStrokeG.textContent = String(strokeDefaultRgb.g);
    els.vOrbBaseStrokeB.textContent = String(strokeDefaultRgb.b);
    els.vOrbBaseFillR.textContent = String(fillDefaultRgb.r);
    els.vOrbBaseFillG.textContent = String(fillDefaultRgb.g);
    els.vOrbBaseFillB.textContent = String(fillDefaultRgb.b);

    applyOrbBaseVisualCssVars(buildOrbBaseVisualState({
      theme: {
        orb: {
          diameterPx,
          strokeWidthPx,
          strokeDefaultRgb,
          strokeAlpha,
          fillDefaultRgb,
          fillAlpha,
        },
      },
      physics: {
        orbRadiusPx: diameterPx * 0.5,
      },
    }));
  }

  function clear() {}

  function wire() {
    if (els.previewOrbBase) els.previewOrbBase.addEventListener("click", apply);
    [
      els.orbBaseD,
      els.orbBaseStroke,
      els.orbBaseStrokeAlpha,
      els.orbBaseFillAlpha,
      els.orbBaseStrokeR,
      els.orbBaseStrokeG,
      els.orbBaseStrokeB,
      els.orbBaseFillR,
      els.orbBaseFillG,
      els.orbBaseFillB,
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
