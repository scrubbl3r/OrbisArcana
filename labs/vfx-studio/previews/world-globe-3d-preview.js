import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createGlobeModel } from "../../../src/game-runtime/world/globe-3d-model.js?v=20260429a";
import { createGlobeMaterial, createGlobePointLight } from "../../../src/game-runtime/world/globe-3d-material.js?v=20260429a";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/world/world-globe-3d-default.js?v=20260502b";

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

function colorFromFields(els, prefix, fallback) {
  const field = (id) => els[id] || document.getElementById(id);
  const r = roundedByte(field(`${prefix}R`) && field(`${prefix}R`).value, (fallback >> 16) & 255);
  const g = roundedByte(field(`${prefix}G`) && field(`${prefix}G`).value, (fallback >> 8) & 255);
  const b = roundedByte(field(`${prefix}B`) && field(`${prefix}B`).value, fallback & 255);
  return ((r << 16) | (g << 8) | b) >>> 0;
}

function readNumber(source, keys = [], fallback = 0) {
  const object = source && typeof source === "object" ? source : {};
  for (const key of keys) {
    const value = Number(object[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function readWorldGlobe3dPreviewConfig(els = {}) {
  const field = (id) => els[id] || document.getElementById(id);
  const defaults = WORLD_GLOBE_3D_VISUAL_DEFAULTS;
  const materialDefaults = defaults.material;
  return Object.freeze({
    idle: Object.freeze({
      diameterBO: clampNumber(field("worldGlobe3dIdleDiameterRatio") && field("worldGlobe3dIdleDiameterRatio").value, 0, 10, readNumber(defaults.idle, ["diameterBO", "diameterRatio"], 0.35)),
      driftRangeBO: clampNumber(field("worldGlobe3dIdleDriftRatio") && field("worldGlobe3dIdleDriftRatio").value, 0, 10, readNumber(defaults.idle, ["driftRangeBO", "driftRatio"], 0.10)),
      bobRangeBO: clampNumber(field("worldGlobe3dIdleBobRatio") && field("worldGlobe3dIdleBobRatio").value, 0, 10, readNumber(defaults.idle, ["bobRangeBO", "bobRatio"], 0.07)),
      bobHz: clampNumber(field("worldGlobe3dIdleBobHz") && field("worldGlobe3dIdleBobHz").value, 0, 20, defaults.idle.bobHz),
      pulseScale: clampNumber(field("worldGlobe3dIdlePulseScale") && field("worldGlobe3dIdlePulseScale").value, 0, 1, defaults.idle.pulseScale),
      pulseHz: clampNumber(field("worldGlobe3dIdlePulseHz") && field("worldGlobe3dIdlePulseHz").value, 0, 20, defaults.idle.pulseHz),
    }),
    collected: Object.freeze({
      diameterBO: clampNumber(field("worldGlobe3dCollectedDiameterRatio") && field("worldGlobe3dCollectedDiameterRatio").value, 0, 10, readNumber(defaults.collected, ["diameterBO", "diameterRatio"], 0.14)),
    }),
    consumed: Object.freeze({
      diameterBO: clampNumber(field("worldGlobe3dConsumedDiameterRatio") && field("worldGlobe3dConsumedDiameterRatio").value, 0, 10, readNumber(defaults.consumed, ["diameterBO", "diameterRatio"], 0.08)),
    }),
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
      lightColor: colorFromFields(els, "worldGlobe3dLight", materialDefaults.lightColor),
      lightIntensity: clampNumber(field("worldGlobe3dLightIntensity") && field("worldGlobe3dLightIntensity").value, 0, 1000, materialDefaults.lightIntensity),
      lightDistanceBO: clampNumber(field("worldGlobe3dLightDistanceBO") && field("worldGlobe3dLightDistanceBO").value, 0, 40, materialDefaults.lightDistanceBO),
      lightDecay: clampNumber(field("worldGlobe3dLightDecay") && field("worldGlobe3dLightDecay").value, 0, 4, materialDefaults.lightDecay),
      lightOffsetZBO: clampNumber(field("worldGlobe3dLightOffsetZBO") && field("worldGlobe3dLightOffsetZBO").value, -4, 4, materialDefaults.lightOffsetZBO),
    }),
  });
}

function readOrbDiameterPx(root) {
  if (!root) return 72;
  const raw = getComputedStyle(root).getPropertyValue("--orb-d");
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 72;
}

function createSample({ label, diameter, materialConfig }) {
  const group = new THREE.Group();
  group.name = `world-globe-3d:${label}`;
  const { model } = createGlobeModel({
    bo: diameter,
    material: createGlobeMaterial(materialConfig),
    shellSegments: 32,
  });
  model.add(createGlobePointLight({ bo: diameter, config: materialConfig }));
  group.add(model);
  return group;
}

export function createWorldGlobe3dPreview({ els = {} } = {}) {
  let inspector = null;
  let samples = [];
  let activeConfig = null;

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    samples = [];
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    activeConfig = readWorldGlobe3dPreviewConfig(els);
    const orbDiameter = readOrbDiameterPx(els.previewRoot);
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo: orbDiameter,
      canvasClassName: "worldGlobe3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.2, y: 0.16, z: 2.9 }),
      minDistanceBo: 0.8,
      maxDistanceBo: 18,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        if (!samples.length || !activeConfig) return;
        const t = performance.now() / 1000;
        const idle = samples[0];
        const drift = Math.sin((t * Math.PI * 2 * 0.23) + 0.5) * activeConfig.idle.driftRangeBO * orbDiameter;
        const bob = Math.sin(t * Math.PI * 2 * activeConfig.idle.bobHz) * activeConfig.idle.bobRangeBO * orbDiameter;
        const pulse = 1 + (Math.sin(t * Math.PI * 2 * activeConfig.idle.pulseHz) * activeConfig.idle.pulseScale);
        idle.position.x = (-orbDiameter * 0.68) + drift;
        idle.position.y = bob;
        idle.scale.setScalar(pulse);
      },
    });
    if (!inspector) return null;

    samples = [
      createSample({ label: "idle", diameter: activeConfig.idle.diameterBO * orbDiameter, materialConfig: activeConfig.material }),
      createSample({ label: "collected", diameter: activeConfig.collected.diameterBO * orbDiameter, materialConfig: activeConfig.material }),
      createSample({ label: "consumed", diameter: activeConfig.consumed.diameterBO * orbDiameter, materialConfig: activeConfig.material }),
    ];
    samples[0].position.x = -orbDiameter * 0.68;
    samples[1].position.x = 0;
    samples[2].position.x = orbDiameter * 0.68;
    samples.forEach((sample) => inspector.scene.add(sample));
    inspector.render();
    return activeConfig;
  }

  function wire() {
    if (els.previewWorldGlobe3d) els.previewWorldGlobe3d.addEventListener("click", apply);
    document.querySelectorAll('[id^="worldGlobe3dApply"]').forEach((btn) => {
      btn.addEventListener("click", apply);
    });
    apply();
  }

  return Object.freeze({
    apply,
    clear: destroyInspector,
    play: apply,
    wire,
  });
}
