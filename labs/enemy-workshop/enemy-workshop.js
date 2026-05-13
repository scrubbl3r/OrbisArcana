import { renderLabWorkspaceNav } from "../shell/lab-workspaces.js";
import { ENEMY_WORKSHOP_SURFACES } from "./enemy-surfaces.js";
import { createEnemyWorkshopPreviewRegistry } from "./enemy-workshop-preview-registry.js?v=20260513a";
import {
  formatEnemyWorkshopBehaviorReadout,
  formatEnemyWorkshopMeta,
  formatEnemyWorkshopPersonalityReadout,
  formatEnemyWorkshopRuntimeReadout,
} from "./enemy-workshop-readouts.js?v=20260513a";

function surfaceOptionMarkup(surface = {}) {
  return `<option value="${String(surface.id || "")}">${String(surface.label || surface.id || "Enemy")}</option>`;
}

function surfaceIdFromHash({ location = globalThis.location } = {}) {
  const hash = String(location && location.hash || "").replace(/^#/, "");
  return hash ? decodeURIComponent(hash) : "";
}

export function bootEnemyWorkshop({ root = globalThis.document } = {}) {
  if (!root) return;
  renderLabWorkspaceNav({ root, currentWorkspaceId: "enemy-workshop" });
  const previewRegistry = createEnemyWorkshopPreviewRegistry();
  const select = root.querySelector("[data-enemy-workshop-enemy-select]");
  const meta = root.querySelector("[data-enemy-workshop-meta]");
  const viewportLabel = root.querySelector("[data-enemy-workshop-viewport-label]");
  const previewRoot = root.querySelector("[data-enemy-workshop-preview-root]");
  const behaviorReadout = root.querySelector("[data-enemy-workshop-behavior-readout]");
  const personalityReadout = root.querySelector("[data-enemy-workshop-personality-readout]");
  const runtimeReadout = root.querySelector("[data-enemy-workshop-runtime-readout]");
  if (select) {
    select.innerHTML = ENEMY_WORKSHOP_SURFACES.map(surfaceOptionMarkup).join("");
    const hashSurfaceId = surfaceIdFromHash();
    if (hashSurfaceId && ENEMY_WORKSHOP_SURFACES.some((surface) => surface.id === hashSurfaceId)) {
      select.value = hashSurfaceId;
    }
    select.addEventListener("change", () => updateSelection({
      select,
      meta,
      viewportLabel,
      previewRoot,
      behaviorReadout,
      personalityReadout,
      runtimeReadout,
      previewRegistry,
    }));
  }
  updateSelection({
    select,
    meta,
    viewportLabel,
    previewRoot,
    behaviorReadout,
    personalityReadout,
    runtimeReadout,
    previewRegistry,
  });
}

function updateSelection({
  select = null,
  meta = null,
  viewportLabel = null,
  previewRoot = null,
  behaviorReadout = null,
  personalityReadout = null,
  runtimeReadout = null,
  previewRegistry = null,
} = {}) {
  const selectedId = String(select && select.value || ENEMY_WORKSHOP_SURFACES[0]?.id || "");
  const surface = ENEMY_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || ENEMY_WORKSHOP_SURFACES[0] || null;
  if (viewportLabel) viewportLabel.textContent = surface ? String(surface.label || surface.id) : "Enemy";
  if (meta) meta.textContent = formatEnemyWorkshopMeta(surface);
  if (previewRoot && previewRegistry && typeof previewRegistry.renderPreview === "function") {
    previewRegistry.renderPreview({ surface, previewRoot });
  }
  if (behaviorReadout) behaviorReadout.textContent = formatEnemyWorkshopBehaviorReadout(surface);
  if (personalityReadout) personalityReadout.textContent = formatEnemyWorkshopPersonalityReadout(surface);
  if (runtimeReadout) runtimeReadout.textContent = formatEnemyWorkshopRuntimeReadout(surface);
}

if (globalThis.document) bootEnemyWorkshop();
