import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260517a";
import { createTesla1CoreGlowRuntime } from "../../../src/runtime-effects/tesla-1-core-glow.js?v=20260527-core-alpha-a";

const ORB_RADIUS_BO = 0.5;
const MAX_HALO_BOLTS = 32;
const TESLA_HALO_INTERNAL_LINE_WIDTH_BO = 0.012;
const TESLA_SHADER_TIME_RING_SECONDS = 32;

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + bo * 20);
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function readInputNumber(el, fallback, min = -Infinity, max = Infinity) {
  return clampNumber(el && el.value, min, max, fallback);
}

function readInputBoolean(el, fallback = true) {
  if (!el) return !!fallback;
  return !!el.checked;
}

function rgbColor(r = 255, g = 255, b = 255) {
  return new THREE.Color(
    clampNumber(r, 0, 255, 255) / 255,
    clampNumber(g, 0, 255, 255) / 255,
    clampNumber(b, 0, 255, 255) / 255
  );
}

function rgbHex(r = 255, g = 255, b = 255) {
  const cr = Math.round(clampNumber(r, 0, 255, 255));
  const cg = Math.round(clampNumber(g, 0, 255, 255));
  const cb = Math.round(clampNumber(b, 0, 255, 255));
  return ((cr << 16) | (cg << 8) | cb) >>> 0;
}

function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
    if (child.material && typeof child.material.dispose === "function") {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose && material.dispose());
      else child.material.dispose();
    }
  });
}

function buildLightningFieldUniformValues({
  boltCountMin,
  boltCountMax,
  startMin,
  startMax,
  endMin,
  endMax,
  bo,
  boltColor,
  intensity,
  tipFade,
  flickerHz,
  flickerDepth,
  macroNoiseScale,
  macroNoiseStrength,
  microNoiseScale,
  microNoiseStrength,
  noiseSpeedMin,
  noiseSpeedMax,
  branchDensity,
  branchLengthMin,
  branchLengthMax,
  branchAngleMin,
  branchAngleMax,
  widthLengthMin,
  widthLengthMax,
  baseWidthMin,
  baseWidthMax,
  widthMagnitudeCurve,
  taperCurve,
  tipWidthRatio,
  branchWidthRatio,
  ttlMinMs,
  ttlMaxMs,
  wanderSpeedMin,
  wanderSpeedMax,
  rpscMin,
  rpscMax,
  turnTensionMin,
  turnTensionMax,
  turnDampingMin,
  turnDampingMax,
  dispersion,
  haloStrikeActive = 0,
  haloStrikeSlot = -1,
  haloStrikeTarget = new THREE.Vector2(0, 0),
  haloStrikeSeed = 0,
  haloStrikeTime = 0,
  masterBoltActive = 0,
  masterBoltTarget = new THREE.Vector2(0, 0),
  masterBoltSeed = 0,
  masterBoltTime = 0,
  masterMacroBendMultiplier = 1,
  masterMacroScaleMultiplier = 1,
  masterMicroJitterMultiplier = 1,
  masterBranchDensityMultiplier = 1,
  masterBaseWidthMultiplier = 1,
  time,
}) {
  const countMin = Math.max(0, Math.min(MAX_HALO_BOLTS, Math.round(Number(boltCountMin) || 0)));
  const countMax = Math.max(countMin, Math.min(MAX_HALO_BOLTS, Math.round(Number(boltCountMax) || countMin)));
  return {
    uBoltCountMin: countMin,
    uBoltCountMax: countMax,
    uBo: Math.max(1, bo),
    uTime: ((time % TESLA_SHADER_TIME_RING_SECONDS) + TESLA_SHADER_TIME_RING_SECONDS) % TESLA_SHADER_TIME_RING_SECONDS,
    uHaloStrikeTime: ((haloStrikeTime % TESLA_SHADER_TIME_RING_SECONDS) + TESLA_SHADER_TIME_RING_SECONDS) % TESLA_SHADER_TIME_RING_SECONDS,
    uMasterBoltTime: ((masterBoltTime % TESLA_SHADER_TIME_RING_SECONDS) + TESLA_SHADER_TIME_RING_SECONDS) % TESLA_SHADER_TIME_RING_SECONDS,
    uStartMin: startMin,
    uStartMax: Math.max(startMin, startMax),
    uEndMin: endMin,
    uEndMax: Math.max(endMin, endMax),
    uBoltColor: boltColor,
    uLineWidth: Math.max(0.001, bo * TESLA_HALO_INTERNAL_LINE_WIDTH_BO),
    uIntensity: clampNumber(intensity, 0, 20, 6),
    uTipFade: clampNumber(tipFade, 0, 1, 0.08),
    uFlickerHz: clampNumber(flickerHz, 0, 60, 4),
    uFlickerDepth: clampNumber(flickerDepth, 0, 1, 0.5),
    uMacroNoiseScale: clampNumber(macroNoiseScale, 0.1, 200, 20),
    uMacroNoiseStrength: clampNumber(macroNoiseStrength, 0, 0.5, 0.03),
    uMicroNoiseScale: clampNumber(microNoiseScale, 0.1, 300, 42),
    uMicroNoiseStrength: clampNumber(microNoiseStrength, 0, 0.5, 0.025),
    uNoiseSpeedMin: clampNumber(noiseSpeedMin, 0, 20, 2),
    uNoiseSpeedMax: clampNumber(noiseSpeedMax, 0, 20, 3),
    uBranchDensity: clampNumber(branchDensity, 0, 1, 0),
    uBranchLengthMin: clampNumber(branchLengthMin, 0, 8 * Math.max(1, bo), 0.06 * Math.max(1, bo)),
    uBranchLengthMax: clampNumber(branchLengthMax, 0, 8 * Math.max(1, bo), 0.22 * Math.max(1, bo)),
    uBranchAngleMin: clampNumber(branchAngleMin, 0, 170, 35) * Math.PI / 180,
    uBranchAngleMax: clampNumber(branchAngleMax, 0, 170, 80) * Math.PI / 180,
    uWidthLengthMin: clampNumber(widthLengthMin, 0.001 * Math.max(1, bo), 1000 * Math.max(1, bo), 0.5 * Math.max(1, bo)),
    uWidthLengthMax: clampNumber(widthLengthMax, 0.001 * Math.max(1, bo), 1000 * Math.max(1, bo), 8 * Math.max(1, bo)),
    uBaseWidthMin: clampNumber(baseWidthMin, 0.0001 * Math.max(1, bo), 32 * Math.max(1, bo), 0.003 * Math.max(1, bo)),
    uBaseWidthMax: clampNumber(baseWidthMax, 0.0001 * Math.max(1, bo), 32 * Math.max(1, bo), 0.04 * Math.max(1, bo)),
    uWidthMagnitudeCurve: clampNumber(widthMagnitudeCurve, 0.05, 8, 1),
    uTaperCurve: clampNumber(taperCurve, 0.05, 8, 1),
    uTipWidthRatio: clampNumber(tipWidthRatio, 0.001, 2, 0.12),
    uBranchWidthRatio: clampNumber(branchWidthRatio, 0.001, 4, 0.55),
    uTtlMin: clampNumber(ttlMinMs, 16, 10000, 350) / 1000,
    uTtlMax: clampNumber(ttlMaxMs, 16, 10000, 900) / 1000,
    uWanderSpeedMin: clampNumber(wanderSpeedMin, 0, 4, 0.05),
    uWanderSpeedMax: clampNumber(wanderSpeedMax, 0, 4, 0.18),
    uRpscMin: clampNumber(rpscMin, 0, 1, 0.08),
    uRpscMax: clampNumber(rpscMax, 0, 1, 0.24),
    uTurnTensionMin: clampNumber(turnTensionMin, 0, 1, 0.22),
    uTurnTensionMax: clampNumber(turnTensionMax, 0, 1, 0.55),
    uTurnDampingMin: clampNumber(turnDampingMin, 0, 1, 0.04),
    uTurnDampingMax: clampNumber(turnDampingMax, 0, 1, 0.18),
    uDispersion: clampNumber(dispersion, 0, 1, 0.2),
    uHaloStrikeActive: haloStrikeActive ? 1 : 0,
    uHaloStrikeSlot: Math.round(clampNumber(haloStrikeSlot, -1, MAX_HALO_BOLTS - 1, -1)),
    uHaloStrikeTarget: haloStrikeTarget,
    uHaloStrikeSeed: clampNumber(haloStrikeSeed, 0, 999999, 0),
    uMasterBoltActive: masterBoltActive ? 1 : 0,
    uMasterBoltTarget: masterBoltTarget,
    uMasterBoltSeed: clampNumber(masterBoltSeed, 0, 999999, 0),
    uMasterMacroBendMultiplier: clampNumber(masterMacroBendMultiplier, 0, 8, 1),
    uMasterMacroScaleMultiplier: clampNumber(masterMacroScaleMultiplier, 0.05, 8, 1),
    uMasterMicroJitterMultiplier: clampNumber(masterMicroJitterMultiplier, 0, 8, 1),
    uMasterBranchDensityMultiplier: clampNumber(masterBranchDensityMultiplier, 0, 8, 1),
    uMasterBaseWidthMultiplier: clampNumber(masterBaseWidthMultiplier, 0.05, 16, 1),
  };
}

