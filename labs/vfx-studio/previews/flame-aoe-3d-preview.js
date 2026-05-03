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

const FLAME_AOE_3D_PREVIEW_DEFAULTS = Object.freeze({
  shellAlpha: 0.82,
  displace: 0.16,
  noiseScale: 2.65,
  noiseSpeed: 0.72,
  edgeCut: 0.46,
  fresnelPower: 2.2,
  coreColor: 0xff2a05,
  hotColor: 0xffb000,
  rimColor: 0xfff1b5,
  smokeColor: 0x2a0702,
  auraAlpha: 0.34,
  auraScale: 1.34,
  auraPulse: 0.08,
  auraNoiseScale: 1.55,
  auraNoiseSpeed: 0.24,
  auraFresnelPower: 1.35,
  auraColor: 0xff6a18,
  wakeLengthBo: 0.95,
  wakeRadiusBo: 0.5,
  wakeNoiseScale: 2.35,
  wakeNoiseSpeed: 0.86,
  wakeNoiseDensityBottom: 0.52,
  wakeNoiseDensityTop: 0.52,
  wakeNoiseContrast: 0.16,
  wakeNoiseOctaves: 5,
  wakeNoiseLacunarity: 2.08,
  wakeNoiseGain: 0.52,
  wakeSimplexScale: 0.85,
  wakeSimplexSpeed: 2.2,
  wakeSimplexDensityBottom: 0.56,
  wakeSimplexDensityTop: 0.32,
  wakeSimplexContrast: 0.18,
  wakeSimplexOctaves: 4,
  wakeSimplexLacunarity: 2.25,
  wakeSimplexGain: 0.48,
  wakeNoiseMix: 0.35,
});

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function readByte(els, key, fallback) {
  return Math.round(clampNumber(els && els[key] && els[key].value, 0, 255, fallback));
}

function rgbFromFields(els, prefix, fallback) {
  const r = readByte(els, `${prefix}R`, (fallback >> 16) & 255);
  const g = readByte(els, `${prefix}G`, (fallback >> 8) & 255);
  const b = readByte(els, `${prefix}B`, fallback & 255);
  return (r << 16) + (g << 8) + b;
}

function readFlameShellConfig(els = {}) {
  return Object.freeze({
    shellAlpha: clampNumber(els.flameAoe3dShellAlpha && els.flameAoe3dShellAlpha.value, 0, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.shellAlpha),
    displace: clampNumber(els.flameAoe3dDisplace && els.flameAoe3dDisplace.value, 0, 0.8, FLAME_AOE_3D_PREVIEW_DEFAULTS.displace),
    noiseScale: clampNumber(els.flameAoe3dNoiseScale && els.flameAoe3dNoiseScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.noiseScale),
    noiseSpeed: clampNumber(els.flameAoe3dNoiseSpeed && els.flameAoe3dNoiseSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.noiseSpeed),
    edgeCut: clampNumber(els.flameAoe3dEdgeCut && els.flameAoe3dEdgeCut.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.edgeCut),
    fresnelPower: clampNumber(els.flameAoe3dFresnelPower && els.flameAoe3dFresnelPower.value, 0.1, 12, FLAME_AOE_3D_PREVIEW_DEFAULTS.fresnelPower),
    coreColor: rgbFromFields(els, "flameAoe3dCore", FLAME_AOE_3D_PREVIEW_DEFAULTS.coreColor),
    hotColor: rgbFromFields(els, "flameAoe3dHot", FLAME_AOE_3D_PREVIEW_DEFAULTS.hotColor),
    rimColor: rgbFromFields(els, "flameAoe3dRim", FLAME_AOE_3D_PREVIEW_DEFAULTS.rimColor),
    smokeColor: rgbFromFields(els, "flameAoe3dSmoke", FLAME_AOE_3D_PREVIEW_DEFAULTS.smokeColor),
  });
}

function readFlameAuraConfig(els = {}) {
  return Object.freeze({
    auraAlpha: clampNumber(els.flameAoe3dAuraAlpha && els.flameAoe3dAuraAlpha.value, 0, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraAlpha),
    auraScale: clampNumber(els.flameAoe3dAuraScale && els.flameAoe3dAuraScale.value, 0.5, 3, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraScale),
    auraPulse: clampNumber(els.flameAoe3dAuraPulse && els.flameAoe3dAuraPulse.value, 0, 0.4, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraPulse),
    auraNoiseScale: clampNumber(els.flameAoe3dAuraNoiseScale && els.flameAoe3dAuraNoiseScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraNoiseScale),
    auraNoiseSpeed: clampNumber(els.flameAoe3dAuraNoiseSpeed && els.flameAoe3dAuraNoiseSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraNoiseSpeed),
    auraFresnelPower: clampNumber(els.flameAoe3dAuraFresnelPower && els.flameAoe3dAuraFresnelPower.value, 0.1, 12, FLAME_AOE_3D_PREVIEW_DEFAULTS.auraFresnelPower),
    auraColor: rgbFromFields(els, "flameAoe3dAura", FLAME_AOE_3D_PREVIEW_DEFAULTS.auraColor),
  });
}

