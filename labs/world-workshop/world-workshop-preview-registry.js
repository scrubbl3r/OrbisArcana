import { ORB_BASE_VISUAL_DEFAULTS } from "../../src/game-runtime/orb/orb-base-default.js";
import { clearPreviewHost } from "./preview-host.js";
import { renderOrbSpawnAssemblyPreview } from "./previews/orb-spawn-assembly-preview.js?v=20260426a";
import { renderOrbDisplacementPreview } from "./previews/orb-displacement-preview.js?v=20260427p";
import { renderGlobePreview } from "./previews/globe-preview.js?v=20260429a";
import { renderOrbPreview } from "./previews/orb-preview.js?v=20260428a";
import { renderPlinthPreview } from "./previews/plinth-preview.js?v=20260426a";

const PREVIEW_RENDERERS = Object.freeze({
  "globe": renderGlobePreview,
  "orb": renderOrbPreview,
  "orb-displacement-test": renderOrbDisplacementPreview,
  "orb-spawn-assembly": renderOrbSpawnAssemblyPreview,
  "orb-spawn-plinth": renderPlinthPreview,
  "plinth": renderPlinthPreview,
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
