import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260517b";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
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

export function readOrb3dPreviewConfig(els = {}) {
  return Object.freeze({
    shellBaseColor: colorFromFields(els, "orb3dShellBase", 0xfbfdff),
    shellCyanColor: colorFromFields(els, "orb3dShellCyan", 0x8ff4ff),
    shellVioletColor: colorFromFields(els, "orb3dShellViolet", 0xd0b8ff),
    shellGoldColor: colorFromFields(els, "orb3dShellGold", 0xffcc3f),
    shellFresnelPower: clampNumber(els.orb3dShellFresnelPower && els.orb3dShellFresnelPower.value, 0.1, 10, 3.15),
    shellRimAlphaPower: clampNumber(els.orb3dShellRimAlphaPower && els.orb3dShellRimAlphaPower.value, 0.1, 8, 0.92),
    shellCenterAlpha: clampNumber(els.orb3dShellCenterAlpha && els.orb3dShellCenterAlpha.value, 0, 1, 0.015),
    shellRimAlpha: clampNumber(els.orb3dShellRimAlpha && els.orb3dShellRimAlpha.value, 0, 1, 0.84),
    shellPastelMix: clampNumber(els.orb3dShellPastelMix && els.orb3dShellPastelMix.value, 0, 2, 0.84),
    shellRimPastelMix: clampNumber(els.orb3dShellRimPastelMix && els.orb3dShellRimPastelMix.value, 0, 2, 0.36),
    shellDriftPastelMix: clampNumber(els.orb3dShellDriftPastelMix && els.orb3dShellDriftPastelMix.value, 0, 2, 0.08),
    shellLuminanceBoost: clampNumber(els.orb3dShellLuminanceBoost && els.orb3dShellLuminanceBoost.value, 0, 4, 1.5),
    opalescenceSpeed: clampNumber(els.orb3dOpalescenceSpeed && els.orb3dOpalescenceSpeed.value, 0, 40, 9),
    driftScaleX: clampNumber(els.orb3dDriftScaleX && els.orb3dDriftScaleX.value, 0, 1, 0.03),
    driftScaleY: clampNumber(els.orb3dDriftScaleY && els.orb3dDriftScaleY.value, 0, 1, 0.036),
    driftScaleZ: clampNumber(els.orb3dDriftScaleZ && els.orb3dDriftScaleZ.value, 0, 1, 0.028),
    driftRateA: clampNumber(els.orb3dDriftRateA && els.orb3dDriftRateA.value, -4, 4, 0.42),
    driftRateB: clampNumber(els.orb3dDriftRateB && els.orb3dDriftRateB.value, -4, 4, -0.31),
    driftRateC: clampNumber(els.orb3dDriftRateC && els.orb3dDriftRateC.value, -4, 4, 0.24),
    driftPhaseB: clampNumber(els.orb3dDriftPhaseB && els.orb3dDriftPhaseB.value, 0, 12, 1.7),
    driftPhaseC: clampNumber(els.orb3dDriftPhaseC && els.orb3dDriftPhaseC.value, 0, 12, 3.1),
    goldMix: clampNumber(els.orb3dGoldMix && els.orb3dGoldMix.value, 0, 2, 0.34),
    lightColor: colorFromFields(els, "orb3dLight", 0xcfefff),
    lightIntensity: clampNumber(els.orb3dLightIntensity && els.orb3dLightIntensity.value, 0, 1000, 120),
    lightDistanceBO: clampNumber(els.orb3dLightDistanceBO && els.orb3dLightDistanceBO.value, 0, 40, 10),
    lightDecay: clampNumber(els.orb3dLightDecay && els.orb3dLightDecay.value, 0, 4, 1.35),
    lightPastelMix: clampNumber(els.orb3dLightPastelMix && els.orb3dLightPastelMix.value, 0, 1, 0.42),
    lightOffsetZBO: clampNumber(els.orb3dLightOffsetZBO && els.orb3dLightOffsetZBO.value, -4, 4, 0),
    lightCastShadow: !!(els.orb3dLightCastShadow && els.orb3dLightCastShadow.checked),
    lightShadowMapSize: roundedNumber(els.orb3dLightShadowMapSize && els.orb3dLightShadowMapSize.value, 512),
    lightShadowBias: clampNumber(els.orb3dLightShadowBias && els.orb3dLightShadowBias.value, -0.02, 0.02, -0.00025),
    lightShadowNormalBias: clampNumber(els.orb3dLightShadowNormalBias && els.orb3dLightShadowNormalBias.value, 0, 0.2, 0.018),
    lightShadowNearBO: clampNumber(els.orb3dLightShadowNearBO && els.orb3dLightShadowNearBO.value, 0.01, 4, 0.08),
    lightShadowFarBO: clampNumber(els.orb3dLightShadowFarBO && els.orb3dLightShadowFarBO.value, 0.1, 40, 10),
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

export function createOrb3dPreview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let activeConfig = null;
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
    activeConfig = readOrb3dPreviewConfig(els);
    const bo = readBo();
    createdAt = performance.now();

    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "orb3dCanvas",
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
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
      },
    });
    if (!inspector) return activeConfig;
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
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);

    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.025));
    inspector.scene.add(model);
    inspector.render();
    return activeConfig;
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    document.querySelectorAll('[id^="orb3dApply"]').forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
    if (els.previewOrb3d) els.previewOrb3d.addEventListener("click", apply);
  }

  return Object.freeze({
    apply,
    clear,
    wire,
  });
}
