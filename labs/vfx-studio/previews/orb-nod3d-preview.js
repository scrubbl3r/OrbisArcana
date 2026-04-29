import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import {
  createOrbNod3dRuntime,
  createOrbNod3dSurfaceDisplacementConfig,
  normalizeOrbNod3dConfig,
} from "../../../src/game-runtime/orb/orb-nod-3d-runtime.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS as ORB_MATERIAL_CONFIG } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";

function readRawConfig(els = {}) {
  return Object.freeze({
    orbNod3dShrinkPct: els.orbNod3dShrinkPct && els.orbNod3dShrinkPct.value,
    orbNod3dDurationMs: els.orbNod3dDurationMs && els.orbNod3dDurationMs.value,
    orbNod3dFillAlpha: els.orbNod3dFillAlpha && els.orbNod3dFillAlpha.value,
    orbNod3dWaveCount: els.orbNod3dWaveCount && els.orbNod3dWaveCount.value,
    orbNod3dLatitudinalBands: els.orbNod3dLatitudinalBands && els.orbNod3dLatitudinalBands.value,
    orbNod3dWaveDepthBO: els.orbNod3dWaveDepthBO && els.orbNod3dWaveDepthBO.value,
    orbNod3dOscillationSpeedHz: els.orbNod3dOscillationSpeedHz && els.orbNod3dOscillationSpeedHz.value,
    orbNod3dOscillationCount: els.orbNod3dOscillationCount && els.orbNod3dOscillationCount.value,
    orbNod3dEquatorFalloff: els.orbNod3dEquatorFalloff && els.orbNod3dEquatorFalloff.value,
    orbNod3dRippleSoftness: els.orbNod3dRippleSoftness && els.orbNod3dRippleSoftness.value,
  });
}

function hydrateFields(els = {}, cfg = {}) {
  if (els.orbNod3dShrinkPct) els.orbNod3dShrinkPct.value = String(Math.round(cfg.shrinkPct * 100));
  if (els.orbNod3dDurationMs) els.orbNod3dDurationMs.value = String(cfg.durationMs);
  if (els.orbNod3dFillAlpha) els.orbNod3dFillAlpha.value = Number(cfg.fillAlpha).toFixed(2);
  if (els.orbNod3dWaveCount) els.orbNod3dWaveCount.value = String(cfg.waveCount);
  if (els.orbNod3dLatitudinalBands) els.orbNod3dLatitudinalBands.value = String(cfg.latitudinalBands);
  if (els.orbNod3dWaveDepthBO) els.orbNod3dWaveDepthBO.value = Number(cfg.waveDepthBO).toFixed(3);
  if (els.orbNod3dOscillationSpeedHz) els.orbNod3dOscillationSpeedHz.value = Number(cfg.oscillationSpeedHz).toFixed(1);
  if (els.orbNod3dOscillationCount) els.orbNod3dOscillationCount.value = String(cfg.oscillationCount);
  if (els.orbNod3dEquatorFalloff) els.orbNod3dEquatorFalloff.value = Number(cfg.equatorFalloff).toFixed(2);
  if (els.orbNod3dRippleSoftness) els.orbNod3dRippleSoftness.value = Number(cfg.rippleSoftness).toFixed(2);
}

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

export function createOrbNod3dPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let nodRuntime = null;
  let activeRawConfig = null;
  let activeOrb3dConfig = ORB_MATERIAL_CONFIG;
  let createdAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function destroyInspector() {
    if (nodRuntime && typeof nodRuntime.dispose === "function") nodRuntime.dispose();
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    nodRuntime = null;
  }

  function apply() {
    if (!els.previewRoot) return null;
    activeRawConfig = readRawConfig(els);
    const cfg = normalizeOrbNod3dConfig(activeRawConfig);
    hydrateFields(els, cfg);
    destroyInspector();
    const bo = readBo();
    createdAt = performance.now();
    activeOrb3dConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "orbNod3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const materialTime = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
          shellMaterial.uniforms.uTime.value = materialTime;
        }
        if (nodRuntime && typeof nodRuntime.update === "function") nodRuntime.update(materialTime);
        if (orbLight) updateOrbPointLight(orbLight, materialTime, activeOrb3dConfig);
      },
    });
    if (!inspector) return cfg;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);

    shellMaterial = createOpalescentOrbShellMaterial(activeOrb3dConfig, {
      bo,
      surfaceDisplacement: createOrbNod3dSurfaceDisplacementConfig(activeRawConfig, {
        enabled: false,
      }),
    });
    nodRuntime = createOrbNod3dRuntime({
      getMaterial: () => shellMaterial,
      getBo: () => bo,
      getConfig: () => activeRawConfig,
      now: () => performance.now() - createdAt,
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
    orbLight = createOrbPointLight({ bo, config: activeOrb3dConfig });
    updateOrbPointLight(orbLight, 0, activeOrb3dConfig);
    model.add(orbLight);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.04));
    inspector.scene.add(model);
    inspector.render();
    return cfg;
  }

  function play() {
    activeRawConfig = readRawConfig(els);
    hydrateFields(els, normalizeOrbNod3dConfig(activeRawConfig));
    if (!inspector) apply();
    if (nodRuntime && typeof nodRuntime.play === "function") {
      nodRuntime.play({ config: activeRawConfig });
    }
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    [
      els.orbNod3dApplyShrinkBtn,
      els.orbNod3dApplyDurationBtn,
      els.orbNod3dApplyFillOpacityBtn,
      els.orbNod3dApplyWaveCountBtn,
      els.orbNod3dApplyLatitudinalBandsBtn,
      els.orbNod3dApplyWaveDepthBtn,
      els.orbNod3dApplyOscillationSpeedBtn,
      els.orbNod3dApplyOscillationCountBtn,
      els.orbNod3dApplyEquatorFalloffBtn,
      els.orbNod3dApplyRippleSoftnessBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
    if (els.previewOrbNod3d) els.previewOrbNod3d.addEventListener("click", play);
  }

  return Object.freeze({
    apply,
    clear,
    play,
    wire,
  });
}
