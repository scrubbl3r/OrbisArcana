import { renderGnatSwarmPreview } from "./previews/gnat-swarm-preview.js?v=20260515b";

const PREVIEW_RENDERERS = Object.freeze({
  "gnat-swarm": renderGnatSwarmPreview,
});

export function createEnemyWorkshopPreviewRegistry() {
  function renderPreview({ surface, previewRoot, settings = null } = {}) {
    if (!surface || !previewRoot) return null;
    const renderer = PREVIEW_RENDERERS[String(surface.previewKey || surface.archetype || "")] || null;
    if (!renderer) {
      previewRoot.innerHTML = "";
      return null;
    }
    return renderer({ root: previewRoot, surface, settings });
  }

  return Object.freeze({ renderPreview });
}
