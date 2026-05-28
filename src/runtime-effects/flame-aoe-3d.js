import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/flame-aoe-3d-default.js?v=20260527171041";

const FLAME_AOE_RENDER_ORDER_BASE = 120;
const WAKE_SDF_TRAIL_POINT_COUNT = 5;

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number(fallback);
  const safe = Number.isFinite(n) ? n : (Number.isFinite(f) ? f : min);
  return Math.max(min, Math.min(max, safe));
}

function clampInt(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function optionalNumber(value, min, max) {
  if (value == null || String(value).trim() === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.max(min, Math.min(max, n));
}

function rgbHex({ r = 255, g = 106, b = 24 } = {}) {
  return (clampInt(r, 0, 255, 255) << 16)
    + (clampInt(g, 0, 255, 106) << 8)
    + clampInt(b, 0, 255, 24);
}

export function normalizeFlameAoe3dRuntimeConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = FLAME_AOE_3D_PRESET_DEFAULT;
  const out = {
    durationMs: Math.round(clampNumber(source.durationMs, 200, 60000, fallback.durationMs)),
    hitRadiusBo: clampNumber(source.hitRadiusBo, 0.05, 8, fallback.hitRadiusBo ?? 4.5),
    aoeAuraDiameterBo: clampNumber(source.aoeAuraDiameterBo, 0.05, 20, fallback.aoeAuraDiameterBo ?? 9),
    aoeAuraSoftness: clampNumber(source.aoeAuraSoftness, 0.001, 0.6, fallback.aoeAuraSoftness),
    aoeAuraA: clampNumber(source.aoeAuraA, 0, 1, fallback.aoeAuraA),
    aoeAuraColor: rgbHex({
      r: source.aoeAuraR ?? fallback.aoeAuraR,
      g: source.aoeAuraG ?? fallback.aoeAuraG,
      b: source.aoeAuraB ?? fallback.aoeAuraB,
    }),
    auraAlpha: clampNumber(source.auraAlpha, 0, 2, fallback.auraAlpha),
    auraScale: clampNumber(source.auraScale, 0.5, 3, fallback.auraScale),
    auraPulse: clampNumber(source.auraPulse, 0, 0.4, fallback.auraPulse),
    auraNoiseScale: clampNumber(source.auraNoiseScale, 0.1, 16, fallback.auraNoiseScale),
    auraNoiseSpeed: clampNumber(source.auraNoiseSpeed, 0, 8, fallback.auraNoiseSpeed),
    auraFresnelPower: clampNumber(source.auraFresnelPower, 0.1, 12, fallback.auraFresnelPower),
    auraColor: rgbHex({
      r: source.auraR ?? fallback.auraR,
      g: source.auraG ?? fallback.auraG,
      b: source.auraB ?? fallback.auraB,
    }),
    wakeMeshEnabled: source.wakeMeshEnabled === false || source.wakeMeshEnabled === 0 || source.wakeMeshEnabled === "0" ? 0 : 1,
    wakeLengthBo: clampNumber(source.wakeLengthBo, 0.05, 4, fallback.wakeLengthBo),
    wakeRadiusBo: clampNumber(source.wakeRadiusBo, 0.5, 2, fallback.wakeRadiusBo),
    wakeSubdivisions: clampInt(source.wakeSubdivisions, 12, 192, fallback.wakeSubdivisions),
    wakeLeanAmount: clampNumber(source.wakeLeanAmount, 0, 100, fallback.wakeLeanAmount),
    wakeLeanLag: clampNumber(source.wakeLeanLag, 0, 100, fallback.wakeLeanLag),
    wakeLiftBo: clampNumber(source.wakeLiftBo, 0, 4, fallback.wakeLiftBo ?? 0.6),
    wakeLiftCoreRadiusBo: clampNumber(source.wakeLiftCoreRadiusBo, 0.02, 2, fallback.wakeLiftCoreRadiusBo ?? 0.25),
    wakeStretchStrength: clampNumber(source.wakeStretchStrength, 0, 4, fallback.wakeStretchStrength ?? 1),
    wakeOrbHugRadiusBo: clampNumber(source.wakeOrbHugRadiusBo, 0.01, 2, fallback.wakeOrbHugRadiusBo ?? 0.22),
    wakeEnvelopeBlendBo: clampNumber(source.wakeEnvelopeBlendBo, 0, 1, fallback.wakeEnvelopeBlendBo ?? 0.06),
    wakeDisplaceEnabled: source.wakeDisplaceEnabled === false || source.wakeDisplaceEnabled === 0 || source.wakeDisplaceEnabled === "0" ? 0 : 1,
    wakeDisplaceBo: clampNumber(source.wakeDisplaceBo, 0, 0.5, fallback.wakeDisplaceBo),
    wakeDisplaceScale: clampNumber(source.wakeDisplaceScale, 0.2, 8, fallback.wakeDisplaceScale),
    wakeDisplaceSpeed: clampNumber(source.wakeDisplaceSpeed, 0, 4, fallback.wakeDisplaceSpeed),
    wakeDisplaceSoftness: clampNumber(source.wakeDisplaceSoftness, 0, 1, fallback.wakeDisplaceSoftness),
    wakeDisplaceInfluenceBottom: clampNumber(source.wakeDisplaceInfluenceBottom, 0, 1, fallback.wakeDisplaceInfluenceBottom),
    wakeDisplaceInfluenceTop: clampNumber(source.wakeDisplaceInfluenceTop, 0, 1, fallback.wakeDisplaceInfluenceTop),
    wakeNoiseScale: clampNumber(source.wakeNoiseScale, 0.1, 16, fallback.wakeNoiseScale),
    wakeNoiseSpeed: clampNumber(source.wakeNoiseSpeed, 0, 8, fallback.wakeNoiseSpeed),
    wakeNoiseDensityBottom: clampNumber(source.wakeNoiseDensityBottom, 0, 1, fallback.wakeNoiseDensityBottom),
    wakeNoiseDensityTop: clampNumber(source.wakeNoiseDensityTop, 0, 1, fallback.wakeNoiseDensityTop),
    wakeNoiseContrast: clampNumber(source.wakeNoiseContrast, 0.02, 0.6, fallback.wakeNoiseContrast),
    wakeNoiseOctaves: clampInt(source.wakeNoiseOctaves, 1, 8, fallback.wakeNoiseOctaves),
    wakeNoiseLacunarity: clampNumber(source.wakeNoiseLacunarity, 1.1, 4, fallback.wakeNoiseLacunarity),
    wakeNoiseGain: clampNumber(source.wakeNoiseGain, 0.1, 0.9, fallback.wakeNoiseGain),
    wakeSimplexScale: clampNumber(source.wakeSimplexScale, 0.1, 16, fallback.wakeSimplexScale),
    wakeSimplexSpeed: clampNumber(source.wakeSimplexSpeed, 0, 8, fallback.wakeSimplexSpeed),
    wakeSimplexDensityBottom: clampNumber(source.wakeSimplexDensityBottom, 0, 1, fallback.wakeSimplexDensityBottom),
    wakeSimplexDensityTop: clampNumber(source.wakeSimplexDensityTop, 0, 1, fallback.wakeSimplexDensityTop),
    wakeSimplexContrast: clampNumber(source.wakeSimplexContrast, 0.02, 0.6, fallback.wakeSimplexContrast),
    wakeSimplexOctaves: clampInt(source.wakeSimplexOctaves, 1, 8, fallback.wakeSimplexOctaves),
    wakeSimplexLacunarity: clampNumber(source.wakeSimplexLacunarity, 1.1, 4, fallback.wakeSimplexLacunarity),
    wakeSimplexGain: clampNumber(source.wakeSimplexGain, 0.1, 0.9, fallback.wakeSimplexGain),
    wakeNoiseMix: clampNumber(source.wakeNoiseMix, 0, 1, fallback.wakeNoiseMix),
    wakeGraphEnabled: source.wakeGraphEnabled === false || source.wakeGraphEnabled === 0 || source.wakeGraphEnabled === "0" ? 0 : 1,
    wakeSdfEnabled: source.wakeSdfEnabled === true || source.wakeSdfEnabled === 1 || source.wakeSdfEnabled === "1" ? 1 : 0,
    wakeSdfRadiusBo: clampNumber(source.wakeSdfRadiusBo, 0.05, 4, fallback.wakeSdfRadiusBo ?? fallback.wakeRadiusBo ?? 0.5),
    wakeSdfCoreRadiusBo: clampNumber(source.wakeSdfCoreRadiusBo, 0.02, 3, fallback.wakeSdfCoreRadiusBo ?? fallback.wakeLiftCoreRadiusBo ?? 0.25),
    wakeSdfBlendBo: clampNumber(source.wakeSdfBlendBo, 0.001, 2, fallback.wakeSdfBlendBo ?? fallback.wakeOrbHugRadiusBo ?? 0.22),
    wakeSdfSoftnessBo: clampNumber(source.wakeSdfSoftnessBo, 0.001, 2, fallback.wakeSdfSoftnessBo ?? 0.16),
    wakeSdfDensity: clampNumber(source.wakeSdfDensity, 0, 1, fallback.wakeSdfDensity ?? 0.5),
    wakeSdfNoiseScale: clampNumber(source.wakeSdfNoiseScale, 0.1, 16, fallback.wakeSdfNoiseScale ?? fallback.wakeNoiseScale ?? 2.35),
    wakeSdfNoiseSpeed: clampNumber(source.wakeSdfNoiseSpeed, 0, 8, fallback.wakeSdfNoiseSpeed ?? fallback.wakeNoiseSpeed ?? 0.86),
    wakeSdfNoiseContrast: clampNumber(source.wakeSdfNoiseContrast, 0.02, 0.8, fallback.wakeSdfNoiseContrast ?? fallback.wakeNoiseContrast ?? 0.16),
  };
  for (let i = 0; i < 4; i += 1) {
    out[`wakeGraph${i}Pct`] = optionalNumber(source[`wakeGraph${i}Pct`] ?? fallback[`wakeGraph${i}Pct`], 0, 100);
    out[`wakeGraph${i}R`] = optionalNumber(source[`wakeGraph${i}R`] ?? fallback[`wakeGraph${i}R`], 0, 255);
    out[`wakeGraph${i}G`] = optionalNumber(source[`wakeGraph${i}G`] ?? fallback[`wakeGraph${i}G`], 0, 255);
    out[`wakeGraph${i}B`] = optionalNumber(source[`wakeGraph${i}B`] ?? fallback[`wakeGraph${i}B`], 0, 255);
    out[`wakeGraph${i}A`] = optionalNumber(source[`wakeGraph${i}A`] ?? fallback[`wakeGraph${i}A`], 0, 1);
    out[`wakeAlphaGradient${i}Pct`] = optionalNumber(source[`wakeAlphaGradient${i}Pct`] ?? fallback[`wakeAlphaGradient${i}Pct`], 0, 100);
    out[`wakeAlphaGradient${i}A`] = optionalNumber(source[`wakeAlphaGradient${i}A`] ?? fallback[`wakeAlphaGradient${i}A`], 0, 1);
  }
  return Object.freeze(out);
}

function smoothMaxNumber(a, b, radius) {
  const k = Math.max(0.0001, Number(radius) || 0);
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return (a * (1 - h)) + (b * h) + (k * h * (1 - h));
}

function circleRadiusAtY(y, centerY, radius) {
  const dy = y - centerY;
  const disc = (radius * radius) - (dy * dy);
  return disc > 0 ? Math.sqrt(disc) : 0;
}

function resolveWakeLiftVector(liftOffset) {
  if (liftOffset && typeof liftOffset === "object") {
    const x = Number(liftOffset.x);
    const y = Number(liftOffset.y);
    const z = Number(liftOffset.z);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return new THREE.Vector3(x, y, z);
    }
  }
  return new THREE.Vector3(0, Math.max(0, Number(liftOffset) || 0), 0);
}

