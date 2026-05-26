import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import { TESLA_1_PRESET_DEFAULT } from "../vfx/presets/tesla-1-default.js";
import { TESLA_1_BEHAVIOR_DEFAULT } from "../game-runtime/behaviors/tesla-1-behavior-default.js";

const ORB_RADIUS_BO = 0.5;
const MAX_HALO_BOLTS = 32;
const TESLA_HALO_INTERNAL_LINE_WIDTH_BO = 0.012;
const TESLA_SHADER_TIME_RING_SECONDS = 32;

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function randomBetween(min = 0, max = 0) {
  const lo = Number(min);
  const hi = Number(max);
  const safeLo = Number.isFinite(lo) ? lo : 0;
  const safeHi = Math.max(safeLo, Number.isFinite(hi) ? hi : safeLo);
  return safeLo + Math.random() * (safeHi - safeLo);
}

function rgbColor(r = 255, g = 255, b = 255) {
  return new THREE.Color(
    clampNumber(r, 0, 255, 255) / 255,
    clampNumber(g, 0, 255, 255) / 255,
    clampNumber(b, 0, 255, 255) / 255
  );
}

function normalizeEnemyTarget(target = null) {
  if (!target || typeof target !== "object") return null;
  const position = target.position && typeof target.position === "object" ? target.position : target;
  const xW = Number(position.xW);
  const yW = Number(position.yW);
  if (!Number.isFinite(xW) || !Number.isFinite(yW)) return null;
  return Object.freeze({
    ...target,
    id: target.id == null ? "" : String(target.id),
    index: Number.isFinite(Number(target.index)) ? Number(target.index) : null,
    position: Object.freeze({ xW, yW }),
    radiusBo: Math.max(0.05, Number(target.radiusBo) || 0.25),
    targetEntityId: target.targetEntityId == null ? String(target.id || "") : String(target.targetEntityId),
  });
}

