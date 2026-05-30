import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/flame-aoe-3d-default.js?v=20260529165820";

const FLAME_AOE_RENDER_ORDER_BASE = 120;
const WAKE_SDF_TRAIL_POINT_COUNT = 5;
const WAKE_SDF_FIELD_EMITTER_COUNT = 9;
const WAKE_SDF_CONTROL_PARTICLE_COUNT = 64;
const WAKE_SDF_SOURCE_GRAPH_RADIUS = 0.82;

function createWakeSdfSourceGraph(count = 25) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : (index + 0.5) / count;
    const radius = Math.sqrt(t) * WAKE_SDF_SOURCE_GRAPH_RADIUS;
    const angle = index * goldenAngle;
    return Object.freeze([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }));
}

const WAKE_SDF_SOURCE_GRAPH = createWakeSdfSourceGraph();

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
    wakeMeshEnabled: source.wakeMeshEnabled == null
      ? (fallback.wakeMeshEnabled === false || fallback.wakeMeshEnabled === 0 || fallback.wakeMeshEnabled === "0" ? 0 : 1)
      : (source.wakeMeshEnabled === false || source.wakeMeshEnabled === 0 || source.wakeMeshEnabled === "0" ? 0 : 1),
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
    wakeSdfEnabled: source.wakeSdfEnabled == null
      ? (fallback.wakeSdfEnabled === true || fallback.wakeSdfEnabled === 1 || fallback.wakeSdfEnabled === "1" ? 1 : 0)
      : (source.wakeSdfEnabled === true || source.wakeSdfEnabled === 1 || source.wakeSdfEnabled === "1" ? 1 : 0),
    wakeSdfHeightBo: clampNumber(source.wakeSdfHeightBo, 0.1, 8, fallback.wakeSdfHeightBo ?? (fallback.wakeLiftBo ?? 0.45) + (fallback.wakeStretchStrength ?? 0.24)),
    wakeSdfParticleLifeMs: Math.round(clampNumber(source.wakeSdfParticleLifeMs, 100, 8000, fallback.wakeSdfParticleLifeMs ?? 1500)),
    wakeSdfSpawnRate: clampNumber(source.wakeSdfSpawnRate, 1, 240, fallback.wakeSdfSpawnRate ?? 43),
    wakeSdfSpawnAreaBo: clampNumber(source.wakeSdfSpawnAreaBo, 0.1, 2, fallback.wakeSdfSpawnAreaBo ?? 1),
    wakeSdfParticleRadiusBo: clampNumber(source.wakeSdfParticleRadiusBo, 0.02, 1.5, fallback.wakeSdfParticleRadiusBo ?? 0.16),
    wakeSdfLiftBias: clampNumber(source.wakeSdfLiftBias ?? source.wakeSdfUpdraftBo, -2, 4, fallback.wakeSdfLiftBias ?? fallback.wakeSdfUpdraftBo ?? 0.2),
    wakeSdfJitterBo: clampNumber(source.wakeSdfJitterBo, 0, 1, fallback.wakeSdfJitterBo ?? 0.04),
    wakeSdfHeatDecay: clampNumber(source.wakeSdfHeatDecay, 0.1, 6, fallback.wakeSdfHeatDecay ?? 1),
    wakeSdfDebugPoints: source.wakeSdfDebugPoints == null
      ? (fallback.wakeSdfDebugPoints === false || fallback.wakeSdfDebugPoints === 0 || fallback.wakeSdfDebugPoints === "0" ? 0 : 1)
      : (source.wakeSdfDebugPoints === false || source.wakeSdfDebugPoints === 0 || source.wakeSdfDebugPoints === "0" ? 0 : 1),
    wakeSdfRadiusBo: clampNumber(source.wakeSdfRadiusBo, 0.05, 4, fallback.wakeSdfRadiusBo ?? fallback.wakeRadiusBo ?? 0.5),
    wakeSdfCoreRadiusBo: clampNumber(source.wakeSdfCoreRadiusBo, 0.02, 3, fallback.wakeSdfCoreRadiusBo ?? fallback.wakeLiftCoreRadiusBo ?? 0.25),
    wakeSdfBlendBo: clampNumber(source.wakeSdfBlendBo, 0.001, 2, fallback.wakeSdfBlendBo ?? fallback.wakeOrbHugRadiusBo ?? 0.22),
    wakeSdfSoftnessBo: clampNumber(source.wakeSdfSoftnessBo, 0.001, 2, fallback.wakeSdfSoftnessBo ?? 0.16),
    wakeSdfDensity: clampNumber(source.wakeSdfDensity, 0, 1, fallback.wakeSdfDensity ?? 0.5),
    wakeSdfPerlinScale: clampNumber(source.wakeSdfPerlinScale ?? source.wakeSdfNoiseScale, 0.1, 16, fallback.wakeSdfPerlinScale ?? fallback.wakeNoiseScale ?? 2.35),
    wakeSdfPerlinSpeed: clampNumber(source.wakeSdfPerlinSpeed ?? source.wakeSdfNoiseSpeed, 0, 8, fallback.wakeSdfPerlinSpeed ?? fallback.wakeNoiseSpeed ?? 0.86),
    wakeSdfPerlinContrast: clampNumber(source.wakeSdfPerlinContrast ?? source.wakeSdfNoiseContrast, 0, 2, fallback.wakeSdfPerlinContrast ?? fallback.wakeNoiseContrast ?? 0.5),
    wakeSdfPerlinOctaves: clampInt(source.wakeSdfPerlinOctaves, 1, 8, fallback.wakeSdfPerlinOctaves ?? fallback.wakeNoiseOctaves ?? 5),
    wakeSdfPerlinLacunarity: clampNumber(source.wakeSdfPerlinLacunarity, 1.1, 4, fallback.wakeSdfPerlinLacunarity ?? fallback.wakeNoiseLacunarity ?? 2.08),
    wakeSdfPerlinGain: clampNumber(source.wakeSdfPerlinGain, 0.1, 0.9, fallback.wakeSdfPerlinGain ?? fallback.wakeNoiseGain ?? 0.52),
    wakeSdfNoiseBlackPoint: clampNumber(source.wakeSdfNoiseBlackPoint, 0, 1, fallback.wakeSdfNoiseBlackPoint ?? 0.18),
    wakeSdfNoiseWhitePoint: clampNumber(source.wakeSdfNoiseWhitePoint, 0, 1, fallback.wakeSdfNoiseWhitePoint ?? 0.86),
    wakeSdfRenderMode: clampInt(source.wakeSdfRenderMode, 0, 10, fallback.wakeSdfRenderMode ?? 0),
  };
  for (let i = 0; i < 4; i += 1) {
    out[`wakeGraph${i}Pct`] = optionalNumber(source[`wakeGraph${i}Pct`] ?? fallback[`wakeGraph${i}Pct`], 0, 100);
    out[`wakeGraph${i}R`] = optionalNumber(source[`wakeGraph${i}R`] ?? fallback[`wakeGraph${i}R`], 0, 255);
    out[`wakeGraph${i}G`] = optionalNumber(source[`wakeGraph${i}G`] ?? fallback[`wakeGraph${i}G`], 0, 255);
    out[`wakeGraph${i}B`] = optionalNumber(source[`wakeGraph${i}B`] ?? fallback[`wakeGraph${i}B`], 0, 255);
    out[`wakeGraph${i}A`] = optionalNumber(source[`wakeGraph${i}A`] ?? fallback[`wakeGraph${i}A`], 0, 1);
    out[`wakeSdfGraph${i}Pct`] = optionalNumber(source[`wakeSdfGraph${i}Pct`] ?? fallback[`wakeSdfGraph${i}Pct`], 0, 100);
    out[`wakeSdfGraph${i}R`] = optionalNumber(source[`wakeSdfGraph${i}R`] ?? fallback[`wakeSdfGraph${i}R`], 0, 255);
    out[`wakeSdfGraph${i}G`] = optionalNumber(source[`wakeSdfGraph${i}G`] ?? fallback[`wakeSdfGraph${i}G`], 0, 255);
    out[`wakeSdfGraph${i}B`] = optionalNumber(source[`wakeSdfGraph${i}B`] ?? fallback[`wakeSdfGraph${i}B`], 0, 255);
    out[`wakeSdfGraph${i}A`] = optionalNumber(source[`wakeSdfGraph${i}A`] ?? fallback[`wakeSdfGraph${i}A`], 0, 1);
    out[`wakeAlphaGradient${i}Pct`] = optionalNumber(source[`wakeAlphaGradient${i}Pct`] ?? fallback[`wakeAlphaGradient${i}Pct`], 0, 100);
    out[`wakeAlphaGradient${i}A`] = optionalNumber(source[`wakeAlphaGradient${i}A`] ?? fallback[`wakeAlphaGradient${i}A`], 0, 1);
  }
  if (out.wakeSdfEnabled) out.wakeMeshEnabled = 0;
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

