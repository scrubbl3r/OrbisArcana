import { getCanonicalOrbBaseDiameterPx } from "../orb/orb-base-state.js";
import { resolveOrbRatioPx } from "../orb/orb-spell-geometry.js";
import { WORLD_GLOBE_VISUAL_DEFAULTS as WORLD_GLOBE_VISUAL_DEFAULTS_FILE } from "./world-globe-default.js?v=20260418a";

function clamp(v, lo, hi, fallback) {
  const n = Number(v);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : lo;
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : f));
}

function colorChannel(v, fallback) {
  return Math.round(clamp(v, 0, 255, fallback));
}

function alpha(v, fallback) {
  return clamp(v, 0, 1, fallback);
}

function ratio(v, fallback) {
  return clamp(v, 0, 10, fallback);
}

function styleState(source = {}, fallback = {}, { orbDiameterPx = null } = {}) {
  const fillFallback = fallback.fillRgb || {};
  const strokeFallback = fallback.strokeRgb || {};
  const resolvedOrbDiameterPx = Math.max(1, Number(orbDiameterPx) || getCanonicalOrbBaseDiameterPx());
  return Object.freeze({
    diameterRatio: ratio(source.diameterRatio, fallback.diameterRatio),
    diameterPx: resolveOrbRatioPx(ratio(source.diameterRatio, fallback.diameterRatio), {
      orbDiameterPx: resolvedOrbDiameterPx,
      min: 1,
    }),
    fillRgb: Object.freeze({
      r: colorChannel(source.fillRgb && source.fillRgb.r, fillFallback.r),
      g: colorChannel(source.fillRgb && source.fillRgb.g, fillFallback.g),
      b: colorChannel(source.fillRgb && source.fillRgb.b, fillFallback.b),
    }),
    fillAlpha: alpha(source.fillAlpha, fallback.fillAlpha),
    strokeRgb: Object.freeze({
      r: colorChannel(source.strokeRgb && source.strokeRgb.r, strokeFallback.r),
      g: colorChannel(source.strokeRgb && source.strokeRgb.g, strokeFallback.g),
      b: colorChannel(source.strokeRgb && source.strokeRgb.b, strokeFallback.b),
    }),
    strokeAlpha: alpha(source.strokeAlpha, fallback.strokeAlpha),
    strokeWidthRatio: ratio(source.strokeWidthRatio, fallback.strokeWidthRatio),
    strokeWidthPx: resolveOrbRatioPx(ratio(source.strokeWidthRatio, fallback.strokeWidthRatio), {
      orbDiameterPx: resolvedOrbDiameterPx,
      min: 0,
    }),
  });
}

export const WORLD_GLOBE_VISUAL_DEFAULTS = Object.freeze({
  idle: Object.freeze({
    ...styleState(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle, WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle),
    driftRatio: ratio(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.driftRatio, 0.10),
    bobRatio: ratio(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.bobRatio, 0.07),
    driftPx: resolveOrbRatioPx(
      ratio(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.driftRatio, 0.10),
      { min: 0 }
    ),
    bobPx: resolveOrbRatioPx(
      ratio(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.bobRatio, 0.07),
      { min: 0 }
    ),
    bobHz: clamp(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.bobHz, 0, 20, 0.65),
    pulseScale: clamp(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.pulseScale, 0, 1, 0.045),
    pulseHz: clamp(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle && WORLD_GLOBE_VISUAL_DEFAULTS_FILE.idle.pulseHz, 0, 20, 0.9),
  }),
  collected: styleState(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.collected, WORLD_GLOBE_VISUAL_DEFAULTS_FILE.collected),
  consumed: styleState(WORLD_GLOBE_VISUAL_DEFAULTS_FILE.consumed, WORLD_GLOBE_VISUAL_DEFAULTS_FILE.consumed),
});

