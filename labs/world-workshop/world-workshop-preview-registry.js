import { ORB_BASE_VISUAL_DEFAULTS } from "../../src/game-runtime/orb/orb-base-default.js";
import { renderIonicPlinthPreview } from "./previews/ionic-plinth-preview.js?v=20260426a";

const PREVIEW_RENDERERS = Object.freeze({
  "orb-spawn-plinth": renderIonicPlinthPreview,
});

export function createWorldWorkshopPreviewRegistry({
  orbBaseVisualDefaults = ORB_BASE_VISUAL_DEFAULTS,
} = {}) {
  function renderPreview({ surface, previewRoot } = {}) {
    if (!surface || !previewRoot) return null;
    const renderer = PREVIEW_RENDERERS[String(surface.previewKey || surface.generator || "")] || null;
    if (!renderer) {
      if (previewRoot.__worldWorkshopPreviewCleanup) previewRoot.__worldWorkshopPreviewCleanup();
      previewRoot.innerHTML = "";
      return null;
    }
    return renderer({
      root: previewRoot,
      orbDiameterPx: orbBaseVisualDefaults.diameterPx,
    });
  }

  return Object.freeze({ renderPreview });
}

