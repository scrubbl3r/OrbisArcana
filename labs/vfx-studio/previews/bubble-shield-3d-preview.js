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
import {
  createOrbLifecycle3dCracks,
  updateOrbLifecycle3dCracks,
} from "../../../src/game-runtime/orb/orb-lifecycle-3d-vfx-runtime.js?v=20260430a";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : fallback));
}

function readHex(els, prefix, fallback) {
  const r = Math.round(clampNumber(els[`${prefix}R`] && els[`${prefix}R`].value, 0, 255, (fallback >> 16) & 255));
  const g = Math.round(clampNumber(els[`${prefix}G`] && els[`${prefix}G`].value, 0, 255, (fallback >> 8) & 255));
  const b = Math.round(clampNumber(els[`${prefix}B`] && els[`${prefix}B`].value, 0, 255, fallback & 255));
  return (r << 16) + (g << 8) + b;
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

function layerVisible(button) {
  return !button || button.getAttribute("aria-pressed") !== "false";
}

export function createBubbleShield3dPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let shield = null;
  let raf = 0;
  let createdAt = 0;
  let activeConfig = ORB_MATERIAL_CONFIG;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function readConfig() {
    return {
      durationMs: Math.round(clampNumber(els.shield3dMs && els.shield3dMs.value, 80, 120000, 5000)),
      diameterRatio: clampNumber(els.shield3dDiameterRatio && els.shield3dDiameterRatio.value, 0.1, 8, 1.24),
      alpha: clampNumber(els.shield3dAlpha && els.shield3dAlpha.value, 0, 1, 1),
      pulseMs: Math.round(clampNumber(els.shield3dPulseMs && els.shield3dPulseMs.value, 20, 700, 80)),
      pulseMin: clampNumber(els.shield3dPulseMin && els.shield3dPulseMin.value, 0, 1, 0.3),
      pulseMax: clampNumber(els.shield3dPulseMax && els.shield3dPulseMax.value, 0, 1, 1),
      maxHits: 3,
      maxCracks: Math.round(clampNumber(els.shield3dCrackTotal && els.shield3dCrackTotal.value, 3, 96, 8)),
      crackColor: readHex(els, "shield3dCrack", 0xf8fdff),
      crackAlpha: clampNumber(els.shield3dCrackAlpha && els.shield3dCrackAlpha.value, 0, 1, 0.6),
      crackWidthPx: clampNumber(els.shield3dCrackStroke && els.shield3dCrackStroke.value, 0.25, 12, 1),
      crackLiftBO: clampNumber(els.shield3dCrackLift && els.shield3dCrackLift.value, 0, 0.2, 0),
      criticalGlow: clampNumber(els.shield3dCriticalGlow && els.shield3dCriticalGlow.value, 0, 4, 1.35),
      energyColor: readHex(els, "shield3dEnergy", 0x94b8c2),
      mutationSpeed: clampNumber(els.shield3dMutationSpeed && els.shield3dMutationSpeed.value, 0, Infinity, 2),
      mutationAmount: clampNumber(els.shield3dMutationAmount && els.shield3dMutationAmount.value, 0, Infinity, 1.5),
      diffuseWash: clampNumber(els.shield3dDiffuseWash && els.shield3dDiffuseWash.value, 0, 2, 1),
      edgeBrightness: clampNumber(els.shield3dEdgeBrightness && els.shield3dEdgeBrightness.value, 0, 3, 1),
      cellDarkness: clampNumber(els.shield3dCellDarkness && els.shield3dCellDarkness.value, 0, 2, 1),
      cellSharpness: clampNumber(els.shield3dCellSharpness && els.shield3dCellSharpness.value, 0, 3, 1.1),
      detailEmergence: clampNumber(els.shield3dDetailEmergence && els.shield3dDetailEmergence.value, 0, 1, 1),
    };
  }

  function destroyInspector() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    shield = null;
  }

  function setShieldAlpha(alpha, config) {
    if (!shield) return;
    const value = Math.max(0, Math.min(1, Number(alpha) || 0));
    shield.visible = layerVisible(els.shield3dBubbleMeshVisibleBtn)
      && layerVisible(els.shield3dNoiseVisibleBtn)
      && value > 0.001;
    shield.traverse((child) => {
      const uniforms = child && child.material && child.material.uniforms;
      if (uniforms && uniforms.uAlpha) uniforms.uAlpha.value = config.crackAlpha * value;
    });
  }

  function applyLayerVisibility() {
    if (shield) {
      shield.visible = layerVisible(els.shield3dBubbleMeshVisibleBtn)
        && layerVisible(els.shield3dNoiseVisibleBtn);
    }
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleLayer(button) {
    if (!button) return;
    const visible = layerVisible(button);
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    applyLayerVisibility();
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    const bo = readBo();
    const cfg = readConfig();
    createdAt = performance.now();
    activeConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "bubbleShield3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const nowMs = performance.now();
        const time = (nowMs - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
        if (shield) {
          const elapsedMs = Math.max(0, nowMs - createdAt);
          const phase = ((elapsedMs % Math.max(1, cfg.pulseMs)) / Math.max(1, cfg.pulseMs)) * Math.PI * 2;
          const pulse01 = 0.5 - (Math.cos(phase) * 0.5);
          setShieldAlpha(cfg.pulseMin + ((Math.min(cfg.pulseMax, cfg.alpha) - cfg.pulseMin) * pulse01), cfg);
          updateOrbLifecycle3dCracks(shield, nowMs);
        }
      },
    });
    if (!inspector) return cfg;
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
    shield = createOrbLifecycle3dCracks({
      bo: bo * cfg.diameterRatio,
      hitsTaken: cfg.maxHits,
      maxHits: cfg.maxHits,
      seed: 1,
      config: cfg,
    });
    shield.visible = layerVisible(els.shield3dBubbleMeshVisibleBtn)
      && layerVisible(els.shield3dNoiseVisibleBtn);
    model.add(shield);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.render();
    return cfg;
  }

  function play() {
    apply();
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.previewBubbleShield3d) els.previewBubbleShield3d.addEventListener("click", play);
    if (els.shield3dBubbleMeshVisibleBtn) {
      els.shield3dBubbleMeshVisibleBtn.addEventListener("click", () => toggleLayer(els.shield3dBubbleMeshVisibleBtn));
    }
    if (els.shield3dNoiseVisibleBtn) {
      els.shield3dNoiseVisibleBtn.addEventListener("click", () => toggleLayer(els.shield3dNoiseVisibleBtn));
    }
    document.querySelectorAll('[id^="shield3dApply"]').forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
  }

  return Object.freeze({
    apply,
    clear,
    play,
    wire,
  });
}
