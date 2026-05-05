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
import { createGlobeModel } from "../../../src/game-runtime/world/globe-3d-model.js?v=20260429a";
import { createGlobeMaterial } from "../../../src/game-runtime/world/globe-3d-material.js?v=20260502b";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-globe-3d-default.js?v=20260504b";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/world/world-globe-3d-default.js?v=20260502c";

const UP = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;
const ORBIT_DRIFT_RATE_SCALE = 0.025;
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

function readNumber(source, keys = [], fallback = 0) {
  const object = source && typeof source === "object" ? source : {};
  for (const key of keys) {
    const value = Number(object[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function readOrbGlobe3dPreviewConfig(els = {}) {
  const field = (id) => els[id] || document.getElementById(id);
  const defaults = ORB_GLOBE_3D_VISUAL_DEFAULTS;
  const worldDefaults = WORLD_GLOBE_3D_VISUAL_DEFAULTS;
  const materialDefaults = worldDefaults.material || {};
  return Object.freeze({
    orbitDistanceBO: clampNumber(field("orbGlobe3dOrbitDistanceRatio") && field("orbGlobe3dOrbitDistanceRatio").value, 0.1, 10, readNumber(defaults, ["orbitDistanceBO", "orbitDistanceRatio"], 1.07)),
    orbitDistanceMinBO: clampNumber(field("orbGlobe3dOrbitDistanceMin") && field("orbGlobe3dOrbitDistanceMin").value, 0, 10, readNumber(defaults, ["orbitDistanceMinBO"], 0.02)),
    orbitSpeedMinHz: clampNumber(field("orbGlobe3dSpeedMin") && field("orbGlobe3dSpeedMin").value, 0, 12, readNumber(defaults, ["orbitSpeedMinHz"], 0.25)),
    orbitSpeedMaxHz: clampNumber(field("orbGlobe3dSpeedMax") && field("orbGlobe3dSpeedMax").value, 0, 12, readNumber(defaults, ["orbitSpeedMaxHz"], 0.30)),
    orbitDriftMinHz: clampNumber(field("orbGlobe3dDriftMin") && field("orbGlobe3dDriftMin").value, 0, 12, readNumber(defaults, ["orbitDriftMinHz", "orbitDriftMin"], 0.5)),
    orbitDriftMaxHz: clampNumber(field("orbGlobe3dDriftMax") && field("orbGlobe3dDriftMax").value, 0, 12, readNumber(defaults, ["orbitDriftMaxHz", "orbitDriftMax"], 1)),
    innerSpeedMinBOPerSec: clampNumber(field("orbGlobe3dInnerSpeedMin") && field("orbGlobe3dInnerSpeedMin").value, 0, 40, readNumber(defaults, ["innerSpeedMinBOPerSec"], 3.67)),
    innerSpeedMaxBOPerSec: clampNumber(field("orbGlobe3dInnerSpeedMax") && field("orbGlobe3dInnerSpeedMax").value, 0, 40, readNumber(defaults, ["innerSpeedMaxBOPerSec"], 4.53)),
    innerDriftMin: clampNumber(field("orbGlobe3dInnerDriftMin") && field("orbGlobe3dInnerDriftMin").value, 0, 1.5, defaults.innerDriftMin),
    innerDriftMax: clampNumber(field("orbGlobe3dInnerDriftMax") && field("orbGlobe3dInnerDriftMax").value, 0, 1.5, defaults.innerDriftMax),
    innerPaddingBO: clampNumber(field("orbGlobe3dInnerPaddingRatio") && field("orbGlobe3dInnerPaddingRatio").value, 0, 10, readNumber(defaults, ["innerPaddingBO"], 0.11)),
    worldCollectedDiameterBO: clampNumber(field("worldGlobe3dCollectedDiameterRatio") && field("worldGlobe3dCollectedDiameterRatio").value, 0.01, 10, readNumber(worldDefaults.collected, ["diameterBO", "diameterRatio"], 0.17)),
    worldConsumedDiameterBO: clampNumber(field("worldGlobe3dConsumedDiameterRatio") && field("worldGlobe3dConsumedDiameterRatio").value, 0.01, 10, readNumber(worldDefaults.consumed, ["diameterBO", "diameterRatio"], 0.10)),
    material: Object.freeze({
      shellBaseColor: colorFromFields(els, "worldGlobe3dShellBase", materialDefaults.shellBaseColor),
      shellCyanColor: colorFromFields(els, "worldGlobe3dShellCyan", materialDefaults.shellCyanColor),
      shellVioletColor: colorFromFields(els, "worldGlobe3dShellViolet", materialDefaults.shellVioletColor),
      shellGoldColor: colorFromFields(els, "worldGlobe3dShellGold", materialDefaults.shellGoldColor),
      shellFresnelPower: clampNumber(field("worldGlobe3dShellFresnelPower") && field("worldGlobe3dShellFresnelPower").value, 0.1, 10, materialDefaults.shellFresnelPower),
      shellRimAlphaPower: clampNumber(field("worldGlobe3dShellRimAlphaPower") && field("worldGlobe3dShellRimAlphaPower").value, 0.1, 8, materialDefaults.shellRimAlphaPower),
      shellCenterAlpha: clampNumber(field("worldGlobe3dShellCenterAlpha") && field("worldGlobe3dShellCenterAlpha").value, 0, 1, materialDefaults.shellCenterAlpha),
      shellRimAlpha: clampNumber(field("worldGlobe3dShellRimAlpha") && field("worldGlobe3dShellRimAlpha").value, 0, 1, materialDefaults.shellRimAlpha),
      shellPastelMix: clampNumber(field("worldGlobe3dShellPastelMix") && field("worldGlobe3dShellPastelMix").value, 0, 2, materialDefaults.shellPastelMix),
      shellRimPastelMix: clampNumber(field("worldGlobe3dShellRimPastelMix") && field("worldGlobe3dShellRimPastelMix").value, 0, 2, materialDefaults.shellRimPastelMix),
      shellLuminanceBoost: clampNumber(field("worldGlobe3dShellLuminanceBoost") && field("worldGlobe3dShellLuminanceBoost").value, 0, 4, materialDefaults.shellLuminanceBoost),
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
  return model;
}

function initializeInnerMotion(globe, config) {
  const speeds = readRange(config.els, "orbGlobe3dInnerSpeedMin", "orbGlobe3dInnerSpeedMax", 3.67, 4.53);
  const drifts = readRange(config.els, "orbGlobe3dInnerDriftMin", "orbGlobe3dInnerDriftMax", 0.08, 0.28);
  const bo = Math.max(1, Number(config.bo) || 72);
  const velocity = new THREE.Vector3(randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1)).normalize();
  velocity.multiplyScalar(randomBetween(speeds.min, speeds.max) * bo);
  globe.innerPos = new THREE.Vector3(0, 0, 0);
  globe.innerVelocity = velocity;
  globe.innerDriftMin = drifts.min;
  globe.innerDriftMax = drifts.max;
}

function retuneInnerMotion(globe, config) {
  if (!globe || !globe.innerVelocity) return;
  const speeds = readRange(config.els, "orbGlobe3dInnerSpeedMin", "orbGlobe3dInnerSpeedMax", 3.67, 4.53);
  const drifts = readRange(config.els, "orbGlobe3dInnerDriftMin", "orbGlobe3dInnerDriftMax", 0.08, 0.28);
  const bo = Math.max(1, Number(config.bo) || 72);
  if (globe.innerVelocity.lengthSq() < 0.0001) globe.innerVelocity.set(1, 0, 0);
  globe.innerVelocity.normalize().multiplyScalar(randomBetween(speeds.min, speeds.max) * bo);
  globe.innerDriftMin = drifts.min;
  globe.innerDriftMax = drifts.max;
}

function applyBounceDrift(velocity, normal, driftMin = 0, driftMax = 0) {
  const speed = velocity.length();
  if (speed <= 0) return;
  const drift = randomBetween(driftMin || 0, driftMax || 0);
  if (drift <= 0) {
    velocity.setLength(speed);
    return;
  }
  const tangent = TMP_B.set(randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1));
  tangent.addScaledVector(normal, -tangent.dot(normal));
  if (tangent.lengthSq() < 0.0001) tangent.crossVectors(normal, UP);
  if (tangent.lengthSq() < 0.0001) tangent.set(1, 0, 0);
  tangent.normalize();
  const signedDrift = drift * (Math.random() < 0.5 ? -1 : 1);
  velocity.addScaledVector(tangent, Math.tan(signedDrift) * speed);
  if (velocity.dot(normal) >= 0) velocity.addScaledVector(normal, -(velocity.dot(normal) + 0.001));
  velocity.normalize().multiplyScalar(speed);
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
    applyBounceDrift(globe.innerVelocity, normal, globe.innerDriftMin, globe.innerDriftMax);
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
  let retuneInnerOnNextRebuild = false;

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
      const diameter = bo * (isBound ? config.worldCollectedDiameterBO : config.worldConsumedDiameterBO);
      globe.radius = diameter * 0.5;
      globe.model = makeGlobeMesh(diameter, config.material);
      if (!isBound && (!globe.innerPos || !globe.innerVelocity)) initializeInnerMotion(globe, config);
      else if (!isBound && retuneInnerOnNextRebuild) retuneInnerMotion(globe, config);
      inspector.scene.add(globe.model);
    });
    retuneInnerOnNextRebuild = false;
    updateSamples(0, 0, bo);
    inspector.render();
    return { bo, radius: orbRadius, globes: samples.length };
  }

  function updateSamples(time, dt, bo) {
    if (!config) return;
    const orbRadius = bo * 0.5;
    const orbitRadius = Math.max(config.orbitDistanceBO * bo, config.orbitDistanceMinBO * bo);
    const innerPadding = config.innerPaddingBO * bo;
    samples.forEach((globe) => {
      if (!globe.model) return;
      if (globe.state !== "bound") {
        updateInnerGlobe(globe, dt, orbRadius, globe.radius || 2, innerPadding);
        globe.model.position.copy(globe.innerPos || TMP_A.set(0, 0, 0));
        globe.model.rotation.x += dt * 0.9;
        globe.model.rotation.y += dt * 1.1;
        return;
      }
      const plane = globe.plane || (globe.plane = createPlane());
      if (!Number.isFinite(globe.orbitAngle)) globe.orbitAngle = Number(globe.phase) || 0;
      if (!Number.isFinite(globe.orbitDriftAngle)) globe.orbitDriftAngle = 0;
      globe.orbitAngle += dt * (Number(globe.speed) || 0) * TWO_PI * (globe.direction || 1);
      globe.orbitDriftAngle += dt * (Number(globe.drift) || 0) * ORBIT_DRIFT_RATE_SCALE * (globe.driftDirection || 1);
      TMP_A.copy(plane.u).applyAxisAngle(plane.normal, globe.orbitDriftAngle);
      TMP_B.copy(plane.v).applyAxisAngle(plane.normal, globe.orbitDriftAngle);
      TMP_C.copy(TMP_A).multiplyScalar(Math.cos(globe.orbitAngle) * orbitRadius);
      TMP_C.addScaledVector(TMP_B, Math.sin(globe.orbitAngle) * orbitRadius);
      globe.model.position.copy(TMP_C);
      globe.model.rotation.y += dt * 0.8;
    });
  }

  function assignOrbitMotion(globe, overrides = {}) {
    const speeds = readRange(els, "orbGlobe3dSpeedMin", "orbGlobe3dSpeedMax", 0.25, 0.30);
    const drifts = readRange(els, "orbGlobe3dDriftMin", "orbGlobe3dDriftMax", 0.50, 1.00);
    globe.speed = Number.isFinite(Number(overrides.speed)) ? Number(overrides.speed) : randomBetween(speeds.min, speeds.max);
    globe.direction = Number.isFinite(Number(overrides.direction)) ? Number(overrides.direction) : (Math.random() < 0.5 ? -1 : 1);
    globe.drift = Number.isFinite(Number(overrides.drift)) ? Number(overrides.drift) : randomBetween(drifts.min, drifts.max);
    globe.driftDirection = Number.isFinite(Number(overrides.driftDirection)) ? Number(overrides.driftDirection) : (Math.random() < 0.5 ? -1 : 1);
    globe.orbitAngle = Number.isFinite(Number(overrides.phase)) ? Number(overrides.phase) : (Number.isFinite(Number(globe.orbitAngle)) ? Number(globe.orbitAngle) : Math.random() * TWO_PI);
    globe.orbitDriftAngle = 0;
  }

  function addGlobe(overrides = {}, { render = true } = {}) {
    const globe = {
      id: nextId++,
      state: "loaded",
      phase: Number.isFinite(Number(overrides.phase)) ? Number(overrides.phase) : Math.random() * Math.PI * 2,
      plane: overrides.plane || createPlane(),
      model: null,
    };
    assignOrbitMotion(globe, overrides);
    samples.push({
      ...globe,
    });
    if (render) rebuildScene();
  }

  function bindGlobe({ render = true } = {}) {
    let globe = samples.find((entry) => entry.state === "loaded");
    if (!globe) {
      addGlobe({}, { render: false });
      globe = samples.find((entry) => entry.state === "loaded");
    }
    if (globe) {
      assignOrbitMotion(globe);
      globe.state = "bound";
      globe.model = null;
      globe.innerPos = null;
      globe.innerVelocity = null;
    }
    if (render) rebuildScene();
  }

  function clear() {
    samples = [];
    destroyInspector();
  }

  function wire() {
    if (els.previewOrbGlobe3d) els.previewOrbGlobe3d.addEventListener("click", rebuildScene);
    if (els.orbGlobe3dAddBtn) els.orbGlobe3dAddBtn.addEventListener("click", () => addGlobe());
    if (els.orbGlobe3dBindBtn) els.orbGlobe3dBindBtn.addEventListener("click", () => bindGlobe());
    if (els.orbGlobe3dClearBtn) els.orbGlobe3dClearBtn.addEventListener("click", clear);
    [
      "orbGlobe3dApplyInnerSpeedMinBtn",
      "orbGlobe3dApplyInnerSpeedMaxBtn",
      "orbGlobe3dApplyInnerDriftMinBtn",
      "orbGlobe3dApplyInnerDriftMaxBtn",
    ].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => { retuneInnerOnNextRebuild = true; });
    });
    document.querySelectorAll('[id^="orbGlobe3dApply"]').forEach((btn) => {
      btn.addEventListener("click", rebuildScene);
    });
  }

  return Object.freeze({
    apply: rebuildScene,
    clear,
    play: rebuildScene,
    wire,
  });
}
