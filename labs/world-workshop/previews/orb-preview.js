import * as THREE from "three";
import { createOrbModel } from "../generators/orb-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";

function createOpalescentOrbShellMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color(0xf8fbff) },
      uCyan: { value: new THREE.Color(0xbff8ff) },
      uViolet: { value: new THREE.Color(0xe8d8ff) },
      uGold: { value: new THREE.Color(0xfff1c7) },
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
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.15);
        float driftA = sin((vWorldPosition.x * 0.030) + uTime * 0.42) * 0.5 + 0.5;
        float driftB = sin((vWorldPosition.y * 0.036) - uTime * 0.31 + 1.7) * 0.5 + 0.5;
        float driftC = sin((vWorldPosition.z * 0.028) + uTime * 0.24 + 3.1) * 0.5 + 0.5;
        vec3 pastel = mix(uCyan, uViolet, driftA);
        pastel = mix(pastel, uGold, driftB * 0.34);
        vec3 pearl = mix(uBase, pastel, 0.20 + fresnel * 0.28 + driftC * 0.06);
        float alpha = 0.34 + fresnel * 0.38;
        gl_FragColor = vec4(pearl, alpha);
      }
    `,
  });
}

function createOrbCoreMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uCyan: { value: new THREE.Color(0x9beaff) },
      uViolet: { value: new THREE.Color(0xd8c6ff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uCyan;
      uniform vec3 uViolet;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float center = max(dot(normalize(vNormal), viewDir), 0.0);
        float pulse = sin(uTime * 1.2) * 0.5 + 0.5;
        vec3 color = mix(uCyan, uViolet, pulse * 0.42);
        float alpha = pow(center, 1.7) * (0.18 + pulse * 0.08);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function renderOrbPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const startedAt = performance.now();
  const animatedMaterials = [];
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
    minDistanceBo: 0.9,
    maxDistanceBo: 28,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) {
          material.uniforms.uTime.value = time;
        }
      });
    },
  });
  if (!inspector) return null;

  const shellMaterial = createOpalescentOrbShellMaterial();
  const coreMaterial = createOrbCoreMaterial();
  animatedMaterials.push(shellMaterial, coreMaterial);

  const { model, metrics } = createOrbModel({
    bo,
    shellMaterial,
    coreMaterial,
    edgeMaterials: inspector.edgeMaterials,
    edgeColor: 0xf7fbff,
  });

  const orbLight = new THREE.PointLight(0xcfefff, 1.25, bo * 4.5, 1.7);
  orbLight.position.set(0, 0, bo * 0.25);
  model.add(orbLight);

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}
