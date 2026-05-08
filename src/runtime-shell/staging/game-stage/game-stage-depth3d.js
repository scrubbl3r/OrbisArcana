import { createOrb3dActorRuntime } from "../../../game-runtime/orb/orb-3d-actor-runtime.js?v=20260501e";
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
import {
  AUTHORED_LEVEL_READ_MODEL_KEY_DEPTH_LAYERS,
  AUTHORED_LEVEL_READ_MODEL_KEY_ORB_DEPTH,
  AUTHORED_LEVEL_READ_MODEL_KEY_PROPS,
  resolveAuthoredLevelReadModelArray,
  resolveAuthoredLevelReadModelObject,
} from "../../../game-runtime/level/authored-level-read-model.js";
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
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../../game-runtime/orb/orb-lifecycle-3d-default.js?v=20260430a";
import { createOrbLifecycle3dRuntime } from "../../../game-runtime/orb/orb-lifecycle-3d-runtime.js?v=20260430b";
import { createTeleport3dRuntime } from "../../../runtime-effects/teleport-3d.js?v=20260501a";
import { createBubbleShield3dRuntime } from "../../../runtime-effects/bubble-shield-3d.js?v=20260506d";
import { createFlameAoe3dRuntime } from "../../../runtime-effects/flame-aoe-3d.js?v=20260505i";
import { createShockwave3dRuntime } from "../../../runtime-effects/shockwave-3d.js?v=20260506a";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../../../vfx/presets/bubble-shield-3d-default.js?v=20260506d";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../../../vfx/presets/flame-aoe-3d-default.js?v=20260505e";
import { SHOCKWAVE_3D_PRESET_DEFAULT } from "../../../vfx/presets/shockwave-3d-default.js?v=20260506a";
import { createGameStageDepth3dEventBindings } from "./game-stage-depth3d-events.js?v=20260502a";
import { createGameStageDepth3dBloom } from "./game-stage-depth3d-bloom.js?v=20260505h";
import {
  GAME_STAGE_DEPTH3D_TRACE_VERSION,
  publishDepth3dModuleVersion,
} from "./game-stage-depth3d-debug.js";
import { createGameStageDepth3dRenderLoop } from "./game-stage-depth3d-render-loop.js?v=20260430b";
import { createGameStageDepth3dScene } from "./game-stage-depth3d-scene.js?v=20260505c";
import { createGameStageDepth3dTelemetry } from "./game-stage-depth3d-telemetry.js?v=20260430b";

const BO_WORLD_UNITS = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS;
const DEPTH_CAMERA_FOV_DEG = LEVEL_DEPTH_CAMERA_FOV_DEG;
const WORLD_GLOBE_FOREGROUND_Z_BO = 0.08;

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

