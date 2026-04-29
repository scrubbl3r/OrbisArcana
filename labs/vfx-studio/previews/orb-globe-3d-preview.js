import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS as ORB_MATERIAL_CONFIG } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import {
  buildOrbGlobeVisualState,
  getInnerPaddingPx,
  getOrbitDistancePx,
} from "../../../src/game-runtime/orb/orb-globe-base-state.js?v=20260425d";
import { createGlobeModel } from "../../../src/game-runtime/world/globe-3d-model.js?v=20260429a";
import { createGlobeMaterial, createGlobePointLight } from "../../../src/game-runtime/world/globe-3d-material.js?v=20260429a";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-globe-3d-default.js?v=20260429a";

const UP = new THREE.Vector3(0, 1, 0);
const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const TMP_C = new THREE.Vector3();

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function roundedByte(value, fallback = 255) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 255;
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : f)));
}

function randomBetween(min, max) {
  return Number(min) + (Math.random() * (Number(max) - Number(min)));
}

function colorFromFields(els, prefix, fallback) {
  const field = (id) => els[id] || document.getElementById(id);
  const r = roundedByte(field(`${prefix}R`) && field(`${prefix}R`).value, (fallback >> 16) & 255);
  const g = roundedByte(field(`${prefix}G`) && field(`${prefix}G`).value, (fallback >> 8) & 255);
  const b = roundedByte(field(`${prefix}B`) && field(`${prefix}B`).value, fallback & 255);
  return ((r << 16) | (g << 8) | b) >>> 0;
}

function readRange(els, minId, maxId, min, max) {
  const field = (id) => els[id] || document.getElementById(id);
  const rawMin = Number(field(minId) && field(minId).value);
  const rawMax = Number(field(maxId) && field(maxId).value);
  const a = Number.isFinite(rawMin) ? rawMin : min;
  const b = Number.isFinite(rawMax) ? rawMax : max;
  return Object.freeze({
    min: Math.min(a, b),
    max: Math.max(a, b),
  });
}

