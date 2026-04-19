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
    els.orbBaseStrokeAlpha.value = strokeAlpha.toFixed(2);
    els.orbBaseFillAlpha.value = fillAlpha.toFixed(2);
    els.orbBaseStrokeR.value = String(strokeDefaultRgb.r);
    els.orbBaseStrokeG.value = String(strokeDefaultRgb.g);
    els.orbBaseStrokeB.value = String(strokeDefaultRgb.b);
    els.orbBaseFillR.value = String(fillDefaultRgb.r);
    els.orbBaseFillG.value = String(fillDefaultRgb.g);
    els.orbBaseFillB.value = String(fillDefaultRgb.b);

    const visualState = buildOrbBaseVisualState({
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
    });

    applyOrbBaseVisualCssVars(visualState, { root: els.previewRoot });
    if (typeof els.onApply === "function") {
      els.onApply(visualState);
    }
  }

  function clear() {}

  function wire() {
    if (els.previewOrbBase) els.previewOrbBase.addEventListener("click", apply);
    [
      els.orbBaseApplyDiameterBtn,
      els.orbBaseApplyStrokeBtn,
      els.orbBaseApplyStrokeColorBtn,
      els.orbBaseApplyFillColorBtn,
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
