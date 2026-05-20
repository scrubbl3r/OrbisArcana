import * as THREE from "three";

export function createFireCardMaterial({
  noiseScale = 3.4,
  noiseSpeed = 1.9,
  noiseOctaves = 4,
  noiseGain = 0.5,
} = {}) {
  return new THREE.ShaderMaterial({
    name: "fire_card:egg_flame_2d_material",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uNoiseScale: { value: Math.max(0.1, Number(noiseScale) || 3.4) },
      uNoiseSpeed: { value: Math.max(0, Number(noiseSpeed) || 1.9) },
      uNoiseOctaves: { value: Math.max(1, Math.min(6, Math.round(Number(noiseOctaves) || 4))) },
      uNoiseGain: { value: Math.max(0.1, Math.min(0.9, Number(noiseGain) || 0.5)) },
    },
    vertexShader: `
      precision highp float;
      attribute float aFireSeed;
      varying vec2 vUv;
      varying float vFireSeed;
      void main() {
        vUv = uv;
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
      uniform float uNoiseScale;
      uniform float uNoiseSpeed;
      uniform int uNoiseOctaves;
      uniform float uNoiseGain;
      varying vec2 vUv;
      varying float vFireSeed;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.58;
        float norm = 0.0;
        for (int i = 0; i < 6; i += 1) {
          if (i >= uNoiseOctaves) break;
          value += valueNoise(p) * amp;
          norm += amp;
          p = p * 2.03 + vec2(19.17, -11.31);
          amp *= uNoiseGain;
        }
        return norm > 0.0 ? value / norm : value;
      }

      vec4 flameRamp(float t) {
        float v = clamp(t, 0.0, 1.0);
        vec4 ember = vec4(0.02, 0.0, 0.0, 0.0);
        vec4 red = vec4(1.0, 0.06, 0.0, 0.82);
        vec4 orange = vec4(1.0, 0.44, 0.02, 0.94);
        vec4 cream = vec4(1.0, 0.92, 0.58, 1.0);
        if (v < 0.34) return mix(ember, red, smoothstep(0.0, 0.34, v));
        if (v < 0.72) return mix(red, orange, smoothstep(0.34, 0.72, v));
        return mix(orange, cream, smoothstep(0.72, 1.0, v));
      }

      void main() {
        float y = clamp(vUv.y, 0.0, 1.0);
        float seed = fract(vFireSeed);
        vec2 seedOffset = vec2(seed * 41.37 + 7.1, seed * -29.73 + 13.4);
        vec2 p = vec2((vUv.x - 0.5) * 1.18, y * 1.62);
        p *= uNoiseScale;
        p.y -= uTime * uNoiseSpeed;
        p += seedOffset;

        float broad = fbm(p * vec2(0.72, 0.94));
        float detail = fbm(p * vec2(1.34, 1.68) + seedOffset * 0.31);
        float field = broad * 0.72 + detail * 0.28;
        float bodyBias = (1.0 - y) * 0.18;
        float flame = smoothstep(0.30, 0.78, field + bodyBias);
        vec4 color = flameRamp(flame);

        float verticalAlpha = 1.0 - smoothstep(0.62, 0.95, y);
        color.rgb *= verticalAlpha * (0.82 + flame * 0.42);
        color.a *= verticalAlpha;
        if (color.a <= 0.004) discard;
        gl_FragColor = color;
      }
    `,
  });
}
