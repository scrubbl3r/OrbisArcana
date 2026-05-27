import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import { TESLA_1_PRESET_DEFAULT } from "../vfx/presets/tesla-1-default.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number(fallback);
  const safe = Number.isFinite(n) ? n : (Number.isFinite(f) ? f : min);
  return Math.max(min, Math.min(max, safe));
}

function normalizeTesla1CoreGlowConfig(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  return Object.freeze({
    enabled: source.coreGlowEnabled !== false && source.coreGlowEnabled !== 0,
    radiusBo: clampNumber(source.coreGlowRadiusBo, 0.05, 4, TESLA_1_PRESET_DEFAULT.coreGlowRadiusBo),
    luminance: clampNumber(source.coreGlowLuminance, 0, 80, TESLA_1_PRESET_DEFAULT.coreGlowLuminance),
    globalAlpha: clampNumber(source.coreGlowGlobalAlpha, 0, 1, TESLA_1_PRESET_DEFAULT.coreGlowGlobalAlpha),
    centerAlpha: clampNumber(source.coreGlowCenterAlpha, 0, 1, TESLA_1_PRESET_DEFAULT.coreGlowCenterAlpha),
    edgeAlpha: clampNumber(source.coreGlowEdgeAlpha, 0, 1, TESLA_1_PRESET_DEFAULT.coreGlowEdgeAlpha),
    edgeSoftness: clampNumber(source.coreGlowEdgeSoftness, 0.1, 12, TESLA_1_PRESET_DEFAULT.coreGlowEdgeSoftness),
    displacementBo: clampNumber(source.coreGlowDisplacementBo, 0, 2, TESLA_1_PRESET_DEFAULT.coreGlowDisplacementBo),
    noiseScale: clampNumber(source.coreGlowNoiseScale, 0.1, 64, TESLA_1_PRESET_DEFAULT.coreGlowNoiseScale),
    noiseSpeed: clampNumber(source.coreGlowNoiseSpeed, 0, 32, TESLA_1_PRESET_DEFAULT.coreGlowNoiseSpeed),
    pulseAmount: clampNumber(source.coreGlowPulseAmount, 0, 8, TESLA_1_PRESET_DEFAULT.coreGlowPulseAmount),
    colorR: clampNumber(source.orbLightColorR, 0, 255, TESLA_1_PRESET_DEFAULT.orbLightColorR) / 255,
    colorG: clampNumber(source.orbLightColorG, 0, 255, TESLA_1_PRESET_DEFAULT.orbLightColorG) / 255,
    colorB: clampNumber(source.orbLightColorB, 0, 255, TESLA_1_PRESET_DEFAULT.orbLightColorB) / 255,
  });
}

