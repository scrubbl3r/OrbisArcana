import * as THREE from "three";
import { createOrbSurfaceDisplacementUniforms } from "../vfx/orb-surface-displacement/orb-surface-displacement.js";
import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";

const scratchBaseLight = new THREE.Color();
const scratchCyan = new THREE.Color();
const scratchViolet = new THREE.Color();
const scratchGold = new THREE.Color();
const scratchPastel = new THREE.Color();

export function createOpalescentOrbShellMaterial(config = ORB_3D_VISUAL_DEFAULTS, {
  bo = 72,
  surfaceDisplacement = null,
  lifecycleErosion = null,
} = {}) {
  if (!surfaceDisplacement) return createBaseOpalescentOrbShellMaterial(config, { lifecycleErosion });

  const opalescenceSpeed = Number(config.opalescenceSpeed) || 1;
  const displacementUniforms = createOrbSurfaceDisplacementUniforms(surfaceDisplacement || { enabled: false }, { bo });
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    extensions: {
      derivatives: true,
    },
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBase: { value: new THREE.Color(config.shellBaseColor) },
      uCyan: { value: new THREE.Color(config.shellCyanColor) },
      uViolet: { value: new THREE.Color(config.shellVioletColor) },
      uGold: { value: new THREE.Color(config.shellGoldColor) },
      uShellLuminanceBoost: { value: Number(config.shellLuminanceBoost) || 1 },
      uShellCenterAlpha: { value: Number(config.shellCenterAlpha) || 0 },
      uGoldMix: { value: Number(config.goldMix) || 0 },
      ...(lifecycleErosion && lifecycleErosion.uniforms ? lifecycleErosion.uniforms : {}),
      ...displacementUniforms,
    },
    vertexShader: `
      uniform float uTime;
      uniform float uDisplacementEnabled;
      uniform float uDisplacementDepth;
      uniform float uDisplacementWaveCount;
      uniform float uDisplacementOscillationHz;
      uniform float uDisplacementEquatorFalloff;
      uniform float uDisplacementEquatorAmplitude;
      uniform float uDisplacementPoleAmplitude;
      uniform float uDisplacementRippleSoftness;
      uniform float uDisplacementLatitudinalMix;
      uniform float uDisplacementLatitudinalBands;
      uniform float uDisplacementCellMix;
      uniform float uDisplacementAxisMix;
      uniform float uDisplacementPhaseOffset;
      uniform float uDisplacementShrink;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vLifecycleLocalNormal;

      void main() {
        vec3 n = normalize(normal);
        float travelClock = (uTime * uDisplacementOscillationHz) + (uDisplacementPhaseOffset * 0.15915494);
        float polarAngle = acos(clamp(n.y, -1.0, 1.0));
        float latitudeTravel = abs(polarAngle - 1.5707963) / 1.5707963;
        float equatorMask = pow(max(0.0, 1.0 - latitudeTravel), uDisplacementEquatorFalloff);
        float latitudeAmplitude = mix(uDisplacementEquatorAmplitude, uDisplacementPoleAmplitude, latitudeTravel);
        float ripple = sin(((latitudeTravel * uDisplacementWaveCount) - travelClock) * 6.2831853);
        float softenedRipple = mix(ripple, sin(ripple * 1.5707963), uDisplacementRippleSoftness);
        float travelingWave = softenedRipple * equatorMask * latitudeAmplitude;
        float displacement = travelingWave * uDisplacementDepth * uDisplacementEnabled;
        float shrink = 1.0 - (uDisplacementShrink * abs(sin(travelClock * 6.2831853)) * uDisplacementEnabled);
        vec3 displacedPosition = (position * shrink) + (n * displacement);
        vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
        vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = worldPosition.xyz;
        vLifecycleLocalNormal = n;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uBase;
      uniform vec3 uCyan;
      uniform vec3 uViolet;
      uniform vec3 uGold;
      uniform float uShellLuminanceBoost;
      uniform float uShellCenterAlpha;
      uniform float uGoldMix;
      ${lifecycleErosion && lifecycleErosion.uniformsSource ? lifecycleErosion.uniformsSource : ""}

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vLifecycleLocalNormal;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), ${Number(config.shellFresnelPower).toFixed(3)});
        float driftA = sin((vWorldPosition.x * ${Number(config.driftScaleX).toFixed(4)}) + uTime * ${(Number(config.driftRateA) * opalescenceSpeed).toFixed(4)}) * 0.5 + 0.5;
        float driftB = sin((vWorldPosition.y * ${Number(config.driftScaleY).toFixed(4)}) + uTime * ${(Number(config.driftRateB) * opalescenceSpeed).toFixed(4)} + ${Number(config.driftPhaseB).toFixed(4)}) * 0.5 + 0.5;
        float driftC = sin((vWorldPosition.z * ${Number(config.driftScaleZ).toFixed(4)}) + uTime * ${(Number(config.driftRateC) * opalescenceSpeed).toFixed(4)} + ${Number(config.driftPhaseC).toFixed(4)}) * 0.5 + 0.5;
        vec3 pastel = mix(uCyan, uViolet, driftA);
        pastel = mix(pastel, uGold, driftB * uGoldMix);
        vec3 pearl = mix(uBase, pastel, ${Number(config.shellPastelMix).toFixed(3)} + fresnel * ${Number(config.shellRimPastelMix).toFixed(3)} + driftC * ${Number(config.shellDriftPastelMix).toFixed(3)});
        float alpha = uShellCenterAlpha + pow(fresnel, ${Number(config.shellRimAlphaPower).toFixed(3)}) * ${Number(config.shellRimAlpha).toFixed(3)};
        ${lifecycleErosion && lifecycleErosion.fragmentSource ? lifecycleErosion.fragmentSource : ""}
        gl_FragColor = vec4(pearl * uShellLuminanceBoost, alpha * uOpacity);
      }
    `,
  });
}

