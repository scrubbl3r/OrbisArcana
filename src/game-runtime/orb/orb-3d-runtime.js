import * as THREE from "three";
import { createOrb3dModel } from "./orb-3d-model.js?v=20260501b";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  createOrbShadowSpotLight,
  updateOrbPointLight,
} from "./orb-3d-material.js?v=20260517a";
import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";

const SPIN_COLOR_EASE_RATE = 7;
const SHELL_BASE_TINT_MIX = 0.96;
const SHELL_PASTEL_TINT_MIX = 0.9;
const LIGHT_TINT_MIX = 1;

function clamp01(value) {
  const n = Number(value);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function colorFrom01(color = {}, fallback = 0xffffff) {
  if (!color || typeof color !== "object") return new THREE.Color(fallback);
  return new THREE.Color(clamp01(color.r), clamp01(color.g), clamp01(color.b));
}

function clampNumber(value, fallback, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  const resolved = Number.isFinite(numeric) ? numeric : fallback;
  return Math.max(min, Math.min(max, resolved));
}

function readUniformValue(uniforms = null, key = "") {
  const uniform = uniforms && key ? uniforms[key] : null;
  if (!uniform) return null;
  const value = uniform.value;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

export function createOrb3dRuntime({
  bo = 72,
  config = ORB_3D_VISUAL_DEFAULTS,
  edgeMaterials = [],
  includeCore = false,
  includeRibs = false,
  surfaceDisplacement = null,
  lifecycleErosion = null,
} = {}) {
  let currentLifecycleErosion = lifecycleErosion;
  let shellMaterial = createOpalescentOrbShellMaterial(config, {
    bo,
    surfaceDisplacement,
    lifecycleErosion: currentLifecycleErosion,
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
  const basePointLightIntensity = pointLight ? Number(pointLight.intensity) || 0 : 0;
  const basePointLightDistance = pointLight ? Number(pointLight.distance) || 0 : 0;

  const shadowSpot = createOrbShadowSpotLight({ bo, config });
  const baseShadowSpotIntensity = shadowSpot ? Number(shadowSpot.intensity) || 0 : 0;
  const baseShadowSpotDistance = shadowSpot ? Number(shadowSpot.distance) || 0 : 0;
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
  let currentOpacity = 1;
  let currentTime = 0;
  const shaderState = {
    shellLuminanceBoost: clampNumber(config.shellLuminanceBoost, 1, 0, 12),
    shellCenterAlpha: clampNumber(config.shellCenterAlpha, 0, 0, 1),
    goldMix: clampNumber(config.goldMix, 0, 0, 2),
    pointLightIntensity: basePointLightIntensity,
    pointLightDistance: basePointLightDistance,
    shadowSpotIntensity: baseShadowSpotIntensity,
    shadowSpotDistance: baseShadowSpotDistance,
  };
  let disposed = false;

  function applyShaderUniformState() {
    const uniforms = shellMaterial && shellMaterial.uniforms ? shellMaterial.uniforms : null;
    if (!uniforms) return;
    if (uniforms.uShellLuminanceBoost) uniforms.uShellLuminanceBoost.value = shaderState.shellLuminanceBoost;
    if (uniforms.uShellCenterAlpha) uniforms.uShellCenterAlpha.value = shaderState.shellCenterAlpha;
    if (uniforms.uGoldMix) uniforms.uGoldMix.value = shaderState.goldMix;
  }

  function applyLightState() {
    if (pointLight) {
      pointLight.intensity = shaderState.pointLightIntensity * currentOpacity;
      pointLight.distance = shaderState.pointLightDistance;
    }
    if (shadowSpot) {
      shadowSpot.intensity = shaderState.shadowSpotIntensity * currentOpacity;
      shadowSpot.distance = shaderState.shadowSpotDistance;
      if (shadowSpot.shadow && shadowSpot.shadow.camera) {
        shadowSpot.shadow.camera.far = Math.max(1, shaderState.shadowSpotDistance);
        shadowSpot.shadow.camera.updateProjectionMatrix();
      }
    }
  }

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
    applyShaderUniformState();
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
    currentTime = Number(time) || 0;
    if (shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
      shellMaterial.uniforms.uTime.value = currentTime;
    }
    updateOrbPointLight(pointLight, currentTime, { ...config, goldMix: shaderState.goldMix });
    updateSpinColor(currentTime);
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

  function setOpacity(alpha = 1) {
    if (disposed) return;
    const value = clamp01(alpha);
    currentOpacity = value;
    model.visible = value > 0.001;
    if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uOpacity) {
      shellMaterial.uniforms.uOpacity.value = value;
    }
    applyLightState();
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

  function setShaderState(nextState = {}) {
    if (disposed || !nextState || typeof nextState !== "object") return;
    if (nextState.luminanceBoost != null || nextState.shellLuminanceBoost != null) {
      shaderState.shellLuminanceBoost = clampNumber(
        nextState.luminanceBoost ?? nextState.shellLuminanceBoost,
        shaderState.shellLuminanceBoost,
        0,
        12
      );
    }
    if (nextState.centerAlpha != null || nextState.shellCenterAlpha != null) {
      shaderState.shellCenterAlpha = clampNumber(
        nextState.centerAlpha ?? nextState.shellCenterAlpha,
        shaderState.shellCenterAlpha,
        0,
        1
      );
    }
    if (nextState.goldMix != null) {
      shaderState.goldMix = clampNumber(nextState.goldMix, shaderState.goldMix, 0, 2);
    }
    if (nextState.lightIntensity != null || nextState.pointLightIntensity != null || nextState.spotIntensity != null) {
      shaderState.pointLightIntensity = clampNumber(
        nextState.lightIntensity ?? nextState.pointLightIntensity ?? nextState.spotIntensity,
        shaderState.pointLightIntensity,
        0,
        10000
      );
    }
    if (nextState.lightDistance != null || nextState.lightDistanceBO != null || nextState.pointLightDistance != null || nextState.pointLightDistanceBO != null || nextState.spotDistance != null || nextState.spotDistanceBO != null) {
      const distanceBO = nextState.lightDistanceBO ?? nextState.pointLightDistanceBO ?? nextState.spotDistanceBO;
      shaderState.pointLightDistance = distanceBO != null
        ? Math.max(0, Number(distanceBO) || 0) * Math.max(1, Number(bo) || 72)
        : clampNumber(nextState.lightDistance ?? nextState.pointLightDistance ?? nextState.spotDistance, shaderState.pointLightDistance, 0, Infinity);
    }
    if (nextState.spotIntensity != null || nextState.shadowSpotIntensity != null) {
      shaderState.shadowSpotIntensity = clampNumber(
        nextState.spotIntensity ?? nextState.shadowSpotIntensity,
        shaderState.shadowSpotIntensity,
        0,
        10000
      );
    }
    if (nextState.spotDistance != null || nextState.spotDistanceBO != null || nextState.shadowSpotDistance != null || nextState.shadowSpotDistanceBO != null) {
      const distanceBO = nextState.spotDistanceBO ?? nextState.shadowSpotDistanceBO;
      shaderState.shadowSpotDistance = distanceBO != null
        ? Math.max(0, Number(distanceBO) || 0) * Math.max(1, Number(bo) || 72)
        : clampNumber(nextState.spotDistance ?? nextState.shadowSpotDistance, shaderState.shadowSpotDistance, 0, Infinity);
    }
    applyShaderUniformState();
    updateOrbPointLight(pointLight, currentTime, { ...config, goldMix: shaderState.goldMix });
    applyLightState();
  }

  function getShaderTrace() {
    const uniforms = shellMaterial && shellMaterial.uniforms ? shellMaterial.uniforms : null;
    const resolvedBo = Math.max(1, Number(bo) || 72);
    return {
      disposed,
      bo: resolvedBo,
      currentOpacity,
      modelVisible: !!(model && model.visible),
      hasLifecycleErosion: !!currentLifecycleErosion,
      materialUuid: shellMaterial && shellMaterial.uuid ? shellMaterial.uuid : "",
      shaderState: { ...shaderState },
      uniforms: {
        shellLuminanceBoost: readUniformValue(uniforms, "uShellLuminanceBoost"),
        shellCenterAlpha: readUniformValue(uniforms, "uShellCenterAlpha"),
        goldMix: readUniformValue(uniforms, "uGoldMix"),
        opacity: readUniformValue(uniforms, "uOpacity"),
      },
      pointLight: pointLight
        ? {
            intensity: Number(pointLight.intensity) || 0,
            distance: Number(pointLight.distance) || 0,
            distanceBO: (Number(pointLight.distance) || 0) / resolvedBo,
            visible: pointLight.visible !== false,
          }
        : null,
      shadowSpot: shadowSpot
        ? {
            intensity: Number(shadowSpot.intensity) || 0,
            distance: Number(shadowSpot.distance) || 0,
            distanceBO: (Number(shadowSpot.distance) || 0) / resolvedBo,
            visible: shadowSpot.visible !== false,
          }
        : null,
    };
  }

  function isSpinColorActive() {
    return Math.abs(spinColorState.currentMix - spinColorState.targetMix) > 0.002
      || spinColorState.targetMix > 0.002;
  }

  function setLifecycleErosion(nextLifecycleErosion = null) {
    if (disposed) return;
    currentLifecycleErosion = nextLifecycleErosion;
    const previousMaterial = shellMaterial;
    shellMaterial = createOpalescentOrbShellMaterial(config, {
      bo,
      surfaceDisplacement,
      lifecycleErosion: currentLifecycleErosion,
    });
    if (shellMaterial.uniforms && shellMaterial.uniforms.uTime && previousMaterial.uniforms && previousMaterial.uniforms.uTime) {
      shellMaterial.uniforms.uTime.value = previousMaterial.uniforms.uTime.value;
    }
    if (shellMaterial.uniforms && shellMaterial.uniforms.uOpacity) {
      shellMaterial.uniforms.uOpacity.value = currentOpacity;
    }
    applyShaderUniformState();
    applyShellSpinTint();
    const shell = model.getObjectByName("orb3d:shell");
    if (shell && shell.material !== shellMaterial) {
      shell.material = shellMaterial;
    }
    if (previousMaterial && previousMaterial !== shellMaterial && typeof previousMaterial.dispose === "function") {
      previousMaterial.dispose();
    }
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
    get shellMaterial() {
      return shellMaterial;
    },
    pointLight,
    shadowSpot,
    setTime,
    setPosition,
    setScale,
    setOpacity,
    applySpinColor,
    clearSpinColor,
    setShaderState,
    getShaderTrace,
    setLifecycleErosion,
    isSpinColorActive,
    dispose,
  });
}
