import * as THREE from "three";
import { createOrb3dModel } from "./orb-3d-model.js?v=20260501a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  createOrbShadowSpotLight,
  updateOrbPointLight,
} from "./orb-3d-material.js";
import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";

const SPIN_COLOR_EASE_RATE = 7;
const SHELL_BASE_TINT_MIX = 0.62;
const SHELL_PASTEL_TINT_MIX = 0.38;
const LIGHT_TINT_MIX = 0.82;

function clamp01(value) {
  const n = Number(value);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function colorFrom01(color = {}, fallback = 0xffffff) {
  if (!color || typeof color !== "object") return new THREE.Color(fallback);
  return new THREE.Color(clamp01(color.r), clamp01(color.g), clamp01(color.b));
}

export function createOrb3dRuntime({
  bo = 72,
  config = ORB_3D_VISUAL_DEFAULTS,
  edgeMaterials = [],
  includeCore = false,
  includeRibs = false,
  surfaceDisplacement = null,
} = {}) {
  const shellMaterial = createOpalescentOrbShellMaterial(config, {
    bo,
    surfaceDisplacement,
  });
  const { model, metrics } = createOrb3dModel({
    bo,
    shellMaterial,
    edgeMaterials,
    includeCore,
    includeRibs,
  });
  const pointLight = createOrbPointLight({ bo, config });
  updateOrbPointLight(pointLight, 0, config);
  model.add(pointLight);

  const shadowSpot = createOrbShadowSpotLight({ bo, config });
  const baseShellColors = {
    base: new THREE.Color(config.shellBaseColor),
    cyan: new THREE.Color(config.shellCyanColor),
    violet: new THREE.Color(config.shellVioletColor),
    gold: new THREE.Color(config.shellGoldColor),
  };
  const spinColorState = {
    currentMix: 0,
    targetMix: 0,
    currentColor: new THREE.Color(config.lightColor),
    targetColor: new THREE.Color(config.lightColor),
    lastTime: 0,
    initialized: false,
  };
  const scratchSpinBase = new THREE.Color();
  const scratchSpinCyan = new THREE.Color();
  const scratchSpinViolet = new THREE.Color();
  const scratchSpinGold = new THREE.Color();
  let disposed = false;

  function applyShellSpinTint() {
    const uniforms = shellMaterial && shellMaterial.uniforms ? shellMaterial.uniforms : null;
    if (!uniforms) return;
    const mix = clamp01(spinColorState.currentMix);
    scratchSpinBase.copy(baseShellColors.base).lerp(spinColorState.currentColor, mix * SHELL_BASE_TINT_MIX);
    scratchSpinCyan.copy(baseShellColors.cyan).lerp(spinColorState.currentColor, mix * SHELL_PASTEL_TINT_MIX);
    scratchSpinViolet.copy(baseShellColors.violet).lerp(spinColorState.currentColor, mix * SHELL_PASTEL_TINT_MIX);
    scratchSpinGold.copy(baseShellColors.gold).lerp(spinColorState.currentColor, mix * SHELL_PASTEL_TINT_MIX);
    if (uniforms.uBase && uniforms.uBase.value) uniforms.uBase.value.copy(scratchSpinBase);
    if (uniforms.uCyan && uniforms.uCyan.value) uniforms.uCyan.value.copy(scratchSpinCyan);
    if (uniforms.uViolet && uniforms.uViolet.value) uniforms.uViolet.value.copy(scratchSpinViolet);
    if (uniforms.uGold && uniforms.uGold.value) uniforms.uGold.value.copy(scratchSpinGold);
  }

  function updateSpinColor(time = 0) {
    const now = Number(time) || 0;
    const dt = spinColorState.initialized
      ? Math.max(0, Math.min(0.05, now - spinColorState.lastTime))
      : 0.016;
    spinColorState.lastTime = now;
    spinColorState.initialized = true;
    const ease = 1 - Math.exp(-SPIN_COLOR_EASE_RATE * dt);
    spinColorState.currentMix += (spinColorState.targetMix - spinColorState.currentMix) * ease;
    spinColorState.currentColor.lerp(spinColorState.targetColor, ease);
    applyShellSpinTint();
    if (pointLight) {
      pointLight.color.lerp(spinColorState.currentColor, spinColorState.currentMix * LIGHT_TINT_MIX);
    }
  }

  function setTime(time = 0) {
    if (disposed) return;
    if (shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
      shellMaterial.uniforms.uTime.value = Number(time) || 0;
    }
    updateOrbPointLight(pointLight, Number(time) || 0, config);
    updateSpinColor(Number(time) || 0);
  }

  function setPosition({ x = 0, y = 0, z = 0 } = {}) {
    if (disposed) return;
    model.position.set(Number(x) || 0, Number(y) || 0, Number(z) || 0);
    if (shadowSpot) shadowSpot.position.copy(model.position);
  }

  function setScale(scale = 1) {
    if (disposed) return;
    const resolved = Math.max(0.001, Number(scale) || 1);
    model.scale.setScalar(resolved);
  }

  function applySpinColor(color = {}) {
    if (disposed) return;
    spinColorState.targetColor.copy(colorFrom01(color, config.lightColor));
    spinColorState.targetMix = 1;
  }

  function clearSpinColor() {
    if (disposed) return;
    spinColorState.targetColor.set(config.lightColor);
    spinColorState.targetMix = 0;
  }

  function isSpinColorActive() {
    return Math.abs(spinColorState.currentMix - spinColorState.targetMix) > 0.002
      || spinColorState.targetMix > 0.002;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (model.parent) model.parent.remove(model);
    if (shadowSpot && shadowSpot.parent) shadowSpot.parent.remove(shadowSpot);
    disposeThreeObject(model);
    if (shadowSpot) disposeThreeObject(shadowSpot);
  }

  return Object.freeze({
    model,
    metrics,
    shellMaterial,
    pointLight,
    shadowSpot,
    setTime,
    setPosition,
    setScale,
    applySpinColor,
    clearSpinColor,
    isSpinColorActive,
    dispose,
  });
}
