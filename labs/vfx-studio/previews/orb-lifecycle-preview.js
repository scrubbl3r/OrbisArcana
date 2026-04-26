import {
  ORB_BASE_SCALE_REFERENCE_DIAMETER_PX,
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../src/game-runtime/orb/orb-base-state.js";
import {
  createRng,
  makeVoronoiLayout,
} from "../../../src/game-runtime/orb/orb-lifecycle-vfx-runtime.js";
import { createOrbShatterRuntime } from "../../../src/vfx/effects/orb-states/orb-shatter-runtime.js";

const AUTHORING_ORB_RADIUS_PX = ORB_BASE_SCALE_REFERENCE_DIAMETER_PX * 0.5;

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
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

export function createOrbLifecyclePreview({ els } = {}) {
  let currentSeed = 1001;
  let currentShardTotal = 16;
  let currentHitTotal = 3;
  let currentHits = 0;
  let currentLayout = null;
  const shatterRuntime = createOrbShatterRuntime({
    layerEl: els && els.orbShatterLayer,
  });

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    const safe = Number.isFinite(n) ? n : fallback;
    return Math.max(min, Math.min(max, safe));
  }

  function readShardStyle() {
    const style = {
      strokeRgb: {
        r: Math.round(clampNumber(els.orbLifecycleShardR && els.orbLifecycleShardR.value, 0, 255, 255)),
        g: Math.round(clampNumber(els.orbLifecycleShardG && els.orbLifecycleShardG.value, 0, 255, 255)),
        b: Math.round(clampNumber(els.orbLifecycleShardB && els.orbLifecycleShardB.value, 0, 255, 255)),
      },
      strokeAlpha: clampNumber(els.orbLifecycleShardA && els.orbLifecycleShardA.value, 0, 1, 0.46),
      strokeWidthPx: clampNumber(els.orbLifecycleShardStroke && els.orbLifecycleShardStroke.value, 0.25, 12, 1),
    };
    if (els.orbLifecycleShardR) els.orbLifecycleShardR.value = String(style.strokeRgb.r);
    if (els.orbLifecycleShardG) els.orbLifecycleShardG.value = String(style.strokeRgb.g);
    if (els.orbLifecycleShardB) els.orbLifecycleShardB.value = String(style.strokeRgb.b);
    if (els.orbLifecycleShardA) els.orbLifecycleShardA.value = style.strokeAlpha.toFixed(2);
    if (els.orbLifecycleShardStroke) els.orbLifecycleShardStroke.value = style.strokeWidthPx.toFixed(2);
    return style;
  }

  function clearPatternLayer() {
    if (els && els.orbLifecyclePatternLayer) {
      els.orbLifecyclePatternLayer.innerHTML = "";
    }
  }

  function updateStatus() {
    if (els && els.orbLifecycleStatus) {
      els.orbLifecycleStatus.value = `Hits ${currentHits} / ${currentHitTotal}`;
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
    if (!els || !els.previewRoot || !els.orbLifecyclePatternLayer || !els.orb) return;

    applyOrbBaseVisualCssVars(buildOrbBaseVisualState(), { root: els.previewRoot });

    if (!currentLayout) {
      clearPatternLayer();
      els.orb.hidden = false;
      updateStatus();
      return;
    }

    const shardStyle = readShardStyle();
    const stroke = `rgb(${shardStyle.strokeRgb.r},${shardStyle.strokeRgb.g},${shardStyle.strokeRgb.b})`;
    const edgeMarkup = (currentLayout && currentLayout.edges || [])
      .map((edge) => (
        `<line x1="${edge.a.x.toFixed(3)}" y1="${edge.a.y.toFixed(3)}" x2="${edge.b.x.toFixed(3)}" y2="${edge.b.y.toFixed(3)}" />`
      )).join("");

    els.orbLifecyclePatternLayer.setAttribute("fill", "none");
    els.orbLifecyclePatternLayer.setAttribute("stroke", stroke);
    els.orbLifecyclePatternLayer.setAttribute("stroke-width", String(shardStyle.strokeWidthPx));
    els.orbLifecyclePatternLayer.setAttribute("stroke-opacity", String(shardStyle.strokeAlpha.toFixed(3)));
    els.orbLifecyclePatternLayer.setAttribute("vector-effect", "non-scaling-stroke");
    els.orbLifecyclePatternLayer.innerHTML = edgeMarkup;
    els.orb.hidden = currentHits >= currentHitTotal;
    updateStatus();
  }

  function rebuildLayout({ nextSeed = null, resetHits = true } = {}) {
    currentSeed = nextSeed == null ? currentSeed : nextSeed;
    if (resetHits) currentHits = 0;
    const activeShardCount = getActiveShardCount();
    currentLayout = activeShardCount > 0
      ? makeVoronoiLayout(currentSeed, activeShardCount, {
          // Lifecycle authoring lives in normalized orb space. The preview lane
          // already scales the whole orb via `--orb-d`, so the fracture map
          // should stay in canonical -50..50 coordinates here.
          orbRadiusPx: AUTHORING_ORB_RADIUS_PX,
        })
      : null;
    shatterRuntime.clear();
    renderPattern();
  }

  function applyShardTotal() {
    currentShardTotal = clampInt(els.orbLifecycleShardTotal && els.orbLifecycleShardTotal.value, 3, 64, currentShardTotal);
    if (els.orbLifecycleShardTotal) els.orbLifecycleShardTotal.value = String(currentShardTotal);
    rebuildLayout();
  }

  function applyHitTotal() {
    currentHitTotal = clampInt(els.orbLifecycleHitTotal && els.orbLifecycleHitTotal.value, 1, 12, currentHitTotal);
    if (els.orbLifecycleHitTotal) els.orbLifecycleHitTotal.value = String(currentHitTotal);
    currentHits = Math.min(currentHits, currentHitTotal);
    rebuildLayout({ resetHits: false });
  }

  function explode() {
    if (!currentLayout) return;
    shatterRuntime.clear();
    clearPatternLayer();
    const shardStyle = readShardStyle();
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
        strokeRgb: `rgb(${shardStyle.strokeRgb.r},${shardStyle.strokeRgb.g},${shardStyle.strokeRgb.b})`,
        strokeAlpha: shardStyle.strokeAlpha,
        strokeWidthPx: shardStyle.strokeWidthPx,
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
    updateStatus();
  }

  function apply() {
    currentShardTotal = clampInt(els.orbLifecycleShardTotal && els.orbLifecycleShardTotal.value, 3, 64, currentShardTotal);
    currentHitTotal = clampInt(els.orbLifecycleHitTotal && els.orbLifecycleHitTotal.value, 1, 12, currentHitTotal);
    if (els.orbLifecycleShardTotal) els.orbLifecycleShardTotal.value = String(currentShardTotal);
    if (els.orbLifecycleHitTotal) els.orbLifecycleHitTotal.value = String(currentHitTotal);
    currentHits = Math.min(currentHits, currentHitTotal);
    rebuildLayout({ resetHits: false });
  }

  function wire() {
    if (els.orbLifecycleApplyShardTotalBtn) els.orbLifecycleApplyShardTotalBtn.addEventListener("click", applyShardTotal);
    if (els.orbLifecycleApplyHitTotalBtn) els.orbLifecycleApplyHitTotalBtn.addEventListener("click", applyHitTotal);
    if (els.orbLifecycleApplyShardColorBtn) els.orbLifecycleApplyShardColorBtn.addEventListener("click", apply);
    if (els.orbLifecycleApplyShardStrokeBtn) els.orbLifecycleApplyShardStrokeBtn.addEventListener("click", apply);
    if (els.orbLifecycleHitBtn) els.orbLifecycleHitBtn.addEventListener("click", hit);
    if (els.orbLifecycleHealBtn) els.orbLifecycleHealBtn.addEventListener("click", heal);
    if (els.orbLifecycleRegenerateBtn) els.orbLifecycleRegenerateBtn.addEventListener("click", regenerate);
    rebuildLayout();
  }

  return {
    apply,
    clear,
    play: apply,
    wire,
  };
}
