import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  createOrbShadowSpotLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260516a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../../src/game-runtime/orb/orb-lifecycle-3d-default.js?v=20260517f";
import {
  createOrbLifecycle3dCracks,
  createOrbLifecycle3dErosionPatch,
  createOrbLifecycle3dDissolveBurst,
  updateOrbLifecycle3dCracks,
  updateOrbLifecycle3dDissolveBurst,
} from "../../../src/game-runtime/orb/orb-lifecycle-3d-vfx-runtime.js?v=20260517e";
import { disposeThreeObject } from "../../../src/game-runtime/rendering/three/three-object-utils.js";

const ORB_STAGE_FILL_RATIO = 0.52;
const ORB_LIFECYCLE_PREVIEW_HP_MAX = 1000;
const ORB_LIFECYCLE_PREVIEW_HEAL_AMOUNT = 500;
const ORB_LIFECYCLE_SHADER_RANGE_FIELDS = Object.freeze([
  "orbLifecycle3dLuminanceBoostMinPct",
  "orbLifecycle3dLuminanceBoostMaxPct",
  "orbLifecycle3dCenterAlphaMinPct",
  "orbLifecycle3dCenterAlphaMaxPct",
  "orbLifecycle3dSpotIntensityMinPct",
  "orbLifecycle3dSpotIntensityMaxPct",
  "orbLifecycle3dSpotDistanceMinPct",
  "orbLifecycle3dSpotDistanceMaxPct",
  "orbLifecycle3dGoldMixMinPct",
  "orbLifecycle3dGoldMixMaxPct",
]);

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

function roundedNumber(value, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Math.round(Number.isFinite(n) ? n : f);
}

function colorFromFields(els, prefix, fallback) {
  const r = roundedNumber(els[`${prefix}R`] && els[`${prefix}R`].value, (fallback >> 16) & 255);
  const g = roundedNumber(els[`${prefix}G`] && els[`${prefix}G`].value, (fallback >> 8) & 255);
  const b = roundedNumber(els[`${prefix}B`] && els[`${prefix}B`].value, fallback & 255);
  return ((Math.max(0, Math.min(255, r)) << 16) | (Math.max(0, Math.min(255, g)) << 8) | Math.max(0, Math.min(255, b))) >>> 0;
}