function readFlameWakeConfig(els = {}) {
  return Object.freeze({
    wakeLengthBo: clampNumber(els.flameAoe3dWakeLengthBo && els.flameAoe3dWakeLengthBo.value, 0.05, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeLengthBo),
    wakeRadiusBo: clampNumber(els.flameAoe3dWakeRadiusBo && els.flameAoe3dWakeRadiusBo.value, 0.02, 2, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeRadiusBo),
    wakeNoiseScale: clampNumber(els.flameAoe3dWakeNoiseScale && els.flameAoe3dWakeNoiseScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseScale),
    wakeNoiseSpeed: clampNumber(els.flameAoe3dWakeNoiseSpeed && els.flameAoe3dWakeNoiseSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseSpeed),
    wakeNoiseDensityBottom: clampNumber(els.flameAoe3dWakeNoiseDensityBottom && els.flameAoe3dWakeNoiseDensityBottom.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseDensityBottom),
    wakeNoiseDensityTop: clampNumber(els.flameAoe3dWakeNoiseDensityTop && els.flameAoe3dWakeNoiseDensityTop.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseDensityTop),
    wakeNoiseContrast: clampNumber(els.flameAoe3dWakeNoiseContrast && els.flameAoe3dWakeNoiseContrast.value, 0.02, 0.6, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseContrast),
    wakeNoiseOctaves: Math.round(clampNumber(els.flameAoe3dWakeNoiseOctaves && els.flameAoe3dWakeNoiseOctaves.value, 1, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseOctaves)),
    wakeNoiseLacunarity: clampNumber(els.flameAoe3dWakeNoiseLacunarity && els.flameAoe3dWakeNoiseLacunarity.value, 1.1, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseLacunarity),
    wakeNoiseGain: clampNumber(els.flameAoe3dWakeNoiseGain && els.flameAoe3dWakeNoiseGain.value, 0.1, 0.9, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseGain),
    wakeSimplexScale: clampNumber(els.flameAoe3dWakeSimplexScale && els.flameAoe3dWakeSimplexScale.value, 0.1, 16, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexScale),
    wakeSimplexSpeed: clampNumber(els.flameAoe3dWakeSimplexSpeed && els.flameAoe3dWakeSimplexSpeed.value, 0, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexSpeed),
    wakeSimplexDensityBottom: clampNumber(els.flameAoe3dWakeSimplexDensityBottom && els.flameAoe3dWakeSimplexDensityBottom.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexDensityBottom),
    wakeSimplexDensityTop: clampNumber(els.flameAoe3dWakeSimplexDensityTop && els.flameAoe3dWakeSimplexDensityTop.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexDensityTop),
    wakeSimplexContrast: clampNumber(els.flameAoe3dWakeSimplexContrast && els.flameAoe3dWakeSimplexContrast.value, 0.02, 0.6, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexContrast),
    wakeSimplexOctaves: Math.round(clampNumber(els.flameAoe3dWakeSimplexOctaves && els.flameAoe3dWakeSimplexOctaves.value, 1, 8, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexOctaves)),
    wakeSimplexLacunarity: clampNumber(els.flameAoe3dWakeSimplexLacunarity && els.flameAoe3dWakeSimplexLacunarity.value, 1.1, 4, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexLacunarity),
    wakeSimplexGain: clampNumber(els.flameAoe3dWakeSimplexGain && els.flameAoe3dWakeSimplexGain.value, 0.1, 0.9, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeSimplexGain),
    wakeNoiseMix: clampNumber(els.flameAoe3dWakeNoiseMix && els.flameAoe3dWakeNoiseMix.value, 0, 1, FLAME_AOE_3D_PREVIEW_DEFAULTS.wakeNoiseMix),
  });
}