export function readOrbGlobe3dPreviewConfig(els = {}) {
  const field = (id) => els[id] || document.getElementById(id);
  const defaults = ORB_GLOBE_3D_VISUAL_DEFAULTS;
  const materialDefaults = defaults.material || {};
  return Object.freeze({
    visual: buildOrbGlobeVisualState({
      orbitDistanceRatio: clampNumber(field("orbGlobe3dOrbitDistanceRatio") && field("orbGlobe3dOrbitDistanceRatio").value, 0.1, 3, defaults.orbitDistanceRatio),
      orbitDistanceMinPx: clampNumber(field("orbGlobe3dOrbitDistanceMin") && field("orbGlobe3dOrbitDistanceMin").value, 0, 200, defaults.orbitDistanceMinPx),
      orbitSpeedMin: clampNumber(field("orbGlobe3dSpeedMin") && field("orbGlobe3dSpeedMin").value, 0, 12, defaults.orbitSpeedMin),
      orbitSpeedMax: clampNumber(field("orbGlobe3dSpeedMax") && field("orbGlobe3dSpeedMax").value, 0, 12, defaults.orbitSpeedMax),
      orbitDriftMin: clampNumber(field("orbGlobe3dDriftMin") && field("orbGlobe3dDriftMin").value, 0, 2, defaults.orbitDriftMin),
      orbitDriftMax: clampNumber(field("orbGlobe3dDriftMax") && field("orbGlobe3dDriftMax").value, 0, 2, defaults.orbitDriftMax),
      innerSpeedMinPxPerSec: clampNumber(field("orbGlobe3dInnerSpeedMin") && field("orbGlobe3dInnerSpeedMin").value, 0, 600, defaults.innerSpeedMinPxPerSec),
      innerSpeedMaxPxPerSec: clampNumber(field("orbGlobe3dInnerSpeedMax") && field("orbGlobe3dInnerSpeedMax").value, 0, 600, defaults.innerSpeedMaxPxPerSec),
      innerDriftMin: clampNumber(field("orbGlobe3dInnerDriftMin") && field("orbGlobe3dInnerDriftMin").value, 0, 1.5, defaults.innerDriftMin),
      innerDriftMax: clampNumber(field("orbGlobe3dInnerDriftMax") && field("orbGlobe3dInnerDriftMax").value, 0, 1.5, defaults.innerDriftMax),
      innerPaddingRatio: clampNumber(field("orbGlobe3dInnerPaddingRatio") && field("orbGlobe3dInnerPaddingRatio").value, 0, 0.5, defaults.innerPaddingRatio),
    }),
    loadedDiameterRatio: clampNumber(field("orbGlobe3dLoadedDiameterRatio") && field("orbGlobe3dLoadedDiameterRatio").value, 0, 10, defaults.loadedDiameterRatio),
    consumedDiameterRatio: clampNumber(field("orbGlobe3dConsumedDiameterRatio") && field("orbGlobe3dConsumedDiameterRatio").value, 0, 10, defaults.consumedDiameterRatio),
    material: Object.freeze({
      shellBaseColor: colorFromFields(els, "orbGlobe3dShellBase", materialDefaults.shellBaseColor),
      shellCyanColor: colorFromFields(els, "orbGlobe3dShellCyan", materialDefaults.shellCyanColor),
      shellVioletColor: colorFromFields(els, "orbGlobe3dShellViolet", materialDefaults.shellVioletColor),
      shellGoldColor: colorFromFields(els, "orbGlobe3dShellGold", materialDefaults.shellGoldColor),
      shellFresnelPower: clampNumber(field("orbGlobe3dShellFresnelPower") && field("orbGlobe3dShellFresnelPower").value, 0.1, 10, materialDefaults.shellFresnelPower),
      shellRimAlphaPower: clampNumber(field("orbGlobe3dShellRimAlphaPower") && field("orbGlobe3dShellRimAlphaPower").value, 0.1, 8, materialDefaults.shellRimAlphaPower),
      shellCenterAlpha: clampNumber(field("orbGlobe3dShellCenterAlpha") && field("orbGlobe3dShellCenterAlpha").value, 0, 1, materialDefaults.shellCenterAlpha),
      shellRimAlpha: clampNumber(field("orbGlobe3dShellRimAlpha") && field("orbGlobe3dShellRimAlpha").value, 0, 1, materialDefaults.shellRimAlpha),
      shellPastelMix: clampNumber(field("orbGlobe3dShellPastelMix") && field("orbGlobe3dShellPastelMix").value, 0, 2, materialDefaults.shellPastelMix),
      shellRimPastelMix: clampNumber(field("orbGlobe3dShellRimPastelMix") && field("orbGlobe3dShellRimPastelMix").value, 0, 2, materialDefaults.shellRimPastelMix),
      shellLuminanceBoost: clampNumber(field("orbGlobe3dShellLuminanceBoost") && field("orbGlobe3dShellLuminanceBoost").value, 0, 4, materialDefaults.shellLuminanceBoost),
      lightColor: colorFromFields(els, "orbGlobe3dLight", materialDefaults.lightColor),
      lightIntensity: clampNumber(field("orbGlobe3dLightIntensity") && field("orbGlobe3dLightIntensity").value, 0, 1000, materialDefaults.lightIntensity),
      lightDistanceBO: clampNumber(field("orbGlobe3dLightDistanceBO") && field("orbGlobe3dLightDistanceBO").value, 0, 40, materialDefaults.lightDistanceBO),
      lightDecay: clampNumber(field("orbGlobe3dLightDecay") && field("orbGlobe3dLightDecay").value, 0, 4, materialDefaults.lightDecay),
      lightOffsetZBO: clampNumber(field("orbGlobe3dLightOffsetZBO") && field("orbGlobe3dLightOffsetZBO").value, -4, 4, materialDefaults.lightOffsetZBO),
    }),
  });
}

function readOrbDiameterPx(root) {
  if (!root) return 72;
  const raw = getComputedStyle(root).getPropertyValue("--orb-d");
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 72;
}

