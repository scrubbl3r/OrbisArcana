import { renderLabWorkspaceNav } from "../shell/lab-workspaces.js";
import {
  connectProjectFolder,
  downloadTextFile,
  refreshProjectConnectUi,
  saveTextToConnectedProjectDrafts,
  saveTextToConnectedProjectPath,
  saveTextToProjectFile,
} from "../shell/lab-project-io.js";
import {
  createLabProfileStore,
  loadLabProfileStore,
  persistLabProfileStore,
} from "../shell/lab-profile-store.js";
import { ENEMY_WORKSHOP_SURFACES } from "./enemy-surfaces.js";
import {
  buildEnemyDraftPayload,
  buildGnatSwarmEnemyModule,
  ENEMY_WORKSHOP_TARGETS,
} from "./enemy-workshop-publish.js";
import { createEnemyWorkshopPreviewRegistry } from "./enemy-workshop-preview-registry.js?v=20260513a";
import {
  formatEnemyWorkshopRuntimeReadout,
  formatEnemyWorkshopSwarmReadout,
} from "./enemy-workshop-readouts.js?v=20260513a";

const DRAFT_STORAGE_KEY = "orbis.enemyWorkshop.drafts.v1";

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

function defaultSettingsForSurface(surface = null) {
  return {
    gnat: cloneSettings(surface && surface.gnat ? surface.gnat : {}),
    swarm: cloneSettings(surface && surface.swarm ? surface.swarm : {}),
  };
}

function migrateEnemySettings(settings = {}) {
  const next = cloneSettings(settings);
  const idle = next.gnat && next.gnat.idle || {};
  const personality = next.gnat && next.gnat.personalityRanges || {};
  if (!next.swarm || typeof next.swarm !== "object") next.swarm = {};
  if (next.swarm.spawnRadiusBo == null && Number.isFinite(Number(idle.idleRadiusBo))) {
    next.swarm.spawnRadiusBo = Number(idle.idleRadiusBo);
  }
  if (!Array.isArray(next.swarm.baseSpeedBoPerSec)) {
    const base = Number(idle.baseSpeedBoPerSec);
    const max = Number(idle.maxSpeedBoPerSec);
    if (Number.isFinite(base) || Number.isFinite(max)) {
      next.swarm.baseSpeedBoPerSec = [
        Number.isFinite(base) ? base : max,
        Number.isFinite(max) ? max : base,
      ];
    }
  }
  if (Array.isArray(personality.speed) && personality.speed.some((value) => Number(value) > 10)) {
    personality.speed = personality.speed.map((value) => Number(value) > 10 ? Number(value) / 100 : Number(value));
  }
  if (!Array.isArray(personality.segmentDwellSec)) {
    personality.segmentDwellSec = [0, 0];
  }
  if (!next.swarm.spawnCurves || typeof next.swarm.spawnCurves !== "object") {
    next.swarm.spawnCurves = {};
  }
  if (!next.swarm.spawnCurves.wanderChancePerMinute || typeof next.swarm.spawnCurves.wanderChancePerMinute !== "object") {
    next.swarm.spawnCurves.wanderChancePerMinute = { bias: -0.25, amount: 0.45 };
  }
  if (!next.swarm.spawnCurves.wanderRangeBo || typeof next.swarm.spawnCurves.wanderRangeBo !== "object") {
    next.swarm.spawnCurves.wanderRangeBo = { bias: 0, amount: 0 };
  }
  return next;
}