export function normalizeTesla1RuntimeConfig(raw = {}) {
  const rawSource = raw && typeof raw === "object" ? raw : {};
  const source = {
    ...TESLA_1_PRESET_DEFAULT,
    ...TESLA_1_BEHAVIOR_DEFAULT,
    ...rawSource,
    ...(rawSource.behavior && typeof rawSource.behavior === "object" ? rawSource.behavior : {}),
  };
  const haloBoltCountMin = Math.round(clampNumber(source.haloBoltCountMin, 0, MAX_HALO_BOLTS, TESLA_1_PRESET_DEFAULT.haloBoltCountMin));
  const haloBoltTtlMinMs = Math.round(clampNumber(source.haloBoltTtlMinMs, 16, 10000, TESLA_1_PRESET_DEFAULT.haloBoltTtlMinMs));
  const haloBoltWanderSpeedMin = clampNumber(source.haloBoltWanderSpeedMin, 0, 4, TESLA_1_PRESET_DEFAULT.haloBoltWanderSpeedMin);
  const haloBoltRpscMin = clampNumber(source.haloBoltRpscMin, 0, 1, TESLA_1_PRESET_DEFAULT.haloBoltRpscMin);
  const haloBoltTurnTensionMin = clampNumber(source.haloBoltTurnTensionMin, 0, 1, TESLA_1_PRESET_DEFAULT.haloBoltTurnTensionMin);
  const haloBoltTurnDampingMin = clampNumber(source.haloBoltTurnDampingMin, 0, 1, TESLA_1_PRESET_DEFAULT.haloBoltTurnDampingMin);
  const haloFieldBoltStartMinBo = clampNumber(source.haloFieldBoltStartMinBo, 0, 32, TESLA_1_PRESET_DEFAULT.haloFieldBoltStartMinBo);
  const haloFieldBoltEndMinBo = clampNumber(source.haloFieldBoltEndMinBo, Math.max(0.01, haloFieldBoltStartMinBo), 32, TESLA_1_PRESET_DEFAULT.haloFieldBoltEndMinBo);
  const lightningShapeNoiseSpeedMin = clampNumber(source.lightningShapeNoiseSpeedMin, 0, 20, TESLA_1_PRESET_DEFAULT.lightningShapeNoiseSpeedMin);
  const lightningShapeBranchLengthMinBo = clampNumber(source.lightningShapeBranchLengthMinBo, 0, 8, TESLA_1_PRESET_DEFAULT.lightningShapeBranchLengthMinBo);
  const lightningShapeBranchAngleMinDeg = clampNumber(source.lightningShapeBranchAngleMinDeg, 0, 170, TESLA_1_PRESET_DEFAULT.lightningShapeBranchAngleMinDeg);
  const haloStrikeRangeMinBo = clampNumber(source.haloStrikeRangeMinBo, 0, 64, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeRangeMinBo);
  const haloStrikeCooldownMinMs = Math.round(clampNumber(source.haloStrikeCooldownMinMs, 16, 60000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeCooldownMinMs));
  const haloStrikeHangTimeMinMs = Math.round(clampNumber(source.haloStrikeHangTimeMinMs, 16, 5000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeHangTimeMinMs));
  const haloStrikeHitRadiusMinBo = clampNumber(source.haloStrikeHitRadiusMinBo, 0.01, 16, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeHitRadiusMinBo);
  const haloStrikeDamageMin = clampNumber(source.haloStrikeDamageMin, 0, 10000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeDamageMin);
  const haloStrikeStunDamageMin = clampNumber(source.haloStrikeStunDamageMin, 0, 10000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeStunDamageMin);
  return Object.freeze({
    durationMs: Math.round(clampNumber(source.durationMs, 200, 60000, TESLA_1_PRESET_DEFAULT.durationMs)),
    haloFieldEnabled: source.haloFieldEnabled !== false && source.haloFieldEnabled !== 0,
    haloFieldShellRadiusBo: clampNumber(source.haloFieldShellRadiusBo, 0.5, 32, TESLA_1_PRESET_DEFAULT.haloFieldShellRadiusBo),
    haloFieldBoltStartMinBo,
    haloFieldBoltStartMaxBo: clampNumber(source.haloFieldBoltStartMaxBo, haloFieldBoltStartMinBo, 32, TESLA_1_PRESET_DEFAULT.haloFieldBoltStartMaxBo),
    haloFieldBoltEndMinBo,
    haloFieldBoltEndMaxBo: clampNumber(source.haloFieldBoltEndMaxBo, haloFieldBoltEndMinBo, 32, TESLA_1_PRESET_DEFAULT.haloFieldBoltEndMaxBo),
    haloBoltCountMin,
    haloBoltCountMax: Math.round(clampNumber(source.haloBoltCountMax, haloBoltCountMin, MAX_HALO_BOLTS, TESLA_1_PRESET_DEFAULT.haloBoltCountMax)),
    haloBoltTtlMinMs,
    haloBoltTtlMaxMs: Math.round(clampNumber(source.haloBoltTtlMaxMs, haloBoltTtlMinMs, 10000, TESLA_1_PRESET_DEFAULT.haloBoltTtlMaxMs)),
    haloBoltWanderSpeedMin,
    haloBoltWanderSpeedMax: clampNumber(source.haloBoltWanderSpeedMax, haloBoltWanderSpeedMin, 4, TESLA_1_PRESET_DEFAULT.haloBoltWanderSpeedMax),
    haloBoltRpscMin,
    haloBoltRpscMax: clampNumber(source.haloBoltRpscMax, haloBoltRpscMin, 1, TESLA_1_PRESET_DEFAULT.haloBoltRpscMax),
    haloBoltTurnTensionMin,
    haloBoltTurnTensionMax: clampNumber(source.haloBoltTurnTensionMax, haloBoltTurnTensionMin, 1, TESLA_1_PRESET_DEFAULT.haloBoltTurnTensionMax),
    haloBoltTurnDampingMin,
    haloBoltTurnDampingMax: clampNumber(source.haloBoltTurnDampingMax, haloBoltTurnDampingMin, 1, TESLA_1_PRESET_DEFAULT.haloBoltTurnDampingMax),
    haloBoltDispersion: clampNumber(source.haloBoltDispersion, 0, 1, TESLA_1_PRESET_DEFAULT.haloBoltDispersion),
    boltShaderEnabled: source.boltShaderEnabled !== false && source.boltShaderEnabled !== 0,
    boltShaderIntensity: clampNumber(source.boltShaderIntensity, 0, 20, TESLA_1_PRESET_DEFAULT.boltShaderIntensity),
    boltShaderTipFade: clampNumber(source.boltShaderTipFade, 0, 1, TESLA_1_PRESET_DEFAULT.boltShaderTipFade),
    boltShaderFlickerSpeedHz: clampNumber(source.boltShaderFlickerSpeedHz, 0, 60, TESLA_1_PRESET_DEFAULT.boltShaderFlickerSpeedHz),
    boltShaderFlickerDepth: clampNumber(source.boltShaderFlickerDepth, 0, 1, TESLA_1_PRESET_DEFAULT.boltShaderFlickerDepth),
    boltShaderColorR: Math.round(clampNumber(source.boltShaderColorR, 0, 255, TESLA_1_PRESET_DEFAULT.boltShaderColorR)),
    boltShaderColorG: Math.round(clampNumber(source.boltShaderColorG, 0, 255, TESLA_1_PRESET_DEFAULT.boltShaderColorG)),
    boltShaderColorB: Math.round(clampNumber(source.boltShaderColorB, 0, 255, TESLA_1_PRESET_DEFAULT.boltShaderColorB)),
    lightningShapeMacroNoiseScale: clampNumber(source.lightningShapeMacroNoiseScale, 0.1, 200, TESLA_1_PRESET_DEFAULT.lightningShapeMacroNoiseScale),
    lightningShapeMacroNoiseStrength: clampNumber(source.lightningShapeMacroNoiseStrength, 0, 0.5, TESLA_1_PRESET_DEFAULT.lightningShapeMacroNoiseStrength),
    lightningShapeMicroNoiseScale: clampNumber(source.lightningShapeMicroNoiseScale, 0.1, 300, TESLA_1_PRESET_DEFAULT.lightningShapeMicroNoiseScale),
    lightningShapeMicroNoiseStrength: clampNumber(source.lightningShapeMicroNoiseStrength, 0, 0.5, TESLA_1_PRESET_DEFAULT.lightningShapeMicroNoiseStrength),
    lightningShapeNoiseSpeedMin,
    lightningShapeNoiseSpeedMax: clampNumber(source.lightningShapeNoiseSpeedMax, lightningShapeNoiseSpeedMin, 20, TESLA_1_PRESET_DEFAULT.lightningShapeNoiseSpeedMax),
    lightningShapeBranchDensity: clampNumber(source.lightningShapeBranchDensity, 0, 1, TESLA_1_PRESET_DEFAULT.lightningShapeBranchDensity),
    lightningShapeBranchLengthMinBo,
    lightningShapeBranchLengthMaxBo: clampNumber(source.lightningShapeBranchLengthMaxBo, lightningShapeBranchLengthMinBo, 8, TESLA_1_PRESET_DEFAULT.lightningShapeBranchLengthMaxBo),
    lightningShapeBranchAngleMinDeg,
    lightningShapeBranchAngleMaxDeg: clampNumber(source.lightningShapeBranchAngleMaxDeg, lightningShapeBranchAngleMinDeg, 170, TESLA_1_PRESET_DEFAULT.lightningShapeBranchAngleMaxDeg),
    haloStrikeEnabled: source.haloStrikeEnabled !== false && source.haloStrikeEnabled !== 0,
    haloStrikeRangeMinBo,
    haloStrikeRangeMaxBo: clampNumber(source.haloStrikeRangeMaxBo, Math.max(0.01, haloStrikeRangeMinBo), 64, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeRangeMaxBo),
    haloStrikeCooldownMinMs,
    haloStrikeCooldownMaxMs: Math.round(clampNumber(source.haloStrikeCooldownMaxMs, haloStrikeCooldownMinMs, 60000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeCooldownMaxMs)),
    haloStrikeHangTimeMinMs,
    haloStrikeHangTimeMaxMs: Math.round(clampNumber(source.haloStrikeHangTimeMaxMs, haloStrikeHangTimeMinMs, 5000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeHangTimeMaxMs)),
    haloStrikeHitRadiusMinBo,
    haloStrikeHitRadiusMaxBo: clampNumber(source.haloStrikeHitRadiusMaxBo, haloStrikeHitRadiusMinBo, 16, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeHitRadiusMaxBo),
    haloStrikeDamageMin,
    haloStrikeDamageMax: clampNumber(source.haloStrikeDamageMax, haloStrikeDamageMin, 10000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeDamageMax),
    haloStrikeStunDamageMin,
    haloStrikeStunDamageMax: clampNumber(source.haloStrikeStunDamageMax, haloStrikeStunDamageMin, 10000, TESLA_1_BEHAVIOR_DEFAULT.haloStrikeStunDamageMax),
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
    },
    vertexShader: `
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #define MAX_HALO_BOLTS ${MAX_HALO_BOLTS}
      uniform int uBoltCountMin;
      uniform int uBoltCountMax;
      uniform float uBo;
      uniform float uTime;
      uniform float uHaloStrikeTime;
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
      varying vec3 vLocalPosition;
      const float TIME_RING = 32.0;
      const float SNAPSHOT_RING = 64.0;

      mat2 rotate2(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
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

      float mixAngle(float a, float b, float amount) {
        float delta = atan(sin(b - a), cos(b - a));
        return a + delta * amount;
      }

      vec3 proceduralBolt(vec2 p, float angle, float startR, float len, float seed, float sampleTime) {
        vec2 uv = rotate2(angle) * p;
        uv.y -= startR;
        float h = 0.0;
        vec2 macroNoiseUv = uv / max(1.0, uBo) * uMacroNoiseScale;
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
        uv.x += (macro * uMacroNoiseStrength + micro * uMicroNoiseStrength) * uBo * baseAnchor * tipAnchor;
        float d = lineSdf(uv, vec2(0.0, 0.0), vec2(0.0, len), uLineWidth * 0.006, h);
        float line = 0.1 / max(max(d / max(1.0, uBo), 0.0), 0.0001);
        vec3 bolt = clamp(1.0 - exp(-(line * uBoltColor) * 0.02), 0.0, 1.0);
        bolt *= smoothstep(len, len * (1.0 - uTipFade), abs(uv.y));

        for (int branchIndex = 0; branchIndex < 3; branchIndex += 1) {
          float bi = float(branchIndex);
          float branchSeed = seed + bi * 23.17;
          if (randomFloat(vec2(branchSeed, 311.0)) > uBranchDensity) continue;
          float anchorT = mix(0.18, 0.82, randomFloat(vec2(branchSeed, 317.0)));
          float side = randomFloat(vec2(branchSeed, 331.0)) < 0.5 ? -1.0 : 1.0;
          float branchLen = mix(uBranchLengthMin, max(uBranchLengthMin, uBranchLengthMax), randomFloat(vec2(branchSeed, 337.0)));
          float branchAngle = side * mix(uBranchAngleMin, max(uBranchAngleMin, uBranchAngleMax), randomFloat(vec2(branchSeed, 347.0)));
          vec2 branchUv = rotate2(-branchAngle) * (uv - vec2(0.0, len * anchorT));
          float branchNoiseFrame = stableFrame(sampleTime * max(1.0, uNoiseSpeedMin) + bi * 5.0);
          vec2 branchMacroUv = branchUv / max(1.0, uBo) * uMacroNoiseScale;
          vec2 branchMicroUv = branchUv / max(1.0, uBo) * uMicroNoiseScale;
          float branchMacro = simpleNoise(branchMacroUv + snapshotOffset(branchSeed, branchNoiseFrame), 2.0) * 2.0 - 1.0;
          float branchMicro = simpleNoise(branchMicroUv + snapshotOffset(branchSeed + 401.0, branchNoiseFrame), 2.0) * 2.0 - 1.0;
          float branchTipAnchorStart = max(0.0, branchLen - uBo * 0.12);
          float branchTipAnchor = 1.0 - smoothstep(branchTipAnchorStart, branchLen, clamp(branchUv.y, 0.0, branchLen));
          float branchBaseAnchor = smoothstep(0.0, uBo * 0.12, branchUv.y);
          branchUv.x += (branchMacro * uMacroNoiseStrength + branchMicro * uMicroNoiseStrength) * uBo * branchBaseAnchor * branchTipAnchor;
          float branchH = 0.0;
          float branchD = lineSdf(branchUv, vec2(0.0), vec2(0.0, branchLen), uLineWidth * 0.0045, branchH);
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
        vec2 p = vLocalPosition.xy;
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
          color += proceduralBolt(p, angle, startR, len, seed, uTime) * uIntensity;
        }
        if (uHaloStrikeActive == 1 && length(uHaloStrikeTarget) > uStartMin + 0.001 * uBo) {
          float strikeAngle = atan(uHaloStrikeTarget.x, uHaloStrikeTarget.y);
          float strikeStartR = max(uStartMin, 0.5 * uBo);
          float strikeLen = max(0.001 * uBo, length(uHaloStrikeTarget) - strikeStartR);
          color += proceduralBolt(p, strikeAngle, strikeStartR, strikeLen, 900.0 + uHaloStrikeSeed, uHaloStrikeTime) * uIntensity * 1.25;
        }
        color = 1.0 - exp(-color * 0.55);
        float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function createTesla1Runtime(options = {}) {
  const {
    getBo = () => 42,
    getConfig = () => TESLA_1_PRESET_DEFAULT,
    getEnemyTargets = () => [],
    getOrbModel = () => null,
    getOrbRuntimePosition = () => null,
    getOrbWorldPosition = () => ({ xW: 0, yW: 0 }),
    getParent = () => null,
    now = () => performance.now(),
    onHaloStrike = null,
    requestFrame = () => {},
    toRuntimePosition = ({ xW = 0, yW = 0, z = 0 } = {}) => ({ x: xW, y: yW, z }),
  } = options;
  let group = null;
  let fieldMesh = null;
  let fieldPlaneSize = 0;
  let timer = 0;
  let startedAtMs = 0;
  let activePayload = Object.freeze({});
  let strikeState = {
    activeUntil: 0,
    nextAt: 0,
    seed: 0,
    slot: -1,
    snapshotTime: 0,
    target: new THREE.Vector2(0, 0),
  };

  function clear() {
    if (timer) clearTimeout(timer);
    timer = 0;
    activePayload = Object.freeze({});
    if (group && group.parent) group.parent.remove(group);
    if (group) disposeThreeObject(group);
    group = null;
    fieldMesh = null;
    fieldPlaneSize = 0;
    requestFrame();
  }

  function resolveNearestEnemyTarget({ from, bo, config }) {
    const rawTargets = typeof getEnemyTargets === "function" ? getEnemyTargets({
      bo,
      fromWorld: from,
      maxRangeBo: config.haloStrikeRangeMaxBo,
      minRangeBo: config.haloStrikeRangeMinBo,
    }) : [];
    let nearest = null;
    for (const rawTarget of Array.isArray(rawTargets) ? rawTargets : []) {
      const target = normalizeEnemyTarget(rawTarget);
      if (!target) continue;
      const centerDistanceBo = Math.hypot(
        (Number(from.xW) || 0) - target.position.xW,
        (Number(from.yW) || 0) - target.position.yW
      ) / Math.max(1, bo);
      const surfaceDistanceBo = Math.max(0, centerDistanceBo - ORB_RADIUS_BO);
      const contactSlopBo = Math.max(0.08, Number(target.radiusBo) || 0);
      const isOrbContact = centerDistanceBo <= ORB_RADIUS_BO + contactSlopBo;
      if (!isOrbContact && surfaceDistanceBo < config.haloStrikeRangeMinBo) continue;
      if (surfaceDistanceBo > config.haloStrikeRangeMaxBo) continue;
      if (!nearest || surfaceDistanceBo < nearest.distanceBo) {
        nearest = Object.freeze({
          ...target,
          centerDistanceBo,
          distanceBo: surfaceDistanceBo,
        });
      }
    }
    return nearest;
  }

  function toLocalRuntimeTarget(target, bo) {
    const orbRuntime = typeof getOrbRuntimePosition === "function" ? getOrbRuntimePosition() : null;
    if (!target || !target.position || !orbRuntime) return new THREE.Vector2(0, 0);
    const z = Number(orbRuntime.z) || 0;
    const runtimeTarget = typeof toRuntimePosition === "function"
      ? toRuntimePosition({ xW: target.position.xW, yW: target.position.yW, z, bo })
      : target.position;
    return new THREE.Vector2(
      (Number(runtimeTarget && runtimeTarget.x) || 0) - (Number(orbRuntime.x) || 0),
      (Number(runtimeTarget && runtimeTarget.y) || 0) - (Number(orbRuntime.y) || 0)
    );
  }

  function resolveMaterialParams(config, bo, time) {
    return {
      boltCountMin: config.haloBoltCountMin,
      boltCountMax: config.haloBoltCountMax,
      startMin: bo * (ORB_RADIUS_BO + config.haloFieldBoltStartMinBo),
      startMax: bo * (ORB_RADIUS_BO + config.haloFieldBoltStartMaxBo),
      endMin: bo * (ORB_RADIUS_BO + config.haloFieldBoltEndMinBo),
      endMax: bo * (ORB_RADIUS_BO + config.haloFieldBoltEndMaxBo),
      bo,
      boltColor: rgbColor(config.boltShaderColorR, config.boltShaderColorG, config.boltShaderColorB),
      intensity: config.boltShaderEnabled ? config.boltShaderIntensity : 0,
      tipFade: config.boltShaderTipFade,
      flickerHz: config.boltShaderFlickerSpeedHz,
      flickerDepth: config.boltShaderFlickerDepth,
      macroNoiseScale: config.lightningShapeMacroNoiseScale,
      macroNoiseStrength: config.lightningShapeMacroNoiseStrength,
      microNoiseScale: config.lightningShapeMicroNoiseScale,
      microNoiseStrength: config.lightningShapeMicroNoiseStrength,
      noiseSpeedMin: config.lightningShapeNoiseSpeedMin,
      noiseSpeedMax: config.lightningShapeNoiseSpeedMax,
      branchDensity: config.lightningShapeBranchDensity,
      branchLengthMin: bo * config.lightningShapeBranchLengthMinBo,
      branchLengthMax: bo * config.lightningShapeBranchLengthMaxBo,
      branchAngleMin: config.lightningShapeBranchAngleMinDeg,
      branchAngleMax: config.lightningShapeBranchAngleMaxDeg,
      ttlMinMs: config.haloBoltTtlMinMs,
      ttlMaxMs: config.haloBoltTtlMaxMs,
      wanderSpeedMin: config.haloBoltWanderSpeedMin,
      wanderSpeedMax: config.haloBoltWanderSpeedMax,
      rpscMin: config.haloBoltRpscMin,
      rpscMax: config.haloBoltRpscMax,
      turnTensionMin: config.haloBoltTurnTensionMin,
      turnTensionMax: config.haloBoltTurnTensionMax,
      turnDampingMin: config.haloBoltTurnDampingMin,
      turnDampingMax: config.haloBoltTurnDampingMax,
      dispersion: config.haloBoltDispersion,
      haloStrikeActive: config.haloStrikeEnabled && time < strikeState.activeUntil,
      haloStrikeSlot: strikeState.slot,
      haloStrikeTarget: strikeState.target,
      haloStrikeSeed: strikeState.seed,
      haloStrikeTime: strikeState.snapshotTime,
      time,
    };
  }

  function updateStrikeState(config, bo, nowMs) {
    if (!config.haloStrikeEnabled || config.haloBoltCountMax <= 0) {
      strikeState.activeUntil = 0;
      return;
    }
    if (strikeState.nextAt && nowMs < strikeState.nextAt) return;
    const from = typeof getOrbWorldPosition === "function" ? getOrbWorldPosition() : {};
    const target = resolveNearestEnemyTarget({ from, bo, config });
    const cooldownMs = randomBetween(config.haloStrikeCooldownMinMs, config.haloStrikeCooldownMaxMs);
    strikeState.nextAt = nowMs + Math.max(16, cooldownMs);
    if (!target) {
      strikeState.activeUntil = 0;
      return;
    }
    const seed = Math.floor((nowMs * 997) + strikeState.seed * 17 + 1) % 100000;
    const countMax = Math.max(1, Math.min(MAX_HALO_BOLTS, Math.round(config.haloBoltCountMax || 1)));
    const snapshotTime = (nowMs - startedAtMs) / 1000;
    const hangMs = randomBetween(config.haloStrikeHangTimeMinMs, config.haloStrikeHangTimeMaxMs);
    strikeState.seed = seed;
    strikeState.slot = Math.floor(Math.random() * countMax) % countMax;
    strikeState.snapshotTime = snapshotTime;
    strikeState.target.copy(toLocalRuntimeTarget(target, bo));
    if (strikeState.target.lengthSq() <= 0.000001) {
      strikeState.activeUntil = 0;
      return;
    }
    strikeState.activeUntil = snapshotTime + Math.max(0.016, hangMs / 1000);
    if (typeof onHaloStrike === "function") {
      onHaloStrike({
        atMs: nowMs,
        bo,
        config,
        damage: randomBetween(config.haloStrikeDamageMin, config.haloStrikeDamageMax),
        hitRadiusBo: randomBetween(config.haloStrikeHitRadiusMinBo, config.haloStrikeHitRadiusMaxBo),
        stunDamage: randomBetween(config.haloStrikeStunDamageMin, config.haloStrikeStunDamageMax),
        target,
      });
    }
  }

  function syncRuntime(payload = {}, { emitFrame = true, nowMs: frameNowMs = null } = {}) {
    if (!group) return;
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 42);
    const nowMs = Number.isFinite(Number(frameNowMs))
      ? Number(frameNowMs)
      : (typeof now === "function" ? now() : performance.now());
    const config = normalizeTesla1RuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const orbRuntime = typeof getOrbRuntimePosition === "function" ? getOrbRuntimePosition() : null;
    if (orbRuntime) {
      group.position.set(Number(orbRuntime.x) || 0, Number(orbRuntime.y) || 0, Number(orbRuntime.z) || 0);
    }
    updateStrikeState(config, bo, nowMs);
    const maxRangeBo = Math.max(
      config.haloFieldShellRadiusBo,
      ORB_RADIUS_BO + config.haloFieldBoltEndMaxBo,
      ORB_RADIUS_BO + config.haloFieldBoltStartMaxBo,
      ORB_RADIUS_BO + config.haloStrikeRangeMaxBo
    );
    const planeSize = bo * Math.max(2.5, maxRangeBo * 2.45);
    const time = (nowMs - startedAtMs) / 1000;
    const materialParams = resolveMaterialParams(config, bo, time);
    if (!fieldMesh || !fieldMesh.parent) {
      const material = createLightningFieldMaterial(materialParams);
      fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize, 1, 1), material);
      fieldMesh.name = "tesla1:sdf_lightning_field";
      fieldMesh.renderOrder = 234;
      fieldPlaneSize = planeSize;
      group.add(fieldMesh);
    } else {
      updateLightningFieldMaterial(fieldMesh.material, materialParams);
      if (Math.abs(fieldPlaneSize - planeSize) > 0.5) {
        if (fieldMesh.geometry && typeof fieldMesh.geometry.dispose === "function") fieldMesh.geometry.dispose();
        fieldMesh.geometry = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1);
        fieldPlaneSize = planeSize;
      }
    }
    if (emitFrame) requestFrame();
  }

  function update(nowMs = typeof now === "function" ? now() : performance.now()) {
    if (!group) return { handled: false, skipped: "tesla1_inactive" };
    syncRuntime(activePayload, { emitFrame: false, nowMs });
    return { handled: true };
  }

  function play(payload = {}) {
    clear();
    const parent = typeof getParent === "function" ? getParent() : null;
    if (!parent) return { handled: false, skipped: "tesla1_parent_missing" };
    const config = normalizeTesla1RuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    if (!config.haloFieldEnabled) return { handled: false, skipped: "tesla1_halo_disabled" };
    activePayload = Object.freeze({ ...(payload && typeof payload === "object" ? payload : {}) });
    group = new THREE.Group();
    group.name = "tesla1:runtime";
    parent.add(group);
    startedAtMs = typeof now === "function" ? now() : performance.now();
    strikeState = {
      activeUntil: 0,
      nextAt: 0,
      seed: 0,
      slot: -1,
      snapshotTime: 0,
      target: new THREE.Vector2(0, 0),
    };
    syncRuntime(activePayload);
    timer = setTimeout(clear, config.durationMs);
    return { handled: true, config };
  }

  return Object.freeze({
    clear,
    destroy: clear,
    isActive() {
      return !!group;
    },
    play,
    update,
  });
}