function createBaseOpalescentOrbShellMaterial(config = ORB_3D_VISUAL_DEFAULTS, {
  lifecycleErosion = null,
} = {}) {
  const opalescenceSpeed = Number(config.opalescenceSpeed) || 1;
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    extensions: {
      derivatives: true,
    },
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBase: { value: new THREE.Color(config.shellBaseColor) },
      uCyan: { value: new THREE.Color(config.shellCyanColor) },
      uViolet: { value: new THREE.Color(config.shellVioletColor) },
      uGold: { value: new THREE.Color(config.shellGoldColor) },
      uShellLuminanceBoost: { value: Number(config.shellLuminanceBoost) || 1 },
      uShellCenterAlpha: { value: Number(config.shellCenterAlpha) || 0 },
      uGoldMix: { value: Number(config.goldMix) || 0 },
      ...(lifecycleErosion && lifecycleErosion.uniforms ? lifecycleErosion.uniforms : {}),
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vLifecycleLocalNormal;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = worldPosition.xyz;
        vLifecycleLocalNormal = normalize(position);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uBase;
      uniform vec3 uCyan;
      uniform vec3 uViolet;
      uniform vec3 uGold;
      uniform float uShellLuminanceBoost;
      uniform float uShellCenterAlpha;
      uniform float uGoldMix;
      ${lifecycleErosion && lifecycleErosion.uniformsSource ? lifecycleErosion.uniformsSource : ""}

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vLifecycleLocalNormal;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), ${Number(config.shellFresnelPower).toFixed(3)});
        float driftA = sin((vWorldPosition.x * ${Number(config.driftScaleX).toFixed(4)}) + uTime * ${(Number(config.driftRateA) * opalescenceSpeed).toFixed(4)}) * 0.5 + 0.5;
        float driftB = sin((vWorldPosition.y * ${Number(config.driftScaleY).toFixed(4)}) + uTime * ${(Number(config.driftRateB) * opalescenceSpeed).toFixed(4)} + ${Number(config.driftPhaseB).toFixed(4)}) * 0.5 + 0.5;
        float driftC = sin((vWorldPosition.z * ${Number(config.driftScaleZ).toFixed(4)}) + uTime * ${(Number(config.driftRateC) * opalescenceSpeed).toFixed(4)} + ${Number(config.driftPhaseC).toFixed(4)}) * 0.5 + 0.5;
        vec3 pastel = mix(uCyan, uViolet, driftA);
        pastel = mix(pastel, uGold, driftB * uGoldMix);
        vec3 pearl = mix(uBase, pastel, ${Number(config.shellPastelMix).toFixed(3)} + fresnel * ${Number(config.shellRimPastelMix).toFixed(3)} + driftC * ${Number(config.shellDriftPastelMix).toFixed(3)});
        float alpha = uShellCenterAlpha + pow(fresnel, ${Number(config.shellRimAlphaPower).toFixed(3)}) * ${Number(config.shellRimAlpha).toFixed(3)};
        ${lifecycleErosion && lifecycleErosion.fragmentSource ? lifecycleErosion.fragmentSource : ""}
        gl_FragColor = vec4(pearl * uShellLuminanceBoost, alpha * uOpacity);
      }
    `,
  });
}

export function createOrbPointLight({
  bo = 72,
  config = ORB_3D_VISUAL_DEFAULTS,
} = {}) {
  const baseOrb = Number(bo) || 72;
  const light = new THREE.PointLight(
    config.lightColor,
    Number(config.lightIntensity) || 0,
    baseOrb * (Number(config.lightDistanceBO) || 1),
    Number(config.lightDecay) || 1
  );
  light.position.set(0, 0, baseOrb * (Number(config.lightOffsetZBO) || 0));
  light.castShadow = Boolean(config.lightCastShadow);
  if (light.castShadow) {
    light.shadow.mapSize.width = Number(config.lightShadowMapSize) || 512;
    light.shadow.mapSize.height = Number(config.lightShadowMapSize) || 512;
    light.shadow.bias = Number(config.lightShadowBias) || 0;
    light.shadow.normalBias = Number(config.lightShadowNormalBias) || 0;
    light.shadow.camera.near = baseOrb * (Number(config.lightShadowNearBO) || 0.08);
    light.shadow.camera.far = baseOrb * (Number(config.lightShadowFarBO) || Number(config.lightDistanceBO) || 1);
  }
  return light;
}

export function updateOrbPointLight(light, time = 0, config = ORB_3D_VISUAL_DEFAULTS) {
  if (!light) return;

  const opalescenceSpeed = Number(config.opalescenceSpeed) || 1;
  const driftA = Math.sin(time * (Number(config.driftRateA) || 0) * opalescenceSpeed) * 0.5 + 0.5;
  const driftB = Math.sin(time * (Number(config.driftRateB) || 0) * opalescenceSpeed + (Number(config.driftPhaseB) || 0)) * 0.5 + 0.5;

  scratchBaseLight.set(config.lightColor);
  scratchCyan.set(config.shellCyanColor);
  scratchViolet.set(config.shellVioletColor);
  scratchGold.set(config.shellGoldColor);

  scratchPastel.copy(scratchCyan).lerp(scratchViolet, driftA);
  scratchPastel.lerp(scratchGold, driftB * (Number(config.goldMix) || 0));
  light.color.copy(scratchBaseLight).lerp(scratchPastel, Number(config.lightPastelMix) || 0);
}
