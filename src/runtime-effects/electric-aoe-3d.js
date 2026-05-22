import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import {
  buildElectricAoeDominantBoltControlPath,
  ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS,
} from "../game-runtime/spells/electric-aoe-dominant-bolt-planner.js?v=20260521a";
import { createElectricAoeHaloBoltPlanner } from "../game-runtime/spells/electric-aoe-halo-bolt-planner.js?v=20260521e";
import { ELECTRIC_AOE_BEHAVIOR_DEFAULT } from "../game-runtime/behaviors/electric-aoe-behavior-default.js?v=20260521180001b";
import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/electric-aoe-3d-default.js?v=20260521180001";

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
  const haloBoltMinRangeBo = clampNumber(source.haloBoltMinRangeBo, 0, 16, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMinRangeBo);
  const haloBoltMaxRangeBo = clampNumber(source.haloBoltMaxRangeBo, Math.max(0.05, haloBoltMinRangeBo), 16, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMaxRangeBo);
  const haloBoltMinTotal = Math.round(clampNumber(source.haloBoltMinTotal, 0, 64, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMinTotal));
  const haloBoltMaxTotal = Math.round(clampNumber(source.haloBoltMaxTotal, haloBoltMinTotal, 64, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMaxTotal));
  const haloBoltMinWalkSpeed = clampNumber(source.haloBoltMinWalkSpeed, 0, 12, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMinWalkSpeed);
  const haloBoltMaxWalkSpeed = clampNumber(source.haloBoltMaxWalkSpeed, haloBoltMinWalkSpeed, 12, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMaxWalkSpeed);
  const haloBoltMinStepBo = clampNumber(source.haloBoltMinStepBo, 0.01, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMinStepBo);
  const haloBoltMaxStepBo = clampNumber(source.haloBoltMaxStepBo, haloBoltMinStepBo, 4, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltMaxStepBo);
  const haloBoltForksMin = Math.round(clampNumber(source.haloBoltForksMin, 0, 12, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForksMin));
  const haloBoltForksMax = Math.round(clampNumber(source.haloBoltForksMax, haloBoltForksMin, 12, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForksMax));
  const haloBoltForkLengthMinBo = clampNumber(source.haloBoltForkLengthMinBo, 0, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkLengthMinBo);
  const haloBoltForkLengthMaxBo = clampNumber(source.haloBoltForkLengthMaxBo, haloBoltForkLengthMinBo, 8, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltForkLengthMaxBo);
  const haloFieldMinFeaturePoints = Math.round(clampNumber(source.haloFieldMinFeaturePoints, 0, 64, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldMinFeaturePoints));
  const haloFieldMaxFeaturePoints = Math.round(clampNumber(source.haloFieldMaxFeaturePoints, haloFieldMinFeaturePoints, 64, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldMaxFeaturePoints));
  const haloFieldMinDriftSpeed = clampNumber(source.haloFieldMinDriftSpeed, 0, 12, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldMinDriftSpeed);
  const haloFieldMaxDriftSpeed = clampNumber(source.haloFieldMaxDriftSpeed, haloFieldMinDriftSpeed, 12, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldMaxDriftSpeed);
  const haloFieldMinDifferentialOffset = clampNumber(source.haloFieldMinDifferentialOffset, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldMinDifferentialOffset);
  const haloFieldMaxDifferentialOffset = clampNumber(source.haloFieldMaxDifferentialOffset, haloFieldMinDifferentialOffset, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldMaxDifferentialOffset);
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
    haloBoltForkLengthMaxBo,
    haloBoltForkLengthMinBo,
    haloBoltForksMax,
    haloBoltForksMin,
    haloBoltMaxRangeBo,
    haloBoltMaxStepBo,
    haloBoltMaxTotal,
    haloBoltMaxWalkSpeed,
    haloBoltMinRangeBo,
    haloBoltMinStepBo,
    haloBoltMinTotal,
    haloBoltMinWalkSpeed,
    haloBoltPathJitterBo: clampNumber(source.haloBoltPathJitterBo, 0, 2, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloBoltPathJitterBo),
    haloFieldCellJitter: clampNumber(source.haloFieldCellJitter, 0, 1, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldCellJitter),
    haloFieldEnabled: source.haloFieldEnabled !== false,
    haloFieldMaxDifferentialOffset,
    haloFieldMaxDriftSpeed,
    haloFieldMaxFeaturePoints,
    haloFieldMinDifferentialOffset,
    haloFieldMinDriftSpeed,
    haloFieldMinFeaturePoints,
    haloFieldSeed: Math.round(clampNumber(source.haloFieldSeed, 1, 999999999, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldSeed)),
    haloFieldSliceWidthBo: clampNumber(source.haloFieldSliceWidthBo, 0, 2, ELECTRIC_AOE_3D_PRESET_DEFAULT.haloFieldSliceWidthBo),
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
  let haloBoltPlanner = null;

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
    if (haloBoltPlanner && typeof haloBoltPlanner.reset === "function") haloBoltPlanner.reset();
    haloBoltPlanner = null;
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

  function clearLayerChildren(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      if (child.geometry && child.geometry !== haloPointGeometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
      if (child.material && child.material !== haloLineMaterial && child.material !== haloPointMaterial && typeof child.material.dispose === "function") {
        child.material.dispose();
      }
    }
  }

  function buildHaloBoltPaths(config, bo, time = 0, from = {}) {
    if (!haloBoltPlanner) haloBoltPlanner = createElectricAoeHaloBoltPlanner();
    return haloBoltPlanner.buildPaths({
      bo,
      config,
      from,
      time,
    });
  }

  function toRuntimeVector(point, bo, path = null) {
    const sharedRuntimeZ = typeof getRuntimeZ === "function" ? getRuntimeZ({ bo, path }) : null;
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

  function syncHaloBolts(config, bo) {
    if (!haloLayer) return;
    clearLayerChildren(haloLayer);
    const time = (typeof now === "function" ? now() : performance.now()) / 1000;
    const from = typeof getOrbWorldPosition === "function" ? getOrbWorldPosition() : {};
    const paths = buildHaloBoltPaths(config, bo, time, from);
    if (!haloLineMaterial) {
      haloLineMaterial = new THREE.LineBasicMaterial({
        color: 0xd8f7ff,
        transparent: true,
        opacity: 0.56,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    if (!haloPointMaterial) {
      haloPointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    if (!haloPointGeometry) haloPointGeometry = new THREE.SphereGeometry(bo * 0.05 * 0.5, 14, 8);
    paths.forEach((path, pathIndex) => {
      const linePoints = path.points.map((point) => toRuntimeVector(point, bo, path));
      const haloLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), haloLineMaterial);
      haloLine.name = `electric_aoe3d:stage_halo_control_line_${pathIndex}`;
      haloLine.renderOrder = 234;
      haloLayer.add(haloLine);
      path.forks.forEach((fork, forkIndex) => {
        const forkLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(fork.map((point) => toRuntimeVector(point, bo, path))), haloLineMaterial);
        forkLine.name = `electric_aoe3d:stage_halo_control_fork_${pathIndex}_${forkIndex}`;
        forkLine.renderOrder = 235;
        haloLayer.add(forkLine);
      });
      linePoints.forEach((point, pointIndex) => {
        const marker = new THREE.Mesh(haloPointGeometry, haloPointMaterial);
        marker.name = `electric_aoe3d:stage_halo_control_point_${pathIndex}_${pointIndex}`;
        marker.renderOrder = 236;
        marker.position.copy(point);
        haloLayer.add(marker);
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

  function syncControlPoints(path, bo) {
    if (!dominantLayer || !path || !Array.isArray(path.points)) return;
    const runtimePoints = path.points.map((point) => toRuntimeVector(point, bo, path));
    if (!lineMaterial) {
      lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
      });
    }
    if (!line) {
      line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
      line.name = "electric_aoe3d:stage_dominant_control_line";
      line.renderOrder = 239;
      dominantLayer.add(line);
    }
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints(runtimePoints);
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
    syncControlPoints(path, bo);
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
    syncControlPoints(path, bo);
    syncHaloBolts(config, bo);
    haloTimer = setInterval(() => {
      syncHaloBolts(config, bo);
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
