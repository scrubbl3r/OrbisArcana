import { ORB_RUNTIME_CONFIG_DEFAULT } from "../../content/orb/orb-runtime-config-default.js";
import { GAME_THEME_DEFAULT } from "../../content/theme/game-theme-default.js";
import { ORB_BASE_VISUAL_DEFAULTS as ORB_BASE_VISUAL_DEFAULTS_FILE } from "./orb-base-default.js";

function clamp01(v) {
  const n = Number(v);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function clampByte(v) {
  const n = Math.round(Number(v) || 0);
  return Math.max(0, Math.min(255, n));
}

function toStroke01(rgb = {}) {
  return {
    r: clampByte(rgb.r) / 255,
    g: clampByte(rgb.g) / 255,
    b: clampByte(rgb.b) / 255,
  };
}

const ORB_THEME_DEFAULT = (GAME_THEME_DEFAULT && GAME_THEME_DEFAULT.orb) || {
  diameterPx: 100,
  strokeWidthPx: 2,
  strokeDefaultRgb: { r: 255, g: 255, b: 255 },
  strokeAlpha: 1,
  fillDefaultRgb: { r: 255, g: 255, b: 255 },
  fillAlpha: 0.20,
};

const ORB_RUNTIME_PHYSICS_DEFAULT = (ORB_RUNTIME_CONFIG_DEFAULT && ORB_RUNTIME_CONFIG_DEFAULT.physics) || {
  orbRadiusPx: 50,
};

export const ORB_BASE_VISUAL_DEFAULTS = Object.freeze({
  diameterPx: Math.max(2, Math.round(Number(ORB_BASE_VISUAL_DEFAULTS_FILE.diameterPx) || Number(ORB_THEME_DEFAULT.diameterPx) || 100)),
  radiusPx: Math.max(1, Number(ORB_BASE_VISUAL_DEFAULTS_FILE.radiusPx) || Number(ORB_RUNTIME_PHYSICS_DEFAULT.orbRadiusPx) || 50),
  strokeWidthPx: Math.max(1, Math.round(Number(ORB_BASE_VISUAL_DEFAULTS_FILE.strokeWidthPx) || Number(ORB_THEME_DEFAULT.strokeWidthPx) || 2)),
  strokeDefaultRgb: Object.freeze({
    r: clampByte(ORB_BASE_VISUAL_DEFAULTS_FILE.strokeDefaultRgb && ORB_BASE_VISUAL_DEFAULTS_FILE.strokeDefaultRgb.r),
    g: clampByte(ORB_BASE_VISUAL_DEFAULTS_FILE.strokeDefaultRgb && ORB_BASE_VISUAL_DEFAULTS_FILE.strokeDefaultRgb.g),
    b: clampByte(ORB_BASE_VISUAL_DEFAULTS_FILE.strokeDefaultRgb && ORB_BASE_VISUAL_DEFAULTS_FILE.strokeDefaultRgb.b),
  }),
  strokeAlpha: clamp01(
    Object.prototype.hasOwnProperty.call(ORB_BASE_VISUAL_DEFAULTS_FILE, "strokeAlpha")
      ? ORB_BASE_VISUAL_DEFAULTS_FILE.strokeAlpha
      : ORB_THEME_DEFAULT.strokeAlpha
  ),
  fillDefaultRgb: Object.freeze({
    r: clampByte(
      (ORB_BASE_VISUAL_DEFAULTS_FILE.fillDefaultRgb && ORB_BASE_VISUAL_DEFAULTS_FILE.fillDefaultRgb.r)
      ?? (ORB_THEME_DEFAULT.fillDefaultRgb && ORB_THEME_DEFAULT.fillDefaultRgb.r)
    ),
    g: clampByte(
      (ORB_BASE_VISUAL_DEFAULTS_FILE.fillDefaultRgb && ORB_BASE_VISUAL_DEFAULTS_FILE.fillDefaultRgb.g)
      ?? (ORB_THEME_DEFAULT.fillDefaultRgb && ORB_THEME_DEFAULT.fillDefaultRgb.g)
    ),
    b: clampByte(
      (ORB_BASE_VISUAL_DEFAULTS_FILE.fillDefaultRgb && ORB_BASE_VISUAL_DEFAULTS_FILE.fillDefaultRgb.b)
      ?? (ORB_THEME_DEFAULT.fillDefaultRgb && ORB_THEME_DEFAULT.fillDefaultRgb.b)
    ),
  }),
  fillAlpha: clamp01(
    Object.prototype.hasOwnProperty.call(ORB_BASE_VISUAL_DEFAULTS_FILE, "fillAlpha")
      ? ORB_BASE_VISUAL_DEFAULTS_FILE.fillAlpha
      : ORB_THEME_DEFAULT.fillAlpha
  ),
});

export function buildOrbBaseVisualState({ theme = null, physics = null } = {}) {
  const themeOrb = {
    ...ORB_THEME_DEFAULT,
    ...ORB_BASE_VISUAL_DEFAULTS,
    ...((theme && theme.orb && typeof theme.orb === "object") ? theme.orb : {}),
    strokeDefaultRgb: {
      ...ORB_THEME_DEFAULT.strokeDefaultRgb,
      ...ORB_BASE_VISUAL_DEFAULTS.strokeDefaultRgb,
      ...(((theme && theme.orb && theme.orb.strokeDefaultRgb) && typeof theme.orb.strokeDefaultRgb === "object")
        ? theme.orb.strokeDefaultRgb
        : {}),
    },
    fillDefaultRgb: {
      ...(ORB_THEME_DEFAULT.fillDefaultRgb || ORB_THEME_DEFAULT.strokeDefaultRgb || {}),
      ...(ORB_BASE_VISUAL_DEFAULTS.fillDefaultRgb || {}),
      ...(((theme && theme.orb && theme.orb.fillDefaultRgb) && typeof theme.orb.fillDefaultRgb === "object")
        ? theme.orb.fillDefaultRgb
        : {}),
    },
  };
  const physicsOrb = (physics && typeof physics === "object")
    ? physics
    : ORB_RUNTIME_PHYSICS_DEFAULT;

  const radiusPx = Math.max(1, Number(physicsOrb.orbRadiusPx) || ORB_BASE_VISUAL_DEFAULTS.radiusPx);
  const diameterPx = Math.max(2, Math.round(Number(themeOrb.diameterPx) || (radiusPx * 2)));
  const strokeWidthPx = Math.max(
    1,
    Math.round(Number(themeOrb.strokeWidthPx) || ORB_BASE_VISUAL_DEFAULTS.strokeWidthPx)
  );
  const strokeDefaultRgb = Object.freeze({
    r: clampByte(themeOrb.strokeDefaultRgb && themeOrb.strokeDefaultRgb.r),
    g: clampByte(themeOrb.strokeDefaultRgb && themeOrb.strokeDefaultRgb.g),
    b: clampByte(themeOrb.strokeDefaultRgb && themeOrb.strokeDefaultRgb.b),
  });
  const strokeAlpha = clamp01(
    Object.prototype.hasOwnProperty.call(themeOrb, "strokeAlpha")
      ? themeOrb.strokeAlpha
      : ORB_BASE_VISUAL_DEFAULTS.strokeAlpha
  );
  const fillDefaultRgb = Object.freeze({
    r: clampByte(
      (themeOrb.fillDefaultRgb && themeOrb.fillDefaultRgb.r)
      ?? ORB_BASE_VISUAL_DEFAULTS.fillDefaultRgb.r
    ),
    g: clampByte(
      (themeOrb.fillDefaultRgb && themeOrb.fillDefaultRgb.g)
      ?? ORB_BASE_VISUAL_DEFAULTS.fillDefaultRgb.g
    ),
    b: clampByte(
      (themeOrb.fillDefaultRgb && themeOrb.fillDefaultRgb.b)
      ?? ORB_BASE_VISUAL_DEFAULTS.fillDefaultRgb.b
    ),
  });
  const fillAlpha = clamp01(themeOrb.fillAlpha);

  return Object.freeze({
    diameterPx,
    radiusPx,
    strokeWidthPx,
    strokeDefaultRgb,
    strokeDefault01: Object.freeze(toStroke01(strokeDefaultRgb)),
    strokeAlpha,
    fillDefaultRgb,
    fillAlpha,
  });
}

export function applyOrbBaseVisualCssVars(
  orbBaseVisualState,
  { root = globalThis.document && globalThis.document.documentElement } = {}
) {
  if (!root || !orbBaseVisualState || typeof orbBaseVisualState !== "object") return;

  const stroke = orbBaseVisualState.strokeDefaultRgb || ORB_BASE_VISUAL_DEFAULTS.strokeDefaultRgb;
  const strokeAlpha = clamp01(
    Object.prototype.hasOwnProperty.call(orbBaseVisualState, "strokeAlpha")
      ? orbBaseVisualState.strokeAlpha
      : ORB_BASE_VISUAL_DEFAULTS.strokeAlpha
  );
  const fill = orbBaseVisualState.fillDefaultRgb || ORB_BASE_VISUAL_DEFAULTS.fillDefaultRgb;
  const fillAlpha = clamp01(orbBaseVisualState.fillAlpha);
  const diameterPx = Math.max(2, Math.round(Number(orbBaseVisualState.diameterPx) || ORB_BASE_VISUAL_DEFAULTS.diameterPx));
  const strokeWidthPx = Math.max(1, Math.round(Number(orbBaseVisualState.strokeWidthPx) || ORB_BASE_VISUAL_DEFAULTS.strokeWidthPx));

  root.style.setProperty("--orb-d", `${diameterPx}px`);
  root.style.setProperty("--orb-stroke", `${strokeWidthPx}px`);
  root.style.setProperty(
    "--orb-stroke-color",
    `rgba(${clampByte(stroke.r)},${clampByte(stroke.g)},${clampByte(stroke.b)},${strokeAlpha.toFixed(2)})`
  );
  root.style.setProperty(
    "--orb-fill",
    `rgba(${clampByte(fill.r)},${clampByte(fill.g)},${clampByte(fill.b)},${fillAlpha.toFixed(2)})`
  );
}