function createPlane() {
  const normal = new THREE.Vector3(
    randomBetween(-1, 1),
    randomBetween(-0.65, 0.65),
    randomBetween(-1, 1)
  ).normalize();
  if (!Number.isFinite(normal.x)) normal.set(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(normal, UP);
  if (u.lengthSq() < 0.001) u.crossVectors(normal, new THREE.Vector3(1, 0, 0));
  u.normalize();
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();
  return { normal, u, v };
}

function makeGlobeMesh(diameter, materialConfig) {
  const { model } = createGlobeModel({
    bo: Math.max(2, diameter),
    material: createGlobeMaterial(materialConfig),
    shellSegments: 32,
  });
  model.add(createGlobePointLight({ bo: Math.max(2, diameter), config: materialConfig }));
  return model;
}

function initializeInnerMotion(globe, config) {
  const speeds = readRange(config.els, "orbGlobe3dInnerSpeedMin", "orbGlobe3dInnerSpeedMax", 80, 150);
  const drifts = readRange(config.els, "orbGlobe3dInnerDriftMin", "orbGlobe3dInnerDriftMax", 0.08, 0.28);
  const velocity = new THREE.Vector3(randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1)).normalize();
  velocity.multiplyScalar(randomBetween(speeds.min, speeds.max));
  globe.innerPos = new THREE.Vector3(0, 0, 0);
  globe.innerVelocity = velocity;
  globe.innerDriftMin = drifts.min;
  globe.innerDriftMax = drifts.max;
}

function updateInnerGlobe(globe, dt, orbRadius, globeRadius, paddingPx) {
  if (!globe.innerPos || !globe.innerVelocity) return;
  globe.innerPos.addScaledVector(globe.innerVelocity, dt);
  const wallRadius = Math.max(0, orbRadius - globeRadius - paddingPx);
  const distance = globe.innerPos.length();
  if (distance > wallRadius && wallRadius > 0) {
    const normal = globe.innerPos.clone().normalize();
    globe.innerPos.copy(normal).multiplyScalar(wallRadius);
    const normalSpeed = globe.innerVelocity.dot(normal);
    globe.innerVelocity.addScaledVector(normal, -2 * normalSpeed);
    const drift = randomBetween(globe.innerDriftMin || 0, globe.innerDriftMax || 0);
    const axis = TMP_A.set(randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1)).normalize();
    globe.innerVelocity.applyAxisAngle(axis, drift * (Math.random() < 0.5 ? -1 : 1));
  }
}