function createTesla1CoreGlowMaterial({ config, bo }) {
  const cfg = normalizeTesla1CoreGlowConfig(config);
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uBo: { value: Math.max(1, Number(bo) || 72) },
      uPulse: { value: 0 },
      uColor: { value: new THREE.Color(cfg.colorR, cfg.colorG, cfg.colorB) },
      uLuminance: { value: cfg.luminance },
      uGlobalAlpha: { value: cfg.globalAlpha },
      uCenterAlpha: { value: cfg.centerAlpha },
      uEdgeAlpha: { value: cfg.edgeAlpha },
      uEdgeSoftness: { value: cfg.edgeSoftness },
      uDisplacementBo: { value: cfg.displacementBo },
      uNoiseScale: { value: cfg.noiseScale },
      uNoiseSpeed: { value: cfg.noiseSpeed },
      uPulseAmount: { value: cfg.pulseAmount },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uBo;
      uniform float uDisplacementBo;
      uniform float uNoiseScale;
      uniform float uNoiseSpeed;
      uniform float uPulse;
      uniform float uPulseAmount;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;

      float waveNoise(vec3 p) {
        return (
          sin(p.x * 1.37 + p.y * 2.11 + p.z * 0.71)
          + sin(p.x * -2.43 + p.y * 0.83 + p.z * 1.91)
          + sin(p.x * 0.67 + p.y * -1.79 + p.z * 2.57)
        ) / 3.0;
      }

      void main() {
        vec3 n = normalize(normal);
        float scale = max(0.1, uNoiseScale);
        float t = uTime * uNoiseSpeed;
        float coarse = waveNoise(n * scale + vec3(t * 0.77, -t * 0.43, t * 0.31));
        float fine = waveNoise(n * scale * 2.7 + vec3(-t * 1.31, t * 0.91, -t * 0.62));
        float pulseLift = 1.0 + max(0.0, uPulse) * uPulseAmount * 0.11;
        float displacement = (coarse * 0.72 + fine * 0.28) * uDisplacementBo * uBo * pulseLift;
        vec3 displaced = position + n * displacement;
        vec4 world = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = world.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * n);
        vLocalPos = displaced;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uLuminance;
      uniform float uGlobalAlpha;
      uniform float uCenterAlpha;
      uniform float uEdgeAlpha;
      uniform float uEdgeSoftness;
      uniform float uPulse;
      uniform float uPulseAmount;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float facing = clamp(abs(dot(normalize(vWorldNormal), viewDir)), 0.0, 1.0);
        float center = pow(facing, max(0.1, uEdgeSoftness * 0.45));
        float rim = pow(1.0 - facing, max(0.1, uEdgeSoftness));
        float breathe = 0.86 + 0.14 * sin(uTime * 5.7 + dot(normalize(vLocalPos + vec3(0.01)), vec3(2.1, -1.3, 1.7)));
        float pulse = max(0.0, uPulse);
        float pulseBoost = 1.0 + pulse * uPulseAmount;
        vec3 hot = vec3(1.0);
        vec3 fringe = mix(uColor, vec3(0.55, 0.78, 1.0), 0.35);
        vec3 color = mix(fringe, hot, clamp(center * 1.25, 0.0, 1.0));
        float alpha = (uCenterAlpha * center + uEdgeAlpha * rim) * uGlobalAlpha * breathe * (1.0 + pulse * 0.35);
        if (alpha <= 0.001) discard;
        gl_FragColor = vec4(color * uLuminance * pulseBoost, alpha);
      }
    `,
  });
}

function updateTesla1CoreGlowMaterial(material, { config, bo, timeSec = 0, pulseMultiplier = 1 }) {
  if (!material || !material.uniforms) return;
  const cfg = normalizeTesla1CoreGlowConfig(config);
  const uniforms = material.uniforms;
  uniforms.uTime.value = Number(timeSec) || 0;
  uniforms.uBo.value = Math.max(1, Number(bo) || 72);
  uniforms.uPulse.value = Math.max(0, Number(pulseMultiplier) || 1) - 1;
  uniforms.uColor.value.setRGB(cfg.colorR, cfg.colorG, cfg.colorB);
  uniforms.uLuminance.value = cfg.luminance;
  uniforms.uGlobalAlpha.value = cfg.globalAlpha;
  uniforms.uCenterAlpha.value = cfg.centerAlpha;
  uniforms.uEdgeAlpha.value = cfg.edgeAlpha;
  uniforms.uEdgeSoftness.value = cfg.edgeSoftness;
  uniforms.uDisplacementBo.value = cfg.displacementBo;
  uniforms.uNoiseScale.value = cfg.noiseScale;
  uniforms.uNoiseSpeed.value = cfg.noiseSpeed;
  uniforms.uPulseAmount.value = cfg.pulseAmount;
}

export function createTesla1CoreGlowRuntime({
  getOrbModel = () => null,
  getBo = () => 72,
  now = () => performance.now(),
  onNeedsFrame = () => {},
  renderOrder = 226,
} = {}) {
  let mesh = null;
  let radiusWorld = 0;
  let startedAtMs = 0;

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function clear() {
    const hadMesh = !!mesh;
    if (mesh && mesh.parent) mesh.parent.remove(mesh);
    if (mesh) disposeThreeObject(mesh);
    mesh = null;
    radiusWorld = 0;
    startedAtMs = 0;
    if (hadMesh) requestFrame();
  }

  function ensure(config = {}) {
    const cfg = normalizeTesla1CoreGlowConfig(config);
    if (!cfg.enabled) {
      clear();
      return false;
    }
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    if (!orbModel) {
      clear();
      return false;
    }
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
    const nextRadiusWorld = bo * cfg.radiusBo;
    if (mesh && mesh.parent === orbModel && Math.abs(nextRadiusWorld - radiusWorld) <= 0.5) return true;
    if (mesh) clear();
    const geometry = new THREE.IcosahedronGeometry(nextRadiusWorld, 5);
    const material = createTesla1CoreGlowMaterial({ config: cfg, bo });
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = "tesla1:core_glow";
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    radiusWorld = nextRadiusWorld;
    startedAtMs = Number(now()) || performance.now();
    orbModel.add(mesh);
    requestFrame();
    return true;
  }

  function update(nowMs = now(), { config = {}, pulseMultiplier = 1 } = {}) {
    if (!ensure(config) || !mesh) return { handled: false };
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
    updateTesla1CoreGlowMaterial(mesh.material, {
      config,
      bo,
      timeSec: Math.max(0, ((Number(nowMs) || performance.now()) - startedAtMs) / 1000),
      pulseMultiplier,
    });
    requestFrame();
    return { handled: true };
  }

  return Object.freeze({
    clear,
    destroy: clear,
    update,
    isActive: () => !!mesh,
  });
}