function readLifecycle3dConfig(els = {}) {
  return Object.freeze({
    maxHits: Math.max(1, Math.min(1000, roundedNumber(els.orbLifecycle3dHitTotal && els.orbLifecycle3dHitTotal.value, ORB_LIFECYCLE_3D_DEFAULTS.maxHits))),
    erosionSeed: Math.max(1, roundedNumber(els.orbLifecycle3dSeed && els.orbLifecycle3dSeed.value, ORB_LIFECYCLE_3D_DEFAULTS.erosionSeed)),
    shellLuminanceBoostMinPct: roundedNumber(els.orbLifecycle3dLuminanceBoostMinPct && els.orbLifecycle3dLuminanceBoostMinPct.value, ORB_LIFECYCLE_3D_DEFAULTS.shellLuminanceBoostMinPct),
    shellLuminanceBoostMaxPct: roundedNumber(els.orbLifecycle3dLuminanceBoostMaxPct && els.orbLifecycle3dLuminanceBoostMaxPct.value, ORB_LIFECYCLE_3D_DEFAULTS.shellLuminanceBoostMaxPct),
    shellCenterAlphaMinPct: roundedNumber(els.orbLifecycle3dCenterAlphaMinPct && els.orbLifecycle3dCenterAlphaMinPct.value, ORB_LIFECYCLE_3D_DEFAULTS.shellCenterAlphaMinPct),
    shellCenterAlphaMaxPct: roundedNumber(els.orbLifecycle3dCenterAlphaMaxPct && els.orbLifecycle3dCenterAlphaMaxPct.value, ORB_LIFECYCLE_3D_DEFAULTS.shellCenterAlphaMaxPct),
    spotIntensityMinPct: roundedNumber(els.orbLifecycle3dSpotIntensityMinPct && els.orbLifecycle3dSpotIntensityMinPct.value, ORB_LIFECYCLE_3D_DEFAULTS.spotIntensityMinPct),
    spotIntensityMaxPct: roundedNumber(els.orbLifecycle3dSpotIntensityMaxPct && els.orbLifecycle3dSpotIntensityMaxPct.value, ORB_LIFECYCLE_3D_DEFAULTS.spotIntensityMaxPct),
    spotDistanceMinPct: roundedNumber(els.orbLifecycle3dSpotDistanceMinPct && els.orbLifecycle3dSpotDistanceMinPct.value, ORB_LIFECYCLE_3D_DEFAULTS.spotDistanceMinPct),
    spotDistanceMaxPct: roundedNumber(els.orbLifecycle3dSpotDistanceMaxPct && els.orbLifecycle3dSpotDistanceMaxPct.value, ORB_LIFECYCLE_3D_DEFAULTS.spotDistanceMaxPct),
    goldMixMinPct: roundedNumber(els.orbLifecycle3dGoldMixMinPct && els.orbLifecycle3dGoldMixMinPct.value, ORB_LIFECYCLE_3D_DEFAULTS.goldMixMinPct),
    goldMixMaxPct: roundedNumber(els.orbLifecycle3dGoldMixMaxPct && els.orbLifecycle3dGoldMixMaxPct.value, ORB_LIFECYCLE_3D_DEFAULTS.goldMixMaxPct),
    crackColor: ORB_LIFECYCLE_3D_DEFAULTS.crackColor,
    crackAlpha: clampNumber(els.orbLifecycle3dCrackAlpha && els.orbLifecycle3dCrackAlpha.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha),
    crackWidthPx: ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx,
    crackLiftBO: ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO,
    noiseScale: clampNumber(els.orbLifecycle3dNoiseScale && els.orbLifecycle3dNoiseScale.value, 0.1, 24, ORB_LIFECYCLE_3D_DEFAULTS.noiseScale),
    noiseContrast: clampNumber(els.orbLifecycle3dNoiseContrast && els.orbLifecycle3dNoiseContrast.value, 0.05, 3, ORB_LIFECYCLE_3D_DEFAULTS.noiseContrast),
    noiseOctaves: roundedNumber(els.orbLifecycle3dNoiseOctaves && els.orbLifecycle3dNoiseOctaves.value, ORB_LIFECYCLE_3D_DEFAULTS.noiseOctaves),
    noiseLacunarity: clampNumber(els.orbLifecycle3dNoiseLacunarity && els.orbLifecycle3dNoiseLacunarity.value, 1.05, 4, ORB_LIFECYCLE_3D_DEFAULTS.noiseLacunarity),
    noiseGain: clampNumber(els.orbLifecycle3dNoiseGain && els.orbLifecycle3dNoiseGain.value, 0.05, 0.95, ORB_LIFECYCLE_3D_DEFAULTS.noiseGain),
    detailScale: clampNumber(els.orbLifecycle3dDetailScale && els.orbLifecycle3dDetailScale.value, 0.1, 48, ORB_LIFECYCLE_3D_DEFAULTS.detailScale),
    detailAmount: clampNumber(els.orbLifecycle3dDetailAmount && els.orbLifecycle3dDetailAmount.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.detailAmount),
    coverageStart: clampNumber(els.orbLifecycle3dCoverageStart && els.orbLifecycle3dCoverageStart.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.coverageStart),
    coverageEnd: clampNumber(els.orbLifecycle3dCoverageEnd && els.orbLifecycle3dCoverageEnd.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.coverageEnd),
    growthCurve: clampNumber(els.orbLifecycle3dGrowthCurve && els.orbLifecycle3dGrowthCurve.value, 0.1, 5, ORB_LIFECYCLE_3D_DEFAULTS.growthCurve),
    edgeLightBrightness: clampNumber(els.orbLifecycle3dEdgeLightBrightness && els.orbLifecycle3dEdgeLightBrightness.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.edgeLightBrightness),
    edgeLightRange: clampNumber(els.orbLifecycle3dEdgeLightRange && els.orbLifecycle3dEdgeLightRange.value, 0.2, 24, ORB_LIFECYCLE_3D_DEFAULTS.edgeLightRange),
    holeEdgeSoftness: clampNumber(els.orbLifecycle3dHoleEdgeSoftness && els.orbLifecycle3dHoleEdgeSoftness.value, 0, 8, ORB_LIFECYCLE_3D_DEFAULTS.holeEdgeSoftness),
    particleCount: roundedNumber(els.orbLifecycle3dParticleCount && els.orbLifecycle3dParticleCount.value, ORB_LIFECYCLE_3D_DEFAULTS.particleCount),
    particleColor: colorFromFields(els, "orbLifecycle3dParticle", ORB_LIFECYCLE_3D_DEFAULTS.particleColor),
    particleSizePx: clampNumber(els.orbLifecycle3dParticleSize && els.orbLifecycle3dParticleSize.value, 0.5, 32, ORB_LIFECYCLE_3D_DEFAULTS.particleSizePx),
    particleSpeedMinBO: clampNumber(els.orbLifecycle3dParticleSpeedMin && els.orbLifecycle3dParticleSpeedMin.value, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMinBO),
    particleSpeedMaxBO: clampNumber(els.orbLifecycle3dParticleSpeedMax && els.orbLifecycle3dParticleSpeedMax.value, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMaxBO),
    particleDrag: clampNumber(els.orbLifecycle3dParticleDrag && els.orbLifecycle3dParticleDrag.value, 0, 12, ORB_LIFECYCLE_3D_DEFAULTS.particleDrag),
    particleTtlMs: roundedNumber(els.orbLifecycle3dParticleTtl && els.orbLifecycle3dParticleTtl.value, ORB_LIFECYCLE_3D_DEFAULTS.particleTtlMs),
  });
}

