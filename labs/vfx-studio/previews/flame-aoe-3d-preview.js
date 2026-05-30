import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS as ORB_MATERIAL_CONFIG } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";

const WAKE_SDF_TRAIL_POINT_COUNT = 5;
const WAKE_SDF_FIELD_EMITTER_COUNT = 9;
const WAKE_SDF_CONTROL_PARTICLE_COUNT = 64;
const WAKE_SDF_SOURCE_GRAPH_RADIUS = 0.82;

function createWakeSdfSourceGraph(count = 25) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : (index + 0.5) / count;
    const radius = Math.sqrt(t) * WAKE_SDF_SOURCE_GRAPH_RADIUS;
    const angle = index * goldenAngle;
    return Object.freeze([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }));
}

const WAKE_SDF_SOURCE_GRAPH = createWakeSdfSourceGraph();

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + (bo * 20));
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

const FLAME_AOE_3D_PREVIEW_DEFAULTS = Object.freeze({
  aoeAuraDiameterBo: 9,
  aoeAuraSoftness: 0.18,
  aoeAuraColor: 0xff6c18,
  aoeAuraA: 0.22,
  auraAlpha: 0.34,
  auraScale: 1.34,
  auraPulse: 0.08,
  auraNoiseScale: 1.55,
  auraNoiseSpeed: 0.24,
  auraFresnelPower: 1.35,
  auraColor: 0xff6a18,
  wakeMeshEnabled: 0,
  wakeLengthBo: 0.95,
  wakeRadiusBo: 0.5,
  wakeSubdivisions: 64,
  wakeLeanAmount: 80,
  wakeLeanLag: 40,
  wakeLiftBo: 1.1,
  wakeLiftCoreRadiusBo: 0.25,
  wakeStretchStrength: 1.35,
  wakeOrbHugRadiusBo: 0.22,
  wakeEnvelopeBlendBo: 0.06,
  wakeDisplaceEnabled: 1,
  wakeDisplaceBo: 0.12,
  wakeDisplaceScale: 1.8,
  wakeDisplaceSpeed: 0.35,
  wakeDisplaceSoftness: 0.7,
  wakeDisplaceInfluenceBottom: 0.35,
  wakeDisplaceInfluenceTop: 0.85,
  wakeNoiseScale: 2.35,
  wakeNoiseSpeed: 0.86,
  wakeNoiseDensityBottom: 0.52,
  wakeNoiseDensityTop: 0.52,
  wakeNoiseContrast: 0.16,
  wakeNoiseOctaves: 5,
  wakeNoiseLacunarity: 2.08,
  wakeNoiseGain: 0.52,
  wakeSimplexScale: 0.85,
  wakeSimplexSpeed: 2.2,
  wakeSimplexDensityBottom: 0.56,
  wakeSimplexDensityTop: 0.32,
  wakeSimplexContrast: 0.18,
  wakeSimplexOctaves: 4,
  wakeSimplexLacunarity: 2.25,
  wakeSimplexGain: 0.48,
  wakeNoiseMix: 0.35,
  wakeSdfEnabled: 1,
  wakeSdfHeightBo: 1.15,
  wakeSdfParticleLifeMs: 1500,
  wakeSdfSpawnRate: 43,
  wakeSdfSpawnAreaBo: 1,
  wakeSdfParticleRadiusBo: 0.16,
  wakeSdfLiftBias: 0.2,
  wakeSdfJitterBo: 0.04,
  wakeSdfHeatDecay: 1,
  wakeSdfDebugPoints: 1,
  wakeSdfRadiusBo: 0.42,
  wakeSdfCoreRadiusBo: 0.2,
  wakeSdfBlendBo: 0.12,
  wakeSdfSoftnessBo: 0.3,
  wakeSdfDensity: 0.64,
  wakeSdfPerlinScale: 2.35,
  wakeSdfPerlinSpeed: 0.86,
  wakeSdfPerlinContrast: 0.5,
  wakeSdfPerlinOctaves: 5,
  wakeSdfPerlinLacunarity: 2.08,
  wakeSdfPerlinGain: 0.52,
  wakeSdfNoiseBlackPoint: 0.18,
  wakeSdfNoiseWhitePoint: 0.86,
  wakeSdfRenderMode: 0,
  wakeSdfGraph0Pct: 0,
  wakeSdfGraph0R: 0,
  wakeSdfGraph0G: 0,
  wakeSdfGraph0B: 0,
  wakeSdfGraph0A: 0,
  wakeSdfGraph1Pct: 34,
  wakeSdfGraph1R: 255,
  wakeSdfGraph1G: 22,
  wakeSdfGraph1B: 0,
  wakeSdfGraph1A: 0.68,
  wakeSdfGraph2Pct: 68,
  wakeSdfGraph2R: 255,
  wakeSdfGraph2G: 148,
  wakeSdfGraph2B: 10,
  wakeSdfGraph2A: 0.92,
  wakeSdfGraph3Pct: 100,
  wakeSdfGraph3R: 255,
  wakeSdfGraph3G: 232,
  wakeSdfGraph3B: 120,
  wakeSdfGraph3A: 1,
  wakeGraph0Pct: 0,
  wakeGraph0R: 0,
  wakeGraph0G: 0,
  wakeGraph0B: 0,
  wakeGraph0A: 0,
  wakeGraph1Pct: 100,
  wakeGraph1R: 255,
  wakeGraph1G: 255,
  wakeGraph1B: 255,
  wakeGraph1A: 1,
  wakeGraph2Pct: "",
  wakeGraph2R: "",
  wakeGraph2G: "",
  wakeGraph2B: "",
  wakeGraph2A: "",
  wakeGraph3Pct: "",
  wakeGraph3R: "",
  wakeGraph3G: "",
  wakeGraph3B: "",
  wakeGraph3A: "",
  wakeGraphEnabled: true,
  wakeAlphaGradient0Pct: 0,
  wakeAlphaGradient0A: 1,
  wakeAlphaGradient1Pct: 100,
  wakeAlphaGradient1A: 1,
  wakeAlphaGradient2Pct: "",
  wakeAlphaGradient2A: "",
  wakeAlphaGradient3Pct: "",
  wakeAlphaGradient3A: "",
});

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function readByte(els, key, fallback) {
  return Math.round(clampNumber(els && els[key] && els[key].value, 0, 255, fallback));
}

function rgbFromFields(els, prefix, fallback) {
  const r = readByte(els, `${prefix}R`, (fallback >> 16) & 255);
  const g = readByte(els, `${prefix}G`, (fallback >> 8) & 255);
  const b = readByte(els, `${prefix}B`, fallback & 255);
  return (r << 16) + (g << 8) + b;
}

