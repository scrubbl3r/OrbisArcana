import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../../src/game-runtime/orb/orb-lifecycle-3d-default.js?v=20260430a";
import {
  createOrbLifecycle3dCracks,
  createOrbLifecycle3dDissolveBurst,
  updateOrbLifecycle3dCracks,
  updateOrbLifecycle3dDissolveBurst,
} from "../../../src/game-runtime/orb/orb-lifecycle-3d-vfx-runtime.js?v=20260430b";
import { disposeThreeObject } from "../../../src/game-runtime/rendering/three/three-object-utils.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
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
    maxHits: roundedNumber(els.orbLifecycle3dHitTotal && els.orbLifecycle3dHitTotal.value, ORB_LIFECYCLE_3D_DEFAULTS.maxHits),
    maxCracks: roundedNumber(els.orbLifecycle3dCrackTotal && els.orbLifecycle3dCrackTotal.value, ORB_LIFECYCLE_3D_DEFAULTS.maxCracks),
    crackColor: colorFromFields(els, "orbLifecycle3dCrack", ORB_LIFECYCLE_3D_DEFAULTS.crackColor),
    crackAlpha: clampNumber(els.orbLifecycle3dCrackAlpha && els.orbLifecycle3dCrackAlpha.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha),
    crackWidthPx: clampNumber(els.orbLifecycle3dCrackStroke && els.orbLifecycle3dCrackStroke.value, 0.25, 12, ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx),
    crackLiftBO: clampNumber(els.orbLifecycle3dCrackLift && els.orbLifecycle3dCrackLift.value, 0, 0.2, ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO),
    criticalGlow: clampNumber(els.orbLifecycle3dCriticalGlow && els.orbLifecycle3dCriticalGlow.value, 0, 4, ORB_LIFECYCLE_3D_DEFAULTS.criticalGlow),
    energyColor: colorFromFields(els, "orbLifecycle3dEnergy", ORB_LIFECYCLE_3D_DEFAULTS.energyColor),
    mutationSpeed: clampNumber(els.orbLifecycle3dMutationSpeed && els.orbLifecycle3dMutationSpeed.value, 0, 2, ORB_LIFECYCLE_3D_DEFAULTS.mutationSpeed),
    mutationAmount: clampNumber(els.orbLifecycle3dMutationAmount && els.orbLifecycle3dMutationAmount.value, 0, 1.5, ORB_LIFECYCLE_3D_DEFAULTS.mutationAmount),
    diffuseWash: clampNumber(els.orbLifecycle3dDiffuseWash && els.orbLifecycle3dDiffuseWash.value, 0, 2, ORB_LIFECYCLE_3D_DEFAULTS.diffuseWash),
    edgeBrightness: clampNumber(els.orbLifecycle3dEdgeBrightness && els.orbLifecycle3dEdgeBrightness.value, 0, 3, ORB_LIFECYCLE_3D_DEFAULTS.edgeBrightness),
    cellDarkness: clampNumber(els.orbLifecycle3dCellDarkness && els.orbLifecycle3dCellDarkness.value, 0, 2, ORB_LIFECYCLE_3D_DEFAULTS.cellDarkness),
    detailEmergence: clampNumber(els.orbLifecycle3dDetailEmergence && els.orbLifecycle3dDetailEmergence.value, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.detailEmergence),
    particleCount: roundedNumber(els.orbLifecycle3dParticleCount && els.orbLifecycle3dParticleCount.value, ORB_LIFECYCLE_3D_DEFAULTS.particleCount),
    particleColor: colorFromFields(els, "orbLifecycle3dParticle", ORB_LIFECYCLE_3D_DEFAULTS.particleColor),
    particleSizePx: clampNumber(els.orbLifecycle3dParticleSize && els.orbLifecycle3dParticleSize.value, 0.5, 32, ORB_LIFECYCLE_3D_DEFAULTS.particleSizePx),
    particleSpeedMinBO: clampNumber(els.orbLifecycle3dParticleSpeedMin && els.orbLifecycle3dParticleSpeedMin.value, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMinBO),
    particleSpeedMaxBO: clampNumber(els.orbLifecycle3dParticleSpeedMax && els.orbLifecycle3dParticleSpeedMax.value, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMaxBO),
    particleDrag: clampNumber(els.orbLifecycle3dParticleDrag && els.orbLifecycle3dParticleDrag.value, 0, 12, ORB_LIFECYCLE_3D_DEFAULTS.particleDrag),
    particleTtlMs: roundedNumber(els.orbLifecycle3dParticleTtl && els.orbLifecycle3dParticleTtl.value, ORB_LIFECYCLE_3D_DEFAULTS.particleTtlMs),
  });
}