function resolvePreviewBounds(root) {
  if (!root || typeof root.getBoundingClientRect !== "function") return null;
  const rootBounds = root.getBoundingClientRect();
  if (rootBounds.width > 1 && rootBounds.height > 1) return rootBounds;
  const stage = root.closest && root.closest(".stage");
  const fallback = stage || root.parentElement;
  if (!fallback || typeof fallback.getBoundingClientRect !== "function") return rootBounds;
  const fallbackBounds = fallback.getBoundingClientRect();
  return fallbackBounds.width > 1 && fallbackBounds.height > 1 ? fallbackBounds : rootBounds;
}

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = resolvePreviewBounds(root);
  if (!bounds || bounds.width <= 1 || bounds.height <= 1) return;
  const viewportWidth = Math.max(1, Number(bounds.width) || 1);
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  if (inspector.renderer && typeof inspector.renderer.setSize === "function") {
    inspector.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    inspector.renderer.setSize(Math.round(viewportWidth), Math.round(viewportHeight), false);
  }
  if (inspector.composer && typeof inspector.composer.setSize === "function") {
    inspector.composer.setSize(Math.round(viewportWidth), Math.round(viewportHeight));
  }
  camera.aspect = viewportWidth / viewportHeight;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const focalDistance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  const targetOrbPx = Math.max(1, Math.min(viewportWidth, viewportHeight) * ORB_STAGE_FILL_RATIO);
  const framedOrbDistance = (Math.max(1, Number(bo) || 1) * focalDistance) / targetOrbPx;
  const distance = Math.max(focalDistance, framedOrbDistance);
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + (bo * 20));
  camera.updateProjectionMatrix();
  if (Array.isArray(inspector.edgeMaterials)) {
    inspector.edgeMaterials.forEach((material) => {
      if (material && material.resolution) material.resolution.set(viewportWidth, viewportHeight);
    });
  }
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

