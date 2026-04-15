import { resolveOrbLinkedPx } from "../../../game-runtime/orb/orb-spell-geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseRgba(text, fallbackAlpha = 0.2) {
  const match = String(text || "").match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return { r: 255, g: 255, b: 255, a: fallbackAlpha };
  }
  const parts = match[1].split(",").map((part) => Number(part.trim()));
  return {
    r: Number.isFinite(parts[0]) ? parts[0] : 255,
    g: Number.isFinite(parts[1]) ? parts[1] : 255,
    b: Number.isFinite(parts[2]) ? parts[2] : 255,
    a: Number.isFinite(parts[3]) ? parts[3] : fallbackAlpha,
  };
}

function polarPoint(angle, radius) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
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

function readCurrentFillAlpha(orbEl) {
  if (!orbEl || typeof getComputedStyle !== "function") return 0.2;
  const styles = getComputedStyle(orbEl);
  return parseRgba(styles.backgroundColor || styles.background || "", 0.2).a;
}

export function createOrbNodRuntime({
  orbEl = null,
  mountEl = null,
  orbInteriorEl = null,
  orbCracksEl = null,
  orbShardsEl = null,
  getOrbDiameterPx = () => 100,
  getConfig = () => ({}),
} = {}) {
  if (!orbEl || !mountEl) return null;

  let raf = 0;
  let startMs = 0;
  let activeSvg = null;
  let activePath = null;
  let lastConfig = null;

  function ensureOverlay() {
    if (activeSvg && activePath) return;
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
    svg.style.zIndex = "5";

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    mountEl.appendChild(svg);

    activeSvg = svg;
    activePath = path;
  }

  function normalizeConfig(raw = {}) {
    const orbDiameterPx = Math.max(2, Number(getOrbDiameterPx()) || 100);
    const baseFillAlpha = readCurrentFillAlpha(orbEl);
    return {
      shrinkPct: clampNumber(raw.shrinkPct ?? raw.orbTemplateShrinkPct, 0, 40, 6) / 100,
      durationMs: Math.round(clampNumber(raw.durationMs ?? raw.orbTemplateDurationMs, 80, 3000, 500)),
      fillAlpha: clampNumber(raw.fillAlpha ?? raw.orbTemplateFillAlpha, 0, 1, baseFillAlpha),
      waveCount: Math.round(clampNumber(raw.waveCount ?? raw.orbTemplateWaveCount, 2, 32, 10)),
      waveDepthPx: resolveOrbLinkedPx(
        clampNumber(raw.waveDepthPx ?? raw.orbTemplateWaveDepthPx, 0, 32, 4),
        { orbDiameterPx, min: 0 }
      ),
      oscillationSpeedHz: clampNumber(raw.oscillationSpeedHz ?? raw.orbTemplateOscillationSpeedHz, 1, 40, 12),
      oscillationCount: Math.round(clampNumber(raw.oscillationCount ?? raw.orbTemplateOscillationCount, 1, 12, 4)),
      baseFillAlpha,
    };
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    startMs = 0;
    if (activeSvg) activeSvg.style.display = "none";
    orbEl.hidden = false;
    orbEl.style.transform = "";
    orbEl.style.filter = "";
    if (orbInteriorEl) orbInteriorEl.style.visibility = "";
    if (orbCracksEl) orbCracksEl.style.visibility = "";
    if (orbShardsEl) orbShardsEl.style.visibility = "";
  }

  function render(nowMs) {
    if (!lastConfig || !activeSvg || !activePath) return;
    const elapsedMs = Math.max(0, nowMs - startMs);
    const progress = Math.max(0, Math.min(1, elapsedMs / lastConfig.durationMs));
    const envelope = Math.sin(progress * Math.PI);
    const oscillationWindowMs = Math.min(
      lastConfig.durationMs,
      (lastConfig.oscillationCount / Math.max(0.001, lastConfig.oscillationSpeedHz)) * 1000
    );
    const oscillationElapsedMs = Math.min(elapsedMs, oscillationWindowMs);
    const standingOscillation = Math.sin(
      (oscillationElapsedMs * 0.001) * Math.PI * 2 * lastConfig.oscillationSpeedHz
    );
    const signedWaveDepth = lastConfig.waveDepthPx * envelope * standingOscillation;
    const scale = 1 - (lastConfig.shrinkPct * envelope);
    const fill = parseRgba(getComputedStyle(orbEl).backgroundColor || "", lastConfig.baseFillAlpha);
    const animatedFillAlpha = lastConfig.baseFillAlpha + ((lastConfig.fillAlpha - lastConfig.baseFillAlpha) * envelope);
    const strokeColor = getComputedStyle(orbEl).getPropertyValue("--orb-stroke-color").trim()
      || getComputedStyle(orbEl).borderColor
      || "rgba(255,255,255,1)";
    const strokeWidth = Number(
      getComputedStyle(orbEl).getPropertyValue("--orb-stroke").replace("px", "")
    ) || 2;

    orbEl.hidden = true;
    if (orbInteriorEl) orbInteriorEl.style.visibility = "hidden";
    if (orbCracksEl) orbCracksEl.style.visibility = "hidden";
    if (orbShardsEl) orbShardsEl.style.visibility = "hidden";
    activeSvg.style.display = "";
    activePath.setAttribute("d", buildWobblePath({
      baseRadius: 50,
      waveCount: lastConfig.waveCount,
      waveDepth: signedWaveDepth,
    }));
    activePath.setAttribute(
      "fill",
      `rgba(${Math.round(fill.r)}, ${Math.round(fill.g)}, ${Math.round(fill.b)}, ${animatedFillAlpha.toFixed(3)})`
    );
    activePath.setAttribute("stroke", strokeColor);
    activePath.setAttribute("stroke-width", String(strokeWidth));
    activeSvg.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(4)})`;
    activeSvg.style.filter = `drop-shadow(0 0 ${Math.max(2, Math.abs(signedWaveDepth) * 1.4).toFixed(2)}px ${strokeColor})`;

    if (progress >= 1) {
      stop();
      return;
    }
    raf = requestAnimationFrame(render);
  }

  function play(payload = {}) {
    ensureOverlay();
    stop();
    lastConfig = normalizeConfig({
      ...(typeof getConfig === "function" ? (getConfig() || {}) : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    startMs = performance.now();
    raf = requestAnimationFrame(render);
    return { handled: true };
  }

  function clear() {
    stop();
  }

  function destroy() {
    stop();
    try {
      if (activeSvg) activeSvg.remove();
    } catch (_) {}
    activeSvg = null;
    activePath = null;
  }

  function getState() {
    return Object.freeze({
      running: !!raf,
      config: lastConfig ? { ...lastConfig } : null,
    });
  }

  return {
    play,
    clear,
    destroy,
    getState,
  };
}
