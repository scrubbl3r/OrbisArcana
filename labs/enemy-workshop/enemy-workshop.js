import { renderLabWorkspaceNav } from "../shell/lab-workspaces.js";
import { ENEMY_WORKSHOP_SURFACES } from "./enemy-surfaces.js";
import { createEnemyWorkshopPreviewRegistry } from "./enemy-workshop-preview-registry.js?v=20260513a";
import {
  formatEnemyWorkshopBehaviorReadout,
  formatEnemyWorkshopMeta,
  formatEnemyWorkshopPersonalityReadout,
  formatEnemyWorkshopRuntimeReadout,
  formatEnemyWorkshopSpawnReadout,
} from "./enemy-workshop-readouts.js?v=20260513a";

function surfaceOptionMarkup(surface = {}) {
  return `<option value="${String(surface.id || "")}">${String(surface.label || surface.id || "Enemy")}</option>`;
}

function surfaceIdFromHash({ location = globalThis.location } = {}) {
  const hash = String(location && location.hash || "").replace(/^#/, "");
  return hash ? decodeURIComponent(hash) : "";
}

function cloneSettings(value = {}) {
  return JSON.parse(JSON.stringify(value || {}));
}

function getPathValue(source = {}, path = "") {
  return String(path || "").split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, source);
}

function setPathValue(target = {}, path = "", value = null) {
  const parts = String(path || "").split(".").filter(Boolean);
  if (!parts.length) return;
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

export function bootEnemyWorkshop({ root = globalThis.document } = {}) {
  if (!root) return;
  renderLabWorkspaceNav({ root, currentWorkspaceId: "enemy-workshop" });
  initCollapsibleControlGroups(root);
  const previewRegistry = createEnemyWorkshopPreviewRegistry();
  const gnatSettingsRef = { value: null };
  const select = root.querySelector("[data-enemy-workshop-enemy-select]");
  const meta = root.querySelector("[data-enemy-workshop-meta]");
  const viewportLabel = root.querySelector("[data-enemy-workshop-viewport-label]");
  const previewRoot = root.querySelector("[data-enemy-workshop-preview-root]");
  const behaviorReadout = root.querySelector("[data-enemy-workshop-behavior-readout]");
  const personalityReadout = root.querySelector("[data-enemy-workshop-personality-readout]");
  const spawnReadout = root.querySelector("[data-enemy-workshop-spawn-readout]");
  const runtimeReadout = root.querySelector("[data-enemy-workshop-runtime-readout]");
  const actionStatus = root.querySelector("[data-enemy-workshop-action-status]");
  bindTopbarActions({ root, actionStatus });
  bindGnatSettingInputs({
    root,
    gnatSettingsRef,
    update: () => updateSelection({
      select,
      meta,
      viewportLabel,
      previewRoot,
      behaviorReadout,
      personalityReadout,
      spawnReadout,
      runtimeReadout,
      previewRegistry,
      gnatSettingsRef,
      preserveSettings: true,
    }),
  });
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
      spawnReadout,
      runtimeReadout,
      previewRegistry,
      gnatSettingsRef,
    }));
  }
  updateSelection({
    select,
    meta,
    viewportLabel,
    previewRoot,
    behaviorReadout,
    personalityReadout,
    spawnReadout,
    runtimeReadout,
    previewRegistry,
    gnatSettingsRef,
  });
}

function initCollapsibleControlGroups(root = globalThis.document) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  const findBody = (toggle) => {
    const controlsId = toggle ? toggle.getAttribute("aria-controls") : "";
    if (!controlsId) return null;
    if (typeof root.getElementById === "function") return root.getElementById(controlsId);
    return globalThis.document && typeof globalThis.document.getElementById === "function"
      ? globalThis.document.getElementById(controlsId)
      : null;
  };
  root.querySelectorAll("[data-control-toggle]").forEach((toggle) => {
    const body = findBody(toggle);
    const expanded = toggle.getAttribute("aria-expanded") !== "false";
    if (body) body.hidden = !expanded;
  });
  root.addEventListener("click", (event) => {
    const toggle = event.target && event.target.closest ? event.target.closest("[data-control-toggle]") : null;
    if (!toggle || !root.contains(toggle)) return;
    const body = findBody(toggle);
    const expanded = toggle.getAttribute("aria-expanded") !== "false";
    toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    if (body) body.hidden = expanded;
  });
}