function updateLightningFieldMaterial(material, params) {
  if (!material || !material.uniforms) return;
  const values = buildLightningFieldUniformValues(params);
  Object.entries(values).forEach(([key, value]) => {
    if (!material.uniforms[key]) material.uniforms[key] = { value };
    else material.uniforms[key].value = value;
  });
}

function createLightningFieldMaterial(params) {
  const values = buildLightningFieldUniformValues(params);
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uBoltCountMin: { value: values.uBoltCountMin },
      uBoltCountMax: { value: values.uBoltCountMax },
      uBo: { value: values.uBo },
      uTime: { value: values.uTime },
      uHaloStrikeTime: { value: values.uHaloStrikeTime },
      uMasterBoltTime: { value: values.uMasterBoltTime },
      uStartMin: { value: values.uStartMin },
      uStartMax: { value: values.uStartMax },
      uEndMin: { value: values.uEndMin },
      uEndMax: { value: values.uEndMax },
      uBoltColor: { value: values.uBoltColor },
      uLineWidth: { value: values.uLineWidth },
      uIntensity: { value: values.uIntensity },
      uTipFade: { value: values.uTipFade },
      uFlickerHz: { value: values.uFlickerHz },
      uFlickerDepth: { value: values.uFlickerDepth },
      uMacroNoiseScale: { value: values.uMacroNoiseScale },
      uMacroNoiseStrength: { value: values.uMacroNoiseStrength },
      uMicroNoiseScale: { value: values.uMicroNoiseScale },
      uMicroNoiseStrength: { value: values.uMicroNoiseStrength },
      uNoiseSpeedMin: { value: values.uNoiseSpeedMin },
      uNoiseSpeedMax: { value: values.uNoiseSpeedMax },
      uBranchDensity: { value: values.uBranchDensity },
      uBranchLengthMin: { value: values.uBranchLengthMin },
      uBranchLengthMax: { value: values.uBranchLengthMax },
      uBranchAngleMin: { value: values.uBranchAngleMin },
      uBranchAngleMax: { value: values.uBranchAngleMax },
      uWidthLengthMin: { value: values.uWidthLengthMin },
      uWidthLengthMax: { value: values.uWidthLengthMax },
      uBaseWidthMin: { value: values.uBaseWidthMin },
      uBaseWidthMax: { value: values.uBaseWidthMax },
      uWidthMagnitudeCurve: { value: values.uWidthMagnitudeCurve },
      uTaperCurve: { value: values.uTaperCurve },
      uTipWidthRatio: { value: values.uTipWidthRatio },
      uBranchWidthRatio: { value: values.uBranchWidthRatio },
      uTtlMin: { value: values.uTtlMin },
      uTtlMax: { value: values.uTtlMax },
      uWanderSpeedMin: { value: values.uWanderSpeedMin },
      uWanderSpeedMax: { value: values.uWanderSpeedMax },
      uRpscMin: { value: values.uRpscMin },
      uRpscMax: { value: values.uRpscMax },
      uTurnTensionMin: { value: values.uTurnTensionMin },
      uTurnTensionMax: { value: values.uTurnTensionMax },
      uTurnDampingMin: { value: values.uTurnDampingMin },
      uTurnDampingMax: { value: values.uTurnDampingMax },
      uDispersion: { value: values.uDispersion },
      uHaloStrikeActive: { value: values.uHaloStrikeActive },
      uHaloStrikeSlot: { value: values.uHaloStrikeSlot },
      uHaloStrikeTarget: { value: values.uHaloStrikeTarget },
      uHaloStrikeSeed: { value: values.uHaloStrikeSeed },
      uMasterBoltActive: { value: values.uMasterBoltActive },
      uMasterBoltTarget: { value: values.uMasterBoltTarget },
      uMasterBoltSeed: { value: values.uMasterBoltSeed },
      uMasterMacroBendMultiplier: { value: values.uMasterMacroBendMultiplier },
      uMasterMacroScaleMultiplier: { value: values.uMasterMacroScaleMultiplier },
      uMasterMicroJitterMultiplier: { value: values.uMasterMicroJitterMultiplier },
      uMasterBranchDensityMultiplier: { value: values.uMasterBranchDensityMultiplier },
      uMasterBaseWidthMultiplier: { value: values.uMasterBaseWidthMultiplier },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      #define MAX_HALO_BOLTS ${MAX_HALO_BOLTS}
      uniform int uBoltCountMin;
      uniform int uBoltCountMax;
      uniform float uBo;
      uniform float uTime;
      uniform float uHaloStrikeTime;
      uniform float uMasterBoltTime;
      uniform float uStartMin;
      uniform float uStartMax;
      uniform float uEndMin;
      uniform float uEndMax;
      uniform vec3 uBoltColor;
      uniform float uLineWidth;
      uniform float uIntensity;
      uniform float uTipFade;
      uniform float uFlickerHz;
      uniform float uFlickerDepth;
      uniform float uMacroNoiseScale;
      uniform float uMacroNoiseStrength;
      uniform float uMicroNoiseScale;
      uniform float uMicroNoiseStrength;
      uniform float uNoiseSpeedMin;
      uniform float uNoiseSpeedMax;
      uniform float uBranchDensity;
      uniform float uBranchLengthMin;
      uniform float uBranchLengthMax;
      uniform float uBranchAngleMin;
      uniform float uBranchAngleMax;
      uniform float uWidthLengthMin;
      uniform float uWidthLengthMax;
      uniform float uBaseWidthMin;
      uniform float uBaseWidthMax;
      uniform float uWidthMagnitudeCurve;
      uniform float uTaperCurve;
      uniform float uTipWidthRatio;
      uniform float uBranchWidthRatio;
      uniform float uTtlMin;
      uniform float uTtlMax;
      uniform float uWanderSpeedMin;
      uniform float uWanderSpeedMax;
      uniform float uRpscMin;
      uniform float uRpscMax;
      uniform float uTurnTensionMin;
      uniform float uTurnTensionMax;
      uniform float uTurnDampingMin;
      uniform float uTurnDampingMax;
      uniform float uDispersion;
      uniform int uHaloStrikeActive;
      uniform int uHaloStrikeSlot;
      uniform vec2 uHaloStrikeTarget;
      uniform float uHaloStrikeSeed;
      uniform int uMasterBoltActive;
      uniform vec2 uMasterBoltTarget;
      uniform float uMasterBoltSeed;
      uniform float uMasterMacroBendMultiplier;
      uniform float uMasterMacroScaleMultiplier;
      uniform float uMasterMicroJitterMultiplier;
      uniform float uMasterBranchDensityMultiplier;
      uniform float uMasterBaseWidthMultiplier;
      varying vec3 vWorldPosition;
      const float TIME_RING = 32.0;
      const float SNAPSHOT_RING = 64.0;

      mat2 rotate2(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, s, -s, c);
      }

      float randomFloat(vec2 seed) {
        seed = sin(seed * vec2(123.45, 546.23)) * 345.21 + 12.57;
        return fract(seed.x * seed.y);
      }

      float simpleNoise(vec2 uv, float octaves) {
        float sn = 0.0;
        float amplitude = 1.0;
        float deno = 0.0;
        octaves = clamp(octaves, 1.0, 6.0);
        for (float i = 1.0; i <= 6.0; i += 1.0) {
          if (i > octaves) break;
          vec2 grid = smoothstep(vec2(0.0), vec2(1.0), fract(uv));
          vec2 id = floor(uv);
          vec2 offs = vec2(0.0, 1.0);
          float bl = randomFloat(id);
          float br = randomFloat(id + offs.yx);
          float tl = randomFloat(id + offs);
          float tr = randomFloat(id + offs.yy);
          sn += mix(mix(bl, br, grid.x), mix(tl, tr, grid.x), grid.y) * amplitude;
          deno += amplitude;
          uv *= 3.5;
          amplitude *= 0.5;
        }
        return sn / max(0.0001, deno);
      }

      float stableFrame(float value) {
        return mod(floor(value), SNAPSHOT_RING);
      }

      vec2 snapshotOffset(float seed, float frame) {
        return vec2(
          randomFloat(vec2(seed * 0.73 + 11.0, frame + 3.0)),
          randomFloat(vec2(seed * 1.17 + 29.0, frame + 17.0))
        ) * 64.0;
      }

      float lineSdf(vec2 p, vec2 a, vec2 b, float width, out float h) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        h = clamp(dot(pa, ba) / max(0.00001, dot(ba, ba)), 0.0, 1.0);
        return length(pa - ba * h) - width;
      }

      float taperedLineSdf(vec2 p, vec2 a, vec2 b, float baseWidth, float tipWidth, out float h) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        h = clamp(dot(pa, ba) / max(0.00001, dot(ba, ba)), 0.0, 1.0);
        float taperT = pow(h, uTaperCurve);
        float width = mix(baseWidth, tipWidth, taperT);
        return length(pa - ba * h) - max(0.0001 * uBo, width);
      }

      float signedPow(float value, float exponent) {
        float amount = pow(abs(value), exponent);
        return value < 0.0 ? -amount : amount;
      }

      float lengthMappedBaseWidth(float len) {
        float t = (len - uWidthLengthMin) / max(0.0001 * uBo, uWidthLengthMax - uWidthLengthMin);
        float magnitudeT = signedPow(t, uWidthMagnitudeCurve);
        return max(0.0001 * uBo, mix(uBaseWidthMin, uBaseWidthMax, magnitudeT));
      }

      float mixAngle(float a, float b, float amount) {
        float delta = atan(sin(b - a), cos(b - a));
        return a + delta * amount;
      }

      vec3 proceduralBolt(vec2 p, float angle, float startR, float len, float seed, float sampleTime, float macroNoiseScale, float macroNoiseStrength, float microNoiseStrength, float branchDensity, float baseWidthMultiplier) {
        vec2 uv = rotate2(angle) * p;
        uv.y -= startR;
        float h = 0.0;
        vec2 macroNoiseUv = uv / max(1.0, uBo) * macroNoiseScale;
        vec2 microNoiseUv = uv / max(1.0, uBo) * uMicroNoiseScale;
        float shapeHz = mix(uNoiseSpeedMin, max(uNoiseSpeedMin, uNoiseSpeedMax), randomFloat(vec2(seed, 173.0)));
        float shapeClock = mod(sampleTime * shapeHz, TIME_RING);
        float shapeFrame = stableFrame(shapeClock);
        float nextShapeFrame = mod(shapeFrame + 1.0, TIME_RING);
        float shapeBlend = smoothstep(0.0, 1.0, fract(shapeClock));
        float macroA = simpleNoise(macroNoiseUv + snapshotOffset(seed, shapeFrame), 2.0);
        float macroB = simpleNoise(macroNoiseUv + snapshotOffset(seed, nextShapeFrame), 2.0);
        float microA = simpleNoise(microNoiseUv + snapshotOffset(seed + 401.0, shapeFrame), 2.0);
        float microB = simpleNoise(microNoiseUv + snapshotOffset(seed + 401.0, nextShapeFrame), 2.0);
        float macro = mix(macroA, macroB, shapeBlend) * 2.0 - 1.0;
        float micro = mix(microA, microB, shapeBlend) * 2.0 - 1.0;
        float tipAnchorStart = max(0.0, len - uBo * 0.18);
        float tipAnchor = 1.0 - smoothstep(tipAnchorStart, len, clamp(uv.y, 0.0, len));
        float baseAnchor = smoothstep(0.0, uBo * 0.2, uv.y);
        uv.x += (macro * macroNoiseStrength + micro * microNoiseStrength) * uBo * baseAnchor * tipAnchor;
        float baseWidth = lengthMappedBaseWidth(len) * baseWidthMultiplier;
        float tipWidth = max(0.0001 * uBo, baseWidth * uTipWidthRatio);
        float d = taperedLineSdf(uv, vec2(0.0, 0.0), vec2(0.0, len), baseWidth, tipWidth, h);
        float line = 0.1 / max(max(d / max(1.0, uBo), 0.0), 0.0001);
        vec3 bolt = clamp(1.0 - exp(-(line * uBoltColor) * 0.02), 0.0, 1.0);
        bolt *= smoothstep(len, len * (1.0 - uTipFade), abs(uv.y));

        for (int branchIndex = 0; branchIndex < 3; branchIndex += 1) {
          float bi = float(branchIndex);
          float branchSeed = seed + bi * 23.17;
          if (randomFloat(vec2(branchSeed, 311.0)) > branchDensity) continue;
          float anchorT = mix(0.18, 0.82, randomFloat(vec2(branchSeed, 317.0)));
          float side = randomFloat(vec2(branchSeed, 331.0)) < 0.5 ? -1.0 : 1.0;
          float branchLen = mix(uBranchLengthMin, max(uBranchLengthMin, uBranchLengthMax), randomFloat(vec2(branchSeed, 337.0)));
          float branchAngle = side * mix(uBranchAngleMin, max(uBranchAngleMin, uBranchAngleMax), randomFloat(vec2(branchSeed, 347.0)));
          vec2 branchUv = rotate2(-branchAngle) * (uv - vec2(0.0, len * anchorT));
          float branchNoiseFrame = stableFrame(sampleTime * max(1.0, uNoiseSpeedMin) + bi * 5.0);
          vec2 branchMacroUv = branchUv / max(1.0, uBo) * macroNoiseScale;
          vec2 branchMicroUv = branchUv / max(1.0, uBo) * uMicroNoiseScale;
          float branchMacro = simpleNoise(branchMacroUv + snapshotOffset(branchSeed, branchNoiseFrame), 2.0) * 2.0 - 1.0;
          float branchMicro = simpleNoise(branchMicroUv + snapshotOffset(branchSeed + 401.0, branchNoiseFrame), 2.0) * 2.0 - 1.0;
          float branchTipAnchorStart = max(0.0, branchLen - uBo * 0.12);
          float branchTipAnchor = 1.0 - smoothstep(branchTipAnchorStart, branchLen, clamp(branchUv.y, 0.0, branchLen));
          float branchBaseAnchor = smoothstep(0.0, uBo * 0.12, branchUv.y);
          branchUv.x += (branchMacro * macroNoiseStrength + branchMicro * microNoiseStrength) * uBo * branchBaseAnchor * branchTipAnchor;
          float branchH = 0.0;
          float branchBaseWidth = lengthMappedBaseWidth(branchLen) * uBranchWidthRatio;
          float branchTipWidth = max(0.0001 * uBo, branchBaseWidth * uTipWidthRatio);
          float branchD = taperedLineSdf(branchUv, vec2(0.0), vec2(0.0, branchLen), branchBaseWidth, branchTipWidth, branchH);
          float branchLine = 0.08 / max(max(branchD / max(1.0, uBo), 0.0), 0.0001);
          vec3 branchBolt = clamp(1.0 - exp(-(branchLine * uBoltColor) * 0.018), 0.0, 1.0);
          branchBolt *= smoothstep(branchLen, branchLen * 0.65, abs(branchUv.y));
          branchBolt *= smoothstep(0.02, 0.14, anchorT) * smoothstep(0.98, 0.78, anchorT);
          bolt += branchBolt * 0.72;
        }

        float flickerTime = mod(sampleTime, TIME_RING);
        float flicker = 1.0 - uFlickerDepth * (0.5 + 0.5 * sin(flickerTime * uFlickerHz * 6.2831853 + seed * 2.31));
        return bolt * flicker;
      }

      void main() {
        vec2 p = vWorldPosition.xy;
        vec3 color = vec3(0.0);
        float minCount = float(min(uBoltCountMin, uBoltCountMax));
        float maxCount = float(max(uBoltCountMin, uBoltCountMax));
        float optionalSlots = max(0.0, maxCount - minCount);
        for (int i = 0; i < MAX_HALO_BOLTS; i += 1) {
          if (float(i) >= maxCount) break;
          float fi = float(i);
          float baseTtl = max(0.016, uTtlMin);
          float maxTtl = max(baseTtl, uTtlMax);
          float offset = randomFloat(vec2(fi, 9.0)) * maxTtl;
          float shiftedTime = mod(uTime + offset, maxTtl * TIME_RING);
          float coarseCycle = stableFrame(shiftedTime / maxTtl);
          float ttl = mix(baseTtl, maxTtl, randomFloat(vec2(fi * 17.7, coarseCycle + 41.0)));
          float ttlCycle = stableFrame(shiftedTime / ttl);
          float ttlAge = mod(shiftedTime, ttl);
          float seed = fi * 37.13 + ttlCycle * 19.7 + 11.7;
	          if (uHaloStrikeActive == 1 && i == uHaloStrikeSlot) continue;
	          float activeRoll = randomFloat(vec2(seed, 23.0));
          float optionalChance = optionalSlots > 0.0 ? 0.5 : 0.0;
          if (fi >= minCount && activeRoll > optionalChance) continue;
          float direction = randomFloat(vec2(seed, 53.0)) < 0.5 ? -1.0 : 1.0;
          float wanderSpeed = mix(uWanderSpeedMin, max(uWanderSpeedMin, uWanderSpeedMax), randomFloat(vec2(seed, 71.0)));
          float rpsc = mix(uRpscMin, max(uRpscMin, uRpscMax), randomFloat(vec2(seed, 83.0)));
          float tension = mix(uTurnTensionMin, max(uTurnTensionMin, uTurnTensionMax), randomFloat(vec2(seed, 107.0)));
          float damping = mix(uTurnDampingMin, max(uTurnDampingMin, uTurnDampingMax), randomFloat(vec2(seed, 131.0)));
          float velocity = direction * wanderSpeed;
          float phaseSeconds = 0.0;
          float segmentStart = 0.0;
          float tickSeconds = 0.125;
          for (int s = 0; s < 48; s += 1) {
            float segmentEnd = min(ttlAge, float(s + 1) * tickSeconds);
            if (segmentEnd > segmentStart) {
              velocity += (direction * wanderSpeed - velocity) * tension;
              velocity *= 1.0 - damping * tickSeconds;
              phaseSeconds += velocity * (segmentEnd - segmentStart);
            }
            if (ttlAge <= segmentEnd) break;
            if (randomFloat(vec2(seed, 97.0 + float(s))) < rpsc * tickSeconds) direction *= -1.0;
            segmentStart = segmentEnd;
          }
          float randomAngle = randomFloat(vec2(seed, fi + 3.17)) * 6.2831853;
          float evenAngle = (fi + 0.5 * randomFloat(vec2(seed, 149.0))) / max(1.0, maxCount) * 6.2831853;
          float angle = mixAngle(randomAngle, evenAngle, uDispersion) + phaseSeconds * 6.2831853;
          float startR = mix(uStartMin, uStartMax, randomFloat(vec2(seed, 7.0)));
          float lengthSlotCount = max(1.0, minCount);
          float lengthSlotOffset = floor(randomFloat(vec2(seed, 193.0)) * lengthSlotCount);
          float lengthSlot = mod(fi + lengthSlotOffset, lengthSlotCount);
          float lengthRoll = (lengthSlot + randomFloat(vec2(seed, 191.0))) / lengthSlotCount;
          float endR = mix(uEndMin, uEndMax, lengthRoll);
          float len = max(0.001 * uBo, endR - startR);
	          color += proceduralBolt(p, angle, startR, len, seed, uTime, uMacroNoiseScale, uMacroNoiseStrength, uMicroNoiseStrength, uBranchDensity, 1.0) * uIntensity;
	        }
	        if (uHaloStrikeActive == 1 && length(uHaloStrikeTarget) > uStartMin + 0.001 * uBo) {
	          float strikeAngle = atan(uHaloStrikeTarget.x, uHaloStrikeTarget.y);
	          float strikeStartR = max(uStartMin, 0.5 * uBo);
	          float strikeLen = max(0.001 * uBo, length(uHaloStrikeTarget) - strikeStartR);
	          color += proceduralBolt(p, strikeAngle, strikeStartR, strikeLen, 900.0 + uHaloStrikeSeed, uHaloStrikeTime, uMacroNoiseScale, uMacroNoiseStrength, uMicroNoiseStrength, uBranchDensity, 1.0) * uIntensity * 1.25;
	        }
	        if (uMasterBoltActive == 1 && length(uMasterBoltTarget) > uStartMin + 0.001 * uBo) {
	          float masterAngle = atan(uMasterBoltTarget.x, uMasterBoltTarget.y);
	          float masterStartR = max(uStartMin, 0.5 * uBo);
	          float masterLen = max(0.001 * uBo, length(uMasterBoltTarget) - masterStartR);
	          float masterMacroScale = max(0.1, uMacroNoiseScale * uMasterMacroScaleMultiplier);
	          float masterMacroStrength = clamp(uMacroNoiseStrength * uMasterMacroBendMultiplier, 0.0, 2.0);
	          float masterMicroStrength = clamp(uMicroNoiseStrength * uMasterMicroJitterMultiplier, 0.0, 2.0);
	          float masterBranchDensity = clamp(uBranchDensity * uMasterBranchDensityMultiplier, 0.0, 1.0);
	          color += proceduralBolt(p, masterAngle, masterStartR, masterLen, 1400.0 + uMasterBoltSeed, uMasterBoltTime, masterMacroScale, masterMacroStrength, masterMicroStrength, masterBranchDensity, uMasterBaseWidthMultiplier) * uIntensity * 1.65;
	        }
	        color = 1.0 - exp(-color * 0.55);
        float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function createTesla1Preview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let coreGlowRuntime = null;
  let masterLayer = null;
  let haloLayer = null;
  let haloShellMesh = null;
  let haloShellRadius = 0;
  let shapeLayer = null;
  let fieldMesh = null;
  let fieldPlaneSize = 0;
  let createdAt = 0;
  let haloStrikeState = {
    activeUntil: 0,
    nextAt: 0,
    seed: 0,
    slot: -1,
    snapshotTime: 0,
    target: new THREE.Vector2(0, 0),
  };
  let masterBoltState = {
    activeUntil: 0,
    nextAt: 0,
    seed: 0,
    snapshotTime: 0,
    target: new THREE.Vector2(0, 0),
  };

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function clearLayer(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      disposeObject(child);
    }
  }

  function destroyInspector() {
    if (coreGlowRuntime && typeof coreGlowRuntime.destroy === "function") coreGlowRuntime.destroy();
    coreGlowRuntime = null;
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    masterLayer = null;
    haloLayer = null;
    haloShellMesh = null;
    haloShellRadius = 0;
    shapeLayer = null;
    fieldMesh = null;
    fieldPlaneSize = 0;
    resetHaloStrikeState();
    resetMasterBoltState();
  }

  function readMasterBoltConfig() {
    const minRange = readInputNumber(els.tesla1MasterBoltMinRangeBo, 4, 0, 64);
    const frequencyMinMs = Math.round(readInputNumber(els.tesla1MasterBoltFrequencyMinMs, 900, 16, 60000));
    return Object.freeze({
      enabled: !els.tesla1MasterBoltVisibleBtn || els.tesla1MasterBoltVisibleBtn.getAttribute("aria-pressed") !== "false",
      minRange,
      maxRange: readInputNumber(els.tesla1MasterBoltMaxRangeBo, 8, minRange + 0.25, 64),
      frequencyMinMs,
      frequencyMaxMs: Math.round(readInputNumber(els.tesla1MasterBoltFrequencyMaxMs, 1400, frequencyMinMs, 60000)),
      bend: readInputNumber(els.tesla1MasterBoltPathBendAllowance, 1.4, 1, 8),
      macroBendMultiplier: readInputNumber(els.tesla1MasterBoltMacroBendMultiplier, 1.75, 0, 8),
      macroScaleMultiplier: readInputNumber(els.tesla1MasterBoltMacroScaleMultiplier, 0.65, 0.05, 8),
      microJitterMultiplier: readInputNumber(els.tesla1MasterBoltMicroJitterMultiplier, 1, 0, 8),
      branchDensityMultiplier: readInputNumber(els.tesla1MasterBoltBranchDensityMultiplier, 1, 0, 8),
      baseWidthMultiplier: readInputNumber(els.tesla1MasterBoltBaseWidthMultiplier, 1, 0.05, 16),
    });
  }

  function readOrbLightConfig() {
    const enabled = readInputBoolean(els.tesla1OrbLightOverrideEnabled, true);
    const flashDurationMinMs = Math.round(readInputNumber(els.tesla1OrbLightFlashDurationMinMs, 35, 8, 1000));
    return Object.freeze({
      enabled,
      color: rgbHex(
        els.tesla1OrbLightColorR && els.tesla1OrbLightColorR.value,
        els.tesla1OrbLightColorG && els.tesla1OrbLightColorG.value,
        els.tesla1OrbLightColorB && els.tesla1OrbLightColorB.value
      ),
      intensity: readInputNumber(els.tesla1OrbLightIntensity, 180, 0, 10000),
      distanceBo: readInputNumber(els.tesla1OrbLightDistanceBo, 24, 0, 1000),
      flashIntensityMultiplier: readInputNumber(els.tesla1OrbLightFlashIntensityMultiplier, 4, 1, 100),
      flashDurationMinMs,
      flashDurationMaxMs: Math.round(readInputNumber(els.tesla1OrbLightFlashDurationMaxMs, 90, flashDurationMinMs, 1000)),
      flashDecayCurve: readInputNumber(els.tesla1OrbLightFlashDecayCurve, 2.4, 0.1, 8),
    });
  }

  function readCoreGlowConfig() {
    return Object.freeze({
      coreGlowEnabled: readInputBoolean(els.tesla1CoreGlowEnabled, true),
      coreGlowRadiusBo: readInputNumber(els.tesla1CoreGlowRadiusBo, 0.64, 0.05, 4),
      coreGlowLuminance: readInputNumber(els.tesla1CoreGlowLuminance, 5.5, 0, 80),
      coreGlowGlobalAlpha: readInputNumber(els.tesla1CoreGlowGlobalAlpha, 0.45, 0, 1),
      coreGlowCenterAlpha: readInputNumber(els.tesla1CoreGlowCenterAlpha, 0.42, 0, 1),
      coreGlowEdgeAlpha: readInputNumber(els.tesla1CoreGlowEdgeAlpha, 0.16, 0, 1),
      coreGlowEdgeSoftness: readInputNumber(els.tesla1CoreGlowEdgeSoftness, 2.8, 0.1, 12),
      coreGlowDisplacementBo: readInputNumber(els.tesla1CoreGlowDisplacementBo, 0.055, 0, 2),
      coreGlowNoiseScale: readInputNumber(els.tesla1CoreGlowNoiseScale, 5.8, 0.1, 64),
      coreGlowNoiseSpeed: readInputNumber(els.tesla1CoreGlowNoiseSpeed, 2.4, 0, 32),
      coreGlowPulseAmount: readInputNumber(els.tesla1CoreGlowPulseAmount, 0.65, 0, 8),
      orbLightColorR: readInputNumber(els.tesla1OrbLightColorR, 128, 0, 255),
      orbLightColorG: readInputNumber(els.tesla1OrbLightColorG, 190, 0, 255),
      orbLightColorB: readInputNumber(els.tesla1OrbLightColorB, 255, 0, 255),
    });
  }

  function masterRoute(bo, time, master = readMasterBoltConfig()) {
    const minRange = master.minRange;
    const maxRange = master.maxRange;
    const angle = time * 0.28 + 0.75;
    const radius = bo * (minRange + (maxRange - minRange) * (0.5 + 0.5 * Math.sin(time * 0.41)));
    const start = new THREE.Vector3(Math.cos(angle) * bo * ORB_RADIUS_BO, Math.sin(angle) * bo * ORB_RADIUS_BO, 0);
    const end = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    const bend = master.bend;
    if (bend <= 1.05) return [start, end];
    const normal = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const steer = start.clone().lerp(end, 0.55).add(normal.multiplyScalar(bo * Math.min(1.25, (bend - 1) * 0.4)));
    return [start, steer, end];
  }

  function readShapeConfig() {
    const boltMin = Math.round(readInputNumber(els.tesla1HaloBoltCountMin, 4, 0, 256));
    const boltMax = Math.round(readInputNumber(els.tesla1HaloBoltCountMax, 12, boltMin, 256));
    const ttlMinMs = Math.round(readInputNumber(els.tesla1HaloBoltTtlMinMs, 350, 16, 10000));
    const ttlMaxMs = Math.round(readInputNumber(els.tesla1HaloBoltTtlMaxMs, 900, ttlMinMs, 10000));
    const wanderSpeedMin = readInputNumber(els.tesla1HaloBoltWanderSpeedMin, 0.05, 0, 4);
    const wanderSpeedMax = readInputNumber(els.tesla1HaloBoltWanderSpeedMax, 0.18, wanderSpeedMin, 4);
    const rpscMin = readInputNumber(els.tesla1HaloBoltRpscMin, 0.08, 0, 1);
    const rpscMax = readInputNumber(els.tesla1HaloBoltRpscMax, 0.24, rpscMin, 1);
    const turnTensionMin = readInputNumber(els.tesla1HaloBoltTurnTensionMin, 0.22, 0, 1);
    const turnTensionMax = readInputNumber(els.tesla1HaloBoltTurnTensionMax, 0.55, turnTensionMin, 1);
    const turnDampingMin = readInputNumber(els.tesla1HaloBoltTurnDampingMin, 0.04, 0, 1);
    const turnDampingMax = readInputNumber(els.tesla1HaloBoltTurnDampingMax, 0.18, turnDampingMin, 1);
    const dispersion = readInputNumber(els.tesla1HaloBoltDispersion, 0.2, 0, 1);
    const noiseSpeedMin = readInputNumber(els.tesla1LightningShapeNoiseSpeedMin, 2, 0, 20);
    const branchLengthMin = readInputNumber(els.tesla1LightningShapeBranchLengthMinBo, 0.06, 0, 8);
    const branchAngleMin = readInputNumber(els.tesla1LightningShapeBranchAngleMinDeg, 35, 0, 170);
    const widthLengthMin = readInputNumber(els.tesla1LightningShapeWidthLengthMinBo, 0.5, 0.001, 1000);
    const baseWidthMin = readInputNumber(els.tesla1LightningShapeBaseWidthMinBo, 0.003, 0.0001, 32);
    return Object.freeze({
      boltCountMin: boltMin,
      boltCountMax: boltMax,
      ttlMinMs,
      ttlMaxMs,
      wanderSpeedMin,
      wanderSpeedMax,
      rpscMin,
      rpscMax,
      turnTensionMin,
      turnTensionMax,
      turnDampingMin,
      turnDampingMax,
      dispersion,
      macroNoiseScale: readInputNumber(els.tesla1LightningShapeMacroNoiseScale, 7, 0.1, 200),
      macroNoiseStrength: readInputNumber(els.tesla1LightningShapeMacroNoiseStrength, 0.15, 0, 0.5),
      microNoiseScale: readInputNumber(els.tesla1LightningShapeMicroNoiseScale, 42, 0.1, 300),
      microNoiseStrength: readInputNumber(els.tesla1LightningShapeMicroNoiseStrength, 0.025, 0, 0.5),
      noiseSpeedMin,
      noiseSpeedMax: readInputNumber(els.tesla1LightningShapeNoiseSpeedMax, 3, noiseSpeedMin, 20),
      branchDensity: readInputNumber(els.tesla1LightningShapeBranchDensity, 0, 0, 1),
      branchLengthMin,
      branchLengthMax: readInputNumber(els.tesla1LightningShapeBranchLengthMaxBo, 0.22, branchLengthMin, 8),
      branchAngleMin,
      branchAngleMax: readInputNumber(els.tesla1LightningShapeBranchAngleMaxDeg, 80, branchAngleMin, 170),
      widthLengthMin,
      widthLengthMax: readInputNumber(els.tesla1LightningShapeWidthLengthMaxBo, 8, widthLengthMin + 0.001, 1000),
      baseWidthMin,
      baseWidthMax: readInputNumber(els.tesla1LightningShapeBaseWidthMaxBo, 0.04, baseWidthMin, 32),
      widthMagnitudeCurve: readInputNumber(els.tesla1LightningShapeWidthMagnitudeCurve, 1, 0.05, 8),
      taperCurve: readInputNumber(els.tesla1LightningShapeTaperCurve, 1, 0.05, 8),
      tipWidthRatio: readInputNumber(els.tesla1LightningShapeTipWidthRatio, 0.12, 0.001, 2),
      branchWidthRatio: readInputNumber(els.tesla1LightningShapeBranchWidthRatio, 0.55, 0.001, 4),
    });
  }

  function readHaloStrikeConfig() {
    const rangeMin = readInputNumber(els.tesla1HaloStrikeRangeMinBo, 1, 0, 64);
    const cooldownMinMs = Math.round(readInputNumber(els.tesla1HaloStrikeCooldownMinMs, 650, 16, 60000));
    const hangTimeMinMs = Math.round(readInputNumber(els.tesla1HaloStrikeHangTimeMinMs, 250, 16, 5000));
    const hitRadiusMin = readInputNumber(els.tesla1HaloStrikeHitRadiusMinBo, 0.12, 0.01, 16);
    const damageMin = readInputNumber(els.tesla1HaloStrikeDamageMin, 0, 0, 10000);
    const stunDamageMin = readInputNumber(els.tesla1HaloStrikeStunDamageMin, 1, 0, 10000);
    return Object.freeze({
      enabled: readInputBoolean(els.tesla1HaloStrikeEnabled, false),
      rangeMin,
      rangeMax: readInputNumber(els.tesla1HaloStrikeRangeMaxBo, 5, Math.max(0.01, rangeMin), 64),
      cooldownMinMs,
      cooldownMaxMs: Math.round(readInputNumber(els.tesla1HaloStrikeCooldownMaxMs, 1400, cooldownMinMs, 60000)),
      hangTimeMinMs,
      hangTimeMaxMs: Math.round(readInputNumber(els.tesla1HaloStrikeHangTimeMaxMs, 500, hangTimeMinMs, 5000)),
      hitRadiusMin,
      hitRadiusMax: readInputNumber(els.tesla1HaloStrikeHitRadiusMaxBo, 0.28, hitRadiusMin, 16),
      damageMin,
      damageMax: readInputNumber(els.tesla1HaloStrikeDamageMax, 0, damageMin, 10000),
      stunDamageMin,
      stunDamageMax: readInputNumber(els.tesla1HaloStrikeStunDamageMax, 3, stunDamageMin, 10000),
    });
  }

  function resetHaloStrikeState() {
    haloStrikeState = {
      activeUntil: 0,
      nextAt: 0,
      seed: 0,
      slot: -1,
      snapshotTime: 0,
      target: new THREE.Vector2(0, 0),
    };
  }

  function resetMasterBoltState() {
    masterBoltState = {
      activeUntil: 0,
      nextAt: 0,
      seed: 0,
      snapshotTime: 0,
      target: new THREE.Vector2(0, 0),
    };
  }

  function updateHaloStrikeState({ bo, shape, strike, time } = {}) {
    if (!strike || !strike.enabled || !shape || shape.boltCountMax <= 0) {
      haloStrikeState.activeUntil = 0;
      return haloStrikeState;
    }
    if (time < haloStrikeState.activeUntil) return haloStrikeState;
    if (!haloStrikeState.nextAt || time >= haloStrikeState.nextAt) {
      const seed = Math.floor((time * 997) + haloStrikeState.seed * 17 + 1) % 100000;
      const rangeRoll = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
      const angleRoll = (Math.sin(seed * 78.233) * 24634.6345) % 1;
      const cooldownRoll = (Math.sin(seed * 39.425) * 14233.2341) % 1;
      const hangRoll = (Math.sin(seed * 51.179) * 31415.9265) % 1;
      const slotRoll = (Math.sin(seed * 93.989) * 96541.123) % 1;
      const range = strike.rangeMin + (strike.rangeMax - strike.rangeMin) * Math.abs(rangeRoll);
      const angle = Math.abs(angleRoll) * Math.PI * 2;
      const cooldownMs = strike.cooldownMinMs + (strike.cooldownMaxMs - strike.cooldownMinMs) * Math.abs(cooldownRoll);
      const hangMs = strike.hangTimeMinMs + (strike.hangTimeMaxMs - strike.hangTimeMinMs) * Math.abs(hangRoll);
      const countMax = Math.max(1, Math.min(MAX_HALO_BOLTS, Math.round(shape.boltCountMax || 1)));
      haloStrikeState.seed = seed;
      haloStrikeState.slot = Math.floor(Math.abs(slotRoll) * countMax) % countMax;
      haloStrikeState.snapshotTime = time;
      haloStrikeState.target.set(Math.cos(angle) * range * bo, Math.sin(angle) * range * bo);
      haloStrikeState.activeUntil = time + Math.max(0.016, hangMs / 1000);
      haloStrikeState.nextAt = time + Math.max(0.016, cooldownMs / 1000);
    }
    return haloStrikeState;
  }

  function updateMasterBoltState({ bo, master, time } = {}) {
    if (!master || !master.enabled) {
      masterBoltState.activeUntil = 0;
      return masterBoltState;
    }
    if (time < masterBoltState.activeUntil) return masterBoltState;
    if (!masterBoltState.nextAt || time >= masterBoltState.nextAt) {
      const seed = Math.floor((time * 571) + masterBoltState.seed * 31 + 7) % 100000;
      const rangeRoll = (Math.sin(seed * 19.9898) * 63858.5453) % 1;
      const angleRoll = (Math.sin(seed * 48.233) * 38634.6345) % 1;
      const frequencyRoll = (Math.sin(seed * 29.425) * 19233.2341) % 1;
      const range = master.minRange + (master.maxRange - master.minRange) * Math.abs(rangeRoll);
      const angle = Math.abs(angleRoll) * Math.PI * 2;
      const frequencyMs = master.frequencyMinMs + (master.frequencyMaxMs - master.frequencyMinMs) * Math.abs(frequencyRoll);
      masterBoltState.seed = seed;
      masterBoltState.snapshotTime = time;
      masterBoltState.target.set(Math.cos(angle) * range * bo, Math.sin(angle) * range * bo);
      masterBoltState.activeUntil = time + 0.22;
      masterBoltState.nextAt = time + Math.max(0.016, frequencyMs / 1000);
    }
    return masterBoltState;
  }

  function syncMasterLayer(bo, time) {
    if (!masterLayer) return;
    clearLayer(masterLayer);
    const master = readMasterBoltConfig();
    masterLayer.visible = master.enabled;
    const route = masterRoute(bo, time, master);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route),
      new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false, toneMapped: false })
    );
    line.name = "tesla1:master_bolt_route";
    line.renderOrder = 218;
    masterLayer.add(line);
    const pointGeometry = new THREE.SphereGeometry(bo * 0.025, 12, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, depthWrite: false, toneMapped: false });
    route.forEach((point, index) => {
      const marker = new THREE.Mesh(pointGeometry, pointMaterial);
      marker.name = `tesla1:master_control_point_${index}`;
      marker.position.copy(point);
      marker.renderOrder = 219;
      masterLayer.add(marker);
    });
  }

  function syncHaloLayer(bo) {
    if (!haloLayer) return;
    haloLayer.visible = !els.tesla1HaloVisibleBtn || els.tesla1HaloVisibleBtn.getAttribute("aria-pressed") !== "false";
    if (!readInputBoolean(els.tesla1HaloFieldEnabled, true)) {
      if (haloShellMesh) {
        haloLayer.remove(haloShellMesh);
        disposeObject(haloShellMesh);
        haloShellMesh = null;
        haloShellRadius = 0;
      }
      return;
    }
    const radius = readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32) * bo;
    if (!haloShellMesh) {
      haloShellMesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 16),
        new THREE.MeshBasicMaterial({
          color: 0x376fff,
          transparent: true,
          opacity: 0.12,
          wireframe: true,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        })
      );
      haloShellMesh.name = "tesla1:halo_envelope";
      haloShellMesh.renderOrder = 210;
      haloLayer.add(haloShellMesh);
      haloShellRadius = radius;
      return;
    }
    if (Math.abs(haloShellRadius - radius) > 0.5) {
      if (haloShellMesh.geometry && typeof haloShellMesh.geometry.dispose === "function") haloShellMesh.geometry.dispose();
      haloShellMesh.geometry = new THREE.SphereGeometry(radius, 32, 16);
      haloShellRadius = radius;
    }
  }

  function syncShapeLayer(bo, time) {
    if (!shapeLayer) return;
    shapeLayer.visible = !els.tesla1LightningShapeVisibleBtn || els.tesla1LightningShapeVisibleBtn.getAttribute("aria-pressed") !== "false";
    const shape = readShapeConfig();
    const strike = readHaloStrikeConfig();
    const master = readMasterBoltConfig();
    const strikeState = updateHaloStrikeState({ bo, shape, strike, time });
    const masterState = updateMasterBoltState({ bo, master, time });
    const startMin = readInputNumber(els.tesla1HaloFieldBoltStartMinBo, 0, 0, 32);
    const startMax = readInputNumber(els.tesla1HaloFieldBoltStartMaxBo, 0.15, startMin, 32);
    const endMin = readInputNumber(els.tesla1HaloFieldBoltEndMinBo, 1.1, Math.max(0.01, startMin), 32);
    const endMax = readInputNumber(els.tesla1HaloFieldBoltEndMaxBo, 1.6, endMin, 32);
    if (!readInputBoolean(els.tesla1BoltShaderEnabled, true)) {
      clearLayer(shapeLayer);
      fieldMesh = null;
      fieldPlaneSize = 0;
      return;
    }
    const boltColor = rgbColor(els.tesla1BoltShaderColorR && els.tesla1BoltShaderColorR.value, els.tesla1BoltShaderColorG && els.tesla1BoltShaderColorG.value, els.tesla1BoltShaderColorB && els.tesla1BoltShaderColorB.value);
    const maxRangeBo = Math.max(ORB_RADIUS_BO + endMax, ORB_RADIUS_BO + startMax, ORB_RADIUS_BO + master.maxRange, readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32));
    const planeSize = bo * Math.max(2.5, maxRangeBo * 2.45);
    const materialParams = {
      boltCountMin: shape.boltCountMin,
      boltCountMax: shape.boltCountMax,
      startMin: bo * (ORB_RADIUS_BO + startMin),
      startMax: bo * (ORB_RADIUS_BO + startMax),
      endMin: bo * (ORB_RADIUS_BO + endMin),
      endMax: bo * (ORB_RADIUS_BO + endMax),
      bo,
      boltColor,
      intensity: readInputNumber(els.tesla1BoltShaderIntensity, 6, 0, 20),
      tipFade: readInputNumber(els.tesla1BoltShaderTipFade, 0.08, 0, 1),
      flickerHz: readInputNumber(els.tesla1BoltShaderFlickerSpeedHz, 4, 0, 60),
      flickerDepth: readInputNumber(els.tesla1BoltShaderFlickerDepth, 0.5, 0, 1),
      macroNoiseScale: shape.macroNoiseScale,
      macroNoiseStrength: shape.macroNoiseStrength,
      microNoiseScale: shape.microNoiseScale,
      microNoiseStrength: shape.microNoiseStrength,
      noiseSpeedMin: shape.noiseSpeedMin,
      noiseSpeedMax: shape.noiseSpeedMax,
      branchDensity: shape.branchDensity,
      branchLengthMin: bo * shape.branchLengthMin,
      branchLengthMax: bo * shape.branchLengthMax,
      branchAngleMin: shape.branchAngleMin,
      branchAngleMax: shape.branchAngleMax,
      widthLengthMin: bo * shape.widthLengthMin,
      widthLengthMax: bo * shape.widthLengthMax,
      baseWidthMin: bo * shape.baseWidthMin,
      baseWidthMax: bo * shape.baseWidthMax,
      widthMagnitudeCurve: shape.widthMagnitudeCurve,
      taperCurve: shape.taperCurve,
      tipWidthRatio: shape.tipWidthRatio,
      branchWidthRatio: shape.branchWidthRatio,
      ttlMinMs: shape.ttlMinMs,
      ttlMaxMs: shape.ttlMaxMs,
      wanderSpeedMin: shape.wanderSpeedMin,
      wanderSpeedMax: shape.wanderSpeedMax,
      rpscMin: shape.rpscMin,
      rpscMax: shape.rpscMax,
      turnTensionMin: shape.turnTensionMin,
      turnTensionMax: shape.turnTensionMax,
      turnDampingMin: shape.turnDampingMin,
      turnDampingMax: shape.turnDampingMax,
      dispersion: shape.dispersion,
      haloStrikeActive: strike.enabled && time < strikeState.activeUntil,
      haloStrikeSlot: strikeState.slot,
      haloStrikeTarget: strikeState.target,
      haloStrikeSeed: strikeState.seed,
      haloStrikeTime: time,
      masterBoltActive: master.enabled && time < masterState.activeUntil,
      masterBoltTarget: masterState.target,
      masterBoltSeed: masterState.seed,
      masterBoltTime: time,
      masterMacroBendMultiplier: master.macroBendMultiplier,
      masterMacroScaleMultiplier: master.macroScaleMultiplier,
      masterMicroJitterMultiplier: master.microJitterMultiplier,
      masterBranchDensityMultiplier: master.branchDensityMultiplier,
      masterBaseWidthMultiplier: master.baseWidthMultiplier,
      time,
    };
    if (!fieldMesh || !fieldMesh.parent) {
      clearLayer(shapeLayer);
      const material = createLightningFieldMaterial(materialParams);
      fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize, 1, 1), material);
      fieldMesh.name = "tesla1:sdf_lightning_field";
      fieldMesh.renderOrder = 214;
      fieldPlaneSize = planeSize;
      shapeLayer.add(fieldMesh);
      return;
    }
    updateLightningFieldMaterial(fieldMesh.material, materialParams);
    if (Math.abs(fieldPlaneSize - planeSize) > 0.5) {
      if (fieldMesh.geometry && typeof fieldMesh.geometry.dispose === "function") fieldMesh.geometry.dispose();
      fieldMesh.geometry = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1);
      fieldPlaneSize = planeSize;
    }
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    const bo = readBo();
    const orbLightConfig = readOrbLightConfig();
    const activeConfig = orbLightConfig.enabled
      ? {
          ...ORB_3D_VISUAL_DEFAULTS,
          lightColor: orbLightConfig.color,
          lightIntensity: orbLightConfig.intensity,
          lightDistanceBO: orbLightConfig.distanceBo,
          lightPastelMix: 0,
        }
      : ORB_3D_VISUAL_DEFAULTS;
    createdAt = performance.now();
    resetHaloStrikeState();
    resetMasterBoltState();
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "tesla1Canvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      enableShadows: true,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
        if (coreGlowRuntime) coreGlowRuntime.update(performance.now(), { config: readCoreGlowConfig(), pulseMultiplier: 1 });
        syncHaloLayer(bo);
        syncShapeLayer(bo, time);
      },
    });
    if (!inspector) return activeConfig;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);
    shellMaterial = createOpalescentOrbShellMaterial(activeConfig);
    const created = createOrbModel({
      bo,
      shellMaterial,
      edgeMaterials: inspector.edgeMaterials,
      includeCore: false,
      includeRibs: false,
      edgeColor: 0xffffff,
      edgeWidth: 2,
      shellSegments: 96,
      ringSegments: 192,
    });
    model = created.model;
    coreGlowRuntime = createTesla1CoreGlowRuntime({
      getOrbModel: () => model,
      getBo: () => bo,
      now: () => performance.now(),
      onNeedsFrame: () => {},
      renderOrder: 212,
    });
    if (els.tesla1OrbVisibleBtn) model.visible = els.tesla1OrbVisibleBtn.getAttribute("aria-pressed") !== "false";
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    masterLayer = new THREE.Group();
    masterLayer.name = "tesla1:master_bolt_control_layer";
    haloLayer = new THREE.Group();
    haloLayer.name = "tesla1:halo_envelope_layer";
    shapeLayer = new THREE.Group();
    shapeLayer.name = "tesla1:lightning_shape_layer";
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.scene.add(haloLayer);
    inspector.scene.add(shapeLayer);
    inspector.scene.add(masterLayer);
    syncMasterLayer(bo, 0);
    if (coreGlowRuntime) coreGlowRuntime.update(performance.now(), { config: readCoreGlowConfig(), pulseMultiplier: 1 });
    syncHaloLayer(bo);
    syncShapeLayer(bo, 0);
    inspector.render();
    return activeConfig;
  }

  function clear() {
    destroyInspector();
  }

  function toggleLayer(button, layer) {
    if (!button) return;
    const visible = button.getAttribute("aria-pressed") !== "false";
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    if (layer) layer.visible = !visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function wire() {
    apply();
    const refreshOnCommit = (event) => {
      if (event && event.type === "keydown" && event.key !== "Enter") return;
      apply();
    };
    if (els.previewTesla1) els.previewTesla1.addEventListener("click", apply);
    if (els.tesla1OrbVisibleBtn) els.tesla1OrbVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1OrbVisibleBtn, model));
    if (els.tesla1MasterBoltVisibleBtn) els.tesla1MasterBoltVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1MasterBoltVisibleBtn, masterLayer));
    if (els.tesla1HaloVisibleBtn) els.tesla1HaloVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1HaloVisibleBtn, haloLayer));
    if (els.tesla1LightningShapeVisibleBtn) els.tesla1LightningShapeVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1LightningShapeVisibleBtn, shapeLayer));
    [
      els.tesla1MasterBoltMinRangeBo,
      els.tesla1MasterBoltMaxRangeBo,
      els.tesla1MasterBoltFrequencyMinMs,
      els.tesla1MasterBoltFrequencyMaxMs,
      els.tesla1MasterBoltContactRadiusBo,
      els.tesla1MasterBoltPathBendAllowance,
      els.tesla1MasterBoltMacroBendMultiplier,
      els.tesla1MasterBoltMacroScaleMultiplier,
      els.tesla1MasterBoltMicroJitterMultiplier,
      els.tesla1MasterBoltBranchDensityMultiplier,
      els.tesla1MasterBoltBaseWidthMultiplier,
      els.tesla1OrbLightOverrideEnabled,
      els.tesla1OrbLightColorR,
      els.tesla1OrbLightColorG,
      els.tesla1OrbLightColorB,
      els.tesla1OrbLightIntensity,
      els.tesla1OrbLightDistanceBo,
      els.tesla1OrbLightFlashIntensityMultiplier,
      els.tesla1OrbLightFlashDurationMinMs,
      els.tesla1OrbLightFlashDurationMaxMs,
      els.tesla1OrbLightFlashDecayCurve,
      els.tesla1CoreGlowEnabled,
      els.tesla1CoreGlowRadiusBo,
      els.tesla1CoreGlowLuminance,
      els.tesla1CoreGlowGlobalAlpha,
      els.tesla1CoreGlowCenterAlpha,
      els.tesla1CoreGlowEdgeAlpha,
      els.tesla1CoreGlowEdgeSoftness,
      els.tesla1CoreGlowDisplacementBo,
      els.tesla1CoreGlowNoiseScale,
      els.tesla1CoreGlowNoiseSpeed,
      els.tesla1CoreGlowPulseAmount,
      els.tesla1HaloFieldEnabled,
      els.tesla1HaloFieldShellRadiusBo,
      els.tesla1HaloFieldBoltStartMinBo,
      els.tesla1HaloFieldBoltStartMaxBo,
      els.tesla1HaloFieldBoltEndMinBo,
      els.tesla1HaloFieldBoltEndMaxBo,
      els.tesla1HaloBoltCountMin,
      els.tesla1HaloBoltCountMax,
      els.tesla1HaloBoltTtlMinMs,
      els.tesla1HaloBoltTtlMaxMs,
      els.tesla1HaloBoltWanderSpeedMin,
      els.tesla1HaloBoltWanderSpeedMax,
      els.tesla1HaloBoltRpscMin,
      els.tesla1HaloBoltRpscMax,
      els.tesla1HaloBoltTurnTensionMin,
      els.tesla1HaloBoltTurnTensionMax,
      els.tesla1HaloBoltTurnDampingMin,
      els.tesla1HaloBoltTurnDampingMax,
      els.tesla1HaloBoltDispersion,
      els.tesla1HaloStrikeEnabled,
      els.tesla1HaloStrikeRangeMinBo,
      els.tesla1HaloStrikeRangeMaxBo,
      els.tesla1HaloStrikeCooldownMinMs,
      els.tesla1HaloStrikeCooldownMaxMs,
      els.tesla1HaloStrikeHangTimeMinMs,
      els.tesla1HaloStrikeHangTimeMaxMs,
      els.tesla1HaloStrikeHitRadiusMinBo,
      els.tesla1HaloStrikeHitRadiusMaxBo,
      els.tesla1HaloStrikeDamageMin,
      els.tesla1HaloStrikeDamageMax,
      els.tesla1HaloStrikeStunDamageMin,
      els.tesla1HaloStrikeStunDamageMax,
      els.tesla1LightningShapeMacroNoiseScale,
      els.tesla1LightningShapeMacroNoiseStrength,
      els.tesla1LightningShapeMicroNoiseScale,
      els.tesla1LightningShapeMicroNoiseStrength,
      els.tesla1LightningShapeNoiseSpeedMin,
      els.tesla1LightningShapeNoiseSpeedMax,
      els.tesla1LightningShapeBranchDensity,
      els.tesla1LightningShapeBranchLengthMinBo,
      els.tesla1LightningShapeBranchLengthMaxBo,
      els.tesla1LightningShapeBranchAngleMinDeg,
      els.tesla1LightningShapeBranchAngleMaxDeg,
      els.tesla1LightningShapeWidthLengthMinBo,
      els.tesla1LightningShapeWidthLengthMaxBo,
      els.tesla1LightningShapeBaseWidthMinBo,
      els.tesla1LightningShapeBaseWidthMaxBo,
      els.tesla1LightningShapeWidthMagnitudeCurve,
      els.tesla1LightningShapeTaperCurve,
      els.tesla1LightningShapeTipWidthRatio,
      els.tesla1LightningShapeBranchWidthRatio,
      els.tesla1BoltShaderEnabled,
      els.tesla1BoltShaderIntensity,
      els.tesla1BoltShaderTipFade,
      els.tesla1BoltShaderFlickerSpeedHz,
      els.tesla1BoltShaderFlickerDepth,
      els.tesla1BoltShaderColorR,
      els.tesla1BoltShaderColorG,
      els.tesla1BoltShaderColorB,
    ].forEach((field) => {
      if (!field) return;
      field.addEventListener("keydown", refreshOnCommit);
      field.addEventListener("change", refreshOnCommit);
      field.addEventListener("blur", refreshOnCommit);
    });
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
