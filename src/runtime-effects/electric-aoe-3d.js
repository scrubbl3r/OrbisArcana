import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import {
  buildElectricAoeDominantBoltControlPath,
  ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS,
} from "../game-runtime/spells/electric-aoe-dominant-bolt-planner.js?v=20260521a";
import { createElectricAoeHaloFieldPlanner } from "../game-runtime/spells/electric-aoe-halo-bolt-planner.js?v=20260522k";
import { ELECTRIC_AOE_BEHAVIOR_DEFAULT } from "../game-runtime/behaviors/electric-aoe-behavior-default.js?v=20260522172828b";
import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/electric-aoe-3d-default.js?v=20260522172828";

const HALO_CONTROL_POINT_REFRESH_MS = 1000 / 30;

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

export function normalizeElectricAoe3dRuntimeConfig(raw = {}) {
  const rawSource = raw && typeof raw === "object" ? raw : {};
  const source = {
    ...ELECTRIC_AOE_3D_PRESET_DEFAULT,
    ...ELECTRIC_AOE_BEHAVIOR_DEFAULT,
    ...rawSource,
    ...(rawSource.behavior && typeof rawSource.behavior === "object" ? rawSource.behavior : {}),
  };
  const dominantBoltMinRangeBo = clampNumber(source.dominantBoltMinRangeBo, 0, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.minRangeBo);
  const dominantBoltMaxRangeBo = clampNumber(
    source.dominantBoltMaxRangeBo ?? source.dominantBoltRangeBo,
    Math.max(0.25, dominantBoltMinRangeBo),
    64,
    ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.maxRangeBo
  );
  const dominantBoltEnemyMinRangeBo = clampNumber(source.dominantBoltEnemyMinRangeBo, 0, 64, ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltEnemyMinRangeBo);
  const dominantBoltEnemyMaxRangeBo = clampNumber(
    source.dominantBoltEnemyMaxRangeBo,
    Math.max(0.25, dominantBoltEnemyMinRangeBo),
    64,
    ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltEnemyMaxRangeBo
  );
  const dominantBoltMinStepBo = clampNumber(source.dominantBoltMinStepBo, 0.05, 8, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.minStepBo);
  const dominantBoltMaxStepBo = clampNumber(source.dominantBoltMaxStepBo, dominantBoltMinStepBo, 8, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.maxStepBo);
  const dominantBoltDamageMin = clampNumber(source.dominantBoltDamageMin, 0, 10000, ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltDamageMin);
  const dominantBoltDamageMax = clampNumber(source.dominantBoltDamageMax, dominantBoltDamageMin, 10000, ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltDamageMax);
  const dominantBoltEnvironmentFrequencyMinMs = Math.round(clampNumber(
    source.dominantBoltEnvironmentFrequencyMinMs,
    16,
    60000,
    ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltEnvironmentFrequencyMinMs
  ));
  const dominantBoltEnvironmentFrequencyMaxMs = Math.round(clampNumber(
    source.dominantBoltEnvironmentFrequencyMaxMs,
    dominantBoltEnvironmentFrequencyMinMs,
    60000,
    ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltEnvironmentFrequencyMaxMs
  ));
  const dominantBoltEnemyFrequencyMinMs = Math.round(clampNumber(
    source.dominantBoltEnemyFrequencyMinMs,
    16,
    60000,
    ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltEnemyFrequencyMinMs
  ));
  const dominantBoltEnemyFrequencyMaxMs = Math.round(clampNumber(
    source.dominantBoltEnemyFrequencyMaxMs,
    dominantBoltEnemyFrequencyMinMs,
    60000,
    ELECTRIC_AOE_BEHAVIOR_DEFAULT.dominantBoltEnemyFrequencyMaxMs
  ));
  const boltShaderCoreWidthMinBo = clampNumber(source.boltShaderCoreWidthMinBo, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreWidthMinBo);
  const boltShaderGlowWidthMinBo = clampNumber(source.boltShaderGlowWidthMinBo, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowWidthMinBo);
  const haloBoltForkTtlMinMs = Math.round(clampNumber(
    source.haloBoltForkTtlMinMs ?? source.haloBoltForkTtlMs,
    16,
    20000,
    ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkTtlMinMs
  ));
  const haloBoltForkTtlMaxMs = Math.round(clampNumber(
    source.haloBoltForkTtlMaxMs ?? source.haloBoltForkTtlMs,
    haloBoltForkTtlMinMs,
    20000,
    ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkTtlMaxMs
  ));
  return Object.freeze({
    durationMs: Math.round(clampNumber(source.spellDurationMs ?? source.durationMs, 200, 60000, ELECTRIC_AOE_BEHAVIOR_DEFAULT.spellDurationMs)),
    dominantBoltDamageMax,
    dominantBoltDamageMin,
    dominantBoltControlPointDiameterBo: clampNumber(
      source.dominantBoltControlPointDiameterBo,
      0.01,
      0.5,
      ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.controlPointDiameterBo
    ),
    dominantBoltDetourRatioMax: clampNumber(source.dominantBoltDetourRatioMax, 1, 8, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.detourRatioMax),
    dominantBoltEnemyFrequencyMaxMs,
    dominantBoltEnemyFrequencyMinMs,
    dominantBoltEnemyMaxRangeBo,
    dominantBoltEnemyMinRangeBo,
    dominantBoltEnvironmentFrequencyMaxMs,
    dominantBoltEnvironmentFrequencyMinMs,
    dominantBoltHeadingMemory: clampNumber(source.dominantBoltHeadingMemory, 0, 1, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.headingMemory),
    dominantBoltMaxRangeBo,
    dominantBoltMaxStepBo,
    dominantBoltMinRangeBo,
    dominantBoltMinStepBo,
    dominantBoltPathJitterBo: clampNumber(source.dominantBoltPathJitterBo, 0, 2, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.pathJitterBo),
    dominantBoltPointSpacingBo: clampNumber(source.dominantBoltPointSpacingBo, 0.05, 4, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.pointSpacingBo),
    dominantBoltRangeBo: dominantBoltMaxRangeBo,
    dominantBoltSeekStrength: clampNumber(source.dominantBoltSeekStrength, 0, 4, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.seekStrength),
    dominantBoltTargetRadiusBo: clampNumber(source.dominantBoltTargetRadiusBo, 0.25, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.targetRadiusBo),
    dominantBoltWanderStrength: clampNumber(source.dominantBoltWanderStrength, 0, 4, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.wanderStrength),
    dominantBoltZBo: clampNumber(source.dominantBoltZBo, -64, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.zBo),
    boltShaderEnabled: source.boltShaderEnabled !== false,
    boltShaderCoreWidthMinBo,
    boltShaderCoreWidthMaxBo: clampNumber(source.boltShaderCoreWidthMaxBo, boltShaderCoreWidthMinBo, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreWidthMaxBo),
    boltShaderGlowWidthMinBo,
    boltShaderGlowWidthMaxBo: clampNumber(source.boltShaderGlowWidthMaxBo, boltShaderGlowWidthMinBo, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowWidthMaxBo),
    boltShaderLengthTaper: clampNumber(source.boltShaderLengthTaper, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderLengthTaper),
    boltShaderTipOpacity: clampNumber(source.boltShaderTipOpacity, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderTipOpacity),
    boltShaderCoreIntensity: clampNumber(source.boltShaderCoreIntensity, 0, 20, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreIntensity),
    boltShaderCoreSoftness: clampNumber(source.boltShaderCoreSoftness, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreSoftness),
    boltShaderGlowIntensity: clampNumber(source.boltShaderGlowIntensity, 0, 20, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowIntensity),
    boltShaderGlowSoftness: clampNumber(source.boltShaderGlowSoftness, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowSoftness),
    boltShaderFlickerSpeedHz: clampNumber(source.boltShaderFlickerSpeedHz, 0, 60, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderFlickerSpeedHz),
    boltShaderFlickerDepth: clampNumber(source.boltShaderFlickerDepth, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderFlickerDepth),
    boltShaderCoreR: Math.round(clampNumber(source.boltShaderCoreR, 0, 255, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreR)),
    boltShaderCoreG: Math.round(clampNumber(source.boltShaderCoreG, 0, 255, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreG)),
    boltShaderCoreB: Math.round(clampNumber(source.boltShaderCoreB, 0, 255, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderCoreB)),
    boltShaderGlowR: Math.round(clampNumber(source.boltShaderGlowR, 0, 255, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowR)),
    boltShaderGlowG: Math.round(clampNumber(source.boltShaderGlowG, 0, 255, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowG)),
    boltShaderGlowB: Math.round(clampNumber(source.boltShaderGlowB, 0, 255, ELECTRIC_AOE_3D_PRESET_DEFAULT.boltShaderGlowB)),
    haloBoltShapeMinStepBo: clampNumber(source.haloBoltShapeMinStepBo, 0.01, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeMinStepBo),
    haloBoltShapeMaxStepBo: clampNumber(source.haloBoltShapeMaxStepBo, 0.01, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeMaxStepBo),
    haloBoltShapeSeekStrength: clampNumber(source.haloBoltShapeSeekStrength, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeSeekStrength),
    haloBoltShapeHeadingMemory: clampNumber(source.haloBoltShapeHeadingMemory, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeHeadingMemory),
    haloBoltShapeWanderStrength: clampNumber(source.haloBoltShapeWanderStrength, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeWanderStrength),
    haloBoltShapePathJitterBo: clampNumber(source.haloBoltShapePathJitterBo, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapePathJitterBo),
    haloBoltShapeSpeedHz: clampNumber(source.haloBoltShapeSpeedHz, 0, 120, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeSpeedHz),
    haloBoltShapeSmoothing: clampNumber(source.haloBoltShapeSmoothing, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltShapeSmoothing),
    haloBoltForkChance: clampNumber(source.haloBoltForkChance, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkChance),
    haloBoltForkTtlMaxMs,
    haloBoltForkTtlMinMs,
    haloBoltForkStartPct: clampNumber(source.haloBoltForkStartPct, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkStartPct),
    haloBoltForkEndPct: clampNumber(source.haloBoltForkEndPct, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkEndPct),
    haloBoltForkSpreadMinBo: clampNumber(source.haloBoltForkSpreadMinBo ?? source.haloBoltForkSpreadBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkSpreadMinBo),
    haloBoltForkSpreadMaxBo: clampNumber(source.haloBoltForkSpreadMaxBo ?? source.haloBoltForkSpreadBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkSpreadMaxBo),
    haloBoltForkZTineMinBo: clampNumber(source.haloBoltForkZTineMinBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkZTineMinBo),
    haloBoltForkZTineMaxBo: clampNumber(source.haloBoltForkZTineMaxBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkZTineMaxBo),
    haloBoltForkTargetOffsetBo: clampNumber(source.haloBoltForkTargetOffsetBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkTargetOffsetBo),
    haloBoltBranchEnabled: source.haloBoltBranchEnabled === true,
    haloBoltBranchChance: clampNumber(source.haloBoltBranchChance, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchChance),
    haloBoltBranchTotalMin: Math.round(clampNumber(source.haloBoltBranchTotalMin, 0, 16, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchTotalMin)),
    haloBoltBranchTotalMax: Math.round(clampNumber(source.haloBoltBranchTotalMax, 0, 16, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchTotalMax)),
    haloBoltBranchRangeStartPct: clampNumber(source.haloBoltBranchRangeStartPct, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchRangeStartPct),
    haloBoltBranchRangeEndPct: clampNumber(source.haloBoltBranchRangeEndPct, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchRangeEndPct),
    haloBoltBranchLengthMinBo: clampNumber(source.haloBoltBranchLengthMinBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchLengthMinBo),
    haloBoltBranchLengthMaxBo: clampNumber(source.haloBoltBranchLengthMaxBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchLengthMaxBo),
    haloBoltBranchAngleMinDeg: clampNumber(source.haloBoltBranchAngleMinDeg, 0, 180, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchAngleMinDeg),
    haloBoltBranchAngleMaxDeg: clampNumber(source.haloBoltBranchAngleMaxDeg, 0, 180, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchAngleMaxDeg),
    haloBoltBranchTtlMinMs: Math.round(clampNumber(source.haloBoltBranchTtlMinMs, 16, 20000, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchTtlMinMs)),
    haloBoltBranchTtlMaxMs: Math.round(clampNumber(source.haloBoltBranchTtlMaxMs, 16, 20000, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchTtlMaxMs)),
    haloBoltBranchStepMinBo: clampNumber(source.haloBoltBranchStepMinBo, 0.001, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchStepMinBo),
    haloBoltBranchStepMaxBo: clampNumber(source.haloBoltBranchStepMaxBo, 0.001, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchStepMaxBo),
    haloBoltBranchBendStrength: clampNumber(source.haloBoltBranchBendStrength, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchBendStrength),
    haloBoltBranchCurlStrength: clampNumber(source.haloBoltBranchCurlStrength, 0, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchCurlStrength),
    haloBoltBranchShapeScale: clampNumber(source.haloBoltBranchShapeScale, 0.001, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltBranchShapeScale),
    haloFieldLingerMinMs: Math.round(clampNumber(
      source.haloFieldLingerMinMs ?? source.haloFieldReversalFrequencyMinMs ?? source.haloFieldDirectionHoldMinMs,
      50,
      20000,
      ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldLingerMinMs
    )),
    haloFieldLingerMaxMs: Math.round(clampNumber(
      source.haloFieldLingerMaxMs ?? source.haloFieldReversalFrequencyMaxMs ?? source.haloFieldDirectionHoldMaxMs,
      50,
      20000,
      ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldLingerMaxMs
    )),
    haloFieldLingerDrift: clampNumber(source.haloFieldLingerDrift, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldLingerDrift),
    haloFieldEnabled: source.haloFieldEnabled !== false,
    haloFieldPointCount: Math.round(clampNumber(source.haloFieldPointCount, 0, 256, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldPointCount)),
    haloFieldPointDiameterBo: 0.05,
    haloFieldReversalChance: clampNumber(source.haloFieldReversalChance, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldReversalChance),
    haloFieldSeed: Math.round(clampNumber(source.haloFieldSeed, 1, 999999999, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldSeed)),
    haloFieldShellRadiusBo: clampNumber(source.haloFieldShellRadiusBo, 0.5, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldShellRadiusBo),
    haloFieldBoltStartMinBo: clampNumber(source.haloFieldBoltStartMinBo, 0, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldBoltStartMinBo),
    haloFieldBoltStartMaxBo: clampNumber(source.haloFieldBoltStartMaxBo, 0, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldBoltStartMaxBo),
    haloFieldBoltEndMinBo: clampNumber(source.haloFieldBoltEndMinBo ?? source.haloFieldBoltLengthMinBo, 0.05, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldBoltEndMinBo),
    haloFieldBoltEndMaxBo: clampNumber(source.haloFieldBoltEndMaxBo ?? source.haloFieldBoltLengthMaxBo, 0.05, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldBoltEndMaxBo),
    haloFieldWander: clampNumber(source.haloFieldWander, 0, 2, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldWander),
    haloFieldWanderDurationMinMs: Math.round(clampNumber(
      source.haloFieldWanderDurationMinMs,
      50,
      20000,
      ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldWanderDurationMinMs
    )),
    haloFieldWanderDurationMaxMs: Math.round(clampNumber(
      source.haloFieldWanderDurationMaxMs,
      50,
      20000,
      ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldWanderDurationMaxMs
    )),
    haloFieldWanderSpeedMin: clampNumber(
      source.haloFieldWanderSpeedMin ?? source.haloFieldWanderSpeed,
      0,
      64,
      ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldWanderSpeedMin
    ),
    haloFieldWanderSpeedMax: clampNumber(
      source.haloFieldWanderSpeedMax ?? source.haloFieldWanderSpeed,
      0,
      64,
      ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldWanderSpeedMax
    ),
    haloFieldZMinBo: clampNumber(source.haloFieldZMinBo, -32, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldZMinBo),
    haloFieldZMaxBo: clampNumber(source.haloFieldZMaxBo, -32, 32, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldZMaxBo),
  });
}

