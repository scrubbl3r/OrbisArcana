import * as THREE from "three";

export function createFireCardMaterial({
  noiseScale = 4.2,
  noiseSpeed = 1.45,
  edgeSoftness = 0.09,
  topFadeStart = 0.58,
  topFadeSoftness = 0.42,
  bottomFadeSoftness = 0.12,
} = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uNoiseScale: { value: Number(noiseScale) || 4.2 },
      uNoiseSpeed: { value: Number(noiseSpeed) || 1.45 },
      uEdgeSoftness: { value: Number(edgeSoftness) || 0.09 },
      uTopFadeStart: { value: Number(topFadeStart) || 0.58 },
      uTopFadeSoftness: { value: Number(topFadeSoftness) || 0.42 },
      uBottomFadeSoftness: { value: Number(bottomFadeSoftness) || 0.12 },
    },
    vertexShader: `
      attribute vec3 instanceColor;
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vUv = uv;
        vColor = instanceColor;
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
      uniform float uEdgeSoftness;
      uniform float uTopFadeStart;
      uniform float uTopFadeSoftness;
      uniform float uBottomFadeSoftness;
      varying vec2 vUv;
      varying vec3 vColor;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.58;
        for (int i = 0; i < 3; i++) {
          value += valueNoise(p) * amp;
          p *= 2.08;
          amp *= 0.48;
        }
        return value;
      }

      void main() {
        vec2 centered = vec2((vUv.x - 0.5) * 2.0, vUv.y);
        float y = clamp(vUv.y, 0.0, 1.0);
        float bulb = exp(-pow((y - 0.28) / 0.29, 2.0)) * 0.52;
        float taper = pow(max(0.0, 1.0 - y), 1.35) * 0.34 + 0.035;
        float halfWidth = mix(taper, bulb, 0.68);
        halfWidth *= mix(0.72, 1.0, smoothstep(0.02, 0.22, y));
        float edge = 1.0 - smoothstep(halfWidth, halfWidth + uEdgeSoftness, abs(centered.x));
        float bottomFade = smoothstep(0.0, uBottomFadeSoftness, y);
        float topFade = 1.0 - smoothstep(uTopFadeStart, min(1.0, uTopFadeStart + uTopFadeSoftness), y);
        float shapeAlpha = edge * bottomFade * topFade;

        vec2 noiseUv = vec2(centered.x * 0.65, y * 1.45 - uTime * uNoiseSpeed);
        float noise = fbm(noiseUv * uNoiseScale);
        float tongues = smoothstep(0.28, 0.78, noise + y * 0.24);
        float core = smoothstep(0.52, 0.94, noise + (1.0 - abs(centered.x)) * 0.34 - y * 0.1);
        float alpha = shapeAlpha * mix(0.34, 1.0, tongues);
        if (alpha <= 0.01) discard;

        vec3 hot = vec3(1.0, 0.93, 0.42);
        vec3 color = mix(vColor, hot, core * 0.72);
        gl_FragColor = vec4(color * (0.78 + core * 0.95), alpha);
      }
    `,
  });
}