function hydrateFlameShellFields(els = {}, cfg = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  if (els.flameAoe3dShellAlpha) els.flameAoe3dShellAlpha.value = String(Number(cfg.shellAlpha).toFixed(2));
  if (els.flameAoe3dDisplace) els.flameAoe3dDisplace.value = String(Number(cfg.displace).toFixed(3));
  if (els.flameAoe3dNoiseScale) els.flameAoe3dNoiseScale.value = String(Number(cfg.noiseScale).toFixed(2));
  if (els.flameAoe3dNoiseSpeed) els.flameAoe3dNoiseSpeed.value = String(Number(cfg.noiseSpeed).toFixed(2));
  if (els.flameAoe3dEdgeCut) els.flameAoe3dEdgeCut.value = String(Number(cfg.edgeCut).toFixed(2));
  if (els.flameAoe3dFresnelPower) els.flameAoe3dFresnelPower.value = String(Number(cfg.fresnelPower).toFixed(2));
  [
    ["flameAoe3dCore", cfg.coreColor],
    ["flameAoe3dHot", cfg.hotColor],
    ["flameAoe3dRim", cfg.rimColor],
    ["flameAoe3dSmoke", cfg.smokeColor],
  ].forEach(([prefix, color]) => {
    if (els[`${prefix}R`]) els[`${prefix}R`].value = String((color >> 16) & 255);
    if (els[`${prefix}G`]) els[`${prefix}G`].value = String((color >> 8) & 255);
    if (els[`${prefix}B`]) els[`${prefix}B`].value = String(color & 255);
  });
}

function hydrateFlameAuraFields(els = {}, cfg = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  if (els.flameAoe3dAuraAlpha) els.flameAoe3dAuraAlpha.value = String(Number(cfg.auraAlpha).toFixed(2));
  if (els.flameAoe3dAuraScale) els.flameAoe3dAuraScale.value = String(Number(cfg.auraScale).toFixed(2));
  if (els.flameAoe3dAuraPulse) els.flameAoe3dAuraPulse.value = String(Number(cfg.auraPulse).toFixed(3));
  if (els.flameAoe3dAuraNoiseScale) els.flameAoe3dAuraNoiseScale.value = String(Number(cfg.auraNoiseScale).toFixed(2));
  if (els.flameAoe3dAuraNoiseSpeed) els.flameAoe3dAuraNoiseSpeed.value = String(Number(cfg.auraNoiseSpeed).toFixed(2));
  if (els.flameAoe3dAuraFresnelPower) els.flameAoe3dAuraFresnelPower.value = String(Number(cfg.auraFresnelPower).toFixed(2));
  if (els.flameAoe3dAuraR) els.flameAoe3dAuraR.value = String((cfg.auraColor >> 16) & 255);
  if (els.flameAoe3dAuraG) els.flameAoe3dAuraG.value = String((cfg.auraColor >> 8) & 255);
  if (els.flameAoe3dAuraB) els.flameAoe3dAuraB.value = String(cfg.auraColor & 255);
}

function hydrateFlameWakeFields(els = {}, cfg = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  if (els.flameAoe3dWakeLengthBo) els.flameAoe3dWakeLengthBo.value = String(Number(cfg.wakeLengthBo).toFixed(2));
  if (els.flameAoe3dWakeRadiusBo) els.flameAoe3dWakeRadiusBo.value = String(Number(cfg.wakeRadiusBo).toFixed(2));
  if (els.flameAoe3dWakeNoiseScale) els.flameAoe3dWakeNoiseScale.value = String(Number(cfg.wakeNoiseScale).toFixed(2));
  if (els.flameAoe3dWakeNoiseSpeed) els.flameAoe3dWakeNoiseSpeed.value = String(Number(cfg.wakeNoiseSpeed).toFixed(2));
  if (els.flameAoe3dWakeNoiseDensityBottom) els.flameAoe3dWakeNoiseDensityBottom.value = String(Number(cfg.wakeNoiseDensityBottom).toFixed(2));
  if (els.flameAoe3dWakeNoiseDensityTop) els.flameAoe3dWakeNoiseDensityTop.value = String(Number(cfg.wakeNoiseDensityTop).toFixed(2));
  if (els.flameAoe3dWakeNoiseContrast) els.flameAoe3dWakeNoiseContrast.value = String(Number(cfg.wakeNoiseContrast).toFixed(2));
  if (els.flameAoe3dWakeNoiseOctaves) els.flameAoe3dWakeNoiseOctaves.value = String(Math.round(Number(cfg.wakeNoiseOctaves)));
  if (els.flameAoe3dWakeNoiseLacunarity) els.flameAoe3dWakeNoiseLacunarity.value = String(Number(cfg.wakeNoiseLacunarity).toFixed(2));
  if (els.flameAoe3dWakeNoiseGain) els.flameAoe3dWakeNoiseGain.value = String(Number(cfg.wakeNoiseGain).toFixed(2));
  if (els.flameAoe3dWakeSimplexScale) els.flameAoe3dWakeSimplexScale.value = String(Number(cfg.wakeSimplexScale).toFixed(2));
  if (els.flameAoe3dWakeSimplexSpeed) els.flameAoe3dWakeSimplexSpeed.value = String(Number(cfg.wakeSimplexSpeed).toFixed(2));
  if (els.flameAoe3dWakeSimplexDensityBottom) els.flameAoe3dWakeSimplexDensityBottom.value = String(Number(cfg.wakeSimplexDensityBottom).toFixed(2));
  if (els.flameAoe3dWakeSimplexDensityTop) els.flameAoe3dWakeSimplexDensityTop.value = String(Number(cfg.wakeSimplexDensityTop).toFixed(2));
  if (els.flameAoe3dWakeSimplexContrast) els.flameAoe3dWakeSimplexContrast.value = String(Number(cfg.wakeSimplexContrast).toFixed(2));
  if (els.flameAoe3dWakeSimplexOctaves) els.flameAoe3dWakeSimplexOctaves.value = String(Math.round(Number(cfg.wakeSimplexOctaves)));
  if (els.flameAoe3dWakeSimplexLacunarity) els.flameAoe3dWakeSimplexLacunarity.value = String(Number(cfg.wakeSimplexLacunarity).toFixed(2));
  if (els.flameAoe3dWakeSimplexGain) els.flameAoe3dWakeSimplexGain.value = String(Number(cfg.wakeSimplexGain).toFixed(2));
  if (els.flameAoe3dWakeNoiseMix) els.flameAoe3dWakeNoiseMix.value = String(Number(cfg.wakeNoiseMix).toFixed(2));
}