export function buildWorldGlobeVisualState(overrides = null, { orbDiameterPx = null } = {}) {
  const source = overrides && typeof overrides === "object" ? overrides : WORLD_GLOBE_VISUAL_DEFAULTS;
  const idle = styleState(source.idle, WORLD_GLOBE_VISUAL_DEFAULTS.idle, { orbDiameterPx });
  const resolvedOrbDiameterPx = Math.max(1, Number(orbDiameterPx) || getCanonicalOrbBaseDiameterPx());
  return Object.freeze({
    idle: Object.freeze({
      ...idle,
      driftRatio: ratio(source.idle && source.idle.driftRatio, WORLD_GLOBE_VISUAL_DEFAULTS.idle.driftRatio),
      bobRatio: ratio(source.idle && source.idle.bobRatio, WORLD_GLOBE_VISUAL_DEFAULTS.idle.bobRatio),
      driftPx: resolveOrbRatioPx(
        ratio(source.idle && source.idle.driftRatio, WORLD_GLOBE_VISUAL_DEFAULTS.idle.driftRatio),
        { orbDiameterPx: resolvedOrbDiameterPx, min: 0 }
      ),
      bobPx: resolveOrbRatioPx(
        ratio(source.idle && source.idle.bobRatio, WORLD_GLOBE_VISUAL_DEFAULTS.idle.bobRatio),
        { orbDiameterPx: resolvedOrbDiameterPx, min: 0 }
      ),
      bobHz: clamp(source.idle && source.idle.bobHz, 0, 20, WORLD_GLOBE_VISUAL_DEFAULTS.idle.bobHz),
      pulseScale: clamp(source.idle && source.idle.pulseScale, 0, 1, WORLD_GLOBE_VISUAL_DEFAULTS.idle.pulseScale),
      pulseHz: clamp(source.idle && source.idle.pulseHz, 0, 20, WORLD_GLOBE_VISUAL_DEFAULTS.idle.pulseHz),
    }),
    collected: styleState(source.collected, WORLD_GLOBE_VISUAL_DEFAULTS.collected, { orbDiameterPx }),
    consumed: styleState(source.consumed, WORLD_GLOBE_VISUAL_DEFAULTS.consumed, { orbDiameterPx }),
  });
}

export function rgbaFromWorldGlobeColor(rgb = {}, a = 1) {
  return `rgba(${colorChannel(rgb.r, 255)},${colorChannel(rgb.g, 255)},${colorChannel(rgb.b, 255)},${alpha(a, 1).toFixed(3)})`;
}

function setStyleVars(root, prefix, state) {
  root.style.setProperty(`--world-globe-${prefix}-d`, `${Number(state.diameterPx).toFixed(2)}px`);
  root.style.setProperty(`--world-globe-${prefix}-fill`, rgbaFromWorldGlobeColor(state.fillRgb, state.fillAlpha));
  root.style.setProperty(`--world-globe-${prefix}-stroke`, rgbaFromWorldGlobeColor(state.strokeRgb, state.strokeAlpha));
  root.style.setProperty(`--world-globe-${prefix}-stroke-w`, `${Number(state.strokeWidthPx).toFixed(2)}px`);
}

export function applyWorldGlobeVisualCssVars(worldGlobeVisualState, { root } = {}) {
  if (!root || !worldGlobeVisualState || typeof worldGlobeVisualState !== "object") return;
  setStyleVars(root, "idle", worldGlobeVisualState.idle);
  setStyleVars(root, "collected", worldGlobeVisualState.collected);
  setStyleVars(root, "consumed", worldGlobeVisualState.consumed);
  root.style.setProperty("--world-globe-idle-drift", `${Number(worldGlobeVisualState.idle.driftPx).toFixed(2)}px`);
  root.style.setProperty("--world-globe-idle-bob", `${Number(worldGlobeVisualState.idle.bobPx).toFixed(2)}px`);
  root.style.setProperty("--world-globe-idle-bob-hz", String(Number(worldGlobeVisualState.idle.bobHz).toFixed(3)));
  root.style.setProperty("--world-globe-idle-pulse-scale", String(Number(worldGlobeVisualState.idle.pulseScale).toFixed(3)));
  root.style.setProperty("--world-globe-idle-pulse-hz", String(Number(worldGlobeVisualState.idle.pulseHz).toFixed(3)));
}
