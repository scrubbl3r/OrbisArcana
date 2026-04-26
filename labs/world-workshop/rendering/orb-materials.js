import * as THREE from "three";
import { ORB_MATERIAL_CONFIG } from "../configs/orb-material-config.js?v=20260426a";

export function createOpalescentOrbShellMaterial(config = ORB_MATERIAL_CONFIG) {
  const opalescenceSpeed = Number(config.opalescenceSpeed) || 1;
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
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
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
        gl_FragColor = vec4(pearl, alpha);
      }
    `,
  });
}

export function createOrbPointLight({
  bo = 72,
  config = ORB_MATERIAL_CONFIG,
} = {}) {
  const baseOrb = Number(bo) || 72;
  const light = new THREE.PointLight(
    config.lightColor,
    Number(config.lightIntensity) || 0,
    baseOrb * (Number(config.lightDistanceBO) || 1),
    Number(config.lightDecay) || 1
  );
  light.position.set(0, 0, baseOrb * (Number(config.lightOffsetZBO) || 0));
  return light;
}