function layerVisible(button) {
  return !button || button.getAttribute("aria-pressed") !== "false";
}

function createWakeTeardropGeometry(radius, length, radialSegments = 64, heightSegments = 32) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const stretch = Math.max(0, length - (radius * 2));

  for (let yIndex = 0; yIndex <= heightSegments; yIndex += 1) {
    const t = yIndex / heightSegments;
    const phi = Math.PI * (1 - t);
    const sphereY = Math.cos(phi) * radius;
    const upper01 = Math.max(0, sphereY / radius);
    const stretchAmount = Math.pow(upper01, 1.65) * stretch;
    const centerY = sphereY + stretchAmount;
    const profile = Math.sin(phi) * radius;
    for (let xIndex = 0; xIndex <= radialSegments; xIndex += 1) {
      const u = xIndex / radialSegments;
      const angle = u * Math.PI * 2;
      const x = Math.cos(angle) * profile;
      const z = Math.sin(angle) * profile;
      positions.push(x, centerY, z);
      normals.push(x, sphereY, z);
      uvs.push(u, t);
    }
  }

  const stride = radialSegments + 1;
  for (let yIndex = 0; yIndex < heightSegments; yIndex += 1) {
    for (let xIndex = 0; xIndex < radialSegments; xIndex += 1) {
      const a = yIndex * stride + xIndex;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createFlameShellMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:procedural_shell_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uShellAlpha: { value: config.shellAlpha },
      uDisplace: { value: config.displace },
      uNoiseScale: { value: config.noiseScale },
      uNoiseSpeed: { value: config.noiseSpeed },
      uEdgeCut: { value: config.edgeCut },
      uFresnelPower: { value: config.fresnelPower },
      uCoreColor: { value: new THREE.Color(config.coreColor) },
      uHotColor: { value: new THREE.Color(config.hotColor) },
      uRimColor: { value: new THREE.Color(config.rimColor) },
      uSmokeColor: { value: new THREE.Color(config.smokeColor) },
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
        flow.y -= time * 2.2;
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
        flow.y -= time * 2.55;
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

function createAuraShellMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:aura_shell_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAuraAlpha: { value: config.auraAlpha },
      uAuraPulse: { value: config.auraPulse },
      uAuraNoiseScale: { value: config.auraNoiseScale },
      uAuraNoiseSpeed: { value: config.auraNoiseSpeed },
      uAuraFresnelPower: { value: config.auraFresnelPower },
      uAuraColor: { value: new THREE.Color(config.auraColor) },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uAuraPulse;
      uniform float uAuraNoiseScale;
      uniform float uAuraNoiseSpeed;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vObjectNormal;
      varying float vAura;

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

      void main() {
        vec3 objectNormal = normalize(normal);
        float time = uTime * uAuraNoiseSpeed;
        vec3 flow = objectNormal * uAuraNoiseScale;
        flow.xz += vec2(sin(time * 0.9), cos(time * 0.7)) * 0.65;
        flow.y -= time * 1.4;
        float aura = noise(flow) * 0.62 + noise(flow * 2.1 + vec3(3.1, -5.2, 8.4)) * 0.38;
        float breath = sin(uTime * 2.15 + objectNormal.y * 2.7 + aura * 5.0) * 0.5 + 0.5;
        float displacement = uAuraPulse * (0.35 + aura * 0.8 + breath * 0.35);
        vec3 displaced = position + objectNormal * displacement * length(position);

        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
        vObjectNormal = objectNormal;
        vAura = aura;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uAuraAlpha;
      uniform float uAuraNoiseScale;
      uniform float uAuraNoiseSpeed;
      uniform float uAuraFresnelPower;
      uniform vec3 uAuraColor;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vObjectNormal;
      varying float vAura;

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

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 objectNormal = normalize(vObjectNormal);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uAuraFresnelPower);
        float time = uTime * uAuraNoiseSpeed;
        vec3 flow = objectNormal * uAuraNoiseScale;
        flow.x += sin(time * 1.1 + objectNormal.z * 3.4) * 0.42;
        flow.z += cos(time * 0.8 + objectNormal.x * 2.9) * 0.42;
        flow.y -= time * 1.2;
        float mist = noise(flow) * 0.58 + noise(flow * 2.35 + vec3(8.2, -4.9, 1.4)) * 0.42;
        float pulse = 0.82 + 0.18 * sin(uTime * 3.4 + mist * 7.0);
        float veil = smoothstep(0.18, 0.88, mist + fresnel * 0.22);
        float alpha = uAuraAlpha * pulse * (fresnel * 0.72 + veil * 0.18);
        vec3 color = uAuraColor * (0.72 + fresnel * 1.4 + veil * 0.38);

        if (alpha < 0.006) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createWakeMaterial(config = FLAME_AOE_3D_PREVIEW_DEFAULTS) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:directional_wake_material",
    transparent: false,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uWakeNoiseScale: { value: config.wakeNoiseScale },
      uWakeNoiseSpeed: { value: config.wakeNoiseSpeed },
      uWakeNoiseDensityBottom: { value: config.wakeNoiseDensityBottom },
      uWakeNoiseDensityTop: { value: config.wakeNoiseDensityTop },
      uWakeNoiseContrast: { value: config.wakeNoiseContrast },
      uWakeNoiseOctaves: { value: config.wakeNoiseOctaves },
      uWakeNoiseLacunarity: { value: config.wakeNoiseLacunarity },
      uWakeNoiseGain: { value: config.wakeNoiseGain },
      uWakeSimplexScale: { value: config.wakeSimplexScale },
      uWakeSimplexSpeed: { value: config.wakeSimplexSpeed },
      uWakeSimplexDensityBottom: { value: config.wakeSimplexDensityBottom },
      uWakeSimplexDensityTop: { value: config.wakeSimplexDensityTop },
      uWakeSimplexContrast: { value: config.wakeSimplexContrast },
      uWakeSimplexOctaves: { value: config.wakeSimplexOctaves },
      uWakeSimplexLacunarity: { value: config.wakeSimplexLacunarity },
      uWakeSimplexGain: { value: config.wakeSimplexGain },
      uWakeNoiseMix: { value: config.wakeNoiseMix },
    },
    vertexShader: `
      precision highp float;

      uniform float uWakeNoiseScale;
      uniform float uWakeNoiseDensityBottom;
      uniform float uWakeNoiseDensityTop;
      uniform float uWakeNoiseContrast;
      uniform float uWakeNoiseOctaves;
      uniform float uWakeNoiseLacunarity;
      uniform float uWakeNoiseGain;
      uniform float uWakeSimplexScale;
      uniform float uWakeSimplexSpeed;
      uniform float uWakeSimplexDensityBottom;
      uniform float uWakeSimplexDensityTop;
      uniform float uWakeSimplexContrast;
      uniform float uWakeSimplexOctaves;
      uniform float uWakeSimplexLacunarity;
      uniform float uWakeSimplexGain;
      uniform float uWakeNoiseMix;

      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying float vTail;

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
        float amp = 0.56;
        float freq = 1.0;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p * freq) * amp;
          freq *= 2.08;
          amp *= 0.52;
          p += vec3(17.7, -11.3, 8.9);
        }
        return clamp(value, 0.0, 1.0);
      }

      float ridgedFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.58;
        float freq = 1.0;
        for (int i = 0; i < 5; i += 1) {
          float ridge = 1.0 - abs(noise(p * freq) * 2.0 - 1.0);
          ridge *= ridge;
          value += ridge * amp;
          freq *= 2.16;
          amp *= 0.48;
          p += vec3(-6.4, 19.1, 12.8);
        }
        return clamp(value, 0.0, 1.0);
      }

      float musgraveBlobs(vec3 p) {
        float base = fbm(p);
        float ridge = ridgedFbm(p * 0.82 + vec3(3.4, -7.8, 2.1));
        float broad = fbm(p * 0.46 + vec3(-11.2, 4.6, 9.3));
        float mask = base * 0.46 + ridge * 0.34 + broad * 0.32;
        return smoothstep(0.46, 0.61, mask);
      }

      void main() {
        float tail = clamp(uv.y, 0.0, 1.0);
        vec3 local = position;

        vec4 worldPos = modelMatrix * vec4(local, 1.0);
        vWorldPos = worldPos.xyz;
        vLocalPos = local;
        vTail = tail;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uWakeNoiseScale;
      uniform float uWakeNoiseSpeed;
      uniform float uWakeNoiseDensityBottom;
      uniform float uWakeNoiseDensityTop;
      uniform float uWakeNoiseContrast;
      uniform float uWakeNoiseOctaves;
      uniform float uWakeNoiseLacunarity;
      uniform float uWakeNoiseGain;
      uniform float uWakeSimplexScale;
      uniform float uWakeSimplexSpeed;
      uniform float uWakeSimplexDensityBottom;
      uniform float uWakeSimplexDensityTop;
      uniform float uWakeSimplexContrast;
      uniform float uWakeSimplexOctaves;
      uniform float uWakeSimplexLacunarity;
      uniform float uWakeSimplexGain;
      uniform float uWakeNoiseMix;

      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying float vTail;

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
        float amp = 0.56;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeNoiseOctaves) break;
          value += noise(p * freq) * amp;
          freq *= uWakeNoiseLacunarity;
          amp *= uWakeNoiseGain;
          p += vec3(17.7, -11.3, 8.9);
        }
        return clamp(value, 0.0, 1.0);
      }

      float ridgedFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.58;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeNoiseOctaves) break;
          float ridge = 1.0 - abs(noise(p * freq) * 2.0 - 1.0);
          ridge *= ridge;
          value += ridge * amp;
          freq *= uWakeNoiseLacunarity * 1.04;
          amp *= uWakeNoiseGain * 0.92;
          p += vec3(-6.4, 19.1, 12.8);
        }
        return clamp(value, 0.0, 1.0);
      }

      float perlinMusgraveField(vec3 p) {
        float base = fbm(p);
        float ridge = ridgedFbm(p * 0.82 + vec3(3.4, -7.8, 2.1));
        float broad = fbm(p * 0.46 + vec3(-11.2, 4.6, 9.3));
        return clamp(base * 0.46 + ridge * 0.34 + broad * 0.32, 0.0, 1.0);
      }

      vec3 simplexGrad(vec3 p) {
        float z = hash31(p) * 2.0 - 1.0;
        float a = hash31(p + vec3(19.19, 7.31, 2.47)) * 6.28318530718;
        float r = sqrt(max(0.0, 1.0 - z * z));
        return vec3(r * cos(a), r * sin(a), z);
      }

      float simplexNoise(vec3 v) {
        const float F3 = 0.33333333333;
        const float G3 = 0.16666666667;
        vec3 i = floor(v + dot(v, vec3(F3)));
        vec3 x0 = v - i + dot(i, vec3(G3));
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + G3;
        vec3 x2 = x0 - i2 + 2.0 * G3;
        vec3 x3 = x0 - 1.0 + 3.0 * G3;
        float n = 0.0;
        float t0 = 0.6 - dot(x0, x0);
        if (t0 > 0.0) {
          t0 *= t0;
          n += t0 * t0 * dot(simplexGrad(i), x0);
        }
        float t1 = 0.6 - dot(x1, x1);
        if (t1 > 0.0) {
          t1 *= t1;
          n += t1 * t1 * dot(simplexGrad(i + i1), x1);
        }
        float t2 = 0.6 - dot(x2, x2);
        if (t2 > 0.0) {
          t2 *= t2;
          n += t2 * t2 * dot(simplexGrad(i + i2), x2);
        }
        float t3 = 0.6 - dot(x3, x3);
        if (t3 > 0.0) {
          t3 *= t3;
          n += t3 * t3 * dot(simplexGrad(i + vec3(1.0)), x3);
        }
        return clamp(n * 32.0 * 0.5 + 0.5, 0.0, 1.0);
      }

      float simplexFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.56;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeSimplexOctaves) break;
          value += simplexNoise(p * freq) * amp;
          freq *= uWakeSimplexLacunarity;
          amp *= uWakeSimplexGain;
          p += vec3(-13.1, 9.7, 21.4);
        }
        return clamp(value, 0.0, 1.0);
      }

      float simplexGranularField(vec3 p) {
        float fine = simplexFbm(p);
        float ridged = 1.0 - abs(simplexFbm(p * 1.34 + vec3(4.1, -8.7, 6.3)) * 2.0 - 1.0);
        return clamp(fine * 0.62 + ridged * ridged * 0.38, 0.0, 1.0);
      }

      float colorRampMask(float field, float density, float contrast) {
        float edge = clamp(contrast, 0.02, 0.6);
        float center = mix(0.72, 0.30, clamp(density, 0.0, 1.0));
        return smoothstep(center - edge * 0.5, center + edge * 0.5, field);
      }

      void main() {
        vec3 surface = normalize(vLocalPos + vec3(0.0, 0.001, 0.0));

        float perlinTime = uTime * uWakeNoiseSpeed;
        float perlinFrequency = 4.25 / max(0.1, uWakeNoiseScale);
        vec3 perlinFlow = vec3(
          surface.x * perlinFrequency,
          (vTail * 1.35 - perlinTime * 0.42) * perlinFrequency,
          surface.z * perlinFrequency
        );
        float perlinDensity = mix(uWakeNoiseDensityBottom, uWakeNoiseDensityTop, clamp(vTail, 0.0, 1.0));
        float perlin = perlinMusgraveField(perlinFlow);

        float simplexTime = uTime * uWakeSimplexSpeed;
        float simplexFrequency = 4.25 / max(0.1, uWakeSimplexScale);
        vec3 simplexFlow = vec3(
          surface.x * simplexFrequency,
          (vTail * 1.52 - simplexTime * 0.5) * simplexFrequency,
          surface.z * simplexFrequency
        );
        float simplexDensity = mix(uWakeSimplexDensityBottom, uWakeSimplexDensityTop, clamp(vTail, 0.0, 1.0));
        float simplex = simplexGranularField(simplexFlow);

        float noiseMix = clamp(uWakeNoiseMix, 0.0, 1.0);
        float field = mix(perlin, simplex, noiseMix);
        float density = mix(perlinDensity, simplexDensity, noiseMix);
        float contrast = mix(uWakeNoiseContrast, uWakeSimplexContrast, noiseMix);
        float blobs = colorRampMask(field, density, contrast);
        gl_FragColor = vec4(vec3(blobs), 1.0);
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
  let auraShellMaterial = null;
  let wakeMaterial = null;
  let orbShellMesh = null;
  let flameShellMesh = null;
  let auraShellMesh = null;
  let wakeMesh = null;
  let orbLight = null;
  let model = null;
  let createdAt = 0;
  let activeConfig = ORB_MATERIAL_CONFIG;
  let flameConfig = FLAME_AOE_3D_PREVIEW_DEFAULTS;
  let auraConfig = FLAME_AOE_3D_PREVIEW_DEFAULTS;
  let wakeConfig = FLAME_AOE_3D_PREVIEW_DEFAULTS;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    flameShellMaterial = null;
    auraShellMaterial = null;
    wakeMaterial = null;
    orbShellMesh = null;
    flameShellMesh = null;
    auraShellMesh = null;
    wakeMesh = null;
    orbLight = null;
    model = null;
  }

  function ensureScene() {
    if (inspector || !els.previewRoot) return;
    const bo = readBo();
    createdAt = performance.now();
    activeConfig = (typeof getOrb3dVisualSettings === "function" && getOrb3dVisualSettings()) || ORB_MATERIAL_CONFIG;
    flameConfig = readFlameShellConfig(els);
    auraConfig = readFlameAuraConfig(els);
    wakeConfig = readFlameWakeConfig(els);
    hydrateFlameShellFields(els, flameConfig);
    hydrateFlameAuraFields(els, auraConfig);
    hydrateFlameWakeFields(els, wakeConfig);
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
        if (auraShellMaterial && auraShellMaterial.uniforms && auraShellMaterial.uniforms.uTime) auraShellMaterial.uniforms.uTime.value = time;
        if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uTime) wakeMaterial.uniforms.uTime.value = time;
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
    orbShellMesh = model.getObjectByName("orb3d:shell") || null;
    if (orbShellMesh) orbShellMesh.visible = layerVisible(els.flameAoe3dOrbVisibleBtn);
    flameShellMaterial = createFlameShellMaterial(flameConfig);
    flameShellMesh = new THREE.Mesh(
      new THREE.SphereGeometry(bo * 0.58, 128, 64),
      flameShellMaterial
    );
    flameShellMesh.name = "flame_aoe3d:procedural_shell";
    flameShellMesh.renderOrder = 12;
    flameShellMesh.visible = layerVisible(els.flameAoe3dShellVisibleBtn);
    model.add(flameShellMesh);
    auraShellMaterial = createAuraShellMaterial(auraConfig);
    auraShellMesh = new THREE.Mesh(
      new THREE.SphereGeometry(bo * 0.5 * auraConfig.auraScale, 96, 48),
      auraShellMaterial
    );
    auraShellMesh.name = "flame_aoe3d:aura_shell";
    auraShellMesh.renderOrder = 8;
    auraShellMesh.visible = layerVisible(els.flameAoe3dAuraVisibleBtn);
    model.add(auraShellMesh);
    wakeMaterial = createWakeMaterial({ ...flameConfig, ...wakeConfig });
    wakeMesh = new THREE.Mesh(
      createWakeTeardropGeometry(bo * wakeConfig.wakeRadiusBo, bo * wakeConfig.wakeLengthBo),
      wakeMaterial
    );
    wakeMesh.position.set(0, 0, 0);
    wakeMesh.name = "flame_aoe3d:directional_wake";
    wakeMesh.renderOrder = 10;
    wakeMesh.visible = layerVisible(els.flameAoe3dWakeVisibleBtn);
    model.add(wakeMesh);
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.render();
  }

  function applyLayerVisibility() {
    if (orbShellMesh) orbShellMesh.visible = layerVisible(els.flameAoe3dOrbVisibleBtn);
    if (flameShellMesh) flameShellMesh.visible = layerVisible(els.flameAoe3dShellVisibleBtn);
    if (auraShellMesh) auraShellMesh.visible = layerVisible(els.flameAoe3dAuraVisibleBtn);
    if (wakeMesh) wakeMesh.visible = layerVisible(els.flameAoe3dWakeVisibleBtn);
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleLayer(button) {
    if (!button) return;
    const visible = layerVisible(button);
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    applyLayerVisibility();
  }

  function apply() {
    flameConfig = readFlameShellConfig(els);
    auraConfig = readFlameAuraConfig(els);
    wakeConfig = readFlameWakeConfig(els);
    hydrateFlameShellFields(els, flameConfig);
    hydrateFlameAuraFields(els, auraConfig);
    hydrateFlameWakeFields(els, wakeConfig);
    destroyInspector();
    ensureScene();
    return Object.freeze({ ...flameConfig, ...auraConfig, ...wakeConfig });
  }

  function clear() {
    destroyInspector();
  }

  function wire() {
    apply();
    if (els.previewFlameAoe3d) els.previewFlameAoe3d.addEventListener("click", apply);
    if (els.flameAoe3dOrbVisibleBtn) els.flameAoe3dOrbVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dOrbVisibleBtn));
    if (els.flameAoe3dShellVisibleBtn) els.flameAoe3dShellVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dShellVisibleBtn));
    if (els.flameAoe3dAuraVisibleBtn) els.flameAoe3dAuraVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dAuraVisibleBtn));
    if (els.flameAoe3dWakeVisibleBtn) els.flameAoe3dWakeVisibleBtn.addEventListener("click", () => toggleLayer(els.flameAoe3dWakeVisibleBtn));
    [
      els.flameAoe3dApplyShellAlphaBtn,
      els.flameAoe3dApplyDisplaceBtn,
      els.flameAoe3dApplyNoiseScaleBtn,
      els.flameAoe3dApplyNoiseSpeedBtn,
      els.flameAoe3dApplyEdgeCutBtn,
      els.flameAoe3dApplyFresnelPowerBtn,
      els.flameAoe3dApplyAuraAlphaBtn,
      els.flameAoe3dApplyAuraScaleBtn,
      els.flameAoe3dApplyAuraPulseBtn,
      els.flameAoe3dApplyAuraNoiseScaleBtn,
      els.flameAoe3dApplyAuraNoiseSpeedBtn,
      els.flameAoe3dApplyAuraFresnelPowerBtn,
      els.flameAoe3dApplyAuraColorBtn,
      els.flameAoe3dApplyWakeLengthBtn,
      els.flameAoe3dApplyWakeRadiusBtn,
      els.flameAoe3dApplyWakeNoiseScaleBtn,
      els.flameAoe3dApplyWakeNoiseSpeedBtn,
      els.flameAoe3dApplyWakeNoiseDensityBtn,
      els.flameAoe3dApplyWakeNoiseContrastBtn,
      els.flameAoe3dApplyWakeNoiseOctavesBtn,
      els.flameAoe3dApplyWakeNoiseLacunarityBtn,
      els.flameAoe3dApplyWakeNoiseGainBtn,
      els.flameAoe3dApplyWakeSimplexScaleBtn,
      els.flameAoe3dApplyWakeSimplexSpeedBtn,
      els.flameAoe3dApplyWakeSimplexDensityBtn,
      els.flameAoe3dApplyWakeSimplexContrastBtn,
      els.flameAoe3dApplyWakeSimplexOctavesBtn,
      els.flameAoe3dApplyWakeSimplexLacunarityBtn,
      els.flameAoe3dApplyWakeSimplexGainBtn,
      els.flameAoe3dApplyWakeNoiseMixBtn,
      els.flameAoe3dApplyCoreColorBtn,
      els.flameAoe3dApplyHotColorBtn,
      els.flameAoe3dApplyRimColorBtn,
      els.flameAoe3dApplySmokeColorBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
