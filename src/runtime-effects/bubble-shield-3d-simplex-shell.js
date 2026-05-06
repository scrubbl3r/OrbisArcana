import * as THREE from "three";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number(fallback);
  const safe = Number.isFinite(n) ? n : (Number.isFinite(f) ? f : min);
  return Math.max(min, Math.min(max, safe));
}

function clampInt(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}

export const BUBBLE_SHIELD_3D_SIMPLEX_DEFAULT = Object.freeze({
  simplexScale: 28.00,
  simplexSpeed: 18.00,
  simplexContrast: 0.60,
  simplexOctaves: 3,
  simplexLacunarity: 1.10,
  simplexGain: 0.30,
});

export function normalizeBubbleShield3dSimplexConfig(raw = {}, fallback = BUBBLE_SHIELD_3D_SIMPLEX_DEFAULT) {
  const source = raw && typeof raw === "object" ? raw : {};
  return Object.freeze({
    simplexScale: clampNumber(source.simplexScale, 1, 96, fallback.simplexScale),
    simplexSpeed: clampNumber(source.simplexSpeed, 0, 48, fallback.simplexSpeed),
    simplexContrast: clampNumber(source.simplexContrast, 0.02, 1, fallback.simplexContrast),
    simplexOctaves: clampInt(source.simplexOctaves, 1, 8, fallback.simplexOctaves),
    simplexLacunarity: clampNumber(source.simplexLacunarity, 1, 4, fallback.simplexLacunarity),
    simplexGain: clampNumber(source.simplexGain, 0.05, 0.95, fallback.simplexGain),
  });
}

export function createBubbleShield3dSimplexMaterial(config = {}) {
  const simplex = normalizeBubbleShield3dSimplexConfig(config);
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 1 },
      uSimplexScale: { value: simplex.simplexScale },
      uSimplexSpeed: { value: simplex.simplexSpeed },
      uSimplexContrast: { value: simplex.simplexContrast },
      uSimplexOctaves: { value: simplex.simplexOctaves },
      uSimplexLacunarity: { value: simplex.simplexLacunarity },
      uSimplexGain: { value: simplex.simplexGain },
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        vLocalPos = position;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uAlpha;
      uniform float uSimplexScale;
      uniform float uSimplexSpeed;
      uniform float uSimplexContrast;
      uniform float uSimplexOctaves;
      uniform float uSimplexLacunarity;
      uniform float uSimplexGain;
      varying vec3 vLocalPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
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
        return clamp(n * 16.0 + 0.5, 0.0, 1.0);
      }

      float simplexFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.58;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uSimplexOctaves) break;
          value += simplexNoise(p * freq) * amp;
          freq *= uSimplexLacunarity;
          amp *= uSimplexGain;
          p += vec3(-13.1, 9.7, 21.4);
        }
        return clamp(value, 0.0, 1.0);
      }

      void main() {
        vec3 surface = normalize(vLocalPos + vec3(0.001, -0.002, 0.003));
        float t = uTime * uSimplexSpeed;
        float scale = max(1.0, uSimplexScale);
        vec3 flow = surface * scale + vec3(t * 0.73, -t * 0.51, t * 0.37);
        float field = simplexFbm(flow);
        float fine = simplexNoise(flow * 2.65 + vec3(-t * 1.7, t * 1.13, t * 0.89));
        float staticField = clamp(field * 0.62 + fine * 0.38, 0.0, 1.0);
        float threshold = mix(0.82, 0.38, clamp(uSimplexContrast, 0.0, 1.0));
        float sparks = smoothstep(threshold, min(0.995, threshold + 0.025), staticField);
        float pulse = 0.58 + 0.42 * hash31(floor(flow * 1.7) + floor(vec3(t * 7.0)));
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float rim = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDir)), 2.4);
        vec3 color = mix(vec3(0.28, 0.76, 1.0), vec3(0.95, 1.0, 1.0), sparks);
        float alpha = uAlpha * sparks * pulse * (0.95 + rim * 0.75);
        if (alpha <= 0.002) discard;
        gl_FragColor = vec4(color * (1.08 + rim * 0.9), alpha);
      }
    `,
  });
}

export function createBubbleShield3dSimplexShell({ bo = 72, config = {} } = {}) {
  const radius = Math.max(1, Number(bo) || 72) * 0.5 * clampNumber(config.diameterRatio, 0.1, 8, 1.8);
  const geometry = new THREE.IcosahedronGeometry(radius, 5);
  const material = createBubbleShield3dSimplexMaterial(config);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "BubbleShield3dSimplexShell";
  mesh.frustumCulled = false;
  return mesh;
}
