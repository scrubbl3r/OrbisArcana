import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../../src/game-runtime/orb/orb-base-state.js";
import { makeVoronoiLayout } from "../../../../src/game-runtime/orb/orb-damage-visuals-runtime.js";

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

export function createOrbTemplatePreview({ els } = {}) {
  let currentSeed = 1001;
  let currentPieceCount = 16;

  function renderPattern() {
    if (!els || !els.previewRoot || !els.orbTemplatePatternLayer) return;

    applyOrbBaseVisualCssVars(buildOrbBaseVisualState(), { root: els.previewRoot });

    currentSeed = clampInt(els.orbTemplateSeed && els.orbTemplateSeed.value, 1, 999999999, currentSeed);
    currentPieceCount = clampInt(els.orbTemplateShatterCount && els.orbTemplateShatterCount.value, 3, 64, currentPieceCount);

    if (els.orbTemplateSeed) els.orbTemplateSeed.value = String(currentSeed);
    if (els.orbTemplateShatterCount) els.orbTemplateShatterCount.value = String(currentPieceCount);

    const layout = makeVoronoiLayout(currentSeed, currentPieceCount);
    const stroke = getComputedStyle(els.previewRoot).getPropertyValue("--orb-stroke-color").trim() || "rgba(255,255,255,1)";
    const edgeMarkup = layout.edges.map((edge) => (
      `<line x1="${edge.a.x.toFixed(3)}" y1="${edge.a.y.toFixed(3)}" x2="${edge.b.x.toFixed(3)}" y2="${edge.b.y.toFixed(3)}" />`
    )).join("");

    els.orbTemplatePatternLayer.setAttribute("fill", "none");
    els.orbTemplatePatternLayer.setAttribute("stroke", stroke);
    els.orbTemplatePatternLayer.setAttribute("stroke-width", "1");
    els.orbTemplatePatternLayer.setAttribute("vector-effect", "non-scaling-stroke");
    els.orbTemplatePatternLayer.innerHTML = edgeMarkup;
  }

  function applySeed() {
    renderPattern();
  }

  function randomizeSeed() {
    currentSeed = ((Math.random() * 1e9) | 0) || 1;
    if (els.orbTemplateSeed) els.orbTemplateSeed.value = String(currentSeed);
    renderPattern();
  }

  function applyShatterCount() {
    renderPattern();
  }

  function clear() {
    if (els && els.orbTemplatePatternLayer) {
      els.orbTemplatePatternLayer.innerHTML = "";
    }
  }

  function wire() {
    if (els.orbTemplateApplySeedBtn) els.orbTemplateApplySeedBtn.addEventListener("click", applySeed);
    if (els.orbTemplateRandomizeSeedBtn) els.orbTemplateRandomizeSeedBtn.addEventListener("click", randomizeSeed);
    if (els.orbTemplateApplyShatterCountBtn) els.orbTemplateApplyShatterCountBtn.addEventListener("click", applyShatterCount);
    renderPattern();
  }

  return {
    apply: renderPattern,
    clear,
    play: renderPattern,
    wire,
  };
}
