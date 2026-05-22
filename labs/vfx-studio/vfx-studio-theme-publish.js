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

export async function readTextFromConnectedProjectPath({ projectRootDirHandle, pathParts }) {
  if (!projectRootDirHandle || !Array.isArray(pathParts) || !pathParts.length) return "";
  let dir = projectRootDirHandle;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    dir = await dir.getDirectoryHandle(String(pathParts[i] || ""));
  }
  const fileName = String(pathParts[pathParts.length - 1] || "");
  if (!fileName) return "";
  const fileHandle = await dir.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return file.text();
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

function colorHexValue(v, fallback = 0xffffff) {
  return hexLiteral(v, fallback);
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
    case "bubble-shield-3d":
      return [
        "export const BUBBLE_SHIELD_3D_PRESET_DEFAULT = Object.freeze({",
        `  durationMs: ${Math.round(toNum(p.durationMs, p.shield3dMs || 5000))},`,
        `  diameterRatio: ${toNum(p.startDiameterRatio, p.diameterRatio || p.shield3dDiameterRatio || 1.24).toFixed(2)},`,
        `  startDiameterRatio: ${toNum(p.startDiameterRatio, p.diameterRatio || p.shield3dDiameterRatio || 1.24).toFixed(2)},`,
        `  endDiameterRatio: ${toNum(p.endDiameterRatio, p.shield3dEndDiameterRatio || 1.8).toFixed(2)},`,
        `  transitionMs: ${Math.round(toNum(p.transitionMs, p.shield3dTransitionMs || 420))},`,
        `  overshoot: ${toNum(p.overshoot, p.shield3dOvershoot || 0.12).toFixed(2)},`,
        `  jiggleFrequency: ${toNum(p.jiggleFrequency, p.shield3dJiggleFrequency || 18).toFixed(2)},`,
        `  jiggleDecay: ${toNum(p.jiggleDecay, p.shield3dJiggleDecay || 7).toFixed(2)},`,
        `  alpha: ${toNum(p.alpha, p.shield3dAlpha || 1).toFixed(2)},`,
        `  pulseMs: ${Math.round(toNum(p.pulseMs, p.shield3dPulseMs || 80))},`,
        `  pulseMin: ${toNum(p.pulseMin, p.shield3dPulseMin || 0.3).toFixed(2)},`,
        `  pulseMax: ${toNum(p.pulseMax, p.shield3dPulseMax || 1).toFixed(2)},`,
        `  simplexScale: ${toNum(p.simplexScale, p.shield3dSimplexScale || 0.85).toFixed(2)},`,
        `  simplexSpeed: ${toNum(p.simplexSpeed, p.shield3dSimplexSpeed || 6).toFixed(2)},`,
        `  simplexDensityBottom: ${toNum(p.simplexDensityBottom, p.shield3dSimplexDensityBottom || 0).toFixed(2)},`,
        `  simplexDensityTop: ${toNum(p.simplexDensityTop, p.shield3dSimplexDensityTop || 0.3).toFixed(2)},`,
        `  simplexContrast: ${toNum(p.simplexContrast, p.shield3dSimplexContrast || 0.6).toFixed(2)},`,
        `  simplexOctaves: ${Math.round(toNum(p.simplexOctaves, p.shield3dSimplexOctaves || 3))},`,
        `  simplexLacunarity: ${toNum(p.simplexLacunarity, p.shield3dSimplexLacunarity || 1.1).toFixed(2)},`,
        `  simplexGain: ${toNum(p.simplexGain, p.shield3dSimplexGain || 0.3).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    case "shockwave-3d":
      return [
        "export const SHOCKWAVE_3D_PRESET_DEFAULT = Object.freeze({",
        `  sphereCount: ${Math.round(toNum(p.sphereCount, 2))},`,
        `  spawnMs: ${Math.round(toNum(p.spawnMs, 100))},`,
        `  expandMs: ${Math.round(toNum(p.expandMs, 100))},`,
        `  decayMs: ${Math.round(toNum(p.decayMs, 100))},`,
        `  startRatio: ${toNum(p.startRatio, 1).toFixed(2)},`,
        `  endRatio: ${toNum(p.endRatio, 2.7).toFixed(2)},`,
        `  icoDetail: ${Math.round(toNum(p.icoDetail, 5))},`,
        `  fresnelPower: ${toNum(p.fresnelPower, 7).toFixed(2)},`,
        `  centerAlpha: ${toNum(p.centerAlpha, 0.01).toFixed(2)},`,
        `  rimAlpha: ${toNum(p.rimAlpha, 0.62).toFixed(2)},`,
        `  luminanceBoost: ${toNum(p.luminanceBoost, 1.45).toFixed(2)},`,
        `  colorR: ${Math.round(clampNum(p.colorR, 0, 255, 255))},`,
        `  colorG: ${Math.round(clampNum(p.colorG, 0, 255, 255))},`,
        `  colorB: ${Math.round(clampNum(p.colorB, 0, 255, 255))},`,
        `  colorA: ${clampNum(p.colorA, 0, 1, 0.75).toFixed(2)},`,
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
    case "heal":
      return [
        "export const HEAL_PRESET_DEFAULT = Object.freeze({",
        `  globeCost: ${Math.round(clampNum(p.healGlobeCost, 0, 999, 1))},`,
        `  healAmountHp: ${Math.round(clampNum(p.healAmountHp, 1, 100000, 500))},`,
        `  castDurationMs: ${Math.round(clampNum(p.healCastDurationMs, 0, 60000, 250))},`,
        `  cooldownMs: ${Math.round(clampNum(p.healCooldownMs, 0, 600000, 1000))},`,
        `  requireDamagedOrb: ${p.healRequireDamagedOrb === false ? "false" : "true"},`,
        `  consumeOnFailedCast: ${p.healConsumeOnFailedCast === true ? "true" : "false"},`,
        `  shaderPulseLuminanceBoostPct: ${Math.round(clampNum(p.healShaderLuminanceBoostPct, 0, 300, 25))},`,
        `  shaderPulseCenterAlphaPct: ${Math.round(clampNum(p.healShaderCenterAlphaPct, 0, 300, 10))},`,
        `  shaderPulsePointLightIntensityPct: ${Math.round(clampNum(p.healShaderPointLightIntensityPct, 0, 300, 25))},`,
        `  shaderPulsePointLightDistancePct: ${Math.round(clampNum(p.healShaderPointLightDistancePct, 0, 300, 10))},`,
        `  shaderPulseGoldMixPct: ${Math.round(clampNum(p.healShaderGoldMixPct, 0, 300, 25))},`,
        `  shaderPulseDurationMs: ${Math.round(clampNum(p.healShaderPulseDurationMs, 80, 10000, 150))},`,
        `  shaderPulseEasing: ${JSON.stringify(String(p.healShaderPulseEasing || "easeInOutQuad"))},`,
        "});",
        "",
      ].join("\n");
    case "flame-aoe-3d":
    case "electric-aoe-3d": {
      const isElectric3d = String(baseEffect || "") === "electric-aoe-3d";
      const keys = [
        "durationMs",
        "dominantBoltControlPointDiameterBo",
        "dominantBoltHeadingMemory", "dominantBoltMaxStepBo", "dominantBoltMinStepBo", "dominantBoltPathJitterBo",
        "dominantBoltPointSpacingBo", "dominantBoltSeekStrength", "dominantBoltTargetRadiusBo",
        "dominantBoltWanderStrength", "dominantBoltZBo",
        "haloBoltCurveMin", "haloBoltCurveMax", "haloBoltFrequency", "haloBoltDetail", "haloBoltCrawl",
        "haloBoltSmoothing", "haloBoltTension",
        "haloFieldLingerMinMs", "haloFieldLingerMaxMs", "haloFieldLingerDrift", "haloFieldEnabled", "haloFieldPointCount",
        "haloFieldReversalChance", "haloFieldSeed",
        "haloFieldShellRadiusBo", "haloFieldWander", "haloFieldWanderDurationMinMs", "haloFieldWanderDurationMaxMs",
        "haloFieldWanderSpeedMin", "haloFieldWanderSpeedMax", "haloFieldZMinBo", "haloFieldZMaxBo",
        "aoeAuraDiameterBo", "aoeAuraSoftness", "aoeAuraR", "aoeAuraG", "aoeAuraB", "aoeAuraA",
        "auraAlpha", "auraScale", "auraPulse", "auraNoiseScale", "auraNoiseSpeed", "auraFresnelPower", "auraR", "auraG", "auraB",
        "wakeLengthBo", "wakeRadiusBo", "wakeSubdivisions",
        "wakeLeanAmount", "wakeLeanLag",
        "wakeLiftBo", "wakeLiftCoreRadiusBo", "wakeStretchStrength",
        "wakeOrbHugRadiusBo", "wakeEnvelopeBlendBo",
        "wakeDisplaceEnabled",
        "wakeDisplaceBo", "wakeDisplaceScale", "wakeDisplaceSpeed", "wakeDisplaceSoftness", "wakeDisplaceInfluenceBottom", "wakeDisplaceInfluenceTop",
        "wakeNoiseScale", "wakeNoiseSpeed", "wakeNoiseDensityBottom", "wakeNoiseDensityTop", "wakeNoiseContrast", "wakeNoiseOctaves", "wakeNoiseLacunarity", "wakeNoiseGain",
        "wakeSimplexScale", "wakeSimplexSpeed", "wakeSimplexDensityBottom", "wakeSimplexDensityTop", "wakeSimplexContrast", "wakeSimplexOctaves", "wakeSimplexLacunarity", "wakeSimplexGain",
        "wakeNoiseMix", "wakeGraphEnabled",
      ];
      const optionalKeys = [];
      for (let i = 0; i < 4; i += 1) {
        optionalKeys.push(
          `wakeGraph${i}Pct`, `wakeGraph${i}R`, `wakeGraph${i}G`, `wakeGraph${i}B`, `wakeGraph${i}A`,
          `wakeAlphaGradient${i}Pct`, `wakeAlphaGradient${i}A`
        );
      }
      const settings = {};
      keys.forEach((key) => {
        if (p[key] == null || String(p[key]).trim() === "") return;
        const value = Number(p[key]);
        settings[key] = Number.isFinite(value) ? value : p[key];
      });
      if (settings.durationMs == null) settings.durationMs = 10000;
      optionalKeys.forEach((key) => {
        if (p[key] == null || String(p[key]).trim() === "") {
          settings[key] = "";
          return;
        }
        const value = Number(p[key]);
        settings[key] = Number.isFinite(value) ? value : p[key];
      });
      const exportName = isElectric3d ? "ELECTRIC_AOE_3D_PRESET_DEFAULT" : "FLAME_AOE_3D_PRESET_DEFAULT";
      return `export const ${exportName} = Object.freeze(${JSON.stringify(settings, null, 2)});\n`;
    }
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
    case "orb-lifecycle-3d": {
      const colorHex = (prefix, fallback) => {
        const r = Math.round(toNum(p[`${prefix}R`], (fallback >> 16) & 255));
        const g = Math.round(toNum(p[`${prefix}G`], (fallback >> 8) & 255));
        const b = Math.round(toNum(p[`${prefix}B`], fallback & 255));
        return `0x${[r, g, b].map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0")).join("")}`;
      };
      return [
        "export const ORB_LIFECYCLE_3D_DEFAULTS = Object.freeze({",
        `  maxHits: ${Math.round(clampNum(p.orbLifecycle3dHitTotal, 1, 1000, 10))},`,
        `  erosionSeed: ${Math.round(clampNum(p.orbLifecycle3dSeed, 1, 999999999, 1001))},`,
        `  shellLuminanceBoostMinPct: ${Math.round(clampNum(p.orbLifecycle3dLuminanceBoostMinPct, 0, 300, 80))},`,
        `  shellLuminanceBoostMaxPct: ${Math.round(clampNum(p.orbLifecycle3dLuminanceBoostMaxPct, 0, 300, 120))},`,
        `  shellCenterAlphaMinPct: ${Math.round(clampNum(p.orbLifecycle3dCenterAlphaMinPct, 0, 300, 87))},`,
        `  shellCenterAlphaMaxPct: ${Math.round(clampNum(p.orbLifecycle3dCenterAlphaMaxPct, 0, 300, 120))},`,
        `  pointLightIntensityMinPct: ${Math.round(clampNum(p.orbLifecycle3dPointLightIntensityMinPct, 0, 300, 0))},`,
        `  pointLightIntensityMaxPct: ${Math.round(clampNum(p.orbLifecycle3dPointLightIntensityMaxPct, 0, 300, 121))},`,
        `  pointLightDistanceMinPct: ${Math.round(clampNum(p.orbLifecycle3dPointLightDistanceMinPct, 0, 300, 93))},`,
        `  pointLightDistanceMaxPct: ${Math.round(clampNum(p.orbLifecycle3dPointLightDistanceMaxPct, 0, 300, 109))},`,
        `  goldMixMinPct: ${Math.round(clampNum(p.orbLifecycle3dGoldMixMinPct, 0, 300, 100))},`,
        `  goldMixMaxPct: ${Math.round(clampNum(p.orbLifecycle3dGoldMixMaxPct, 0, 300, 100))},`,
        "  crackColor: 0xffffff,",
        `  crackAlpha: ${clampNum(p.orbLifecycle3dCrackAlpha, 0, 1, 0.92).toFixed(2)},`,
        "  crackWidthPx: 1.50,",
        "  crackLiftBO: 0.000,",
        `  noiseScale: ${clampNum(p.orbLifecycle3dNoiseScale, 0.1, 24, 2.2).toFixed(2)},`,
        `  noiseContrast: ${clampNum(p.orbLifecycle3dNoiseContrast, 0.05, 3, 0.65).toFixed(2)},`,
        `  noiseOctaves: ${Math.round(clampNum(p.orbLifecycle3dNoiseOctaves, 1, 8, 5))},`,
        `  noiseLacunarity: ${clampNum(p.orbLifecycle3dNoiseLacunarity, 1.05, 4, 2.05).toFixed(2)},`,
        `  noiseGain: ${clampNum(p.orbLifecycle3dNoiseGain, 0.05, 0.95, 0.5).toFixed(2)},`,
        `  detailScale: ${clampNum(p.orbLifecycle3dDetailScale, 0.1, 48, 8.5).toFixed(2)},`,
        `  detailAmount: ${clampNum(p.orbLifecycle3dDetailAmount, 0, 1, 0.32).toFixed(2)},`,
        `  coverageStart: ${clampNum(p.orbLifecycle3dCoverageStart, 0, 1, 0.08).toFixed(2)},`,
        `  coverageEnd: ${clampNum(p.orbLifecycle3dCoverageEnd, 0, 1, 0.78).toFixed(2)},`,
        `  growthCurve: ${clampNum(p.orbLifecycle3dGrowthCurve, 0.1, 5, 1.08).toFixed(2)},`,
        `  edgeLightBrightness: ${clampNum(p.orbLifecycle3dEdgeLightBrightness, 0, 1, 1).toFixed(2)},`,
        `  edgeLightRange: ${clampNum(p.orbLifecycle3dEdgeLightRange, 0.2, 24, 1.85).toFixed(2)},`,
        `  holeEdgeSoftness: ${clampNum(p.orbLifecycle3dHoleEdgeSoftness, 0, 8, 1).toFixed(2)},`,
        "  criticalGlow: 0.25,",
        "  energyColor: 0x05070a,",
        "  mutationSpeed: 0.00,",
        "  mutationAmount: 0.00,",
        "  diffuseWash: 0.00,",
        "  edgeBrightness: 0.00,",
        "  cellDarkness: 1.35,",
        "  cellSharpness: 1.85,",
        "  detailEmergence: 0.00,",
        `  particleCount: ${Math.round(toNum(p.orbLifecycle3dParticleCount, 72))},`,
        `  particleColor: ${colorHex("orbLifecycle3dParticle", 0xdff7ff)},`,
        `  particleSizePx: ${Math.max(0.5, toNum(p.orbLifecycle3dParticleSize, 4.5)).toFixed(2)},`,
        `  particleSpeedMinBO: ${clampNum(p.orbLifecycle3dParticleSpeedMin, 0, 16, 1.35).toFixed(2)},`,
        `  particleSpeedMaxBO: ${clampNum(p.orbLifecycle3dParticleSpeedMax, 0, 16, 4.25).toFixed(2)},`,
        `  particleDrag: ${clampNum(p.orbLifecycle3dParticleDrag, 0, 12, 2.8).toFixed(2)},`,
        `  particleTtlMs: ${Math.round(toNum(p.orbLifecycle3dParticleTtl, 1050))},`,
        "});",
        "",
      ].join("\n");
    }
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
    case "orb-globe-3d": {
      const boDistance = (value, fallback) => {
        const n = toNum(value, fallback);
        return n > 4 ? n / 150 : n;
      };
      const boPerSec = (value, fallback) => {
        const n = toNum(value, fallback);
        return n > 20 ? n / 150 : n;
      };
      return [
        "export const ORB_GLOBE_3D_VISUAL_DEFAULTS = Object.freeze({",
        `  orbitDistanceBO: ${boDistance(p.orbGlobe3dOrbitDistanceRatio, 1.07).toFixed(2)},`,
        `  orbitDistanceMinBO: ${boDistance(p.orbGlobe3dOrbitDistanceMin, 0.02).toFixed(2)},`,
        `  orbitSpeedMinHz: ${toNum(p.orbGlobe3dSpeedMin, 0.25).toFixed(2)},`,
        `  orbitSpeedMaxHz: ${toNum(p.orbGlobe3dSpeedMax, 0.30).toFixed(2)},`,
        `  orbitDriftMinHz: ${toNum(p.orbGlobe3dDriftMin, 0.50).toFixed(2)},`,
        `  orbitDriftMaxHz: ${toNum(p.orbGlobe3dDriftMax, 1.00).toFixed(2)},`,
        `  innerSpeedMinBOPerSec: ${boPerSec(p.orbGlobe3dInnerSpeedMin, 3.67).toFixed(2)},`,
        `  innerSpeedMaxBOPerSec: ${boPerSec(p.orbGlobe3dInnerSpeedMax, 4.53).toFixed(2)},`,
        `  innerDriftMin: ${toNum(p.orbGlobe3dInnerDriftMin, 0.08).toFixed(2)},`,
        `  innerDriftMax: ${toNum(p.orbGlobe3dInnerDriftMax, 0.28).toFixed(2)},`,
        `  innerPaddingBO: ${boDistance(p.orbGlobe3dInnerPaddingRatio, 0.11).toFixed(2)},`,
        "});",
        "",
      ].join("\n");
    }
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
        `  liftReleaseThreshold01: ${toNum(p.liftReleaseThreshold01, 0.15).toFixed(2)},`,
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
    case "world-globe-3d": {
      const colorHex = (prefix, fallback) => {
        const r = Math.round(toNum(p[`${prefix}R`], (fallback >> 16) & 255));
        const g = Math.round(toNum(p[`${prefix}G`], (fallback >> 8) & 255));
        const b = Math.round(toNum(p[`${prefix}B`], fallback & 255));
        return `0x${[r, g, b].map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0")).join("")}`;
      };
      return [
        "export const WORLD_GLOBE_3D_VISUAL_DEFAULTS = Object.freeze({",
        "  idle: Object.freeze({",
        `    diameterBO: ${toNum(p.worldGlobe3dIdleDiameterRatio, 0.35).toFixed(2)},`,
        `    driftRangeBO: ${toNum(p.worldGlobe3dIdleDriftRatio, 0.10).toFixed(2)},`,
        `    bobRangeBO: ${toNum(p.worldGlobe3dIdleBobRatio, 0.07).toFixed(2)},`,
        `    bobHz: ${toNum(p.worldGlobe3dIdleBobHz, 0.65).toFixed(2)},`,
        `    pulseScale: ${toNum(p.worldGlobe3dIdlePulseScale, 0.045).toFixed(3)},`,
        `    pulseHz: ${toNum(p.worldGlobe3dIdlePulseHz, 0.9).toFixed(2)},`,
        "  }),",
        "  collected: Object.freeze({",
        `    diameterBO: ${toNum(p.worldGlobe3dCollectedDiameterRatio, 0.17).toFixed(2)},`,
        "  }),",
        "  consumed: Object.freeze({",
        `    diameterBO: ${toNum(p.worldGlobe3dConsumedDiameterRatio, 0.10).toFixed(2)},`,
        "  }),",
        "  material: Object.freeze({",
        `    shellBaseColor: ${colorHex("worldGlobe3dShellBase", 0xfbfdff)},`,
        `    shellCyanColor: ${colorHex("worldGlobe3dShellCyan", 0x9af5ff)},`,
        `    shellVioletColor: ${colorHex("worldGlobe3dShellViolet", 0xd9c6ff)},`,
        `    shellGoldColor: ${colorHex("worldGlobe3dShellGold", 0xffd86a)},`,
        `    shellFresnelPower: ${toNum(p.worldGlobe3dShellFresnelPower, 2.7).toFixed(3)},`,
        `    shellRimAlphaPower: ${toNum(p.worldGlobe3dShellRimAlphaPower, 0.82).toFixed(3)},`,
        `    shellCenterAlpha: ${toNum(p.worldGlobe3dShellCenterAlpha, 0.028).toFixed(4)},`,
        `    shellRimAlpha: ${toNum(p.worldGlobe3dShellRimAlpha, 0.86).toFixed(3)},`,
        `    shellPastelMix: ${toNum(p.worldGlobe3dShellPastelMix, 0.72).toFixed(3)},`,
        `    shellRimPastelMix: ${toNum(p.worldGlobe3dShellRimPastelMix, 0.42).toFixed(3)},`,
        `    shellLuminanceBoost: ${toNum(p.worldGlobe3dShellLuminanceBoost, 1.42).toFixed(3)},`,
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

export function buildFlameAoe3dBehaviorModule(params) {
  const p = params && typeof params === "object" ? params : {};
  return [
    "export const FLAME_AOE_BEHAVIOR_DEFAULT = Object.freeze({",
    "  enabled: true,",
    `  visualProfile: ${JSON.stringify(String(p.visualProfile || "spellfire"))},`,
    `  hitRadiusBo: ${toNum(p.hitRadiusBo, 4.5).toFixed(2)},`,
    `  wakeReachScale: ${toNum(p.wakeReachScale, 1).toFixed(2)},`,
    `  igniteDamage: ${toNum(p.igniteDamage, 1).toFixed(2)},`,
    `  igniteBurnDps: ${toNum(p.igniteBurnDps, 0.35).toFixed(2)},`,
    `  igniteDurationMs: ${Math.round(toNum(p.igniteDurationMs, 3200))},`,
    `  roastDps: ${toNum(p.roastDps, 1.25).toFixed(2)},`,
    `  roastTickMs: ${Math.round(toNum(p.roastTickMs, 250))},`,
    "});",
    "",
  ].join("\n");
}

export function buildElectricAoe3dBehaviorModule(params) {
  const p = params && typeof params === "object" ? params : {};
  return [
    "export const ELECTRIC_AOE_BEHAVIOR_DEFAULT = Object.freeze({",
    `  dominantBoltDamageMax: ${toNum(p.dominantBoltDamageMax, 0.3).toFixed(2)},`,
    `  dominantBoltDamageMin: ${toNum(p.dominantBoltDamageMin, 0.1).toFixed(2)},`,
    `  dominantBoltDetourRatioMax: ${toNum(p.dominantBoltDetourRatioMax, 1.4).toFixed(2)},`,
    `  dominantBoltEnemyFrequencyMaxMs: ${Math.round(toNum(p.dominantBoltEnemyFrequencyMaxMs, 1200))},`,
    `  dominantBoltEnemyFrequencyMinMs: ${Math.round(toNum(p.dominantBoltEnemyFrequencyMinMs, 450))},`,
    `  dominantBoltEnemyMaxRangeBo: ${toNum(p.dominantBoltEnemyMaxRangeBo, 9).toFixed(2)},`,
    `  dominantBoltEnemyMinRangeBo: ${toNum(p.dominantBoltEnemyMinRangeBo, 1).toFixed(2)},`,
    `  dominantBoltEnvironmentFrequencyMaxMs: ${Math.round(toNum(p.dominantBoltEnvironmentFrequencyMaxMs, 1800))},`,
    `  dominantBoltEnvironmentFrequencyMinMs: ${Math.round(toNum(p.dominantBoltEnvironmentFrequencyMinMs, 700))},`,
    `  dominantBoltMaxRangeBo: ${toNum(p.dominantBoltMaxRangeBo ?? p.dominantBoltRangeBo, 7).toFixed(2)},`,
    `  dominantBoltMinRangeBo: ${toNum(p.dominantBoltMinRangeBo, 4).toFixed(2)},`,
    "  enabled: true,",
    `  spellDurationMs: ${Math.round(toNum(p.spellDurationMs ?? p.durationMs, 10000))},`,
    `  visualProfile: ${JSON.stringify(String(p.visualProfile || "spellstorm"))},`,
    `  hitRadiusBo: ${toNum(p.hitRadiusBo, 2.5).toFixed(2)},`,
    `  wakeReachScale: ${toNum(p.wakeReachScale, 1).toFixed(2)},`,
    `  shockDamage: ${toNum(p.shockDamage ?? p.igniteDamage, 0.1).toFixed(2)},`,
    `  shockDps: ${toNum(p.shockDps ?? p.igniteBurnDps, 1).toFixed(2)},`,
    `  shockDurationMs: ${Math.round(toNum(p.shockDurationMs ?? p.igniteDurationMs, 10000))},`,
    `  arcDps: ${toNum(p.arcDps ?? p.roastDps, 1).toFixed(2)},`,
    `  arcTickMs: ${Math.round(toNum(p.arcTickMs ?? p.roastTickMs, 50))},`,
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
