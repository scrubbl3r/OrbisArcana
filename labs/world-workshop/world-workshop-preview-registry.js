import { ORB_BASE_VISUAL_DEFAULTS } from "../../src/game-runtime/orb/orb-base-default.js";
import { clearPreviewHost } from "./preview-host.js";
import { renderOrbPreview } from "./previews/orb-preview.js?v=20260426a";
import { renderIonicPlinthPreview } from "./previews/ionic-plinth-preview.js?v=20260426a";

const PREVIEW_RENDERERS = Object.freeze({
  "orb": renderOrbPreview,
  "orb-spawn-plinth": renderIonicPlinthPreview,
});

export function createWorldWorkshopPreviewRegistry({
  orbBaseVisualDefaults = ORB_BASE_VISUAL_DEFAULTS,
} = {}) {
  function renderPreview({ surface, previewRoot } = {}) {
    if (!surface || !previewRoot) return null;
    const renderer = PREVIEW_RENDERERS[String(surface.previewKey || surface.generator || "")] || null;
    if (!renderer) {
      clearPreviewHost(previewRoot);
      return null;
    }
    return renderer({
      root: previewRoot,
      orbDiameterPx: orbBaseVisualDefaults.diameterPx,
    });
  }

  return Object.freeze({ renderPreview });
}
