export function downloadTextFile(filename, text) {
  const blob = new Blob([String(text || "")], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function refreshProjectConnectUi({ connectProjectBtn, projectRootDirHandle }) {
  if (!connectProjectBtn) return;
  const connected = !!projectRootDirHandle;
  connectProjectBtn.textContent = connected ? "Project Connected" : "Connect Project";
  connectProjectBtn.title = connected
    ? "Connected. Publish writes to src/vfx/presets/drafts/"
    : "Connect repo root for one-click publish";
}

export async function connectProjectFolder({ showDirectoryPicker, onConnected, refreshProjectConnectUi }) {
  if (!showDirectoryPicker) {
    window.alert("This browser does not support project-folder connect. Publish will fall back to file save/download.");
    return false;
  }
  try {
    const dirHandle = await showDirectoryPicker({ mode: "readwrite" });
    if (!dirHandle) return false;
    onConnected(dirHandle);
    refreshProjectConnectUi();
    return true;
  } catch (err) {
    if (err && err.name === "AbortError") return false;
    console.error(err);
    window.alert("Could not connect the project folder.");
    return false;
  }
}

export async function getOrCreateSubdir(parentHandle, name) {
  return parentHandle.getDirectoryHandle(String(name || ""), { create: true });
}

export async function saveTextToConnectedProjectDrafts({ projectRootDirHandle, draftPathParts, filename, text }) {
  if (!projectRootDirHandle) return false;
  let dir = projectRootDirHandle;
  for (const part of draftPathParts) {
    dir = await getOrCreateSubdir(dir, part);
  }
  const fileHandle = await dir.getFileHandle(String(filename || "preset.json"), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(String(text || ""));
  await writable.close();
  return true;
}

export async function saveTextToConnectedProjectPath({ projectRootDirHandle, pathParts, text }) {
  if (!projectRootDirHandle || !Array.isArray(pathParts) || !pathParts.length) return false;
  let dir = projectRootDirHandle;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    dir = await getOrCreateSubdir(dir, pathParts[i]);
  }
  const fileName = String(pathParts[pathParts.length - 1] || "");
  if (!fileName) return false;
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(String(text || ""));
  await writable.close();
  return true;
}

export async function saveTextToProjectFile(filename, text) {
  if (!window.showSaveFilePicker) {
    return false;
  }
  const handle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [{
      description: "JSON preset draft",
      accept: { "application/json": [".json"] },
    }],
  });
  const writable = await handle.createWritable();
  await writable.write(String(text || ""));
  await writable.close();
  return true;
}