export function createElectricAoe3dRuntime(options = {}) {
  const {
    getBo = () => 42,
    getConfig = () => ELECTRIC_AOE_3D_PRESET_DEFAULT,
    getEnvironmentSegments = () => [],
    getEnemyTargets = () => [],
    getLevelNav = () => null,
    getParent = () => null,
    getOrbModel = () => null,
    getOrbRuntimePosition = () => null,
    getOrbWorldPosition = () => ({ xW: 0, yW: 0 }),
    getRuntimeZ = null,
    now = () => performance.now(),
    onEnemyStrike = null,
    requestFrame = () => {},
    toRuntimePosition = ({ xW = 0, yW = 0, z = 0 } = {}) => ({ x: xW, y: yW, z }),
  } = options;
  let group = null;
  let timer = 0;
  let strikeTimer = 0;
  let haloTimer = 0;
  let dominantLayer = null;
  let haloLayer = null;
  let line = null;
  let lineMaterial = null;
  let pointGeometry = null;
  let pointMaterial = null;
  let haloLineMaterial = null;
  let haloPointGeometry = null;
  let haloPointMaterial = null;
  let haloShellMaterial = null;
  let haloFieldPlanner = null;

  function clear() {
    if (timer) clearTimeout(timer);
    if (strikeTimer) clearTimeout(strikeTimer);
    if (haloTimer) clearInterval(haloTimer);
    timer = 0;
    strikeTimer = 0;
    haloTimer = 0;
    if (group && group.parent) group.parent.remove(group);
    if (group) disposeThreeObject(group);
    group = null;
    dominantLayer = null;
    haloLayer = null;
    line = null;
    lineMaterial = null;
    pointGeometry = null;
    pointMaterial = null;
    haloLineMaterial = null;
    haloPointGeometry = null;
    haloPointMaterial = null;
    haloShellMaterial = null;
    if (haloFieldPlanner && typeof haloFieldPlanner.reset === "function") haloFieldPlanner.reset();
    haloFieldPlanner = null;
    requestFrame();
  }

  function distanceBo(from = {}, to = {}, bo = 42) {
    return Math.hypot((Number(from.xW) || 0) - (Number(to.xW) || 0), (Number(from.yW) || 0) - (Number(to.yW) || 0)) / Math.max(1, bo);
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

  function resolveNearestEnemyTarget({ from, bo, config, nav }) {
    const rawTargets = typeof getEnemyTargets === "function" ? getEnemyTargets({
      bo,
      fromWorld: from,
      maxRangeBo: config.dominantBoltEnemyMaxRangeBo,
      minRangeBo: config.dominantBoltEnemyMinRangeBo,
    }) : [];
    let nearest = null;
    for (const rawTarget of Array.isArray(rawTargets) ? rawTargets : []) {
      const target = normalizeEnemyTarget(rawTarget);
      if (!target) continue;
      const straightBo = distanceBo(from, target.position, bo);
      if (straightBo < config.dominantBoltEnemyMinRangeBo || straightBo > config.dominantBoltEnemyMaxRangeBo) continue;
      if (nav && typeof nav.distanceThroughLevel === "function") {
        const routedBo = Math.max(0, Number(nav.distanceThroughLevel(from, target.position)) || 0) / Math.max(1, bo);
        if (routedBo < config.dominantBoltEnemyMinRangeBo || routedBo > config.dominantBoltEnemyMaxRangeBo) continue;
        if (routedBo / Math.max(0.001, straightBo) > config.dominantBoltDetourRatioMax) continue;
      }
      if (!nearest || straightBo < nearest.distanceBo) nearest = Object.freeze({ ...target, distanceBo: straightBo });
    }
    return nearest;
  }

  function randomBetween(min = 0, max = 0) {
    const lo = Math.max(0, Number(min) || 0);
    const hi = Math.max(lo, Number(max) || lo);
    return lo + Math.random() * (hi - lo);
  }

  function rgbColor(r = 255, g = 255, b = 255) {
    return new THREE.Color(
      Math.max(0, Math.min(255, Number(r) || 0)) / 255,
      Math.max(0, Math.min(255, Number(g) || 0)) / 255,
      Math.max(0, Math.min(255, Number(b) || 0)) / 255
    );
  }

  function pathLength(points = []) {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += points[index - 1].distanceTo(points[index]);
    }
    return total;
  }

  function createTaperedTubeGeometry(points, baseRadius, radialSegments = 6, taper = 1) {
    const sourcePoints = Array.isArray(points) ? points.filter(Boolean) : [];
    if (sourcePoints.length <= 1) return new THREE.BufferGeometry().setFromPoints(sourcePoints);
    const curve = new THREE.CatmullRomCurve3(sourcePoints, false, "catmullrom", 0.5);
    const tubularSegments = Math.max(2, Math.min(96, Math.round(sourcePoints.length * 4)));
    const rings = tubularSegments + 1;
    const sides = Math.max(3, Math.round(radialSegments));
    const positions = [];
    const indices = [];
    const pathTs = [];
    const taperAmount = Math.max(0, Math.min(1, Number(taper) / 4));
    const worldUp = new THREE.Vector3(0, 0, 1);
    let previousNormal = null;
    for (let ringIndex = 0; ringIndex < rings; ringIndex += 1) {
      const t = ringIndex / Math.max(1, tubularSegments);
      const center = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      let normal = previousNormal
        ? previousNormal.clone().sub(tangent.clone().multiplyScalar(previousNormal.dot(tangent)))
        : worldUp.clone().cross(tangent);
      if (normal.lengthSq() < 0.000001) normal = new THREE.Vector3(1, 0, 0).cross(tangent);
      normal.normalize();
      const binormal = tangent.clone().cross(normal).normalize();
      previousNormal = normal.clone();
      const easedT = t * t * (3 - 2 * t);
      const radiusScale = Math.max(0.08, 1 - (0.92 * taperAmount * easedT));
      const radius = Math.max(0.001, baseRadius * radiusScale);
      for (let sideIndex = 0; sideIndex < sides; sideIndex += 1) {
        const angle = (sideIndex / sides) * Math.PI * 2;
        const offset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
          .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius));
        positions.push(center.x + offset.x, center.y + offset.y, center.z + offset.z);
        pathTs.push(t);
      }
    }
    for (let ringIndex = 0; ringIndex < tubularSegments; ringIndex += 1) {
      for (let sideIndex = 0; sideIndex < sides; sideIndex += 1) {
        const a = ringIndex * sides + sideIndex;
        const b = ringIndex * sides + ((sideIndex + 1) % sides);
        const c = (ringIndex + 1) * sides + ((sideIndex + 1) % sides);
        const d = (ringIndex + 1) * sides + sideIndex;
        indices.push(a, b, d, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aPathT", new THREE.Float32BufferAttribute(pathTs, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function createBoltFadeMaterial({ color, opacity, tipOpacity }) {
    return new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uColor: { value: color },
        uOpacity: { value: Math.max(0, Math.min(1, Number(opacity) || 0)) },
        uTipOpacity: { value: Math.max(0, Math.min(1, Number(tipOpacity) || 0)) },
      },
      vertexShader: `
        attribute float aPathT;
        varying float vPathT;
        void main() {
          vPathT = aPathT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTipOpacity;
        varying float vPathT;
        void main() {
          float pathFade = mix(1.0, uTipOpacity, clamp(vPathT, 0.0, 1.0));
          gl_FragColor = vec4(uColor, uOpacity * pathFade);
        }
      `,
    });
  }

  function createPathLineGeometry(points = []) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const count = Array.isArray(points) ? points.length : 0;
    const pathTs = [];
    for (let index = 0; index < count; index += 1) {
      pathTs.push(count <= 1 ? 0 : index / (count - 1));
    }
    geometry.setAttribute("aPathT", new THREE.Float32BufferAttribute(pathTs, 1));
    return geometry;
  }

  function addBoltShaderMeshes(layer, points, config, bo, namePrefix, renderOrder, time = 0) {
    if (!layer || !Array.isArray(points) || points.length <= 1) return;
    if (config && config.boltShaderEnabled === false) {
      const fallback = new THREE.LineBasicMaterial({
        color: 0xd8f7ff,
        transparent: true,
        opacity: 0.56,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
      const lineObject = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), fallback);
      lineObject.name = `${namePrefix}_line`;
      lineObject.renderOrder = renderOrder;
      layer.add(lineObject);
      return;
    }
    const lengthBo = pathLength(points) / Math.max(1, bo);
    const taper = Math.max(0, Math.min(4, Number(config && config.boltShaderLengthTaper) || 0));
    const lengthMix = Math.max(0, Math.min(1, Math.pow(lengthBo / 2.5, 1 / Math.max(0.2, taper || 1))));
    const coreMin = Math.max(0.001, Number(config && config.boltShaderCoreWidthMinBo) || 0.006);
    const coreMax = Math.max(coreMin, Number(config && config.boltShaderCoreWidthMaxBo) || 0.022);
    const glowMin = Math.max(0.001, Number(config && config.boltShaderGlowWidthMinBo) || 0.035);
    const glowMax = Math.max(glowMin, Number(config && config.boltShaderGlowWidthMaxBo) || 0.16);
    const coreRadius = bo * (coreMin + (coreMax - coreMin) * lengthMix) * 0.5;
    const glowRadius = bo * (glowMin + (glowMax - glowMin) * lengthMix) * 0.5;
    const coreSoftness = Math.max(0, Math.min(1, Number(config && config.boltShaderCoreSoftness) || 0));
    const glowSoftness = Math.max(0, Math.min(1, Number(config && config.boltShaderGlowSoftness) || 0));
    const tipOpacity = Math.max(0, Math.min(1, Number(config && config.boltShaderTipOpacity) || 0));
    const flickerDepth = Math.max(0, Math.min(1, Number(config && config.boltShaderFlickerDepth) || 0));
    const flickerHz = Math.max(0, Number(config && config.boltShaderFlickerSpeedHz) || 0);
    const flicker = 1 - flickerDepth * (0.5 + 0.5 * Math.sin((time * flickerHz * Math.PI * 2) + lengthBo));
    const glowColor = rgbColor(config && config.boltShaderGlowR, config && config.boltShaderGlowG, config && config.boltShaderGlowB);
    const coreColor = rgbColor(config && config.boltShaderCoreR, config && config.boltShaderCoreG, config && config.boltShaderCoreB);
    const glow = new THREE.Mesh(
      createTaperedTubeGeometry(points, glowRadius * (1 + glowSoftness * 1.8), 6, taper),
      createBoltFadeMaterial({
        color: glowColor,
        opacity: Math.max(0, Math.min(1, 0.18 * (Number(config && config.boltShaderGlowIntensity) || 1.8) * flicker)),
        tipOpacity,
      })
    );
    glow.name = `${namePrefix}_glow`;
    glow.renderOrder = renderOrder;
    layer.add(glow);
    if (coreSoftness > 0) {
      const coreSoft = new THREE.Mesh(
        createTaperedTubeGeometry(points, coreRadius * (1 + coreSoftness * 2.2), 5, taper),
        createBoltFadeMaterial({
          color: coreColor,
          opacity: Math.max(0, Math.min(1, 0.12 * coreSoftness * (Number(config && config.boltShaderCoreIntensity) || 3.5) * flicker)),
          tipOpacity,
        })
      );
      coreSoft.name = `${namePrefix}_core_soft`;
      coreSoft.renderOrder = renderOrder + 1;
      layer.add(coreSoft);
    }
    const core = new THREE.Mesh(
      createTaperedTubeGeometry(points, coreRadius, 5, taper),
      createBoltFadeMaterial({
        color: coreColor,
        opacity: Math.max(0, Math.min(1, 0.28 * (Number(config && config.boltShaderCoreIntensity) || 3.5) * flicker)),
        tipOpacity,
      })
    );
    core.name = `${namePrefix}_core`;
    core.renderOrder = renderOrder + 1;
    layer.add(core);
  }

  function clearLayerChildren(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      if (child.geometry && child.geometry !== haloPointGeometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
      if (child.material
        && child.material !== haloLineMaterial
        && child.material !== haloPointMaterial
        && child.material !== haloShellMaterial
        && typeof child.material.dispose === "function") {
        child.material.dispose();
      }
    }
  }

  function buildHaloFieldPaths(config, bo, time = 0, from = {}) {
    if (!haloFieldPlanner) haloFieldPlanner = createElectricAoeHaloFieldPlanner();
    return haloFieldPlanner.buildPaths({
      bo,
      config,
      from,
      time,
    });
  }

  function toRuntimeVector(point, bo, path = null, { usePointZ = false } = {}) {
    const sharedRuntimeZ = !usePointZ && typeof getRuntimeZ === "function" ? getRuntimeZ({ bo, path }) : null;
    const runtimePoint = typeof toRuntimePosition === "function"
      ? toRuntimePosition({
        xW: point.xW,
        yW: point.yW,
        z: Number.isFinite(Number(sharedRuntimeZ)) ? Number(sharedRuntimeZ) : (Number(point.zBo) || 0) * bo,
        bo,
      })
      : point;
    return new THREE.Vector3(
      Number(runtimePoint && runtimePoint.x) || 0,
      Number(runtimePoint && runtimePoint.y) || 0,
      Number(runtimePoint && runtimePoint.z) || 0
    );
  }

  function syncHaloField(config, bo) {
    if (!haloLayer) return;
    clearLayerChildren(haloLayer);
    const time = (typeof now === "function" ? now() : performance.now()) / 1000;
    const from = typeof getOrbWorldPosition === "function" ? getOrbWorldPosition() : {};
    const orbRuntimePosition = typeof getOrbRuntimePosition === "function" ? getOrbRuntimePosition() : null;
    const hasOrbRuntimePosition = !!orbRuntimePosition
      && Number.isFinite(Number(orbRuntimePosition.x))
      && Number.isFinite(Number(orbRuntimePosition.y))
      && Number.isFinite(Number(orbRuntimePosition.z));
    const paths = buildHaloFieldPaths(config, bo, time, from);
    const toHaloRuntimeVector = (point, path = null) => {
      const zOffset = (Number(point && point.zBo) || 0) * bo;
      if (hasOrbRuntimePosition) {
        return new THREE.Vector3(
          Number(orbRuntimePosition.x) + ((Number(point && point.xW) || 0) - (Number(from && from.xW) || 0)),
          Number(orbRuntimePosition.y) + ((Number(point && point.yW) || 0) - (Number(from && from.yW) || 0)),
          Number(orbRuntimePosition.z) + zOffset
        );
      }
      return toRuntimeVector(point, bo, path, { usePointZ: true });
    };
    const addBranchLines = (branches, path, namePrefix) => {
      (Array.isArray(branches) ? branches : []).forEach((branch, branchIndex) => {
        const branchPoints = (Array.isArray(branch.points) ? branch.points : []).map((point) => toHaloRuntimeVector(point, path));
        if (branchPoints.length <= 1) return;
        addBoltShaderMeshes(haloLayer, branchPoints, config, bo, `${namePrefix}_branch_${branchIndex}`, 235, time);
      });
    };
    paths.forEach((path, pathIndex) => {
      const linePoints = path.points.map((point) => toHaloRuntimeVector(point, path));
      addBoltShaderMeshes(haloLayer, linePoints, config, bo, `electric_aoe3d:stage_halo_control_line_${pathIndex}`, 234, time);
      addBranchLines(path.branches, path, `electric_aoe3d:stage_halo_${pathIndex}`);
      (Array.isArray(path.forks) ? path.forks : []).forEach((fork, forkIndex) => {
        (Array.isArray(fork.tines) ? fork.tines : []).forEach((tine, tineIndex) => {
          const tinePoints = (Array.isArray(tine.points) ? tine.points : []).map((point) => toHaloRuntimeVector(point, path));
          if (tinePoints.length <= 1) return;
          addBoltShaderMeshes(haloLayer, tinePoints, config, bo, `electric_aoe3d:stage_halo_fork_${pathIndex}_${forkIndex}_${tineIndex}`, 235, time);
          addBranchLines(tine.branches, path, `electric_aoe3d:stage_halo_fork_${pathIndex}_${forkIndex}_${tineIndex}`);
        });
      });
    });
  }

  function resolveStrikeDamage(config) {
    return randomBetween(config.dominantBoltDamageMin, config.dominantBoltDamageMax);
  }

  function planDominantBolt(payload = {}) {
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 42);
    const config = normalizeElectricAoe3dRuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const from = typeof getOrbWorldPosition === "function" ? getOrbWorldPosition() : {};
    const nav = typeof getLevelNav === "function" ? getLevelNav() : null;
    const enemyTarget = payload && payload.target ? null : resolveNearestEnemyTarget({ from, bo, config, nav });
    const strikeTarget = enemyTarget ? enemyTarget.position : (payload && payload.target ? payload.target : null);
    const path = buildElectricAoeDominantBoltControlPath({
      bo,
      config: {
        controlPointDiameterBo: config.dominantBoltControlPointDiameterBo,
        detourRatioMax: config.dominantBoltDetourRatioMax,
        headingMemory: config.dominantBoltHeadingMemory,
        maxRangeBo: enemyTarget ? config.dominantBoltEnemyMaxRangeBo : config.dominantBoltMaxRangeBo,
        maxStepBo: config.dominantBoltMaxStepBo,
        minRangeBo: enemyTarget ? config.dominantBoltEnemyMinRangeBo : config.dominantBoltMinRangeBo,
        minStepBo: config.dominantBoltMinStepBo,
        pathJitterBo: config.dominantBoltPathJitterBo,
        pointSpacingBo: config.dominantBoltPointSpacingBo,
        rangeBo: config.dominantBoltRangeBo,
        seekStrength: config.dominantBoltSeekStrength,
        targetRadiusBo: config.dominantBoltTargetRadiusBo,
        wanderStrength: config.dominantBoltWanderStrength,
        zBo: config.dominantBoltZBo,
      },
      environmentSegments: typeof getEnvironmentSegments === "function" ? getEnvironmentSegments() : [],
      from,
      nav: null,
      phase: Number(payload && payload.phase) || 0,
      target: strikeTarget,
    });
    return Object.freeze({
      ...path,
      strikeKind: enemyTarget ? "enemy" : "environment",
      targetEnemy: enemyTarget,
    });
  }

  function syncControlPoints(path, bo, config = null) {
    if (!dominantLayer || !path || !Array.isArray(path.points)) return;
    const shaderConfig = config || normalizeElectricAoe3dRuntimeConfig(typeof getConfig === "function" ? getConfig() : {});
    const runtimePoints = path.points.map((point) => toRuntimeVector(point, bo, path));
    if (!lineMaterial) {
      lineMaterial = createBoltFadeMaterial({
        color: rgbColor(shaderConfig.boltShaderCoreR, shaderConfig.boltShaderCoreG, shaderConfig.boltShaderCoreB),
        opacity: 1,
        tipOpacity: shaderConfig.boltShaderTipOpacity,
      });
    }
    lineMaterial.uniforms.uColor.value.copy(rgbColor(shaderConfig.boltShaderCoreR, shaderConfig.boltShaderCoreG, shaderConfig.boltShaderCoreB));
    lineMaterial.uniforms.uOpacity.value = shaderConfig.boltShaderEnabled === false ? 0.68 : Math.max(0.2, Math.min(1, 0.28 * shaderConfig.boltShaderCoreIntensity));
    lineMaterial.uniforms.uTipOpacity.value = Math.max(0, Math.min(1, Number(shaderConfig.boltShaderTipOpacity) || 0));
    if (!line) {
      line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
      line.name = "electric_aoe3d:stage_dominant_control_line";
      line.renderOrder = 239;
      dominantLayer.add(line);
    }
    line.geometry.dispose();
    line.geometry = createPathLineGeometry(runtimePoints);
    line.visible = runtimePoints.length > 1;
    const pointDiameterBo = Math.max(0.01, Number(path.controlPointDiameterBo) || ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.controlPointDiameterBo);
    if (!pointGeometry) pointGeometry = new THREE.SphereGeometry(bo * pointDiameterBo * 0.5, 18, 10);
    if (!pointMaterial) {
      pointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        toneMapped: false,
      });
    }
    path.points.forEach((point, index) => {
      let marker = dominantLayer.children[index + 1];
      if (!marker) {
        marker = new THREE.Mesh(pointGeometry, pointMaterial);
        marker.name = `electric_aoe3d:stage_dominant_control_point_${index}`;
        marker.renderOrder = 240;
        dominantLayer.add(marker);
      }
      marker.visible = true;
      marker.position.copy(runtimePoints[index]);
    });
    for (let index = path.points.length + 1; index < dominantLayer.children.length; index += 1) {
      dominantLayer.children[index].visible = false;
    }
  }

  function applyEnemyStrike(path, config, bo, payload = {}) {
    if (!path || path.strikeKind !== "enemy" || !path.targetEnemy || typeof onEnemyStrike !== "function") return null;
    return onEnemyStrike({
      atMs: typeof now === "function" ? now() : performance.now(),
      bo,
      config,
      damage: resolveStrikeDamage(config),
      path,
      payload,
      target: path.targetEnemy,
    });
  }

  function syncStrike(payload = {}) {
    if (!group) return null;
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 42);
    const config = normalizeElectricAoe3dRuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const path = planDominantBolt(payload);
    syncControlPoints(path, bo, config);
    const enemyResult = applyEnemyStrike(path, config, bo, payload);
    requestFrame();
    return { config, enemyResult, path };
  }

  function scheduleNextStrike(payload = {}, untilMs = 0, previousPath = null, config = null) {
    if (!group) return;
    const safeConfig = config || normalizeElectricAoe3dRuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const isEnemyStrike = previousPath && previousPath.strikeKind === "enemy";
    const delayMs = Math.round(isEnemyStrike
      ? randomBetween(safeConfig.dominantBoltEnemyFrequencyMinMs, safeConfig.dominantBoltEnemyFrequencyMaxMs)
      : randomBetween(safeConfig.dominantBoltEnvironmentFrequencyMinMs, safeConfig.dominantBoltEnvironmentFrequencyMaxMs));
    const nowMs = typeof now === "function" ? now() : performance.now();
    if (nowMs + delayMs > untilMs) return;
    strikeTimer = setTimeout(() => {
      strikeTimer = 0;
      const result = syncStrike(payload);
      scheduleNextStrike(payload, untilMs, result && result.path, result && result.config);
    }, delayMs);
  }

  function play(payload = {}) {
    clear();
    const parent = typeof getParent === "function" ? getParent() : null;
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    const config = normalizeElectricAoe3dRuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const path = planDominantBolt(payload);
    if ((!parent && !orbModel) || !path || !path.points || !path.points.length) {
      return { handled: false, skipped: "electric_aoe3d_control_path_only", path };
    }
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 42);
    group = new THREE.Group();
    group.name = "electric_aoe3d:dominant_bolt_runtime";
    dominantLayer = new THREE.Group();
    dominantLayer.name = "electric_aoe3d:dominant_bolt_control_points";
    haloLayer = new THREE.Group();
    haloLayer.name = "electric_aoe3d:halo_bolt_control_points";
    group.add(dominantLayer);
    group.add(haloLayer);
    (parent || orbModel).add(group);
    syncControlPoints(path, bo, config);
    syncHaloField(config, bo);
    haloTimer = setInterval(() => {
      syncHaloField(config, bo);
      requestFrame();
    }, HALO_CONTROL_POINT_REFRESH_MS);
    const enemyResult = applyEnemyStrike(path, config, bo, payload);
    const startedAtMs = typeof now === "function" ? now() : performance.now();
    scheduleNextStrike(payload, startedAtMs + config.durationMs, path, config);
    timer = setTimeout(clear, config.durationMs);
    requestFrame();
    return { handled: true, enemyResult, path };
  }

  return Object.freeze({
    clear,
    destroy: clear,
    isActive() {
      return !!group;
    },
    planDominantBolt,
    play,
  });
}
