import { ORB_FRACTURE_VISUAL_DEFAULTS as ORB_FRACTURE_VISUAL_DEFAULTS_FILE } from "./orb-fracture-default.js";

function clamp01(v) {
  const n = Number(v);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function clampPx(v, fallback) {
  const n = Number(v);
  return Math.max(0, Number.isFinite(n) ? n : fallback);
}

export const ORB_FRACTURE_VISUAL_DEFAULTS = Object.freeze({
  crackStrokeWidthPx: clampPx(
    ORB_FRACTURE_VISUAL_DEFAULTS_FILE.crackStrokeWidthPx,
    1.6
  ),
  shardStrokeWidthPx: clampPx(
    ORB_FRACTURE_VISUAL_DEFAULTS_FILE.shardStrokeWidthPx,
    1.2
  ),
  glowBlurPx: clampPx(
    ORB_FRACTURE_VISUAL_DEFAULTS_FILE.glowBlurPx,
    3
  ),
  glowAlpha: clamp01(
    Object.prototype.hasOwnProperty.call(ORB_FRACTURE_VISUAL_DEFAULTS_FILE, "glowAlpha")
      ? ORB_FRACTURE_VISUAL_DEFAULTS_FILE.glowAlpha
      : 1
  ),
});

export function buildOrbFractureVisualState(overrides = null) {
  const source = (overrides && typeof overrides === "object") ? overrides : ORB_FRACTURE_VISUAL_DEFAULTS;

  return Object.freeze({
    crackStrokeWidthPx: clampPx(
      source.crackStrokeWidthPx,
      ORB_FRACTURE_VISUAL_DEFAULTS.crackStrokeWidthPx
    ),
    shardStrokeWidthPx: clampPx(
      source.shardStrokeWidthPx,
      ORB_FRACTURE_VISUAL_DEFAULTS.shardStrokeWidthPx
    ),
    glowBlurPx: clampPx(
      source.glowBlurPx,
      ORB_FRACTURE_VISUAL_DEFAULTS.glowBlurPx
    ),
    glowAlpha: clamp01(
      Object.prototype.hasOwnProperty.call(source, "glowAlpha")
        ? source.glowAlpha
        : ORB_FRACTURE_VISUAL_DEFAULTS.glowAlpha
    ),
  });
}

export function applyOrbFractureVisualCssVars(
  orbFractureVisualState,
  { root = globalThis.document && globalThis.document.documentElement } = {}
) {
  if (!root || !orbFractureVisualState || typeof orbFractureVisualState !== "object") return;

  root.style.setProperty(
    "--orb-fracture-crack-stroke",
    `${clampPx(
      orbFractureVisualState.crackStrokeWidthPx,
      ORB_FRACTURE_VISUAL_DEFAULTS.crackStrokeWidthPx
    )}px`
  );
  root.style.setProperty(
    "--orb-fracture-shard-stroke",
    `${clampPx(
      orbFractureVisualState.shardStrokeWidthPx,
      ORB_FRACTURE_VISUAL_DEFAULTS.shardStrokeWidthPx
    )}px`
  );
  root.style.setProperty(
    "--orb-fracture-glow-blur",
    `${clampPx(
      orbFractureVisualState.glowBlurPx,
      ORB_FRACTURE_VISUAL_DEFAULTS.glowBlurPx
    )}px`
  );
  root.style.setProperty(
    "--orb-fracture-glow-alpha",
    clamp01(
      Object.prototype.hasOwnProperty.call(orbFractureVisualState, "glowAlpha")
        ? orbFractureVisualState.glowAlpha
        : ORB_FRACTURE_VISUAL_DEFAULTS.glowAlpha
    ).toFixed(2)
  );
}