export function createOrbGlobe3dPreview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let samples = [];
  let nextId = 1;
  let config = null;
  let lastFrameMs = 0;
  let createdAtMs = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || readOrbDiameterPx(els.previewRoot));
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    lastFrameMs = 0;
  }

  function rebuildScene() {
    if (!els.previewRoot) return null;
    destroyInspector();
    config = readOrbGlobe3dPreviewConfig(els);
    config = Object.freeze({ ...config, els });
    const bo = readBo();
    const orbRadius = bo * 0.5;
    createdAtMs = performance.now();

    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "orbGlobe3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.62, y: 0.24, z: 4.2 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 22,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const now = performance.now();
        const time = (now - createdAtMs) / 1000;
        const dt = lastFrameMs ? Math.min(0.05, Math.max(0, (now - lastFrameMs) / 1000)) : 0;
        lastFrameMs = now;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, ORB_MATERIAL_CONFIG);
        updateSamples(time, dt, bo);
      },
    });
    if (!inspector) return null;

    shellMaterial = createOpalescentOrbShellMaterial(ORB_MATERIAL_CONFIG);
    const orbModel = createOrbModel({
      bo,
      shellMaterial,
      includeCore: false,
      includeRibs: false,
    }).model;
    orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
    orbModel.add(orbLight);
    inspector.scene.add(orbModel);

    samples.forEach((globe) => {
      const isBound = globe.state === "bound";
      const diameter = bo * (isBound ? config.consumedDiameterRatio : config.loadedDiameterRatio);
      globe.radius = diameter * 0.5;
      globe.model = makeGlobeMesh(diameter, config.material);
      if (isBound && (!globe.innerPos || !globe.innerVelocity)) initializeInnerMotion(globe, config);
      inspector.scene.add(globe.model);
    });
    updateSamples(0, 0, bo);
    inspector.render();
    return { bo, radius: orbRadius, globes: samples.length };
  }

  function updateSamples(time, dt, bo) {
    if (!config) return;
    const orbRadius = bo * 0.5;
    const orbitRadius = getOrbitDistancePx(orbRadius, config.visual);
    const innerPadding = getInnerPaddingPx(orbRadius, config.visual);
    samples.forEach((globe) => {
      if (!globe.model) return;
      if (globe.state === "bound") {
        updateInnerGlobe(globe, dt, orbRadius, globe.radius || 2, innerPadding);
        globe.model.position.copy(globe.innerPos || TMP_A.set(0, 0, 0));
        globe.model.rotation.x += dt * 0.9;
        globe.model.rotation.y += dt * 1.1;
        return;
      }
      const plane = globe.plane || (globe.plane = createPlane());
      const angle = (globe.phase || 0) + (time * (globe.speed || 1) * (globe.direction || 1));
      const driftAngle = time * (globe.drift || 0) * (globe.driftDirection || 1);
      TMP_A.copy(plane.u).applyAxisAngle(plane.normal, driftAngle);
      TMP_B.copy(plane.v).applyAxisAngle(plane.normal, driftAngle);
      TMP_C.copy(TMP_A).multiplyScalar(Math.cos(angle) * orbitRadius);
      TMP_C.addScaledVector(TMP_B, Math.sin(angle) * orbitRadius);
      globe.model.position.copy(TMP_C);
      globe.model.rotation.y += dt * 0.8;
    });
  }

  function addGlobe(overrides = {}) {
    const speeds = readRange(els, "orbGlobe3dSpeedMin", "orbGlobe3dSpeedMax", 1.8, 2.45);
    const drifts = readRange(els, "orbGlobe3dDriftMin", "orbGlobe3dDriftMax", 0.03, 0.18);
    samples.push({
      id: nextId++,
      state: "loaded",
      phase: Number.isFinite(Number(overrides.phase)) ? Number(overrides.phase) : Math.random() * Math.PI * 2,
      speed: Number.isFinite(Number(overrides.speed)) ? Number(overrides.speed) : randomBetween(speeds.min, speeds.max),
      direction: Number.isFinite(Number(overrides.direction)) ? Number(overrides.direction) : (Math.random() < 0.5 ? -1 : 1),
      drift: Number.isFinite(Number(overrides.drift)) ? Number(overrides.drift) : randomBetween(drifts.min, drifts.max),
      driftDirection: Number.isFinite(Number(overrides.driftDirection)) ? Number(overrides.driftDirection) : (Math.random() < 0.5 ? -1 : 1),
      plane: overrides.plane || createPlane(),
      model: null,
    });
    rebuildScene();
  }

  function bindGlobe() {
    let globe = samples.find((entry) => entry.state === "loaded");
    if (!globe) {
      addGlobe();
      globe = samples.find((entry) => entry.state === "loaded");
    }
    if (globe) {
      globe.state = "bound";
      globe.model = null;
      initializeInnerMotion(globe, config || Object.freeze({ els }));
    }
    rebuildScene();
  }

  function clear() {
    samples = [];
    destroyInspector();
    if (els.previewRoot) rebuildScene();
  }

  function seed() {
    if (samples.length) return;
    const frontPlane = {
      normal: new THREE.Vector3(0, 0, 1),
      u: new THREE.Vector3(1, 0, 0),
      v: new THREE.Vector3(0, 1, 0),
    };
    addGlobe({ phase: 0, speed: 1.35, drift: 0.04, plane: frontPlane });
    addGlobe({ phase: Math.PI * 0.72, speed: 1.9, direction: -1, drift: 0.08, plane: frontPlane });
    addGlobe({ phase: Math.PI * 1.38, speed: 2.25, drift: 0.12, plane: createPlane() });
    bindGlobe();
  }

  function wire() {
    if (els.previewOrbGlobe3d) els.previewOrbGlobe3d.addEventListener("click", rebuildScene);
    if (els.orbGlobe3dAddBtn) els.orbGlobe3dAddBtn.addEventListener("click", addGlobe);
    if (els.orbGlobe3dBindBtn) els.orbGlobe3dBindBtn.addEventListener("click", bindGlobe);
    if (els.orbGlobe3dClearBtn) els.orbGlobe3dClearBtn.addEventListener("click", clear);
    document.querySelectorAll('[id^="orbGlobe3dApply"]').forEach((btn) => {
      btn.addEventListener("click", rebuildScene);
    });
    seed();
  }

  return Object.freeze({
    apply: rebuildScene,
    clear,
    play: rebuildScene,
    wire,
  });
}
