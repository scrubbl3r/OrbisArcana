import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/flame-aoe-3d-default.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
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
    wakeLengthBo: clampNumber(source.wakeLengthBo, 0.05, 4, fallback.wakeLengthBo),
    wakeRadiusBo: clampNumber(source.wakeRadiusBo, 0.02, 2, fallback.wakeRadiusBo),
    wakeSubdivisions: clampInt(source.wakeSubdivisions, 12, 192, fallback.wakeSubdivisions),
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

function createWakeTeardropGeometry(radius, length, radialSegments = 64, heightSegments = 32) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];
  const wakeHeights = [];
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
      wakeHeights.push(t);
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
  geometry.setAttribute("wakeHeight", new THREE.Float32BufferAttribute(wakeHeights, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
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

function createAuraShellMaterial(config) {
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
      varying vec3 vWorldNormal;
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
        vec3 n = normalize(normal);
        float pulse = sin(uTime * 6.2831853 * 1.35) * uAuraPulse;
        float flicker = noise((n * uAuraNoiseScale) + vec3(0.0, uTime * uAuraNoiseSpeed, 0.0)) * 0.035;
        vec3 local = position + n * (pulse + flicker);
        vWorldNormal = normalize(mat3(modelMatrix) * n);
        vAura = flicker;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(local, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uAuraAlpha;
      uniform float uAuraFresnelPower;
      uniform vec3 uAuraColor;
      varying vec3 vWorldNormal;
      varying float vAura;
      void main() {
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        float fresnel = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDir)), uAuraFresnelPower);
        float alpha = clamp((fresnel * 0.9 + vAura) * uAuraAlpha, 0.0, 1.0);
        gl_FragColor = vec4(uAuraColor, alpha);
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
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
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
    },
    vertexShader: `
      precision highp float;
      attribute float wakeHeight;
      uniform float uTime;
      uniform float uWakeDisplaceDepth;
      uniform float uWakeDisplaceScale;
      uniform float uWakeDisplaceSpeed;
      uniform float uWakeDisplaceSoftness;
      uniform float uWakeDisplaceInfluenceBottom;
      uniform float uWakeDisplaceInfluenceTop;
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
      void main() {
        float tail = clamp(uv.y, 0.0, 1.0);
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
        float blob = smoothstep(mix(0.40, 0.52, softness), mix(0.82, 0.68, softness), broadFbm(blobFlow)) * 2.0 - 1.0;
        float influence = mix(uWakeDisplaceInfluenceBottom, uWakeDisplaceInfluenceTop, tail);
        float mask = smoothstep(0.02, 0.14, tail) * (1.0 - smoothstep(0.94, 1.0, tail)) * sin(tail * 3.14159265359);
        local.xz += radialDir * mix(clamp(bulge, -1.0, 1.0), blob, 0.58) * uWakeDisplaceDepth * influence * mask;
        vLocalPos = local;
        vTail = tail;
        vWakeHeight = clamp(wakeHeight, 0.0, 1.0);
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
        float perlinFrequency = 4.25 / max(0.1, uWakeNoiseScale);
        vec3 perlinFlow = vec3(surface.x * perlinFrequency, (vTail * 1.35 - uTime * uWakeNoiseSpeed * 0.42) * perlinFrequency, surface.z * perlinFrequency);
        float perlin = fbm(perlinFlow, uWakeNoiseOctaves, uWakeNoiseLacunarity, uWakeNoiseGain);
        float simplexFrequency = 4.25 / max(0.1, uWakeSimplexScale);
        vec3 simplexFlow = vec3(surface.x * simplexFrequency, (vTail * 1.52 - uTime * uWakeSimplexSpeed * 0.5) * simplexFrequency, surface.z * simplexFrequency);
        float simplex = fbm(simplexFlow + vec3(4.1, -8.7, 6.3), uWakeSimplexOctaves, uWakeSimplexLacunarity, uWakeSimplexGain);
        float noiseMix = clamp(uWakeNoiseMix, 0.0, 1.0);
        float field = mix(perlin, simplex, noiseMix);
        float density = mix(mix(uWakeNoiseDensityBottom, uWakeNoiseDensityTop, vTail), mix(uWakeSimplexDensityBottom, uWakeSimplexDensityTop, vTail), noiseMix);
        float contrast = mix(uWakeNoiseContrast, uWakeSimplexContrast, noiseMix);
        vec4 mapped = sampleWakeGraph(colorRampMask(field, density, contrast));
        float verticalAlpha = sampleWakeAlphaGradient(vWakeHeight);
        mapped.rgb *= verticalAlpha;
        mapped.a *= verticalAlpha;
        if (mapped.a <= 0.004) discard;
        gl_FragColor = mapped;
      }
    `,
  });
}

export function createFlameAoe3dRuntime({
  getOrbModel = () => null,
  getBo = () => 72,
  getConfig = () => FLAME_AOE_3D_PRESET_DEFAULT,
  now = () => performance.now(),
  onNeedsFrame = () => {},
} = {}) {
  let raf = 0;
  let timer = 0;
  let group = null;
  let auraMaterial = null;
  let wakeMaterial = null;
  let startedAtMs = 0;

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    raf = 0;
    timer = 0;
    auraMaterial = null;
    wakeMaterial = null;
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
    if (auraMaterial && auraMaterial.uniforms && auraMaterial.uniforms.uTime) auraMaterial.uniforms.uTime.value = time;
    if (wakeMaterial && wakeMaterial.uniforms && wakeMaterial.uniforms.uTime) wakeMaterial.uniforms.uTime.value = time;
    requestFrame();
    raf = requestAnimationFrame(tick);
  }

  function play(payload = {}) {
    clear();
    const baseConfig = typeof getConfig === "function" ? (getConfig() || {}) : {};
    const config = normalizeFlameAoe3dRuntimeConfig({
      ...baseConfig,
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    if (!orbModel) return { handled: false, skipped: "orb_model_missing" };
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
    startedAtMs = Number(now()) || performance.now();
    group = new THREE.Group();
    group.name = "flame_aoe3d:runtime";
    auraMaterial = createAuraShellMaterial(config);
    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(bo * 0.5 * config.auraScale, 96, 48),
      auraMaterial
    );
    aura.name = "flame_aoe3d:aura_shell";
    aura.renderOrder = 8;
    wakeMaterial = createWakeMaterial({
      ...config,
      wakeDisplacePx: bo * config.wakeDisplaceBo,
    });
    const wake = new THREE.Mesh(
      createWakeTeardropGeometry(
        bo * config.wakeRadiusBo,
        bo * config.wakeLengthBo,
        config.wakeSubdivisions,
        Math.max(8, Math.round(config.wakeSubdivisions * 0.5))
      ),
      wakeMaterial
    );
    wake.name = "flame_aoe3d:directional_wake";
    wake.renderOrder = 10;
    group.add(aura);
    group.add(wake);
    orbModel.add(group);
    timer = setTimeout(clear, config.durationMs);
    raf = requestAnimationFrame(tick);
    requestFrame();
    return { handled: true };
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