function readOptionalNumber(value, min, max) {
  if (value == null || String(value).trim() === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.max(min, Math.min(max, n));
}

function readWakeGraphConfig(els = {}) {
  const enabledInput = els.flameAoe3dWakeGraphEnabled;
  const enabledButton = els.flameAoe3dWakeGraphVisibleBtn;
  const out = {
    wakeGraphEnabled: enabledButton
      ? layerVisible(enabledButton)
      : !(enabledInput && String(enabledInput.value) === "0"),
  };
  for (let i = 0; i < 4; i += 1) {
    const fallbackPct = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeGraph${i}Pct`];
    const fallbackR = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeGraph${i}R`];
    const fallbackG = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeGraph${i}G`];
    const fallbackB = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeGraph${i}B`];
    const fallbackA = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeGraph${i}A`];
    const pctEl = els[`flameAoe3dWakeGraph${i}Pct`];
    const rEl = els[`flameAoe3dWakeGraph${i}R`];
    const gEl = els[`flameAoe3dWakeGraph${i}G`];
    const bEl = els[`flameAoe3dWakeGraph${i}B`];
    const aEl = els[`flameAoe3dWakeGraph${i}A`];
    out[`wakeGraph${i}Pct`] = readOptionalNumber(pctEl ? pctEl.value : fallbackPct, 0, 100);
    out[`wakeGraph${i}R`] = readOptionalNumber(rEl ? rEl.value : fallbackR, 0, 255);
    out[`wakeGraph${i}G`] = readOptionalNumber(gEl ? gEl.value : fallbackG, 0, 255);
    out[`wakeGraph${i}B`] = readOptionalNumber(bEl ? bEl.value : fallbackB, 0, 255);
    out[`wakeGraph${i}A`] = readOptionalNumber(aEl ? aEl.value : fallbackA, 0, 1);
  }
  for (let i = 0; i < 4; i += 1) {
    const fallbackPct = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeAlphaGradient${i}Pct`];
    const fallbackA = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeAlphaGradient${i}A`];
    const pctEl = els[`flameAoe3dWakeAlphaGradient${i}Pct`];
    const aEl = els[`flameAoe3dWakeAlphaGradient${i}A`];
    out[`wakeAlphaGradient${i}Pct`] = readOptionalNumber(pctEl ? pctEl.value : fallbackPct, 0, 100);
    out[`wakeAlphaGradient${i}A`] = readOptionalNumber(aEl ? aEl.value : fallbackA, 0, 1);
  }
  return out;
}

function readSdfGraphConfig(els = {}) {
  const out = {};
  for (let i = 0; i < 4; i += 1) {
    const fallbackPct = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeSdfGraph${i}Pct`];
    const fallbackR = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeSdfGraph${i}R`];
    const fallbackG = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeSdfGraph${i}G`];
    const fallbackB = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeSdfGraph${i}B`];
    const fallbackA = FLAME_AOE_3D_PREVIEW_DEFAULTS[`wakeSdfGraph${i}A`];
    const pctEl = els[`flameAoe3dWakeSdfGraph${i}Pct`];
    const rEl = els[`flameAoe3dWakeSdfGraph${i}R`];
    const gEl = els[`flameAoe3dWakeSdfGraph${i}G`];
    const bEl = els[`flameAoe3dWakeSdfGraph${i}B`];
    const aEl = els[`flameAoe3dWakeSdfGraph${i}A`];
    out[`wakeSdfGraph${i}Pct`] = readOptionalNumber(pctEl ? pctEl.value : fallbackPct, 0, 100);
    out[`wakeSdfGraph${i}R`] = readOptionalNumber(rEl ? rEl.value : fallbackR, 0, 255);
    out[`wakeSdfGraph${i}G`] = readOptionalNumber(gEl ? gEl.value : fallbackG, 0, 255);
    out[`wakeSdfGraph${i}B`] = readOptionalNumber(bEl ? bEl.value : fallbackB, 0, 255);
    out[`wakeSdfGraph${i}A`] = readOptionalNumber(aEl ? aEl.value : fallbackA, 0, 1);
  }
  return out;
}

function readFlameAuraConfig(els = {}) {
  return Object.freeze({
    aoeAuraDiameterBo: clampNumber(els.flameAoe3dAoeAuraDiameterBo && els.flameAoe3dAoeAuraDiameterBo.value, 0.05, 20, FLAME_AOE_3D_PREVIEW_DEFAULTS.aoeAuraDiameterBo),
    aoeAuraSoftness: clampNumber(els.flameAoe3dAoeAuraSoftness && els.flameAoe3dAoeAuraSoftness.value, 0.001, 0.6, FLAME_AOE_3D_PREVIEW_DEFAULTS.aoeAuraSoftness),
    aoeAuraColor: rgbFromFields(els, "flameAoe3dAoeAura", FLAME_AOE_3D_PREVIEW_DEFAULTS.aoeAuraColor),
    aoeAuraA: clampNumber(els.flameAoe3dAoeAuraA && els.flameAoe3dAoeAuraA.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.aoeAuraA),
    auraAlpha: clampNumber(els.flameAoe3dAuraAlpha && els.flameAoe3dAuraAlpha.value, 0, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraAlpha),
    auraScale: clampNumber(els.flameAoe3dAuraScale && els.flameAoe3dAuraScale.value, 0.5, 3, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraScale),
    auraPulse: clampNumber(els.flameAoe3dAuraPulse && els.flameAoe3dAuraPulse.value, 0, 0.4, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraPulse),
    auraNoiseScale: clampNumber(els.flameAoe3dAuraNoiseScale && els.flameAoe3dAuraNoiseScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraNoiseScale),
    auraNoiseSpeed: clampNumber(els.flameAoe3dAuraNoiseSpeed && els.flameAoe3dAuraNoiseSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraNoiseSpeed),
    auraFresnelPower: clampNumber(els.flameAoe3dAuraFresnelPower && els.flameAoe3dAuraFresnelPower.value, 0.1, 12, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraFresnelPower),
    auraColor: rgbFromFields(els, "flameAoe3dAura", FLAME_AOE_3D_PREVIEW_DEFAULTS.auraColor),
  });
}

function readFlameWakeConfig(els = {}) {
  return Object.freeze({
    wakeMeshEnabled: layerVisible(els.flameAoe3dWakeVisibleBtn) ? 1 : 0,
    wakeLengthBo: clampNumber(els.flameAoe3dWakeLengthBo && els.flameAoe3dWakeLengthBo.value, 0.05, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeLengthBo),
    wakeRadiusBo: clampNumber(els.flameAoe3dWakeRadiusBo && els.flameAoe3dWakeRadiusBo.value, 0.5, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeRadiusBo),
    wakeSubdivisions: Math.round(clampNumber(els.flameAoe3dWakeSubdivisions && els.flameAoe3dWakeSubdivisions.value, 12, 192, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSubdivisions)),
    wakeLeanAmount: clampNumber(els.flameAoe3dWakeLeanAmount && els.flameAoe3dWakeLeanAmount.value, 0, 100, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeLeanAmount),
    wakeLeanLag: clampNumber(els.flameAoe3dWakeLeanLag && els.flameAoe3dWakeLeanLag.value, 0, 100, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeLeanLag),
    wakeLiftBo: clampNumber(els.flameAoe3dWakeLiftBo && els.flameAoe3dWakeLiftBo.value, 0, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeLiftBo),
    wakeLiftCoreRadiusBo: clampNumber(els.flameAoe3dWakeLiftCoreRadiusBo && els.flameAoe3dWakeLiftCoreRadiusBo.value, 0.02, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeLiftCoreRadiusBo),
    wakeStretchStrength: clampNumber(els.flameAoe3dWakeStretchStrength && els.flameAoe3dWakeStretchStrength.value, 0, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeStretchStrength),
    wakeOrbHugRadiusBo: clampNumber(els.flameAoe3dWakeOrbHugRadiusBo && els.flameAoe3dWakeOrbHugRadiusBo.value, 0.01, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeOrbHugRadiusBo),
    wakeEnvelopeBlendBo: clampNumber(els.flameAoe3dWakeEnvelopeBlendBo && els.flameAoe3dWakeEnvelopeBlendBo.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeEnvelopeBlendBo),
    wakeDisplaceEnabled: layerVisible(els.flameAoe3dWakeDisplaceVisibleBtn) ? 1 : 0,
    wakeDisplaceBo: clampNumber(els.flameAoe3dWakeDisplaceBo && els.flameAoe3dWakeDisplaceBo.value, 0, 0.5, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeDisplaceBo),
    wakeDisplaceScale: clampNumber(els.flameAoe3dWakeDisplaceScale && els.flameAoe3dWakeDisplaceScale.value, 0.2, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeDisplaceScale),
    wakeDisplaceSpeed: clampNumber(els.flameAoe3dWakeDisplaceSpeed && els.flameAoe3dWakeDisplaceSpeed.value, 0, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeDisplaceSpeed),
    wakeDisplaceSoftness: clampNumber(els.flameAoe3dWakeDisplaceSoftness && els.flameAoe3dWakeDisplaceSoftness.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeDisplaceSoftness),
    wakeDisplaceInfluenceBottom: clampNumber(els.flameAoe3dWakeDisplaceInfluenceBottom && els.flameAoe3dWakeDisplaceInfluenceBottom.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeDisplaceInfluenceBottom),
    wakeDisplaceInfluenceTop: clampNumber(els.flameAoe3dWakeDisplaceInfluenceTop && els.flameAoe3dWakeDisplaceInfluenceTop.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeDisplaceInfluenceTop),
    wakeNoiseScale: clampNumber(els.flameAoe3dWakeNoiseScale && els.flameAoe3dWakeNoiseScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseScale),
    wakeNoiseSpeed: clampNumber(els.flameAoe3dWakeNoiseSpeed && els.flameAoe3dWakeNoiseSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseSpeed),
    wakeNoiseDensityBottom: clampNumber(els.flameAoe3dWakeNoiseDensityBottom && els.flameAoe3dWakeNoiseDensityBottom.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseDensityBottom),
    wakeNoiseDensityTop: clampNumber(els.flameAoe3dWakeNoiseDensityTop && els.flameAoe3dWakeNoiseDensityTop.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseDensityTop),
    wakeNoiseContrast: clampNumber(els.flameAoe3dWakeNoiseContrast && els.flameAoe3dWakeNoiseContrast.value, 0.02, 0.6, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseContrast),
    wakeNoiseOctaves: Math.round(clampNumber(els.flameAoe3dWakeNoiseOctaves && els.flameAoe3dWakeNoiseOctaves.value, 1, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseOctaves)),
    wakeNoiseLacunarity: clampNumber(els.flameAoe3dWakeNoiseLacunarity && els.flameAoe3dWakeNoiseLacunarity.value, 1.1, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseLacunarity),
    wakeNoiseGain: clampNumber(els.flameAoe3dWakeNoiseGain && els.flameAoe3dWakeNoiseGain.value, 0.1, 0.9, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseGain),
    wakeSimplexScale: clampNumber(els.flameAoe3dWakeSimplexScale && els.flameAoe3dWakeSimplexScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexScale),
    wakeSimplexSpeed: clampNumber(els.flameAoe3dWakeSimplexSpeed && els.flameAoe3dWakeSimplexSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexSpeed),
    wakeSimplexDensityBottom: clampNumber(els.flameAoe3dWakeSimplexDensityBottom && els.flameAoe3dWakeSimplexDensityBottom.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexDensityBottom),
    wakeSimplexDensityTop: clampNumber(els.flameAoe3dWakeSimplexDensityTop && els.flameAoe3dWakeSimplexDensityTop.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexDensityTop),
    wakeSimplexContrast: clampNumber(els.flameAoe3dWakeSimplexContrast && els.flameAoe3dWakeSimplexContrast.value, 0.02, 0.6, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexContrast),
    wakeSimplexOctaves: Math.round(clampNumber(els.flameAoe3dWakeSimplexOctaves && els.flameAoe3dWakeSimplexOctaves.value, 1, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexOctaves)),
    wakeSimplexLacunarity: clampNumber(els.flameAoe3dWakeSimplexLacunarity && els.flameAoe3dWakeSimplexLacunarity.value, 1.1, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexLacunarity),
    wakeSimplexGain: clampNumber(els.flameAoe3dWakeSimplexGain && els.flameAoe3dWakeSimplexGain.value, 0.1, 0.9, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexGain),
    wakeNoiseMix: clampNumber(els.flameAoe3dWakeNoiseMix && els.flameAoe3dWakeNoiseMix.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseMix),
    wakeSdfEnabled: els.flameAoe3dWakeSdfVisibleBtn && layerVisible(els.flameAoe3dWakeSdfVisibleBtn) ? 1 : 0,
    wakeSdfHeightBo: clampNumber(els.flameAoe3dWakeSdfHeightBo && els.flameAoe3dWakeSdfHeightBo.value, 0.1, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfHeightBo),
    wakeSdfParticleLifeMs: Math.round(clampNumber(els.flameAoe3dWakeSdfParticleLifeMs && els.flameAoe3dWakeSdfParticleLifeMs.value, 100, 8000, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfParticleLifeMs)),
    wakeSdfSpawnRate: clampNumber(els.flameAoe3dWakeSdfSpawnRate && els.flameAoe3dWakeSdfSpawnRate.value, 1, 240, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfSpawnRate),
    wakeSdfSpawnAreaBo: clampNumber(els.flameAoe3dWakeSdfSpawnAreaBo && els.flameAoe3dWakeSdfSpawnAreaBo.value, 0.1, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfSpawnAreaBo),
    wakeSdfParticleRadiusBo: clampNumber(els.flameAoe3dWakeSdfParticleRadiusBo && els.flameAoe3dWakeSdfParticleRadiusBo.value, 0.02, 1.5, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfParticleRadiusBo),
    wakeSdfLiftBias: clampNumber(els.flameAoe3dWakeSdfLiftBias && els.flameAoe3dWakeSdfLiftBias.value, -2, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfLiftBias),
    wakeSdfJitterBo: clampNumber(els.flameAoe3dWakeSdfJitterBo && els.flameAoe3dWakeSdfJitterBo.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfJitterBo),
    wakeSdfHeatDecay: clampNumber(els.flameAoe3dWakeSdfHeatDecay && els.flameAoe3dWakeSdfHeatDecay.value, 0.1, 6, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfHeatDecay),
    wakeSdfRadiusBo: clampNumber(els.flameAoe3dWakeSdfRadiusBo && els.flameAoe3dWakeSdfRadiusBo.value, 0.05, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfRadiusBo),
    wakeSdfCoreRadiusBo: clampNumber(els.flameAoe3dWakeSdfCoreRadiusBo && els.flameAoe3dWakeSdfCoreRadiusBo.value, 0.02, 3, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfCoreRadiusBo),
    wakeSdfBlendBo: FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfBlendBo,
    wakeSdfSoftnessBo: clampNumber(els.flameAoe3dWakeSdfSoftnessBo && els.flameAoe3dWakeSdfSoftnessBo.value, 0.001, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfSoftnessBo),
    wakeSdfDensity: clampNumber(els.flameAoe3dWakeSdfDensity && els.flameAoe3dWakeSdfDensity.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfDensity),
    wakeSdfPerlinScale: clampNumber(els.flameAoe3dWakeSdfPerlinScale && els.flameAoe3dWakeSdfPerlinScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfPerlinScale),
    wakeSdfPerlinSpeed: clampNumber(els.flameAoe3dWakeSdfPerlinSpeed && els.flameAoe3dWakeSdfPerlinSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfPerlinSpeed),
    wakeSdfPerlinContrast: clampNumber(els.flameAoe3dWakeSdfPerlinContrast && els.flameAoe3dWakeSdfPerlinContrast.value, 0, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfPerlinContrast),
    wakeSdfPerlinOctaves: Math.round(clampNumber(els.flameAoe3dWakeSdfPerlinOctaves && els.flameAoe3dWakeSdfPerlinOctaves.value, 1, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfPerlinOctaves)),
    wakeSdfPerlinLacunarity: clampNumber(els.flameAoe3dWakeSdfPerlinLacunarity && els.flameAoe3dWakeSdfPerlinLacunarity.value, 1.1, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfPerlinLacunarity),
    wakeSdfPerlinGain: clampNumber(els.flameAoe3dWakeSdfPerlinGain && els.flameAoe3dWakeSdfPerlinGain.value, 0.1, 0.9, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfPerlinGain),
    wakeSdfNoiseBlackPoint: clampNumber(els.flameAoe3dWakeSdfNoiseBlackPoint && els.flameAoe3dWakeSdfNoiseBlackPoint.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfNoiseBlackPoint),
    wakeSdfNoiseWhitePoint: clampNumber(els.flameAoe3dWakeSdfNoiseWhitePoint && els.flameAoe3dWakeSdfNoiseWhitePoint.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfNoiseWhitePoint),
    wakeSdfRenderMode: Math.round(clampNumber(els.flameAoe3dWakeSdfRenderMode && els.flameAoe3dWakeSdfRenderMode.value, 0, 10, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfRenderMode)),
    wakeSdfDebugPoints: Math.round(clampNumber(els.flameAoe3dWakeSdfDebugPoints && els.flameAoe3dWakeSdfDebugPoints.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSdfDebugPoints)),
    ...readSdfGraphConfig(els),
    ...readWakeGraphConfig(els),
  });
}

function hydrateFlameAuraFields(els = {}, cfg = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  if (els.flameAoe3dAoeAuraDiameterBo) els.flameAoe3dAoeAuraDiameterBo.value = String(Number(cfg.aoeAuraDiameterBo).toFixed(2));
  if (els.flameAoe3dAoeAuraSoftness) els.flameAoe3dAoeAuraSoftness.value = String(Number(cfg.aoeAuraSoftness).toFixed(3));
  if (els.flameAoe3dAoeAuraR) els.flameAoe3dAoeAuraR.value = String((cfg.aoeAuraColor >> 16) & 255);
  if (els.flameAoe3dAoeAuraG) els.flameAoe3dAoeAuraG.value = String((cfg.aoeAuraColor >> 8) & 255);
  if (els.flameAoe3dAoeAuraB) els.flameAoe3dAoeAuraB.value = String(cfg.aoeAuraColor & 255);
  if (els.flameAoe3dAoeAuraA) els.flameAoe3dAoeAuraA.value = String(Number(cfg.aoeAuraA).toFixed(2));
  if (els.flameAoe3dAuraAlpha) els.flameAoe3dAuraAlpha.value = String(Number(cfg.auraAlpha).toFixed(2));
  if (els.flameAoe3dAuraScale) els.flameAoe3dAuraScale.value = String(Number(cfg.auraScale).toFixed(2));
  if (els.flameAoe3dAuraPulse) els.flameAoe3dAuraPulse.value = String(Number(cfg.auraPulse).toFixed(3));
  if (els.flameAoe3dAuraNoiseScale) els.flameAoe3dAuraNoiseScale.value = String(Number(cfg.auraNoiseScale).toFixed(2));
  if (els.flameAoe3dAuraNoiseSpeed) els.flameAoe3dAuraNoiseSpeed.value = String(Number(cfg.auraNoiseSpeed).toFixed(2));
  if (els.flameAoe3dAuraFresnelPower) els.flameAoe3dAuraFresnelPower.value = String(Number(cfg.auraFresnelPower).toFixed(2));
  if (els.flameAoe3dAuraR) els.flameAoe3dAuraR.value = String((cfg.auraColor >> 16) & 255);
  if (els.flameAoe3dAuraG) els.flameAoe3dAuraG.value = String((cfg.auraColor >> 8) & 255);
  if (els.flameAoe3dAuraB) els.flameAoe3dAuraB.value = String(cfg.auraColor & 255);
}

function hydrateFlameWakeFields(els = {}, cfg = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  const wakeMeshEnabled = cfg.wakeMeshEnabled !== false && cfg.wakeMeshEnabled !== 0 && cfg.wakeMeshEnabled !== "0";
  if (els.flameAoe3dWakeVisibleBtn) els.flameAoe3dWakeVisibleBtn.setAttribute("aria-pressed", wakeMeshEnabled ? "true" : "false");
  if (els.flameAoe3dWakeMeshEnabled) els.flameAoe3dWakeMeshEnabled.value = wakeMeshEnabled ? "1" : "0";
  if (els.flameAoe3dWakeLengthBo) els.flameAoe3dWakeLengthBo.value = String(Number(cfg.wakeLengthBo).toFixed(2));
  if (els.flameAoe3dWakeRadiusBo) els.flameAoe3dWakeRadiusBo.value = String(Number(cfg.wakeRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeSubdivisions) els.flameAoe3dWakeSubdivisions.value = String(Math.round(Number(cfg.wakeSubdivisions)));
  if (els.flameAoe3dWakeLeanAmount) els.flameAoe3dWakeLeanAmount.value = String(Number(cfg.wakeLeanAmount).toFixed(2));
  if (els.flameAoe3dWakeLeanLag) els.flameAoe3dWakeLeanLag.value = String(Number(cfg.wakeLeanLag).toFixed(2));
  if (els.flameAoe3dWakeLiftBo) els.flameAoe3dWakeLiftBo.value = String(Number(cfg.wakeLiftBo).toFixed(2));
  if (els.flameAoe3dWakeLiftCoreRadiusBo) els.flameAoe3dWakeLiftCoreRadiusBo.value = String(Number(cfg.wakeLiftCoreRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeStretchStrength) els.flameAoe3dWakeStretchStrength.value = String(Number(cfg.wakeStretchStrength).toFixed(2));
  if (els.flameAoe3dWakeOrbHugRadiusBo) els.flameAoe3dWakeOrbHugRadiusBo.value = String(Number(cfg.wakeOrbHugRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeEnvelopeBlendBo) els.flameAoe3dWakeEnvelopeBlendBo.value = String(Number(cfg.wakeEnvelopeBlendBo).toFixed(2));
  const displaceEnabled = cfg.wakeDisplaceEnabled !== false && cfg.wakeDisplaceEnabled !== 0 && cfg.wakeDisplaceEnabled !== "0";
  if (els.flameAoe3dWakeDisplaceVisibleBtn) els.flameAoe3dWakeDisplaceVisibleBtn.setAttribute("aria-pressed", displaceEnabled ? "true" : "false");
  if (els.flameAoe3dWakeDisplaceBo) els.flameAoe3dWakeDisplaceBo.value = String(Number(cfg.wakeDisplaceBo).toFixed(3));
  if (els.flameAoe3dWakeDisplaceScale) els.flameAoe3dWakeDisplaceScale.value = String(Number(cfg.wakeDisplaceScale).toFixed(2));
  if (els.flameAoe3dWakeDisplaceSpeed) els.flameAoe3dWakeDisplaceSpeed.value = String(Number(cfg.wakeDisplaceSpeed).toFixed(2));
  if (els.flameAoe3dWakeDisplaceSoftness) els.flameAoe3dWakeDisplaceSoftness.value = String(Number(cfg.wakeDisplaceSoftness).toFixed(2));
  if (els.flameAoe3dWakeDisplaceInfluenceBottom) els.flameAoe3dWakeDisplaceInfluenceBottom.value = String(Number(cfg.wakeDisplaceInfluenceBottom).toFixed(2));
  if (els.flameAoe3dWakeDisplaceInfluenceTop) els.flameAoe3dWakeDisplaceInfluenceTop.value = String(Number(cfg.wakeDisplaceInfluenceTop).toFixed(2));
  if (els.flameAoe3dWakeNoiseScale) els.flameAoe3dWakeNoiseScale.value = String(Number(cfg.wakeNoiseScale).toFixed(2));
  if (els.flameAoe3dWakeNoiseSpeed) els.flameAoe3dWakeNoiseSpeed.value = String(Number(cfg.wakeNoiseSpeed).toFixed(2));
  if (els.flameAoe3dWakeNoiseDensityBottom) els.flameAoe3dWakeNoiseDensityBottom.value = String(Number(cfg.wakeNoiseDensityBottom).toFixed(2));
  if (els.flameAoe3dWakeNoiseDensityTop) els.flameAoe3dWakeNoiseDensityTop.value = String(Number(cfg.wakeNoiseDensityTop).toFixed(2));
  if (els.flameAoe3dWakeNoiseContrast) els.flameAoe3dWakeNoiseContrast.value = String(Number(cfg.wakeNoiseContrast).toFixed(2));
  if (els.flameAoe3dWakeNoiseOctaves) els.flameAoe3dWakeNoiseOctaves.value = String(Math.round(Number(cfg.wakeNoiseOctaves)));
  if (els.flameAoe3dWakeNoiseLacunarity) els.flameAoe3dWakeNoiseLacunarity.value = String(Number(cfg.wakeNoiseLacunarity).toFixed(2));
  if (els.flameAoe3dWakeNoiseGain) els.flameAoe3dWakeNoiseGain.value = String(Number(cfg.wakeNoiseGain).toFixed(2));
  if (els.flameAoe3dWakeSimplexScale) els.flameAoe3dWakeSimplexScale.value = String(Number(cfg.wakeSimplexScale).toFixed(2));
  if (els.flameAoe3dWakeSimplexSpeed) els.flameAoe3dWakeSimplexSpeed.value = String(Number(cfg.wakeSimplexSpeed).toFixed(2));
  if (els.flameAoe3dWakeSimplexDensityBottom) els.flameAoe3dWakeSimplexDensityBottom.value = String(Number(cfg.wakeSimplexDensityBottom).toFixed(2));
  if (els.flameAoe3dWakeSimplexDensityTop) els.flameAoe3dWakeSimplexDensityTop.value = String(Number(cfg.wakeSimplexDensityTop).toFixed(2));
  if (els.flameAoe3dWakeSimplexContrast) els.flameAoe3dWakeSimplexContrast.value = String(Number(cfg.wakeSimplexContrast).toFixed(2));
  if (els.flameAoe3dWakeSimplexOctaves) els.flameAoe3dWakeSimplexOctaves.value = String(Math.round(Number(cfg.wakeSimplexOctaves)));
  if (els.flameAoe3dWakeSimplexLacunarity) els.flameAoe3dWakeSimplexLacunarity.value = String(Number(cfg.wakeSimplexLacunarity).toFixed(2));
  if (els.flameAoe3dWakeSimplexGain) els.flameAoe3dWakeSimplexGain.value = String(Number(cfg.wakeSimplexGain).toFixed(2));
  if (els.flameAoe3dWakeNoiseMix) els.flameAoe3dWakeNoiseMix.value = String(Number(cfg.wakeNoiseMix).toFixed(2));
  const wakeSdfEnabled = cfg.wakeSdfEnabled === true || cfg.wakeSdfEnabled === 1 || cfg.wakeSdfEnabled === "1";
  if (els.flameAoe3dWakeSdfVisibleBtn) els.flameAoe3dWakeSdfVisibleBtn.setAttribute("aria-pressed", wakeSdfEnabled ? "true" : "false");
  if (els.flameAoe3dWakeSdfEnabled) els.flameAoe3dWakeSdfEnabled.value = wakeSdfEnabled ? "1" : "0";
  if (els.flameAoe3dWakeSdfHeightBo) els.flameAoe3dWakeSdfHeightBo.value = String(Number(cfg.wakeSdfHeightBo).toFixed(2));
  if (els.flameAoe3dWakeSdfParticleLifeMs) els.flameAoe3dWakeSdfParticleLifeMs.value = String(Math.round(cfg.wakeSdfParticleLifeMs));
  if (els.flameAoe3dWakeSdfSpawnRate) els.flameAoe3dWakeSdfSpawnRate.value = String(Number(cfg.wakeSdfSpawnRate).toFixed(0));
  if (els.flameAoe3dWakeSdfSpawnAreaBo) els.flameAoe3dWakeSdfSpawnAreaBo.value = String(Number(cfg.wakeSdfSpawnAreaBo).toFixed(2));
  if (els.flameAoe3dWakeSdfParticleRadiusBo) els.flameAoe3dWakeSdfParticleRadiusBo.value = String(Number(cfg.wakeSdfParticleRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeSdfLiftBias) els.flameAoe3dWakeSdfLiftBias.value = String(Number(cfg.wakeSdfLiftBias).toFixed(2));
  if (els.flameAoe3dWakeSdfJitterBo) els.flameAoe3dWakeSdfJitterBo.value = String(Number(cfg.wakeSdfJitterBo).toFixed(2));
  if (els.flameAoe3dWakeSdfHeatDecay) els.flameAoe3dWakeSdfHeatDecay.value = String(Number(cfg.wakeSdfHeatDecay).toFixed(2));
  if (els.flameAoe3dWakeSdfRadiusBo) els.flameAoe3dWakeSdfRadiusBo.value = String(Number(cfg.wakeSdfRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeSdfCoreRadiusBo) els.flameAoe3dWakeSdfCoreRadiusBo.value = String(Number(cfg.wakeSdfCoreRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeSdfSoftnessBo) els.flameAoe3dWakeSdfSoftnessBo.value = String(Number(cfg.wakeSdfSoftnessBo).toFixed(2));
  if (els.flameAoe3dWakeSdfDensity) els.flameAoe3dWakeSdfDensity.value = String(Number(cfg.wakeSdfDensity).toFixed(2));
  if (els.flameAoe3dWakeSdfPerlinScale) els.flameAoe3dWakeSdfPerlinScale.value = String(Number(cfg.wakeSdfPerlinScale).toFixed(2));
  if (els.flameAoe3dWakeSdfPerlinSpeed) els.flameAoe3dWakeSdfPerlinSpeed.value = String(Number(cfg.wakeSdfPerlinSpeed).toFixed(2));
  if (els.flameAoe3dWakeSdfPerlinContrast) els.flameAoe3dWakeSdfPerlinContrast.value = String(Number(cfg.wakeSdfPerlinContrast).toFixed(2));
  if (els.flameAoe3dWakeSdfPerlinOctaves) els.flameAoe3dWakeSdfPerlinOctaves.value = String(Math.round(Number(cfg.wakeSdfPerlinOctaves)));
  if (els.flameAoe3dWakeSdfPerlinLacunarity) els.flameAoe3dWakeSdfPerlinLacunarity.value = String(Number(cfg.wakeSdfPerlinLacunarity).toFixed(2));
  if (els.flameAoe3dWakeSdfPerlinGain) els.flameAoe3dWakeSdfPerlinGain.value = String(Number(cfg.wakeSdfPerlinGain).toFixed(2));
  if (els.flameAoe3dWakeSdfNoiseBlackPoint) els.flameAoe3dWakeSdfNoiseBlackPoint.value = String(Number(cfg.wakeSdfNoiseBlackPoint).toFixed(2));
  if (els.flameAoe3dWakeSdfNoiseWhitePoint) els.flameAoe3dWakeSdfNoiseWhitePoint.value = String(Number(cfg.wakeSdfNoiseWhitePoint).toFixed(2));
  if (els.flameAoe3dWakeSdfRenderMode) els.flameAoe3dWakeSdfRenderMode.value = String(Math.round(clampNumber(cfg.wakeSdfRenderMode, 0, 10, 0)));
  if (els.flameAoe3dWakeSdfDebugPoints) els.flameAoe3dWakeSdfDebugPoints.value = String(Math.round(clampNumber(cfg.wakeSdfDebugPoints, 0, 1, 1)));
  for (let i = 0; i < 4; i += 1) {
    ["Pct", "R", "G", "B", "A"].forEach((suffix) => {
      const el = els[`flameAoe3dWakeSdfGraph${i}${suffix}`];
      if (!el) return;
      const value = cfg[`wakeSdfGraph${i}${suffix}`];
      el.value = value == null ? "" : String(value);
    });
  }
  for (let i = 0; i < 4; i += 1) {
    ["Pct", "R", "G", "B", "A"].forEach((suffix) => {
      const el = els[`flameAoe3dWakeGraph${i}${suffix}`];
      if (!el) return;
      const value = cfg[`wakeGraph${i}${suffix}`];
      el.value = value == null ? "" : String(value);
    });
  }
  for (let i = 0; i < 4; i += 1) {
    ["Pct", "A"].forEach((suffix) => {
      const el = els[`flameAoe3dWakeAlphaGradient${i}${suffix}`];
      if (!el) return;
      const value = cfg[`wakeAlphaGradient${i}${suffix}`];
      el.value = value == null ? "" : String(value);
    });
  }
  const graphEnabled = cfg.wakeGraphEnabled !== false && cfg.wakeGraphEnabled !== 0 && cfg.wakeGraphEnabled !== "0";
  if (els.flameAoe3dWakeGraphEnabled) els.flameAoe3dWakeGraphEnabled.value = graphEnabled ? "1" : "0";
  if (els.flameAoe3dWakeGraphVisibleBtn) els.flameAoe3dWakeGraphVisibleBtn.setAttribute("aria-pressed", graphEnabled ? "true" : "false");
}

function bindInputCommits(root, apply) {
  if (!root || typeof apply !== "function") return;
  root.querySelectorAll("input.paramFieldInput").forEach((field) => {
    field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      apply();
    });
    field.addEventListener("change", apply);
    field.addEventListener("blur", apply);
  });
  root.querySelectorAll("select.paramFieldInput").forEach((field) => {
    field.addEventListener("change", apply);
  });
}

function layerVisible(button) {
  return !button || button.getAttribute("aria-pressed") !== "false";
}

function smoothMaxNumber(a, b, radius) {
  const k = Math.max(0.0001, Number(radius) || 0);
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return (a * (1 - h)) + (b * h) + (k * h * (1 - h));
}

function circleRadiusAtY(y, centerY, radius) {
  const dy = y - centerY;
  const disc = (radius * radius) - (dy * dy);
  return disc > 0 ? Math.sqrt(disc) : 0;
}

function createAoeAuraDiscMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:aeo_aura_disc_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(config.aoeAuraColor) },
      uAlpha: { value: config.aoeAuraA },
      uSoftness: { value: config.aoeAuraSoftness },
    },
    vertexShader: `
      precision highp float;

      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform vec3 uColor;
      uniform float uAlpha;
      uniform float uSoftness;

      varying vec2 vUv;

      void main() {
        float d = distance(vUv, vec2(0.5)) * 2.0;
        float softness = clamp(uSoftness, 0.001, 0.95);
        float edge = 1.0 - smoothstep(1.0 - softness, 1.0, d);
        float alpha = edge * clamp(uAlpha, 0.0, 1.0);
        if (d > 1.0 || alpha <= 0.001) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function createWakeElasticShellGeometry({
  baseRadius,
  liftOffset,
  liftRadius,
  padding,
  blendSoftness,
  radialSegments = 64,
  heightSegments = 32,
} = {}) {
  const baseR = Math.max(1, Number(baseRadius) || 1);
  const liftY = Math.max(0, Number(liftOffset) || 0);
  const liftR = Math.max(1, Number(liftRadius) || 1);
  const shellPadding = Math.max(0, Number(padding) || 0);
  const blend = Math.max(0.001, Number(blendSoftness) || 0.001);
  const rings = Math.max(4, Math.round(heightSegments));
  const segments = Math.max(8, Math.round(radialSegments));
  const minY = Math.min(-baseR, liftY - liftR) - shellPadding;
  const maxY = Math.max(baseR, liftY + liftR) + shellPadding;
  const positions = [];
  const uvs = [];
  const wakeTail = [];
  const indices = [];
  for (let iy = 0; iy <= rings; iy += 1) {
    const v = iy / rings;
    const y = minY + ((maxY - minY) * v);
    const baseCross = circleRadiusAtY(y, 0, baseR);
    const liftCross = circleRadiusAtY(y, liftY, liftR);
    const bridgeT = liftY > 0.0001 ? Math.max(0, Math.min(1, y / liftY)) : 1;
    const bridge = y > 0 && y < liftY ? ((baseR * (1 - bridgeT)) + (liftR * bridgeT)) : 0;
    const sphereEnvelope = baseCross <= 0 && liftCross <= 0 ? 0 : smoothMaxNumber(baseCross, liftCross, blend);
    const envelope = bridge > 0 ? smoothMaxNumber(sphereEnvelope, bridge, blend) : sphereEnvelope;
    const edgeFade = Math.sin(v * Math.PI);
    const r = Math.max(0, envelope + (shellPadding * edgeFade));
    for (let ix = 0; ix <= segments; ix += 1) {
      const u = ix / segments;
      const theta = u * Math.PI * 2;
      positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
      uvs.push(u, v);
      wakeTail.push(v);
    }
  }
  for (let iy = 0; iy < rings; iy += 1) {
    for (let ix = 0; ix < segments; ix += 1) {
      const a = iy * (segments + 1) + ix;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("aWakeTail", new THREE.Float32BufferAttribute(wakeTail, 1));
  geometry.setIndex(indices);
  geometry.userData.wakeShell = Object.freeze({ radialSegments: segments, heightSegments: rings });
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createAuraShellMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:aura_shell_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAuraAlpha: { value: config.auraAlpha },
      uAuraPulse: { value: config.auraPulse },
      uAuraNoiseScale: { value: config.auraNoiseScale },
      uAuraNoiseSpeed: { value: config.auraNoiseSpeed },
      uAuraFresnelPower: { value: config.auraFresnelPower },
      uAuraColor: { value: new THREE.Color(config.auraColor) },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uAuraPulse;
      uniform float uAuraNoiseScale;
      uniform float uAuraNoiseSpeed;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vObjectNormal;
      varying float vAura;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      void main() {
        vec3 objectNormal = normalize(normal);
        float time = uTime * uAuraNoiseSpeed;
        vec3 flow = objectNormal * uAuraNoiseScale;
        flow.xz += vec2(sin(time * 0.9), cos(time * 0.7)) * 0.65;
        flow.y -= time * 1.4;
        float aura = noise(flow) * 0.62 + noise(flow * 2.1 + vec3(3.1, -5.2, 8.4)) * 0.38;
        float breath = sin(uTime * 2.15 + objectNormal.y * 2.7 + aura * 5.0) * 0.5 + 0.5;
        float displacement = uAuraPulse * (0.35 + aura * 0.8 + breath * 0.35);
        vec3 displaced = position + objectNormal * displacement * length(position);

        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
        vObjectNormal = objectNormal;
        vAura = aura;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uAuraAlpha;
      uniform float uAuraNoiseScale;
      uniform float uAuraNoiseSpeed;
      uniform float uAuraFresnelPower;
      uniform vec3 uAuraColor;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vObjectNormal;
      varying float vAura;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 objectNormal = normalize(vObjectNormal);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uAuraFresnelPower);
        float time = uTime * uAuraNoiseSpeed;
        vec3 flow = objectNormal * uAuraNoiseScale;
        flow.x += sin(time * 1.1 + objectNormal.z * 3.4) * 0.42;
        flow.z += cos(time * 0.8 + objectNormal.x * 2.9) * 0.42;
        flow.y -= time * 1.2;
        float mist = noise(flow) * 0.58 + noise(flow * 2.35 + vec3(8.2, -4.9, 1.4)) * 0.42;
        float pulse = 0.82 + 0.18 * sin(uTime * 3.4 + mist * 7.0);
        float veil = smoothstep(0.18, 0.88, mist + fresnel * 0.22);
        float alpha = uAuraAlpha * pulse * (fresnel * 0.72 + veil * 0.18);
        vec3 color = uAuraColor * (0.72 + fresnel * 1.4 + veil * 0.38);

        if (alpha < 0.006) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function getWakeGraphStops(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  const graphStops = [];
  for (let i = 0; i < 4; i += 1) {
    const pct = readOptionalNumber(config[`wakeGraph${i}Pct`], 0, 100);
    const r = readOptionalNumber(config[`wakeGraph${i}R`], 0, 255);
    const g = readOptionalNumber(config[`wakeGraph${i}G`], 0, 255);
    const b = readOptionalNumber(config[`wakeGraph${i}B`], 0, 255);
    const a = readOptionalNumber(config[`wakeGraph${i}A`], 0, 1);
    if ([pct, r, g, b, a].some((v) => v === "")) continue;
    graphStops.push({
      pct: pct / 100,
      color: new THREE.Vector4(r / 255, g / 255, b / 255, a),
    });
  }
  graphStops.sort((a, b) => a.pct - b.pct);
  return graphStops;
}

function getWakeGraphStopCount(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  return getWakeGraphStops(config).length;
}

function getWakeSdfGraphStops(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  const graphStops = [];
  for (let i = 0; i < 4; i += 1) {
    const pct = readOptionalNumber(config[`wakeSdfGraph${i}Pct`], 0, 100);
    const r = readOptionalNumber(config[`wakeSdfGraph${i}R`], 0, 255);
    const g = readOptionalNumber(config[`wakeSdfGraph${i}G`], 0, 255);
    const b = readOptionalNumber(config[`wakeSdfGraph${i}B`], 0, 255);
    const a = readOptionalNumber(config[`wakeSdfGraph${i}A`], 0, 1);
    if ([pct, r, g, b, a].some((v) => v === "")) continue;
    graphStops.push({
      pct: pct / 100,
      color: new THREE.Vector4(r / 255, g / 255, b / 255, a),
    });
  }
  graphStops.sort((a, b) => a.pct - b.pct);
  return graphStops;
}

function getWakeAlphaGradientStops(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  const gradientStops = [];
  for (let i = 0; i < 4; i += 1) {
    const pct = readOptionalNumber(config[`wakeAlphaGradient${i}Pct`], 0, 100);
    const alpha = readOptionalNumber(config[`wakeAlphaGradient${i}A`], 0, 1);
    if ([pct, alpha].some((v) => v === "")) continue;
    gradientStops.push({ pct: pct / 100, alpha });
  }
  gradientStops.sort((a, b) => a.pct - b.pct);
  return gradientStops;
}

function createWakeMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  const graphStops = getWakeGraphStops(config);
  const alphaGradientStops = getWakeAlphaGradientStops(config);
  const wakeGraphStops = [0, 1, 1, 1];
  const wakeGraphColors = [
    new THREE.Vector4(0, 0, 0, 0),
    new THREE.Vector4(1, 1, 1, 1),
    new THREE.Vector4(1, 1, 1, 1),
    new THREE.Vector4(1, 1, 1, 1),
  ];
  graphStops.slice(0, 4).forEach((stop, index) => {
    wakeGraphStops[index] = stop.pct;
    wakeGraphColors[index] = stop.color;
  });
  const wakeAlphaGradientStops = [0, 1, 1, 1];
  const wakeAlphaGradientValues = [1, 1, 1, 1];
  alphaGradientStops.slice(0, 4).forEach((stop, index) => {
    wakeAlphaGradientStops[index] = stop.pct;
    wakeAlphaGradientValues[index] = stop.alpha;
  });
  const graphEnabled = config.wakeGraphEnabled !== false && config.wakeGraphEnabled !== 0 && config.wakeGraphEnabled !== "0";
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:directional_wake_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uWakeDisplaceDepth: { value: Number.isFinite(Number(config.wakeDisplacePx)) ? Number(config.wakeDisplacePx) : config.wakeDisplaceBo },
      uWakeDisplaceScale: { value: config.wakeDisplaceScale },
      uWakeDisplaceSpeed: { value: config.wakeDisplaceSpeed },
      uWakeDisplaceSoftness: { value: config.wakeDisplaceSoftness },
      uWakeDisplaceInfluenceBottom: { value: config.wakeDisplaceInfluenceBottom },
      uWakeDisplaceInfluenceTop: { value: config.wakeDisplaceInfluenceTop },
      uWakeCoreOffset: { value: new THREE.Vector3(0, Number(config.wakeLiftPx) || 1, 0) },
      uWakeCoreRadius: { value: Number(config.wakeLiftCoreRadiusPx) || 1 },
      uWakeOrbRadius: { value: Number(config.wakeOrbHugRadiusPx) || 1 },
      uWakeEnvelopeBlend: { value: Number(config.wakeEnvelopeBlendPx) || 1 },
      uWakeStretchDirection: { value: new THREE.Vector3(0, 1, 0) },
      uWakeStretchStrength: { value: config.wakeStretchStrength },
      uWakeNoiseScale: { value: config.wakeNoiseScale },
      uWakeNoiseSpeed: { value: config.wakeNoiseSpeed },
      uWakeNoiseDensityBottom: { value: config.wakeNoiseDensityBottom },
      uWakeNoiseDensityTop: { value: config.wakeNoiseDensityTop },
      uWakeNoiseContrast: { value: config.wakeNoiseContrast },
      uWakeNoiseOctaves: { value: config.wakeNoiseOctaves },
      uWakeNoiseLacunarity: { value: config.wakeNoiseLacunarity },
      uWakeNoiseGain: { value: config.wakeNoiseGain },
      uWakeSimplexScale: { value: config.wakeSimplexScale },
      uWakeSimplexSpeed: { value: config.wakeSimplexSpeed },
      uWakeSimplexDensityBottom: { value: config.wakeSimplexDensityBottom },
      uWakeSimplexDensityTop: { value: config.wakeSimplexDensityTop },
      uWakeSimplexContrast: { value: config.wakeSimplexContrast },
      uWakeSimplexOctaves: { value: config.wakeSimplexOctaves },
      uWakeSimplexLacunarity: { value: config.wakeSimplexLacunarity },
      uWakeSimplexGain: { value: config.wakeSimplexGain },
      uWakeNoiseMix: { value: config.wakeNoiseMix },
      uWakeGraphEnabled: { value: graphEnabled ? 1 : 0 },
      uWakeGraphCount: { value: graphEnabled ? Math.max(0, Math.min(4, graphStops.length)) : 0 },
      uWakeGraphStops: { value: wakeGraphStops },
      uWakeGraphColors: { value: wakeGraphColors },
      uWakeAlphaGradientCount: { value: Math.max(0, Math.min(4, alphaGradientStops.length)) },
      uWakeAlphaGradientStops: { value: wakeAlphaGradientStops },
      uWakeAlphaGradientValues: { value: wakeAlphaGradientValues },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uWakeDisplaceDepth;
      uniform float uWakeDisplaceScale;
      uniform float uWakeDisplaceSpeed;
      uniform float uWakeDisplaceSoftness;
      uniform float uWakeDisplaceInfluenceBottom;
      uniform float uWakeDisplaceInfluenceTop;
      uniform vec3 uWakeCoreOffset;
      uniform float uWakeCoreRadius;
      uniform float uWakeOrbRadius;
      uniform float uWakeEnvelopeBlend;
      uniform vec3 uWakeStretchDirection;
      uniform float uWakeStretchStrength;
      attribute float aWakeTail;

      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying float vTail;
      varying float vWakeHeight;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      float broadFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.58;
        float freq = 1.0;
        for (int i = 0; i < 3; i += 1) {
          value += noise(p * freq) * amp;
          freq *= 1.82;
          amp *= 0.42;
          p += vec3(7.3, -11.9, 5.1);
        }
        return clamp(value, 0.0, 1.0);
      }
      float sphereRayDistance(vec3 rayDir, vec3 center, float radius) {
        float along = dot(rayDir, center);
        float disc = radius * radius - dot(center, center) + along * along;
        if (disc <= 0.0) return 0.0;
        return max(0.0, along + sqrt(disc));
      }
      float smoothMax(float a, float b, float radius) {
        float k = max(0.0001, radius);
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(a, b, h) + k * h * (1.0 - h);
      }

      void main() {
        vec3 stretchDirection = normalize(uWakeStretchDirection + vec3(0.0, 0.0001, 0.0));
        float tail = clamp(aWakeTail, 0.0, 1.0);
        vec3 local = position;

        vec2 radialPlane = local.xz;
        float radius = length(radialPlane);
        vec2 radialDir = radius > 0.0001 ? radialPlane / radius : vec2(1.0, 0.0);
        float angle = atan(radialDir.y, radialDir.x);
        float time = uTime * uWakeDisplaceSpeed * 6.28318530718;
        float verticalPhase = tail * 6.28318530718 * (1.55 / max(0.2, uWakeDisplaceScale));

        float softness = clamp(uWakeDisplaceSoftness, 0.0, 1.0);
        float primary = sin(angle * 2.0 + verticalPhase - time);
        float secondary = sin(angle * 3.0 - verticalPhase * 0.72 + time * 0.63 + 1.7);
        float tertiary = sin(angle + verticalPhase * 1.31 + time * 0.37 + 3.4);
        float bulge = primary * 0.62;
        bulge += secondary * mix(0.26, 0.04, softness);
        bulge += tertiary * mix(0.18, 0.03, softness);
        bulge = clamp(bulge, -1.0, 1.0);

        float blobFrequency = 1.25 / max(0.2, uWakeDisplaceScale);
        vec3 blobFlow = vec3(
          radialDir.x * blobFrequency,
          tail * 2.4 * blobFrequency - uTime * uWakeDisplaceSpeed * 0.9,
          radialDir.y * blobFrequency
        );
        float cloud = broadFbm(blobFlow);
        float blob = smoothstep(mix(0.40, 0.52, softness), mix(0.82, 0.68, softness), cloud);
        float blobWave = blob * 2.0 - 1.0;

        float influence = mix(uWakeDisplaceInfluenceBottom, uWakeDisplaceInfluenceTop, tail);
        float rootMask = smoothstep(0.02, 0.14, tail);
        float tipMask = 1.0 - smoothstep(0.94, 1.0, tail);
        float bodyMask = sin(tail * 3.14159265359);
        float displacementField = mix(bulge, blobWave, 0.58);
        float displacement = displacementField * uWakeDisplaceDepth * influence * rootMask * tipMask * bodyMask;
        local.xz += radialDir * displacement;

        vec4 worldPos = modelMatrix * vec4(local, 1.0);
        vWorldPos = worldPos.xyz;
        vLocalPos = local;
        vTail = tail;
        vWakeHeight = tail;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uWakeNoiseScale;
      uniform float uWakeNoiseSpeed;
      uniform float uWakeNoiseDensityBottom;
      uniform float uWakeNoiseDensityTop;
      uniform float uWakeNoiseContrast;
      uniform float uWakeNoiseOctaves;
      uniform float uWakeNoiseLacunarity;
      uniform float uWakeNoiseGain;
      uniform float uWakeSimplexScale;
      uniform float uWakeSimplexSpeed;
      uniform float uWakeSimplexDensityBottom;
      uniform float uWakeSimplexDensityTop;
      uniform float uWakeSimplexContrast;
      uniform float uWakeSimplexOctaves;
      uniform float uWakeSimplexLacunarity;
      uniform float uWakeSimplexGain;
      uniform float uWakeNoiseMix;
      uniform float uWakeGraphEnabled;
      uniform int uWakeGraphCount;
      uniform float uWakeGraphStops[4];
      uniform vec4 uWakeGraphColors[4];
      uniform int uWakeAlphaGradientCount;
      uniform float uWakeAlphaGradientStops[4];
      uniform float uWakeAlphaGradientValues[4];
      uniform vec3 uWakeStretchDirection;

      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying float vTail;
      varying float vWakeHeight;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.56;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeNoiseOctaves) break;
          value += noise(p * freq) * amp;
          freq *= uWakeNoiseLacunarity;
          amp *= uWakeNoiseGain;
          p += vec3(17.7, -11.3, 8.9);
        }
        return clamp(value, 0.0, 1.0);
      }

      float ridgedFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.58;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeNoiseOctaves) break;
          float ridge = 1.0 - abs(noise(p * freq) * 2.0 - 1.0);
          ridge *= ridge;
          value += ridge * amp;
          freq *= uWakeNoiseLacunarity * 1.04;
          amp *= uWakeNoiseGain * 0.92;
          p += vec3(-6.4, 19.1, 12.8);
        }
        return clamp(value, 0.0, 1.0);
      }

      float perlinMusgraveField(vec3 p) {
        float base = fbm(p);
        float ridge = ridgedFbm(p * 0.82 + vec3(3.4, -7.8, 2.1));
        float broad = fbm(p * 0.46 + vec3(-11.2, 4.6, 9.3));
        return clamp(base * 0.46 + ridge * 0.34 + broad * 0.32, 0.0, 1.0);
      }

      vec3 simplexGrad(vec3 p) {
        float z = hash31(p) * 2.0 - 1.0;
        float a = hash31(p + vec3(19.19, 7.31, 2.47)) * 6.28318530718;
        float r = sqrt(max(0.0, 1.0 - z * z));
        return vec3(r * cos(a), r * sin(a), z);
      }

      float simplexNoise(vec3 v) {
        const float F3 = 0.33333333333;
        const float G3 = 0.16666666667;
        vec3 i = floor(v + dot(v, vec3(F3)));
        vec3 x0 = v - i + dot(i, vec3(G3));
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + G3;
        vec3 x2 = x0 - i2 + 2.0 * G3;
        vec3 x3 = x0 - 1.0 + 3.0 * G3;
        float n = 0.0;
        float t0 = 0.6 - dot(x0, x0);
        if (t0 > 0.0) {
          t0 *= t0;
          n += t0 * t0 * dot(simplexGrad(i), x0);
        }
        float t1 = 0.6 - dot(x1, x1);
        if (t1 > 0.0) {
          t1 *= t1;
          n += t1 * t1 * dot(simplexGrad(i + i1), x1);
        }
        float t2 = 0.6 - dot(x2, x2);
        if (t2 > 0.0) {
          t2 *= t2;
          n += t2 * t2 * dot(simplexGrad(i + i2), x2);
        }
        float t3 = 0.6 - dot(x3, x3);
        if (t3 > 0.0) {
          t3 *= t3;
          n += t3 * t3 * dot(simplexGrad(i + vec3(1.0)), x3);
        }
        return clamp(n * 32.0 * 0.5 + 0.5, 0.0, 1.0);
      }

      float simplexFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.56;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeSimplexOctaves) break;
          value += simplexNoise(p * freq) * amp;
          freq *= uWakeSimplexLacunarity;
          amp *= uWakeSimplexGain;
          p += vec3(-13.1, 9.7, 21.4);
        }
        return clamp(value, 0.0, 1.0);
      }

      float simplexGranularField(vec3 p) {
        float fine = simplexFbm(p);
        float ridged = 1.0 - abs(simplexFbm(p * 1.34 + vec3(4.1, -8.7, 6.3)) * 2.0 - 1.0);
        return clamp(fine * 0.62 + ridged * ridged * 0.38, 0.0, 1.0);
      }

      float colorRampMask(float field, float density, float contrast) {
        float edge = clamp(contrast, 0.02, 0.6);
        float center = mix(0.72, 0.30, clamp(density, 0.0, 1.0));
        return smoothstep(center - edge * 0.5, center + edge * 0.5, field);
      }

      vec4 sampleWakeGraph(float value) {
        float t = clamp(value, 0.0, 1.0);
        if (uWakeGraphEnabled < 0.5) return vec4(vec3(t), t);
        if (uWakeGraphCount <= 0) return vec4(vec3(t), t);
        if (uWakeGraphCount == 1) return uWakeGraphColors[0];
        vec4 result = uWakeGraphColors[0];
        if (t <= uWakeGraphStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          if (i >= uWakeGraphCount - 1) break;
          float left = uWakeGraphStops[i];
          float right = max(left + 0.0001, uWakeGraphStops[i + 1]);
          result = uWakeGraphColors[i + 1];
          if (t <= right) {
            float localT = clamp((t - left) / (right - left), 0.0, 1.0);
            result = mix(uWakeGraphColors[i], uWakeGraphColors[i + 1], localT);
            break;
          }
        }
        return result;
      }

      float sampleWakeAlphaGradient(float value) {
        float t = clamp(value, 0.0, 1.0);
        if (uWakeAlphaGradientCount <= 0) return 1.0;
        if (uWakeAlphaGradientCount == 1) return uWakeAlphaGradientValues[0];
        float result = uWakeAlphaGradientValues[0];
        if (t <= uWakeAlphaGradientStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          if (i >= uWakeAlphaGradientCount - 1) break;
          float left = uWakeAlphaGradientStops[i];
          float right = max(left + 0.0001, uWakeAlphaGradientStops[i + 1]);
          result = uWakeAlphaGradientValues[i + 1];
          if (t <= right) {
            float localT = clamp((t - left) / (right - left), 0.0, 1.0);
            result = mix(uWakeAlphaGradientValues[i], uWakeAlphaGradientValues[i + 1], localT);
            break;
          }
        }
        return result;
      }

      void main() {
        vec3 surface = normalize(vLocalPos + vec3(0.0, 0.001, 0.0));
        vec3 stretchDirection = normalize(uWakeStretchDirection + vec3(0.0, 0.0001, 0.0));

        float perlinTime = uTime * uWakeNoiseSpeed;
        float perlinFrequency = 4.25 / max(0.1, uWakeNoiseScale);
        vec3 perlinFlow = surface * perlinFrequency + stretchDirection * ((vTail * 1.35 - perlinTime * 0.42) * perlinFrequency);
        float perlinDensity = mix(uWakeNoiseDensityBottom, uWakeNoiseDensityTop, clamp(vTail, 0.0, 1.0));
        float perlin = perlinMusgraveField(perlinFlow);

        float simplexTime = uTime * uWakeSimplexSpeed;
        float simplexFrequency = 4.25 / max(0.1, uWakeSimplexScale);
        vec3 simplexFlow = surface * simplexFrequency + stretchDirection * ((vTail * 1.52 - simplexTime * 0.5) * simplexFrequency);
        float simplexDensity = mix(uWakeSimplexDensityBottom, uWakeSimplexDensityTop, clamp(vTail, 0.0, 1.0));
        float simplex = simplexGranularField(simplexFlow);

        float noiseMix = clamp(uWakeNoiseMix, 0.0, 1.0);
        float field = mix(perlin, simplex, noiseMix);
        float density = mix(perlinDensity, simplexDensity, noiseMix);
        float contrast = mix(uWakeNoiseContrast, uWakeSimplexContrast, noiseMix);
        float blobs = colorRampMask(field, density, contrast);
        vec4 mapped = sampleWakeGraph(blobs);
        float verticalAlpha = sampleWakeAlphaGradient(vWakeHeight);
        mapped.rgb *= verticalAlpha;
        mapped.a *= verticalAlpha;
        if (mapped.a <= 0.004) discard;
        gl_FragColor = mapped;
      }
    `,
  });
}

function createWakeSdfMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  const graphStops = getWakeSdfGraphStops(config);
  const graphStopValues = [0, 1, 1, 1];
  const graphColors = [
    new THREE.Vector4(0, 0, 0, 0),
    new THREE.Vector4(1, 0.08, 0, 0.65),
    new THREE.Vector4(1, 0.58, 0.04, 0.9),
    new THREE.Vector4(1, 0.88, 0.42, 1),
  ];
  graphStops.slice(0, 4).forEach((stop, index) => {
    graphStopValues[index] = stop.pct;
    graphColors[index] = stop.color;
  });
  const orbRadiusPx = Math.max(1, Number(config.orbRadiusPx) || Number(config.wakeSdfRadiusPx) || 1);
  const trailPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, (_, index) => {
    const t = index / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
    return new THREE.Vector2(0, -orbRadiusPx + (config.wakeLiftPx || 1) * t);
  });
  const trailRadii = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, (_, index) => {
    const t = index / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
    const hip = Math.max(0, Math.sin(Math.PI * Math.min(1, t * 1.35))) * (1 - Math.min(1, Math.max(0, (t - 0.62) / 0.38)));
    const kiteTaper = t * t * 0.24;
    return Math.max(1, (config.wakeSdfRadiusPx * (1 - t) + config.wakeSdfCoreRadiusPx * t) * (1 + hip * 0.48 - kiteTaper));
  });
  const fieldEmitters = Array.from({ length: WAKE_SDF_FIELD_EMITTER_COUNT }, (_, index) => {
    const t = Math.min(1, index / Math.max(1, WAKE_SDF_FIELD_EMITTER_COUNT - 1));
    const rootBias = index < 3 ? -0.34 + index * 0.34 : 0;
    const x = rootBias * orbRadiusPx;
    const y = index < 3 ? -orbRadiusPx * 0.66 : -orbRadiusPx + (config.wakeLiftPx || 1) * t;
    const radius = index < 3 ? orbRadiusPx * 0.54 : config.wakeSdfRadiusPx * (1 - t) + config.wakeSdfCoreRadiusPx * t;
    const heat = index < 3 ? 1.0 : 0.95 - t * 0.35;
    return new THREE.Vector4(x, y, Math.max(1, radius), heat);
  });
  const controlParticles = Array.from({ length: WAKE_SDF_CONTROL_PARTICLE_COUNT }, (_, index) => {
    const source = WAKE_SDF_SOURCE_GRAPH[index % WAKE_SDF_SOURCE_GRAPH.length];
    const t = index / Math.max(1, WAKE_SDF_CONTROL_PARTICLE_COUNT - 1);
    const x = source[0] * orbRadiusPx * 0.8;
    const y = source[1] * orbRadiusPx * 0.8 + t * orbRadiusPx * 0.72;
    const particleRadiusPx = Math.max(1, Number(config.wakeSdfParticleRadiusPx) || orbRadiusPx * 0.16);
    return new THREE.Vector4(x, y, particleRadiusPx * (0.72 + (1 - t) * 0.48), 1 - t * 0.72);
  });
  const controlVelocities = Array.from({ length: WAKE_SDF_CONTROL_PARTICLE_COUNT }, () => new THREE.Vector2(0, 1));
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:wake_sdf_preview_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOrbRadius: { value: orbRadiusPx },
      uWakeOrbRadius: { value: config.wakeSdfRadiusPx },
      uWakeCoreRadius: { value: config.wakeSdfCoreRadiusPx },
      uWakeBlend: { value: config.wakeSdfBlendPx },
      uWakeSoftness: { value: config.wakeSdfSoftnessPx },
      uWakeDensity: { value: config.wakeSdfDensity },
      uWakeSdfPerlinScale: { value: config.wakeSdfPerlinScale },
      uWakeSdfPerlinSpeed: { value: config.wakeSdfPerlinSpeed },
      uWakeSdfPerlinContrast: { value: config.wakeSdfPerlinContrast },
      uWakeSdfPerlinOctaves: { value: config.wakeSdfPerlinOctaves },
      uWakeSdfPerlinLacunarity: { value: config.wakeSdfPerlinLacunarity },
      uWakeSdfPerlinGain: { value: config.wakeSdfPerlinGain },
      uWakeSdfNoiseBlackPoint: { value: config.wakeSdfNoiseBlackPoint },
      uWakeSdfNoiseWhitePoint: { value: config.wakeSdfNoiseWhitePoint },
      uWakeSdfRenderMode: { value: config.wakeSdfRenderMode },
      uWakeSdfGraphCount: { value: Math.max(0, Math.min(4, graphStops.length)) },
      uWakeSdfGraphStops: { value: graphStopValues },
      uWakeSdfGraphColors: { value: graphColors },
      uWakeMotionOffset: { value: new THREE.Vector3() },
      uWakeTrailPoints: { value: trailPoints },
      uWakeTrailRadii: { value: trailRadii },
      uWakeFieldEmitters: { value: fieldEmitters },
      uWakeControlParticles: { value: controlParticles },
      uWakeControlVelocities: { value: controlVelocities },
    },
    vertexShader: `
      precision highp float;
      varying vec2 vWakePos;
      varying vec2 vWakeUv;
      void main() {
        vWakePos = position.xy;
        vWakeUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      #define WAKE_POINT_COUNT ${WAKE_SDF_TRAIL_POINT_COUNT}
      #define FIELD_EMITTER_COUNT ${WAKE_SDF_FIELD_EMITTER_COUNT}
      #define CONTROL_PARTICLE_COUNT ${WAKE_SDF_CONTROL_PARTICLE_COUNT}
      uniform float uTime;
      uniform float uOrbRadius;
      uniform float uWakeOrbRadius;
      uniform float uWakeCoreRadius;
      uniform float uWakeBlend;
      uniform float uWakeSoftness;
      uniform float uWakeDensity;
      uniform float uWakeSdfPerlinScale;
      uniform float uWakeSdfPerlinSpeed;
      uniform float uWakeSdfPerlinContrast;
      uniform float uWakeSdfPerlinOctaves;
      uniform float uWakeSdfPerlinLacunarity;
      uniform float uWakeSdfPerlinGain;
      uniform float uWakeSdfNoiseBlackPoint;
      uniform float uWakeSdfNoiseWhitePoint;
      uniform int uWakeSdfRenderMode;
      uniform int uWakeSdfGraphCount;
      uniform float uWakeSdfGraphStops[4];
      uniform vec4 uWakeSdfGraphColors[4];
      uniform vec3 uWakeMotionOffset;
      uniform vec2 uWakeTrailPoints[WAKE_POINT_COUNT];
      uniform float uWakeTrailRadii[WAKE_POINT_COUNT];
      uniform vec4 uWakeFieldEmitters[FIELD_EMITTER_COUNT];
      uniform vec4 uWakeControlParticles[CONTROL_PARTICLE_COUNT];
      uniform vec2 uWakeControlVelocities[CONTROL_PARTICLE_COUNT];
      varying vec2 vWakePos;
      varying vec2 vWakeUv;
      float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) {
        float value = 0.0; float amp = 0.56; float ampTotal = 0.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeSdfPerlinOctaves) break;
          value += noise(p) * amp;
          ampTotal += amp;
          p = p * uWakeSdfPerlinLacunarity + vec3(7.1, -11.4, 5.8);
          amp *= uWakeSdfPerlinGain;
        }
        return clamp(value / max(0.0001, ampTotal), 0.0, 1.0);
      }
      float sdCircle(vec2 p, vec2 center, float radius) { return length(p - center) - radius; }
      float sdEllipse(vec2 p, vec2 center, vec2 radius) {
        vec2 safeRadius = max(radius, vec2(1.0));
        vec2 q = (p - center) / safeRadius;
        return (length(q) - 1.0) * min(safeRadius.x, safeRadius.y);
      }
      float sdTaperedCapsule(vec2 p, vec2 a, vec2 b, float radiusA, float radiusB) {
        vec2 pa = p - a; vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / max(0.0001, dot(ba, ba)), 0.0, 1.0);
        return length(pa - ba * h) - mix(radiusA, radiusB, h);
      }
      float smoothMin(float a, float b, float radius) {
        float k = max(0.0001, radius);
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
      vec4 sampleSdfGraph(float value) {
        float t = clamp(value, 0.0, 1.0);
        if (uWakeSdfGraphCount <= 0) return vec4(mix(vec3(0.9, 0.05, 0.0), vec3(1.0, 0.78, 0.28), t), t);
        if (uWakeSdfGraphCount == 1) return uWakeSdfGraphColors[0];
        vec4 result = uWakeSdfGraphColors[0];
        if (t <= uWakeSdfGraphStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          if (i >= uWakeSdfGraphCount - 1) break;
          float left = uWakeSdfGraphStops[i];
          float right = max(left + 0.0001, uWakeSdfGraphStops[i + 1]);
          result = uWakeSdfGraphColors[i + 1];
          if (t <= right) {
            result = mix(uWakeSdfGraphColors[i], uWakeSdfGraphColors[i + 1], clamp((t - left) / (right - left), 0.0, 1.0));
            break;
          }
        }
        return result;
      }
      void resolveSpineFrame(vec2 p, out float spineT, out float signedSide, out float spineDistance, out float spineRadius, out vec2 tangent) {
        float bestDistance = 1000000.0;
        float bestT = 0.0;
        float bestSide = 0.0;
        float bestRadius = uWakeTrailRadii[0];
        vec2 bestTangent = vec2(0.0, 1.0);
        for (int i = 0; i < WAKE_POINT_COUNT - 1; i += 1) {
          vec2 a = uWakeTrailPoints[i];
          vec2 b = uWakeTrailPoints[i + 1];
          vec2 ba = b - a;
          float h = clamp(dot(p - a, ba) / max(0.0001, dot(ba, ba)), 0.0, 1.0);
          vec2 nearest = a + ba * h;
          vec2 delta = p - nearest;
          float dist = length(delta);
          if (dist < bestDistance) {
            vec2 dir = normalize(ba + vec2(0.0, 0.0001));
            bestDistance = dist;
            bestT = (float(i) + h) / float(WAKE_POINT_COUNT - 1);
            bestSide = dir.x * delta.y - dir.y * delta.x;
            bestRadius = mix(uWakeTrailRadii[i], uWakeTrailRadii[i + 1], h);
            bestTangent = dir;
          }
        }
        spineT = bestT;
        signedSide = bestSide;
        spineDistance = bestDistance;
        spineRadius = max(1.0, bestRadius);
        tangent = bestTangent;
      }
      void sampleEmitterField(vec2 p, out float density, out float heat, out vec2 flow) {
        density = 0.0;
        heat = 0.0;
        flow = vec2(0.0, 1.0);
        float weightTotal = 0.0001;
        for (int i = 0; i < FIELD_EMITTER_COUNT; i += 1) {
          vec4 emitter = uWakeFieldEmitters[i];
          vec2 delta = p - emitter.xy;
          float radius = max(1.0, emitter.z);
          float normDist = length(delta) / radius;
          float influence = (1.0 - smoothstep(0.38, 1.38, normDist)) * max(0.0, emitter.w);
          float core = (1.0 - smoothstep(0.0, 0.72, normDist)) * max(0.0, emitter.w);
          density += influence;
          heat += core;
          vec2 dir = normalize(delta + vec2(0.0, 0.001));
          flow += vec2(-dir.y, dir.x) * influence;
          weightTotal += influence;
        }
        density = clamp(density * 0.72, 0.0, 1.65);
        heat = clamp(heat * 0.86, 0.0, 1.45);
        flow = normalize(flow / weightTotal + vec2(uWakeMotionOffset.x * 0.28, 0.82));
      }
      void main() {
        vec2 p = vWakePos;
        float density = 0.0;
        float heat = 0.0;
        vec2 particleFlowSum = vec2(0.0);
        vec2 particleWarpSum = vec2(0.0);
        float particleFlowWeight = 0.0001;
        for (int i = 0; i < CONTROL_PARTICLE_COUNT; i += 1) {
          vec4 particle = uWakeControlParticles[i];
          vec2 delta = p - particle.xy;
          float radius = max(1.0, particle.z);
          float ageHeat = max(0.0, particle.w);
          float radiusSq = radius * radius;
          float influence = ageHeat * radiusSq / (dot(delta, delta) + radiusSq);
          density += influence;
          heat += influence * ageHeat;
          particleFlowSum += uWakeControlVelocities[i] * influence;
          vec2 particleVelocity = uWakeControlVelocities[i];
          vec2 flowDir = normalize(particleVelocity + vec2(0.0, 0.001));
          vec2 sideDir = vec2(-flowDir.y, flowDir.x);
          float localSide = clamp(dot(delta / radius, sideDir), -1.0, 1.0);
          float handedness = mod(float(i), 2.0) * 2.0 - 1.0;
          float coreWarp = ageHeat * (1.0 - smoothstep(0.12, 1.08, length(delta) / radius));
          particleWarpSum += (particleVelocity * 0.82 + sideDir * localSide * handedness * 0.24) * coreWarp;
          particleFlowWeight += influence;
        }
        density = clamp(density * 0.32, 0.0, 2.0);
        heat = clamp(heat * 0.28, 0.0, 1.25);
        vec2 particleFlow = normalize(particleFlowSum / particleFlowWeight + vec2(uWakeMotionOffset.x * 0.28, 0.72));
        vec2 localParticleWarp = particleWarpSum;
        float localParticleWarpLength = length(localParticleWarp);
        if (localParticleWarpLength > 1.15) localParticleWarp *= 1.15 / localParticleWarpLength;
        float particleFlowStrength = clamp(particleFlowWeight * 0.22, 0.0, 1.0);
        float orbDistance = length(p);
        float surfaceDistance = max(0.0, orbDistance - uOrbRadius) / max(1.0, uOrbRadius);
        float surfaceBirth = 1.0 - smoothstep(0.0, 2.35, surfaceDistance);
        vec2 sourceFlow = normalize(vec2(uWakeMotionOffset.x * 1.25, 1.0));
        float flowMask = smoothstep(0.04, 0.65, density);
        float flowBlend = flowMask * smoothstep(0.18, 1.45, surfaceDistance) * 0.75;
        vec2 blendedFlow = normalize(mix(sourceFlow, particleFlow, flowBlend));
        vec3 noisePos = vec3(p / max(1.0, uOrbRadius), 0.0) * uWakeSdfPerlinScale;
        float time = uTime * uWakeSdfPerlinSpeed;
        vec2 lateral = vec2(-sourceFlow.y, sourceFlow.x) * sin(p.x / max(1.0, uOrbRadius) * 1.8 + surfaceDistance * 1.2) * 0.05;
        vec2 particleWarp = localParticleWarp * 0.72;
        noisePos.xy -= sourceFlow * (time * 0.42 + surfaceDistance * 0.08);
        noisePos.xy += particleWarp;
        noisePos.xy += lateral;
        noisePos.z = 0.37;
        float field = fbm(noisePos);
        float valueContrast = max(0.01, uWakeSdfPerlinContrast * 2.0);
        float contrastedField = clamp((field - 0.5) * valueContrast + 0.5, 0.0, 1.0);
        float threshold = mix(1.18, 0.38, clamp(uWakeDensity, 0.0, 1.0));
        float softness = max(0.025, uWakeSoftness / max(1.0, uOrbRadius) * 0.55);
        float noisyDensity = density + (field - 0.5) * 0.18;
        float sdfBody = smoothstep(threshold, threshold + softness, noisyDensity);
        float edge = smoothstep(threshold, threshold + softness * 1.4, noisyDensity) - smoothstep(threshold + softness * 1.3, threshold + softness * 2.9, noisyDensity);
        float whitePoint = max(uWakeSdfNoiseBlackPoint + 0.001, uWakeSdfNoiseWhitePoint);
        float noiseValue = clamp((contrastedField - uWakeSdfNoiseBlackPoint) / (whitePoint - uWakeSdfNoiseBlackPoint), 0.0, 1.0);
        float flame = sdfBody * mix(0.35, 1.0, noiseValue);
        float fireValue = clamp(noiseValue * 0.88 + heat * 0.04 + edge * 0.08, 0.0, 1.0);
        vec4 mapped = sampleSdfGraph(fireValue);
        float orbOcclusion = smoothstep(uOrbRadius * 0.72, uOrbRadius * 1.02, length(p));
        vec2 edgeDistance = min(vWakeUv, 1.0 - vWakeUv);
        float cardFade = smoothstep(0.0, 0.08, min(edgeDistance.x, edgeDistance.y));
        float alpha = flame * mapped.a * orbOcclusion * cardFade;
        if (uWakeSdfRenderMode == 1) {
          gl_FragColor = vec4(vec3(field), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 2) {
          gl_FragColor = vec4(vec3(noiseValue), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 3) {
          gl_FragColor = vec4(vec3(sdfBody), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 4) {
          gl_FragColor = vec4(vec3(fireValue), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 5) {
          gl_FragColor = vec4(vec3(alpha), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 6) {
          gl_FragColor = vec4(vec3(vWakeUv.x), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 7) {
          gl_FragColor = vec4(sourceFlow * 0.5 + 0.5, clamp(surfaceBirth, 0.0, 1.0), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 8) {
          gl_FragColor = vec4(vec3(noiseValue), sdfBody * cardFade);
          return;
        }
        if (uWakeSdfRenderMode == 9) {
          vec3 flowColor = vec3(particleFlow * 0.5 + 0.5, particleFlowStrength);
          gl_FragColor = vec4(flowColor, flowMask * cardFade);
          return;
        }
        if (uWakeSdfRenderMode == 10) {
          vec3 flowColor = vec3(blendedFlow * 0.5 + 0.5, flowBlend / 0.75);
          gl_FragColor = vec4(flowColor, flowMask * cardFade);
          return;
        }
        vec3 color = mapped.rgb * (0.7 + sdfBody * 0.62 + edge * 0.38);
        if (alpha <= 0.004) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createWakeSdfCardGeometry(width, height) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const geometry = new THREE.PlaneGeometry(safeWidth, safeHeight, 1, 1);
  return geometry;
}

let wakeSdfPreviewDebugPointTexture = null;
function getWakeSdfPreviewDebugPointTexture() {
  if (wakeSdfPreviewDebugPointTexture) return wakeSdfPreviewDebugPointTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
  gradient.addColorStop(0.0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.58, "rgba(255,255,255,1)");
  gradient.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(16, 16, 15, 0, Math.PI * 2);
  ctx.fill();
  wakeSdfPreviewDebugPointTexture = new THREE.CanvasTexture(canvas);
  wakeSdfPreviewDebugPointTexture.needsUpdate = true;
  return wakeSdfPreviewDebugPointTexture;
}

function createWakeSdfPreviewDebugVisuals(bo, material) {
  const group = new THREE.Group();
  group.name = "flame_aoe3d:wake_sdf_preview_debug";
  const orbRadius = bo * 0.5;
  const sourcePositions = new Float32Array(WAKE_SDF_SOURCE_GRAPH.length * 3);
  for (let i = 0; i < WAKE_SDF_SOURCE_GRAPH.length; i += 1) {
    const source = WAKE_SDF_SOURCE_GRAPH[i];
    sourcePositions[i * 3] = source[0] * orbRadius * 0.84;
    sourcePositions[i * 3 + 1] = source[1] * orbRadius * 0.84;
    sourcePositions[i * 3 + 2] = 1.5;
  }
  const sourceGeometry = new THREE.BufferGeometry();
  sourceGeometry.setAttribute("position", new THREE.BufferAttribute(sourcePositions, 3));
  const sourcePoints = new THREE.Points(sourceGeometry, new THREE.PointsMaterial({
    color: 0x00f6ff,
    size: 3,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    map: getWakeSdfPreviewDebugPointTexture(),
    alphaTest: 0.2,
    transparent: false,
    opacity: 1,
    toneMapped: false,
  }));
  sourcePoints.renderOrder = 18;
  group.add(sourcePoints);

  const particles = material && material.uniforms && material.uniforms.uWakeControlParticles && material.uniforms.uWakeControlParticles.value || [];
  const particlePositions = new Float32Array(WAKE_SDF_CONTROL_PARTICLE_COUNT * 3);
  const particleColors = new Float32Array(WAKE_SDF_CONTROL_PARTICLE_COUNT * 3);
  for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
    const particle = particles[i] || new THREE.Vector4();
    const ageT = i / Math.max(1, WAKE_SDF_CONTROL_PARTICLE_COUNT - 1);
    particlePositions[i * 3] = particle.x;
    particlePositions[i * 3 + 1] = particle.y;
    particlePositions[i * 3 + 2] = 2.5 + i * 0.002;
    particleColors[i * 3] = ageT < 0.5 ? 1.0 : 0.05;
    particleColors[i * 3 + 1] = ageT < 0.5 ? 0.0 : 1.0;
    particleColors[i * 3 + 2] = 1.0;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
  const particlePoints = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    size: 3.25,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    map: getWakeSdfPreviewDebugPointTexture(),
    alphaTest: 0.2,
    transparent: false,
    opacity: 1,
    toneMapped: false,
    vertexColors: true,
  }));
  particlePoints.renderOrder = 19;
  group.add(particlePoints);
  group.userData.debugBuffers = Object.freeze({
    particlePositions,
    particleColors,
    particleGeometry,
  });
  return group;
}

function resolveWakeSdfCardSize(bo, config) {
  const liftPx = bo * clampNumber(config && config.wakeSdfHeightBo, 0.1, 8, 1.15);
  const authoredSlackPx = bo * clampNumber(config && config.wakeLengthBo, 0, 4, 0);
  const motionSlackPx = Math.max(bo * 0.5, liftPx * 0.35, authoredSlackPx);
  const radiusPx = bo * clampNumber(config && config.wakeSdfRadiusBo, 0.05, 4, 0.42);
  const corePx = bo * clampNumber(config && config.wakeSdfCoreRadiusBo, 0.02, 3, 0.2);
  const softnessPx = bo * clampNumber(config && config.wakeSdfSoftnessBo, 0.001, 2, 0.3);
  const devEnvelopePx = bo * 12;
  const dynamicEnvelopePx = (liftPx + motionSlackPx + radiusPx + corePx + softnessPx) * 3.6;
  const fieldSizePx = Math.max(devEnvelopePx, dynamicEnvelopePx);
  return {
    width: fieldSizePx,
    height: fieldSizePx,
  };
}

export function createFlameAoe3dPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let aoeAuraDiscMaterial = null;
  let auraShellMaterial = null;
  let wakeMaterial = null;
  let wakeSdfMaterial = null;
  let wakeSdfDebugGroup = null;
  let orbShellMesh = null;
  let aoeAuraDiscMesh = null;
  let auraShellMesh = null;
  let wakeMesh = null;
  let wakeSdfMesh = null;
  let orbLight = null;
  let model = null;
  let createdAt = 0;
  let lastFrameMs = 0;
  let activeConfig = ORB_MATERIAL_CONFIG;
  let auraConfig = FLAME_AOE_3D_PREVIEW_DEFAULTS;
  let wakeConfig = FLAME_AOE_3D_PREVIEW_DEFAULTS;
  const wakeSdfPreviewParticles = Array.from({ length: WAKE_SDF_CONTROL_PARTICLE_COUNT }, () => ({
    position: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    age: 0,
    life: 1,
    radius: 1,
    heat: 0,
  }));
  let wakeSdfPreviewParticleCursor = 0;
  let wakeSdfPreviewSpawnAccumulator = 0;
  let wakeSdfPreviewRandomSeed = 0x51f15e;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    aoeAuraDiscMaterial = null;
    auraShellMaterial = null;
    wakeMaterial = null;
    wakeSdfMaterial = null;
    wakeSdfDebugGroup = null;
    orbShellMesh = null;
    aoeAuraDiscMesh = null;
    auraShellMesh = null;
    wakeMesh = null;
    wakeSdfMesh = null;
    orbLight = null;
    model = null;
  }

  function nextWakeSdfPreviewRandom() {
    wakeSdfPreviewRandomSeed = (wakeSdfPreviewRandomSeed * 1664525 + 1013904223) >>> 0;
    return wakeSdfPreviewRandomSeed / 4294967296;
  }

  function respawnWakeSdfPreviewParticle(index, bo, initialAge = 0) {
    const particle = wakeSdfPreviewParticles[index];
    if (!particle) return;
    const config = wakeConfig || FLAME_AOE_3D_PREVIEW_DEFAULTS;
    const particleLifeSec = clampNumber(config.wakeSdfParticleLifeMs, 100, 8000, 1500) / 1000;
    const spawnRadius = bo * clampNumber(config.wakeSdfSpawnAreaBo, 0.1, 2, 1) * 0.5;
    const particleRadiusBo = clampNumber(config.wakeSdfParticleRadiusBo, 0.02, 1.5, 0.16);
    const liftBias = clampNumber(config.wakeSdfLiftBias, -2, 4, 0.2);
    const jitterBo = clampNumber(config.wakeSdfJitterBo, 0, 1, 0.04);
    const source = WAKE_SDF_SOURCE_GRAPH[(wakeSdfPreviewParticleCursor + index) % WAKE_SDF_SOURCE_GRAPH.length] || WAKE_SDF_SOURCE_GRAPH[0];
    const jitterAngle = nextWakeSdfPreviewRandom() * Math.PI * 2;
    const jitterRadius = bo * jitterBo * (0.5 + nextWakeSdfPreviewRandom());
    particle.position
      .set(
        (source[0] / WAKE_SDF_SOURCE_GRAPH_RADIUS) * spawnRadius,
        (source[1] / WAKE_SDF_SOURCE_GRAPH_RADIUS) * spawnRadius
      )
      .add(new THREE.Vector2(Math.cos(jitterAngle), Math.sin(jitterAngle)).multiplyScalar(jitterRadius));
    particle.velocity.set(
      (nextWakeSdfPreviewRandom() - 0.5) * bo * jitterBo * 4.5,
      bo * liftBias * (0.7 + nextWakeSdfPreviewRandom() * 0.4)
    );
    particle.life = particleLifeSec;
    particle.age = Math.min(particle.life * 0.92, Math.max(0, initialAge));
    particle.radius = bo * particleRadiusBo * (0.82 + nextWakeSdfPreviewRandom() * 0.36);
    particle.heat = 0.7 + nextWakeSdfPreviewRandom() * 0.35;
  }

  function resetWakeSdfPreviewParticles(bo) {
    wakeSdfPreviewRandomSeed = 0x51f15e;
    wakeSdfPreviewSpawnAccumulator = 0;
    for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
      const lifeSec = clampNumber(wakeConfig && wakeConfig.wakeSdfParticleLifeMs, 100, 8000, 1500) / 1000;
      respawnWakeSdfPreviewParticle(i, bo, (i / WAKE_SDF_CONTROL_PARTICLE_COUNT) * lifeSec);
    }
  }

  function updateWakeSdfPreviewParticles(bo, dtSec) {
    const uniforms = wakeSdfMaterial && wakeSdfMaterial.uniforms;
    if (!uniforms || !uniforms.uWakeControlParticles || !uniforms.uWakeControlVelocities) return;
    const safeDt = Math.max(1 / 240, Math.min(0.12, Number(dtSec) || 1 / 60));
    const spawnInterval = 1 / clampNumber(wakeConfig && wakeConfig.wakeSdfSpawnRate, 1, 240, 43);
    wakeSdfPreviewSpawnAccumulator += safeDt;
    let spawnCount = 0;
    while (wakeSdfPreviewSpawnAccumulator >= spawnInterval && spawnCount < 4) {
      wakeSdfPreviewSpawnAccumulator -= spawnInterval;
      wakeSdfPreviewParticleCursor = (wakeSdfPreviewParticleCursor + 1) % WAKE_SDF_CONTROL_PARTICLE_COUNT;
      respawnWakeSdfPreviewParticle(wakeSdfPreviewParticleCursor, bo, 0);
      spawnCount += 1;
    }
    const heatDecay = clampNumber(wakeConfig && wakeConfig.wakeSdfHeatDecay, 0.1, 6, 1);
    const uniformParticles = uniforms.uWakeControlParticles.value;
    const uniformVelocities = uniforms.uWakeControlVelocities.value;
    for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
      const particle = wakeSdfPreviewParticles[i];
      particle.age += safeDt;
      if (particle.age >= particle.life) respawnWakeSdfPreviewParticle(i, bo, 0);
      particle.position.addScaledVector(particle.velocity, safeDt);
      const ageT = clampNumber(particle.age / Math.max(0.001, particle.life), 0, 1, 0);
      const heat = particle.heat * Math.pow(1 - ageT, heatDecay);
      const radius = particle.radius * (1 + ageT * 1.45);
      if (uniformParticles[i]) uniformParticles[i].set(particle.position.x, particle.position.y, radius, heat);
      if (uniformVelocities[i]) uniformVelocities[i].copy(particle.velocity).multiplyScalar(1 / Math.max(1, bo));
    }
    const debugBuffers = wakeSdfDebugGroup && wakeSdfDebugGroup.userData && wakeSdfDebugGroup.userData.debugBuffers;
    if (!debugBuffers || !debugBuffers.particlePositions || !debugBuffers.particleColors || !debugBuffers.particleGeometry) return;
    for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
      const particle = wakeSdfPreviewParticles[i];
      const ageT = clampNumber(particle.age / Math.max(0.001, particle.life), 0, 1, 0);
      debugBuffers.particlePositions[i * 3] = particle.position.x;
      debugBuffers.particlePositions[i * 3 + 1] = particle.position.y;
      debugBuffers.particlePositions[i * 3 + 2] = 2.5 + i * 0.002;
      debugBuffers.particleColors[i * 3] = ageT < 0.5 ? 1.0 : 0.05;
      debugBuffers.particleColors[i * 3 + 1] = ageT < 0.5 ? 0.0 : 1.0;
      debugBuffers.particleColors[i * 3 + 2] = 1.0;
    }
    debugBuffers.particleGeometry.attributes.position.needsUpdate = true;
    debugBuffers.particleGeometry.attributes.color.needsUpdate = true;
  }

  function ensureScene() {
    if (inspector || !els.previewRoot) return;
    const bo = readBo();
    createdAt = performance.now();
    lastFrameMs = createdAt;
    activeConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    auraConfig = readFlameAuraConfig(els);
    wakeConfig = readFlameWakeConfig(els);
    hydrateFlameAuraFields(els, auraConfig);
    hydrateFlameWakeFields(els, wakeConfig);
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "flameAoe3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled && wakeConfig.wakeSdfRenderMode === 0 ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const nowMs = performance.now();
        const dtSec = lastFrameMs ? (nowMs - lastFrameMs) / 1000 : 1 / 60;
        lastFrameMs = nowMs;
        const time = (nowMs - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (auraShellMaterial && auraShellMaterial.uniforms && auraShellMaterial.uniforms.uTime) auraShellMaterial.uniforms.uTime.value = time;
        if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uTime) wakeMaterial.uniforms.uTime.value = time;
        if (wakeSdfMaterial && wakeSdfMaterial.uniforms && wakeSdfMaterial.uniforms.uTime) wakeSdfMaterial.uniforms.uTime.value = time;
        if (wakeSdfMaterial) updateWakeSdfPreviewParticles(bo, dtSec);
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
      },
    });
    if (!inspector) return;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);

    shellMaterial = createOpalescentOrbShellMaterial(activeConfig);
    const created = createOrbModel({
      bo,
      shellMaterial,
      edgeMaterials: inspector.edgeMaterials,
      includeCore: false,
      includeRibs: false,
      shellSegments: 96,
      ringSegments: 192,
    });
    model = created.model;
    model.position.set(0, 0, 0);
    orbShellMesh = model.getObjectByName("orb3d:shell") || null;
    if (orbShellMesh) orbShellMesh.visible = layerVisible(els.flameAoe3dOrbVisibleBtn);
    aoeAuraDiscMaterial = createAoeAuraDiscMaterial(auraConfig);
    const aoeAuraDiameter = bo * auraConfig.aoeAuraDiameterBo;
    aoeAuraDiscMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(aoeAuraDiameter, aoeAuraDiameter, 64, 64),
      aoeAuraDiscMaterial
    );
    aoeAuraDiscMesh.name = "flame_aoe3d:aeo_aura_disc";
    aoeAuraDiscMesh.position.set(0, 0, -bo * 0.08);
    aoeAuraDiscMesh.renderOrder = 4;
    model.add(aoeAuraDiscMesh);
    auraShellMaterial = createAuraShellMaterial(auraConfig);
    auraShellMesh = new THREE.Mesh(
      new THREE.SphereGeometry(bo * 0.5 * auraConfig.auraScale, 96, 48),
      auraShellMaterial
    );
    auraShellMesh.name = "flame_aoe3d:aura_shell";
    auraShellMesh.renderOrder = 8;
    auraShellMesh.visible = layerVisible(els.flameAoe3dAuraVisibleBtn);
    model.add(auraShellMesh);
    if (wakeConfig.wakeMeshEnabled) {
      wakeMaterial = createWakeMaterial({
        ...wakeConfig,
        wakeDisplacePx: wakeConfig.wakeDisplaceEnabled ? bo * wakeConfig.wakeDisplaceBo : 0,
        wakeLiftPx: bo * wakeConfig.wakeLiftBo,
        wakeLiftCoreRadiusPx: bo * wakeConfig.wakeLiftCoreRadiusBo,
        wakeOrbHugRadiusPx: bo * wakeConfig.wakeOrbHugRadiusBo,
        wakeEnvelopeBlendPx: bo * wakeConfig.wakeEnvelopeBlendBo,
      });
      wakeMesh = new THREE.Mesh(
        createWakeElasticShellGeometry({
          baseRadius: bo * Math.max(0.5, wakeConfig.wakeRadiusBo),
          liftOffset: bo * (wakeConfig.wakeLiftBo + wakeConfig.wakeStretchStrength),
          liftRadius: bo * wakeConfig.wakeLiftCoreRadiusBo,
          padding: bo * wakeConfig.wakeEnvelopeBlendBo,
          blendSoftness: bo * wakeConfig.wakeOrbHugRadiusBo,
          radialSegments: wakeConfig.wakeSubdivisions,
          heightSegments: Math.max(8, Math.round(wakeConfig.wakeSubdivisions * 0.5)),
        }),
        wakeMaterial
      );
      wakeMesh.position.set(0, 0, 0);
      wakeMesh.name = "flame_aoe3d:directional_wake";
      wakeMesh.renderOrder = 10;
      wakeMesh.visible = layerVisible(els.flameAoe3dWakeVisibleBtn);
      model.add(wakeMesh);
    }
    if (wakeConfig.wakeSdfEnabled) {
      const wakeLiftPx = bo * wakeConfig.wakeSdfHeightBo;
      wakeSdfMaterial = createWakeSdfMaterial({
        ...wakeConfig,
        wakeLiftPx,
        wakeSdfRadiusPx: bo * wakeConfig.wakeSdfRadiusBo,
        wakeSdfCoreRadiusPx: bo * wakeConfig.wakeSdfCoreRadiusBo,
        wakeSdfBlendPx: bo * wakeConfig.wakeSdfBlendBo,
        wakeSdfSoftnessPx: bo * wakeConfig.wakeSdfSoftnessBo,
        wakeSdfParticleRadiusPx: bo * wakeConfig.wakeSdfParticleRadiusBo,
        orbRadiusPx: bo * 0.5,
      });
      const cardSize = resolveWakeSdfCardSize(bo, wakeConfig);
      wakeSdfMesh = new THREE.Mesh(createWakeSdfCardGeometry(cardSize.width, cardSize.height), wakeSdfMaterial);
      wakeSdfMesh.name = "flame_aoe3d:wake_sdf_field";
      wakeSdfMesh.renderOrder = 11;
      wakeSdfMesh.visible = layerVisible(els.flameAoe3dWakeSdfVisibleBtn);
      model.add(wakeSdfMesh);
      if (wakeConfig.wakeSdfDebugPoints) {
        wakeSdfDebugGroup = createWakeSdfPreviewDebugVisuals(bo, wakeSdfMaterial);
        wakeSdfDebugGroup.visible = wakeSdfMesh.visible;
        model.add(wakeSdfDebugGroup);
      }
      resetWakeSdfPreviewParticles(bo);
      updateWakeSdfPreviewParticles(bo, 1 / 60);
    }
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.render();
  }

  function applyLayerVisibility() {
    if (orbShellMesh) orbShellMesh.visible = layerVisible(els.flameAoe3dOrbVisibleBtn);
    if (auraShellMesh) auraShellMesh.visible = layerVisible(els.flameAoe3dAuraVisibleBtn);
    if (wakeMesh) wakeMesh.visible = layerVisible(els.flameAoe3dWakeVisibleBtn);
    if (wakeSdfMesh) wakeSdfMesh.visible = layerVisible(els.flameAoe3dWakeSdfVisibleBtn);
    if (wakeSdfDebugGroup) wakeSdfDebugGroup.visible = !!wakeSdfMesh && wakeSdfMesh.visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleLayer(button) {
    if (!button) return;
    const visible = layerVisible(button);
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    if (button === els.flameAoe3dWakeVisibleBtn && els.flameAoe3dWakeMeshEnabled) {
      els.flameAoe3dWakeMeshEnabled.value = visible ? "0" : "1";
    }
    if (button === els.flameAoe3dWakeSdfVisibleBtn && els.flameAoe3dWakeSdfEnabled) {
      els.flameAoe3dWakeSdfEnabled.value = visible ? "0" : "1";
      apply();
      return;
    }
    if (button === els.flameAoe3dWakeVisibleBtn) {
      apply();
      return;
    }
    applyLayerVisibility();
  }

  function toggleDisplace(button) {
    if (!button) return;
    const visible = layerVisible(button);
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    button.dispatchEvent(new Event("change", { bubbles: true }));
    apply();
  }

  function toggleGraph(button) {
    if (!button) return;
    const visible = layerVisible(button);
    const enabled = !visible;
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    if (els.flameAoe3dWakeGraphEnabled) els.flameAoe3dWakeGraphEnabled.value = enabled ? "1" : "0";
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeGraphEnabled) {
      wakeMaterial.uniforms.uWakeGraphEnabled.value = enabled ? 1 : 0;
    }
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeGraphCount) {
      wakeMaterial.uniforms.uWakeGraphCount.value = enabled
        ? Math.max(0, Math.min(4, getWakeGraphStopCount(wakeConfig)))
        : 0;
      wakeMaterial.needsUpdate = true;
    }
    if (inspector && typeof inspector.render === "function") inspector.render();
    apply();
  }

  function apply() {
    auraConfig = readFlameAuraConfig(els);
    wakeConfig = readFlameWakeConfig(els);
    hydrateFlameAuraFields(els, auraConfig);
    hydrateFlameWakeFields(els, wakeConfig);
    destroyInspector();
    ensureScene();
    return Object.freeze({ ...auraConfig, ...wakeConfig });
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.previewFlameAoe3d) els.previewFlameAoe3d.addEventListener("click", apply);
    document.querySelectorAll('[id^="flameAoe3dApply"]').forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
    bindInputCommits(document.querySelector('.section[data-effect="flame-aoe-3d"]'), apply);
    if (els.flameAoe3dOrbVisibleBtn) els.flameAoe3dOrbVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dOrbVisibleBtn));
    if (els.flameAoe3dAuraVisibleBtn) els.flameAoe3dAuraVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dAuraVisibleBtn));
    if (els.flameAoe3dWakeVisibleBtn) els.flameAoe3dWakeVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dWakeVisibleBtn));
    if (els.flameAoe3dWakeSdfVisibleBtn) els.flameAoe3dWakeSdfVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dWakeSdfVisibleBtn));
    if (els.flameAoe3dWakeDisplaceVisibleBtn) els.flameAoe3dWakeDisplaceVisibleBtn.addEventListener("click", () => toggleDisplace(els.flameAoe3dWakeDisplaceVisibleBtn));
    if (els.flameAoe3dWakeGraphVisibleBtn) els.flameAoe3dWakeGraphVisibleBtn.addEventListener("click", () => toggleGraph(els.flameAoe3dWakeGraphVisibleBtn));
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
