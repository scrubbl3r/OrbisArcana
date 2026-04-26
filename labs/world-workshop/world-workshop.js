import { ORB_BASE_VISUAL_DEFAULTS } from "../../src/game-runtime/orb/orb-base-default.js";
import { WORLD_WORKSHOP_SURFACES } from "./world-item-surfaces.js";
import { renderIonicPlinthPreview } from "./previews/ionic-plinth-preview.js?v=20260426g";

function surfaceOptionMarkup(surface = {}) {
  return `<option value="${String(surface.id || "")}">${String(surface.label || surface.id || "World item")}</option>`;
}

export function bootWorldWorkshop({ root = globalThis.document } = {}) {
  if (!root) return;
  const select = root.querySelector("[data-world-workshop-item-select]");
  const meta = root.querySelector("[data-world-workshop-meta]");
  const viewportLabel = root.querySelector("[data-world-workshop-viewport-label]");
  const previewRoot = root.querySelector("[data-world-workshop-preview-root]");
  const geometryReadout = root.querySelector("[data-world-workshop-geometry-readout]");
  const materialReadout = root.querySelector("[data-world-workshop-material-readout]");
  const runtimeReadout = root.querySelector("[data-world-workshop-runtime-readout]");
  if (select) {
    select.innerHTML = WORLD_WORKSHOP_SURFACES.map(surfaceOptionMarkup).join("");
    select.addEventListener("change", () => updateSelection({
      select,
      meta,
      viewportLabel,
      previewRoot,
      geometryReadout,
      materialReadout,
      runtimeReadout,
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
} = {}) {
  const selectedId = String(select && select.value || WORLD_WORKSHOP_SURFACES[0]?.id || "");
  const surface = WORLD_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || WORLD_WORKSHOP_SURFACES[0] || null;
  if (viewportLabel) viewportLabel.textContent = surface ? String(surface.label || surface.id) : "World Object";
  if (meta) {
    meta.textContent = surface
      ? `${String(surface.kind || "")} / ${String(surface.category || "")} / ${String(surface.status || "draft")}`
      : "";
  }
  renderSurfacePreview({
    surface,
    previewRoot,
    geometryReadout,
    materialReadout,
    runtimeReadout,
  });
}

function renderSurfacePreview({
  surface = null,
  previewRoot = null,
  geometryReadout = null,
  materialReadout = null,
  runtimeReadout = null,
} = {}) {
  if (!surface || !previewRoot) return;
  if (surface.generator !== "ionic-plinth") {
    previewRoot.innerHTML = "";
    return;
  }
  let metrics = null;
  try {
    metrics = renderIonicPlinthPreview({
      root: previewRoot,
      orbDiameterPx: ORB_BASE_VISUAL_DEFAULTS.diameterPx,
    });
  } catch (err) {
    if (geometryReadout) geometryReadout.textContent = `Preview error: ${err && err.message ? err.message : String(err)}`;
    if (materialReadout) materialReadout.textContent = "Preview failed before render.";
    if (runtimeReadout && surface) {
      runtimeReadout.textContent = `${String(surface.kind || "world_item")} / ${String(surface.category || "world")} / ${String(surface.status || "draft")}`;
    }
    throw err;
  }
  if (geometryReadout && metrics) {
    geometryReadout.textContent = `BO ${metrics.bo}px / nonagon column ${metrics.columnWidth}px x ${metrics.columnDepth}px x ${metrics.columnHeight}px / cap ${metrics.capitalWidth}px / base ${metrics.baseWidth}px`;
  }
  if (materialReadout) {
    materialReadout.textContent = "OrbitControls Three.js mesh / opaque black faces / 2px white vector edges";
  }
  if (runtimeReadout && surface) {
    runtimeReadout.textContent = `${String(surface.kind || "world_item")} / ${String(surface.category || "world")} / ${String(surface.status || "draft")}`;
  }
}

if (globalThis.document) bootWorldWorkshop();
