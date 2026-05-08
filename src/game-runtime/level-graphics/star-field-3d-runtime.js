import * as THREE from "three";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";
import { STAR_FIELD_3D_CONFIG } from "./star-field-3d-config.js?v=20260508a";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

function hashString(value = "") {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashToUnit(seed = "") {
  return (hashString(seed) % 1000000) / 1000000;
}

function parseHexColor(value = "#ffffff") {
  const color = new THREE.Color();
  try {
    color.set(String(value || "#ffffff"));
  } catch (_) {
    color.set(0xffffff);
  }
  return color;
}

function resolveBandConfig(depthBand = "", config = STAR_FIELD_3D_CONFIG) {
  const bands = config && config.depthBands ? config.depthBands : {};
  return bands[String(depthBand || "").trim()] || config.defaultDepthBand || STAR_FIELD_3D_CONFIG.defaultDepthBand;
}

function nearestSizeBucket(size = 1, buckets = STAR_FIELD_3D_CONFIG.sizeBucketsPx) {
  const safeBuckets = Array.isArray(buckets) && buckets.length ? buckets : [1];
  let best = Math.max(0.1, clampNumber(safeBuckets[0], 1));
  let bestDelta = Math.abs(best - size);
  for (let i = 1; i < safeBuckets.length; i += 1) {
    const candidate = Math.max(0.1, clampNumber(safeBuckets[i], best));
    const delta = Math.abs(candidate - size);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

function resolveStarZWorld(star = {}, {
  bandConfig = STAR_FIELD_3D_CONFIG.defaultDepthBand,
  bo = 72,
} = {}) {
  const authoredZBO = Number(star && star.zBO);
  if (Number.isFinite(authoredZBO)) {
    return -Math.max(0, authoredZBO) * Math.max(1, clampNumber(bo, 72));
  }
  const minZBO = Math.max(0, clampNumber(bandConfig && bandConfig.minZBO, 8));
  const maxZBO = Math.max(minZBO, clampNumber(bandConfig && bandConfig.maxZBO, minZBO));
  const t = hashToUnit(`${star.id || "star"}:z`);
  return -(minZBO + ((maxZBO - minZBO) * t)) * Math.max(1, clampNumber(bo, 72));
}

function createStarSpriteTexture({
  sizePx = STAR_FIELD_3D_CONFIG.spriteTextureSizePx,
} = {}) {
  const textureSize = Math.max(16, Math.round(clampNumber(sizePx, 64)));
  const doc = typeof globalThis !== "undefined" && globalThis.document ? globalThis.document : null;
  if (!doc || typeof doc.createElement !== "function") return null;
  const canvas = doc.createElement("canvas");
  canvas.width = textureSize;
  canvas.height = textureSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const center = textureSize * 0.5;
  const glowRadius = textureSize * 0.5;
  const coreRadius = textureSize * 0.115;
  ctx.clearRect(0, 0, textureSize, textureSize);

  const glow = ctx.createRadialGradient(center, center, 0, center, center, glowRadius);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.12, "rgba(255,255,255,0.95)");
  glow.addColorStop(0.36, "rgba(255,255,255,0.24)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center, center, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  const rayGradient = ctx.createRadialGradient(center, center, 0, center, center, glowRadius);
  rayGradient.addColorStop(0, "rgba(255,255,255,0.42)");
  rayGradient.addColorStop(0.32, "rgba(255,255,255,0.10)");
  rayGradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = rayGradient;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, textureSize * 0.035);
  ctx.beginPath();
  ctx.moveTo(center, textureSize * 0.16);
  ctx.lineTo(center, textureSize * 0.84);
  ctx.moveTo(textureSize * 0.16, center);
  ctx.lineTo(textureSize * 0.84, center);
  ctx.stroke();

  const core = ctx.createRadialGradient(center, center, 0, center, center, coreRadius * 2.4);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.5, "rgba(255,255,255,0.96)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(center, center, coreRadius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildPoints({
  name = "star_field:points",
  stars = [],
  size = 1,
  opacityScale = 1,
  zOpacityScale = 1,
  toRuntimePosition = ({ xW = 0, yW = 0, z = 0 } = {}) => ({ x: xW, y: -yW, z }),
} = {}) {
  const count = Array.isArray(stars) ? stars.length : 0;
  if (!count) return null;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const star = stars[i] || {};
    const position = toRuntimePosition({
      xW: clampNumber(star.xW, 0),
      yW: clampNumber(star.yW, 0),
      z: clampNumber(star.zWorld, 0),
    }) || {};
    const p = i * 3;
    positions[p] = clampNumber(position.x, 0);
    positions[p + 1] = clampNumber(position.y, 0);
    positions[p + 2] = clampNumber(position.z, 0);

    const color = parseHexColor(star.color);
    const opacity = clamp01(clampNumber(star.opacity, 1) * opacityScale * zOpacityScale);
    colors[p] = color.r * opacity;
    colors[p + 1] = color.g * opacity;
    colors[p + 2] = color.b * opacity;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const spriteTexture = createStarSpriteTexture();
  const material = new THREE.PointsMaterial({
    size: Math.max(0.1, clampNumber(size, 1)),
    map: spriteTexture,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    alphaTest: spriteTexture ? 0.01 : 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: false,
    toneMapped: false,
  });
  const points = new THREE.Points(geometry, material);
  points.name = name;
  points.frustumCulled = true;
  return points;
}

function addStarToBuckets(buckets, key, star) {
  const bucket = buckets.get(key) || [];
  bucket.push(star);
  buckets.set(key, bucket);
}

function buildRenderableStar(star = {}, {
  bandConfig = STAR_FIELD_3D_CONFIG.defaultDepthBand,
  bo = 72,
  config = STAR_FIELD_3D_CONFIG,
} = {}) {
  const baseSize = Math.max(0.1, clampNumber(star.radiusPx, 1) * clampNumber(bandConfig && bandConfig.sizeScale, 2.8));
  return Object.freeze({
    ...star,
    zWorld: resolveStarZWorld(star, { bandConfig, bo }),
    sizePx: nearestSizeBucket(baseSize, config.sizeBucketsPx),
  });
}

export function createStarField3dRuntime({
  group = null,
  getBo = () => 72,
  toRuntimePosition = ({ xW = 0, yW = 0, z = 0 } = {}) => ({ x: xW, y: -yW, z }),
  getConfig = () => STAR_FIELD_3D_CONFIG,
  onCountChange = () => {},
} = {}) {
  const root = group || new THREE.Group();
  root.name = root.name || "star_field:runtime_layer";
  let disposed = false;
  let starCount = 0;

  function clear() {
    while (root.children.length) {
      const child = root.children[0];
      root.remove(child);
      disposeThreeObject(child);
    }
    starCount = 0;
    if (typeof onCountChange === "function") onCountChange(0);
  }

  function load(starField = null) {
    if (disposed) return;
    clear();
    const config = getConfig() || STAR_FIELD_3D_CONFIG;
    const sourceStars = Array.isArray(starField && starField.stars) ? starField.stars : [];
    if (!sourceStars.length) return;
    const bo = Math.max(1, clampNumber(getBo(), 72));
    const buckets = new Map();
    const haloBuckets = new Map();
    for (const sourceStar of sourceStars) {
      const bandConfig = resolveBandConfig(sourceStar && sourceStar.depthBand, config);
      const star = buildRenderableStar(sourceStar, { bandConfig, bo, config });
      const opacityScale = clampNumber(bandConfig && bandConfig.opacityScale, 1);
      const key = `${star.depthBand || "default"}:${star.sizePx}:${opacityScale.toFixed(3)}`;
      addStarToBuckets(buckets, key, { ...star, opacityScale });
      if (star.isHighlight) {
        const haloSize = nearestSizeBucket(
          star.sizePx * clampNumber(config.haloSizeMultiplier, 3.2),
          config.sizeBucketsPx
        );
        const haloKey = `${star.depthBand || "default"}:halo:${haloSize}:${opacityScale.toFixed(3)}`;
        addStarToBuckets(haloBuckets, haloKey, { ...star, sizePx: haloSize, opacityScale });
      }
    }

    for (const [key, stars] of buckets.entries()) {
      const size = clampNumber(stars[0] && stars[0].sizePx, 2);
      const opacityScale = clampNumber(stars[0] && stars[0].opacityScale, 1);
      const points = buildPoints({
        name: `star_field:${key}`,
        stars,
        size,
        opacityScale,
        toRuntimePosition,
      });
      if (points) root.add(points);
    }
    for (const [key, stars] of haloBuckets.entries()) {
      const size = clampNumber(stars[0] && stars[0].sizePx, 6);
      const opacityScale = clampNumber(stars[0] && stars[0].opacityScale, 1) * clampNumber(config.haloOpacityScale, 0.38);
      const points = buildPoints({
        name: `star_field:${key}`,
        stars,
        size,
        opacityScale,
        toRuntimePosition,
      });
      if (points) root.add(points);
    }

    starCount = sourceStars.length;
    if (typeof onCountChange === "function") onCountChange(starCount);
  }

  return Object.freeze({
    group: root,
    load,
    clear,
    dispose() {
      disposed = true;
      clear();
    },
    getStarCount: () => starCount,
  });
}
