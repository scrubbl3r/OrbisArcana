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

function clampNum(v, min, max, fallback = 0) {
  return Math.max(min, Math.min(max, toNum(v, fallback)));
}

function hexLiteral(v, fallback = 0xffffff) {
  const n = Math.max(0, Math.min(0xffffff, Math.round(toNum(v, fallback))));
  return `0x${n.toString(16).padStart(6, "0")}`;
}

export function buildLivePresetModuleForBaseEffect(baseEffect, params, electricDefaults) {
  const p = params && typeof params === "object" ? params : {};
  switch (String(baseEffect || "")) {
    case "shockwave":
      return [
        "export const SHOCKWAVE_PRESET_DEFAULT = Object.freeze({",
        `  color: Object.freeze({ r: ${Math.round(clampNum(p.shockR, 0, 255, 255))}, g: ${Math.round(clampNum(p.shockG, 0, 255, 255))}, b: ${Math.round(clampNum(p.shockB, 0, 255, 255))}, a: ${clampNum(p.shockA, 0, 1, 0.65).toFixed(2)} }),`,
        `  startRatio: ${toNum(p.shockStartRatio, 0.43).toFixed(2)},`,
        `  endRatio: ${toNum(p.shockEndRatio, 1.69).toFixed(2)},`,
        `  rings: ${Math.round(toNum(p.rings, 2))},`,
        `  spawnMs: ${Math.round(toNum(p.spawn, 105))},`,
        `  strokeRatio: ${toNum(p.shockStrokeRatio, 0.04).toFixed(3)},`,
        `  decayMs: ${Math.round(toNum(p.decay, 150))},`,
        "});",
        "",
      ].join("\n");
    case "bubble-shield":
      return [
        "export const BUBBLE_SHIELD_PRESET_DEFAULT = Object.freeze({",
        `  durationMs: ${Math.round(toNum(p.shieldMs, 8000))},`,
        `  colorRgb: Object.freeze({ r: ${Math.round(clampNum(p.shieldR, 0, 255, 120))}, g: ${Math.round(clampNum(p.shieldG, 0, 255, 210))}, b: ${Math.round(clampNum(p.shieldB, 0, 255, 255))} }),`,
        `  diameterRatio: ${toNum(p.shieldDiameterRatio, 1.24).toFixed(2)},`,
        `  strokeWidthRatio: ${toNum(p.shieldStrokeRatio, 0.04).toFixed(3)},`,
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
        `  diameterRatio: ${toNum(p.flameDiameterRatio, 1.24).toFixed(2)},`,
        `  durationMs: ${Math.round(toNum(p.flameMs, 10000))},`,
        `  stroke: Object.freeze({ r: ${Math.round(clampNum(p.flameStrokeR, 0, 255, 255))}, g: ${Math.round(clampNum(p.flameStrokeG, 0, 255, 96))}, b: ${Math.round(clampNum(p.flameStrokeB, 0, 255, 24))}, a: ${clampNum(p.flameStrokeA, 0, 1, 1).toFixed(2)} }),`,
        `  fill: Object.freeze({ r: ${Math.round(clampNum(p.flameFillR, 0, 255, 255))}, g: ${Math.round(clampNum(p.flameFillG, 0, 255, 96))}, b: ${Math.round(clampNum(p.flameFillB, 0, 255, 24))}, a: ${clampNum(p.flameFillA, 0, 1, 0.2).toFixed(2)} }),`,
        "});",
        "",
      ].join("\n");
    case "electric-aoe":
      return [
        "export const ELECTRIC_AOE_PRESET_DEFAULT = Object.freeze({",
        `  startRatio: ${toNum(p.electricStartRatio, 0.83).toFixed(2)},`,
        `  endRatio: ${toNum(p.electricEndRatio, 2.0).toFixed(2)},`,
        `  durationMs: ${Math.round(toNum(p.electricMs, 10000))},`,
        `  nodeCount: ${Math.round(toNum(electricDefaults && electricDefaults.nodeCount, 13))},`,
        `  particleCount: ${Math.round(toNum(electricDefaults && electricDefaults.particleCount, 340))},`,
        `  particleSpeed: ${toNum(electricDefaults && electricDefaults.particleSpeed, 0.62).toFixed(2)},`,
        `  maxBoltJumpSq: ${Math.round(toNum(electricDefaults && electricDefaults.maxBoltJumpSq, 1200))},`,
        `  startJitterRatio: ${toNum(electricDefaults && electricDefaults.startJitterRatio, 0.30).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "teleport":
      return [
        "export const TELEPORT_PRESET_DEFAULT = Object.freeze({",
        `  orbTeleportFlickerOnMs: ${Math.round(toNum(p.orbTeleportFlickerOnMs, 60))},`,
        `  orbTeleportFlickerOffMs: ${Math.round(toNum(p.orbTeleportFlickerOffMs, 60))},`,
        `  orbTeleportFadeOutMs: ${Math.round(toNum(p.orbTeleportFadeOutMs, 280))},`,
        `  orbTeleportFadeInMs: ${Math.round(toNum(p.orbTeleportFadeInMs, 280))},`,
        "});",
        "",
      ].join("\n");
    case "orb-lifecycle":
      return [
        "export const ORB_LIFECYCLE_DEFAULTS = Object.freeze({",
        `  maxHits: ${Math.round(toNum(p.orbLifecycleHitTotal, 3))},`,
        `  maxShards: ${Math.round(toNum(p.orbLifecycleShardTotal, 16))},`,
        "  shardStrokeRgb: Object.freeze({",
        `    r: ${Math.round(clampNum(p.orbLifecycleShardR, 0, 255, 255))},`,
        `    g: ${Math.round(clampNum(p.orbLifecycleShardG, 0, 255, 255))},`,
        `    b: ${Math.round(clampNum(p.orbLifecycleShardB, 0, 255, 255))},`,
        "  }),",
        `  shardStrokeAlpha: ${clampNum(p.orbLifecycleShardA, 0, 1, 0.46).toFixed(2)},`,
        `  shardStrokeWidthPx: ${Math.max(0.25, toNum(p.orbLifecycleShardStroke, 1)).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "orb-base":
      return [
        "export const ORB_BASE_VISUAL_DEFAULTS = Object.freeze({",
        `  diameterPx: ${Math.round(toNum(p.orbBaseD, 100))},`,
        `  radiusPx: ${Math.round(toNum(p.orbBaseD, 100) * 0.5)},`,
        `  strokeWidthPx: ${Math.round(toNum(p.orbBaseStroke, 2))},`,
        "  strokeDefaultRgb: Object.freeze({",
        `    r: ${Math.round(toNum(p.orbBaseStrokeR, 255))},`,
        `    g: ${Math.round(toNum(p.orbBaseStrokeG, 255))},`,
        `    b: ${Math.round(toNum(p.orbBaseStrokeB, 255))},`,
        "  }),",
        `  strokeAlpha: ${toNum(p.orbBaseStrokeAlpha, 1).toFixed(2)},`,
        "  fillDefaultRgb: Object.freeze({",
        `    r: ${Math.round(toNum(p.orbBaseFillR, 255))},`,
        `    g: ${Math.round(toNum(p.orbBaseFillG, 255))},`,
        `    b: ${Math.round(toNum(p.orbBaseFillB, 255))},`,
        "  }),",
        `  fillAlpha: ${toNum(p.orbBaseFillAlpha, 0.20).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "orb-globe":
      return [
        "export const ORB_GLOBE_VISUAL_DEFAULTS = Object.freeze({",
        `  orbitDistanceRatio: ${toNum(p.orbGlobeOrbitDistanceRatio, 1.10).toFixed(2)},`,
        `  orbitDistanceMinPx: ${Math.round(toNum(p.orbGlobeOrbitDistanceMin, 14))},`,
        `  orbitSpeedMin: ${toNum(p.orbGlobeSpeedMin, 1.8).toFixed(2)},`,
        `  orbitSpeedMax: ${toNum(p.orbGlobeSpeedMax, 2.45).toFixed(2)},`,
        `  orbitDriftMin: ${toNum(p.orbGlobeDriftMin, 0.03).toFixed(2)},`,
        `  orbitDriftMax: ${toNum(p.orbGlobeDriftMax, 0.18).toFixed(2)},`,
        `  innerSpeedMinPxPerSec: ${Math.round(toNum(p.orbGlobeInnerSpeedMin, 80))},`,
        `  innerSpeedMaxPxPerSec: ${Math.round(toNum(p.orbGlobeInnerSpeedMax, 150))},`,
        `  innerDriftMin: ${toNum(p.orbGlobeInnerDriftMin, 0.08).toFixed(2)},`,
        `  innerDriftMax: ${toNum(p.orbGlobeInnerDriftMax, 0.28).toFixed(2)},`,
        `  innerPaddingRatio: ${toNum(p.orbGlobeInnerPaddingRatio, 0.06).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "orb-3d":
      return [
        "export const ORB_3D_VISUAL_DEFAULTS = Object.freeze({",
        `  shellBaseColor: ${hexLiteral(p.shellBaseColor, 0xfbfdff)},`,
        `  shellCyanColor: ${hexLiteral(p.shellCyanColor, 0x8ff4ff)},`,
        `  shellVioletColor: ${hexLiteral(p.shellVioletColor, 0xd0b8ff)},`,
        `  shellGoldColor: ${hexLiteral(p.shellGoldColor, 0xffcc3f)},`,
        `  shellFresnelPower: ${toNum(p.shellFresnelPower, 3.15).toFixed(2)},`,
        `  shellRimAlphaPower: ${toNum(p.shellRimAlphaPower, 0.92).toFixed(2)},`,
        `  shellCenterAlpha: ${toNum(p.shellCenterAlpha, 0.015).toFixed(3)},`,
        `  shellRimAlpha: ${toNum(p.shellRimAlpha, 0.84).toFixed(2)},`,
        `  shellPastelMix: ${toNum(p.shellPastelMix, 0.84).toFixed(2)},`,
        `  shellRimPastelMix: ${toNum(p.shellRimPastelMix, 0.36).toFixed(2)},`,
        `  shellDriftPastelMix: ${toNum(p.shellDriftPastelMix, 0.08).toFixed(2)},`,
        `  shellLuminanceBoost: ${toNum(p.shellLuminanceBoost, 1.5).toFixed(2)},`,
        `  opalescenceSpeed: ${toNum(p.opalescenceSpeed, 9).toFixed(1)},`,
        `  driftScaleX: ${toNum(p.driftScaleX, 0.03).toFixed(3)},`,
        `  driftScaleY: ${toNum(p.driftScaleY, 0.036).toFixed(3)},`,
        `  driftScaleZ: ${toNum(p.driftScaleZ, 0.028).toFixed(3)},`,
        `  driftRateA: ${toNum(p.driftRateA, 0.42).toFixed(2)},`,
        `  driftRateB: ${toNum(p.driftRateB, -0.31).toFixed(2)},`,
        `  driftRateC: ${toNum(p.driftRateC, 0.24).toFixed(2)},`,
        `  driftPhaseB: ${toNum(p.driftPhaseB, 1.7).toFixed(2)},`,
        `  driftPhaseC: ${toNum(p.driftPhaseC, 3.1).toFixed(2)},`,
        `  goldMix: ${toNum(p.goldMix, 0.34).toFixed(2)},`,
        `  lightColor: ${hexLiteral(p.lightColor, 0xcfefff)},`,
        `  lightIntensity: ${toNum(p.lightIntensity, 120).toFixed(1)},`,
        `  lightDistanceBO: ${toNum(p.lightDistanceBO, 10).toFixed(2)},`,
        `  lightDecay: ${toNum(p.lightDecay, 1.35).toFixed(2)},`,
        `  lightPastelMix: ${toNum(p.lightPastelMix, 0.42).toFixed(2)},`,
        `  lightOffsetZBO: ${toNum(p.lightOffsetZBO, 0).toFixed(2)},`,
        `  lightCastShadow: ${p.lightCastShadow === false ? "false" : "true"},`,
        `  lightShadowMapSize: ${Math.round(toNum(p.lightShadowMapSize, 512))},`,
        `  lightShadowBias: ${toNum(p.lightShadowBias, -0.00025).toFixed(5)},`,
        `  lightShadowNormalBias: ${toNum(p.lightShadowNormalBias, 0.018).toFixed(3)},`,
        `  lightShadowNearBO: ${toNum(p.lightShadowNearBO, 0.08).toFixed(2)},`,
        `  lightShadowFarBO: ${toNum(p.lightShadowFarBO, 10).toFixed(2)},`,
        `  shadowSpotEnabled: ${p.shadowSpotEnabled === true ? "true" : "false"},`,
        `  shadowSpotColor: ${hexLiteral(p.shadowSpotColor, 0xdaf6ff)},`,
        `  shadowSpotIntensity: ${toNum(p.shadowSpotIntensity, 24).toFixed(1)},`,
        `  shadowSpotDistanceBO: ${toNum(p.shadowSpotDistanceBO, 4.5).toFixed(2)},`,
        `  shadowSpotAngle: ${toNum(p.shadowSpotAngle, 0.48).toFixed(2)},`,
        `  shadowSpotPenumbra: ${toNum(p.shadowSpotPenumbra, 0.78).toFixed(2)},`,
        `  shadowSpotDecay: ${toNum(p.shadowSpotDecay, 1.4).toFixed(2)},`,
        `  shadowSpotMapSize: ${Math.round(toNum(p.shadowSpotMapSize, 512))},`,
        `  shadowSpotBias: ${toNum(p.shadowSpotBias, -0.00035).toFixed(5)},`,
        `  shadowSpotNormalBias: ${toNum(p.shadowSpotNormalBias, 0.018).toFixed(3)},`,
        "});",
        "",
      ].join("\n");
    case "orb-nod":
      return [
        "export const ORB_NOD_PRESET_DEFAULT = Object.freeze({",
        `  orbTemplateShrinkPct: ${toNum(p.orbTemplateShrinkPct, 6).toFixed(0)},`,
        `  orbTemplateDurationMs: ${Math.round(toNum(p.orbTemplateDurationMs, 200))},`,
        `  orbTemplateFillAlpha: ${toNum(p.orbTemplateFillAlpha, 0.07).toFixed(2)},`,
        `  orbTemplateWaveCount: ${toNum(p.orbTemplateWaveCount, 10).toFixed(0)},`,
        `  orbTemplateWaveDepthPx: ${toNum(p.orbTemplateWaveDepthPx, 10).toFixed(1)},`,
        `  orbTemplateOscillationSpeedHz: ${toNum(p.orbTemplateOscillationSpeedHz, 12).toFixed(1)},`,
        `  orbTemplateOscillationCount: ${toNum(p.orbTemplateOscillationCount, 2).toFixed(0)},`,
        "});",
        "",
      ].join("\n");
    case "orb-nod3d":
      return [
        "export const ORB_NOD_3D_PRESET_DEFAULT = Object.freeze({",
        `  orbNod3dShrinkPct: ${toNum(p.orbNod3dShrinkPct, 2).toFixed(0)},`,
        `  orbNod3dDurationMs: ${Math.round(toNum(p.orbNod3dDurationMs, 520))},`,
        `  orbNod3dFillAlpha: ${toNum(p.orbNod3dFillAlpha, 0.07).toFixed(2)},`,
        `  orbNod3dWaveCount: ${toNum(p.orbNod3dWaveCount, 4).toFixed(0)},`,
        `  orbNod3dLatitudinalBands: ${toNum(p.orbNod3dLatitudinalBands, 4).toFixed(0)},`,
        `  orbNod3dWaveDepthBO: ${toNum(p.orbNod3dWaveDepthBO, 0.024).toFixed(3)},`,
        `  orbNod3dOscillationSpeedHz: ${toNum(p.orbNod3dOscillationSpeedHz, 4.8).toFixed(1)},`,
        `  orbNod3dOscillationCount: ${toNum(p.orbNod3dOscillationCount, 2).toFixed(0)},`,
        `  orbNod3dEquatorFalloff: ${toNum(p.orbNod3dEquatorFalloff, 0).toFixed(2)},`,
        `  orbNod3dRippleSoftness: ${toNum(p.orbNod3dRippleSoftness, 0.82).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "orb-spawn":
      return [
        "export const ORB_SPAWN_PRESET_DEFAULT = Object.freeze({",
        `  bobRangeBO: ${toNum(p.bobRangeBO, 0.65).toFixed(2)},`,
        `  bobSpeedHz: ${toNum(p.bobSpeedHz, 0.65).toFixed(2)},`,
        `  driftRangeBO: ${toNum(p.driftRangeBO, 0.2).toFixed(2)},`,
        `  driftSpeedHz: ${toNum(p.driftSpeedHz, 0.23).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "world-globe": {
      const styleBlock = (name, prefix, fallbacks) => [
        `  ${name}: Object.freeze({`,
        `    diameterRatio: ${toNum(p[`${prefix}DiameterRatio`], fallbacks.diameterRatio).toFixed(2)},`,
        "    fillRgb: Object.freeze({",
        `      r: ${Math.round(toNum(p[`${prefix}FillR`], 255))},`,
        `      g: ${Math.round(toNum(p[`${prefix}FillG`], 214))},`,
        `      b: ${Math.round(toNum(p[`${prefix}FillB`], 64))},`,
        "    }),",
        `    fillAlpha: ${toNum(p[`${prefix}FillAlpha`], fallbacks.fillAlpha).toFixed(2)},`,
        "    strokeRgb: Object.freeze({",
        `      r: ${Math.round(toNum(p[`${prefix}StrokeR`], 255))},`,
        `      g: ${Math.round(toNum(p[`${prefix}StrokeG`], 214))},`,
        `      b: ${Math.round(toNum(p[`${prefix}StrokeB`], 64))},`,
        "    }),",
        `    strokeAlpha: ${toNum(p[`${prefix}StrokeAlpha`], 0.96).toFixed(2)},`,
        `    strokeWidthRatio: ${toNum(p[`${prefix}StrokeWidthRatio`], fallbacks.strokeWidthRatio).toFixed(3)},`,
      ];
      return [
        "export const WORLD_GLOBE_VISUAL_DEFAULTS = Object.freeze({",
        ...styleBlock("idle", "worldGlobeIdle", { diameterRatio: 0.25, strokeWidthRatio: 0, fillAlpha: 0.42 }),
        `    driftRatio: ${toNum(p.worldGlobeIdleDriftRatio, 0.10).toFixed(2)},`,
        `    bobRatio: ${toNum(p.worldGlobeIdleBobRatio, 0.07).toFixed(2)},`,
        `    bobHz: ${toNum(p.worldGlobeIdleBobHz, 0.65).toFixed(2)},`,
        `    pulseScale: ${toNum(p.worldGlobeIdlePulseScale, 0.045).toFixed(3)},`,
        `    pulseHz: ${toNum(p.worldGlobeIdlePulseHz, 0.9).toFixed(2)},`,
        "  }),",
        ...styleBlock("collected", "worldGlobeCollected", { diameterRatio: 0.14, strokeWidthRatio: 0.02, fillAlpha: 0.42 }),
        "  }),",
        ...styleBlock("consumed", "worldGlobeConsumed", { diameterRatio: 0.11, strokeWidthRatio: 0.02, fillAlpha: 1 }),
        "  }),",
        "});",
        "",
      ].join("\n");
    }
    default:
      return "";
  }
}

export function buildTeleportBehaviorModule(params) {
  const p = params && typeof params === "object" ? params : {};
  return [
    "export const TELEPORT_BEHAVIOR_DEFAULT = Object.freeze({",
    `  cameraTravelMs: ${Math.round(toNum(p.orbTeleportCameraTravelMs ?? p.cameraTravelMs, 1500))},`,
    `  cameraEasing: ${JSON.stringify(String(p.cameraEasing || "easeInOutExpo"))},`,
    "  freezeDuringTeleport: true,",
    "  teleportAfterFadeOut: true,",
    "  grantGraceOnComplete: true,",
    "});",
    "",
  ].join("\n");
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
    if (els.shieldAlpha && theme.shield.alpha != null) els.shieldAlpha.value = String(clamp(theme.shield.alpha, 0, 1));
    if (els.pulseMs && theme.shield.pulseMs != null) els.pulseMs.value = String(Math.round(clamp(theme.shield.pulseMs, 20, 700)));
    if (els.pulseMin && theme.shield.pulseMin != null) els.pulseMin.value = String(clamp(theme.shield.pulseMin, 0, 1).toFixed(2));
    if (els.pulseMax && theme.shield.pulseMax != null) els.pulseMax.value = String(clamp(theme.shield.pulseMax, 0, 1).toFixed(2));
  }
  if (bubbleShieldPresetDefault) {
    if (els.shieldMs) els.shieldMs.value = String(Math.round(clamp(bubbleShieldPresetDefault.durationMs, 80, 120000)));
    if (els.shieldAlpha) els.shieldAlpha.value = String(clamp(bubbleShieldPresetDefault.alpha, 0, 1).toFixed(2));
    if (els.shieldDiameterRatio) {
      els.shieldDiameterRatio.value = String(clamp(bubbleShieldPresetDefault.diameterRatio, 0.1, 8).toFixed(2));
    }
    if (els.shieldStrokeRatio) {
      els.shieldStrokeRatio.value = String(clamp(bubbleShieldPresetDefault.strokeWidthRatio, 0.005, 1).toFixed(3));
    }
    if (els.pulseMs) els.pulseMs.value = String(Math.round(clamp(bubbleShieldPresetDefault.pulseMs, 20, 700)));
    if (els.pulseMin) els.pulseMin.value = String(clamp(bubbleShieldPresetDefault.pulseMin, 0, 1).toFixed(2));
    if (els.pulseMax) els.pulseMax.value = String(clamp(bubbleShieldPresetDefault.pulseMax, 0, 1).toFixed(2));
  }
  if (shockwavePresetDefault) {
    const shockColor = shockwavePresetDefault.color || {};
    if (els.shockStartRatio) {
      els.shockStartRatio.value = String(clamp(shockwavePresetDefault.startRatio, 0.01, 10).toFixed(2));
    }
    if (els.shockEndRatio) {
      els.shockEndRatio.value = String(clamp(shockwavePresetDefault.endRatio, 0.01, 20).toFixed(2));
    }
    if (els.rings) els.rings.value = String(Math.round(clamp(shockwavePresetDefault.rings, 1, 6)));
    if (els.spawn) els.spawn.value = String(Math.round(clamp(shockwavePresetDefault.spawnMs, 1, 700)));
    if (els.decay) els.decay.value = String(Math.round(clamp(shockwavePresetDefault.decayMs, 40, 2000)));
    if (els.shockStrokeRatio) {
      els.shockStrokeRatio.value = String(clamp(shockwavePresetDefault.strokeRatio, 0.005, 1).toFixed(3));
    }
    if (els.shockR) els.shockR.value = String(Math.round(clamp(shockColor.r, 0, 255)));
    if (els.shockG) els.shockG.value = String(Math.round(clamp(shockColor.g, 0, 255)));
    if (els.shockB) els.shockB.value = String(Math.round(clamp(shockColor.b, 0, 255)));
    if (els.shockA) els.shockA.value = String(clamp(shockColor.a, 0, 1).toFixed(2));
  }
  if (els.flameDiameterRatio && flameAoePresetDefault) {
    els.flameDiameterRatio.value = String(clamp(flameAoePresetDefault.diameterRatio, 0.1, 12).toFixed(2));
  }
  if (els.flameMs && flameAoePresetDefault) {
    els.flameMs.value = String(Math.round(clamp(flameAoePresetDefault.durationMs, 200, 60000)));
  }
  if (flameAoePresetDefault) {
    const flameStroke = flameAoePresetDefault.stroke || {};
    const flameFill = flameAoePresetDefault.fill || {};
    if (els.flameStrokeR) els.flameStrokeR.value = String(Math.round(clampNum(flameStroke.r, 0, 255, 255)));
    if (els.flameStrokeG) els.flameStrokeG.value = String(Math.round(clampNum(flameStroke.g, 0, 255, 96)));
    if (els.flameStrokeB) els.flameStrokeB.value = String(Math.round(clampNum(flameStroke.b, 0, 255, 24)));
    if (els.flameStrokeA) els.flameStrokeA.value = String(clampNum(flameStroke.a, 0, 1, 1).toFixed(2));
    if (els.flameFillR) els.flameFillR.value = String(Math.round(clampNum(flameFill.r, 0, 255, 255)));
    if (els.flameFillG) els.flameFillG.value = String(Math.round(clampNum(flameFill.g, 0, 255, 96)));
    if (els.flameFillB) els.flameFillB.value = String(Math.round(clampNum(flameFill.b, 0, 255, 24)));
    if (els.flameFillA) els.flameFillA.value = String(clampNum(flameFill.a, 0, 1, 0.2).toFixed(2));
  }
  if (els.electricMs && electricAoePresetDefault) {
    els.electricMs.value = String(Math.round(clamp(electricAoePresetDefault.durationMs, 200, 60000)));
  }
  if (els.electricStartRatio && electricAoePresetDefault) {
    els.electricStartRatio.value = String(clamp(electricAoePresetDefault.startRatio, 0.02, 5).toFixed(2));
  }
  if (els.electricEndRatio && electricAoePresetDefault) {
    els.electricEndRatio.value = String(clamp(electricAoePresetDefault.endRatio, 0.08, 12).toFixed(2));
  }
}
