import {
  applyOrbFractureVisualCssVars,
  buildOrbFractureVisualState,
} from "../../../../src/game-runtime/orb/orb-fracture-base-state.js";

const SAMPLE_CRACKS = `
  <path d="M -38 -12 L -18 -8 L -3 -3 L 16 6 L 33 14" />
  <path d="M -9 -41 L -5 -22 L -2 -7 L 4 11 L 9 33" />
  <path d="M -27 26 L -13 12 L -1 2 L 13 -11 L 28 -24" />
`;

const SAMPLE_SHARDS = `
  <polygon class="orbShard" points="-18,-8 -7,-28 5,-7 -8,4" />
  <polygon class="orbShard" points="9,14 23,4 28,19 14,27" />
`;

export function createOrbFracturePreview({ els, clamp, evenPx }) {
  function renderSamples() {
    if (els.orbFractureLayer) {
      els.orbFractureLayer.innerHTML = SAMPLE_CRACKS;
    }
    if (els.orbShatterLayer) {
      els.orbShatterLayer.innerHTML = SAMPLE_SHARDS;
    }
  }

  function apply() {
    const crackStrokeWidthPx = clamp(els.orbFractureCrackStroke.value, 0.2, 20);
    const shardStrokeWidthPx = clamp(els.orbFractureShardStroke.value, 0.2, 20);
    const glowBlurPx = evenPx(els.orbFractureGlowBlur.value, 0, 40);
    const glowAlpha = clamp(els.orbFractureGlowAlpha.value, 0, 1);

    els.vOrbFractureCrackStroke.textContent = crackStrokeWidthPx.toFixed(1);
    els.vOrbFractureShardStroke.textContent = shardStrokeWidthPx.toFixed(1);
    els.vOrbFractureGlowBlur.textContent = String(glowBlurPx);
    els.vOrbFractureGlowAlpha.textContent = glowAlpha.toFixed(2);

    applyOrbFractureVisualCssVars(buildOrbFractureVisualState({
      crackStrokeWidthPx,
      shardStrokeWidthPx,
      glowBlurPx,
      glowAlpha,
    }));
    renderSamples();
  }

  function clear() {
    if (els.orbFractureLayer) els.orbFractureLayer.innerHTML = "";
    if (els.orbShatterLayer) els.orbShatterLayer.innerHTML = "";
  }

  function wire() {
    if (els.previewOrbFracture) els.previewOrbFracture.addEventListener("click", apply);
    [
      els.orbFractureCrackStroke,
      els.orbFractureShardStroke,
      els.orbFractureGlowBlur,
      els.orbFractureGlowAlpha,
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
