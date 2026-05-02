import * as THREE from "three";
import { GLOBE_3D_VISUAL_DEFAULTS } from "./globe-3d-default.js";

export function createGlobeMaterial(config = GLOBE_3D_VISUAL_DEFAULTS) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
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
      uniform vec3 uBase;
      uniform vec3 uCyan;
      uniform vec3 uViolet;
      uniform vec3 uGold;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normalDir = normalize(vNormal);
        float fresnel = pow(1.0 - max(dot(normalDir, viewDir), 0.0), ${Number(config.shellFresnelPower).toFixed(3)});
        float rim = smoothstep(0.24, 1.0, fresnel);
        float latitude = normalDir.y * 0.5 + 0.5;
        float longitude = sin((vWorldPosition.x + vWorldPosition.z) * 0.026) * 0.5 + 0.5;
        vec3 pastel = mix(uCyan, uViolet, latitude);
        pastel = mix(pastel, uGold, longitude * 0.18);
        vec3 center = mix(uBase, pastel, ${Number(config.shellPastelMix).toFixed(3)} * 0.55);
        vec3 rimColor = mix(uBase, pastel, ${Number(config.shellPastelMix).toFixed(3)} + rim * ${Number(config.shellRimPastelMix).toFixed(3)});
        vec3 pearl = mix(center, rimColor, rim);
        float alpha = ${Number(config.shellCenterAlpha).toFixed(4)} + pow(fresnel, ${Number(config.shellRimAlphaPower).toFixed(3)}) * ${Number(config.shellRimAlpha).toFixed(3)};
        gl_FragColor = vec4(pearl * ${Number(config.shellLuminanceBoost).toFixed(3)}, alpha);
      }
    `,
  });
}
