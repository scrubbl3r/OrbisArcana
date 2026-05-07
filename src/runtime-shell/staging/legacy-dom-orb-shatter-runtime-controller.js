import {
  ORB_LIFECYCLE_SHARD_STYLE_DEFAULT,
} from "../../game-runtime/orb/orb-lifecycle-vfx-runtime.js?v=20260418b";

function defaultClamp01(v) {
  const n = Number(v);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function defaultClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Number(v) || 0));
}

function parseRgbLike(colorText, { clamp = defaultClamp, clamp01 = defaultClamp01 } = {}) {
  const text = String(colorText || "").trim();
  const m = text.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i);
  if (!m) return null;
  return {
    r: clamp(Math.round(Number(m[1]) || 0), 0, 255),
    g: clamp(Math.round(Number(m[2]) || 0), 0, 255),
    b: clamp(Math.round(Number(m[3]) || 0), 0, 255),
    a: clamp01(m[4] == null ? 1 : Number(m[4])),
  };
}

function colorPart(value, fallback, clamp = defaultClamp) {
  const n = Math.round(Number(value));
  return clamp(Number.isFinite(n) ? n : fallback, 0, 255);
}

export function createLegacyDomOrbShatterRuntimeController({
  root = globalThis.document && globalThis.document.documentElement,
  getOrbEl,
  getOrbShatterRuntime,
  getOrbColorState,
  getBaseFillAlpha,
  clamp = defaultClamp,
  clamp01 = defaultClamp01,
} = {}) {
  let shardPaletteSnapshot = null;

  function captureCurrentOrbPalette() {
    if (!root || typeof getComputedStyle !== "function") return null;
    const orbEl = typeof getOrbEl === "function" ? getOrbEl() : null;
    const rootStyle = getComputedStyle(root);
    const orbStyle = orbEl ? getComputedStyle(orbEl) : null;

    const fillFromVar = parseRgbLike(rootStyle.getPropertyValue("--orb-fill"), { clamp, clamp01 });
    const orbColorState = typeof getOrbColorState === "function" ? getOrbColorState() : null;
    const fallbackR = Math.round(clamp01(orbColorState && orbColorState.current && orbColorState.current.r) * 255);
    const fallbackG = Math.round(clamp01(orbColorState && orbColorState.current && orbColorState.current.g) * 255);
    const fallbackB = Math.round(clamp01(orbColorState && orbColorState.current && orbColorState.current.b) * 255);
    const fallbackFillAlpha = clamp01(typeof getBaseFillAlpha === "function" ? getBaseFillAlpha() : 0.20);

    const shardStyle = ORB_LIFECYCLE_SHARD_STYLE_DEFAULT;
    const fill = fillFromVar || { r: fallbackR, g: fallbackG, b: fallbackB, a: fallbackFillAlpha };
    const orbOpacity = orbStyle ? clamp01(Number(orbStyle.opacity) || 1) : 1;
    const shardRgb = shardStyle.strokeRgb || {};

    return {
      strokeRgb: `rgb(${colorPart(shardRgb.r, fallbackR, clamp)},${colorPart(shardRgb.g, fallbackG, clamp)},${colorPart(shardRgb.b, fallbackB, clamp)})`,
      strokeAlpha: shardStyle.strokeAlpha,
      strokeWidthPx: shardStyle.strokeWidthPx,
      fillRgb: `rgb(${fill.r},${fill.g},${fill.b})`,
      fillAlpha: clamp01(fill.a * orbOpacity),
    };
  }

  function spawnShardFx(piecePayload) {
    const palette = shardPaletteSnapshot || captureCurrentOrbPalette();
    const runtime = typeof getOrbShatterRuntime === "function" ? getOrbShatterRuntime() : null;
    if (!palette || !runtime || typeof runtime.spawnPiece !== "function") return false;
    return runtime.spawnPiece(piecePayload, palette);
  }

  function stopShardSim() {
    const runtime = typeof getOrbShatterRuntime === "function" ? getOrbShatterRuntime() : null;
    if (runtime && typeof runtime.clear === "function") runtime.clear();
  }

  function handleOrbDied() {
    shardPaletteSnapshot = captureCurrentOrbPalette();
    return shardPaletteSnapshot;
  }

  function handleOrbRevived() {
    shardPaletteSnapshot = null;
    stopShardSim();
  }

  function handleOrbShatterComplete() {
    clearSnapshot();
    stopShardSim();
  }

  function clearSnapshot() {
    shardPaletteSnapshot = null;
  }

  function getSnapshot() {
    return shardPaletteSnapshot ? { ...shardPaletteSnapshot } : null;
  }

  return {
    captureCurrentOrbPalette,
    spawnShardFx,
    stopShardSim,
    handleOrbDied,
    handleOrbRevived,
    handleOrbShatterComplete,
    clearSnapshot,
    getSnapshot,
  };
}
