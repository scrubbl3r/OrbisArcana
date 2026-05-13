import { renderGnatSwarmPreview } from "./previews/gnat-swarm-preview.js?v=20260513a";

const PREVIEW_RENDERERS = Object.freeze({
  "gnat-swarm": renderGnatSwarmPreview,
});

export function createEnemyWorkshopPreviewRegistry() {
  function renderPreview({ surface, previewRoot } = {}) {
    if (!surface || !previewRoot) return null;
    const renderer = PREVIEW_RENDERERS[String(surface.previewKey || surface.archetype || "")] || null;
    if (!renderer) {
      previewRoot.innerHTML = "";
      return null;
    }
    return renderer({ root: previewRoot, surface });
  }

  return Object.freeze({ renderPreview });
}
