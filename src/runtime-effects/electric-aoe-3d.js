import * as THREE from "three";
import { disposeThreeObject } from "../game-runtime/rendering/three/three-object-utils.js";
import {
  buildElectricAoeDominantBoltControlPath,
  ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS,
} from "../game-runtime/spells/electric-aoe-dominant-bolt-planner.js?v=20260521a";
import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../vfx/presets/electric-aoe-3d-default.js?v=20260521a";

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

export function normalizeElectricAoe3dRuntimeConfig(raw = {}) {
  const source = {
    ...ELECTRIC_AOE_3D_PRESET_DEFAULT,
    ...(raw && typeof raw === "object" ? raw : {}),
  };
  return Object.freeze({
    durationMs: Math.round(clampNumber(source.durationMs, 200, 60000, ELECTRIC_AOE_3D_PRESET_DEFAULT.durationMs)),
    dominantBoltControlPointDiameterBo: clampNumber(
      source.dominantBoltControlPointDiameterBo,
      0.01,
      0.5,
      ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.controlPointDiameterBo
    ),
    dominantBoltDetourRatioMax: clampNumber(source.dominantBoltDetourRatioMax, 1, 8, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.detourRatioMax),
    dominantBoltPathJitterBo: clampNumber(source.dominantBoltPathJitterBo, 0, 2, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.pathJitterBo),
    dominantBoltPointSpacingBo: clampNumber(source.dominantBoltPointSpacingBo, 0.05, 4, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.pointSpacingBo),
    dominantBoltRangeBo: clampNumber(source.dominantBoltRangeBo, 0.25, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.rangeBo),
    dominantBoltTargetRadiusBo: clampNumber(source.dominantBoltTargetRadiusBo, 0.25, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.targetRadiusBo),
    dominantBoltZBo: clampNumber(source.dominantBoltZBo, -64, 64, ELECTRIC_AOE_DOMINANT_BOLT_DEFAULTS.zBo),
  });
}

export function createElectricAoe3dRuntime(options = {}) {
  const {
    getBo = () => 42,
    getConfig = () => ELECTRIC_AOE_3D_PRESET_DEFAULT,
    getLevelNav = () => null,
    getOrbModel = () => null,
    getOrbWorldPosition = () => ({ xW: 0, yW: 0 }),
    requestFrame = () => {},
  } = options;
  let group = null;

  function clear() {
    if (group && group.parent) group.parent.remove(group);
    if (group) disposeThreeObject(group);
    group = null;
    requestFrame();
  }

  function planDominantBolt(payload = {}) {
    const bo = Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 42);
    const config = normalizeElectricAoe3dRuntimeConfig({
      ...(typeof getConfig === "function" ? getConfig() : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    return buildElectricAoeDominantBoltControlPath({
      bo,
      config: {
        controlPointDiameterBo: config.dominantBoltControlPointDiameterBo,
        detourRatioMax: config.dominantBoltDetourRatioMax,
        pathJitterBo: config.dominantBoltPathJitterBo,
        pointSpacingBo: config.dominantBoltPointSpacingBo,
        rangeBo: config.dominantBoltRangeBo,
        targetRadiusBo: config.dominantBoltTargetRadiusBo,
        zBo: config.dominantBoltZBo,
      },
      from: typeof getOrbWorldPosition === "function" ? getOrbWorldPosition() : {},
      nav: typeof getLevelNav === "function" ? getLevelNav() : null,
      phase: Number(payload && payload.phase) || 0,
      target: payload && payload.target ? payload.target : null,
    });
  }

  function play(payload = {}) {
    clear();
    const orbModel = typeof getOrbModel === "function" ? getOrbModel() : null;
    const path = planDominantBolt(payload);
    if (!orbModel || !path || !path.points || !path.points.length) {
      return { handled: false, skipped: "electric_aoe3d_control_path_only", path };
    }
    group = new THREE.Group();
    group.name = "electric_aoe3d:dominant_bolt_runtime";
    orbModel.add(group);
    requestFrame();
    return { handled: true, path };
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
