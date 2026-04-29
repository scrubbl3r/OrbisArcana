import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function readOrbSpawnPreviewConfig(els = {}) {
  return Object.freeze({
    bobRangeBO: clampNumber(els.orbSpawnBobRangeBO && els.orbSpawnBobRangeBO.value, 0, 4, 0.65),
    bobSpeedHz: clampNumber(els.orbSpawnBobSpeedHz && els.orbSpawnBobSpeedHz.value, 0, 10, 0.65),
    driftRangeBO: clampNumber(els.orbSpawnDriftRangeBO && els.orbSpawnDriftRangeBO.value, 0, 4, 0.2),
    driftSpeedHz: clampNumber(els.orbSpawnDriftSpeedHz && els.orbSpawnDriftSpeedHz.value, 0, 10, 0.23),
    liftReleaseThreshold01: clampNumber(
      els.orbSpawnLiftReleaseThreshold01 && els.orbSpawnLiftReleaseThreshold01.value,
      0,
      1,
      0.15
    ),
  });
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

export function createOrbSpawnPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let spawnConfig = null;
  let orbConfig = null;
  let bo = 72;
  let createdAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    spawnConfig = readOrbSpawnPreviewConfig(els);
    orbConfig = typeof getOrb3dVisualSettings === "function"
      ? getOrb3dVisualSettings()
      : ORB_3D_VISUAL_DEFAULTS;
    bo = readBo();
    createdAt = performance.now();

    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "orbSpawnCanvas",
      cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
      minDistanceBo: 0.9,
      maxDistanceBo: 28,
      enableShadows: true,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
          shellMaterial.uniforms.uTime.value = time;
        }
        if (orbLight) updateOrbPointLight(orbLight, time, orbConfig);
        if (model && spawnConfig) {
          const drift = Math.sin(time * Math.PI * 2 * spawnConfig.driftSpeedHz) * spawnConfig.driftRangeBO * bo;
          const bob = Math.sin(time * Math.PI * 2 * spawnConfig.bobSpeedHz) * spawnConfig.bobRangeBO * bo;
          model.position.set(drift, bob, 0);
        }
      },
    });
    if (!inspector) return spawnConfig;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);

    shellMaterial = createOpalescentOrbShellMaterial(orbConfig);
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
    orbLight = createOrbPointLight({ bo, config: orbConfig });
    updateOrbPointLight(orbLight, 0, orbConfig);
    model.add(orbLight);

    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.025));
    inspector.scene.add(model);
    inspector.render();
    return spawnConfig;
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    document.querySelectorAll('[id^="orbSpawnApply"]').forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
    if (els.previewOrbSpawn) els.previewOrbSpawn.addEventListener("click", apply);
  }

  return Object.freeze({
    apply,
    clear,
    wire,
  });
}
