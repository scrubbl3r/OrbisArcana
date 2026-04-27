import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../world-workshop/generators/orb-generator.js?v=20260427a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../world-workshop/materials/orb/opalescent-orb-material.js?v=20260427k";
import { ORB_MATERIAL_CONFIG } from "../../world-workshop/materials/orb/opalescent-orb-config.js?v=20260426a";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function readConfig(els = {}) {
  return Object.freeze({
    shrinkPct: clampNumber(els.orbNod3dShrinkPct && els.orbNod3dShrinkPct.value, 0, 40, 2) / 100,
    durationMs: Math.round(clampNumber(els.orbNod3dDurationMs && els.orbNod3dDurationMs.value, 80, 3000, 520)),
    fillAlpha: clampNumber(els.orbNod3dFillAlpha && els.orbNod3dFillAlpha.value, 0, 1, 0.07),
    waveCount: Math.round(clampNumber(els.orbNod3dWaveCount && els.orbNod3dWaveCount.value, 1, 32, 4)),
    latitudinalBands: Math.round(clampNumber(els.orbNod3dLatitudinalBands && els.orbNod3dLatitudinalBands.value, 1, 32, 4)),
    waveDepthBO: clampNumber(els.orbNod3dWaveDepthBO && els.orbNod3dWaveDepthBO.value, 0, 0.2, 0.024),
    oscillationSpeedHz: clampNumber(els.orbNod3dOscillationSpeedHz && els.orbNod3dOscillationSpeedHz.value, 0.1, 40, 4.8),
    oscillationCount: Math.round(clampNumber(els.orbNod3dOscillationCount && els.orbNod3dOscillationCount.value, 0, 12, 2)),
    equatorFalloff: clampNumber(els.orbNod3dEquatorFalloff && els.orbNod3dEquatorFalloff.value, 0, 8, 0),
    rippleSoftness: clampNumber(els.orbNod3dRippleSoftness && els.orbNod3dRippleSoftness.value, 0, 1, 0.82),
  });
}

function hydrateFields(els = {}, cfg = {}) {
  if (els.orbNod3dShrinkPct) els.orbNod3dShrinkPct.value = String(Math.round(cfg.shrinkPct * 100));
  if (els.orbNod3dDurationMs) els.orbNod3dDurationMs.value = String(cfg.durationMs);
  if (els.orbNod3dFillAlpha) els.orbNod3dFillAlpha.value = Number(cfg.fillAlpha).toFixed(2);
  if (els.orbNod3dWaveCount) els.orbNod3dWaveCount.value = String(cfg.waveCount);
  if (els.orbNod3dLatitudinalBands) els.orbNod3dLatitudinalBands.value = String(cfg.latitudinalBands);
  if (els.orbNod3dWaveDepthBO) els.orbNod3dWaveDepthBO.value = Number(cfg.waveDepthBO).toFixed(3);
  if (els.orbNod3dOscillationSpeedHz) els.orbNod3dOscillationSpeedHz.value = Number(cfg.oscillationSpeedHz).toFixed(1);
  if (els.orbNod3dOscillationCount) els.orbNod3dOscillationCount.value = String(cfg.oscillationCount);
  if (els.orbNod3dEquatorFalloff) els.orbNod3dEquatorFalloff.value = Number(cfg.equatorFalloff).toFixed(2);
  if (els.orbNod3dRippleSoftness) els.orbNod3dRippleSoftness.value = Number(cfg.rippleSoftness).toFixed(2);
}

function createSurfaceDisplacementConfig(cfg) {
  return Object.freeze({
    enabled: true,
    waveCount: cfg.waveCount,
    waveDepthBO: cfg.waveDepthBO,
    oscillationSpeedHz: cfg.oscillationSpeedHz,
    equatorFalloff: cfg.equatorFalloff,
    equatorAmplitude: 1,
    poleAmplitude: 1,
    rippleSoftness: cfg.rippleSoftness,
    latitudinalMix: 1,
    latitudinalBands: cfg.latitudinalBands,
    cellMix: 0,
    axisMix: 0,
    phaseOffset: 0,
    shrinkPct: cfg.shrinkPct,
  });
}

export function createOrbNod3dPreview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let activeCfg = null;
  let playStartedAt = 0;

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
    const cfg = readConfig(els);
    hydrateFields(els, cfg);
    destroyInspector();
    const bo = readBo();
    const startedAt = performance.now();
    playStartedAt = startedAt;
    activeCfg = cfg;
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "orbNod3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const elapsedSec = (performance.now() - playStartedAt) / 1000;
        const progress = Math.max(0, Math.min(1, (elapsedSec * 1000) / activeCfg.durationMs));
        const envelope = Math.sin(progress * Math.PI);
        const oscillationLimit = activeCfg.oscillationCount / Math.max(0.001, activeCfg.oscillationSpeedHz);
        const shaderTime = Math.min(elapsedSec, oscillationLimit);
        if (shellMaterial && shellMaterial.uniforms) {
          if (shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = shaderTime;
          if (shellMaterial.uniforms.uDisplacementDepth) {
            shellMaterial.uniforms.uDisplacementDepth.value = bo * activeCfg.waveDepthBO * envelope;
          }
          if (shellMaterial.uniforms.uDisplacementShrink) {
            shellMaterial.uniforms.uDisplacementShrink.value = activeCfg.shrinkPct * envelope;
          }
        }
        if (orbLight) updateOrbPointLight(orbLight, shaderTime, ORB_MATERIAL_CONFIG);
        if (model && progress >= 1) {
          playStartedAt = performance.now();
        }
      },
    });
    if (!inspector) return cfg;

    shellMaterial = createOpalescentOrbShellMaterial(ORB_MATERIAL_CONFIG, {
      bo,
      surfaceDisplacement: createSurfaceDisplacementConfig(cfg),
    });
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
    orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
    updateOrbPointLight(orbLight, 0, ORB_MATERIAL_CONFIG);
    model.add(orbLight);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.04));
    inspector.scene.add(model);
    inspector.render();
    return cfg;
  }

  function play() {
    activeCfg = readConfig(els);
    hydrateFields(els, activeCfg);
    if (!inspector) apply();
    playStartedAt = performance.now();
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    [
      els.previewOrbNod3d,
      els.orbNod3dApplyShrinkBtn,
      els.orbNod3dApplyDurationBtn,
      els.orbNod3dApplyFillOpacityBtn,
      els.orbNod3dApplyWaveCountBtn,
      els.orbNod3dApplyLatitudinalBandsBtn,
      els.orbNod3dApplyWaveDepthBtn,
      els.orbNod3dApplyOscillationSpeedBtn,
      els.orbNod3dApplyOscillationCountBtn,
      els.orbNod3dApplyEquatorFalloffBtn,
      els.orbNod3dApplyRippleSoftnessBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
    if (els.previewOrbNod3d) els.previewOrbNod3d.addEventListener("click", play);
  }

  return Object.freeze({
    apply,
    clear,
    play,
    wire,
  });
}
