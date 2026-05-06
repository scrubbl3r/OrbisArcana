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
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : fallback));
}

function clampByte(value, fallback = 255) {
  return Math.round(clampNumber(value, 0, 255, fallback));
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
  camera.far = Math.max(2000, distance + (bo * 24));
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 14, distance * 3);
    inspector.controls.update();
  }
}

function createShockwaveShellMaterial(config = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color(config.color || 0xffffff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform vec3 uColor;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), ${Number(config.fresnelPower).toFixed(3)});
        float alpha = ${Number(config.centerAlpha).toFixed(4)} + fresnel * ${Number(config.rimAlpha).toFixed(3)};
        gl_FragColor = vec4(uColor * ${Number(config.luminanceBoost).toFixed(3)}, alpha * uOpacity);
      }
    `,
  });
}

function disposeRing(ring) {
  if (!ring) return;
  if (ring.mesh && ring.mesh.parent) ring.mesh.parent.remove(ring.mesh);
  if (ring.material && typeof ring.material.dispose === "function") ring.material.dispose();
  if (ring.geometry && typeof ring.geometry.dispose === "function") ring.geometry.dispose();
}

export function createShockwave3dPreview({
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
  let lastFrameAt = 0;
  let spawnAcc = 0;
  let spawned = 0;
  let activeRings = [];
  let activeConfig = null;
  let orbConfig = ORB_MATERIAL_CONFIG;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function readConfig() {
    const color = (
      (clampByte(els.shockwave3dR && els.shockwave3dR.value, 255) << 16)
      | (clampByte(els.shockwave3dG && els.shockwave3dG.value, 255) << 8)
      | clampByte(els.shockwave3dB && els.shockwave3dB.value, 255)
    ) >>> 0;
    return Object.freeze({
      sphereCount: Math.round(clampNumber(els.shockwave3dSphereCount && els.shockwave3dSphereCount.value, 1, 8, 2)),
      spawnMs: Math.round(clampNumber(els.shockwave3dSpawnMs && els.shockwave3dSpawnMs.value, 1, 1000, 105)),
      expandMs: Math.round(clampNumber(els.shockwave3dExpandMs && els.shockwave3dExpandMs.value, 40, 4000, 150)),
      decayMs: Math.round(clampNumber(els.shockwave3dDecayMs && els.shockwave3dDecayMs.value, 40, 4000, 150)),
      startRatio: Number(clampNumber(els.shockwave3dStartRatio && els.shockwave3dStartRatio.value, 0.01, 10, 0.43).toFixed(2)),
      endRatio: Number(clampNumber(els.shockwave3dEndRatio && els.shockwave3dEndRatio.value, 0.01, 20, 1.69).toFixed(2)),
      icoDetail: Math.round(clampNumber(els.shockwave3dIcoDetail && els.shockwave3dIcoDetail.value, 0, 5, 3)),
      fresnelPower: clampNumber(els.shockwave3dFresnelPower && els.shockwave3dFresnelPower.value, 0.1, 10, 2.6),
      centerAlpha: clampNumber(els.shockwave3dCenterAlpha && els.shockwave3dCenterAlpha.value, 0, 1, 0.01),
      rimAlpha: clampNumber(els.shockwave3dRimAlpha && els.shockwave3dRimAlpha.value, 0, 1, 0.62),
      luminanceBoost: clampNumber(els.shockwave3dLuminanceBoost && els.shockwave3dLuminanceBoost.value, 0, 4, 1.45),
      color,
      colorA: clampNumber(els.shockwave3dA && els.shockwave3dA.value, 0, 1, 0.65),
    });
  }

  function syncFields(config) {
    if (!config) return;
    if (els.shockwave3dSphereCount) els.shockwave3dSphereCount.value = String(config.sphereCount);
    if (els.shockwave3dSpawnMs) els.shockwave3dSpawnMs.value = String(config.spawnMs);
    if (els.shockwave3dExpandMs) els.shockwave3dExpandMs.value = String(config.expandMs);
    if (els.shockwave3dDecayMs) els.shockwave3dDecayMs.value = String(config.decayMs);
    if (els.shockwave3dStartRatio) els.shockwave3dStartRatio.value = config.startRatio.toFixed(2);
    if (els.shockwave3dEndRatio) els.shockwave3dEndRatio.value = config.endRatio.toFixed(2);
    if (els.shockwave3dIcoDetail) els.shockwave3dIcoDetail.value = String(config.icoDetail);
    if (els.shockwave3dFresnelPower) els.shockwave3dFresnelPower.value = config.fresnelPower.toFixed(2);
    if (els.shockwave3dCenterAlpha) els.shockwave3dCenterAlpha.value = config.centerAlpha.toFixed(3);
    if (els.shockwave3dRimAlpha) els.shockwave3dRimAlpha.value = config.rimAlpha.toFixed(2);
    if (els.shockwave3dLuminanceBoost) els.shockwave3dLuminanceBoost.value = config.luminanceBoost.toFixed(2);
    if (els.shockwave3dR) els.shockwave3dR.value = String((config.color >> 16) & 255);
    if (els.shockwave3dG) els.shockwave3dG.value = String((config.color >> 8) & 255);
    if (els.shockwave3dB) els.shockwave3dB.value = String(config.color & 255);
    if (els.shockwave3dA) els.shockwave3dA.value = config.colorA.toFixed(2);
  }

  function destroyInspector() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    activeRings.forEach(disposeRing);
    activeRings = [];
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    spawnAcc = 0;
    spawned = 0;
  }

  function ensureScene() {
    if (inspector || !els.previewRoot) return;
    const bo = readBo();
    createdAt = performance.now();
    lastFrameAt = createdAt;
    orbConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "shockwave3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, orbConfig);
      },
    });
    if (!inspector) return;
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
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.render();
  }

  function spawnRing(now) {
    if (!inspector || !activeConfig) return;
    const bo = readBo();
    const geometry = new THREE.IcosahedronGeometry(bo * 0.5, activeConfig.icoDetail);
    const material = createShockwaveShellMaterial(activeConfig);
    material.uniforms.uOpacity.value = 0;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "shockwave3d:icosphere";
    mesh.scale.setScalar(activeConfig.startRatio);
    inspector.scene.add(mesh);
    activeRings.push({ born: now, geometry, material, mesh });
  }

  function tick(now = performance.now()) {
    if (!inspector || !activeConfig) {
      raf = 0;
      return;
    }
    const dt = Math.max(0, now - lastFrameAt);
    lastFrameAt = now;
    spawnAcc += dt;
    while (spawned < activeConfig.sphereCount && spawnAcc >= activeConfig.spawnMs) {
      spawnAcc -= activeConfig.spawnMs;
      spawnRing(now);
      spawned += 1;
    }
    for (let i = activeRings.length - 1; i >= 0; i -= 1) {
      const ring = activeRings[i];
      const age = Math.max(0, now - ring.born);
      const expandT01 = Math.max(0, Math.min(1, age / activeConfig.expandMs));
      const fadeT01 = Math.max(0, Math.min(1, age / activeConfig.decayMs));
      const scale = activeConfig.startRatio + ((activeConfig.endRatio - activeConfig.startRatio) * expandT01);
      ring.mesh.scale.setScalar(scale);
      ring.material.uniforms.uOpacity.value = (fadeT01 <= 0 ? 0 : (1 - fadeT01)) * activeConfig.colorA;
      if (fadeT01 >= 1) {
        disposeRing(ring);
        activeRings.splice(i, 1);
      }
    }
    inspector.render();
    if (spawned >= activeConfig.sphereCount && activeRings.length === 0) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function apply() {
    activeConfig = readConfig();
    syncFields(activeConfig);
    destroyInspector();
    ensureScene();
    return activeConfig;
  }

  function play() {
    activeConfig = readConfig();
    syncFields(activeConfig);
    destroyInspector();
    ensureScene();
    spawnAcc = activeConfig.spawnMs;
    spawned = 0;
    lastFrameAt = performance.now();
    raf = requestAnimationFrame(tick);
    return activeConfig;
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.previewShockwave3d) els.previewShockwave3d.addEventListener("click", play);
    document.querySelectorAll('[id^="shockwave3dApply"]').forEach((btn) => {
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
