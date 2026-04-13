import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../../src/game-runtime/orb/orb-base-state.js";

export function createOrbTemplatePreview({ els } = {}) {
  function apply() {
    if (!els || !els.previewRoot) return;
    applyOrbBaseVisualCssVars(buildOrbBaseVisualState(), { root: els.previewRoot });
    if (els.orb) {
      els.orb.hidden = false;
    }
  }

  function clear() {
    if (els && els.orb) {
      els.orb.hidden = false;
    }
  }

  function wire() {
    apply();
  }

  return {
    apply,
    clear,
    play: apply,
    wire,
  };
}