function resolveSceneProps(authoredScene = null) {
  return resolveAuthoredLevelReadModelArray(authoredScene, AUTHORED_LEVEL_READ_MODEL_KEY_PROPS);
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
    depthGroup: group,
    propsGroup,
    actorGroup,
    globeGroup: globe3dGroup,
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
  let lastGlobe3dTickMs = 0;
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
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => FLAME_AOE_3D_PRESET_DEFAULT,
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
    traceMeasure: perfTrace && typeof perfTrace.measure === "function" ? perfTrace.measure : null,
  });
  const shockwave3dRuntime = createShockwave3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => SHOCKWAVE_3D_PRESET_DEFAULT,
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
  const orbLifecycle3dRuntime = createOrbLifecycle3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBurstParent: () => actorGroup,
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => ORB_LIFECYCLE_3D_DEFAULTS,
    getBurstPosition: () => orb3dActorRuntime.getPosition(),
    onNeedsFrame: () => renderLoop.scheduleAnimation(),
  });
  const eventBindings = createGameStageDepth3dEventBindings({
    root,
    worldGlobe3dRuntime,
    orbGlobe3dRuntime,
    orbLifecycle3dRuntime,
    loadWorldSpawns: loadGlobe3dWorldSpawns,
    scheduleFrame: renderLoop.scheduleAnimation,
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

  function hasActiveGlobe3dAnimation() {
    return (
      worldGlobe3dRuntime.hasAnimatingVisuals()
      || orbGlobe3dRuntime.hasActiveVisuals()
      || orbLifecycle3dRuntime.hasActiveVisuals()
      || orb3dActorRuntime.isNodActive()
      || orb3dActorRuntime.isSpinColorActive()
      || teleport3dRuntime.isActive()
      || bubbleShield3dRuntime.isActive()
      || flameAoe3dRuntime.isActive()
      || shockwave3dRuntime.isActive()
    );
  }

  function syncRootVisibility() {
    root.hidden = depthLayerCount <= 0
      && propsGroup.children.length <= 0
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
        camera: trace.camera,
      });
    }
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
    const measure = perfTrace && typeof perfTrace.measure === "function"
      ? perfTrace.measure
      : null;
    if (measure) {
      measure("depth3d.orbUpdate", () => orb3dActorRuntime.update(frameNowMs / 1000));
      measure("depth3d.globes", () => tickGlobe3dRuntime(frameNowMs));
      measure("depth3d.renderer", () => {
        if (bloom) bloom.render();
        else renderer.render(scene, camera);
      });
    } else {
      orb3dActorRuntime.update(frameNowMs / 1000);
      tickGlobe3dRuntime(frameNowMs);
      if (bloom) bloom.render();
      else renderer.render(scene, camera);
    }
    syncBloomTelemetry();
  }

  function loadProps(props = []) {
    worldProps3dRuntime.load(props);
  }

  return Object.freeze({
    async loadScene(authoredScene = null, state = null) {
      if (disposed) return;
      clearGroup();
      clearPropsGroup();
      const summary = resolveSceneSummary(authoredScene);
      const layers = resolveSceneDepthLayers(authoredScene);
      const props = resolveSceneProps(authoredScene);
      const orbDepth = resolveSceneOrbDepth(authoredScene);
      worldWidthPx = Math.max(1, clampNumber(state && state.worldWidthPx, worldWidthPx));
      worldHeightPx = Math.max(1, clampNumber(state && state.worldHeightPx, worldHeightPx));
      depthLayerCount = layers.length;
      currentOrbZBO = resolveOrbTravelZBO({ depthLayers: layers, orbDepth }, LEVEL_DEPTH_DEFAULT_ORB_Z_BO);
      telemetry.setDepthLayerLabel(layers);
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
      if (boundGlobe3dSpawns.length) {
        worldGlobe3dRuntime.loadSpawns(boundGlobe3dSpawns);
        tickGlobe3dRuntime();
      }
      syncRootVisibility();
      telemetry.setSceneStatus({
        depthLayerCount: group.children.length,
        depthStatus: group.children.length ? "ready" : "empty",
      });
      if (group.children.length) {
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
      syncRootVisibility();
      renderLoop.scheduleAnimation();
      const lastFrame = renderLoop.getLastFrame();
      if (lastFrame) renderLoop.renderFrame(lastFrame);
      return true;
    },
    bindGlobe3dRuntime(args = {}) {
      if (disposed) return;
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
      const result = teleport3dRuntime.play(payload);
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
      if (disposed || !orb3dActorRuntime.hasModel()) {
        return { handled: false, skipped: "flame_aoe3d_runtime_missing" };
      }
      const result = flameAoe3dRuntime.play(payload);
      if (result && result.handled) {
        renderLoop.scheduleAnimation();
        renderLoop.renderFrame(renderLoop.getLastFrame() || {});
      }
      return result || { handled: false };
    },
    playShockwave3d(payload = {}) {
      if (disposed || !orb3dActorRuntime.hasModel()) {
        return { handled: false, skipped: "shockwave3d_runtime_missing" };
      }
      const result = shockwave3dRuntime.play(payload);
      if (result && result.handled) {
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
    renderFrame: renderLoop.renderFrame,
    dispose() {
      disposed = true;
      renderLoop.dispose();
      eventBindings.dispose();
      teleport3dRuntime.destroy();
      bubbleShield3dRuntime.destroy();
      flameAoe3dRuntime.destroy();
      shockwave3dRuntime.destroy();
      orbLifecycle3dRuntime.dispose();
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
