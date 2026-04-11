import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../../src/game-runtime/orb/orb-base-state.js";
import { createRng, makeVoronoiLayout } from "../../../../src/game-runtime/orb/orb-damage-visuals-runtime.js";
import { createOrbShatterRuntime } from "../../../../src/vfx/effects/orb-states/orb-shatter-runtime.js";

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

function buildStrokeColor(root) {
  return getComputedStyle(root).getPropertyValue("--orb-stroke-color").trim() || "rgba(255,255,255,1)";
}

function buildFillParts(root) {
  const fill = getComputedStyle(root).getPropertyValue("--orb-fill").trim();
  const match = fill.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return { fillRgb: "rgb(255,255,255)", fillAlpha: 0.20 };
  }
  const parts = match[1].split(",").map((part) => part.trim());
  const r = parts[0] || "255";
  const g = parts[1] || "255";
  const b = parts[2] || "255";
  const a = parts[3] != null ? Number(parts[3]) : 0.20;
  return {
    fillRgb: `rgb(${r}, ${g}, ${b})`,
    fillAlpha: Number.isFinite(a) ? a : 0.20,
  };
}

export function createOrbTemplatePreview({ els } = {}) {
  let currentSeed = 1001;
  let currentShardTotal = 16;
  let currentHitTotal = 3;
  let currentHits = 0;
  let currentLayout = null;
  const shatterRuntime = createOrbShatterRuntime({
    layerEl: els && els.orbShatterLayer,
  });

  function clearPatternLayer() {
    if (els && els.orbTemplatePatternLayer) {
      els.orbTemplatePatternLayer.innerHTML = "";
    }
  }

  function updateStatus() {
    if (els && els.orbTemplateStatus) {
      els.orbTemplateStatus.value = `Hits ${currentHits} / ${currentHitTotal}`;
    }
  }

  function getActiveShardCount() {
    if (currentHits <= 0) return 0;
    return Math.max(2, Math.min(
      currentShardTotal,
      Math.round((currentHits / Math.max(1, currentHitTotal)) * currentShardTotal)
    ));
  }

  function renderPattern() {
    if (!els || !els.previewRoot || !els.orbTemplatePatternLayer || !els.orb) return;

    applyOrbBaseVisualCssVars(buildOrbBaseVisualState(), { root: els.previewRoot });

    if (!currentLayout) {
      clearPatternLayer();
      els.orb.hidden = false;
      updateStatus();
      return;
    }

    const stroke = buildStrokeColor(els.previewRoot);
    const edgeMarkup = (currentLayout && currentLayout.edges || [])
      .map((edge) => (
        `<line x1="${edge.a.x.toFixed(3)}" y1="${edge.a.y.toFixed(3)}" x2="${edge.b.x.toFixed(3)}" y2="${edge.b.y.toFixed(3)}" />`
      )).join("");

    els.orbTemplatePatternLayer.setAttribute("fill", "none");
    els.orbTemplatePatternLayer.setAttribute("stroke", stroke);
    els.orbTemplatePatternLayer.setAttribute("stroke-width", "1");
    els.orbTemplatePatternLayer.setAttribute("vector-effect", "non-scaling-stroke");
    els.orbTemplatePatternLayer.innerHTML = edgeMarkup;
    els.orb.hidden = currentHits >= currentHitTotal;
    updateStatus();
  }

  function rebuildLayout({ nextSeed = null, resetHits = true } = {}) {
    currentSeed = nextSeed == null ? currentSeed : nextSeed;
    if (resetHits) currentHits = 0;
    const activeShardCount = getActiveShardCount();
    currentLayout = activeShardCount > 0 ? makeVoronoiLayout(currentSeed, activeShardCount) : null;
    shatterRuntime.clear();
    renderPattern();
  }

  function applyShardTotal() {
    currentShardTotal = clampInt(els.orbTemplateShardTotal && els.orbTemplateShardTotal.value, 3, 64, currentShardTotal);
    if (els.orbTemplateShardTotal) els.orbTemplateShardTotal.value = String(currentShardTotal);
    rebuildLayout();
  }

  function applyHitTotal() {
    currentHitTotal = clampInt(els.orbTemplateHitTotal && els.orbTemplateHitTotal.value, 1, 12, currentHitTotal);
    if (els.orbTemplateHitTotal) els.orbTemplateHitTotal.value = String(currentHitTotal);
    currentHits = Math.min(currentHits, currentHitTotal);
    rebuildLayout({ resetHits: false });
  }

  function explode() {
    if (!currentLayout) return;
    shatterRuntime.clear();
    clearPatternLayer();
    const strokeRgb = buildStrokeColor(els.previewRoot);
    const fillParts = buildFillParts(els.previewRoot);
    const rng = createRng(currentSeed ^ 0x9e3779b9);

    for (const cell of currentLayout.cells) {
      const mag = Math.hypot(cell.center.x, cell.center.y) || 1;
      const nx = cell.center.x / mag;
      const ny = cell.center.y / mag;
      shatterRuntime.spawnPiece({
        pieceId: cell.id,
        points: cell.poly,
        center: cell.center,
        vx: nx * (120 + (rng() * 120)),
        vy: ny * (120 + (rng() * 120)) - (20 + (rng() * 30)),
        angVel: (rng() - 0.5) * 8,
        ttlMs: 900 + Math.round(rng() * 500),
      }, {
        strokeRgb,
        fillRgb: fillParts.fillRgb,
        fillAlpha: fillParts.fillAlpha,
      });
    }
  }

  function hit() {
    currentHits = Math.min(currentHitTotal, currentHits + 1);
    rebuildLayout({ resetHits: false });
    if (currentHits >= currentHitTotal) {
      explode();
    }
  }

  function heal() {
    if (currentHits <= 0) return;
    if (currentHits >= currentHitTotal) {
      shatterRuntime.clear();
    }
    currentHits = Math.max(0, currentHits - 1);
    rebuildLayout({ resetHits: false });
  }

  function regenerate() {
    const nextSeed = ((Math.random() * 1e9) | 0) || 1;
    rebuildLayout({ nextSeed, resetHits: true });
  }

  function clear() {
    shatterRuntime.clear();
    clearPatternLayer();
    if (els && els.orb) {
      els.orb.hidden = false;
    }
  }

  function apply() {
    currentShardTotal = clampInt(els.orbTemplateShardTotal && els.orbTemplateShardTotal.value, 3, 64, currentShardTotal);
    currentHitTotal = clampInt(els.orbTemplateHitTotal && els.orbTemplateHitTotal.value, 1, 12, currentHitTotal);
    if (els.orbTemplateShardTotal) els.orbTemplateShardTotal.value = String(currentShardTotal);
    if (els.orbTemplateHitTotal) els.orbTemplateHitTotal.value = String(currentHitTotal);
    currentHits = Math.min(currentHits, currentHitTotal);
    rebuildLayout({ resetHits: false });
  }

  function wire() {
    if (els.orbTemplateApplyShardTotalBtn) els.orbTemplateApplyShardTotalBtn.addEventListener("click", applyShardTotal);
    if (els.orbTemplateApplyHitTotalBtn) els.orbTemplateApplyHitTotalBtn.addEventListener("click", applyHitTotal);
    if (els.orbTemplateHitBtn) els.orbTemplateHitBtn.addEventListener("click", hit);
    if (els.orbTemplateHealBtn) els.orbTemplateHealBtn.addEventListener("click", heal);
    if (els.orbTemplateRegenerateBtn) els.orbTemplateRegenerateBtn.addEventListener("click", regenerate);
    rebuildLayout();
  }

  return {
    apply,
    clear,
    play: apply,
    wire,
  };
}
