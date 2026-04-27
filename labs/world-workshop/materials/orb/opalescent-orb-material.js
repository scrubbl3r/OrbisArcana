import * as THREE from "three";
import {
  createOrbSurfaceDisplacementUniforms,
  createOrbSurfaceDisplacementVertexShaderChunk,
} from "../../effects/orb-surface-displacement/orb-surface-displacement.js?v=20260427a";
import { OPALESCENT_ORB_MATERIAL_CONFIG } from "./opalescent-orb-config.js?v=20260426a";

const scratchBaseLight = new THREE.Color();
const scratchCyan = new THREE.Color();
const scratchViolet = new THREE.Color();
const scratchGold = new THREE.Color();
const scratchPastel = new THREE.Color();

export function createOpalescentOrbShellMaterial(config = OPALESCENT_ORB_MATERIAL_CONFIG, {
  bo = 72,
  surfaceDisplacement = null,
} = {}) {
  const opalescenceSpeed = Number(config.opalescenceSpeed) || 1;
  const displacementUniforms = createOrbSurfaceDisplacementUniforms(surfaceDisplacement || { enabled: false }, { bo });
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color(config.shellBaseColor) },
      uCyan: { value: new THREE.Color(config.shellCyanColor) },
      uViolet: { value: new THREE.Color(config.shellVioletColor) },
      uGold: { value: new THREE.Color(config.shellGoldColor) },
      ...displacementUniforms,
    },
    vertexShader: `
      ${createOrbSurfaceDisplacementVertexShaderChunk()}

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 displacedPosition = displaceOrbSurface(position, normal, uTime);
        vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
        vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uBase;
      uniform vec3 uCyan;
      uniform vec3 uViolet;
      uniform vec3 uGold;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), ${Number(config.shellFresnelPower).toFixed(3)});
        float driftA = sin((vWorldPosition.x * ${Number(config.driftScaleX).toFixed(4)}) + uTime * ${(Number(config.driftRateA) * opalescenceSpeed).toFixed(4)}) * 0.5 + 0.5;
        float driftB = sin((vWorldPosition.y * ${Number(config.driftScaleY).toFixed(4)}) + uTime * ${(Number(config.driftRateB) * opalescenceSpeed).toFixed(4)} + ${Number(config.driftPhaseB).toFixed(4)}) * 0.5 + 0.5;
        float driftC = sin((vWorldPosition.z * ${Number(config.driftScaleZ).toFixed(4)}) + uTime * ${(Number(config.driftRateC) * opalescenceSpeed).toFixed(4)} + ${Number(config.driftPhaseC).toFixed(4)}) * 0.5 + 0.5;
        vec3 pastel = mix(uCyan, uViolet, driftA);
        pastel = mix(pastel, uGold, driftB * ${Number(config.goldMix).toFixed(3)});
        vec3 pearl = mix(uBase, pastel, ${Number(config.shellPastelMix).toFixed(3)} + fresnel * ${Number(config.shellRimPastelMix).toFixed(3)} + driftC * ${Number(config.shellDriftPastelMix).toFixed(3)});
        float alpha = ${Number(config.shellCenterAlpha).toFixed(4)} + pow(fresnel, ${Number(config.shellRimAlphaPower).toFixed(3)}) * ${Number(config.shellRimAlpha).toFixed(3)};
        gl_FragColor = vec4(pearl * ${Number(config.shellLuminanceBoost).toFixed(3)}, alpha);
      }
    `,
  });
}

export function createOrbPointLight({
  bo = 72,
  config = OPALESCENT_ORB_MATERIAL_CONFIG,
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

export function createOrbShadowSpotLight({
  bo = 72,
  config = OPALESCENT_ORB_MATERIAL_CONFIG,
} = {}) {
  if (!config.shadowSpotEnabled) return null;

  const baseOrb = Number(bo) || 72;
  const light = new THREE.SpotLight(
    config.shadowSpotColor,
    Number(config.shadowSpotIntensity) || 0,
    baseOrb * (Number(config.shadowSpotDistanceBO) || 1),
    Number(config.shadowSpotAngle) || 0.5,
    Number(config.shadowSpotPenumbra) || 0,
    Number(config.shadowSpotDecay) || 1
  );

  light.castShadow = true;
  light.shadow.mapSize.width = Number(config.shadowSpotMapSize) || 512;
  light.shadow.mapSize.height = Number(config.shadowSpotMapSize) || 512;
  light.shadow.bias = Number(config.shadowSpotBias) || 0;
  light.shadow.normalBias = Number(config.shadowSpotNormalBias) || 0;
  light.shadow.camera.near = baseOrb * 0.05;
  light.shadow.camera.far = baseOrb * (Number(config.shadowSpotDistanceBO) || 1);
  return light;
}

export function updateOrbPointLight(light, time = 0, config = OPALESCENT_ORB_MATERIAL_CONFIG) {
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
