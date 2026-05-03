import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS as ORB_MATERIAL_CONFIG } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260428a";

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + (bo * 20));
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

function createFlameShellMaterial() {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:procedural_shell_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uShellAlpha: { value: 0.82 },
      uDisplace: { value: 0.16 },
      uNoiseScale: { value: 2.65 },
      uNoiseSpeed: { value: 0.72 },
      uEdgeCut: { value: 0.46 },
      uFresnelPower: { value: 2.2 },
      uCoreColor: { value: new THREE.Color(0xff2a05) },
      uHotColor: { value: new THREE.Color(0xffb000) },
      uRimColor: { value: new THREE.Color(0xfff1b5) },
      uSmokeColor: { value: new THREE.Color(0x2a0702) },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uDisplace;
      uniform float uNoiseScale;
      uniform float uNoiseSpeed;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vObjectNormal;
      varying float vFlame;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.02 + vec3(13.7, -8.9, 5.1);
          amp *= 0.5;
        }
        return value;
      }

      void main() {
        vec3 objectNormal = normalize(normal);
        float upward = objectNormal.y * 0.5 + 0.5;
        float time = uTime * uNoiseSpeed;
        vec3 flow = objectNormal * uNoiseScale;
        flow.y += time * 2.2;
        flow.xz += vec2(
          sin(time * 1.7 + objectNormal.y * 4.4),
          cos(time * 1.35 + objectNormal.x * 3.7)
        ) * 0.28;
        float flame = fbm(flow);
        float lick = smoothstep(0.18, 0.96, flame) * (0.58 + upward * 0.48);
        float pulse = 0.5 + 0.5 * sin(uTime * 5.4 + flame * 7.0 + upward * 3.1);
        float displacement = uDisplace * (0.42 + lick * 1.08 + pulse * 0.16);
        vec3 displaced = position + objectNormal * displacement * length(position);

        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
        vObjectNormal = objectNormal;
        vFlame = flame;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uShellAlpha;
      uniform float uNoiseScale;
      uniform float uNoiseSpeed;
      uniform float uEdgeCut;
      uniform float uFresnelPower;
      uniform vec3 uCoreColor;
      uniform vec3 uHotColor;
      uniform vec3 uRimColor;
      uniform vec3 uSmokeColor;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vObjectNormal;
      varying float vFlame;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.03 + vec3(9.3, -11.2, 6.7);
          amp *= 0.5;
        }
        return value;
      }

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 objectNormal = normalize(vObjectNormal);
        float upward = objectNormal.y * 0.5 + 0.5;
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);

        float time = uTime * uNoiseSpeed;
        vec3 flow = objectNormal * uNoiseScale;
        flow.y += time * 2.55;
        flow.x += sin(time * 1.9 + objectNormal.z * 5.6) * 0.35;
        flow.z += cos(time * 1.45 + objectNormal.x * 4.1) * 0.35;
        float body = fbm(flow);
        float detail = fbm(flow * 2.15 + vec3(4.1, 9.7, -2.8));
        float flame = clamp(vFlame * 0.58 + body * 0.62 + detail * 0.26, 0.0, 1.0);
        float tongues = smoothstep(uEdgeCut, 1.0, flame + upward * 0.16);
        float hot = smoothstep(0.54, 1.0, flame);
        float core = smoothstep(0.22, 0.78, flame);
        float rim = smoothstep(0.18, 0.92, fresnel);
        float flicker = 0.86 + 0.14 * sin(uTime * 11.0 + flame * 9.0 + upward * 5.0);

        vec3 color = mix(uSmokeColor, uCoreColor, core);
        color = mix(color, uHotColor, hot * 0.82);
        color += uRimColor * rim * (0.42 + hot * 0.56);
        color += uHotColor * tongues * 0.42;
        color *= 1.08 + hot * 1.35 + rim * 0.62;

        float alpha = uShellAlpha * flicker;
        alpha *= 0.10 + core * 0.26 + tongues * 0.54 + rim * 0.42;
        alpha *= smoothstep(0.02, 0.26, flame);
        alpha *= 0.72 + upward * 0.34;

        if (alpha < 0.012) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function createFlameAoe3dPreview({
  els = {},
  getOrbBaseVisualState = null,
  getOrb3dVisualSettings = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let flameShellMaterial = null;
  let orbLight = null;
  let model = null;
  let createdAt = 0;
  let activeConfig = ORB_MATERIAL_CONFIG;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    flameShellMaterial = null;
    orbLight = null;
    model = null;
  }

  function ensureScene() {
    if (inspector || !els.previewRoot) return;
    const bo = readBo();
    createdAt = performance.now();
    activeConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "flameAoe3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (flameShellMaterial && flameShellMaterial.uniforms && flameShellMaterial.uniforms.uTime) flameShellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
      },
    });
    if (!inspector) return;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);

    shellMaterial = createOpalescentOrbShellMaterial(activeConfig);
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
    model.position.set(0, 0, 0);
    flameShellMaterial = createFlameShellMaterial();
    const flameShell = new THREE.Mesh(
      new THREE.SphereGeometry(bo * 0.58, 128, 64),
      flameShellMaterial
    );
    flameShell.name = "flame_aoe3d:procedural_shell";
    flameShell.renderOrder = 12;
    model.add(flameShell);
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.render();
  }

  function apply() {
    destroyInspector();
    ensureScene();
    return {};
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.previewFlameAoe3d) els.previewFlameAoe3d.addEventListener("click", apply);
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
