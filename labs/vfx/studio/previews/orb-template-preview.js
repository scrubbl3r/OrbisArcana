import { applyOrbBaseVisualCssVars } from "../../../../src/game-runtime/orb/orb-base-state.js";
import { resolveOrbLinkedPx } from "../../../../src/game-runtime/orb/orb-spell-geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function polarPoint(angle, radius) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function parseRgba(text) {
  const match = String(text || "").match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return { r: 255, g: 255, b: 255, a: 0.20 };
  }
  const parts = match[1].split(",").map((part) => Number(part.trim()));
  return {
    r: Number.isFinite(parts[0]) ? parts[0] : 255,
    g: Number.isFinite(parts[1]) ? parts[1] : 255,
    b: Number.isFinite(parts[2]) ? parts[2] : 255,
    a: Number.isFinite(parts[3]) ? parts[3] : 1,
  };
}

function buildWobblePath({
  baseRadius = 50,
  waveCount = 10,
  waveDepth = 0,
  samples = 96,
} = {}) {
  const count = Math.max(2, Math.round(Number(waveCount) || 10));
  const totalSamples = Math.max(24, Math.round(Number(samples) || 96));
  const points = [];
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / totalSamples;
    const angle = t * Math.PI * 2;
    const radius = baseRadius + (Math.sin(angle * count) * waveDepth);
    points.push(polarPoint(angle, radius));
  }
  if (!points.length) return "";
  let d = `M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x.toFixed(3)} ${points[i].y.toFixed(3)}`;
  }
  d += " Z";
  return d;
}