function mergeSettings(defaults = {}, overrides = {}) {
  const out = cloneSettings(defaults);
  const apply = (target, source) => {
    if (!source || typeof source !== "object") return target;
    Object.entries(source).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(target, key)) return;
      if (Array.isArray(value)) {
        target[key] = value.slice();
        return;
      }
      if (value && typeof value === "object") {
        target[key] = apply(target[key] && typeof target[key] === "object" ? target[key] : {}, value);
        return;
      }
      target[key] = value;
    });
    return target;
  };
  return apply(out, overrides);
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
  initAuthoringTabs(root);
  const previewRegistry = createEnemyWorkshopPreviewRegistry();
  const gnatSettingsRef = { value: null };
  const draftStore = createLabProfileStore();
  loadLabProfileStore(DRAFT_STORAGE_KEY, draftStore);
  let projectRootDirHandle = null;
  const select = root.querySelector("[data-enemy-workshop-enemy-select]");
  const previewRoot = root.querySelector("[data-enemy-workshop-preview-root]");
  const swarmReadout = root.querySelector("[data-enemy-workshop-swarm-readout]");
  const runtimeReadout = root.querySelector("[data-enemy-workshop-runtime-readout]");
  const actionStatus = root.querySelector("[data-enemy-workshop-action-status]");
  const projectIo = createEnemyProjectIo({
    root,
    getProjectRootDirHandle: () => projectRootDirHandle,
    setProjectRootDirHandle: (dirHandle) => { projectRootDirHandle = dirHandle; },
  });
  bindTopbarActions({
    root,
    actionStatus,
    draftStore,
    select,
    gnatSettingsRef,
    projectIo,
  });
  bindGnatSettingInputs({
    root,
    gnatSettingsRef,
    update: () => updateSelection({
      select,
      previewRoot,
      swarmReadout,
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
    select.addEventListener("change", () => {
      gnatSettingsRef.value = null;
      restoreSavedDraft({ select, gnatSettingsRef, draftStore, root });
      updateSelection({
        select,
        previewRoot,
        swarmReadout,
        runtimeReadout,
        previewRegistry,
        gnatSettingsRef,
        preserveSettings: !!gnatSettingsRef.value,
      });
    });
  }
  updateSelection({
    select,
    previewRoot,
    swarmReadout,
    runtimeReadout,
    previewRegistry,
    gnatSettingsRef,
  });
  restoreSavedDraft({ select, gnatSettingsRef, draftStore, root });
  updateSelection({
    select,
    previewRoot,
    swarmReadout,
    runtimeReadout,
    previewRegistry,
    gnatSettingsRef,
    preserveSettings: true,
  });
}

function initAuthoringTabs(root = globalThis.document) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  const setActive = (tabId = "gnat") => {
    root.querySelectorAll("[data-authoring-tab]").forEach((tab) => {
      const active = tab.getAttribute("data-authoring-tab") === tabId;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    root.querySelectorAll("[data-authoring-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-authoring-panel") !== tabId;
    });
  };
  root.querySelectorAll("[data-authoring-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setActive(tab.getAttribute("data-authoring-tab") || "gnat"));
  });
  setActive("gnat");
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

function setActionStatus(actionStatus = null, message = "Ready") {
  if (actionStatus) actionStatus.textContent = message;
}

function selectedSurface(select = null) {
  const selectedId = String(select && select.value || ENEMY_WORKSHOP_SURFACES[0]?.id || "");
  return ENEMY_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || ENEMY_WORKSHOP_SURFACES[0] || null;
}

function createEnemyProjectIo({
  root = null,
  getProjectRootDirHandle = () => null,
  setProjectRootDirHandle = () => {},
} = {}) {
  const connectProjectBtn = root ? root.querySelector("[data-enemy-workshop-connect]") : null;
  const refreshUi = () => refreshProjectConnectUi({
    connectProjectBtn,
    projectRootDirHandle: getProjectRootDirHandle(),
    connectedTitle: `Connected. Publish writes to ${ENEMY_WORKSHOP_TARGETS.gnatSwarm.join("/")}`,
    disconnectedTitle: "Connect repo root for one-click enemy publish.",
  });
  const connect = () => connectProjectFolder({
    showDirectoryPicker: window.showDirectoryPicker ? window.showDirectoryPicker.bind(window) : null,
    onConnected: setProjectRootDirHandle,
    refreshProjectConnectUi: refreshUi,
  });
  refreshUi();
  return Object.freeze({
    connect,
    refreshUi,
    saveDraft: (filename, text) => saveTextToConnectedProjectDrafts({
      projectRootDirHandle: getProjectRootDirHandle(),
      draftPathParts: ENEMY_WORKSHOP_TARGETS.drafts,
      filename,
      text,
    }),
    savePath: (pathParts, text) => saveTextToConnectedProjectPath({
      projectRootDirHandle: getProjectRootDirHandle(),
      pathParts,
      text,
    }),
    hasConnection: () => !!getProjectRootDirHandle(),
  });
}

function buildDraftRecord({ select = null, gnatSettingsRef = null } = {}) {
  const surface = selectedSurface(select);
  const settings = gnatSettingsRef && gnatSettingsRef.value ? gnatSettingsRef.value : defaultSettingsForSurface(surface);
  if (!surface) return null;
  return {
    value: String(surface.id || "gnat-swarm"),
    label: String(surface.label || "Gnat Swarm"),
    savedAtMs: Date.now(),
    enemy: cloneSettings(settings),
  };
}

function saveDraft({ draftStore, select, gnatSettingsRef, actionStatus }) {
  const record = buildDraftRecord({ select, gnatSettingsRef });
  if (!record) return null;
  draftStore.profilesByValue[record.value] = record;
  draftStore.activeValue = record.value;
  persistLabProfileStore(DRAFT_STORAGE_KEY, draftStore);
  setActionStatus(actionStatus, `Saved ${record.label}`);
  return record;
}

function restoreSavedDraft({ select = null, gnatSettingsRef = null, draftStore = null } = {}) {
  const surface = selectedSurface(select);
  const value = String(surface && surface.id || "");
  const record = draftStore && draftStore.profilesByValue ? draftStore.profilesByValue[value] : null;
  if (record && gnatSettingsRef) {
    const savedSettings = record.enemy || {
      gnat: record.gnat || {},
      swarm: record.swarm || {},
    };
    gnatSettingsRef.value = mergeSettings(defaultSettingsForSurface(surface), migrateEnemySettings(savedSettings));
  }
}

async function publishEnemy({ select, gnatSettingsRef, projectIo, actionStatus }) {
  const surface = selectedSurface(select);
  if (!surface) return;
  const enemySettings = cloneSettings(gnatSettingsRef && gnatSettingsRef.value ? gnatSettingsRef.value : defaultSettingsForSurface(surface));
  const moduleText = buildGnatSwarmEnemyModule({ surface, enemySettings });
  const draftPayload = buildEnemyDraftPayload({ surface, enemySettings });
  const filename = `${String(surface.id || "gnat-swarm")}.enemy.json`;
  const draftText = JSON.stringify(draftPayload, null, 2);

  try {
    if (!projectIo.hasConnection() && window.showDirectoryPicker) {
      const connected = await projectIo.connect();
      if (!connected) {
        setActionStatus(actionStatus, "Publish canceled");
        return;
      }
    }
    if (projectIo.hasConnection()) {
      const wroteModule = await projectIo.savePath(ENEMY_WORKSHOP_TARGETS.gnatSwarm, moduleText);
      const wroteDraft = await projectIo.saveDraft(filename, draftText);
      if (wroteModule) {
        setActionStatus(actionStatus, wroteDraft ? "Published enemy + draft" : "Published enemy");
        window.alert(`Published ${surface.label || surface.id} to ${ENEMY_WORKSHOP_TARGETS.gnatSwarm.join("/")}`);
        return;
      }
    }
    const fileSaved = await saveTextToProjectFile("gnat-swarm.js", moduleText, {
      description: "Enemy module",
      accept: { "text/javascript": [".js"] },
    });
    if (fileSaved) {
      setActionStatus(actionStatus, "Saved enemy module");
      return;
    }
    downloadTextFile("gnat-swarm.js", moduleText, "text/javascript;charset=utf-8");
    setActionStatus(actionStatus, "Downloaded enemy module");
  } catch (err) {
    if (err && err.name === "AbortError") {
      setActionStatus(actionStatus, "Publish canceled");
      return;
    }
    console.error(err);
    downloadTextFile("gnat-swarm.js", moduleText, "text/javascript;charset=utf-8");
    setActionStatus(actionStatus, "Downloaded fallback");
  }
}

function bindTopbarActions({
  root = null,
  actionStatus = null,
  draftStore = null,
  select = null,
  gnatSettingsRef = null,
  projectIo = null,
} = {}) {
  if (!root) return;
  const saveBtn = root.querySelector("[data-enemy-workshop-save]");
  const connectBtn = root.querySelector("[data-enemy-workshop-connect]");
  const publishBtn = root.querySelector("[data-enemy-workshop-publish]");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveDraft({ draftStore, select, gnatSettingsRef, actionStatus }));
  }
  if (connectBtn && projectIo) {
    connectBtn.addEventListener("click", () => {
      void projectIo.connect().then((connected) => {
        setActionStatus(actionStatus, connected ? "Project connected" : "Connect canceled");
      });
    });
  }
  if (publishBtn && projectIo) {
    publishBtn.addEventListener("click", () => {
      saveDraft({ draftStore, select, gnatSettingsRef, actionStatus });
      void publishEnemy({ select, gnatSettingsRef, projectIo, actionStatus });
    });
  }
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
  previewRoot = null,
  swarmReadout = null,
  runtimeReadout = null,
  previewRegistry = null,
  gnatSettingsRef = null,
  preserveSettings = false,
} = {}) {
  const selectedId = String(select && select.value || ENEMY_WORKSHOP_SURFACES[0]?.id || "");
  const surface = ENEMY_WORKSHOP_SURFACES.find((entry) => entry.id === selectedId) || ENEMY_WORKSHOP_SURFACES[0] || null;
  if (gnatSettingsRef && (!preserveSettings || !gnatSettingsRef.value)) {
    gnatSettingsRef.value = defaultSettingsForSurface(surface);
  }
  const gnatSettings = gnatSettingsRef && gnatSettingsRef.value ? gnatSettingsRef.value : defaultSettingsForSurface(surface);
  hydrateGnatSettingInputs({ root: globalThis.document, settings: gnatSettings });
  if (previewRoot && previewRegistry && typeof previewRegistry.renderPreview === "function") {
    previewRegistry.renderPreview({ surface, previewRoot, settings: gnatSettings });
  }
  if (swarmReadout) swarmReadout.textContent = formatEnemyWorkshopSwarmReadout(gnatSettings);
  if (runtimeReadout) runtimeReadout.textContent = formatEnemyWorkshopRuntimeReadout(surface);
}

if (globalThis.document) bootEnemyWorkshop();