function resolveWakeAxisBasis(liftVector) {
  const axis = liftVector && liftVector.lengthSq() > 0.0001
    ? liftVector.clone().normalize()
    : new THREE.Vector3(0, 1, 0);
  const helper = Math.abs(axis.y) > 0.92
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(helper, axis).normalize();
  const binormal = new THREE.Vector3().crossVectors(axis, normal).normalize();
  return { axis, normal, binormal };
}

function setWakeShellVertex(position, index, axis, normal, binormal, y, theta, radius) {
  position.setXYZ(
    index,
    (axis.x * y) + (normal.x * Math.cos(theta) * radius) + (binormal.x * Math.sin(theta) * radius),
    (axis.y * y) + (normal.y * Math.cos(theta) * radius) + (binormal.y * Math.sin(theta) * radius),
    (axis.z * y) + (normal.z * Math.cos(theta) * radius) + (binormal.z * Math.sin(theta) * radius)
  );
}

function createWakeElasticShellGeometry({
  baseRadius,
  liftOffset,
  liftRadius,
  padding,
  blendSoftness,
  radialSegments = 64,
  heightSegments = 32,
} = {}) {
  const baseR = Math.max(1, Number(baseRadius) || 1);
  const liftVector = resolveWakeLiftVector(liftOffset);
  const { axis, normal, binormal } = resolveWakeAxisBasis(liftVector);
  const liftY = Math.max(0, liftVector.length());
  const liftR = Math.max(1, Number(liftRadius) || 1);
  const shellPadding = Math.max(0, Number(padding) || 0);
  const blend = Math.max(0.001, Number(blendSoftness) || 0.001);
  const rings = Math.max(4, Math.round(heightSegments));
  const segments = Math.max(8, Math.round(radialSegments));
  const minY = Math.min(-baseR, liftY - liftR) - shellPadding;
  const maxY = Math.max(baseR, liftY + liftR) + shellPadding;
  const positions = [];
  const uvs = [];
  const wakeTail = [];
  const indices = [];
  for (let iy = 0; iy <= rings; iy += 1) {
    const v = iy / rings;
    const y = minY + ((maxY - minY) * v);
    const baseCross = circleRadiusAtY(y, 0, baseR);
    const liftCross = circleRadiusAtY(y, liftY, liftR);
    const bridgeT = liftY > 0.0001 ? Math.max(0, Math.min(1, y / liftY)) : 1;
    const bridge = y > 0 && y < liftY ? ((baseR * (1 - bridgeT)) + (liftR * bridgeT)) : 0;
    const sphereEnvelope = baseCross <= 0 && liftCross <= 0 ? 0 : smoothMaxNumber(baseCross, liftCross, blend);
    const envelope = bridge > 0 ? smoothMaxNumber(sphereEnvelope, bridge, blend) : sphereEnvelope;
    const edgeFade = Math.sin(v * Math.PI);
    const r = Math.max(0, envelope + (shellPadding * edgeFade));
    for (let ix = 0; ix <= segments; ix += 1) {
      const u = ix / segments;
      const theta = u * Math.PI * 2;
      positions.push(
        (axis.x * y) + (normal.x * Math.cos(theta) * r) + (binormal.x * Math.sin(theta) * r),
        (axis.y * y) + (normal.y * Math.cos(theta) * r) + (binormal.y * Math.sin(theta) * r),
        (axis.z * y) + (normal.z * Math.cos(theta) * r) + (binormal.z * Math.sin(theta) * r)
      );
      uvs.push(u, v);
      wakeTail.push(v);
    }
  }
  for (let iy = 0; iy < rings; iy += 1) {
    for (let ix = 0; ix < segments; ix += 1) {
      const a = iy * (segments + 1) + ix;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("aWakeTail", new THREE.Float32BufferAttribute(wakeTail, 1));
  geometry.setIndex(indices);
  geometry.userData.wakeShell = Object.freeze({ radialSegments: segments, heightSegments: rings });
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function updateWakeElasticShellGeometry(geometry, {
  baseRadius,
  liftOffset,
  liftRadius,
  padding,
  blendSoftness,
} = {}) {
  const meta = geometry && geometry.userData && geometry.userData.wakeShell;
  const position = geometry && geometry.getAttribute && geometry.getAttribute("position");
  const tailAttr = geometry && geometry.getAttribute && geometry.getAttribute("aWakeTail");
  if (!meta || !position || !tailAttr) return;
  const baseR = Math.max(1, Number(baseRadius) || 1);
  const liftVector = resolveWakeLiftVector(liftOffset);
  const { axis, normal, binormal } = resolveWakeAxisBasis(liftVector);
  const liftY = Math.max(0, liftVector.length());
  const liftR = Math.max(1, Number(liftRadius) || 1);
  const shellPadding = Math.max(0, Number(padding) || 0);
  const blend = Math.max(0.001, Number(blendSoftness) || 0.001);
  const rings = Math.max(4, Math.round(meta.heightSegments));
  const segments = Math.max(8, Math.round(meta.radialSegments));
  const minY = Math.min(-baseR, liftY - liftR) - shellPadding;
  const maxY = Math.max(baseR, liftY + liftR) + shellPadding;
  for (let iy = 0; iy <= rings; iy += 1) {
    const v = iy / rings;
    const y = minY + ((maxY - minY) * v);
    const baseCross = circleRadiusAtY(y, 0, baseR);
    const liftCross = circleRadiusAtY(y, liftY, liftR);
    const bridgeT = liftY > 0.0001 ? Math.max(0, Math.min(1, y / liftY)) : 1;
    const bridge = y > 0 && y < liftY ? ((baseR * (1 - bridgeT)) + (liftR * bridgeT)) : 0;
    const sphereEnvelope = baseCross <= 0 && liftCross <= 0 ? 0 : smoothMaxNumber(baseCross, liftCross, blend);
    const envelope = bridge > 0 ? smoothMaxNumber(sphereEnvelope, bridge, blend) : sphereEnvelope;
    const edgeFade = Math.sin(v * Math.PI);
    const r = Math.max(0, envelope + (shellPadding * edgeFade));
    for (let ix = 0; ix <= segments; ix += 1) {
      const index = iy * (segments + 1) + ix;
      const u = ix / segments;
      const theta = u * Math.PI * 2;
      setWakeShellVertex(position, index, axis, normal, binormal, y, theta, r);
      tailAttr.setX(index, v);
    }
  }
  position.needsUpdate = true;
  tailAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

function getWakeGraphStops(config) {
  const stops = [];
  for (let i = 0; i < 4; i += 1) {
    const pct = optionalNumber(config[`wakeGraph${i}Pct`], 0, 100);
    const r = optionalNumber(config[`wakeGraph${i}R`], 0, 255);
    const g = optionalNumber(config[`wakeGraph${i}G`], 0, 255);
    const b = optionalNumber(config[`wakeGraph${i}B`], 0, 255);
    const a = optionalNumber(config[`wakeGraph${i}A`], 0, 1);
    if ([pct, r, g, b, a].some((v) => v === "")) continue;
    stops.push({ pct: pct / 100, color: new THREE.Vector4(r / 255, g / 255, b / 255, a) });
  }
  stops.sort((a, b) => a.pct - b.pct);
  return stops;
}

function getWakeAlphaGradientStops(config) {
  const stops = [];
  for (let i = 0; i < 4; i += 1) {
    const pct = optionalNumber(config[`wakeAlphaGradient${i}Pct`], 0, 100);
    const alpha = optionalNumber(config[`wakeAlphaGradient${i}A`], 0, 1);
    if ([pct, alpha].some((v) => v === "")) continue;
    stops.push({ pct: pct / 100, alpha });
  }
  stops.sort((a, b) => a.pct - b.pct);
  return stops;
}

function createAoeAuraDiscMaterial(config) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:aeo_aura_disc_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(config.aoeAuraColor) },
      uAlpha: { value: config.aoeAuraA },
      uSoftness: { value: config.aoeAuraSoftness },
    },
    vertexShader: `
      precision highp float;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uColor;
      uniform float uAlpha;
      uniform float uSoftness;
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5)) * 2.0;
        float softness = clamp(uSoftness, 0.001, 0.95);
        float edge = 1.0 - smoothstep(1.0 - softness, 1.0, d);
        float alpha = edge * clamp(uAlpha, 0.0, 1.0);
        if (d > 1.0 || alpha <= 0.001) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function createAuraShellMaterial(config) {
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:aura_shell_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
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
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
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
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
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

function createWakeMaterial(config) {
  const graphStops = getWakeGraphStops(config);
  const alphaStops = getWakeAlphaGradientStops(config);
  const graphStopValues = [0, 1, 1, 1];
  const graphColors = [
    new THREE.Vector4(0, 0, 0, 0),
    new THREE.Vector4(1, 1, 1, 1),
    new THREE.Vector4(1, 1, 1, 1),
    new THREE.Vector4(1, 1, 1, 1),
  ];
  graphStops.slice(0, 4).forEach((stop, index) => {
    graphStopValues[index] = stop.pct;
    graphColors[index] = stop.color;
  });
  const alphaStopValues = [0, 1, 1, 1];
  const alphaValues = [1, 1, 1, 1];
  alphaStops.slice(0, 4).forEach((stop, index) => {
    alphaStopValues[index] = stop.pct;
    alphaValues[index] = stop.alpha;
  });
  const graphEnabled = config.wakeGraphEnabled !== 0;
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:directional_wake_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uWakeDisplaceDepth: { value: config.wakeDisplacePx },
      uWakeDisplaceScale: { value: config.wakeDisplaceScale },
      uWakeDisplaceSpeed: { value: config.wakeDisplaceSpeed },
      uWakeDisplaceSoftness: { value: config.wakeDisplaceSoftness },
      uWakeDisplaceInfluenceBottom: { value: config.wakeDisplaceInfluenceBottom },
      uWakeDisplaceInfluenceTop: { value: config.wakeDisplaceInfluenceTop },
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
      uWakeGraphEnabled: { value: graphEnabled ? 1 : 0 },
      uWakeGraphCount: { value: graphEnabled ? Math.max(0, Math.min(4, graphStops.length)) : 0 },
      uWakeGraphStops: { value: graphStopValues },
      uWakeGraphColors: { value: graphColors },
      uWakeAlphaGradientCount: { value: Math.max(0, Math.min(4, alphaStops.length)) },
      uWakeAlphaGradientStops: { value: alphaStopValues },
      uWakeAlphaGradientValues: { value: alphaValues },
      uWakeMotionOffset: { value: new THREE.Vector3() },
      uWakeCoreOffset: { value: new THREE.Vector3(0, 1, 0) },
      uWakeCoreRadius: { value: config.wakeLiftCoreRadiusPx },
      uWakeOrbRadius: { value: config.wakeOrbHugRadiusPx },
      uWakeEnvelopeBlend: { value: config.wakeEnvelopeBlendPx },
      uWakeStretchDirection: { value: new THREE.Vector3(0, 1, 0) },
      uWakeStretchStrength: { value: config.wakeStretchStrength },
    },
    vertexShader: `
      precision highp float;
      uniform float uTime;
      uniform float uWakeDisplaceDepth;
      uniform float uWakeDisplaceScale;
      uniform float uWakeDisplaceSpeed;
      uniform float uWakeDisplaceSoftness;
      uniform float uWakeDisplaceInfluenceBottom;
      uniform float uWakeDisplaceInfluenceTop;
      uniform vec3 uWakeMotionOffset;
      uniform vec3 uWakeCoreOffset;
      uniform float uWakeCoreRadius;
      uniform float uWakeOrbRadius;
      uniform float uWakeEnvelopeBlend;
      uniform vec3 uWakeStretchDirection;
      uniform float uWakeStretchStrength;
      attribute float aWakeTail;
      varying vec3 vLocalPos;
      varying float vTail;
      varying float vWakeHeight;
      float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
      float broadFbm(vec3 p) {
        float value = 0.0; float amp = 0.58; float freq = 1.0;
        for (int i = 0; i < 3; i += 1) { value += noise(p * freq) * amp; freq *= 1.82; amp *= 0.42; p += vec3(7.3, -11.9, 5.1); }
        return clamp(value, 0.0, 1.0);
      }
      float sphereRayDistance(vec3 rayDir, vec3 center, float radius) {
        float along = dot(rayDir, center);
        float disc = radius * radius - dot(center, center) + along * along;
        if (disc <= 0.0) return 0.0;
        return max(0.0, along + sqrt(disc));
      }
      float smoothMax(float a, float b, float radius) {
        float k = max(0.0001, radius);
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(a, b, h) + k * h * (1.0 - h);
      }
      void main() {
        vec3 stretchDirection = normalize(uWakeStretchDirection + vec3(0.0, 0.0001, 0.0));
        float tail = clamp(aWakeTail, 0.0, 1.0);
        vec3 local = position;
        vec2 radialPlane = local.xz;
        float radius = length(radialPlane);
        vec2 radialDir = radius > 0.0001 ? radialPlane / radius : vec2(1.0, 0.0);
        float angle = atan(radialDir.y, radialDir.x);
        float time = uTime * uWakeDisplaceSpeed * 6.28318530718;
        float verticalPhase = tail * 6.28318530718 * (1.55 / max(0.2, uWakeDisplaceScale));
        float softness = clamp(uWakeDisplaceSoftness, 0.0, 1.0);
        float bulge = sin(angle * 2.0 + verticalPhase - time) * 0.62;
        bulge += sin(angle * 3.0 - verticalPhase * 0.72 + time * 0.63 + 1.7) * mix(0.26, 0.04, softness);
        bulge += sin(angle + verticalPhase * 1.31 + time * 0.37 + 3.4) * mix(0.18, 0.03, softness);
        float blobFrequency = 1.25 / max(0.2, uWakeDisplaceScale);
        vec3 blobFlow = vec3(radialDir.x * blobFrequency, tail * 2.4 * blobFrequency - uTime * uWakeDisplaceSpeed * 0.9, radialDir.y * blobFrequency);
        blobFlow += vec3(uWakeMotionOffset.x * 0.75, uWakeMotionOffset.y * -0.45, uWakeMotionOffset.z * 0.75) * (0.35 + tail * 0.85);
        float blob = smoothstep(mix(0.40, 0.52, softness), mix(0.82, 0.68, softness), broadFbm(blobFlow)) * 2.0 - 1.0;
        float influence = mix(uWakeDisplaceInfluenceBottom, uWakeDisplaceInfluenceTop, tail);
        float mask = smoothstep(0.02, 0.14, tail) * (1.0 - smoothstep(0.94, 1.0, tail)) * sin(tail * 3.14159265359);
        local.xz += radialDir * mix(clamp(bulge, -1.0, 1.0), blob, 0.58) * uWakeDisplaceDepth * influence * mask;
        vLocalPos = local;
        vTail = tail;
        vWakeHeight = tail;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(local, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uWakeNoiseScale; uniform float uWakeNoiseSpeed; uniform float uWakeNoiseDensityBottom; uniform float uWakeNoiseDensityTop; uniform float uWakeNoiseContrast; uniform float uWakeNoiseOctaves; uniform float uWakeNoiseLacunarity; uniform float uWakeNoiseGain;
      uniform float uWakeSimplexScale; uniform float uWakeSimplexSpeed; uniform float uWakeSimplexDensityBottom; uniform float uWakeSimplexDensityTop; uniform float uWakeSimplexContrast; uniform float uWakeSimplexOctaves; uniform float uWakeSimplexLacunarity; uniform float uWakeSimplexGain; uniform float uWakeNoiseMix;
      uniform float uWakeGraphEnabled; uniform int uWakeGraphCount; uniform float uWakeGraphStops[4]; uniform vec4 uWakeGraphColors[4];
      uniform int uWakeAlphaGradientCount; uniform float uWakeAlphaGradientStops[4]; uniform float uWakeAlphaGradientValues[4];
      uniform vec3 uWakeMotionOffset;
      uniform vec3 uWakeStretchDirection;
      varying vec3 vLocalPos; varying float vTail; varying float vWakeHeight;
      float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
      float fbm(vec3 p, float octaves, float lacunarity, float gain) {
        float value = 0.0; float amp = 0.56; float freq = 1.0;
        for (int i = 0; i < 8; i += 1) { if (float(i) >= octaves) break; value += noise(p * freq) * amp; freq *= lacunarity; amp *= gain; p += vec3(17.7, -11.3, 8.9); }
        return clamp(value, 0.0, 1.0);
      }
      float ridgedFbm(vec3 p) {
        float value = 0.0; float amp = 0.58; float freq = 1.0;
        for (int i = 0; i < 8; i += 1) { if (float(i) >= uWakeNoiseOctaves) break; float ridge = 1.0 - abs(noise(p * freq) * 2.0 - 1.0); ridge *= ridge; value += ridge * amp; freq *= uWakeNoiseLacunarity * 1.04; amp *= uWakeNoiseGain * 0.92; p += vec3(-6.4, 19.1, 12.8); }
        return clamp(value, 0.0, 1.0);
      }
      float perlinMusgraveField(vec3 p) {
        float base = fbm(p, uWakeNoiseOctaves, uWakeNoiseLacunarity, uWakeNoiseGain);
        float ridge = ridgedFbm(p * 0.82 + vec3(3.4, -7.8, 2.1));
        float broad = fbm(p * 0.46 + vec3(-11.2, 4.6, 9.3), uWakeNoiseOctaves, uWakeNoiseLacunarity, uWakeNoiseGain);
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
        if (t0 > 0.0) { t0 *= t0; n += t0 * t0 * dot(simplexGrad(i), x0); }
        float t1 = 0.6 - dot(x1, x1);
        if (t1 > 0.0) { t1 *= t1; n += t1 * t1 * dot(simplexGrad(i + i1), x1); }
        float t2 = 0.6 - dot(x2, x2);
        if (t2 > 0.0) { t2 *= t2; n += t2 * t2 * dot(simplexGrad(i + i2), x2); }
        float t3 = 0.6 - dot(x3, x3);
        if (t3 > 0.0) { t3 *= t3; n += t3 * t3 * dot(simplexGrad(i + vec3(1.0)), x3); }
        return clamp(n * 32.0 * 0.5 + 0.5, 0.0, 1.0);
      }
      float simplexFbm(vec3 p) {
        float value = 0.0; float amp = 0.56; float freq = 1.0;
        for (int i = 0; i < 8; i += 1) { if (float(i) >= uWakeSimplexOctaves) break; value += simplexNoise(p * freq) * amp; freq *= uWakeSimplexLacunarity; amp *= uWakeSimplexGain; p += vec3(-13.1, 9.7, 21.4); }
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
      vec4 sampleWakeGraph(float value) {
        float t = clamp(value, 0.0, 1.0);
        if (uWakeGraphEnabled < 0.5 || uWakeGraphCount <= 0) return vec4(vec3(t), t);
        if (uWakeGraphCount == 1) return uWakeGraphColors[0];
        vec4 result = uWakeGraphColors[0];
        if (t <= uWakeGraphStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          if (i >= uWakeGraphCount - 1) break;
          float left = uWakeGraphStops[i];
          float right = max(left + 0.0001, uWakeGraphStops[i + 1]);
          result = uWakeGraphColors[i + 1];
          if (t <= right) { result = mix(uWakeGraphColors[i], uWakeGraphColors[i + 1], clamp((t - left) / (right - left), 0.0, 1.0)); break; }
        }
        return result;
      }
      float sampleWakeAlphaGradient(float value) {
        float t = clamp(value, 0.0, 1.0);
        if (uWakeAlphaGradientCount <= 0) return 1.0;
        if (uWakeAlphaGradientCount == 1) return uWakeAlphaGradientValues[0];
        float result = uWakeAlphaGradientValues[0];
        if (t <= uWakeAlphaGradientStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          if (i >= uWakeAlphaGradientCount - 1) break;
          float left = uWakeAlphaGradientStops[i];
          float right = max(left + 0.0001, uWakeAlphaGradientStops[i + 1]);
          result = uWakeAlphaGradientValues[i + 1];
          if (t <= right) { result = mix(uWakeAlphaGradientValues[i], uWakeAlphaGradientValues[i + 1], clamp((t - left) / (right - left), 0.0, 1.0)); break; }
        }
        return result;
      }
      void main() {
        vec3 surface = normalize(vLocalPos + vec3(0.0, 0.001, 0.0));
        float perlinTime = uTime * uWakeNoiseSpeed;
        float perlinFrequency = 4.25 / max(0.1, uWakeNoiseScale);
        vec3 motionFlow = vec3(0.0, length(uWakeMotionOffset) * 0.18, 0.0);
        vec3 perlinFlow = surface * perlinFrequency + vec3(0.0, (vTail * 1.35 - perlinTime * 0.42) * perlinFrequency, 0.0) + motionFlow;
        float perlinDensity = mix(uWakeNoiseDensityBottom, uWakeNoiseDensityTop, clamp(vTail, 0.0, 1.0));
        float perlin = perlinMusgraveField(perlinFlow);
        float simplexTime = uTime * uWakeSimplexSpeed;
        float simplexFrequency = 4.25 / max(0.1, uWakeSimplexScale);
        vec3 simplexFlow = surface * simplexFrequency + vec3(0.0, (vTail * 1.52 - simplexTime * 0.5) * simplexFrequency, 0.0) + motionFlow * 1.2;
        float simplexDensity = mix(uWakeSimplexDensityBottom, uWakeSimplexDensityTop, clamp(vTail, 0.0, 1.0));
        float simplex = simplexGranularField(simplexFlow);
        float noiseMix = clamp(uWakeNoiseMix, 0.0, 1.0);
        float field = mix(perlin, simplex, noiseMix);
        float density = mix(perlinDensity, simplexDensity, noiseMix);
        float contrast = mix(uWakeNoiseContrast, uWakeSimplexContrast, noiseMix);
        float blobs = colorRampMask(field, density, contrast);
        vec4 mapped = sampleWakeGraph(blobs);
        float verticalAlpha = sampleWakeAlphaGradient(vWakeHeight);
        mapped.rgb *= verticalAlpha;
        mapped.a *= verticalAlpha;
        if (mapped.a <= 0.004) discard;
        gl_FragColor = mapped;
      }
    `,
  });
}

function createWakeSdfMaterial(config) {
  const trailPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, (_, index) => {
    const t = index / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
    return new THREE.Vector2(0, (config.wakeSdfLiftPx || 1) * t);
  });
  const trailRadii = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, (_, index) => {
    const t = index / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
    return config.wakeSdfRadiusPx * (1 - t) + config.wakeSdfCoreRadiusPx * t;
  });
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:wake_sdf_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uWakeOrbRadius: { value: config.wakeSdfRadiusPx },
      uWakeCoreRadius: { value: config.wakeSdfCoreRadiusPx },
      uWakeBlend: { value: config.wakeSdfBlendPx },
      uWakeSoftness: { value: config.wakeSdfSoftnessPx },
      uWakeDensity: { value: config.wakeSdfDensity },
      uWakeNoiseScale: { value: config.wakeSdfNoiseScale },
      uWakeNoiseSpeed: { value: config.wakeSdfNoiseSpeed },
      uWakeNoiseContrast: { value: config.wakeSdfNoiseContrast },
      uWakeMotionOffset: { value: new THREE.Vector3() },
      uWakeTrailPoints: { value: trailPoints },
      uWakeTrailRadii: { value: trailRadii },
    },
    vertexShader: `
      precision highp float;
      varying vec2 vWakePos;
      varying vec2 vWakeUv;
      void main() {
        vWakePos = position.xy;
        vWakeUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      #define WAKE_POINT_COUNT ${WAKE_SDF_TRAIL_POINT_COUNT}
      uniform float uTime;
      uniform float uWakeOrbRadius;
      uniform float uWakeCoreRadius;
      uniform float uWakeBlend;
      uniform float uWakeSoftness;
      uniform float uWakeDensity;
      uniform float uWakeNoiseScale;
      uniform float uWakeNoiseSpeed;
      uniform float uWakeNoiseContrast;
      uniform vec3 uWakeMotionOffset;
      uniform vec2 uWakeTrailPoints[WAKE_POINT_COUNT];
      uniform float uWakeTrailRadii[WAKE_POINT_COUNT];
      varying vec2 vWakePos;
      varying vec2 vWakeUv;
      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.56;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.03 + vec3(7.1, -11.4, 5.8);
          amp *= 0.48;
        }
        return clamp(value, 0.0, 1.0);
      }
      float sdCircle(vec2 p, vec2 center, float radius) {
        return length(p - center) - radius;
      }
      float sdTaperedCapsule(vec2 p, vec2 a, vec2 b, float radiusA, float radiusB) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / max(0.0001, dot(ba, ba)), 0.0, 1.0);
        return length(pa - ba * h) - mix(radiusA, radiusB, h);
      }
      float smoothMin(float a, float b, float radius) {
        float k = max(0.0001, radius);
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
      void main() {
        vec2 p = vWakePos;
        float d = sdCircle(p, uWakeTrailPoints[0], uWakeTrailRadii[0] * 0.78);
        for (int i = 0; i < WAKE_POINT_COUNT - 1; i += 1) {
          float segment = sdTaperedCapsule(p, uWakeTrailPoints[i], uWakeTrailPoints[i + 1], uWakeTrailRadii[i], uWakeTrailRadii[i + 1]);
          d = smoothMin(d, segment, uWakeBlend);
        }
        for (int i = 1; i < WAKE_POINT_COUNT; i += 1) {
          float lobe = sdCircle(p, uWakeTrailPoints[i], uWakeTrailRadii[i] * mix(1.08, 0.72, float(i) / float(WAKE_POINT_COUNT - 1)));
          d = smoothMin(d, lobe, uWakeBlend * 0.72);
        }
        vec2 tip = uWakeTrailPoints[WAKE_POINT_COUNT - 1];
        float wakeHeight = max(1.0, tip.y - uWakeTrailPoints[0].y);
        float rawHeightT = (p.y - uWakeTrailPoints[0].y) / wakeHeight;
        float heightT = clamp(rawHeightT, -0.35, 1.85);
        vec3 flow = vec3(p / max(1.0, uWakeOrbRadius), heightT) * uWakeNoiseScale;
        flow.y -= uTime * uWakeNoiseSpeed;
        flow.x += uWakeMotionOffset.x * 0.85 + uWakeMotionOffset.z * 0.35;
        flow.z += length(uWakeMotionOffset.xz) * 0.5;
        float field = fbm(flow);
        float erodedDistance = d + (0.5 - field) * uWakeSoftness * 1.35;
        float body = 1.0 - smoothstep(-uWakeSoftness * 0.45, max(0.001, uWakeSoftness * 0.95), erodedDistance);
        float threshold = mix(0.72, 0.28, clamp(uWakeDensity, 0.0, 1.0));
        float flame = smoothstep(threshold - uWakeNoiseContrast, threshold + uWakeNoiseContrast, field);
        float plumeMask = smoothstep(-0.18, 0.18, rawHeightT);
        float sideFade = 1.0 - smoothstep(uWakeOrbRadius * 2.1, uWakeOrbRadius * 3.4, abs(p.x - tip.x * heightT));
        vec2 edgeDistance = min(vWakeUv, 1.0 - vWakeUv);
        float cardFade = smoothstep(0.0, 0.08, min(edgeDistance.x, edgeDistance.y));
        float alpha = body * flame * plumeMask * sideFade * cardFade;
        vec3 ember = vec3(1.0, 0.17, 0.02);
        vec3 hot = vec3(1.0, 0.78, 0.28);
        vec3 color = mix(ember, hot, smoothstep(threshold, 1.0, field));
        color *= 0.65 + body * 0.75;
        if (alpha <= 0.004) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createWakeSdfCardGeometry(width, height) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const geometry = new THREE.PlaneGeometry(safeWidth, safeHeight, 1, 1);
  geometry.userData.wakeSdfCard = Object.freeze({ width: safeWidth, height: safeHeight });
  return geometry;
}

function resolveWakeSdfCardSize(bo, config) {
  const liftPx = bo * (
    clampNumber(config && config.wakeLiftBo, 0, 4, 0.45)
    + clampNumber(config && config.wakeStretchStrength, 0, 4, 0.24)
  );
  const authoredSlackPx = bo * clampNumber(config && config.wakeLengthBo, 0, 4, 0);
  const motionSlackPx = Math.max(bo * 0.5, liftPx * 0.35, authoredSlackPx);
  const radiusPx = bo * clampNumber(config && config.wakeSdfRadiusBo, 0.05, 4, 0.42);
  const corePx = bo * clampNumber(config && config.wakeSdfCoreRadiusBo, 0.02, 3, 0.2);
  const softnessPx = bo * clampNumber(config && config.wakeSdfSoftnessBo, 0.001, 2, 0.3);
  const devEnvelopePx = bo * 8;
  const dynamicEnvelopePx = (liftPx + motionSlackPx + radiusPx + corePx + softnessPx) * 2.8;
  const fieldSizePx = Math.max(devEnvelopePx, dynamicEnvelopePx);
  return {
    width: fieldSizePx,
    height: fieldSizePx,
  };
}

export function createFlameAoe3dRuntime({
  getOrbModel = () => null,
  getOrbPosition = () => null,
  getGroundContactY = () => null,
  getBo = () => 72,
  getConfig = () => FLAME_AOE_3D_PRESET_DEFAULT,
  now = () => performance.now(),
  onNeedsFrame = () => {},
  traceMeasure = null,
} = {}) {
  let raf = 0;
  let timer = 0;
  let group = null;
  let aoeAuraDiscMaterial = null;
  let auraMaterial = null;
  let wakeMaterial = null;
  let wakeSdfMaterial = null;
  let wakeMesh = null;
  let wakeSdfMesh = null;
  let wakePivot = null;
  let activeConfig = null;
  let startedAtMs = 0;
  let lastTickMs = 0;
  let runtimeBo = 72;
  let motionInitialized = false;
  const lastPosition = new THREE.Vector3();
  const currentPosition = new THREE.Vector3();
  const orbFrameDelta = new THREE.Vector3();
  const liftCoreOffset = new THREE.Vector3(0, 1, 0);
  const targetLiftCoreOffset = new THREE.Vector3(0, 1, 0);
  const liftCoreVelocity = new THREE.Vector3();
  const stretchDirection = new THREE.Vector3(0, 1, 0);
  const shaderMotion = new THREE.Vector3();
  const springForce = new THREE.Vector3();
  const dampingForce = new THREE.Vector3();
  const wakeSdfTrailPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, () => new THREE.Vector2());
  const wakeSdfTargetPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, () => new THREE.Vector2());
  const wakeSdfTrailRadii = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, () => 1);
  let wakeGroundLift = 0;

  function measureTrace(name, fn) {
    if (typeof traceMeasure === "function") return traceMeasure(name, fn);
    return typeof fn === "function" ? fn() : undefined;
  }

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function readOrbPosition() {
    const source = typeof getOrbPosition === "function" ? getOrbPosition() : null;
    if (!source || typeof source !== "object") return null;
    const x = Number(source.x);
    const y = Number(source.y);
    const z = Number(source.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return currentPosition.set(x, y, z);
  }

  function readGroundContactY() {
    const raw = typeof getGroundContactY === "function" ? getGroundContactY() : null;
    const y = Number(raw);
    return Number.isFinite(y) ? y : null;
  }

  function resolveWakeGroundLiftTarget(position, bo) {
    if (!position) return 0;
    const groundY = readGroundContactY();
    if (!Number.isFinite(groundY)) return 0;
    const wakeRadius = bo * Math.max(0.5, clampNumber(activeConfig && activeConfig.wakeRadiusBo, 0.5, 2, 0.5));
    const wakeBottomY = position.y - wakeRadius;
    return Math.max(0, Math.min(bo * 0.08, (groundY - wakeBottomY) * 0.5));
  }

  function resetWakeSdfSpine(liftOffset, bo) {
    const liftY = Math.max(bo * 0.08, Number(liftOffset && liftOffset.y) || bo);
    for (let i = 0; i < WAKE_SDF_TRAIL_POINT_COUNT; i += 1) {
      const t = i / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
      wakeSdfTrailPoints[i].set(0, liftY * t);
      wakeSdfTargetPoints[i].copy(wakeSdfTrailPoints[i]);
    }
  }

  function updateWakeSdfSpine(bo, safeDt) {
    const uniforms = wakeSdfMaterial && wakeSdfMaterial.uniforms;
    if (!uniforms || !uniforms.uWakeTrailPoints || !uniforms.uWakeTrailRadii) return;
    const orbRadius = bo * clampNumber(activeConfig && activeConfig.wakeSdfRadiusBo, 0.05, 4, 0.42);
    const coreRadius = bo * clampNumber(activeConfig && activeConfig.wakeSdfCoreRadiusBo, 0.02, 3, 0.2);
    const lateral = liftCoreOffset.x + liftCoreOffset.z * 0.45;
    const liftY = Math.max(bo * 0.08, liftCoreOffset.y);
    const motionCurl = (orbFrameDelta.x + orbFrameDelta.z * 0.45) * 0.72;
    for (let i = 0; i < WAKE_SDF_TRAIL_POINT_COUNT; i += 1) {
      const t = i / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
      const stage = t * t;
      const curl = Math.sin(t * Math.PI) * (lateral * 0.35 + motionCurl * (0.35 + t * 0.55));
      const x = lateral * stage + curl;
      const y = liftY * t - Math.abs(lateral) * 0.08 * Math.sin(t * Math.PI);
      wakeSdfTargetPoints[i].set(x, y);
      const followRate = 26 - (t * 15);
      wakeSdfTrailPoints[i].lerp(wakeSdfTargetPoints[i], 1 - Math.exp(-safeDt * followRate));
      wakeSdfTrailRadii[i] = Math.max(1, orbRadius * (1 - t) + coreRadius * t);
    }
    wakeSdfTrailPoints[0].set(0, 0);
    const uniformPoints = uniforms.uWakeTrailPoints.value;
    const uniformRadii = uniforms.uWakeTrailRadii.value;
    for (let i = 0; i < WAKE_SDF_TRAIL_POINT_COUNT; i += 1) {
      if (uniformPoints[i]) uniformPoints[i].copy(wakeSdfTrailPoints[i]);
      uniformRadii[i] = wakeSdfTrailRadii[i];
    }
  }

  function updateWakeMotion(dtSec) {
    if (!wakeMesh && !wakeSdfMesh) return;
    const bo = Math.max(1, Number(runtimeBo) || 72);
    const safeDt = Math.max(1 / 240, Math.min(0.12, Number(dtSec) || (1 / 60)));
    const baseLift = bo * clampNumber(activeConfig && activeConfig.wakeLiftBo, 0, 4, 0.6);
    const buoyLift = bo * clampNumber(activeConfig && activeConfig.wakeStretchStrength, 0, 4, 0);
    const stiffness01 = clampNumber(activeConfig && activeConfig.wakeLeanAmount, 0, 100, 50) / 100;
    const damping01 = clampNumber(activeConfig && activeConfig.wakeLeanLag, 0, 100, 50) / 100;
    const spring = stiffness01 * stiffness01 * 220;
    const damping = damping01 * damping01 * 80;
    const lagInfluence = (1 - stiffness01) * (1 - stiffness01);
    const restLift = Math.max(bo * 0.08, baseLift + buoyLift);
    const authoredSlack = bo * clampNumber(activeConfig && activeConfig.wakeLengthBo, 0, 4, 0);
    const motionSlack = Math.max(bo * 0.5, restLift * 0.35, authoredSlack);
    const maxStretch = Math.min(bo * 8, restLift + motionSlack);
    targetLiftCoreOffset.set(0, restLift, 0);
    const position = readOrbPosition();
    if (!position) {
      // No world-space orb position is available, so fall back to pure spring lift.
    } else if (!motionInitialized) {
      lastPosition.copy(position);
      motionInitialized = true;
    } else {
      orbFrameDelta.copy(position).sub(lastPosition).clampLength(0, motionSlack);
      lastPosition.copy(position);
      liftCoreOffset.addScaledVector(orbFrameDelta, -lagInfluence);
    }
    if (stiffness01 >= 0.999) {
      liftCoreOffset.copy(targetLiftCoreOffset);
      liftCoreVelocity.set(0, 0, 0);
    }
    springForce.copy(targetLiftCoreOffset).sub(liftCoreOffset).multiplyScalar(spring);
    dampingForce.copy(liftCoreVelocity).multiplyScalar(damping);
    liftCoreVelocity.addScaledVector(springForce.sub(dampingForce), safeDt);
    liftCoreOffset.addScaledVector(liftCoreVelocity, safeDt);
    liftCoreOffset.clampLength(bo * 0.08, maxStretch);
    const groundLiftTarget = resolveWakeGroundLiftTarget(position, bo);
    const liftEaseRate = groundLiftTarget > wakeGroundLift ? 18 : 6;
    wakeGroundLift += (groundLiftTarget - wakeGroundLift) * (1 - Math.exp(-safeDt * liftEaseRate));
    if (wakeGroundLift < 0.001) wakeGroundLift = 0;
    if (wakePivot) {
      wakePivot.position.x = 0;
      wakePivot.position.y = wakeGroundLift;
      wakePivot.position.z = 0;
    }
    stretchDirection.copy(liftCoreOffset);
    if (stretchDirection.lengthSq() < 0.0001) stretchDirection.set(0, 1, 0);
    stretchDirection.normalize();
    if (wakePivot) {
      wakePivot.quaternion.identity();
    }
    if (wakeMesh && wakeMesh.geometry) {
      updateWakeElasticShellGeometry(wakeMesh.geometry, {
        baseRadius: bo * Math.max(0.5, clampNumber(activeConfig && activeConfig.wakeRadiusBo, 0.5, 2, 0.5)),
        liftOffset: liftCoreOffset,
        liftRadius: bo * clampNumber(activeConfig && activeConfig.wakeLiftCoreRadiusBo, 0.02, 2, 0.25),
        padding: bo * clampNumber(activeConfig && activeConfig.wakeEnvelopeBlendBo, 0, 1, 0.06),
        blendSoftness: bo * clampNumber(activeConfig && activeConfig.wakeOrbHugRadiusBo, 0.01, 2, 0.22),
      });
    }
    if (wakeSdfMesh && wakeSdfMaterial) updateWakeSdfSpine(bo, safeDt);
    shaderMotion.copy(liftCoreOffset).multiplyScalar(1 / bo);
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeMotionOffset) {
      wakeMaterial.uniforms.uWakeMotionOffset.value.copy(shaderMotion);
    }
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeCoreOffset) {
      wakeMaterial.uniforms.uWakeCoreOffset.value.copy(liftCoreOffset);
    }
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeCoreRadius) {
      wakeMaterial.uniforms.uWakeCoreRadius.value = bo * clampNumber(activeConfig && activeConfig.wakeLiftCoreRadiusBo, 0.02, 2, 0.25);
    }
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeOrbRadius) {
      wakeMaterial.uniforms.uWakeOrbRadius.value = bo * clampNumber(activeConfig && activeConfig.wakeOrbHugRadiusBo, 0.01, 2, 0.22);
    }
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeEnvelopeBlend) {
      wakeMaterial.uniforms.uWakeEnvelopeBlend.value = bo * clampNumber(activeConfig && activeConfig.wakeEnvelopeBlendBo, 0, 1, 0.06);
    }
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uWakeStretchDirection) {
      wakeMaterial.uniforms.uWakeStretchDirection.value.copy(stretchDirection);
    }
    if (wakeSdfMaterial && wakeSdfMaterial.uniforms) {
      if (wakeSdfMaterial.uniforms.uWakeMotionOffset) wakeSdfMaterial.uniforms.uWakeMotionOffset.value.copy(shaderMotion);
      if (wakeSdfMaterial.uniforms.uWakeOrbRadius) wakeSdfMaterial.uniforms.uWakeOrbRadius.value = bo * clampNumber(activeConfig && activeConfig.wakeSdfRadiusBo, 0.05, 4, 0.5);
      if (wakeSdfMaterial.uniforms.uWakeCoreRadius) wakeSdfMaterial.uniforms.uWakeCoreRadius.value = bo * clampNumber(activeConfig && activeConfig.wakeSdfCoreRadiusBo, 0.02, 3, 0.25);
      if (wakeSdfMaterial.uniforms.uWakeBlend) wakeSdfMaterial.uniforms.uWakeBlend.value = bo * clampNumber(activeConfig && activeConfig.wakeSdfBlendBo, 0.001, 2, 0.22);
      if (wakeSdfMaterial.uniforms.uWakeSoftness) wakeSdfMaterial.uniforms.uWakeSoftness.value = bo * clampNumber(activeConfig && activeConfig.wakeSdfSoftnessBo, 0.001, 2, 0.16);
    }
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    raf = 0;
    timer = 0;
    aoeAuraDiscMaterial = null;
    auraMaterial = null;
    wakeMaterial = null;
    wakeSdfMaterial = null;
    wakeMesh = null;
    wakeSdfMesh = null;
    wakePivot = null;
    activeConfig = null;
    lastTickMs = 0;
    motionInitialized = false;
    lastPosition.set(0, 0, 0);
    currentPosition.set(0, 0, 0);
    orbFrameDelta.set(0, 0, 0);
    liftCoreOffset.set(0, 1, 0);
    targetLiftCoreOffset.set(0, 1, 0);
    liftCoreVelocity.set(0, 0, 0);
    stretchDirection.set(0, 1, 0);
    shaderMotion.set(0, 0, 0);
    wakeSdfTrailPoints.forEach((point) => point.set(0, 0));
    wakeSdfTargetPoints.forEach((point) => point.set(0, 0));
    wakeSdfTrailRadii.fill(1);
    wakeGroundLift = 0;
    if (group && group.parent) group.parent.remove(group);
    if (group) disposeThreeObject(group);
    group = null;
    requestFrame();
  }

  function tick(nowMs = now()) {
    if (!group) {
      raf = 0;
      return;
    }
    const time = Math.max(0, (Number(nowMs) - startedAtMs) / 1000);
    const dtSec = lastTickMs > 0 ? Math.max(0, Math.min(0.12, (Number(nowMs) - lastTickMs) / 1000)) : (1 / 60);
    lastTickMs = Number(nowMs) || 0;
    if (auraMaterial && auraMaterial.uniforms && auraMaterial.uniforms.uTime) auraMaterial.uniforms.uTime.value = time;
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uTime) wakeMaterial.uniforms.uTime.value = time;
    if (wakeSdfMaterial && wakeSdfMaterial.uniforms && wakeSdfMaterial.uniforms.uTime) wakeSdfMaterial.uniforms.uTime.value = time;
    measureTrace("flameAoe3d.wakeMotion", () => updateWakeMotion(dtSec));
    requestFrame();
    raf = requestAnimationFrame(tick);
  }

  function play(payload = {}) {
    clear();
    return measureTrace("flameAoe3d.play", () => {
      const baseConfig = typeof getConfig === "function" ? (getConfig() || {}) : {};
      const config = normalizeFlameAoe3dRuntimeConfig({
        ...baseConfig,
        ...(payload && typeof payload === "object" ? payload : {}),
      });
      activeConfig = config;
      const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
      if (!orbModel) return { handled: false, skipped: "orb_model_missing" };
      const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
      runtimeBo = bo;
      startedAtMs = Number(now()) || performance.now();
      lastTickMs = startedAtMs;
      const initialPosition = readOrbPosition();
      if (initialPosition) {
        lastPosition.copy(initialPosition);
        motionInitialized = true;
      }
      liftCoreOffset.set(0, bo * (config.wakeLiftBo + config.wakeStretchStrength), 0);
      targetLiftCoreOffset.copy(liftCoreOffset);
      liftCoreVelocity.set(0, 0, 0);
      wakeGroundLift = 0;
      stretchDirection.set(0, 1, 0);
      group = new THREE.Group();
      group.name = "flame_aoe3d:runtime";
      aoeAuraDiscMaterial = createAoeAuraDiscMaterial(config);
      const aoeAuraDiameter = bo * config.aoeAuraDiameterBo;
      const aoeAuraDisc = new THREE.Mesh(
        new THREE.PlaneGeometry(aoeAuraDiameter, aoeAuraDiameter, 64, 64),
        aoeAuraDiscMaterial
      );
      aoeAuraDisc.name = "flame_aoe3d:aeo_aura_disc";
      aoeAuraDisc.position.set(0, 0, -bo * 0.08);
      aoeAuraDisc.renderOrder = FLAME_AOE_RENDER_ORDER_BASE - 4;
      auraMaterial = createAuraShellMaterial(config);
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(bo * 0.5 * config.auraScale, 96, 48),
        auraMaterial
      );
      aura.name = "flame_aoe3d:aura_shell";
      aura.renderOrder = FLAME_AOE_RENDER_ORDER_BASE;
      wakePivot = new THREE.Group();
      wakePivot.name = "flame_aoe3d:elastic_flame_shell_pivot";
      wakePivot.position.set(0, 0, 0);
      if (config.wakeMeshEnabled) {
        wakeMaterial = createWakeMaterial({
          ...config,
          wakeDisplacePx: config.wakeDisplaceEnabled ? bo * config.wakeDisplaceBo : 0,
          wakeLiftCoreRadiusPx: bo * config.wakeLiftCoreRadiusBo,
          wakeOrbHugRadiusPx: bo * config.wakeOrbHugRadiusBo,
          wakeEnvelopeBlendPx: bo * config.wakeEnvelopeBlendBo,
        });
        const wake = new THREE.Mesh(
          createWakeElasticShellGeometry({
            baseRadius: bo * Math.max(0.5, config.wakeRadiusBo),
            liftOffset: new THREE.Vector3(0, bo * (config.wakeLiftBo + config.wakeStretchStrength), 0),
            liftRadius: bo * config.wakeLiftCoreRadiusBo,
            padding: bo * config.wakeEnvelopeBlendBo,
            blendSoftness: bo * config.wakeOrbHugRadiusBo,
            radialSegments: config.wakeSubdivisions,
            heightSegments: Math.max(8, Math.round(config.wakeSubdivisions * 0.5)),
          }),
          wakeMaterial
        );
        wake.name = "flame_aoe3d:elastic_flame_shell";
        wake.renderOrder = FLAME_AOE_RENDER_ORDER_BASE + 1;
        wake.position.set(0, 0, 0);
        wakeMesh = wake;
        wakePivot.add(wake);
      }
      if (config.wakeSdfEnabled) {
        wakeSdfMaterial = createWakeSdfMaterial({
          ...config,
          wakeSdfRadiusPx: bo * config.wakeSdfRadiusBo,
          wakeSdfCoreRadiusPx: bo * config.wakeSdfCoreRadiusBo,
          wakeSdfBlendPx: bo * config.wakeSdfBlendBo,
          wakeSdfSoftnessPx: bo * config.wakeSdfSoftnessBo,
          wakeSdfLiftPx: bo * (config.wakeLiftBo + config.wakeStretchStrength),
        });
        resetWakeSdfSpine(new THREE.Vector3(0, bo * (config.wakeLiftBo + config.wakeStretchStrength), 0), bo);
        updateWakeSdfSpine(bo, 1 / 60);
        const cardSize = resolveWakeSdfCardSize(bo, config);
        const wakeSdf = new THREE.Mesh(
          createWakeSdfCardGeometry(cardSize.width, cardSize.height),
          wakeSdfMaterial
        );
        wakeSdf.name = "flame_aoe3d:wake_sdf_field";
        wakeSdf.renderOrder = FLAME_AOE_RENDER_ORDER_BASE + 2;
        wakeSdfMesh = wakeSdf;
        wakePivot.add(wakeSdf);
      }
      group.add(aoeAuraDisc);
      group.add(aura);
      group.add(wakePivot);
      orbModel.add(group);
      timer = setTimeout(clear, config.durationMs);
      raf = requestAnimationFrame(tick);
      requestFrame();
      return { handled: true };
    });
  }

  return Object.freeze({
    play,
    clear,
    destroy: clear,
    isActive() {
      return !!group || !!raf;
    },
  });
}