export function createOrbTemplatePreview({ els, getOrbBaseVisualState = null } = {}) {
  let raf = 0;
  let activeSvg = null;
  let activePath = null;

  function ensureOverlay() {
    if (activeSvg && activePath) return;
    if (!els || !els.previewRoot) return;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "-50 -50 100 100");
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "var(--orb-d)";
    svg.style.height = "var(--orb-d)";
    svg.style.transform = "translate(-50%,-50%)";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "visible";
    svg.style.display = "none";

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    els.previewRoot.appendChild(svg);

    activeSvg = svg;
    activePath = path;
  }

  function readOrbDiameterPx() {
    const root = els && els.previewRoot;
    const cssDiameter = root
      ? Number(getComputedStyle(root).getPropertyValue("--orb-d").replace("px", ""))
      : 0;
    return Math.max(2, cssDiameter || 100);
  }

  function readCssVars() {
    const root = els && els.previewRoot;
    const styles = root ? getComputedStyle(root) : null;
    return {
      strokeColor: styles ? styles.getPropertyValue("--orb-stroke-color").trim() || "rgba(255,255,255,1)" : "rgba(255,255,255,1)",
      fillColor: styles ? styles.getPropertyValue("--orb-fill").trim() || "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.20)",
      strokeWidth: styles ? Number(styles.getPropertyValue("--orb-stroke").replace("px", "")) || 2 : 2,
    };
  }

  function readConfig() {
    const orbDiameterPx = readOrbDiameterPx();
    return {
      shrinkPct: clampNumber(els && els.orbTemplateShrinkPct && els.orbTemplateShrinkPct.value, 0, 40, 8) / 100,
      durationMs: Math.round(clampNumber(els && els.orbTemplateDurationMs && els.orbTemplateDurationMs.value, 80, 3000, 500)),
      fillOpacityBoost: clampNumber(
        (els && els.orbTemplateFillOpacityBoost && els.orbTemplateFillOpacityBoost.value)
          ?? (els && els.orbTemplateBrightnessBoost && els.orbTemplateBrightnessBoost.value),
        0,
        100,
        24
      ) / 100,
      waveCount: Math.round(clampNumber(els && els.orbTemplateWaveCount && els.orbTemplateWaveCount.value, 2, 32, 10)),
      waveDepthPx: resolveOrbLinkedPx(
        clampNumber(els && els.orbTemplateWaveDepthPx && els.orbTemplateWaveDepthPx.value, 0, 32, 4),
        { orbDiameterPx, min: 0 }
      ),
      oscillationSpeedHz: clampNumber(els && els.orbTemplateOscillationSpeedHz && els.orbTemplateOscillationSpeedHz.value, 1, 40, 12),
      oscillationCount: Math.round(clampNumber(els && els.orbTemplateOscillationCount && els.orbTemplateOscillationCount.value, 1, 12, 4)),
    };
  }

  function hydrateFields(cfg) {
    if (!els) return;
    if (els.orbTemplateShrinkPct) els.orbTemplateShrinkPct.value = String(Math.round(cfg.shrinkPct * 100));
    if (els.orbTemplateDurationMs) els.orbTemplateDurationMs.value = String(cfg.durationMs);
    if (els.orbTemplateFillOpacityBoost) els.orbTemplateFillOpacityBoost.value = String(Math.round(cfg.fillOpacityBoost * 100));
    if (els.orbTemplateWaveCount) els.orbTemplateWaveCount.value = String(cfg.waveCount);
    if (els.orbTemplateWaveDepthPx) {
      const authored = clampNumber(els.orbTemplateWaveDepthPx.value, 0, 32, 4);
      els.orbTemplateWaveDepthPx.value = String(authored);
    }
    if (els.orbTemplateOscillationSpeedHz) els.orbTemplateOscillationSpeedHz.value = String(cfg.oscillationSpeedHz);
    if (els.orbTemplateOscillationCount) els.orbTemplateOscillationCount.value = String(cfg.oscillationCount);
  }

  function stopAnimation() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (activeSvg) activeSvg.style.display = "none";
    if (els && els.orb) {
      els.orb.hidden = false;
      els.orb.style.transform = "";
      els.orb.style.filter = "";
    }
  }

  function renderFrame(cfg, progress) {
    ensureOverlay();
    if (!activeSvg || !activePath || !els || !els.orb) return;
    const css = readCssVars();
    const fill = parseRgba(css.fillColor);
    const envelope = Math.sin(progress * Math.PI);
    const oscillationTime = progress * cfg.durationMs * 0.001;
    const standingOscillation = Math.sin(oscillationTime * Math.PI * 2 * cfg.oscillationSpeedHz);
    const signedWaveDepth = cfg.waveDepthPx * envelope * standingOscillation;
    const scale = 1 - (cfg.shrinkPct * envelope);
    const liftedFillAlpha = Math.min(1, fill.a + ((1 - fill.a) * cfg.fillOpacityBoost * envelope));

    els.orb.hidden = true;
    activeSvg.style.display = "";
    activePath.setAttribute("d", buildWobblePath({
      baseRadius: 50,
      waveCount: cfg.waveCount,
      waveDepth: signedWaveDepth,
    }));
    activePath.setAttribute("fill", `rgba(${Math.round(fill.r)}, ${Math.round(fill.g)}, ${Math.round(fill.b)}, ${liftedFillAlpha.toFixed(3)})`);
    activePath.setAttribute("stroke", css.strokeColor);
    activePath.setAttribute("stroke-width", String(css.strokeWidth));
    activeSvg.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(4)})`;
    activeSvg.style.filter = `drop-shadow(0 0 ${Math.max(2, Math.abs(signedWaveDepth) * 1.4).toFixed(2)}px ${css.strokeColor})`;
  }

  function apply() {
    if (!els || !els.previewRoot) return;
    if (typeof getOrbBaseVisualState === "function") {
      const orbBaseVisualState = getOrbBaseVisualState();
      if (orbBaseVisualState) {
        applyOrbBaseVisualCssVars(orbBaseVisualState, { root: els.previewRoot });
      }
    }
    const cfg = readConfig();
    hydrateFields(cfg);
    if (els.orb) {
      els.orb.hidden = false;
      els.orb.style.transform = "";
      els.orb.style.filter = "";
    }
    if (activeSvg) activeSvg.style.display = "none";
    return cfg;
  }

  function play() {
    const cfg = apply();
    if (!cfg) return;
    stopAnimation();
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.max(0, Math.min(1, elapsed / cfg.durationMs));
      renderFrame(cfg, progress);
      if (progress >= 1) {
        stopAnimation();
        apply();
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
  }

  function clear() {
    stopAnimation();
    apply();
  }

  function wire() {
    apply();
    if (els && els.previewOrbTemplate) els.previewOrbTemplate.addEventListener("click", play);
    if (els && els.orb) els.orb.addEventListener("click", play);
    [
      els && els.orbTemplateApplyShrinkBtn,
      els && els.orbTemplateApplyDurationBtn,
      els && els.orbTemplateApplyFillOpacityBtn,
      els && els.orbTemplateApplyWaveCountBtn,
      els && els.orbTemplateApplyWaveDepthBtn,
      els && els.orbTemplateApplyOscillationSpeedBtn,
      els && els.orbTemplateApplyOscillationCountBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
  }

  return {
    apply,
    clear,
    play,
    wire,
  };
}