function frameCamera(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const height = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fov = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = height / (2 * Math.tan(fov * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + (bo * 20));
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.update();
  }
}

export function createOrbLifecycle3dPreview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let model = null;
  let shellMaterial = null;
  let pointLight = null;
  let cracks = null;
  let burst = null;
  let hitsTaken = 0;
  let seed = 1001;
  let bornAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function updateStatus(config = readLifecycle3dConfig(els)) {
    if (els.orbLifecycle3dStatus) {
      els.orbLifecycle3dStatus.value = `Hits ${hitsTaken} / ${Math.max(1, Number(config.maxHits) || 1)}`;
    }
  }

  function removeCracks() {
    if (cracks && cracks.parent) cracks.parent.remove(cracks);
    if (cracks) disposeThreeObject(cracks);
    cracks = null;
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
    cracks = null;
    burst = null;
  }

  function rebuildCracks(config = readLifecycle3dConfig(els)) {
    if (!model) return;
    removeCracks();
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
    const bo = readBo();
    if (!inspector) {
      inspector = createWorldObjectInspector({
        root: els.previewRoot,
        bo,
        canvasClassName: "orbLifecycle3dCanvas",
        cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
        minDistanceBo: 0.9,
        maxDistanceBo: 28,
        enableShadows: true,
        onFrame: () => {
          const t = (performance.now() - bornAt) / 1000;
          if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
            shellMaterial.uniforms.uTime.value = t;
          }
          if (pointLight) updateOrbPointLight(pointLight, t, ORB_3D_VISUAL_DEFAULTS);
          if (cracks) updateOrbLifecycle3dCracks(cracks, performance.now());
          if (burst && !updateOrbLifecycle3dDissolveBurst(burst, performance.now())) removeBurst();
        },
      });
      if (!inspector) return config;
      frameCamera(inspector, els.previewRoot, bo);
      shellMaterial = createOpalescentOrbShellMaterial(ORB_3D_VISUAL_DEFAULTS);
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
      pointLight = createOrbPointLight({ bo, config: ORB_3D_VISUAL_DEFAULTS });
      model.add(pointLight);
      inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.025));
      inspector.scene.add(model);
      bornAt = performance.now();
    }
    hitsTaken = Math.min(hitsTaken, Math.max(1, Number(config.maxHits) || 1));
    rebuildCracks(config);
    updateStatus(config);
    inspector.render();
    return config;
  }

  function hit() {
    const config = readLifecycle3dConfig(els);
    hitsTaken = Math.min(Math.max(1, Number(config.maxHits) || 1), hitsTaken + 1);
    apply();
    if (hitsTaken >= Math.max(1, Number(config.maxHits) || 1)) {
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
    hitsTaken = Math.max(0, hitsTaken - 1);
    removeBurst();
    if (model) model.visible = true;
    apply();
  }

  function regenerate() {
    seed = ((Math.random() * 1e9) | 0) || 1;
    hitsTaken = 0;
    removeBurst();
    if (model) model.visible = true;
    apply();
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.orbLifecycle3dApplyCrackBtn) els.orbLifecycle3dApplyCrackBtn.addEventListener("click", apply);
    if (els.orbLifecycle3dApplyParticleBtn) els.orbLifecycle3dApplyParticleBtn.addEventListener("click", apply);
    if (els.orbLifecycle3dHitBtn) els.orbLifecycle3dHitBtn.addEventListener("click", hit);
    if (els.orbLifecycle3dHealBtn) els.orbLifecycle3dHealBtn.addEventListener("click", heal);
    if (els.orbLifecycle3dRegenerateBtn) els.orbLifecycle3dRegenerateBtn.addEventListener("click", regenerate);
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