function bindTopbarActions({ root = null, actionStatus = null } = {}) {
  if (!root) return;
  const setStatus = (message) => {
    if (actionStatus) actionStatus.textContent = message;
  };
  const saveBtn = root.querySelector("[data-enemy-workshop-save]");
  const connectBtn = root.querySelector("[data-enemy-workshop-connect]");
  const publishBtn = root.querySelector("[data-enemy-workshop-publish]");
  if (saveBtn) saveBtn.addEventListener("click", () => setStatus("Saved draft"));
  if (connectBtn) connectBtn.addEventListener("click", () => setStatus("Project connection pending"));
  if (publishBtn) publishBtn.addEventListener("click", () => setStatus("Publish pending"));
}

function bindGnatSettingInputs({ root = null, gnatSettingsRef = null, update = null } = {}) {
  if (!root || !gnatSettingsRef) return;
  const applyInputValue = (input) => {
    const path = input.getAttribute("data-gnat-setting") || input.getAttribute("data-gnat-range") || "";
    if (!path) return;
    const nextValue = Number(input.value);
    const isValid = Number.isFinite(nextValue);
    input.classList.toggle("isInvalid", !isValid);
    if (!isValid) return;
    if (!gnatSettingsRef.value) gnatSettingsRef.value = {};
    setPathValue(gnatSettingsRef.value, path, nextValue);
    if (typeof update === "function") update();
  };
  root.querySelectorAll("[data-gnat-setting], [data-gnat-range]").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyInputValue(input);
    });
    input.addEventListener("change", () => applyInputValue(input));
    input.addEventListener("blur", () => applyInputValue(input));
  });
}

function hydrateGnatSettingInputs({ root = null, settings = null } = {}) {
  if (!root || !settings) return;
  root.querySelectorAll("[data-gnat-setting], [data-gnat-range]").forEach((input) => {
    const path = input.getAttribute("data-gnat-setting") || input.getAttribute("data-gnat-range") || "";
    const value = getPathValue(settings, path);
    if (value != null && Number.isFinite(Number(value))) input.value = String(value);
  });
}

function updateSelection({
  select = null,
  meta = null,
  viewportLabel = null,
  previewRoot = null,
  behaviorReadout = null,
  personalityReadout = null,
  spawnReadout = null,
  runtimeReadout = null,
  previewRegistry = null,
  gnatSettingsRef = null,
  preserveSettings = false,
} = {}) {
  const selectedId = String(select && select.value || ENEMY_WORKSHOP_SURFACES[0]?.id || "");
  const surface = ENEMY_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || ENEMY_WORKSHOP_SURFACES[0] || null;
  if (gnatSettingsRef && (!preserveSettings || !gnatSettingsRef.value)) {
    gnatSettingsRef.value = cloneSettings(surface && surface.gnat ? surface.gnat : {});
  }
  const gnatSettings = gnatSettingsRef && gnatSettingsRef.value ? gnatSettingsRef.value : surface && surface.gnat || {};
  if (viewportLabel) viewportLabel.textContent = surface ? String(surface.label || surface.id) : "Enemy";
  if (meta) meta.textContent = formatEnemyWorkshopMeta(surface);
  hydrateGnatSettingInputs({ root: globalThis.document, settings: gnatSettings });
  if (previewRoot && previewRegistry && typeof previewRegistry.renderPreview === "function") {
    previewRegistry.renderPreview({ surface, previewRoot, settings: gnatSettings });
  }
  if (behaviorReadout) behaviorReadout.textContent = formatEnemyWorkshopBehaviorReadout(gnatSettings);
  if (personalityReadout) personalityReadout.textContent = formatEnemyWorkshopPersonalityReadout(gnatSettings);
  if (spawnReadout) spawnReadout.textContent = formatEnemyWorkshopSpawnReadout(gnatSettings);
  if (runtimeReadout) runtimeReadout.textContent = formatEnemyWorkshopRuntimeReadout(surface);
}

if (globalThis.document) bootEnemyWorkshop();
