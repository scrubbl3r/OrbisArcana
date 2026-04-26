import { WORLD_WORKSHOP_SURFACES } from "./world-item-surfaces.js";

function surfaceOptionMarkup(surface = {}) {
  return `<option value="${String(surface.id || "")}">${String(surface.label || surface.id || "World item")}</option>`;
}

export function bootWorldWorkshop({ root = document } = {}) {
  const select = root.querySelector("[data-world-workshop-item-select]");
  const meta = root.querySelector("[data-world-workshop-meta]");
  const viewportLabel = root.querySelector("[data-world-workshop-viewport-label]");
  if (select) {
    select.innerHTML = WORLD_WORKSHOP_SURFACES.map(surfaceOptionMarkup).join("");
    select.addEventListener("change", () => updateSelection({ select, meta, viewportLabel }));
  }
  updateSelection({ select, meta, viewportLabel });
}

function updateSelection({ select = null, meta = null, viewportLabel = null } = {}) {
  const selectedId = String(select && select.value || WORLD_WORKSHOP_SURFACES[0]?.id || "");
  const surface = WORLD_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || WORLD_WORKSHOP_SURFACES[0] || null;
  if (viewportLabel) viewportLabel.textContent = surface ? String(surface.label || surface.id) : "World Object";
  if (meta) {
    meta.textContent = surface
      ? `${String(surface.kind || "")} / ${String(surface.category || "")} / ${String(surface.status || "draft")}`
      : "";
  }
}

bootWorldWorkshop();