export function createOrbLifecycle3dPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let model = null;
  let shellMaterial = null;
  let pointLight = null;
  let shadowSpot = null;
  let orbShellMesh = null;
  let cracks = null;
  let burst = null;
  let hitsTaken = 0;
  let previewHp = ORB_LIFECYCLE_PREVIEW_HP_MAX;
  let seed = Math.max(1, Number(ORB_LIFECYCLE_3D_DEFAULTS.erosionSeed) || 1001);
  let bornAt = 0;
  let activeOrbConfig = ORB_3D_VISUAL_DEFAULTS;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function readMaxHits(config = readLifecycle3dConfig(els)) {
    return Math.max(1, Number(config.maxHits) || 1);
  }

  function syncHitsFromPreviewHp(config = readLifecycle3dConfig(els)) {
    const maxHits = readMaxHits(config);
    const damagedHp = ORB_LIFECYCLE_PREVIEW_HP_MAX - Math.max(0, Math.min(ORB_LIFECYCLE_PREVIEW_HP_MAX, previewHp));
    const hitSize = ORB_LIFECYCLE_PREVIEW_HP_MAX / maxHits;
    hitsTaken = previewHp <= 0
      ? maxHits
      : Math.max(0, Math.min(maxHits, Math.floor(damagedHp / hitSize)));
    return hitsTaken;
  }

  function setPreviewHp(nextHp, config = readLifecycle3dConfig(els)) {
    previewHp = Math.max(0, Math.min(ORB_LIFECYCLE_PREVIEW_HP_MAX, Number(nextHp) || 0));
    syncHitsFromPreviewHp(config);
    return previewHp;
  }

  function readHpRatio() {
    return Math.max(0, Math.min(1, previewHp / ORB_LIFECYCLE_PREVIEW_HP_MAX));
  }

  function readHp() {
    return Math.round(Math.max(0, Math.min(ORB_LIFECYCLE_PREVIEW_HP_MAX, previewHp)));
  }

  function readHitDamageAmount(config = readLifecycle3dConfig(els)) {
    const maxHits = Math.max(1, Number(config.maxHits) || 1);
    return ORB_LIFECYCLE_PREVIEW_HP_MAX / maxHits;
  }

  function resolvePctLerp(baseValue, minPct, maxPct, hpRatio, min = -Infinity, max = Infinity) {
    const base = Number(baseValue);
    const fallback = Number.isFinite(base) ? base : 0;
    const minValue = fallback * ((Number(minPct) || 0) / 100);
    const maxValue = fallback * ((Number(maxPct) || 0) / 100);
    return Math.max(min, Math.min(max, lerp(minValue, maxValue, hpRatio)));
  }

  function resolveOrbShaderLifecycleState(config = readLifecycle3dConfig(els)) {
    const hpRatio = readHpRatio();
    const baseConfig = activeOrbConfig || ORB_3D_VISUAL_DEFAULTS;
    return Object.freeze({
      hp: readHp(),
      hpRatio,
      shellLuminanceBoost: resolvePctLerp(baseConfig.shellLuminanceBoost, config.shellLuminanceBoostMinPct, config.shellLuminanceBoostMaxPct, hpRatio, 0, 12),
      shellCenterAlpha: resolvePctLerp(baseConfig.shellCenterAlpha, config.shellCenterAlphaMinPct, config.shellCenterAlphaMaxPct, hpRatio, 0, 1),
      pointLightIntensity: resolvePctLerp(baseConfig.lightIntensity, config.spotIntensityMinPct, config.spotIntensityMaxPct, hpRatio, 0, 10000),
      pointLightDistanceBO: resolvePctLerp(baseConfig.lightDistanceBO, config.spotDistanceMinPct, config.spotDistanceMaxPct, hpRatio, 0, 1000),
      shadowSpotIntensity: resolvePctLerp(baseConfig.shadowSpotIntensity, config.spotIntensityMinPct, config.spotIntensityMaxPct, hpRatio, 0, 10000),
      shadowSpotDistanceBO: resolvePctLerp(baseConfig.shadowSpotDistanceBO, config.spotDistanceMinPct, config.spotDistanceMaxPct, hpRatio, 0, 1000),
      goldMix: resolvePctLerp(baseConfig.goldMix, config.goldMixMinPct, config.goldMixMaxPct, hpRatio, 0, 2),
    });
  }

  function applyOrbShaderLifecycleState(config = readLifecycle3dConfig(els)) {
    const shaderState = resolveOrbShaderLifecycleState(config);
    const uniforms = shellMaterial && shellMaterial.uniforms ? shellMaterial.uniforms : null;
    if (uniforms && uniforms.uShellLuminanceBoost) uniforms.uShellLuminanceBoost.value = shaderState.shellLuminanceBoost;
    if (uniforms && uniforms.uShellCenterAlpha) uniforms.uShellCenterAlpha.value = shaderState.shellCenterAlpha;
    if (uniforms && uniforms.uGoldMix) uniforms.uGoldMix.value = shaderState.goldMix;
    if (pointLight) {
      const bo = readBo();
      pointLight.intensity = shaderState.pointLightIntensity;
      pointLight.distance = shaderState.pointLightDistanceBO * bo;
    }
    if (shadowSpot) {
      const bo = readBo();
      shadowSpot.intensity = shaderState.shadowSpotIntensity;
      shadowSpot.distance = shaderState.shadowSpotDistanceBO * bo;
      if (shadowSpot.shadow && shadowSpot.shadow.camera) {
        shadowSpot.shadow.camera.far = Math.max(1, shadowSpot.distance);
        shadowSpot.shadow.camera.updateProjectionMatrix();
      }
    }
    return shaderState;
  }

  function updateStatus(config = readLifecycle3dConfig(els)) {
    if (els.orbLifecycle3dStatus) {
      els.orbLifecycle3dStatus.value = `Hits ${hitsTaken} / ${readMaxHits(config)} - HP ${readHp()} / ${ORB_LIFECYCLE_PREVIEW_HP_MAX}`;
    }
  }

  function syncSeedField() {
    if (els.orbLifecycle3dSeed) els.orbLifecycle3dSeed.value = String(Math.max(1, Math.round(seed)));
  }

  function readSeedFromField(config = readLifecycle3dConfig(els)) {
    seed = Math.max(1, Math.round(Number(config.erosionSeed) || Number(ORB_LIFECYCLE_3D_DEFAULTS.erosionSeed) || 1001));
    syncSeedField();
  }

  function rollSeed() {
    seed = ((Math.random() * 1e9) | 0) || 1;
    syncSeedField();
    return seed;
  }

  function removeCracks() {
    if (cracks && cracks.parent) cracks.parent.remove(cracks);
    if (cracks) disposeThreeObject(cracks);
    cracks = null;
  }

  function rebuildOrbShellMaterial(config = readLifecycle3dConfig(els)) {
    if (!orbShellMesh) return;
    const previous = shellMaterial;
    shellMaterial = createOpalescentOrbShellMaterial(activeOrbConfig, {
      lifecycleErosion: createOrbLifecycle3dErosionPatch({
        hitsTaken,
        maxHits: config.maxHits,
        seed,
        config,
      }),
    });
    orbShellMesh.material = shellMaterial;
    applyOrbShaderLifecycleState(config);
    if (previous && previous !== shellMaterial && typeof previous.dispose === "function") previous.dispose();
  }

  function removeBurst() {
    if (burst && burst.parent) burst.parent.remove(burst);
    if (burst) disposeThreeObject(burst);
    burst = null;
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    model = null;
    shellMaterial = null;
    pointLight = null;
    shadowSpot = null;
    orbShellMesh = null;
    cracks = null;
    burst = null;
  }

  function layerVisible(button) {
    return !button || button.getAttribute("aria-pressed") !== "false";
  }

  function applyLayerVisibility() {
    if (orbShellMesh) orbShellMesh.visible = layerVisible(els.orbLifecycle3dOrbVisibleBtn);
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleLayer(button) {
    if (!button) return;
    const visible = layerVisible(button);
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    applyLayerVisibility();
  }

  function rebuildCracks(config = readLifecycle3dConfig(els)) {
    if (!model) return;
    removeCracks();
    rebuildOrbShellMaterial(config);
    cracks = createOrbLifecycle3dCracks({
      bo: readBo(),
      hitsTaken,
      maxHits: config.maxHits,
      seed,
      config,
    });
    model.add(cracks);
  }

  function apply() {
    if (!els.previewRoot) return null;
    const config = readLifecycle3dConfig(els);
    readSeedFromField(config);
    const bo = readBo();
    if (!inspector) {
      activeOrbConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_3D_VISUAL_DEFAULTS;
      inspector = createWorldObjectInspector({
        root: els.previewRoot,
        bo,
        canvasClassName: "orbLifecycle3dCanvas",
        cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
        minDistanceBo: 0.9,
        maxDistanceBo: 28,
        enableShadows: true,
        bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
        onFrame: () => {
          const t = (performance.now() - bornAt) / 1000;
          if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
            shellMaterial.uniforms.uTime.value = t;
          }
          if (pointLight) updateOrbPointLight(pointLight, t, { ...activeOrbConfig, goldMix: resolveOrbShaderLifecycleState(readLifecycle3dConfig(els)).goldMix });
          if (cracks) updateOrbLifecycle3dCracks(cracks, performance.now());
          if (burst && !updateOrbLifecycle3dDissolveBurst(burst, performance.now())) removeBurst();
        },
      });
      if (!inspector) return config;
      frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);
      shellMaterial = createOpalescentOrbShellMaterial(activeOrbConfig, {
        lifecycleErosion: createOrbLifecycle3dErosionPatch({
          hitsTaken,
          maxHits: config.maxHits,
          seed,
          config,
        }),
      });
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
      orbShellMesh = model.getObjectByName("orb3d:shell") || null;
      if (orbShellMesh) orbShellMesh.visible = layerVisible(els.orbLifecycle3dOrbVisibleBtn);
      pointLight = createOrbPointLight({ bo, config: activeOrbConfig });
      model.add(pointLight);
      shadowSpot = createOrbShadowSpotLight({ bo, config: activeOrbConfig });
      if (shadowSpot) {
        shadowSpot.position.set(bo * 0.35, bo * 0.55, bo * 1.8);
        shadowSpot.target = model;
        inspector.scene.add(shadowSpot);
      }
      inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.025));
      inspector.scene.add(model);
      bornAt = performance.now();
    }
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);
    setPreviewHp(previewHp, config);
    rebuildCracks(config);
    applyOrbShaderLifecycleState(config);
    updateStatus(config);
    inspector.render();
    return config;
  }

  function hit() {
    const config = readLifecycle3dConfig(els);
    setPreviewHp(previewHp - readHitDamageAmount(config), config);
    apply();
    if (previewHp <= 0) {
      removeBurst();
      if (model) model.visible = false;
      burst = createOrbLifecycle3dDissolveBurst({
        bo: readBo(),
        seed: seed ^ 0x9e3779b9,
        config,
      });
      if (inspector) inspector.scene.add(burst);
    }
  }

  function heal() {
    const config = readLifecycle3dConfig(els);
    setPreviewHp(previewHp + ORB_LIFECYCLE_PREVIEW_HEAL_AMOUNT, config);
    removeBurst();
    if (model) model.visible = true;
    apply();
  }

  function regenerate() {
    rollSeed();
    setPreviewHp(ORB_LIFECYCLE_PREVIEW_HP_MAX);
    removeBurst();
    if (model) model.visible = true;
    apply();
  }

  function regenerateSeed() {
    rollSeed();
    removeBurst();
    if (model) model.visible = true;
    apply();
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    syncSeedField();
    if (els.orbLifecycle3dOrbVisibleBtn) els.orbLifecycle3dOrbVisibleBtn.addEventListener("click", () => toggleLayer(els.orbLifecycle3dOrbVisibleBtn));
    if (els.orbLifecycle3dApplyCrackBtn) els.orbLifecycle3dApplyCrackBtn.addEventListener("click", apply);
    if (els.orbLifecycle3dApplyParticleBtn) els.orbLifecycle3dApplyParticleBtn.addEventListener("click", apply);
    ORB_LIFECYCLE_SHADER_RANGE_FIELDS.forEach((id) => {
      const field = els[id];
      if (field) field.addEventListener("input", () => {
        const config = readLifecycle3dConfig(els);
        applyOrbShaderLifecycleState(config);
        updateStatus(config);
        if (inspector && typeof inspector.render === "function") inspector.render();
      });
    });
    if (els.orbLifecycle3dHitBtn) els.orbLifecycle3dHitBtn.addEventListener("click", hit);
    if (els.orbLifecycle3dHealBtn) els.orbLifecycle3dHealBtn.addEventListener("click", heal);
    if (els.orbLifecycle3dRegenerateBtn) els.orbLifecycle3dRegenerateBtn.addEventListener("click", regenerate);
    if (els.orbLifecycle3dRegenerateSeedBtn) els.orbLifecycle3dRegenerateSeedBtn.addEventListener("click", regenerateSeed);
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
