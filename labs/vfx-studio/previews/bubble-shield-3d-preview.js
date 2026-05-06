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
import { createBubbleShield3dSimplexShell } from "../../../src/runtime-effects/bubble-shield-3d-simplex-shell.js?v=20260506b";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : fallback));
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

function jelloEase(progress, overshoot, frequency, decay) {
  const t = clampNumber(progress, 0, 1, 1);
  const eased = 1 - Math.pow(1 - t, 3);
  const settle = t <= 0 ? 0 : Math.sin(t * Math.max(0, frequency)) * Math.exp(-t * Math.max(0, decay));
  return eased + (settle * clampNumber(overshoot, 0, 1.5, 0.12));
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
    const startDiameterRatio = clampNumber(els.shield3dDiameterRatio && els.shield3dDiameterRatio.value, 0.1, 8, 1.24);
    return {
      durationMs: Math.round(clampNumber(els.shield3dMs && els.shield3dMs.value, 80, 120000, 5000)),
      diameterRatio: startDiameterRatio,
      startDiameterRatio,
      endDiameterRatio: clampNumber(els.shield3dEndDiameterRatio && els.shield3dEndDiameterRatio.value, 0.1, 8, 1.8),
      transitionMs: Math.round(clampNumber(els.shield3dTransitionMs && els.shield3dTransitionMs.value, 0, 3000, 420)),
      overshoot: clampNumber(els.shield3dOvershoot && els.shield3dOvershoot.value, 0, 1.5, 0.12),
      jiggleFrequency: clampNumber(els.shield3dJiggleFrequency && els.shield3dJiggleFrequency.value, 0, 48, 18),
      jiggleDecay: clampNumber(els.shield3dJiggleDecay && els.shield3dJiggleDecay.value, 0, 24, 7),
      alpha: clampNumber(els.shield3dAlpha && els.shield3dAlpha.value, 0, 1, 1),
      pulseMs: Math.round(clampNumber(els.shield3dPulseMs && els.shield3dPulseMs.value, 20, 700, 80)),
      pulseMin: clampNumber(els.shield3dPulseMin && els.shield3dPulseMin.value, 0, 1, 0.3),
      pulseMax: clampNumber(els.shield3dPulseMax && els.shield3dPulseMax.value, 0, 1, 1),
      simplexScale: clampNumber(els.shield3dSimplexScale && els.shield3dSimplexScale.value, 0.1, 16, 0.85),
      simplexSpeed: clampNumber(els.shield3dSimplexSpeed && els.shield3dSimplexSpeed.value, 0, 24, 6),
      simplexDensityBottom: clampNumber(els.shield3dSimplexDensityBottom && els.shield3dSimplexDensityBottom.value, 0, 1, 0),
      simplexDensityTop: clampNumber(els.shield3dSimplexDensityTop && els.shield3dSimplexDensityTop.value, 0, 1, 0.3),
      simplexContrast: clampNumber(els.shield3dSimplexContrast && els.shield3dSimplexContrast.value, 0.02, 1, 0.6),
      simplexOctaves: Math.round(clampNumber(els.shield3dSimplexOctaves && els.shield3dSimplexOctaves.value, 1, 8, 3)),
      simplexLacunarity: clampNumber(els.shield3dSimplexLacunarity && els.shield3dSimplexLacunarity.value, 1, 4, 1.1),
      simplexGain: clampNumber(els.shield3dSimplexGain && els.shield3dSimplexGain.value, 0.05, 0.95, 0.3),
      maxHits: 3,
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
      if (uniforms && uniforms.uAlpha) uniforms.uAlpha.value = value;
    });
  }

  function setShieldTime(time) {
    if (!shield) return;
    shield.traverse((child) => {
      const uniforms = child && child.material && child.material.uniforms;
      if (uniforms && uniforms.uTime) uniforms.uTime.value = time;
    });
  }

  function setShieldDiameter(elapsedMs, config) {
    if (!shield) return;
    const start = Math.max(0.1, config.startDiameterRatio);
    const end = Math.max(0.1, config.endDiameterRatio);
    const duration = Math.max(0, config.transitionMs);
    const progress = duration <= 0 ? 1 : elapsedMs / duration;
    const eased = jelloEase(progress, config.overshoot, config.jiggleFrequency, config.jiggleDecay);
    const current = start + ((end - start) * eased);
    shield.scale.setScalar(current / end);
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
          setShieldTime(time);
          setShieldDiameter(nowMs - createdAt, cfg);
          setShieldAlpha(cfg.alpha, cfg);
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
    shield = createBubbleShield3dSimplexShell({
      bo,
      config: {
        ...cfg,
        diameterRatio: cfg.endDiameterRatio,
      },
    });
    model.add(shield);
    setShieldDiameter(0, cfg);
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