export function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function buildLivePresetModuleForBaseEffect(baseEffect, params, electricDefaults) {
  const p = params && typeof params === "object" ? params : {};
  switch (String(baseEffect || "")) {
    case "shockwave":
      return [
        "export const SHOCKWAVE_PRESET_DEFAULT = Object.freeze({",
        `  startR: ${Math.round(toNum(p.startR, 43))},`,
        `  endR: ${Math.round(toNum(p.endR, 169))},`,
        `  rings: ${Math.round(toNum(p.rings, 2))},`,
        `  spawnMs: ${Math.round(toNum(p.spawn, 105))},`,
        `  stroke: ${Math.round(toNum(p.stroke, 4))},`,
        `  decayMs: ${Math.round(toNum(p.decay, 150))},`,
        "});",
        "",
      ].join("\n");
    case "bubble-shield":
      return [
        "export const BUBBLE_SHIELD_PRESET_DEFAULT = Object.freeze({",
        `  durationMs: ${Math.round(toNum(p.shieldMs, 1170))},`,
        `  alpha: ${toNum(p.shieldAlpha, 1).toFixed(2)},`,
        `  pulseMs: ${Math.round(toNum(p.pulseMs, 80))},`,
        `  pulseMin: ${toNum(p.pulseMin, 0.3).toFixed(2)},`,
        `  pulseMax: ${toNum(p.pulseMax, 1).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "flame-aoe":
      return [
        "export const FLAME_AOE_PRESET_DEFAULT = Object.freeze({",
        `  diameter: ${Math.round(toNum(p.flameD, 200))},`,
        `  durationMs: ${Math.round(toNum(p.flameMs, 10000))},`,
        "});",
        "",
      ].join("\n");
    case "electric-aoe":
      return [
        "export const ELECTRIC_AOE_PRESET_DEFAULT = Object.freeze({",
        `  startR: ${Math.round(toNum(p.electricStartR, 80))},`,
        `  endR: ${Math.round(toNum(p.electricEndR, 200))},`,
        `  durationMs: ${Math.round(toNum(p.electricMs, 10000))},`,
        `  nodeCount: ${Math.round(toNum(electricDefaults && electricDefaults.nodeCount, 13))},`,
        `  particleCount: ${Math.round(toNum(electricDefaults && electricDefaults.particleCount, 340))},`,
        `  particleSpeed: ${toNum(electricDefaults && electricDefaults.particleSpeed, 0.62).toFixed(2)},`,
        `  maxBoltJumpSq: ${Math.round(toNum(electricDefaults && electricDefaults.maxBoltJumpSq, 1200))},`,
        `  startJitterRatio: ${toNum(electricDefaults && electricDefaults.startJitterRatio, 0.30).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "orb-shatter":
      return [
        "export const ORB_SHATTER_PRESET_DEFAULT = Object.freeze({});",
        "",
      ].join("\n");
    default:
      return "";
  }
}

export function applyLabThemeDefaults({
  theme,
  applyGameThemeCssVars,
  GEOM,
  els,
  clamp,
  evenPx,
  bubbleShieldPresetDefault,
  shockwavePresetDefault,
  flameAoePresetDefault,
  electricAoePresetDefault,
}) {
  if (!theme || typeof theme !== "object") return;
  applyGameThemeCssVars(theme);

  if (theme.orb) {
    if (theme.orb.diameterPx != null) GEOM.orbD = evenPx(theme.orb.diameterPx, 2, 2000);
    if (theme.orb.strokeWidthPx != null) GEOM.orbStroke = evenPx(theme.orb.strokeWidthPx, 2, 40);
  }
  if (theme.shield) {
    if (theme.shield.diameterPx != null) GEOM.shieldD = evenPx(theme.shield.diameterPx, 2, 2000);
    if (theme.shield.strokeWidthPx != null) GEOM.shieldStroke = evenPx(theme.shield.strokeWidthPx, 2, 40);
    if (els.shieldAlpha && theme.shield.alpha != null) els.shieldAlpha.value = String(clamp(theme.shield.alpha, 0, 1));
    if (els.pulseMs && theme.shield.pulseMs != null) els.pulseMs.value = String(Math.round(clamp(theme.shield.pulseMs, 20, 700)));
    if (els.pulseMin && theme.shield.pulseMin != null) els.pulseMin.value = String(clamp(theme.shield.pulseMin, 0, 1).toFixed(2));
    if (els.pulseMax && theme.shield.pulseMax != null) els.pulseMax.value = String(clamp(theme.shield.pulseMax, 0, 1).toFixed(2));
  }
  if (bubbleShieldPresetDefault) {
    if (els.shieldMs) els.shieldMs.value = String(Math.round(clamp(bubbleShieldPresetDefault.durationMs, 80, 1200)));
    if (els.shieldAlpha) els.shieldAlpha.value = String(clamp(bubbleShieldPresetDefault.alpha, 0, 1).toFixed(2));
    if (els.pulseMs) els.pulseMs.value = String(Math.round(clamp(bubbleShieldPresetDefault.pulseMs, 20, 700)));
    if (els.pulseMin) els.pulseMin.value = String(clamp(bubbleShieldPresetDefault.pulseMin, 0, 1).toFixed(2));
    if (els.pulseMax) els.pulseMax.value = String(clamp(bubbleShieldPresetDefault.pulseMax, 0, 1).toFixed(2));
  }
  if (theme.shockwave && els.stroke && theme.shockwave.strokeWidthPx != null) {
    els.stroke.value = String(evenPx(theme.shockwave.strokeWidthPx, 2, 20));
  }
  if (shockwavePresetDefault) {
    if (els.startR) els.startR.value = String(Math.round(clamp(shockwavePresetDefault.startR, 1, 1000)));
    if (els.endR) els.endR.value = String(Math.round(clamp(shockwavePresetDefault.endR, 1, 1000)));
    if (els.rings) els.rings.value = String(Math.round(clamp(shockwavePresetDefault.rings, 1, 6)));
    if (els.spawn) els.spawn.value = String(Math.round(clamp(shockwavePresetDefault.spawnMs, 1, 700)));
    if (els.decay) els.decay.value = String(Math.round(clamp(shockwavePresetDefault.decayMs, 40, 2000)));
    if (els.stroke) els.stroke.value = String(evenPx(shockwavePresetDefault.stroke, 2, 20));
  }
  if (els.flameD && flameAoePresetDefault) {
    els.flameD.value = String(evenPx(clamp(flameAoePresetDefault.diameter, 120, 900), 2, 2000));
  }
  if (els.flameMs && flameAoePresetDefault) {
    els.flameMs.value = String(Math.round(clamp(flameAoePresetDefault.durationMs, 200, 60000)));
  }
  if (els.electricMs && electricAoePresetDefault) {
    els.electricMs.value = String(Math.round(clamp(electricAoePresetDefault.durationMs, 200, 60000)));
  }
  if (els.electricStartR && electricAoePresetDefault) {
    els.electricStartR.value = String(Math.round(clamp(electricAoePresetDefault.startR, 2, 500)));
  }
  if (els.electricEndR && electricAoePresetDefault) {
    els.electricEndR.value = String(Math.round(clamp(electricAoePresetDefault.endR, 8, 1000)));
  }
}
