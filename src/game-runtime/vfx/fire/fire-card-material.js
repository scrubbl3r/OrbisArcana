import * as THREE from "three";

const GRAPH_STOP_VALUES = [0, 0.3, 0.5, 1];
const GRAPH_COLORS = [
  new THREE.Vector4(0, 0, 0, 0),
  new THREE.Vector4(1, 0, 0, 1),
  new THREE.Vector4(1, 0.706, 0, 1),
  new THREE.Vector4(1, 0.941, 0.784, 1),
];
const ALPHA_STOP_VALUES = [0, 0.6, 0.85, 1];
const ALPHA_VALUES = [1, 0.5, 0, 0];

function finiteNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function createFireCardMaterial({
  debugSolid = false,
  wakeNoiseScale = 2,
  wakeNoiseSpeed = 7,
  wakeNoiseDensityBottom = 0.9,
  wakeNoiseDensityTop = 0,
  wakeNoiseContrast = 0.3,
  wakeNoiseOctaves = 4,
  wakeNoiseLacunarity = 1.1,
  wakeNoiseGain = 0.25,
  wakeSimplexScale = 1.25,
  wakeSimplexSpeed = 8,
  wakeSimplexDensityBottom = 0,
  wakeSimplexDensityTop = 0.3,
  wakeSimplexContrast = 0.6,
  wakeSimplexOctaves = 3,
  wakeSimplexLacunarity = 1.1,
  wakeSimplexGain = 0.3,
  wakeNoiseMix = 0.25,
} = {}) {
  return new THREE.ShaderMaterial({
    name: "fire_card:egg_flame_flat_wake_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uWakeNoiseScale: { value: Math.max(0.1, finiteNumber(wakeNoiseScale, 2)) },
      uWakeNoiseSpeed: { value: Math.max(0, finiteNumber(wakeNoiseSpeed, 7)) },
      uWakeNoiseDensityBottom: { value: Math.max(0, Math.min(1, finiteNumber(wakeNoiseDensityBottom, 0.9))) },
      uWakeNoiseDensityTop: { value: Math.max(0, Math.min(1, finiteNumber(wakeNoiseDensityTop, 0))) },
      uWakeNoiseContrast: { value: Math.max(0.02, Math.min(0.6, finiteNumber(wakeNoiseContrast, 0.3))) },
      uWakeNoiseOctaves: { value: Math.max(1, Math.min(8, Math.round(finiteNumber(wakeNoiseOctaves, 4)))) },
      uWakeNoiseLacunarity: { value: Math.max(1.1, finiteNumber(wakeNoiseLacunarity, 1.1)) },
      uWakeNoiseGain: { value: Math.max(0.1, Math.min(0.9, finiteNumber(wakeNoiseGain, 0.25))) },
      uWakeSimplexScale: { value: Math.max(0.1, finiteNumber(wakeSimplexScale, 1.25)) },
      uWakeSimplexSpeed: { value: Math.max(0, finiteNumber(wakeSimplexSpeed, 8)) },
      uWakeSimplexDensityBottom: { value: Math.max(0, Math.min(1, finiteNumber(wakeSimplexDensityBottom, 0))) },
      uWakeSimplexDensityTop: { value: Math.max(0, Math.min(1, finiteNumber(wakeSimplexDensityTop, 0.3))) },
      uWakeSimplexContrast: { value: Math.max(0.02, Math.min(0.6, finiteNumber(wakeSimplexContrast, 0.6))) },
      uWakeSimplexOctaves: { value: Math.max(1, Math.min(8, Math.round(finiteNumber(wakeSimplexOctaves, 3)))) },
      uWakeSimplexLacunarity: { value: Math.max(1.1, finiteNumber(wakeSimplexLacunarity, 1.1)) },
      uWakeSimplexGain: { value: Math.max(0.1, Math.min(0.9, finiteNumber(wakeSimplexGain, 0.3))) },
      uWakeNoiseMix: { value: Math.max(0, Math.min(1, finiteNumber(wakeNoiseMix, 0.25))) },
      uWakeGraphStops: { value: GRAPH_STOP_VALUES },
      uWakeGraphColors: { value: GRAPH_COLORS },
      uWakeAlphaGradientStops: { value: ALPHA_STOP_VALUES },
      uWakeAlphaGradientValues: { value: ALPHA_VALUES },
      uDebugSolid: { value: debugSolid ? 1 : 0 },
    },
    vertexShader: `
      precision highp float;
      attribute float aFireSeed;
      attribute vec2 aEggLocal;
      varying vec2 vUv;
      varying vec2 vEggLocal;
      varying vec3 vLocalPos;
      varying float vFireSeed;
      void main() {
        vUv = uv;
        vEggLocal = aEggLocal;
        vLocalPos = position;
        vFireSeed = aFireSeed;
        vec4 worldPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform int uDebugSolid;
      uniform float uWakeNoiseScale; uniform float uWakeNoiseSpeed; uniform float uWakeNoiseDensityBottom; uniform float uWakeNoiseDensityTop; uniform float uWakeNoiseContrast; uniform float uWakeNoiseOctaves; uniform float uWakeNoiseLacunarity; uniform float uWakeNoiseGain;
      uniform float uWakeSimplexScale; uniform float uWakeSimplexSpeed; uniform float uWakeSimplexDensityBottom; uniform float uWakeSimplexDensityTop; uniform float uWakeSimplexContrast; uniform float uWakeSimplexOctaves; uniform float uWakeSimplexLacunarity; uniform float uWakeSimplexGain; uniform float uWakeNoiseMix;
      uniform float uWakeGraphStops[4]; uniform vec4 uWakeGraphColors[4];
      uniform float uWakeAlphaGradientStops[4]; uniform float uWakeAlphaGradientValues[4];
      varying vec2 vUv;
      varying vec2 vEggLocal;
      varying vec3 vLocalPos;
      varying float vFireSeed;

      float circleRadiusAtY(float y, float centerY, float radius) {
        float dy = y - centerY;
        float disc = radius * radius - dy * dy;
        return disc > 0.0 ? sqrt(disc) : 0.0;
      }
      float smoothMax(float a, float b, float radius) {
        if (max(abs(a), abs(b)) <= 0.000001) return 0.0;
        float k = max(0.0001, radius);
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(a, b, h) + k * h * (1.0 - h);
      }
      float eggHalfWidthAtY(float y) {
        float lowerCenterY = 0.0;
        float lowerRadius = 0.5;
        float upperCenterY = 0.56;
        float upperRadius = 0.22;
        float blendSoftness = 0.14;
        float lower = circleRadiusAtY(y, lowerCenterY, lowerRadius);
        float upper = circleRadiusAtY(y, upperCenterY, upperRadius);
        float bridgeT = clamp((y - lowerCenterY) / max(0.0001, upperCenterY - lowerCenterY), 0.0, 1.0);
        float bridge = (y > lowerCenterY && y < upperCenterY)
          ? mix(lowerRadius, upperRadius, bridgeT)
          : 0.0;
        return smoothMax(smoothMax(lower, upper, blendSoftness), bridge, blendSoftness * 0.75);
      }

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
        vec4 result = uWakeGraphColors[0];
        if (t <= uWakeGraphStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          float left = uWakeGraphStops[i];
          float right = max(left + 0.0001, uWakeGraphStops[i + 1]);
          result = uWakeGraphColors[i + 1];
          if (t <= right) { result = mix(uWakeGraphColors[i], uWakeGraphColors[i + 1], clamp((t - left) / (right - left), 0.0, 1.0)); break; }
        }
        return result;
      }
      float sampleWakeAlphaGradient(float value) {
        float t = clamp(value, 0.0, 1.0);
        float result = uWakeAlphaGradientValues[0];
        if (t <= uWakeAlphaGradientStops[0]) return result;
        for (int i = 0; i < 3; i += 1) {
          float left = uWakeAlphaGradientStops[i];
          float right = max(left + 0.0001, uWakeAlphaGradientStops[i + 1]);
          result = uWakeAlphaGradientValues[i + 1];
          if (t <= right) { result = mix(uWakeAlphaGradientValues[i], uWakeAlphaGradientValues[i + 1], clamp((t - left) / (right - left), 0.0, 1.0)); break; }
        }
        return result;
      }
      float edgeGuard(float value, float minValue, float maxValue) {
        return clamp(value, minValue, maxValue);
      }

      void main() {
        float clipHalfWidth = eggHalfWidthAtY(vLocalPos.y);
        if (clipHalfWidth <= 0.0 || abs(vLocalPos.x) > clipHalfWidth) discard;
        if (uDebugSolid == 1) {
          gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
          return;
        }

        float rawTail = clamp(vEggLocal.y, 0.0, 1.0);
        float rawEggX = clamp(vEggLocal.x, -1.0, 1.0);
        float safeTail = edgeGuard(rawTail, 0.035, 0.965);
        float capGuard = smoothstep(0.0, 0.11, rawTail) * (1.0 - smoothstep(0.89, 1.0, rawTail));
        float sideGuard = 1.0 - smoothstep(0.88, 1.0, abs(rawEggX));
        float domainGuard = capGuard * sideGuard;
        if (domainGuard <= 0.001) discard;
        float safeEggX = clamp(rawEggX, -0.94, 0.94);
        float seed = fract(vFireSeed);
        vec3 seedOffset = vec3(seed * 37.17 + 3.1, seed * -53.29 + 8.7, seed * 19.83 - 4.4);
        vec2 cardUv = vec2(safeEggX * 0.575, safeTail);

        float perlinTime = uTime * uWakeNoiseSpeed;
        float perlinFrequency = 4.25 / max(0.1, uWakeNoiseScale);
        vec3 perlinFlow = vec3(
          cardUv.x * perlinFrequency,
          (cardUv.y * 1.35 - perlinTime * 0.42) * perlinFrequency,
          0.0
        ) + seedOffset;
        float perlinDensity = mix(uWakeNoiseDensityBottom, uWakeNoiseDensityTop, safeTail);
        float perlin = perlinMusgraveField(perlinFlow);

        float simplexTime = uTime * uWakeSimplexSpeed;
        float simplexFrequency = 4.25 / max(0.1, uWakeSimplexScale);
        vec3 simplexFlow = vec3(
          cardUv.x * simplexFrequency,
          (cardUv.y * 1.52 - simplexTime * 0.5) * simplexFrequency,
          0.0
        ) + seedOffset * 1.37;
        float simplexDensity = mix(uWakeSimplexDensityBottom, uWakeSimplexDensityTop, safeTail);
        float simplex = simplexGranularField(simplexFlow);

        float noiseMix = clamp(uWakeNoiseMix, 0.0, 1.0);
        float field = mix(perlin, simplex, noiseMix);
        float density = mix(perlinDensity, simplexDensity, noiseMix);
        float contrast = mix(uWakeNoiseContrast, uWakeSimplexContrast, noiseMix);
        float blobs = colorRampMask(field, density, contrast);
        vec4 mapped = sampleWakeGraph(blobs);
        float verticalAlpha = sampleWakeAlphaGradient(safeTail) * domainGuard;
        mapped.rgb *= verticalAlpha;
        mapped.a *= verticalAlpha;
        if (mapped.a <= 0.004) discard;
        gl_FragColor = mapped;
      }
    `,
  });
}
