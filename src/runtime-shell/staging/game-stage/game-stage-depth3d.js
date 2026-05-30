import { createOrb3dActorRuntime } from "../../../game-runtime/orb/orb-3d-actor-runtime.js?v=20260527-tesla-light-a";
import { COMBAT_EFFECT_DAMAGE, COMBAT_EFFECT_IMMUNITY, COMBAT_ENTITY_ORB, COMBAT_EFFECT_STUN, DAMAGE_TYPE_ELECTRIC, DAMAGE_TYPE_FIRE } from "../../../game-runtime/combat/combat-constants.js";
import { EVT_COMBAT_IMMUNITY_CHANGED, EVT_COMBAT_STUN_APPLIED } from "../../../contracts/events.js";
import {
  LEVEL_DEPTH_CAMERA_FOV_DEG,
  LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS,
  LEVEL_DEPTH_DEFAULT_ORB_Z_BO,
  resolveOrbTravelZBO,
} from "../../../game-runtime/level/depth-projection.js?v=20260508a";
import {
  resolveDepthBootFrame,
  resolveDepthCameraFrame,
} from "../../../game-runtime/level/depth-stage-frame.js?v=20260430a";
import {
  resolveDepthSpawnAnchor,
  toDepthThreeX,
  toDepthThreeY,
} from "../../../game-runtime/level/depth-runtime-coordinates.js?v=20260430b";
import {
  buildDepthLayerMesh,
} from "../../../game-runtime/level/depth-layer-3d-mesh.js?v=20260508b";
import { createArtPlane3dRuntime } from "../../../game-runtime/level-graphics/art-plane-3d-runtime.js?v=20260508f";
import { createStarField3dRuntime } from "../../../game-runtime/level-graphics/star-field-3d-runtime.js?v=20260526213000";
import {
  AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES,
  AUTHORED_LEVEL_READ_MODEL_KEY_DEPTH_LAYERS,
  AUTHORED_LEVEL_READ_MODEL_KEY_ENEMY_SPAWNS,
  AUTHORED_LEVEL_READ_MODEL_KEY_ORB_DEPTH,
  AUTHORED_LEVEL_READ_MODEL_KEY_PROPS,
  resolveAuthoredLevelReadModelArray,
  resolveAuthoredLevelReadModelObject,
} from "../../../game-runtime/level/authored-level-read-model.js";
import { createGnatSwarm3dRuntime } from "../../../game-runtime/enemies/gnat-swarm-3d-runtime.js?v=20260526213000";
import { buildBoundarySegmentsFromLoops } from "../../../game-runtime/collision/boundary-segments.js?v=20260520-inward-normals-a";
import { closestPointOnSegment } from "../../../game-runtime/collision/circle-boundary-collision.js?v=20260518b";
import { createSurfaceFireCardSystem } from "../../../game-runtime/vfx/fire/surface-fire-card-system.js?v=20260526213000";
import {
  buildLevelNavGrid,
  LEVEL_NAV_GRID_RESOLUTION_BO,
} from "../../../game-runtime/level/nav/level-nav-grid.js?v=20260515a";
import { createLevelNavContext } from "../../../game-runtime/level/nav/level-nav-context.js?v=20260521a";
import {
  applyThreeMeshFlags,
  disposeThreeObject,
} from "../../../game-runtime/rendering/three/three-object-utils.js";
import { createWorldProps3dRuntime } from "../../../game-runtime/world/props/world-props-3d-runtime.js?v=20260430c";
import { createRuntimeGlobe3dObject } from "../../../game-runtime/world/globe-3d-runtime-object.js?v=20260502a";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../../../game-runtime/world/world-globe-3d-default.js?v=20260502c";
import { createWorldGlobe3dRuntime } from "../../../game-runtime/world/world-globe-3d-runtime.js?v=20260502c";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "../../../game-runtime/orb/orb-globe-3d-default.js?v=20260504b";
import { createOrbGlobe3dRuntime } from "../../../game-runtime/orb/orb-globe-3d-runtime.js?v=20260504f";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../game-runtime/orb/orb-3d-default.js?v=20260517a";
import { createOrbShaderMixer } from "../../../game-runtime/orb/orb-shader-mixer.js?v=20260527-tesla-light-a";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../../game-runtime/orb/orb-lifecycle-3d-default.js?v=20260517g";
import { createOrbLifecycle3dRuntime } from "../../../game-runtime/orb/orb-lifecycle-3d-runtime.js?v=20260517h";
import {
  getOrbHealPulseLayerId,
  resolveOrbHealPulseShaderLayer,
} from "../../../game-runtime/orb/orb-shader-heal-pulse-layer.js?v=20260517b";
import { createTeleport3dRuntime } from "../../../runtime-effects/teleport-3d.js?v=20260501a";
import { createBubbleShield3dRuntime } from "../../../runtime-effects/bubble-shield-3d.js?v=20260506d";
import { createFlameAoe3dRuntime } from "../../../runtime-effects/flame-aoe-3d.js?v=20260529171000";
import { createTesla1Runtime } from "../../../runtime-effects/tesla-1.js?v=20260527122742s";
import { createShockwave3dRuntime } from "../../../runtime-effects/shockwave-3d.js?v=20260506a";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../../../vfx/presets/bubble-shield-3d-default.js?v=20260506d";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../../../vfx/presets/flame-aoe-3d-default.js?v=20260529165820";
import { TESLA_1_PRESET_DEFAULT } from "../../../vfx/presets/tesla-1-default.js?v=20260527122742";
import { FLAME_AOE_BEHAVIOR_DEFAULT } from "../../../game-runtime/behaviors/flame-aoe-behavior-default.js?v=20260529165820";
import { TESLA_1_BEHAVIOR_DEFAULT } from "../../../game-runtime/behaviors/tesla-1-behavior-default.js?v=20260527122742b";
import { SHOCKWAVE_3D_PRESET_DEFAULT } from "../../../vfx/presets/shockwave-3d-default.js?v=20260506a";
import { HEAL_PRESET_DEFAULT } from "../../../vfx/presets/heal-default.js?v=20260517b";
import { createGameStageDepth3dEventBindings } from "./game-stage-depth3d-events.js?v=20260517p";
import { createGameStageDepth3dBloom } from "./game-stage-depth3d-bloom.js?v=20260526213000";
import {
  GAME_STAGE_DEPTH3D_TRACE_VERSION,
  publishDepth3dModuleVersion,
} from "./game-stage-depth3d-debug.js?v=20260520075000";
import { createGameStageDepth3dRenderLoop } from "./game-stage-depth3d-render-loop.js?v=20260430b";
import { createGameStageDepth3dScene } from "./game-stage-depth3d-scene.js?v=20260514a";
import { createGameStageDepth3dTelemetry } from "./game-stage-depth3d-telemetry.js?v=20260430b";
import { GNAT_SWARM_ENEMY_DEFAULT } from "../../../content/enemies/gnat-swarm.js?v=20260515c";

const BO_WORLD_UNITS = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS;
const DEPTH_CAMERA_FOV_DEG = LEVEL_DEPTH_CAMERA_FOV_DEG;
const WORLD_GLOBE_FOREGROUND_Z_BO = 0.08;
const TESLA1_ORB_SHADER_LAYER_ID = "tesla1";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveSceneModel(authoredScene = null) {
  return authoredScene && authoredScene.sceneModel ? authoredScene.sceneModel : null;
}

function resolveSceneSummary(authoredScene = null) {
  return authoredScene && authoredScene.summary ? authoredScene.summary : null;
}

function resolveSceneDepthLayers(authoredScene = null) {
  return resolveAuthoredLevelReadModelArray(authoredScene, AUTHORED_LEVEL_READ_MODEL_KEY_DEPTH_LAYERS);
}

function resolveSceneArtShapes(authoredScene = null) {
  return resolveAuthoredLevelReadModelArray(authoredScene, AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES);
}

function resolveSceneProps(authoredScene = null) {
  return resolveAuthoredLevelReadModelArray(authoredScene, AUTHORED_LEVEL_READ_MODEL_KEY_PROPS);
}

function resolveSceneEnemySpawns(authoredScene = null) {
  return resolveAuthoredLevelReadModelArray(authoredScene, AUTHORED_LEVEL_READ_MODEL_KEY_ENEMY_SPAWNS);
}

function resolveSceneOrbDepth(authoredScene = null) {
  return resolveAuthoredLevelReadModelObject(authoredScene, AUTHORED_LEVEL_READ_MODEL_KEY_ORB_DEPTH);
}

function resolveWorldGlobeDepthZ({
  spawn = null,
  bo = BO_WORLD_UNITS,
  orbZBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO,
} = {}) {
  if (String(spawn && spawn.zMode || "").trim().toLowerCase() === "orb") {
    return -Math.max(0, clampNumber(orbZBO, LEVEL_DEPTH_DEFAULT_ORB_Z_BO)) * Math.max(1, Number(bo) || BO_WORLD_UNITS);
  }
  const authoredZBO = Number(spawn && (spawn.zBO ?? spawn.depthZBO));
  if (Number.isFinite(authoredZBO)) return -Math.max(0, authoredZBO) * Math.max(1, Number(bo) || BO_WORLD_UNITS);
  return Math.max(1, Number(bo) || BO_WORLD_UNITS) * WORLD_GLOBE_FOREGROUND_Z_BO;
}

