import { WORLD_WORKSHOP_SURFACES } from "./world-item-surfaces.js";
import { createWorldWorkshopPreviewRegistry } from "./world-workshop-preview-registry.js?v=20260427j";
import {
  formatWorldWorkshopGeometryReadout,
  formatWorldWorkshopMaterialReadout,
  formatWorldWorkshopMeta,
} from "./world-workshop-readouts.js?v=20260427j";

function surfaceOptionMarkup(surface = {}) {
  return `<option value="${String(surface.id || "")}">${String(surface.label || surface.id || "World item")}</option>`;
}

function surfaceIdFromHash({ location = globalThis.location } = {}) {
  const hash = String(location && location.hash || "").replace(/^#/, "");
  if (!hash) return "";
  const surfaceId = decodeURIComponent(hash);
  if (surfaceId === "orb-spawn-plinth") return "plinth";
  return surfaceId;
}

export function bootWorldWorkshop({ root = globalThis.document } = {}) {
  if (!root) return;
  const previewRegistry = createWorldWorkshopPreviewRegistry();
  const select = root.querySelector("[data-world-workshop-item-select]");
  const meta = root.querySelector("[data-world-workshop-meta]");
  const viewportLabel = root.querySelector("[data-world-workshop-viewport-label]");
  const previewRoot = root.querySelector("[data-world-workshop-preview-root]");
  const geometryReadout = root.querySelector("[data-world-workshop-geometry-readout]");
  const materialReadout = root.querySelector("[data-world-workshop-material-readout]");
  const runtimeReadout = root.querySelector("[data-world-workshop-runtime-readout]");
  if (select) {
    select.innerHTML = WORLD_WORKSHOP_SURFACES.map(surfaceOptionMarkup).join("");
    const hashSurfaceId = surfaceIdFromHash();
    if (hashSurfaceId && WORLD_WORKSHOP_SURFACES.some((surface) => surface.id === hashSurfaceId)) {
      select.value = hashSurfaceId;
    }
    select.addEventListener("change", () => updateSelection({
      select,
      meta,
      viewportLabel,
      previewRoot,
      geometryReadout,
      materialReadout,
      runtimeReadout,
      previewRegistry,
    }));
  }
  updateSelection({
    select,
    meta,
    viewportLabel,
    previewRoot,
    geometryReadout,
    materialReadout,
    runtimeReadout,
    previewRegistry,
  });
}

function updateSelection({
  select = null,
  meta = null,
  viewportLabel = null,
  previewRoot = null,
  geometryReadout = null,
  materialReadout = null,
  runtimeReadout = null,
  previewRegistry = null,
} = {}) {
  const selectedId = String(select && select.value || WORLD_WORKSHOP_SURFACES[0]?.id || "");
  const surface = WORLD_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || WORLD_WORKSHOP_SURFACES[0] || null;
  if (viewportLabel) viewportLabel.textContent = surface ? String(surface.label || surface.id) : "World Object";
  if (meta) meta.textContent = formatWorldWorkshopMeta(surface);
  renderSurfacePreview({
    surface,
    previewRoot,
    geometryReadout,
    materialReadout,
    runtimeReadout,
    previewRegistry,
  });
}

function renderSurfacePreview({
  surface = null,
  previewRoot = null,
  geometryReadout = null,
  materialReadout = null,
  runtimeReadout = null,
  previewRegistry = null,
} = {}) {
  if (!surface || !previewRoot) return;
  let metrics = null;
  try {
    metrics = previewRegistry && typeof previewRegistry.renderPreview === "function"
      ? previewRegistry.renderPreview({ surface, previewRoot })
      : null;
  } catch (err) {
    if (geometryReadout) geometryReadout.textContent = `Preview error: ${err && err.message ? err.message : String(err)}`;
    if (materialReadout) materialReadout.textContent = "Preview failed before render.";
    if (runtimeReadout && surface) runtimeReadout.textContent = formatWorldWorkshopMeta(surface);
    throw err;
  }
  if (geometryReadout) geometryReadout.textContent = formatWorldWorkshopGeometryReadout(surface, metrics);
  if (materialReadout) materialReadout.textContent = formatWorldWorkshopMaterialReadout(surface);
  if (runtimeReadout && surface) runtimeReadout.textContent = formatWorldWorkshopMeta(surface);
}

if (globalThis.document) bootWorldWorkshop();