function getRgbaGraphStops(config, prefix) {
  const stops = [];
  for (let i = 0; i < 4; i += 1) {
    const pct = optionalNumber(config[`${prefix}${i}Pct`], 0, 100);
    const r = optionalNumber(config[`${prefix}${i}R`], 0, 255);
    const g = optionalNumber(config[`${prefix}${i}G`], 0, 255);
    const b = optionalNumber(config[`${prefix}${i}B`], 0, 255);
    const a = optionalNumber(config[`${prefix}${i}A`], 0, 1);
    if ([pct, r, g, b, a].some((v) => v === "")) continue;
    stops.push({ pct: pct / 100, color: new THREE.Vector4(r / 255, g / 255, b / 255, a) });
  }
  stops.sort((a, b) => a.pct - b.pct);
  return stops;
}

function getWakeGraphStops(config) {
  return getRgbaGraphStops(config, "wakeGraph");
}

function getWakeSdfGraphStops(config) {
  return getRgbaGraphStops(config, "wakeSdfGraph");
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
  const graphStops = getWakeSdfGraphStops(config);
  const graphStopValues = [0, 1, 1, 1];
  const graphColors = [
    new THREE.Vector4(0, 0, 0, 0),
    new THREE.Vector4(1, 0.08, 0, 0.65),
    new THREE.Vector4(1, 0.58, 0.04, 0.9),
    new THREE.Vector4(1, 0.88, 0.42, 1),
  ];
  graphStops.slice(0, 4).forEach((stop, index) => {
    graphStopValues[index] = stop.pct;
    graphColors[index] = stop.color;
  });
  const orbRadiusPx = Math.max(1, Number(config.orbRadiusPx) || Number(config.wakeSdfRadiusPx) || 1);
  const trailPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, (_, index) => {
    const t = index / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
    return new THREE.Vector2(0, -orbRadiusPx + (config.wakeSdfLiftPx || 1) * t);
  });
  const trailRadii = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, (_, index) => {
    const t = index / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
    const hip = Math.max(0, Math.sin(Math.PI * Math.min(1, t * 1.35))) * (1 - Math.min(1, Math.max(0, (t - 0.62) / 0.38)));
    const kiteTaper = t * t * 0.24;
    return Math.max(1, (config.wakeSdfRadiusPx * (1 - t) + config.wakeSdfCoreRadiusPx * t) * (1 + hip * 0.48 - kiteTaper));
  });
  const fieldEmitters = Array.from({ length: WAKE_SDF_FIELD_EMITTER_COUNT }, (_, index) => {
    const t = Math.min(1, index / Math.max(1, WAKE_SDF_FIELD_EMITTER_COUNT - 1));
    const rootBias = index < 3 ? -0.34 + index * 0.34 : 0;
    const x = rootBias * orbRadiusPx;
    const y = index < 3 ? -orbRadiusPx * 0.66 : -orbRadiusPx + (config.wakeSdfLiftPx || 1) * t;
    const radius = index < 3 ? orbRadiusPx * 0.54 : config.wakeSdfRadiusPx * (1 - t) + config.wakeSdfCoreRadiusPx * t;
    const heat = index < 3 ? 1.0 : 0.95 - t * 0.35;
    return new THREE.Vector4(x, y, Math.max(1, radius), heat);
  });
  const controlParticles = Array.from({ length: WAKE_SDF_CONTROL_PARTICLE_COUNT }, (_, index) => {
    const source = WAKE_SDF_SOURCE_GRAPH[index % WAKE_SDF_SOURCE_GRAPH.length];
    const t = index / Math.max(1, WAKE_SDF_CONTROL_PARTICLE_COUNT - 1);
    const x = source[0] * orbRadiusPx * 0.8;
    const y = source[1] * orbRadiusPx * 0.8 + t * orbRadiusPx * 0.72;
    const particleRadiusPx = Math.max(1, Number(config.wakeSdfParticleRadiusPx) || orbRadiusPx * 0.16);
    return new THREE.Vector4(x, y, particleRadiusPx * (0.72 + (1 - t) * 0.48), 1 - t * 0.72);
  });
  const controlVelocities = Array.from({ length: WAKE_SDF_CONTROL_PARTICLE_COUNT }, () => new THREE.Vector2(0, 1));
  return new THREE.ShaderMaterial({
    name: "flame_aoe3d:wake_sdf_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOrbRadius: { value: orbRadiusPx },
      uWakeOrbRadius: { value: config.wakeSdfRadiusPx },
      uWakeCoreRadius: { value: config.wakeSdfCoreRadiusPx },
      uWakeBlend: { value: config.wakeSdfBlendPx },
      uWakeSoftness: { value: config.wakeSdfSoftnessPx },
      uWakeDensity: { value: config.wakeSdfDensity },
      uWakeSdfPerlinScale: { value: config.wakeSdfPerlinScale },
      uWakeSdfPerlinSpeed: { value: config.wakeSdfPerlinSpeed },
      uWakeSdfPerlinContrast: { value: config.wakeSdfPerlinContrast },
      uWakeSdfPerlinOctaves: { value: config.wakeSdfPerlinOctaves },
      uWakeSdfPerlinLacunarity: { value: config.wakeSdfPerlinLacunarity },
      uWakeSdfPerlinGain: { value: config.wakeSdfPerlinGain },
      uWakeSdfNoiseBlackPoint: { value: config.wakeSdfNoiseBlackPoint },
      uWakeSdfNoiseWhitePoint: { value: config.wakeSdfNoiseWhitePoint },
      uWakeSdfRenderMode: { value: config.wakeSdfRenderMode },
      uWakeSdfGraphCount: { value: Math.max(0, Math.min(4, graphStops.length)) },
      uWakeSdfGraphStops: { value: graphStopValues },
      uWakeSdfGraphColors: { value: graphColors },
      uWakeMotionOffset: { value: new THREE.Vector3() },
      uWakeTrailPoints: { value: trailPoints },
      uWakeTrailRadii: { value: trailRadii },
      uWakeFieldEmitters: { value: fieldEmitters },
      uWakeControlParticles: { value: controlParticles },
      uWakeControlVelocities: { value: controlVelocities },
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
      #define FIELD_EMITTER_COUNT ${WAKE_SDF_FIELD_EMITTER_COUNT}
      #define CONTROL_PARTICLE_COUNT ${WAKE_SDF_CONTROL_PARTICLE_COUNT}
      uniform float uTime;
      uniform float uOrbRadius;
      uniform float uWakeOrbRadius;
      uniform float uWakeCoreRadius;
      uniform float uWakeBlend;
      uniform float uWakeSoftness;
      uniform float uWakeDensity;
      uniform float uWakeSdfPerlinScale;
      uniform float uWakeSdfPerlinSpeed;
      uniform float uWakeSdfPerlinContrast;
      uniform float uWakeSdfPerlinOctaves;
      uniform float uWakeSdfPerlinLacunarity;
      uniform float uWakeSdfPerlinGain;
      uniform float uWakeSdfNoiseBlackPoint;
      uniform float uWakeSdfNoiseWhitePoint;
      uniform int uWakeSdfRenderMode;
      uniform int uWakeSdfGraphCount;
      uniform float uWakeSdfGraphStops[4];
      uniform vec4 uWakeSdfGraphColors[4];
      uniform vec3 uWakeMotionOffset;
      uniform vec2 uWakeTrailPoints[WAKE_POINT_COUNT];
      uniform float uWakeTrailRadii[WAKE_POINT_COUNT];
      uniform vec4 uWakeFieldEmitters[FIELD_EMITTER_COUNT];
      uniform vec4 uWakeControlParticles[CONTROL_PARTICLE_COUNT];
      uniform vec2 uWakeControlVelocities[CONTROL_PARTICLE_COUNT];
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
        float ampTotal = 0.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uWakeSdfPerlinOctaves) break;
          value += noise(p) * amp;
          ampTotal += amp;
          p = p * uWakeSdfPerlinLacunarity + vec3(7.1, -11.4, 5.8);
          amp *= uWakeSdfPerlinGain;
        }
        return clamp(value / max(0.0001, ampTotal), 0.0, 1.0);
      }
      float sdCircle(vec2 p, vec2 center, float radius) {
        return length(p - center) - radius;
      }
      float sdEllipse(vec2 p, vec2 center, vec2 radius) {
        vec2 safeRadius = max(radius, vec2(1.0));
        vec2 q = (p - center) / safeRadius;
        return (length(q) - 1.0) * min(safeRadius.x, safeRadius.y);
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
      vec4 sampleSdfGraph(float value) {
        float t = clamp(value, 0.0, 1.0);
        if (uWakeSdfGraphCount <= 0) return vec4(mix(vec3(0.9, 0.05, 0.0), vec3(1.0, 0.78, 0.28), t), t);
        if (uWakeSdfGraphCount == 1) return uWakeSdfGraphColors[0];
        vec4 result = uWakeSdfGraphColors[0];
        if (t <= uWakeSdfGraphStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          if (i >= uWakeSdfGraphCount - 1) break;
          float left = uWakeSdfGraphStops[i];
          float right = max(left + 0.0001, uWakeSdfGraphStops[i + 1]);
          result = uWakeSdfGraphColors[i + 1];
          if (t <= right) {
            result = mix(uWakeSdfGraphColors[i], uWakeSdfGraphColors[i + 1], clamp((t - left) / (right - left), 0.0, 1.0));
            break;
          }
        }
        return result;
      }
      void resolveSpineFrame(vec2 p, out float spineT, out float signedSide, out float spineDistance, out float spineRadius, out vec2 tangent) {
        float bestDistance = 1000000.0;
        float bestT = 0.0;
        float bestSide = 0.0;
        float bestRadius = uWakeTrailRadii[0];
        vec2 bestTangent = vec2(0.0, 1.0);
        for (int i = 0; i < WAKE_POINT_COUNT - 1; i += 1) {
          vec2 a = uWakeTrailPoints[i];
          vec2 b = uWakeTrailPoints[i + 1];
          vec2 ba = b - a;
          float h = clamp(dot(p - a, ba) / max(0.0001, dot(ba, ba)), 0.0, 1.0);
          vec2 nearest = a + ba * h;
          vec2 delta = p - nearest;
          float dist = length(delta);
          if (dist < bestDistance) {
            vec2 dir = normalize(ba + vec2(0.0, 0.0001));
            bestDistance = dist;
            bestT = (float(i) + h) / float(WAKE_POINT_COUNT - 1);
            bestSide = dir.x * delta.y - dir.y * delta.x;
            bestRadius = mix(uWakeTrailRadii[i], uWakeTrailRadii[i + 1], h);
            bestTangent = dir;
          }
        }
        spineT = bestT;
        signedSide = bestSide;
        spineDistance = bestDistance;
        spineRadius = max(1.0, bestRadius);
        tangent = bestTangent;
      }
      void sampleEmitterField(vec2 p, out float density, out float heat, out vec2 flow) {
        density = 0.0;
        heat = 0.0;
        flow = vec2(0.0, 1.0);
        float weightTotal = 0.0001;
        for (int i = 0; i < FIELD_EMITTER_COUNT; i += 1) {
          vec4 emitter = uWakeFieldEmitters[i];
          vec2 delta = p - emitter.xy;
          float radius = max(1.0, emitter.z);
          float normDist = length(delta) / radius;
          float influence = (1.0 - smoothstep(0.38, 1.38, normDist)) * max(0.0, emitter.w);
          float core = (1.0 - smoothstep(0.0, 0.72, normDist)) * max(0.0, emitter.w);
          density += influence;
          heat += core;
          vec2 dir = normalize(delta + vec2(0.0, 0.001));
          flow += vec2(-dir.y, dir.x) * influence;
          weightTotal += influence;
        }
        density = clamp(density * 0.72, 0.0, 1.65);
        heat = clamp(heat * 0.86, 0.0, 1.45);
        flow = normalize(flow / weightTotal + vec2(uWakeMotionOffset.x * 0.28, 0.82));
      }
      void main() {
        vec2 p = vWakePos;
        float density = 0.0;
        float heat = 0.0;
        vec2 particleFlowSum = vec2(0.0);
        vec2 particleWarpSum = vec2(0.0);
        float particleFlowWeight = 0.0001;
        for (int i = 0; i < CONTROL_PARTICLE_COUNT; i += 1) {
          vec4 particle = uWakeControlParticles[i];
          vec2 delta = p - particle.xy;
          float radius = max(1.0, particle.z);
          float ageHeat = max(0.0, particle.w);
          float radiusSq = radius * radius;
          float influence = ageHeat * radiusSq / (dot(delta, delta) + radiusSq);
          density += influence;
          heat += influence * ageHeat;
          particleFlowSum += uWakeControlVelocities[i] * influence;
          vec2 particleVelocity = uWakeControlVelocities[i];
          vec2 flowDir = normalize(particleVelocity + vec2(0.0, 0.001));
          vec2 sideDir = vec2(-flowDir.y, flowDir.x);
          float localSide = clamp(dot(delta / radius, sideDir), -1.0, 1.0);
          float handedness = mod(float(i), 2.0) * 2.0 - 1.0;
          float coreWarp = ageHeat * (1.0 - smoothstep(0.12, 1.08, length(delta) / radius));
          particleWarpSum += (particleVelocity * 0.82 + sideDir * localSide * handedness * 0.24) * coreWarp;
          particleFlowWeight += influence;
        }
        density = clamp(density * 0.32, 0.0, 2.0);
        heat = clamp(heat * 0.28, 0.0, 1.25);
        vec2 particleFlow = normalize(particleFlowSum / particleFlowWeight + vec2(uWakeMotionOffset.x * 0.28, 0.72));
        vec2 localParticleWarp = particleWarpSum;
        float localParticleWarpLength = length(localParticleWarp);
        if (localParticleWarpLength > 1.15) localParticleWarp *= 1.15 / localParticleWarpLength;
        float particleFlowStrength = clamp(particleFlowWeight * 0.22, 0.0, 1.0);
        float orbDistance = length(p);
        float surfaceDistance = max(0.0, orbDistance - uOrbRadius) / max(1.0, uOrbRadius);
        float surfaceBirth = 1.0 - smoothstep(0.0, 2.35, surfaceDistance);
        vec2 sourceFlow = normalize(vec2(uWakeMotionOffset.x * 1.25, 1.0));
        float flowMask = smoothstep(0.04, 0.65, density);
        float flowBlend = flowMask * smoothstep(0.18, 1.45, surfaceDistance) * 0.75;
        vec2 blendedFlow = normalize(mix(sourceFlow, particleFlow, flowBlend));
        vec3 noisePos = vec3(p / max(1.0, uOrbRadius), 0.0) * uWakeSdfPerlinScale;
        float time = uTime * uWakeSdfPerlinSpeed;
        vec2 lateral = vec2(-sourceFlow.y, sourceFlow.x) * sin(p.x / max(1.0, uOrbRadius) * 1.8 + surfaceDistance * 1.2) * 0.05;
        vec2 particleWarp = localParticleWarp * 0.72;
        noisePos.xy -= sourceFlow * (time * 0.42 + surfaceDistance * 0.08);
        noisePos.xy += particleWarp;
        noisePos.xy += lateral;
        noisePos.z = 0.37;
        float field = fbm(noisePos);
        float valueContrast = max(0.01, uWakeSdfPerlinContrast * 2.0);
        float contrastedField = clamp((field - 0.5) * valueContrast + 0.5, 0.0, 1.0);
        float threshold = mix(1.18, 0.38, clamp(uWakeDensity, 0.0, 1.0));
        float softness = max(0.025, uWakeSoftness / max(1.0, uOrbRadius) * 0.55);
        float noisyDensity = density + (field - 0.5) * 0.18;
        float sdfBody = smoothstep(threshold, threshold + softness, noisyDensity);
        float edge = smoothstep(threshold, threshold + softness * 1.4, noisyDensity) - smoothstep(threshold + softness * 1.3, threshold + softness * 2.9, noisyDensity);
        float whitePoint = max(uWakeSdfNoiseBlackPoint + 0.001, uWakeSdfNoiseWhitePoint);
        float noiseValue = clamp((contrastedField - uWakeSdfNoiseBlackPoint) / (whitePoint - uWakeSdfNoiseBlackPoint), 0.0, 1.0);
        float flame = sdfBody * mix(0.35, 1.0, noiseValue);
        float fireValue = clamp(noiseValue * 0.88 + heat * 0.04 + edge * 0.08, 0.0, 1.0);
        vec4 mapped = sampleSdfGraph(fireValue);
        float orbOcclusion = smoothstep(uOrbRadius * 0.72, uOrbRadius * 1.02, length(p));
        vec2 edgeDistance = min(vWakeUv, 1.0 - vWakeUv);
        float cardFade = smoothstep(0.0, 0.08, min(edgeDistance.x, edgeDistance.y));
        float alpha = flame * mapped.a * orbOcclusion * cardFade;
        if (uWakeSdfRenderMode == 1) {
          gl_FragColor = vec4(vec3(field), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 2) {
          gl_FragColor = vec4(vec3(noiseValue), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 3) {
          gl_FragColor = vec4(vec3(sdfBody), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 4) {
          gl_FragColor = vec4(vec3(fireValue), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 5) {
          gl_FragColor = vec4(vec3(alpha), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 6) {
          gl_FragColor = vec4(vec3(vWakeUv.x), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 7) {
          gl_FragColor = vec4(sourceFlow * 0.5 + 0.5, clamp(surfaceBirth, 0.0, 1.0), 1.0);
          return;
        }
        if (uWakeSdfRenderMode == 8) {
          gl_FragColor = vec4(vec3(noiseValue), sdfBody * cardFade);
          return;
        }
        if (uWakeSdfRenderMode == 9) {
          vec3 flowColor = vec3(particleFlow * 0.5 + 0.5, particleFlowStrength);
          gl_FragColor = vec4(flowColor, flowMask * cardFade);
          return;
        }
        if (uWakeSdfRenderMode == 10) {
          vec3 flowColor = vec3(blendedFlow * 0.5 + 0.5, flowBlend / 0.75);
          gl_FragColor = vec4(flowColor, flowMask * cardFade);
          return;
        }
        vec3 color = mapped.rgb * (0.7 + sdfBody * 0.62 + edge * 0.38);
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

let wakeSdfDebugPointTexture = null;
function getWakeSdfDebugPointTexture() {
  if (wakeSdfDebugPointTexture) return wakeSdfDebugPointTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
  gradient.addColorStop(0.0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.58, "rgba(255,255,255,1)");
  gradient.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(16, 16, 15, 0, Math.PI * 2);
  ctx.fill();
  wakeSdfDebugPointTexture = new THREE.CanvasTexture(canvas);
  wakeSdfDebugPointTexture.needsUpdate = true;
  return wakeSdfDebugPointTexture;
}

function createWakeSdfDebugVisuals(bo) {
  const group = new THREE.Group();
  group.name = "flame_aoe3d:wake_sdf_particle_debug";
  const orbRadius = bo * 0.5;
  const sourcePositions = new Float32Array(WAKE_SDF_SOURCE_GRAPH.length * 3);
  for (let i = 0; i < WAKE_SDF_SOURCE_GRAPH.length; i += 1) {
    const source = WAKE_SDF_SOURCE_GRAPH[i];
    sourcePositions[i * 3] = source[0] * orbRadius * 0.84;
    sourcePositions[i * 3 + 1] = source[1] * orbRadius * 0.84;
    sourcePositions[i * 3 + 2] = 1.5;
  }
  const sourceGeometry = new THREE.BufferGeometry();
  sourceGeometry.setAttribute("position", new THREE.BufferAttribute(sourcePositions, 3));
  const sourceMaterial = new THREE.PointsMaterial({
    color: 0x00f6ff,
    size: 3,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    map: getWakeSdfDebugPointTexture(),
    alphaTest: 0.2,
    transparent: false,
    opacity: 1,
    toneMapped: false,
  });
  const sourcePoints = new THREE.Points(sourceGeometry, sourceMaterial);
  sourcePoints.name = "flame_aoe3d:wake_sdf_source_graph_debug";
  sourcePoints.renderOrder = FLAME_AOE_RENDER_ORDER_BASE + 8;
  group.add(sourcePoints);

  const particlePositions = new Float32Array(WAKE_SDF_CONTROL_PARTICLE_COUNT * 3);
  const particleColors = new Float32Array(WAKE_SDF_CONTROL_PARTICLE_COUNT * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
  const particleMaterial = new THREE.PointsMaterial({
    size: 3.25,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    map: getWakeSdfDebugPointTexture(),
    alphaTest: 0.2,
    transparent: false,
    opacity: 1,
    toneMapped: false,
    vertexColors: true,
  });
  const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  particlePoints.name = "flame_aoe3d:wake_sdf_control_particles_debug";
  particlePoints.renderOrder = FLAME_AOE_RENDER_ORDER_BASE + 9;
  group.add(particlePoints);

  group.userData.debugBuffers = Object.freeze({
    particlePositions,
    particleColors,
    particleGeometry,
  });
  return group;
}

function resolveWakeSdfCardSize(bo, config) {
  const liftPx = bo * clampNumber(config && config.wakeSdfHeightBo, 0.1, 8, 1.15);
  const authoredSlackPx = bo * clampNumber(config && config.wakeLengthBo, 0, 4, 0);
  const motionSlackPx = Math.max(bo * 0.5, liftPx * 0.35, authoredSlackPx);
  const radiusPx = bo * clampNumber(config && config.wakeSdfRadiusBo, 0.05, 4, 0.42);
  const corePx = bo * clampNumber(config && config.wakeSdfCoreRadiusBo, 0.02, 3, 0.2);
  const softnessPx = bo * clampNumber(config && config.wakeSdfSoftnessBo, 0.001, 2, 0.3);
  const devEnvelopePx = bo * 12;
  const dynamicEnvelopePx = (liftPx + motionSlackPx + radiusPx + corePx + softnessPx) * 3.6;
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
  let wakeSdfDebugGroup = null;
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
  const wakeSdfCurrentOrigin = new THREE.Vector2();
  const wakeSdfTrailPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, () => new THREE.Vector2());
  const wakeSdfTargetPoints = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, () => new THREE.Vector2());
  const wakeSdfTrailRadii = Array.from({ length: WAKE_SDF_TRAIL_POINT_COUNT }, () => 1);
  const wakeSdfControlParticles = Array.from({ length: WAKE_SDF_CONTROL_PARTICLE_COUNT }, () => ({
    position: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    age: 0,
    life: 1,
    radius: 1,
    heat: 0,
    sourceIndex: 0,
  }));
  let wakeSdfParticleCursor = 0;
  let wakeSdfSpawnAccumulator = 0;
  let wakeSdfRandomSeed = 0x5f3759df;
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

  function nextWakeSdfRandom() {
    wakeSdfRandomSeed = (wakeSdfRandomSeed * 1664525 + 1013904223) >>> 0;
    return wakeSdfRandomSeed / 4294967296;
  }

  function resolveWakeSdfWorldOrigin() {
    return wakeSdfCurrentOrigin.set(currentPosition.x + currentPosition.z * 0.45, currentPosition.y);
  }

  function respawnWakeSdfControlParticle(index, bo, initialAge = 0) {
    const particle = wakeSdfControlParticles[index];
    if (!particle) return;
    const config = activeConfig || FLAME_AOE_3D_PRESET_DEFAULT;
    const particleLifeSec = clampNumber(config.wakeSdfParticleLifeMs, 100, 8000, 1500) / 1000;
    const spawnRadius = bo * clampNumber(config.wakeSdfSpawnAreaBo, 0.1, 2, 1) * 0.5;
    const particleRadiusBo = clampNumber(config.wakeSdfParticleRadiusBo, 0.02, 1.5, 0.16);
    const liftBias = clampNumber(config.wakeSdfLiftBias, -2, 4, 0.2);
    const jitterBo = clampNumber(config.wakeSdfJitterBo, 0, 1, 0.04);
    const sourceIndex = (wakeSdfParticleCursor + index) % WAKE_SDF_SOURCE_GRAPH.length;
    const source = WAKE_SDF_SOURCE_GRAPH[sourceIndex] || WAKE_SDF_SOURCE_GRAPH[0];
    const jitterAngle = nextWakeSdfRandom() * Math.PI * 2;
    const jitterRadius = bo * jitterBo * (0.5 + nextWakeSdfRandom());
    const jitter = new THREE.Vector2(Math.cos(jitterAngle), Math.sin(jitterAngle)).multiplyScalar(jitterRadius);
    const origin = resolveWakeSdfWorldOrigin();
    particle.position
      .set(
        (source[0] / WAKE_SDF_SOURCE_GRAPH_RADIUS) * spawnRadius,
        (source[1] / WAKE_SDF_SOURCE_GRAPH_RADIUS) * spawnRadius
      )
      .add(jitter)
      .add(origin);
    particle.velocity.set(
      (nextWakeSdfRandom() - 0.5) * bo * jitterBo * 4.5,
      bo * liftBias * (0.7 + nextWakeSdfRandom() * 0.4)
    );
    particle.life = particleLifeSec;
    particle.age = Math.min(particle.life * 0.92, Math.max(0, initialAge));
    particle.radius = bo * particleRadiusBo * (0.82 + nextWakeSdfRandom() * 0.36);
    particle.heat = 0.7 + nextWakeSdfRandom() * 0.35;
    particle.sourceIndex = sourceIndex;
  }

  function resetWakeSdfSpine(liftOffset, bo) {
    const liftY = Math.max(bo * 0.08, Number(liftOffset && liftOffset.y) || bo);
    const orbRadius = bo * 0.5;
    for (let i = 0; i < WAKE_SDF_TRAIL_POINT_COUNT; i += 1) {
      const t = i / Math.max(1, WAKE_SDF_TRAIL_POINT_COUNT - 1);
      wakeSdfTrailPoints[i].set(0, -orbRadius + liftY * t);
      wakeSdfTargetPoints[i].copy(wakeSdfTrailPoints[i]);
    }
    wakeSdfRandomSeed = 0x5f3759df;
    wakeSdfSpawnAccumulator = 0;
    const particleLifeSec = clampNumber(activeConfig && activeConfig.wakeSdfParticleLifeMs, 100, 8000, 1500) / 1000;
    for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
      const stagger = (i / WAKE_SDF_CONTROL_PARTICLE_COUNT) * particleLifeSec;
      respawnWakeSdfControlParticle(i, bo, stagger);
    }
  }

  function updateWakeSdfSpine(bo, safeDt) {
    const uniforms = wakeSdfMaterial && wakeSdfMaterial.uniforms;
    if (!uniforms || !uniforms.uWakeControlParticles || !uniforms.uWakeControlVelocities) return;
    if (wakeSdfControlParticles.every((particle) => particle.heat <= 0)) {
      for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) respawnWakeSdfControlParticle(i, bo, i * 0.02);
    }
    const uniformParticles = uniforms.uWakeControlParticles.value;
    const uniformVelocities = uniforms.uWakeControlVelocities.value;
    const spawnInterval = 1 / clampNumber(activeConfig && activeConfig.wakeSdfSpawnRate, 1, 240, 43);
    wakeSdfSpawnAccumulator += safeDt;
    let spawnCount = 0;
    while (wakeSdfSpawnAccumulator >= spawnInterval && spawnCount < 4) {
      wakeSdfSpawnAccumulator -= spawnInterval;
      wakeSdfParticleCursor = (wakeSdfParticleCursor + 1) % WAKE_SDF_CONTROL_PARTICLE_COUNT;
      respawnWakeSdfControlParticle(wakeSdfParticleCursor, bo, 0);
      spawnCount += 1;
    }
    const heatDecay = clampNumber(activeConfig && activeConfig.wakeSdfHeatDecay, 0.1, 6, 1);
    const origin = resolveWakeSdfWorldOrigin();
    for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
      const particle = wakeSdfControlParticles[i];
      particle.age += safeDt;
      if (particle.age >= particle.life) {
        respawnWakeSdfControlParticle(i, bo, 0);
      }
      particle.position.addScaledVector(particle.velocity, safeDt);
      const ageT = clampNumber(particle.age / Math.max(0.001, particle.life), 0, 1, 0);
      const heat = particle.heat * Math.pow(1 - ageT, heatDecay);
      const radius = particle.radius * (1 + ageT * 1.45);
      const localX = particle.position.x - origin.x;
      const localY = particle.position.y - origin.y;
      if (uniformParticles[i]) uniformParticles[i].set(localX, localY, radius, heat);
      if (uniformVelocities[i]) uniformVelocities[i].copy(particle.velocity).multiplyScalar(1 / Math.max(1, bo));
    }
    const debugBuffers = wakeSdfDebugGroup && wakeSdfDebugGroup.userData && wakeSdfDebugGroup.userData.debugBuffers;
    if (debugBuffers && debugBuffers.particlePositions && debugBuffers.particleColors && debugBuffers.particleGeometry) {
      for (let i = 0; i < WAKE_SDF_CONTROL_PARTICLE_COUNT; i += 1) {
        const particle = wakeSdfControlParticles[i];
        const ageT = clampNumber(particle.age / Math.max(0.001, particle.life), 0, 1, 0);
        debugBuffers.particlePositions[i * 3] = particle.position.x - origin.x;
        debugBuffers.particlePositions[i * 3 + 1] = particle.position.y - origin.y;
        debugBuffers.particlePositions[i * 3 + 2] = 2.5 + i * 0.002;
        debugBuffers.particleColors[i * 3] = ageT < 0.5 ? 1.0 : 0.05;
        debugBuffers.particleColors[i * 3 + 1] = ageT < 0.5 ? 0.0 : 1.0;
        debugBuffers.particleColors[i * 3 + 2] = 1.0;
      }
      debugBuffers.particleGeometry.attributes.position.needsUpdate = true;
      debugBuffers.particleGeometry.attributes.color.needsUpdate = true;
    }
  }

  function updateWakeMotion(dtSec) {
    if (!wakeMesh && !wakeSdfMesh) return;
    const bo = Math.max(1, Number(runtimeBo) || 72);
    const safeDt = Math.max(1 / 240, Math.min(0.12, Number(dtSec) || (1 / 60)));
    const sdfHeightBo = clampNumber(activeConfig && activeConfig.wakeSdfHeightBo, 0.1, 8, (activeConfig && activeConfig.wakeLiftBo || 0.45) + (activeConfig && activeConfig.wakeStretchStrength || 0.24));
    const baseLift = wakeSdfMesh && !wakeMesh
      ? bo * sdfHeightBo
      : bo * clampNumber(activeConfig && activeConfig.wakeLiftBo, 0, 4, 0.6);
    const buoyLift = wakeSdfMesh && !wakeMesh
      ? 0
      : bo * clampNumber(activeConfig && activeConfig.wakeStretchStrength, 0, 4, 0);
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
      if (wakeSdfMaterial.uniforms.uOrbRadius) wakeSdfMaterial.uniforms.uOrbRadius.value = bo * 0.5;
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
    wakeSdfDebugGroup = null;
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
      const initialWakeLiftBo = config.wakeSdfEnabled
        ? config.wakeSdfHeightBo
        : (config.wakeLiftBo + config.wakeStretchStrength);
      liftCoreOffset.set(0, bo * initialWakeLiftBo, 0);
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
      if (config.wakeMeshEnabled && !config.wakeSdfEnabled) {
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
          wakeSdfParticleRadiusPx: bo * config.wakeSdfParticleRadiusBo,
          wakeSdfLiftPx: bo * config.wakeSdfHeightBo,
          orbRadiusPx: bo * 0.5,
        });
        resetWakeSdfSpine(new THREE.Vector3(0, bo * config.wakeSdfHeightBo, 0), bo);
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
        if (config.wakeSdfDebugPoints) {
          wakeSdfDebugGroup = createWakeSdfDebugVisuals(bo);
          wakePivot.add(wakeSdfDebugGroup);
        }
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