export function createGameStageDepth3dLayer({
  root = null,
  labelEl = null,
  debugEl = null,
  orbDiameterWorldUnits = BO_WORLD_UNITS,
  perfTrace = null,
} = {}) {
  if (!root) return null;
  publishDepth3dModuleVersion(GAME_STAGE_DEPTH3D_TRACE_VERSION);
  if (perfTrace && typeof perfTrace.mark === "function") {
    perfTrace.mark("depth3d.module", {
      version: GAME_STAGE_DEPTH3D_TRACE_VERSION,
      bloomFactory: typeof createGameStageDepth3dBloom,
    });
  }
  const sceneRuntime = createGameStageDepth3dScene({
    root,
    fovDeg: DEPTH_CAMERA_FOV_DEG,
  });
  const {
    renderer,
    scene,
    camera,
    environmentMode,
    backgroundGroup,
    depthGroup: group,
    artGroup,
    propsGroup,
    actorGroup,
    globeGroup: globe3dGroup,
    enemyGroup,
  } = sceneRuntime;

  let disposed = false;
  let worldWidthPx = 1;
  let worldHeightPx = 1;
  let depthLayerCount = 0;
  let lastRenderWidth = 0;
  let lastRenderHeight = 0;
  let hasCameraFrame = false;
  let lastCameraAspect = 0;
  let lastCameraNear = 0;
  let lastCameraFar = 0;
  let lastCameraX = 0;
  let lastCameraY = 0;
  let lastCameraZ = 0;
  const baseOrbWorldUnits = Math.max(1, clampNumber(orbDiameterWorldUnits, BO_WORLD_UNITS));
  let currentOrbZBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO;
  let currentOrbWorldPosition = null;
  let currentOrbAlive = true;
  let currentBoundarySegments = Object.freeze([]);
  let currentLevelNavContext = null;
  let currentLevelNavGrid = null;
  let currentEnemySpawns = Object.freeze([]);
  let currentBoundaryLoops = Object.freeze([]);
  let currentBoundaryBox = null;
  let combatEventBus = null;
  let lastGlobe3dTickMs = 0;
  let lastEnemy3dTickMs = 0;
  let lastEnemyTelemetryAtMs = 0;
  let lastEnemyBurnTraceAtMs = 0;
  let lastDepth3dTelemetryAtMs = 0;
  let lastStarFieldVisibleObjectCount = null;
  let activeFlameAoeHazard = null;
  let activeTesla1OrbLightConfig = null;
  let tesla1OrbLightFlash = Object.freeze({
    activeUntilMs: 0,
    startedAtMs: 0,
    durationMs: 0,
    peakMultiplier: 1,
    energy: 0,
    decayCurve: 2.4,
  });
  let boundGlobe3dSpawns = Object.freeze([]);
  const telemetry = createGameStageDepth3dTelemetry({
    root,
    labelEl,
    debugEl,
    fallbackBo: baseOrbWorldUnits,
  });
  const bloom = createGameStageDepth3dBloom({
    renderer,
    scene,
    camera,
  });
  if (perfTrace && typeof perfTrace.mark === "function") {
    const trace = bloom && typeof bloom.getTrace === "function" ? bloom.getTrace() : null;
    perfTrace.mark(trace ? "depth3d.bloom.created" : "depth3d.bloom.missing", trace ? {
      config: trace.config,
      renderer: trace.renderer,
      camera: trace.camera,
    } : {
      renderer: !!renderer,
      scene: !!scene,
      camera: !!camera,
    });
  }
  let bloomMarkedReady = false;
  let bloomMarkedRender = false;
  let healPulseFrame = 0;
  let healPulseToken = 0;
  const renderLoop = createGameStageDepth3dRenderLoop({
    isDisposed: () => disposed,
    hasActiveAnimation: hasActiveGlobe3dAnimation,
    renderNow: doRenderFrame,
    allowInternalAnimationLoop: false,
  });
  const orb3dActorRuntime = createOrb3dActorRuntime({
    parent: actorGroup,
    fallbackBo: baseOrbWorldUnits,
    getDefaultZBO: () => currentOrbZBO,
    toRuntimePosition: ({ x = 0, y = 0, z = 0 } = {}) => ({
      x: toDepthThreeX(x, worldWidthPx),
      y: toDepthThreeY(y, worldHeightPx),
      z,
    }),
    applyMeshFlags: applyThreeMeshFlags,
    onTelemetry: telemetry.updateOrbTelemetry,
    onModelChanged: () => {
      orbLifecycle3dRuntime.attachOrbModel();
    },
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const teleport3dRuntime = createTeleport3dRuntime({
    setOpacity: (alpha = 1) => orb3dActorRuntime.setOpacity(alpha),
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const bubbleShield3dRuntime = createBubbleShield3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => BUBBLE_SHIELD_3D_PRESET_DEFAULT,
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
    traceMark: perfTrace && typeof perfTrace.mark === "function"
      ? (name, value = {}) => perfTrace.mark(name, value)
      : null,
  });
  const flameAoe3dRuntime = createFlameAoe3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getOrbPosition: () => orb3dActorRuntime.getPosition(),
    getGroundContactY: () => resolveOrbGroundContactRuntimeY(),
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => FLAME_AOE_3D_PRESET_DEFAULT,
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
    traceMeasure: perfTrace && typeof perfTrace.measure === "function" ? perfTrace.measure : null,
  });
  const tesla1Runtime = createTesla1Runtime({
    getParent: () => actorGroup,
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getOrbRuntimePosition: () => orb3dActorRuntime.getPosition(),
    getOrbWorldPosition: () => currentOrbWorldPosition || { xW: 0, yW: 0 },
    getEnemyTargets: () => gnatSwarm3dRuntime.getCombatTargets(),
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => ({ ...TESLA_1_PRESET_DEFAULT, ...TESLA_1_BEHAVIOR_DEFAULT }),
    resolveMasterBoltPath: resolveTesla1MasterBoltPath,
    onHaloStrike: ({ target = null, damage = 0, hitRadiusBo = 0.12, stunDamage = 0, config = {}, atMs = performance.now() } = {}) => {
      const position = target && target.position ? target.position : null;
      if (!position || !currentOrbWorldPosition) return Object.freeze({ handled: false, affected: 0, reason: "missing_target" });
      const radiusBo = Math.max(0.01, Number(hitRadiusBo) || 0.12);
      const damageResult = gnatSwarm3dRuntime.applyCombatEffect({
        kind: COMBAT_EFFECT_DAMAGE,
        sourceEntityId: COMBAT_ENTITY_ORB,
        targetEntityId: "enemy:gnat-swarm",
        centerWorld: position,
        radiusBo,
        amount: Math.max(0, Number(damage) || 0),
        damageType: DAMAGE_TYPE_ELECTRIC,
        visualProfile: String(config.visualProfile || "spellstorm"),
        atMs,
        tags: ["spell", "tesla-1", "halo-strike"],
      });
      const stunResult = gnatSwarm3dRuntime.applyCombatEffect({
        kind: COMBAT_EFFECT_STUN,
        sourceEntityId: COMBAT_ENTITY_ORB,
        targetEntityId: "enemy:gnat-swarm",
        centerWorld: position,
        radiusBo,
        amount: Math.max(0, Number(stunDamage) || 0),
        atMs,
        tags: ["spell", "tesla-1", "halo-strike"],
      });
      root.dataset.enemy3dLastTesla1DamageCount = String(damageResult && damageResult.affected || 0);
      root.dataset.enemy3dLastTesla1DamageAmount = String(Math.max(0, Number(damage) || 0));
      root.dataset.enemy3dLastTesla1DamageTotal = String(damageResult && Number.isFinite(Number(damageResult.totalDamage)) ? Number(damageResult.totalDamage) : 0);
      root.dataset.enemy3dLastTesla1StunCount = String(stunResult && stunResult.affected || 0);
      root.dataset.enemy3dLastTesla1StunAmount = String(Math.max(0, Number(stunDamage) || 0));
      root.dataset.enemy3dLastTesla1HitRadiusBo = String(radiusBo);
      root.dataset.enemy3dLastTesla1Target = String(target.id || target.targetEntityId || "");
      root.dataset.enemy3dLastTesla1DamageReason = String(damageResult && damageResult.trace && damageResult.trace.reason || "");
      startTesla1OrbLightFlash({ kind: "halo", target, config, atMs });
      return Object.freeze({ damage: damageResult, stun: stunResult });
    },
    onMasterBolt: ({ target = null, damage = 0, hitRadiusBo = 0.45, stunDamage = 0, config = {}, atMs = performance.now(), visualLengthBo = 0 } = {}) => {
      const position = target && target.position ? target.position : null;
      if (!position || !currentOrbWorldPosition) return Object.freeze({ handled: false, affected: 0, reason: "missing_target" });
      const radiusBo = Math.max(0.01, Number(hitRadiusBo) || 0.45);
      const damageResult = gnatSwarm3dRuntime.applyCombatEffect({
        kind: COMBAT_EFFECT_DAMAGE,
        sourceEntityId: COMBAT_ENTITY_ORB,
        targetEntityId: target.targetEntityId || target.id || "enemy:gnat-swarm",
        targetIndex: target.index,
        centerWorld: position,
        radiusBo,
        amount: Math.max(0, Number(damage) || 0),
        damageType: DAMAGE_TYPE_ELECTRIC,
        visualProfile: String(config.visualProfile || "spellstorm"),
        atMs,
        tags: ["spell", "tesla-1", "master-bolt"],
      });
      const stunResult = gnatSwarm3dRuntime.applyCombatEffect({
        kind: COMBAT_EFFECT_STUN,
        sourceEntityId: COMBAT_ENTITY_ORB,
        targetEntityId: target.targetEntityId || target.id || "enemy:gnat-swarm",
        targetIndex: target.index,
        centerWorld: position,
        radiusBo,
        amount: Math.max(0, Number(stunDamage) || 0),
        atMs,
        tags: ["spell", "tesla-1", "master-bolt"],
      });
      root.dataset.enemy3dLastTesla1MasterDamageCount = String(damageResult && damageResult.affected || 0);
      root.dataset.enemy3dLastTesla1MasterDamageAmount = String(Math.max(0, Number(damage) || 0));
      root.dataset.enemy3dLastTesla1MasterDamageTotal = String(damageResult && Number.isFinite(Number(damageResult.totalDamage)) ? Number(damageResult.totalDamage) : 0);
      root.dataset.enemy3dLastTesla1MasterStunCount = String(stunResult && stunResult.affected || 0);
      root.dataset.enemy3dLastTesla1MasterStunAmount = String(Math.max(0, Number(stunDamage) || 0));
      root.dataset.enemy3dLastTesla1MasterHitRadiusBo = String(radiusBo);
      root.dataset.enemy3dLastTesla1MasterTarget = String(target.id || target.targetEntityId || "");
      root.dataset.enemy3dLastTesla1MasterDamageReason = String(damageResult && damageResult.trace && damageResult.trace.reason || "");
      startTesla1OrbLightFlash({ kind: "master", target, config, atMs, visualLengthBo });
      return Object.freeze({ damage: damageResult, stun: stunResult });
    },
    toRuntimePosition: ({ xW = 0, yW = 0, z = 0 } = {}) => ({
      x: toDepthThreeX(xW, worldWidthPx),
      y: toDepthThreeY(yW, worldHeightPx),
      z,
    }),
    requestFrame: () => renderLoop.scheduleAnimation(),
  });
  const shockwave3dRuntime = createShockwave3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => SHOCKWAVE_3D_PRESET_DEFAULT,
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const surfaceFireCardSystem = createSurfaceFireCardSystem({
    root: actorGroup,
    getBo: () => baseOrbWorldUnits,
    toRuntimePosition: ({ x = 0, y = 0, z = 0 } = {}) => ({
      x: toDepthThreeX(x, worldWidthPx),
      y: toDepthThreeY(y, worldHeightPx),
      z,
    }),
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const worldGlobe3dRuntime = createWorldGlobe3dRuntime({
    group: globe3dGroup,
    createGlobeObject: createRuntimeGlobe3dObject,
    resolveSpawnAnchor: (spawn) => resolveDepthSpawnAnchor(spawn, { worldWidthPx }),
    toRuntimePosition: ({ x = 0, y = 0, spawn = null } = {}) => ({
      x: toDepthThreeX(x, worldWidthPx),
      y: toDepthThreeY(y, worldHeightPx),
      z: resolveWorldGlobeDepthZ({ spawn, bo: baseOrbWorldUnits, orbZBO: currentOrbZBO }),
    }),
    getBo: () => baseOrbWorldUnits,
    getConfig: () => WORLD_GLOBE_3D_VISUAL_DEFAULTS,
    onSpawnCountChange: telemetry.setWorldGlobeSpawnCount,
    onActiveCountChange: telemetry.setWorldGlobeActiveCount,
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const orbGlobe3dRuntime = createOrbGlobe3dRuntime({
    group: globe3dGroup,
    createGlobeObject: createRuntimeGlobe3dObject,
    getBo: () => baseOrbWorldUnits,
    getCenterPosition: () => orb3dActorRuntime.getPosition(),
    getConfig: () => ORB_GLOBE_3D_VISUAL_DEFAULTS,
    getWorldGlobeConfig: () => WORLD_GLOBE_3D_VISUAL_DEFAULTS,
    onCountChange: telemetry.setOrbGlobeCount,
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const orbShaderMixer = createOrbShaderMixer({
    baseConfig: ORB_3D_VISUAL_DEFAULTS,
    applyShaderState: (shaderState = {}) => orb3dActorRuntime.setShaderState(shaderState),
    onApplied: (shaderState = {}, source = "mixer") => traceOrbShaderApplied(shaderState, source),
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  if (perfTrace && typeof perfTrace.mark === "function") {
    perfTrace.mark("orb.shader.mixer.ready", {
      baseConfig: { ...ORB_3D_VISUAL_DEFAULTS },
      mixer: orbShaderMixer && typeof orbShaderMixer.getTrace === "function"
        ? orbShaderMixer.getTrace()
        : null,
    });
  }
  const orbLifecycle3dRuntime = createOrbLifecycle3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBurstParent: () => actorGroup,
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => ORB_LIFECYCLE_3D_DEFAULTS,
    getShaderBaseConfig: () => ORB_3D_VISUAL_DEFAULTS,
    getBurstPosition: () => orb3dActorRuntime.getPosition(),
    setLifecycleErosion: (patch = null) => orb3dActorRuntime.setLifecycleErosion(patch),
    setShaderLayer: (id, layer = {}) => {
      const source = layer.id || id || "lifecycle3d";
      const values = layer.values || layer;
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("orb.shader.layer.request", {
          id,
          source,
          health: Number(layer.health),
          maxHealth: Number(layer.maxHealth),
          hpRatio: Number(layer.hpRatio),
          config: {
            pointLightIntensityMinPct: Number(ORB_LIFECYCLE_3D_DEFAULTS.pointLightIntensityMinPct),
            pointLightIntensityMaxPct: Number(ORB_LIFECYCLE_3D_DEFAULTS.pointLightIntensityMaxPct),
            pointLightDistanceMinPct: Number(ORB_LIFECYCLE_3D_DEFAULTS.pointLightDistanceMinPct),
            pointLightDistanceMaxPct: Number(ORB_LIFECYCLE_3D_DEFAULTS.pointLightDistanceMaxPct),
          },
          values: values && typeof values === "object" ? { ...values } : null,
        });
      }
      const resolved = orbShaderMixer.setLayer(id, values, { source });
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("orb.shader.layer.resolved", {
          id,
          source,
          resolved: resolved && typeof resolved === "object" ? { ...resolved } : null,
          mixer: orbShaderMixer && typeof orbShaderMixer.getTrace === "function"
            ? orbShaderMixer.getTrace()
            : null,
        });
      }
      return resolved;
    },
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  function traceOrbShaderApplied(requested = {}, source = "stage") {
    if (!perfTrace || typeof perfTrace.mark !== "function") return;
    const applied = typeof orb3dActorRuntime.getShaderTrace === "function"
      ? orb3dActorRuntime.getShaderTrace()
      : null;
    perfTrace.mark("orb.shader.applied", {
      source,
      requested: requested && typeof requested === "object" ? { ...requested } : null,
      applied,
      mixer: orbShaderMixer && typeof orbShaderMixer.getTrace === "function"
        ? orbShaderMixer.getTrace()
        : null,
    });
  }
  const eventBindings = createGameStageDepth3dEventBindings({
    root,
    worldGlobe3dRuntime,
    orbGlobe3dRuntime,
    orbLifecycle3dRuntime,
    startOrbHealShaderPulse: startHealShaderPulse,
    loadWorldSpawns: loadGlobe3dWorldSpawns,
    onOrbDied: (payload = {}) => {
      currentOrbAlive = false;
      if (gnatSwarm3dRuntime && typeof gnatSwarm3dRuntime.releaseOrbTargets === "function") {
        gnatSwarm3dRuntime.releaseOrbTargets(payload);
      }
    },
    onOrbRevived: () => {
      currentOrbAlive = true;
      resetEnemy3dRuntime({ reason: "orb_revived" });
    },
    scheduleFrame: renderLoop.scheduleAnimation,
    traceMark: perfTrace && typeof perfTrace.mark === "function"
      ? (name, value = {}) => perfTrace.mark(name, value)
      : null,
  });
  const worldProps3dRuntime = createWorldProps3dRuntime({
    group: propsGroup,
    getBo: () => orb3dActorRuntime.getBo(),
    getOrbZBO: () => currentOrbZBO,
    toRuntimePosition: ({ x = 0, y = 0 } = {}) => ({
      x: toDepthThreeX(x, worldWidthPx),
      y: toDepthThreeY(y, worldHeightPx),
    }),
    onCountChange: telemetry.setPropCount,
  });
  const artPlane3dRuntime = createArtPlane3dRuntime({
    group: artGroup,
    getBo: () => baseOrbWorldUnits,
    toRuntimePosition: ({ xW = 0, yW = 0 } = {}) => ({
      x: toDepthThreeX(xW, worldWidthPx),
      y: toDepthThreeY(yW, worldHeightPx),
    }),
    onCountChange: (count) => {
      root.dataset.artPlaneCount = String(Math.max(0, Math.floor(Number(count) || 0)));
    },
    traceMark: perfTrace && typeof perfTrace.mark === "function"
      ? (event, trace) => perfTrace.mark(event, trace)
      : null,
  });
  const starField3dRuntime = createStarField3dRuntime({
    group: backgroundGroup,
    getBo: () => baseOrbWorldUnits,
    toRuntimePosition: ({ xW = 0, yW = 0, z = 0 } = {}) => ({
      x: toDepthThreeX(xW, worldWidthPx),
      y: toDepthThreeY(yW, worldHeightPx),
      z,
    }),
    onCountChange: (count) => {
      root.dataset.starFieldCount = String(Math.max(0, Math.floor(Number(count) || 0)));
    },
  });
  const gnatSwarm3dRuntime = createGnatSwarm3dRuntime({
    group: enemyGroup,
    getBo: () => baseOrbWorldUnits,
    getOrbZBO: () => currentOrbZBO,
    getConfig: () => GNAT_SWARM_ENEMY_DEFAULT,
    toRuntimePosition: ({ xW = 0, yW = 0, z = 0 } = {}) => ({
      x: toDepthThreeX(xW, worldWidthPx),
      y: toDepthThreeY(yW, worldHeightPx),
      z,
    }),
    onCombatEvent: (type, payload = {}) => {
      if (combatEventBus && typeof combatEventBus.emit === "function") {
        combatEventBus.emit(type, payload);
      }
    },
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });

  function clearGroup() {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeThreeObject(child);
    }
  }

  function clearPropsGroup() {
    worldProps3dRuntime.clear();
  }

  function clearGlobe3dObjects() {
    worldGlobe3dRuntime.dispose();
    orbGlobe3dRuntime.dispose();
    while (globe3dGroup.children.length) {
      const child = globe3dGroup.children[0];
      globe3dGroup.remove(child);
      disposeThreeObject(child);
    }
  }

  function loadGlobe3dWorldSpawns(spawns = []) {
    clearGlobe3dObjects();
    boundGlobe3dSpawns = Object.freeze(Array.isArray(spawns) ? spawns.slice() : []);
    worldGlobe3dRuntime.loadSpawns(boundGlobe3dSpawns);
    tickGlobe3dRuntime();
    syncRootVisibility();
    renderLoop.scheduleAnimation();
    const lastFrame = renderLoop.getLastFrame();
    if (lastFrame) renderLoop.renderFrame(lastFrame);
  }

  function tickGlobe3dRuntime(nowMs = performance.now()) {
    const timeSec = nowMs / 1000;
    const dtSec = lastGlobe3dTickMs ? Math.max(0.001, Math.min(0.05, (nowMs - lastGlobe3dTickMs) / 1000)) : 0.016;
    lastGlobe3dTickMs = nowMs;
    worldGlobe3dRuntime.update(timeSec);
    orbGlobe3dRuntime.update({ timeSec, dtSec });
    orbLifecycle3dRuntime.update(nowMs);
  }

  function resolveFlameAoeHazardConfig(flamePayload = {}, callAtMs = performance.now()) {
    const payload = flamePayload && typeof flamePayload === "object" ? flamePayload : {};
    const visualConfig = { ...FLAME_AOE_3D_PRESET_DEFAULT, ...payload };
    const behaviorConfig = {
      ...FLAME_AOE_BEHAVIOR_DEFAULT,
      ...(payload.behavior && typeof payload.behavior === "object" ? payload.behavior : {}),
    };
    const durationMs = Math.max(50, Number(behaviorConfig.durationMs || payload.durationMs || visualConfig.durationMs) || 1000);
    const hitRadiusBo = Math.max(0.05, Number(behaviorConfig.hitRadiusBo) || Number(FLAME_AOE_BEHAVIOR_DEFAULT.hitRadiusBo) || 4.5);
    const wakeHeightBo = Math.max(
      hitRadiusBo,
      Number(visualConfig.wakeSdfHeightBo) || (
        (Number(visualConfig.wakeLiftBo) || 0)
          + (Number(visualConfig.wakeLiftCoreRadiusBo) || 0)
          + (Number(visualConfig.wakeStretchStrength) || 0)
      )
    ) * Math.max(0, Number(behaviorConfig.wakeReachScale) || 0);
    const tickMs = Math.max(50, Number(behaviorConfig.roastTickMs) || 250);
    return Object.freeze({
      enabled: behaviorConfig.enabled !== false,
      startedAtMs: callAtMs,
      untilMs: callAtMs + durationMs,
      lastTickMs: callAtMs - tickMs,
      tickMs,
      radiusBo: hitRadiusBo,
      forwardRadiusBo: Math.max(hitRadiusBo, wakeHeightBo),
      visualProfile: String(behaviorConfig.visualProfile || "spellfire"),
      burnDps: Math.max(0, Number(behaviorConfig.igniteBurnDps) || 0),
      burnDurationMs: Math.max(0, Number(behaviorConfig.igniteDurationMs) || 0),
      roastDps: Math.max(0, Number(behaviorConfig.roastDps) || 0),
    });
  }

  function summarizeFlameDamageTrace(trace = null) {
    if (!trace || typeof trace !== "object") return null;
    return {
      alive: trace.alive || 0,
      tested: trace.tested || 0,
      inRange: trace.inRange || 0,
      affected: trace.affected || 0,
      totalDamage: trace.totalDamage || 0,
      nearestBo: trace.nearestBo == null ? null : trace.nearestBo,
      nearestInside: !!(trace.nearest && trace.nearest.inside),
    };
  }

  function summarizeFireCardTrace(trace = null) {
    if (!trace || typeof trace !== "object") return null;
    const sampleCamera = trace.sampleCamera || null;
    const mesh = trace.mesh || null;
    return {
      activeCount: trace.activeCount || 0,
      visible: !!trace.visible,
      mesh: mesh ? {
        shape: mesh.shape || "",
        billboardMode: mesh.billboardMode || "",
        materialName: mesh.materialName || "",
        materialTransparent: !!mesh.materialTransparent,
        materialBlending: mesh.materialBlending == null ? null : mesh.materialBlending,
      } : null,
      sample: trace.sample || null,
      sampleInClip: sampleCamera ? !!sampleCamera.inClip : null,
      sampleClip: sampleCamera ? sampleCamera.clip || null : null,
    };
  }

  function applyActiveFlameAoeHazard(nowMs = performance.now(), { force = false } = {}) {
    const hazard = activeFlameAoeHazard;
    if (!hazard || !hazard.enabled) return null;
    if (nowMs > hazard.untilMs) {
      activeFlameAoeHazard = null;
      return null;
    }
    if (!currentOrbWorldPosition) return null;
    const elapsedMs = Math.max(0, nowMs - (Number(hazard.lastTickMs) || hazard.startedAtMs));
    if (!force && elapsedMs < hazard.tickMs) return null;
    const dtSec = Math.max(0.001, Math.min(1, elapsedMs / 1000));
    activeFlameAoeHazard = Object.freeze({
      ...hazard,
      lastTickMs: nowMs,
    });
    const damageResult = gnatSwarm3dRuntime.applyCombatEffect({
      kind: COMBAT_EFFECT_DAMAGE,
      sourceEntityId: COMBAT_ENTITY_ORB,
      targetEntityId: "enemy:gnat-swarm",
      centerWorld: currentOrbWorldPosition,
      radiusBo: hazard.radiusBo,
      forwardRadiusBo: hazard.forwardRadiusBo,
      axisWorld: { xW: 0, yW: -1 },
      amount: Math.max(0, hazard.roastDps * dtSec),
      damageType: DAMAGE_TYPE_FIRE,
      visualProfile: hazard.visualProfile,
      burnDps: hazard.burnDps,
      burnDurationMs: hazard.burnDurationMs,
      roastDps: 0,
      roastDurationMs: 0,
      tickMs: hazard.tickMs,
      atMs: nowMs,
      tags: ["spell", "flame-aoe", "hazard"],
    });
    root.dataset.enemy3dLastFlameAoeDamageCount = String(damageResult && damageResult.affected || 0);
    root.dataset.enemy3dLastFlameAoeRadiusBo = String(hazard.radiusBo.toFixed(2));
    root.dataset.enemy3dLastFlameAoeForwardRadiusBo = String(hazard.forwardRadiusBo.toFixed(2));
    const damageTrace = damageResult && damageResult.trace ? damageResult.trace : null;
    const damageTraceSummary = summarizeFlameDamageTrace(damageTrace);
    if (damageTrace) {
      root.dataset.enemy3dLastFlameAoeAlive = String(damageTrace.alive || 0);
      root.dataset.enemy3dLastFlameAoeTested = String(damageTrace.tested || 0);
      root.dataset.enemy3dLastFlameAoeInRange = String(damageTrace.inRange || 0);
      root.dataset.enemy3dLastFlameAoeNearestBo = damageTrace.nearestBo == null ? "" : String(damageTrace.nearestBo);
    }
    if (perfTrace && typeof perfTrace.mark === "function") {
      perfTrace.mark("flameAoe.gameStage.damageTick", {
        handled: !!(damageResult && damageResult.handled),
        affected: damageResult && damageResult.affected || 0,
        radiusBo: Number(hazard.radiusBo.toFixed(2)),
        forwardRadiusBo: Number(hazard.forwardRadiusBo.toFixed(2)),
        amount: Number((hazard.roastDps * dtSec).toFixed(3)),
        trace: damageTraceSummary,
      });
    }
    return damageResult;
  }

  function resolveTesla1OrbLightLayer(config = {}, intensityMultiplier = 1) {
    if (!config) return null;
    const baseIntensity = Math.max(0, Number(config.orbLightIntensity) || Number(TESLA_1_PRESET_DEFAULT.orbLightIntensity) || 0);
    const flashMultiplier = Math.max(0, Number(intensityMultiplier) || 1);
    const readNumber = (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    };
    const layer = {};
    if (config.orbShellOverrideEnabled !== false && config.orbShellOverrideEnabled !== 0) {
      const baseShellLuminance = readNumber(config.orbShellLuminanceBoost, TESLA_1_PRESET_DEFAULT.orbShellLuminanceBoost);
      layer.shellLuminanceBoost = Math.max(0, Math.min(12, baseShellLuminance * flashMultiplier));
      layer.shellCenterAlpha = Math.max(0, Math.min(1, readNumber(config.orbShellCenterAlpha, TESLA_1_PRESET_DEFAULT.orbShellCenterAlpha)));
      layer.goldMix = Math.max(0, Math.min(2, readNumber(config.orbShellGoldMix, TESLA_1_PRESET_DEFAULT.orbShellGoldMix)));
    }
    if (config.orbLightOverrideEnabled !== false && config.orbLightOverrideEnabled !== 0) {
      layer.pointLightColorR = Math.max(0, Math.min(1, (Number(config.orbLightColorR) || 0) / 255));
      layer.pointLightColorG = Math.max(0, Math.min(1, (Number(config.orbLightColorG) || 0) / 255));
      layer.pointLightColorB = Math.max(0, Math.min(1, (Number(config.orbLightColorB) || 0) / 255));
      layer.pointLightIntensity = Math.max(0, Math.min(10000, baseIntensity * flashMultiplier));
      layer.pointLightDistanceBO = Math.max(0, Math.min(1000, Number(config.orbLightDistanceBo) || Number(TESLA_1_PRESET_DEFAULT.orbLightDistanceBo) || 0));
    }
    return Object.keys(layer).length ? Object.freeze(layer) : null;
  }

  function tesla1Fract(value = 0) {
    return value - Math.floor(value);
  }

  function tesla1ShaderRandomFloat(x = 0, y = 0) {
    const sx = Math.sin(x * 123.45) * 345.21 + 12.57;
    const sy = Math.sin(y * 546.23) * 345.21 + 12.57;
    return tesla1Fract(sx * sy);
  }

  function tesla1SignedPow(value = 0, exponent = 1) {
    const amount = Math.pow(Math.abs(Number(value) || 0), Math.max(0.05, Number(exponent) || 1));
    return value < 0 ? -amount : amount;
  }

  function resolveTesla1BoltBaseWidthBo(lengthBo = 0, config = {}, baseWidthMultiplier = 1) {
    const widthLengthMin = Math.max(0.001, Number(config.lightningShapeWidthLengthMinBo) || 0.5);
    const widthLengthMax = Math.max(widthLengthMin + 0.001, Number(config.lightningShapeWidthLengthMaxBo) || 8);
    const baseWidthMin = Math.max(0.0001, Number(config.lightningShapeBaseWidthMinBo) || 0.003);
    const baseWidthMax = Math.max(baseWidthMin, Number(config.lightningShapeBaseWidthMaxBo) || 0.04);
    const curve = Math.max(0.05, Number(config.lightningShapeWidthMagnitudeCurve) || 1);
    const t = (Math.max(0, Number(lengthBo) || 0) - widthLengthMin) / Math.max(0.0001, widthLengthMax - widthLengthMin);
    const mapped = baseWidthMin + ((baseWidthMax - baseWidthMin) * tesla1SignedPow(t, curve));
    return Math.max(0.0001, mapped * Math.max(0.05, Number(baseWidthMultiplier) || 1));
  }

  function estimateTesla1BoltVisualEnergy({ lengthBo = 0, config = {}, baseWidthMultiplier = 1, branchDensityMultiplier = 1, intensityMultiplier = 1 } = {}) {
    const safeLengthBo = Math.max(0, Number(lengthBo) || 0);
    if (safeLengthBo <= 0) return 0;
    const baseWidthBo = resolveTesla1BoltBaseWidthBo(safeLengthBo, config, baseWidthMultiplier);
    const tipWidthRatio = Math.max(0.001, Math.min(2, Number(config.lightningShapeTipWidthRatio) || 0.12));
    const branchWidthRatio = Math.max(0.001, Math.min(4, Number(config.lightningShapeBranchWidthRatio) || 0.55));
    const branchDensity = Math.max(0, Math.min(1, (Number(config.lightningShapeBranchDensity) || 0) * Math.max(0, Number(branchDensityMultiplier) || 1)));
    const averageWidthBo = baseWidthBo * ((1 + tipWidthRatio) * 0.5);
    const branchBoost = 1 + (branchDensity * branchWidthRatio * 0.45);
    const shaderIntensity = Math.max(0, Number(config.boltShaderIntensity) || Number(TESLA_1_PRESET_DEFAULT.boltShaderIntensity) || 0);
    const intensityBoost = Math.max(0.05, Math.min(3.5, shaderIntensity / Math.max(1, Number(TESLA_1_PRESET_DEFAULT.boltShaderIntensity) || 6)));
    const brightAreaBo = safeLengthBo * averageWidthBo * branchBoost * intensityBoost * Math.max(0.05, Number(intensityMultiplier) || 1);
    return Math.sqrt(Math.max(0, brightAreaBo) / 0.007);
  }

  function resolveTesla1FieldBoltFlashMultiplier(nowMs = performance.now(), config = {}, elapsedSeconds = null) {
    if (!config || config.orbShellOverrideEnabled === false || config.orbShellOverrideEnabled === 0) return 1;
    const readNumber = (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    };
    const amount = Math.max(0, Math.min(4, readNumber(config.orbShellFieldBoltFlashAmount, TESLA_1_PRESET_DEFAULT.orbShellFieldBoltFlashAmount)));
    if (amount <= 0 || config.haloFieldEnabled === false || config.haloFieldEnabled === 0 || config.boltShaderEnabled === false || config.boltShaderEnabled === 0) return 1;
    const countMin = Math.max(0, Number(config.haloBoltCountMin) || 0);
    const countMax = Math.max(countMin, Number(config.haloBoltCountMax) || countMin);
    if (countMax <= 0) return 1;
    const startMin = Math.max(0, Number(config.haloFieldBoltStartMinBo) || 0);
    const startMax = Math.max(startMin, Number(config.haloFieldBoltStartMaxBo) || startMin);
    const endMin = Math.max(0, Number(config.haloFieldBoltEndMinBo) || 0);
    const endMax = Math.max(endMin, Number(config.haloFieldBoltEndMaxBo) || endMin);
    const shellRadius = Math.max(0.5, Number(config.haloFieldShellRadiusBo) || Number(TESLA_1_PRESET_DEFAULT.haloFieldShellRadiusBo) || 1);
    const fieldLengthReferenceBo = Math.max(0.01, ((endMin + endMax) - (startMin + startMax)) * 0.5);
    const ttlMin = Math.max(0.016, (Number(config.haloBoltTtlMinMs) || Number(TESLA_1_PRESET_DEFAULT.haloBoltTtlMinMs) || 16) / 1000);
    const ttlMax = Math.max(ttlMin, (Number(config.haloBoltTtlMaxMs) || Number(TESLA_1_PRESET_DEFAULT.haloBoltTtlMaxMs) || 16) / 1000);
    const sourceTime = Number.isFinite(Number(elapsedSeconds))
      ? Math.max(0, Number(elapsedSeconds))
      : Math.max(0, Number(nowMs) || 0) / 1000;
    const time = tesla1Fract(sourceTime / 32) * 32;
    const minCount = Math.min(countMin, countMax);
    const optionalSlots = Math.max(0, countMax - minCount);
    let pulseSum = 0;
    let activeSlots = 0;
    const slotCount = Math.min(32, Math.ceil(countMax));
    for (let i = 0; i < slotCount; i += 1) {
      const offset = tesla1ShaderRandomFloat(i, 9) * ttlMax;
      const shiftedTime = ((time + offset) % (ttlMax * 32) + (ttlMax * 32)) % (ttlMax * 32);
      const coarseCycle = Math.floor(shiftedTime / ttlMax);
      const ttl = ttlMin + (ttlMax - ttlMin) * tesla1ShaderRandomFloat(i * 17.7, coarseCycle + 41);
      const ttlCycle = Math.floor(shiftedTime / Math.max(0.016, ttl));
      const seed = i * 37.13 + ttlCycle * 19.7 + 11.7;
      const optionalChance = optionalSlots > 0 ? 0.5 : 0;
      if (i >= minCount && tesla1ShaderRandomFloat(seed, 23) > optionalChance) continue;
      const age = ((shiftedTime % ttl) + ttl) % ttl;
      const phase = Math.max(0, Math.min(1, age / ttl));
      const lengthSlotCount = Math.max(1, minCount);
      const lengthSlotOffset = Math.floor(tesla1ShaderRandomFloat(seed, 193) * lengthSlotCount);
      const lengthSlot = (i + lengthSlotOffset) % lengthSlotCount;
      const lengthRoll = (lengthSlot + tesla1ShaderRandomFloat(seed, 191)) / lengthSlotCount;
      const lengthBo = Math.max(0.01, endMin + ((endMax - endMin) * lengthRoll));
      const lifecyclePulse = Math.pow(1 - phase, 3.2);
      const lengthBalance = Math.max(0.35, Math.min(1.6, lengthBo / fieldLengthReferenceBo));
      pulseSum += lifecyclePulse * lengthBalance * estimateTesla1BoltVisualEnergy({ lengthBo, config });
      activeSlots += 1;
    }
    if (activeSlots <= 0) return 1;
    const shellScale = Math.max(0.35, Math.min(1.4, fieldLengthReferenceBo / Math.max(0.5, shellRadius)));
    const energy = Math.min(2.5, (pulseSum / 4) * shellScale);
    return 1 + (amount * energy);
  }

  function resolveTesla1OrbLightFlashEnergy({ kind = "halo", target = null, config = {}, visualLengthBo = 0 } = {}) {
    const safeConfig = config && typeof config === "object" ? config : {};
    const boltCountMin = Math.max(0, Number(safeConfig.haloBoltCountMin) || 0);
    const boltCountMax = Math.max(boltCountMin, Number(safeConfig.haloBoltCountMax) || boltCountMin);
    const averageBoltCount = Math.max(1, (boltCountMin + boltCountMax) * 0.5);
    const densityBoost = Math.max(0.35, Math.min(2.2, Math.sqrt(averageBoltCount / 8)));
    const fallbackLengthBo = kind === "master"
      ? (Number(safeConfig.dominantBoltMaxRangeBo) || 1)
      : Math.max(
          Number(safeConfig.haloStrikeRangeMaxBo) || 1,
          ((Number(safeConfig.haloFieldBoltEndMinBo) || 0) + (Number(safeConfig.haloFieldBoltEndMaxBo) || 0)) * 0.5
        );
    const targetLengthBo = Math.max(0, Number(visualLengthBo) || Number(target && target.distanceBo) || fallbackLengthBo);
    const masterWidthMultiplier = kind === "master" ? Math.max(0.05, Number(safeConfig.dominantBoltBaseWidthMultiplier) || 1) : 1;
    const masterBranchMultiplier = kind === "master" ? Math.max(0, Number(safeConfig.dominantBoltBranchDensityMultiplier) || 1) : 1;
    const masterIntensityMultiplier = kind === "master" ? 1.65 : 1.25;
    const visualEnergy = estimateTesla1BoltVisualEnergy({
      lengthBo: targetLengthBo,
      config: safeConfig,
      baseWidthMultiplier: masterWidthMultiplier,
      branchDensityMultiplier: masterBranchMultiplier,
      intensityMultiplier: masterIntensityMultiplier,
    });
    const masterBonus = kind === "master"
      ? Math.max(0, Math.min(16, Number(safeConfig.orbLightMasterFlashMultiplier) || Number(TESLA_1_PRESET_DEFAULT.orbLightMasterFlashMultiplier) || 1))
      : 1;
    return Math.max(0.25, Math.min(5, visualEnergy * densityBoost * masterBonus));
  }

  function startTesla1OrbLightFlash({ kind = "halo", target = null, config = {}, atMs = performance.now(), visualLengthBo = 0 } = {}) {
    if (!config) return;
    const hasLightLayer = config.orbLightOverrideEnabled !== false && config.orbLightOverrideEnabled !== 0;
    const hasShellLayer = config.orbShellOverrideEnabled !== false && config.orbShellOverrideEnabled !== 0;
    if (!hasLightLayer && !hasShellLayer) return;
    activeTesla1OrbLightConfig = config;
    const minMs = Math.max(8, Number(config.orbLightFlashDurationMinMs) || Number(TESLA_1_PRESET_DEFAULT.orbLightFlashDurationMinMs) || 35);
    const maxMs = Math.max(minMs, Number(config.orbLightFlashDurationMaxMs) || Number(TESLA_1_PRESET_DEFAULT.orbLightFlashDurationMaxMs) || minMs);
    const durationMs = minMs + (Math.random() * (maxMs - minMs));
    const energy = resolveTesla1OrbLightFlashEnergy({ kind, target, config, visualLengthBo });
    const authoredPeak = Math.max(1, Number(config.orbLightFlashIntensityMultiplier) || Number(TESLA_1_PRESET_DEFAULT.orbLightFlashIntensityMultiplier) || 1);
    tesla1OrbLightFlash = Object.freeze({
      activeUntilMs: Number(atMs) + durationMs,
      startedAtMs: Number(atMs) || performance.now(),
      durationMs,
      peakMultiplier: Math.max(1, Math.min(100, 1 + ((authoredPeak - 1) * energy))),
      energy,
      decayCurve: Math.max(0.1, Number(config.orbLightFlashDecayCurve) || Number(TESLA_1_PRESET_DEFAULT.orbLightFlashDecayCurve) || 2.4),
    });
    syncTesla1OrbLightLayer(Number(atMs) || performance.now(), { config, force: true });
  }

  function clearTesla1OrbLightLayer() {
    activeTesla1OrbLightConfig = null;
    tesla1OrbLightFlash = Object.freeze({
      activeUntilMs: 0,
      startedAtMs: 0,
      durationMs: 0,
      peakMultiplier: 1,
      energy: 0,
      decayCurve: 2.4,
    });
    if (orbShaderMixer && typeof orbShaderMixer.clearLayer === "function") {
      orbShaderMixer.clearLayer(TESLA1_ORB_SHADER_LAYER_ID, { source: "tesla1.clear" });
    }
  }

  function syncTesla1OrbLightLayer(nowMs = performance.now(), { config = null, force = false } = {}) {
    const active = tesla1Runtime && typeof tesla1Runtime.isActive === "function" && tesla1Runtime.isActive();
    if (!active && !force) {
      clearTesla1OrbLightLayer();
      return;
    }
    const safeConfig = config && typeof config === "object"
      ? config
      : (activeTesla1OrbLightConfig || { ...TESLA_1_PRESET_DEFAULT, ...TESLA_1_BEHAVIOR_DEFAULT });
    let multiplier = 1;
    if (tesla1OrbLightFlash.activeUntilMs > nowMs && tesla1OrbLightFlash.durationMs > 0) {
      const progress = Math.max(0, Math.min(1, (nowMs - tesla1OrbLightFlash.startedAtMs) / tesla1OrbLightFlash.durationMs));
      const decay = Math.pow(1 - progress, Math.max(0.1, Number(tesla1OrbLightFlash.decayCurve) || 2.4));
      multiplier = 1 + ((Math.max(1, Number(tesla1OrbLightFlash.peakMultiplier) || 1) - 1) * decay);
    } else if (tesla1OrbLightFlash.activeUntilMs) {
      tesla1OrbLightFlash = Object.freeze({
        activeUntilMs: 0,
        startedAtMs: 0,
        durationMs: 0,
        peakMultiplier: 1,
        energy: 0,
        decayCurve: 2.4,
      });
    }
    const fieldElapsedSeconds = tesla1Runtime && typeof tesla1Runtime.getElapsedTimeSeconds === "function"
      ? tesla1Runtime.getElapsedTimeSeconds(nowMs)
      : null;
    multiplier = Math.max(multiplier, resolveTesla1FieldBoltFlashMultiplier(nowMs, safeConfig, fieldElapsedSeconds));
    if (!orbShaderMixer || typeof orbShaderMixer.setLayer !== "function") return;
    const layer = resolveTesla1OrbLightLayer(safeConfig, multiplier);
    if (!layer) {
      if (typeof orbShaderMixer.clearLayer === "function") {
        orbShaderMixer.clearLayer(TESLA1_ORB_SHADER_LAYER_ID, { source: "tesla1.orbLightEmpty" });
      }
      return;
    }
    orbShaderMixer.setLayer(TESLA1_ORB_SHADER_LAYER_ID, layer, { source: "tesla1.orbLight" });
  }

  function clearTesla1Runtime(reason = "root_spell_transition") {
    if (!tesla1Runtime || typeof tesla1Runtime.clear !== "function") return;
    const wasActive = typeof tesla1Runtime.isActive === "function" && tesla1Runtime.isActive();
    tesla1Runtime.clear();
    clearTesla1OrbLightLayer();
    if (wasActive && perfTrace && typeof perfTrace.mark === "function") {
      perfTrace.mark("tesla1.gameStage.cleared", { reason });
    }
  }

  function clearFlameAoe3dRuntime(reason = "root_spell_transition") {
    const wasActive = !!activeFlameAoeHazard
      || (flameAoe3dRuntime && typeof flameAoe3dRuntime.isActive === "function" && flameAoe3dRuntime.isActive());
    activeFlameAoeHazard = null;
    if (flameAoe3dRuntime && typeof flameAoe3dRuntime.clear === "function") flameAoe3dRuntime.clear();
    if (wasActive && perfTrace && typeof perfTrace.mark === "function") {
      perfTrace.mark("flameAoe.gameStage.cleared", { reason });
    }
  }

  function resolveTesla1MasterBoltPath({ fromWorld = null, target = null, bo = baseOrbWorldUnits, config = {} } = {}) {
    const targetPosition = target && target.position ? target.position : null;
    if (!fromWorld || !targetPosition || !currentLevelNavContext) return Object.freeze([]);
    const safeBo = Math.max(1, Number(bo) || baseOrbWorldUnits);
    const toleranceBo = Math.max(0.05, Number(config.masterBoltPathBendToleranceBo) || 0.35);
    const stepWorld = Math.max(1, toleranceBo * safeBo);
    const canSee = (from, to) => typeof currentLevelNavContext.segmentIsWalkable === "function"
      ? currentLevelNavContext.segmentIsWalkable(from, to, stepWorld)
      : true;
    if (canSee(fromWorld, targetPosition)) {
      return Object.freeze([]);
    }
    const start = typeof currentLevelNavContext.resolvePoint === "function"
      ? currentLevelNavContext.resolvePoint(fromWorld, { fallback: fromWorld })
      : fromWorld;
    const end = typeof currentLevelNavContext.resolvePoint === "function"
      ? currentLevelNavContext.resolvePoint(targetPosition, { fallback: targetPosition })
      : targetPosition;
    const path = typeof currentLevelNavContext.findPath === "function"
      ? currentLevelNavContext.findPath(start, end)
      : null;
    if (Array.isArray(path) && path.length >= 2) {
      const directDistance = Math.max(1, Math.hypot((end.xW || 0) - (start.xW || 0), (end.yW || 0) - (start.yW || 0)));
      let pathDistance = 0;
      for (let index = 1; index < path.length; index += 1) {
        const previous = path[index - 1];
        const current = path[index];
        pathDistance += Math.hypot((current.xW || 0) - (previous.xW || 0), (current.yW || 0) - (previous.yW || 0));
      }
      const detourRatioMax = Math.max(1, Number(config.dominantBoltDetourRatioMax) || 1.4);
      if (pathDistance / directDistance > detourRatioMax) {
        return Object.freeze({ blocked: true, bends: Object.freeze([]) });
      }
    }
    const route = Array.isArray(path)
      ? path.filter((point) => point && Number.isFinite(Number(point.xW)) && Number.isFinite(Number(point.yW)))
      : [];
    if (route.length < 3) return Object.freeze({ blocked: true, bends: Object.freeze([]) });
    const bends = [];
    let cursor = 0;
    while (cursor < route.length - 1) {
      let furthest = -1;
      for (let next = route.length - 1; next > cursor; next -= 1) {
        if (canSee(route[cursor], route[next])) {
          furthest = next;
          break;
        }
      }
      if (furthest < 0 || furthest <= cursor) return Object.freeze({ blocked: true, bends: Object.freeze([]) });
      if (furthest >= route.length - 1) break;
      bends.push(route[furthest]);
      if (bends.length > 2) return Object.freeze({ blocked: true, bends: Object.freeze([]) });
      cursor = furthest;
    }
    const visualRoute = [fromWorld, ...bends, targetPosition];
    for (let index = 1; index < visualRoute.length; index += 1) {
      if (!canSee(visualRoute[index - 1], visualRoute[index])) {
        return Object.freeze({ blocked: true, bends: Object.freeze([]) });
      }
    }
    if (!bends.length) return Object.freeze([]);
    return Object.freeze(bends.map((point) => Object.freeze({ xW: Number(point.xW), yW: Number(point.yW) })));
  }

  function resolveOrbGroundContactRuntimeY() {
    if (!currentOrbWorldPosition || !currentBoundarySegments.length) return null;
    const orbRuntimePosition = orb3dActorRuntime.getPosition();
    if (!orbRuntimePosition) return null;
    const bo = Math.max(1, Number(orb3dActorRuntime.getBo()) || baseOrbWorldUnits);
    const orbRadiusPx = bo * 0.5;
    const contactSlopPx = bo * 0.08;
    const rangePx = orbRadiusPx + contactSlopPx;
    let nearest = null;
    for (const segment of currentBoundarySegments) {
      if (!segment) continue;
      if (currentOrbWorldPosition.xW < segment.minXW - rangePx || currentOrbWorldPosition.xW > segment.maxXW + rangePx) continue;
      if (currentOrbWorldPosition.yW < segment.minYW - rangePx || currentOrbWorldPosition.yW > segment.maxYW + rangePx) continue;
      const point = closestPointOnSegment({
        pointXW: currentOrbWorldPosition.xW,
        pointYW: currentOrbWorldPosition.yW,
        segment,
      });
      if (!point) continue;
      const contactRuntime = {
        x: toDepthThreeX(point.xW, worldWidthPx),
        y: toDepthThreeY(point.yW, worldHeightPx),
      };
      const aRuntime = {
        x: toDepthThreeX(segment.a.xW, worldWidthPx),
        y: toDepthThreeY(segment.a.yW, worldHeightPx),
      };
      const bRuntime = {
        x: toDepthThreeX(segment.b.xW, worldWidthPx),
        y: toDepthThreeY(segment.b.yW, worldHeightPx),
      };
      const tangentX = bRuntime.x - aRuntime.x;
      const tangentY = bRuntime.y - aRuntime.y;
      const tangentLength = Math.hypot(tangentX, tangentY);
      if (tangentLength <= 0.000001) continue;
      if (Math.abs(tangentY / tangentLength) > 0.35) continue;
      const dx = orbRuntimePosition.x - contactRuntime.x;
      const dy = orbRuntimePosition.y - contactRuntime.y;
      const distance = Math.hypot(dx, dy);
      if (distance > rangePx || dy < orbRadiusPx * 0.32 || dy > orbRadiusPx + contactSlopPx) continue;
      if (!nearest || distance < nearest.distance) nearest = { distance, y: contactRuntime.y };
    }
    return nearest ? nearest.y : null;
  }

  function tickEnemy3dRuntime(nowMs = performance.now()) {
    const dtSec = lastEnemy3dTickMs ? Math.max(0.001, Math.min(0.05, (nowMs - lastEnemy3dTickMs) / 1000)) : 0.016;
    lastEnemy3dTickMs = nowMs;
    applyActiveFlameAoeHazard(nowMs);
    const orbRuntimePosition = currentOrbAlive ? orb3dActorRuntime.getPosition() : null;
    const shieldCombat = bubbleShield3dRuntime && typeof bubbleShield3dRuntime.getCombatState === "function"
      ? bubbleShield3dRuntime.getCombatState(nowMs)
      : null;
    gnatSwarm3dRuntime.update(nowMs, dtSec, {
      orbWorldPosition: currentOrbAlive ? currentOrbWorldPosition : null,
      orbRuntimePosition,
      orbAlive: currentOrbAlive,
      orbCombat: shieldCombat,
      camera,
    });
    const shouldPublishEnemyTelemetry = nowMs - lastEnemyTelemetryAtMs >= 200;
    const enemyTrace = shouldPublishEnemyTelemetry && typeof gnatSwarm3dRuntime.getTrace === "function" ? gnatSwarm3dRuntime.getTrace(camera) : null;
    if (enemyTrace) {
      lastEnemyTelemetryAtMs = nowMs;
      root.dataset.enemy3dAlertDirect = String(enemyTrace.direct || 0);
      root.dataset.enemy3dAlertRelayed = String(enemyTrace.relayed || 0);
      root.dataset.enemy3dFeedingCount = String(enemyTrace.feeding || 0);
      root.dataset.enemy3dStunnedCount = String(enemyTrace.stunned || 0);
      root.dataset.enemy3dBurningCount = String(enemyTrace.burning || 0);
      root.dataset.enemy3dDeadBurningCount = String(enemyTrace.deadBurning || 0);
      root.dataset.enemy3dFireCardCount = String(enemyTrace.fireCards || 0);
      root.dataset.enemy3dFireCardTrace = JSON.stringify(summarizeFireCardTrace(enemyTrace.fireCardTrace));
      root.dataset.enemy3dLiftLeach = String(enemyTrace.liftLeach || 0);
      root.dataset.enemy3dLifeLeachPerSec = String(enemyTrace.lifeLeachPerSec || 0);
      root.dataset.enemy3dShieldImmune = enemyTrace.shieldImmune ? "true" : "false";
      root.dataset.enemy3dShieldContactRadiusPx = String(enemyTrace.shieldContactRadiusPx || 0);
      root.dataset.enemy3dSignalCount = String(enemyTrace.signals || 0);
      root.dataset.enemy3dNav = enemyTrace.nav ? "grid" : "fallback";
      root.dataset.enemy3dNavCells = String(enemyTrace.navCells || 0);
      root.dataset.enemy3dNavResolutionBo = enemyTrace.navResolutionBo == null ? "" : String(enemyTrace.navResolutionBo);
      const flameTrace = enemyTrace.flameDamage || null;
      if (flameTrace) {
        root.dataset.enemy3dLastFlameAoeAlive = String(flameTrace.alive || 0);
        root.dataset.enemy3dLastFlameAoeTested = String(flameTrace.tested || 0);
        root.dataset.enemy3dLastFlameAoeInRange = String(flameTrace.inRange || 0);
        root.dataset.enemy3dLastFlameAoeNearestBo = flameTrace.nearestBo == null ? "" : String(flameTrace.nearestBo);
      }
      const orbPosition = orb3dActorRuntime.getPosition();
      if (orbPosition) {
        root.dataset.enemy3dOrbRuntime = `${Math.round((Number(orbPosition.x) || 0) * 100) / 100},${Math.round((Number(orbPosition.y) || 0) * 100) / 100},${Math.round((Number(orbPosition.z) || 0) * 100) / 100}`;
      }
      const shouldTraceBurn = activeFlameAoeHazard || enemyTrace.burning || enemyTrace.deadBurning || enemyTrace.fireCards || enemyTrace.flameDamage;
      if (shouldTraceBurn && perfTrace && typeof perfTrace.mark === "function" && nowMs - lastEnemyBurnTraceAtMs >= 500) {
        lastEnemyBurnTraceAtMs = nowMs;
        const fireCardTraceSummary = summarizeFireCardTrace(enemyTrace.fireCardTrace);
        const flameDamageSummary = summarizeFlameDamageTrace(enemyTrace.flameDamage);
        perfTrace.mark("flameAoe.gnatBurn.trace", {
          hazard: activeFlameAoeHazard ? {
            ageMs: Math.round(nowMs - activeFlameAoeHazard.startedAtMs),
            remainingMs: Math.round(activeFlameAoeHazard.untilMs - nowMs),
            radiusBo: Number(activeFlameAoeHazard.radiusBo.toFixed(2)),
            forwardRadiusBo: Number(activeFlameAoeHazard.forwardRadiusBo.toFixed(2)),
            burnDps: activeFlameAoeHazard.burnDps,
            roastDps: activeFlameAoeHazard.roastDps,
          } : null,
          burning: enemyTrace.burning || 0,
          deadBurning: enemyTrace.deadBurning || 0,
          fireCards: enemyTrace.fireCards || 0,
          fireCardTrace: fireCardTraceSummary,
          flameDamage: flameDamageSummary,
        });
      }
    }
  }

  function resetEnemy3dRuntime({ reason = "reset" } = {}) {
    gnatSwarm3dRuntime.load(currentEnemySpawns, {
      boundaryLoops: currentBoundaryLoops,
      boundaryBox: currentBoundaryBox,
      navContext: currentLevelNavContext,
      navGrid: currentLevelNavGrid,
    });
    lastEnemy3dTickMs = 0;
    root.dataset.enemy3dResetReason = String(reason || "reset");
    root.dataset.enemy3dSpawnCount = String(currentEnemySpawns.length);
    root.dataset.enemy3dObjectCount = String(enemyGroup.children.length);
    renderLoop.scheduleAnimation();
    return { handled: true, reason };
  }

  function cancelHealPulse({ clearLayer = true } = {}) {
    healPulseToken += 1;
    if (healPulseFrame && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(healPulseFrame);
    }
    healPulseFrame = 0;
    if (clearLayer && orbShaderMixer && typeof orbShaderMixer.clearLayer === "function") {
      orbShaderMixer.clearLayer(getOrbHealPulseLayerId(), { source: "healPulse.clear" });
    }
  }

  function startHealShaderPulse(payload = {}) {
    if (disposed || !orbShaderMixer || typeof orbShaderMixer.setLayer !== "function") return;
    const durationMs = Math.max(80, Number(HEAL_PRESET_DEFAULT.shaderPulseDurationMs) || 1500);
    const payloadAtMs = Number(payload.atMs);
    const startedAtMs = performance.now();
    const token = healPulseToken + 1;
    healPulseToken = token;
    if (healPulseFrame && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(healPulseFrame);
      healPulseFrame = 0;
    }
    const healthBefore = Number(payload.healthBefore ?? payload.from ?? 0);
    const healthAfter = Number(payload.healthAfter ?? payload.health ?? payload.to ?? 0);
    const maxHealth = Math.max(1, Number(payload.maxHealth ?? payload.max) || 1000);
    let lastTraceBucket = -1;

    const step = (nowMs = performance.now()) => {
      if (disposed || token !== healPulseToken) return;
      const progress = Math.max(0, Math.min(1, (Number(nowMs) - startedAtMs) / durationMs));
      const layer = resolveOrbHealPulseShaderLayer({
        healthBefore,
        healthAfter,
        maxHealth,
        progress,
        healConfig: HEAL_PRESET_DEFAULT,
        lifecycleConfig: ORB_LIFECYCLE_3D_DEFAULTS,
        orbConfig: ORB_3D_VISUAL_DEFAULTS,
      });
      orbShaderMixer.setLayer(getOrbHealPulseLayerId(), layer.values, { source: "healPulse" });
      const traceBucket = progress >= 1 ? 2 : progress >= 0.5 ? 1 : 0;
      if (traceBucket !== lastTraceBucket && perfTrace && typeof perfTrace.mark === "function") {
        lastTraceBucket = traceBucket;
        perfTrace.mark("orb.shader.heal_pulse", {
          progress: Math.round(progress * 1000) / 1000,
          healthBefore,
          healthAfter,
          maxHealth,
          payloadAtMs: Number.isFinite(payloadAtMs) ? Math.round(payloadAtMs * 10) / 10 : "",
          visualAgeMs: Math.max(0, Math.round((startedAtMs - (Number.isFinite(payloadAtMs) ? payloadAtMs : startedAtMs)) * 10) / 10),
          values: layer && layer.values ? { ...layer.values } : null,
        });
      }
      renderLoop.scheduleAnimation();
      renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      if (progress >= 1) {
        healPulseFrame = 0;
        orbShaderMixer.clearLayer(getOrbHealPulseLayerId(), { source: "healPulse.complete" });
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
        return;
      }
      if (typeof requestAnimationFrame === "function") {
        healPulseFrame = requestAnimationFrame(step);
      }
    };

    step(startedAtMs);
  }

  function hasActiveGlobe3dAnimation() {
    return (
      worldGlobe3dRuntime.hasAnimatingVisuals()
      || orbGlobe3dRuntime.hasActiveVisuals()
      || orbLifecycle3dRuntime.hasActiveVisuals()
      || orb3dActorRuntime.isNodActive()
      || orb3dActorRuntime.isSpinColorActive()
      || orb3dActorRuntime.isFloatHoldVisualActive()
      || teleport3dRuntime.isActive()
      || bubbleShield3dRuntime.isActive()
      || flameAoe3dRuntime.isActive()
      || tesla1Runtime.isActive()
      || shockwave3dRuntime.isActive()
      || surfaceFireCardSystem.hasActiveVisuals()
      || gnatSwarm3dRuntime.hasActiveVisuals()
      || !!healPulseFrame
    );
  }

  function syncRootVisibility() {
    root.hidden = depthLayerCount <= 0
      && !backgroundGroup.children.length
      && artGroup.children.length <= 0
      && propsGroup.children.length <= 0
      && enemyGroup.children.length <= 0
      && !orb3dActorRuntime.hasModel()
      && !globe3dGroup.children.length;
  }

  function syncBloomTelemetry() {
    const trace = bloom && typeof bloom.getTrace === "function" ? bloom.getTrace() : null;
    if (!trace) {
      root.dataset.depth3dBloom = "missing";
      return;
    }
    root.dataset.depth3dBloom = "active";
    root.dataset.depth3dBloomRenderCalls = String(trace.renderCalls || 0);
    root.dataset.depth3dBloomResize = `${trace.lastSize && trace.lastSize.width || 0}x${trace.lastSize && trace.lastSize.height || 0}`;
    root.dataset.depth3dBloomConfig = [
      `s:${trace.config && trace.config.strength}`,
      `r:${trace.config && trace.config.radius}`,
      `t:${trace.config && trace.config.threshold}`,
      `px:${trace.config && trace.config.pixelRatio}`,
    ].join(",");
    trace.artPlane = typeof artPlane3dRuntime.getTrace === "function" ? artPlane3dRuntime.getTrace() : null;
    trace.surfaceFire = surfaceFireCardSystem.getTrace();
    if (!bloomMarkedReady && perfTrace && typeof perfTrace.mark === "function") {
      bloomMarkedReady = true;
      perfTrace.mark("depth3d.bloom.ready", {
        config: trace.config,
        renderer: trace.renderer,
        camera: trace.camera,
      });
    }
    if (!bloomMarkedRender && trace.renderCalls > 0 && trace.resizeCalls > 0 && perfTrace && typeof perfTrace.mark === "function") {
      bloomMarkedRender = true;
      perfTrace.mark("depth3d.bloom.rendering", {
        renderCalls: trace.renderCalls,
        resizeCalls: trace.resizeCalls,
        size: trace.lastSize,
        sceneChildren: trace.sceneChildren,
        sceneObjectNames: trace.sceneObjectNames,
        artPlane: trace.artPlane,
        camera: trace.camera,
      });
    }
  }

  function syncSurfaceFireTelemetry() {
    const trace = surfaceFireCardSystem.getTrace();
    root.dataset.surfaceFireEnabled = trace.enabled === false ? "0" : "1";
    root.dataset.surfaceFireCards = String(trace.activeCount || 0);
    root.dataset.surfaceFireLiveCards = String(trace.liveCards || 0);
    root.dataset.surfaceFireContacts = String(trace.contacts || 0);
    root.dataset.surfaceFireNearestBo = trace.nearestBo == null ? "" : String(trace.nearestBo);
  }

  function doRenderFrame({
    camLeft = 0,
    camTop = 0,
    zoom = 1,
    viewportWidthPx = 0,
    viewportHeightPx = 0,
    isBootFrame = false,
  } = {}, nowMs = performance.now()) {
    if (disposed) return;
    const frameNowMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : performance.now();
    const cameraFrame = resolveDepthCameraFrame({
      frame: { camLeft, camTop, zoom, viewportWidthPx, viewportHeightPx },
      root,
      worldWidthPx,
      worldHeightPx,
      fovDeg: camera.fov,
      farPaddingWorldUnits: baseOrbWorldUnits * 32,
    });
    const { width, height } = cameraFrame;
    if (width !== lastRenderWidth || height !== lastRenderHeight) {
      renderer.setSize(width, height, false);
      if (bloom) bloom.setSize(width, height);
      worldProps3dRuntime.updateResolution(width, height);
      lastRenderWidth = width;
      lastRenderHeight = height;
    }
    const projectionChanged = !hasCameraFrame
      || Math.abs(cameraFrame.aspect - lastCameraAspect) > 0.000001
      || Math.abs(cameraFrame.near - lastCameraNear) > 0.000001
      || Math.abs(cameraFrame.far - lastCameraFar) > 0.000001;
    const positionChanged = !hasCameraFrame
      || Math.abs(cameraFrame.x - lastCameraX) > 0.000001
      || Math.abs(cameraFrame.y - lastCameraY) > 0.000001
      || Math.abs(cameraFrame.z - lastCameraZ) > 0.000001;
    if (projectionChanged) {
      camera.aspect = cameraFrame.aspect;
      camera.near = cameraFrame.near;
      camera.far = cameraFrame.far;
      camera.updateProjectionMatrix();
    }
    if (positionChanged) {
      camera.position.set(cameraFrame.x, cameraFrame.y, cameraFrame.z);
      camera.lookAt(cameraFrame.x, cameraFrame.y, 0);
    }
    hasCameraFrame = true;
    lastCameraAspect = cameraFrame.aspect;
    lastCameraNear = cameraFrame.near;
    lastCameraFar = cameraFrame.far;
    lastCameraX = cameraFrame.x;
    lastCameraY = cameraFrame.y;
    lastCameraZ = cameraFrame.z;
    starField3dRuntime.updateCameraWindow({
      camLeft,
      camTop,
      zoom,
      viewportWidthPx,
      viewportHeightPx,
    });
    const starVisibleObjects = starField3dRuntime.getVisibleObjectCount();
    if (starVisibleObjects !== lastStarFieldVisibleObjectCount) {
      lastStarFieldVisibleObjectCount = starVisibleObjects;
      root.dataset.starFieldVisibleObjects = String(starVisibleObjects);
    }
    const measure = perfTrace && typeof perfTrace.measure === "function"
      ? perfTrace.measure
      : null;
    const surfaceFireEnabled = flameAoe3dRuntime.isActive() || !!activeFlameAoeHazard;
    if (measure) {
      measure("depth3d.orbUpdate", () => orb3dActorRuntime.update(frameNowMs / 1000));
      measure("depth3d.tesla1", () => tesla1Runtime.update(frameNowMs));
      measure("depth3d.tesla1OrbLight", () => syncTesla1OrbLightLayer(frameNowMs));
      measure("depth3d.surfaceBurn", () => surfaceFireCardSystem.update({
        nowSec: frameNowMs / 1000,
        camera,
        orbWorldPosition: currentOrbWorldPosition,
        orbRuntimePosition: orb3dActorRuntime.getPosition(),
        enabled: surfaceFireEnabled,
      }));
      measure("depth3d.globes", () => tickGlobe3dRuntime(frameNowMs));
      measure("depth3d.enemies", () => tickEnemy3dRuntime(frameNowMs));
      measure("depth3d.renderer", () => {
        if (bloom) bloom.render();
        else renderer.render(scene, camera);
      });
    } else {
      orb3dActorRuntime.update(frameNowMs / 1000);
      tesla1Runtime.update(frameNowMs);
      syncTesla1OrbLightLayer(frameNowMs);
      surfaceFireCardSystem.update({
        nowSec: frameNowMs / 1000,
        camera,
        orbWorldPosition: currentOrbWorldPosition,
        orbRuntimePosition: orb3dActorRuntime.getPosition(),
        enabled: surfaceFireEnabled,
      });
      tickGlobe3dRuntime(frameNowMs);
      tickEnemy3dRuntime(frameNowMs);
      if (bloom) bloom.render();
      else renderer.render(scene, camera);
    }
    if (frameNowMs - lastDepth3dTelemetryAtMs >= 250) {
      lastDepth3dTelemetryAtMs = frameNowMs;
      syncSurfaceFireTelemetry();
      syncBloomTelemetry();
    }
  }

  function loadProps(props = []) {
    worldProps3dRuntime.load(props);
  }

  return Object.freeze({
    async loadScene(authoredScene = null, state = null) {
      if (disposed) return;
      clearGroup();
      clearPropsGroup();
      artPlane3dRuntime.clear();
      starField3dRuntime.clear();
      activeFlameAoeHazard = null;
      gnatSwarm3dRuntime.clear();
      surfaceFireCardSystem.clear();
      const sceneModel = resolveSceneModel(authoredScene);
      const summary = resolveSceneSummary(authoredScene);
      const layers = resolveSceneDepthLayers(authoredScene);
      const artShapes = resolveSceneArtShapes(authoredScene);
      const props = resolveSceneProps(authoredScene);
      const enemySpawns = resolveSceneEnemySpawns(authoredScene);
      const orbDepth = resolveSceneOrbDepth(authoredScene);
      const levelGraphicsModel = authoredScene && authoredScene.levelGraphicsModel ? authoredScene.levelGraphicsModel : null;
      const starField = levelGraphicsModel && (levelGraphicsModel.starField || levelGraphicsModel.starsField);
      const boundaryLoops = sceneModel && Array.isArray(sceneModel.loops) ? sceneModel.loops : [];
      const boundaryBox = sceneModel && sceneModel.boundaryBox ? sceneModel.boundaryBox : null;
      const boundarySegments = buildBoundarySegmentsFromLoops(boundaryLoops);
      currentBoundarySegments = boundarySegments;
      currentBoundaryLoops = Object.freeze([...boundaryLoops]);
      currentBoundaryBox = boundaryBox || null;
      currentEnemySpawns = Object.freeze([...enemySpawns]);
      currentLevelNavContext = null;
      currentLevelNavGrid = null;
      currentOrbWorldPosition = null;
      currentOrbAlive = true;
      worldWidthPx = Math.max(1, clampNumber(state && state.worldWidthPx, worldWidthPx));
      worldHeightPx = Math.max(1, clampNumber(state && state.worldHeightPx, worldHeightPx));
      depthLayerCount = layers.length;
      currentOrbZBO = resolveOrbTravelZBO({ depthLayers: layers, orbDepth }, LEVEL_DEPTH_DEFAULT_ORB_Z_BO);
      const levelNavGrid = buildLevelNavGrid({
        boundaryLoops,
        boundaryBox,
        bo: baseOrbWorldUnits,
        resolutionBo: LEVEL_NAV_GRID_RESOLUTION_BO,
      });
      const levelNavContext = createLevelNavContext({ navGrid: levelNavGrid });
      currentLevelNavContext = levelNavContext;
      currentLevelNavGrid = levelNavGrid;
      root.dataset.levelNavGridResolutionBo = String(LEVEL_NAV_GRID_RESOLUTION_BO);
      root.dataset.levelNavGridCells = levelNavGrid ? String(levelNavGrid.cols * levelNavGrid.rows) : "0";
      telemetry.setDepthLayerLabel(layers);
      starField3dRuntime.load(starField);
      artPlane3dRuntime.load(artShapes);
      const artTrace = typeof artPlane3dRuntime.getTrace === "function" ? artPlane3dRuntime.getTrace() : null;
      if (artTrace && artTrace.shapes && artTrace.shapes[0]) {
        const first = artTrace.shapes[0];
        root.dataset.artPlaneMode = String(first.mode || "");
        root.dataset.artPlaneHoles = String(first.holeCount || 0);
        root.dataset.artPlaneHoleAlpha = String((first.texture && first.texture.firstHoleSampleAlpha) ?? "");
      }
      for (const layer of layers) {
        const mesh = await buildDepthLayerMesh({
          layer,
          viewBox: summary.viewBox || { x: 0, y: 0, width: worldWidthPx, height: worldHeightPx },
          worldWidthPx,
          worldHeightPx,
          environmentMode,
          boWorldUnits: baseOrbWorldUnits,
        });
        if (mesh) {
          applyThreeMeshFlags(mesh);
          group.add(mesh);
        }
      }
      loadProps(props);
      gnatSwarm3dRuntime.load(enemySpawns, {
        boundaryLoops,
        boundaryBox,
        navContext: levelNavContext,
        navGrid: levelNavGrid,
      });
      surfaceFireCardSystem.load(boundarySegments);
      root.dataset.enemy3dSpawnCount = String(enemySpawns.length);
      root.dataset.enemy3dObjectCount = String(enemyGroup.children.length);
      if (boundGlobe3dSpawns.length) {
        worldGlobe3dRuntime.loadSpawns(boundGlobe3dSpawns);
        tickGlobe3dRuntime();
      }
      syncRootVisibility();
      telemetry.setSceneStatus({
        depthLayerCount: group.children.length,
        depthStatus: group.children.length ? "ready" : "empty",
      });
      if (group.children.length || backgroundGroup.children.length || artGroup.children.length || enemyGroup.children.length) {
        renderLoop.renderFrame(renderLoop.getLastFrame() || {
          ...resolveDepthBootFrame({ depthLayers: layers, root }),
          isBootFrame: true,
        });
      }
    },
    setOrbWorldPosition({
      xW = null,
      yW = null,
      bo = baseOrbWorldUnits,
      zBO = currentOrbZBO,
    } = {}) {
      if (disposed) return false;
      const handled = orb3dActorRuntime.setWorldPosition({ xW, yW, bo, zBO });
      if (!handled) return false;
      currentOrbWorldPosition = Number.isFinite(Number(xW)) && Number.isFinite(Number(yW))
        ? { xW: Number(xW), yW: Number(yW) }
        : currentOrbWorldPosition;
      syncRootVisibility();
      renderLoop.scheduleAnimation();
      const lastFrame = renderLoop.getLastFrame();
      if (lastFrame) renderLoop.renderFrame(lastFrame);
      return true;
    },
    bindGlobe3dRuntime(args = {}) {
      if (disposed) return;
      combatEventBus = args && args.eventBus ? args.eventBus : null;
      eventBindings.bind(args);
    },
    playOrbNod3d(payload = {}) {
      if (disposed) {
        return { handled: false, skipped: "orb_nod3d_runtime_missing" };
      }
      const result = orb3dActorRuntime.playNod(payload);
      if (result && result.handled) {
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      }
      return result || { handled: false };
    },
    playOrbTeleport3d(payload = {}) {
      if (disposed || !orb3dActorRuntime.hasModel()) {
        return { handled: false, skipped: "orb_teleport3d_runtime_missing" };
      }
      const originalOnTeleport = typeof payload.onTeleport === "function" ? payload.onTeleport : null;
      const result = teleport3dRuntime.play({
        ...(payload && typeof payload === "object" ? payload : {}),
        onTeleport: () => {
          if (gnatSwarm3dRuntime && typeof gnatSwarm3dRuntime.releaseFeedingGnats === "function") {
            gnatSwarm3dRuntime.releaseFeedingGnats({
              atMs: performance.now(),
              reason: "teleport",
            });
          }
          return originalOnTeleport ? originalOnTeleport() : null;
        },
      });
      if (result && result.handled) {
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      }
      return result || { handled: false };
    },
    playBubbleShield3d(payload = {}) {
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("depth3d.bubbleShield.play.request", {
          disposed: !!disposed,
          hasModel: !!orb3dActorRuntime.hasModel(),
          durationMs: Number(payload && payload.durationMs) || 0,
        });
      }
      if (disposed || !orb3dActorRuntime.hasModel()) {
        if (perfTrace && typeof perfTrace.mark === "function") {
          perfTrace.mark("depth3d.bubbleShield.play.skipped", {
            disposed: !!disposed,
            hasModel: !!orb3dActorRuntime.hasModel(),
          });
        }
        return { handled: false, skipped: "bubble_shield3d_runtime_missing" };
      }
      const result = bubbleShield3dRuntime.activate(payload);
      const shieldCombat = bubbleShield3dRuntime && typeof bubbleShield3dRuntime.getCombatState === "function"
        ? bubbleShield3dRuntime.getCombatState(performance.now())
        : null;
      if (result && result.handled && combatEventBus && typeof combatEventBus.emit === "function") {
        combatEventBus.emit(EVT_COMBAT_IMMUNITY_CHANGED, {
          kind: COMBAT_EFFECT_IMMUNITY,
          immunityId: "bubble-shield",
          sourceEntityId: COMBAT_ENTITY_ORB,
          targetEntityId: COMBAT_ENTITY_ORB,
          immune: true,
          reason: "bubble_shield",
          durationMs: Number(payload && payload.durationMs) || Number(shieldCombat && shieldCombat.remainingMs) || 0,
          untilMs: Number(shieldCombat && shieldCombat.untilMs) || 0,
          atMs: performance.now(),
          tags: ["spell", "bubble-shield"],
          meta: {
            radiusWorldUnits: Number(shieldCombat && shieldCombat.radiusWorldUnits) || 0,
            diameterRatio: Number(shieldCombat && shieldCombat.diameterRatio) || 0,
          },
        });
      }
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("depth3d.bubbleShield.play.result", {
          handled: !!(result && result.handled),
          skipped: String(result && result.skipped || ""),
          active: !!(bubbleShield3dRuntime && bubbleShield3dRuntime.isActive && bubbleShield3dRuntime.isActive()),
        });
      }
      if (result && result.handled) {
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
        if (perfTrace && typeof perfTrace.mark === "function") {
          perfTrace.mark("depth3d.bubbleShield.frame.requested", {
            active: !!(bubbleShield3dRuntime && bubbleShield3dRuntime.isActive && bubbleShield3dRuntime.isActive()),
          });
        }
      }
      return result || { handled: false };
    },
    playFlameAoe3d(payload = {}) {
      const callAtMs = performance.now();
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("flameAoe.gameStage.called", {
          disposed: !!disposed,
          hasOrbModel: !!(orb3dActorRuntime && orb3dActorRuntime.hasModel && orb3dActorRuntime.hasModel()),
          hasOrbWorld: !!currentOrbWorldPosition,
        });
      }
      if (disposed) {
        return { handled: false, skipped: "flame_aoe3d_runtime_missing" };
      }
      clearTesla1Runtime("flame_aoe3d_started");
      const flamePayload = {
        ...(payload && typeof payload === "object" ? payload : {}),
        wakeMeshEnabled: 0,
        wakeSdfEnabled: 1,
      };
      const behaviorConfig = {
        ...FLAME_AOE_BEHAVIOR_DEFAULT,
        ...(flamePayload.behavior && typeof flamePayload.behavior === "object" ? flamePayload.behavior : {}),
      };
      const behaviorDurationMs = Number(behaviorConfig.durationMs);
      if (Number.isFinite(behaviorDurationMs) && behaviorDurationMs > 0) {
        flamePayload.durationMs = behaviorDurationMs;
      }
      const hasOrbModel = orb3dActorRuntime.hasModel();
      const result = hasOrbModel
        ? flameAoe3dRuntime.play(flamePayload)
        : { handled: false, skipped: "flame_aoe3d_model_missing" };
      root.dataset.enemy3dLastFlameAoeStageCallAt = String(Math.round(callAtMs));
      const hazard = resolveFlameAoeHazardConfig(flamePayload, callAtMs);
      if (hazard.enabled && currentOrbWorldPosition) {
        activeFlameAoeHazard = hazard;
        const damageResult = applyActiveFlameAoeHazard(callAtMs, { force: true });
        if (perfTrace && typeof perfTrace.mark === "function") {
          perfTrace.mark("flameAoe.gameStage.hazardStarted", {
            handled: !!(damageResult && damageResult.handled),
            affected: damageResult && damageResult.affected || 0,
            radiusBo: Number(hazard.radiusBo.toFixed(2)),
            forwardRadiusBo: Number(hazard.forwardRadiusBo.toFixed(2)),
            durationMs: Math.max(0, Math.round(hazard.untilMs - hazard.startedAtMs)),
            tickMs: hazard.tickMs,
          });
        }
      } else {
        activeFlameAoeHazard = null;
        root.dataset.enemy3dLastFlameAoeDamageCount = "0";
        root.dataset.enemy3dLastFlameAoeSkipped = currentOrbWorldPosition ? "disabled" : "missing_orb_world_position";
        if (perfTrace && typeof perfTrace.mark === "function") {
          perfTrace.mark("flameAoe.gameStage.skipped", {
            reason: root.dataset.enemy3dLastFlameAoeSkipped,
            behaviorEnabled: hazard.enabled,
            hasOrbWorld: !!currentOrbWorldPosition,
          });
        }
      }
      if ((result && result.handled) || currentOrbWorldPosition) {
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      }
      return {
        ...(result || { handled: false }),
        damageAffected: Number(root.dataset.enemy3dLastFlameAoeDamageCount) || 0,
      };
    },
    playTesla1(payload = {}) {
      const callAtMs = performance.now();
      const incomingPayload = payload && typeof payload === "object" ? payload : Object.create(null);
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("tesla1.gameStage.called", {
          disposed: !!disposed,
          hasOrbModel: !!(orb3dActorRuntime && orb3dActorRuntime.hasModel && orb3dActorRuntime.hasModel()),
          hasOrbWorld: !!currentOrbWorldPosition,
          payloadKeys: Object.keys(incomingPayload).slice(0, 12),
        });
      }
      if (disposed || !orb3dActorRuntime.hasModel() || !currentOrbWorldPosition) {
        return { handled: false, skipped: "tesla1_runtime_missing" };
      }
      root.dataset.tesla1PresetHaloRanges = JSON.stringify({
        startMinBo: TESLA_1_PRESET_DEFAULT.haloFieldBoltStartMinBo,
        startMaxBo: TESLA_1_PRESET_DEFAULT.haloFieldBoltStartMaxBo,
        endMinBo: TESLA_1_PRESET_DEFAULT.haloFieldBoltEndMinBo,
        endMaxBo: TESLA_1_PRESET_DEFAULT.haloFieldBoltEndMaxBo,
      });
      clearFlameAoe3dRuntime("tesla1_started");
      const result = tesla1Runtime.play({ ...incomingPayload, effect: "tesla-1" });
      root.dataset.enemy3dLastTesla1StageCallAt = String(Math.round(callAtMs));
      if (result && result.handled) {
        activeTesla1OrbLightConfig = result.config || null;
        syncTesla1OrbLightLayer(callAtMs, { config: result.config, force: true });
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      }
      return result || { handled: false };
    },
    clearRootAoe3d(reason = "stage_inactive") {
      clearFlameAoe3dRuntime(reason);
      clearTesla1Runtime(reason);
      renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      return { handled: true };
    },
    playShockwave3d(payload = {}) {
      if (disposed || !orb3dActorRuntime.hasModel()) {
        return { handled: false, skipped: "shockwave3d_runtime_missing" };
      }
      const shockwavePayload = payload && typeof payload === "object" ? payload : {};
      const result = shockwave3dRuntime.play(shockwavePayload);
      if (result && result.handled) {
        const config = { ...SHOCKWAVE_3D_PRESET_DEFAULT, ...shockwavePayload };
        const radiusBo = Math.max(0.1, (Number(config.endRatio) || Number(SHOCKWAVE_3D_PRESET_DEFAULT.endRatio) || 2.7) * 0.5);
        const stunResult = gnatSwarm3dRuntime.applyCombatEffect({
          kind: COMBAT_EFFECT_STUN,
          sourceEntityId: COMBAT_ENTITY_ORB,
          targetEntityId: "enemy:gnat-swarm",
          centerWorld: currentOrbWorldPosition,
          radiusBo,
          amount: Number(shockwavePayload.stunAmount ?? shockwavePayload.stun ?? 10) || 10,
          durationMs: Math.max(50, Number(shockwavePayload.stunDurationMs ?? shockwavePayload.stunDurationSec * 1000) || 2000),
          atMs: performance.now(),
          tags: ["spell", "shockwave"],
        });
        root.dataset.enemy3dLastShockwaveStunCount = String(stunResult && stunResult.affected || 0);
        if (combatEventBus && typeof combatEventBus.emit === "function") {
          combatEventBus.emit(EVT_COMBAT_STUN_APPLIED, {
            kind: COMBAT_EFFECT_STUN,
            sourceEntityId: COMBAT_ENTITY_ORB,
            targetEntityId: "enemy:gnat-swarm",
            aggregate: true,
            affected: stunResult && stunResult.affected || 0,
            radiusBo,
            atMs: performance.now(),
          });
        }
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      }
      return result || { handled: false };
    },
    applyOrbSpinColor(color = {}) {
      if (disposed) return;
      orb3dActorRuntime.applySpinColor(color);
      renderLoop.scheduleAnimation();
      renderLoop.renderFrame(renderLoop.getLastFrame() || {});
    },
    clearOrbSpinColor() {
      if (disposed) return;
      orb3dActorRuntime.clearSpinColor();
      renderLoop.scheduleAnimation();
      renderLoop.renderFrame(renderLoop.getLastFrame() || {});
    },
    setOrbShaderState(shaderState = {}) {
      if (disposed) return { handled: false, skipped: "depth3d_disposed" };
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("orb.shader.api.request", {
          values: shaderState && typeof shaderState === "object" ? { ...shaderState } : null,
        });
      }
      orbShaderMixer.setLayer("api", shaderState, {
        source: "api",
      });
      renderLoop.scheduleAnimation();
      renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      return { handled: true };
    },
    setOrbFloatHoldVisual(payload = {}) {
      if (disposed || !orb3dActorRuntime.hasModel()) {
        return { handled: false, skipped: "orb_float_hold_runtime_missing" };
      }
      const result = orb3dActorRuntime.setFloatHoldVisual(payload);
      renderLoop.scheduleAnimation();
      renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      return result || { handled: false };
    },
    resetEnemies(payload = {}) {
      if (disposed) return { handled: false, skipped: "depth3d_disposed" };
      return resetEnemy3dRuntime(payload);
    },
    renderFrame: renderLoop.renderFrame,
    dispose() {
      disposed = true;
      cancelHealPulse({ clearLayer: false });
      activeFlameAoeHazard = null;
      renderLoop.dispose();
      eventBindings.dispose();
      teleport3dRuntime.destroy();
      bubbleShield3dRuntime.destroy();
      flameAoe3dRuntime.destroy();
      tesla1Runtime.destroy();
      shockwave3dRuntime.destroy();
      surfaceFireCardSystem.dispose();
      orbLifecycle3dRuntime.dispose();
      artPlane3dRuntime.dispose();
      starField3dRuntime.dispose();
      gnatSwarm3dRuntime.dispose();
      clearGlobe3dObjects();
      orb3dActorRuntime.dispose();
      clearGroup();
      clearPropsGroup();
      if (bloom) bloom.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  });
}
