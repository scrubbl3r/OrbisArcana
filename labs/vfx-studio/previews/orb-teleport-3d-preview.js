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

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function buildFlickerMask(elapsedMs, onMs, offMs) {
  const cycleMs = Math.max(1, Number(onMs) + Number(offMs));
  const phaseMs = ((Number(elapsedMs) % cycleMs) + cycleMs) % cycleMs;
  return phaseMs < Number(onMs) ? 1 : 0;
}

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(bo * 0.72, bo * 0.2, distance);
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

export function createOrbTeleport3dPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let raf = 0;
  let createdAt = 0;
  let activeConfig = ORB_MATERIAL_CONFIG;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function readConfig() {
    return {
      flickerOnMs: Math.round(clampNumber(els.orbTeleport3dFlickerOnMs && els.orbTeleport3dFlickerOnMs.value, 10, 1000, 60)),
      flickerOffMs: Math.round(clampNumber(els.orbTeleport3dFlickerOffMs && els.orbTeleport3dFlickerOffMs.value, 10, 1000, 60)),
      fadeOutMs: Math.round(clampNumber(els.orbTeleport3dFadeOutMs && els.orbTeleport3dFadeOutMs.value, 40, 4000, 280)),
      cameraTravelMs: Math.round(clampNumber(els.orbTeleport3dCameraTravelMs && els.orbTeleport3dCameraTravelMs.value, 0, 8000, 1500)),
      fadeInMs: Math.round(clampNumber(els.orbTeleport3dFadeInMs && els.orbTeleport3dFadeInMs.value, 40, 4000, 280)),
    };
  }

  function hydrateFields(cfg) {
    if (els.orbTeleport3dFlickerOnMs) els.orbTeleport3dFlickerOnMs.value = String(cfg.flickerOnMs);
    if (els.orbTeleport3dFlickerOffMs) els.orbTeleport3dFlickerOffMs.value = String(cfg.flickerOffMs);
    if (els.orbTeleport3dFadeOutMs) els.orbTeleport3dFadeOutMs.value = String(cfg.fadeOutMs);
    if (els.orbTeleport3dCameraTravelMs) els.orbTeleport3dCameraTravelMs.value = String(cfg.cameraTravelMs);
    if (els.orbTeleport3dFadeInMs) els.orbTeleport3dFadeInMs.value = String(cfg.fadeInMs);
  }

  function destroyInspector() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
  }

  function ensureScene() {
    if (inspector || !els.previewRoot) return;
    const bo = readBo();
    createdAt = performance.now();
    activeConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "orbTeleport3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.72, y: 0.2, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
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
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.render();
  }

  function resetModel() {
    if (!model) return;
    const bo = readBo();
    model.visible = true;
    model.position.set(-bo * 0.9, 0, 0);
    model.scale.setScalar(1);
    model.traverse((child) => {
      if (child && child.material) child.material.opacity = 1;
    });
  }

  function setOpacity(alpha) {
    if (!model) return;
    const value = Math.max(0, Math.min(1, Number(alpha) || 0));
    model.visible = value > 0.001;
    if (inspector && inspector.renderer && inspector.renderer.domElement) {
      inspector.renderer.domElement.style.opacity = String(value);
    }
  }

  function apply() {
    const cfg = readConfig();
    hydrateFields(cfg);
    destroyInspector();
    ensureScene();
    resetModel();
    return cfg;
  }

  function renderFrame(cfg, elapsedMs) {
    if (!model) return false;
    const bo = readBo();
    const fadeOutEnd = cfg.fadeOutMs;
    const travelEnd = fadeOutEnd + cfg.cameraTravelMs;
    const totalEnd = travelEnd + cfg.fadeInMs;

    if (elapsedMs <= fadeOutEnd) {
      const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, cfg.fadeOutMs)));
      const flicker = buildFlickerMask(elapsedMs, cfg.flickerOnMs, cfg.flickerOffMs);
      model.position.set(-bo * 0.9, 0, 0);
      setOpacity((1 - progress) * flicker);
      return true;
    }

    if (elapsedMs < travelEnd) {
      model.position.set(bo * 0.9, 0, 0);
      setOpacity(0);
      return true;
    }

    const fadeInElapsedMs = elapsedMs - travelEnd;
    const progress = Math.max(0, Math.min(1, fadeInElapsedMs / Math.max(1, cfg.fadeInMs)));
    const flicker = buildFlickerMask(fadeInElapsedMs, cfg.flickerOnMs, cfg.flickerOffMs);
    model.position.set(bo * 0.9, 0, 0);
    setOpacity(progress * flicker);

    if (elapsedMs >= totalEnd) {
      setOpacity(1);
      return false;
    }
    return true;
  }

  function play() {
    const cfg = apply();
    if (!cfg) return;
    const start = performance.now();
    function tick(now) {
      const keepGoing = renderFrame(cfg, now - start);
      if (!keepGoing) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.previewOrbTeleport3d) els.previewOrbTeleport3d.addEventListener("click", play);
    [
      els.orbTeleport3dApplyFlickerOnBtn,
      els.orbTeleport3dApplyFlickerOffBtn,
      els.orbTeleport3dApplyFadeOutBtn,
      els.orbTeleport3dApplyCameraTravelBtn,
      els.orbTeleport3dApplyFadeInBtn,
    ].forEach((btn) => {
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
