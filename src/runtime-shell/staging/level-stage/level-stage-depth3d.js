import * as THREE from "three";
import { createOrb3dActorRuntime } from "../../../game-runtime/orb/orb-3d-actor-runtime.js?v=20260430a";
import {
  LEVEL_DEPTH_CAMERA_FOV_DEG,
  LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS,
  LEVEL_DEPTH_DEFAULT_ORB_Z_BO,
  resolveDepthCameraZ,
  resolveOrbTravelZBO,
} from "../../../game-runtime/level/depth-projection.js";
import {
  buildDepthLayerMesh,
  DEPTH_ENVIRONMENT_MODE,
  resolveDepthEnvironmentMode,
} from "../../../game-runtime/level/depth-layer-3d-mesh.js?v=20260430a";
import { disposeThreeObject } from "../../../game-runtime/rendering/three/three-object-utils.js";
import { createWorldProps3dRuntime } from "../../../game-runtime/world/props/world-props-3d-runtime.js?v=20260430a";
import { createRuntimeGlobe3dObject } from "../../../game-runtime/world/globe-3d-runtime-object.js?v=20260430a";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../../../game-runtime/world/world-globe-3d-default.js?v=20260429b";
import { createWorldGlobe3dRuntime } from "../../../game-runtime/world/world-globe-3d-runtime.js?v=20260430a";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "../../../game-runtime/orb/orb-globe-3d-default.js?v=20260429b";
import { createOrbGlobe3dRuntime } from "../../../game-runtime/orb/orb-globe-3d-runtime.js?v=20260430a";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../../game-runtime/orb/orb-lifecycle-3d-default.js?v=20260430a";
import { createOrbLifecycle3dRuntime } from "../../../game-runtime/orb/orb-lifecycle-3d-runtime.js?v=20260430a";
import {
  EVT_ORB_DAMAGE_APPLIED,
  EVT_ORB_DIED,
  EVT_ORB_HEALED,
  EVT_ORB_REVIVED,
  EVT_PICKUP_COLLECTED,
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_RESOURCES_GLOBE_SPENT,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_LOADED,
} from "../../../contracts/events.js";

const BO_WORLD_UNITS = LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS;
const DEPTH_CAMERA_FOV_DEG = LEVEL_DEPTH_CAMERA_FOV_DEG;
function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

function readSpawnWorldX(spawn = {}, worldWidthPx = 1) {
  if (Number.isFinite(Number(spawn && spawn.xW))) return Number(spawn.xW);
  if (spawn && spawn.worldCenter && Number.isFinite(Number(spawn.worldCenter.xW))) {
    return Number(spawn.worldCenter.xW);
  }
  return Math.max(1, clampNumber(worldWidthPx, 1)) * clamp01(spawn && spawn.xNorm);
}

function readSpawnWorldY(spawn = {}) {
  if (Number.isFinite(Number(spawn && spawn.yW))) return Number(spawn.yW);
  if (spawn && spawn.worldCenter && Number.isFinite(Number(spawn.worldCenter.yW))) {
    return Number(spawn.worldCenter.yW);
  }
  return 0;
}

function resolveDepthLayerLabel(depthLayers = []) {
  const layers = Array.isArray(depthLayers) ? depthLayers : [];
  if (!layers.length) return "no depth layer";
  return layers.map((layer) => String(layer && layer.label || layer && layer.id || "depth")).join(" / ");
}

function applyEnvironmentMeshFlags(object = null, {
  receiveShadow = true,
  castShadow = true,
} = {}) {
  if (!object || typeof object.traverse !== "function") return;
  object.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.receiveShadow = !!receiveShadow;
    node.castShadow = !!castShadow;
  });
}

function toThreeX(worldX, worldWidthPx) {
  return clampNumber(worldX, 0) - (Math.max(1, clampNumber(worldWidthPx, 1)) * 0.5);
}

function toThreeY(worldY, worldHeightPx) {
  return (Math.max(1, clampNumber(worldHeightPx, 1)) * 0.5) - clampNumber(worldY, 0);
}

export function createLevelStageDepth3dLayer({
  root = null,
  labelEl = null,
  debugEl = null,
  orbDiameterWorldUnits = BO_WORLD_UNITS,
} = {}) {
  if (!root) return null;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(DEPTH_CAMERA_FOV_DEG, 1, 1, 24000);
  camera.up.set(0, 1, 0);
  const environmentMode = resolveDepthEnvironmentMode();
  root.dataset.depthEnvironmentMode = environmentMode;
  scene.add(new THREE.AmbientLight(0xffffff, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.25 : 0.018));
  const fill = new THREE.HemisphereLight(0xbfdfff, 0x050507, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.0 : 0.055);
  scene.add(fill);
  const key = new THREE.DirectionalLight(0xdfeeff, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 1.15 : 0.0);
  key.position.set(-0.3, -0.5, 1.0);
  key.castShadow = false;
  scene.add(key);
  const group = new THREE.Group();
  const propsGroup = new THREE.Group();
  const actorGroup = new THREE.Group();
  scene.add(group);
  scene.add(propsGroup);
  scene.add(actorGroup);

  let disposed = false;
  let worldWidthPx = 1;
  let worldHeightPx = 1;
  let depthLayerCount = 0;
  let lastFrame = null;
  let pendingRenderFrame = 0;
  let lastRenderWidth = 0;
  let lastRenderHeight = 0;
  let hasCameraFrame = false;
  let lastCameraAspect = 0;
  let lastCameraNear = 0;
  let lastCameraFar = 0;
  let lastCameraX = 0;
  let lastCameraY = 0;
  let lastCameraZ = 0;
  const globe3dGroup = new THREE.Group();
  globe3dGroup.name = "globe3d:runtime_layer";
  actorGroup.add(globe3dGroup);
  const baseOrbWorldUnits = Math.max(1, clampNumber(orbDiameterWorldUnits, BO_WORLD_UNITS));
  let currentOrbZBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO;
  let globe3dFrame = 0;
  let lastGlobe3dTickMs = 0;
  const orb3dActorRuntime = createOrb3dActorRuntime({
    parent: actorGroup,
    fallbackBo: baseOrbWorldUnits,
    getDefaultZBO: () => currentOrbZBO,
    toRuntimePosition: ({ x = 0, y = 0, z = 0 } = {}) => ({
      x: toThreeX(x, worldWidthPx),
      y: toThreeY(y, worldHeightPx),
      z,
    }),
    applyMeshFlags: applyEnvironmentMeshFlags,
    onTelemetry: updateOrbTelemetry,
    onModelChanged: () => {
      orbLifecycle3dRuntime.attachOrbModel();
    },
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const worldGlobe3dRuntime = createWorldGlobe3dRuntime({
    group: globe3dGroup,
    createGlobeObject: createRuntimeGlobe3dObject,
    resolveSpawnAnchor: (spawn) => ({
      x: readSpawnWorldX(spawn, worldWidthPx),
      y: readSpawnWorldY(spawn),
    }),
    toRuntimePosition: ({ x = 0, y = 0 } = {}) => ({
      x: toThreeX(x, worldWidthPx),
      y: toThreeY(y, worldHeightPx),
      z: -orb3dActorRuntime.getDepthPx(),
    }),
    getBo: () => baseOrbWorldUnits,
    getConfig: () => WORLD_GLOBE_3D_VISUAL_DEFAULTS,
    onSpawnCountChange: (count) => {
      root.dataset.depthGlobe3dWorldSpawnCount = String(Math.max(0, Number(count) || 0));
    },
    onActiveCountChange: (count) => {
      root.dataset.depthGlobe3dWorldCount = String(Math.max(0, Number(count) || 0));
    },
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const orbGlobe3dRuntime = createOrbGlobe3dRuntime({
    group: globe3dGroup,
    createGlobeObject: createRuntimeGlobe3dObject,
    getBo: () => baseOrbWorldUnits,
    getCenterPosition: () => orb3dActorRuntime.getPosition(),
    getConfig: () => ORB_GLOBE_3D_VISUAL_DEFAULTS,
    onCountChange: (count) => {
      root.dataset.depthGlobe3dOrbCount = String(Math.max(0, Number(count) || 0));
    },
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const orbLifecycle3dRuntime = createOrbLifecycle3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBurstParent: () => actorGroup,
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => ORB_LIFECYCLE_3D_DEFAULTS,
    getBurstPosition: () => orb3dActorRuntime.getPosition(),
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const worldProps3dRuntime = createWorldProps3dRuntime({
    group: propsGroup,
    getBo: () => orb3dActorRuntime.getBo(),
    toRuntimePosition: ({ x = 0, y = 0 } = {}) => ({
      x: toThreeX(x, worldWidthPx),
      y: toThreeY(y, worldHeightPx),
    }),
    onCountChange: (count) => {
      root.dataset.depthPropCount = String(Math.max(0, Number(count) || 0));
    },
  });
  const globe3dUnsub = [];
  let lastTelemetryText = "";
  let lastTelemetryBO = "";
  let lastTelemetryRadius = "";
  let lastTelemetryZBO = "";
  let lastTelemetryDepthPx = "";

  function updateOrbTelemetry({
    bo = orb3dActorRuntime.getBo(),
    zBO = currentOrbZBO,
    depthPx = orb3dActorRuntime.getDepthPx(),
  } = {}) {
    if (!root || !root.dataset) return;
    const nextBO = Number(bo || 0).toFixed(2);
    const nextRadius = (Math.max(1, Number(bo) || BO_WORLD_UNITS) * 0.5).toFixed(2);
    const nextZBO = Number(zBO || 0).toFixed(2);
    const nextDepthPx = Number(depthPx || 0).toFixed(2);
    if (
      nextBO === lastTelemetryBO
      && nextRadius === lastTelemetryRadius
      && nextZBO === lastTelemetryZBO
      && nextDepthPx === lastTelemetryDepthPx
    ) {
      return;
    }
    lastTelemetryBO = nextBO;
    lastTelemetryRadius = nextRadius;
    lastTelemetryZBO = nextZBO;
    lastTelemetryDepthPx = nextDepthPx;
    root.dataset.depthOrbBo = nextBO;
    root.dataset.depthOrbRadius = nextRadius;
    root.dataset.depthOrbZbo = nextZBO;
    root.dataset.depthOrbDepthPx = nextDepthPx;
    if (labelEl && labelEl.dataset) {
      labelEl.dataset.depthOrbBo = nextBO;
      labelEl.dataset.depthOrbRadius = nextRadius;
      labelEl.dataset.depthOrbZbo = nextZBO;
      labelEl.dataset.depthOrbDepthPx = nextDepthPx;
    }
    if (debugEl) {
      const nextText = `3d BO ${nextBO} | r ${nextRadius} | z ${nextZBO}BO | depth ${nextDepthPx}`;
      if (nextText !== lastTelemetryText) {
        debugEl.textContent = nextText;
        lastTelemetryText = nextText;
      }
    }
  }

  function setLabel(text) {
    if (labelEl) {
      labelEl.dataset.depth3d = text;
    }
  }

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
    orbLifecycle3dRuntime.dispose();
  }

  function loadGlobe3dWorldSpawns(spawns = []) {
    clearGlobe3dObjects();
    worldGlobe3dRuntime.loadSpawns(spawns);
    syncRootVisibility();
    scheduleGlobe3dFrames();
  }

  function bindGlobe3dEvents({ eventBus = null, spawns = [] } = {}) {
    root.dataset.depthGlobe3dBound = eventBus && typeof eventBus.on === "function" ? "true" : "false";
    while (globe3dUnsub.length) {
      const off = globe3dUnsub.pop();
      try { off(); } catch (_) {}
    }
    loadGlobe3dWorldSpawns(spawns);
    if (!eventBus || typeof eventBus.on !== "function") return;
    globe3dUnsub.push(eventBus.on(EVT_PICKUP_COLLECTED, (payload = {}) => {
      worldGlobe3dRuntime.collect(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_RESOURCES_GLOBE_SPENT, (payload = {}) => {
      worldGlobe3dRuntime.markSpent(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, (payload = {}) => {
      orbGlobe3dRuntime.reconcileInventory(payload.globes || []);
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_DAMAGE_APPLIED, (payload = {}) => {
      orbLifecycle3dRuntime.applyDamage(payload);
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_HEALED, (payload = {}) => {
      orbLifecycle3dRuntime.heal(payload);
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      orbGlobe3dRuntime.load(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      orbGlobe3dRuntime.consume(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_DIED, () => {
      orbGlobe3dRuntime.setDead(true);
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_DIED, (payload = {}) => {
      orbLifecycle3dRuntime.startDissolve(payload);
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
      orbGlobe3dRuntime.revive();
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_REVIVED, (payload = {}) => {
      orbLifecycle3dRuntime.reset(payload);
      scheduleGlobe3dFrames();
    }));
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
      worldGlobe3dRuntime.hasActiveVisuals()
      || orbGlobe3dRuntime.hasActiveVisuals()
      || orbLifecycle3dRuntime.hasActiveVisuals()
      || orb3dActorRuntime.isNodActive()
    );
  }

  function scheduleGlobe3dFrames() {
    if (disposed || globe3dFrame || typeof requestAnimationFrame !== "function") return;
    const tick = (nowMs) => {
      globe3dFrame = 0;
      if (disposed || !hasActiveGlobe3dAnimation()) return;
      tickGlobe3dRuntime(nowMs);
      renderFrame(lastFrame || {});
      globe3dFrame = requestAnimationFrame(tick);
    };
    globe3dFrame = requestAnimationFrame(tick);
  }

  function syncRootVisibility() {
    root.hidden = depthLayerCount <= 0
      && propsGroup.children.length <= 0
      && !orb3dActorRuntime.hasModel()
      && !globe3dGroup.children.length;
  }

  function doRenderFrame({
    camLeft = 0,
    camTop = 0,
    zoom = 1,
    viewportWidthPx = 0,
    viewportHeightPx = 0,
    isBootFrame = false,
  } = {}) {
    if (disposed) return;
    lastFrame = {
      camLeft,
      camTop,
      zoom,
      viewportWidthPx,
      viewportHeightPx,
      isBootFrame,
    };
    const width = Math.max(1, Math.round(clampNumber(viewportWidthPx, root.clientWidth || 1)));
    const height = Math.max(1, Math.round(clampNumber(viewportHeightPx, root.clientHeight || 1)));
    if (width !== lastRenderWidth || height !== lastRenderHeight) {
      renderer.setSize(width, height, false);
      worldProps3dRuntime.updateResolution(width, height);
      lastRenderWidth = width;
      lastRenderHeight = height;
    }
    const safeZoom = Math.max(0.05, clampNumber(zoom, 1));
    const viewW = width / safeZoom;
    const viewH = height / safeZoom;
    const centerXW = clampNumber(camLeft, 0) + (viewW * 0.5);
    const centerYW = clampNumber(camTop, 0) + (viewH * 0.5);
    const cx = toThreeX(centerXW, worldWidthPx);
    const cy = toThreeY(centerYW, worldHeightPx);
    const cameraZ = resolveDepthCameraZ({
      viewportHeightPx: height,
      zoom: safeZoom,
      fovDeg: camera.fov,
    });
    const nextAspect = width / height;
    const nextNear = Math.max(1, cameraZ * 0.02);
    const nextFar = Math.max(24000, cameraZ + (BO_WORLD_UNITS * 32));
    const projectionChanged = !hasCameraFrame
      || Math.abs(nextAspect - lastCameraAspect) > 0.000001
      || Math.abs(nextNear - lastCameraNear) > 0.000001
      || Math.abs(nextFar - lastCameraFar) > 0.000001;
    const positionChanged = !hasCameraFrame
      || Math.abs(cx - lastCameraX) > 0.000001
      || Math.abs(cy - lastCameraY) > 0.000001
      || Math.abs(cameraZ - lastCameraZ) > 0.000001;
    if (projectionChanged) {
      camera.aspect = nextAspect;
      camera.near = nextNear;
      camera.far = nextFar;
      camera.updateProjectionMatrix();
    }
    if (positionChanged) {
      camera.position.set(cx, cy, cameraZ);
      camera.lookAt(cx, cy, 0);
    }
    hasCameraFrame = true;
    lastCameraAspect = nextAspect;
    lastCameraNear = nextNear;
    lastCameraFar = nextFar;
    lastCameraX = cx;
    lastCameraY = cy;
    lastCameraZ = cameraZ;
    orb3dActorRuntime.update(performance.now() / 1000);
    tickGlobe3dRuntime(performance.now());
    renderer.render(scene, camera);
  }

  function renderFrame(frame = {}) {
    if (disposed) return;
    lastFrame = {
      camLeft: clampNumber(frame.camLeft, 0),
      camTop: clampNumber(frame.camTop, 0),
      zoom: clampNumber(frame.zoom, 1),
      viewportWidthPx: clampNumber(frame.viewportWidthPx, 0),
      viewportHeightPx: clampNumber(frame.viewportHeightPx, 0),
      isBootFrame: !!frame.isBootFrame,
    };
    if (pendingRenderFrame) return;
    if (typeof requestAnimationFrame !== "function") {
      doRenderFrame(lastFrame);
      return;
    }
    pendingRenderFrame = requestAnimationFrame(() => {
      pendingRenderFrame = 0;
      if (disposed) return;
      doRenderFrame(lastFrame || {});
    });
  }

  function resolveBootFrame(layers = []) {
    const width = Math.max(1, Math.round(root.clientWidth || (globalThis.innerWidth || 1)));
    const height = Math.max(1, Math.round(root.clientHeight || (globalThis.innerHeight || 1)));
    const boxes = (Array.isArray(layers) ? layers : [])
      .map((layer) => layer && layer.boundaryBox ? layer.boundaryBox : null)
      .filter(Boolean);
    if (!boxes.length) {
      return Object.freeze({
        camLeft: 0,
        camTop: 0,
        zoom: 1,
        viewportWidthPx: width,
        viewportHeightPx: height,
      });
    }
    const left = Math.min(...boxes.map((box) => clampNumber(box.leftXW, 0)));
    const top = Math.min(...boxes.map((box) => clampNumber(box.topYW, 0)));
    const right = Math.max(...boxes.map((box) => clampNumber(box.rightXW, 0)));
    const bottom = Math.max(...boxes.map((box) => clampNumber(box.bottomYW, 0)));
    const centerX = (left + right) * 0.5;
    const centerY = (top + bottom) * 0.5;
    return Object.freeze({
      camLeft: Math.max(0, centerX - (width * 0.5)),
      camTop: Math.max(0, centerY - (height * 0.5)),
      zoom: 1,
      viewportWidthPx: width,
      viewportHeightPx: height,
    });
  }

  function loadProps(props = []) {
    worldProps3dRuntime.load(props);
  }

  return Object.freeze({
    async loadScene(authoredScene = null, state = null) {
      if (disposed) return;
      clearGroup();
      clearPropsGroup();
      const summary = authoredScene && authoredScene.summary ? authoredScene.summary : null;
      const layers = Array.isArray(summary && summary.depthLayers) ? summary.depthLayers : [];
      const props = Array.isArray(authoredScene && authoredScene.props)
        ? authoredScene.props
        : (Array.isArray(summary && summary.props) ? summary.props : []);
      worldWidthPx = Math.max(1, clampNumber(state && state.worldWidthPx, worldWidthPx));
      worldHeightPx = Math.max(1, clampNumber(state && state.worldHeightPx, worldHeightPx));
      depthLayerCount = layers.length;
      currentOrbZBO = resolveOrbTravelZBO(summary, LEVEL_DEPTH_DEFAULT_ORB_Z_BO);
      setLabel(resolveDepthLayerLabel(layers));
      for (const layer of layers) {
        const mesh = await buildDepthLayerMesh({
          layer,
          viewBox: summary.viewBox || { x: 0, y: 0, width: worldWidthPx, height: worldHeightPx },
          worldWidthPx,
          worldHeightPx,
          environmentMode,
        });
        if (mesh) {
          applyEnvironmentMeshFlags(mesh);
          group.add(mesh);
        }
      }
      loadProps(props);
      syncRootVisibility();
      root.dataset.depthLayerCount = String(group.children.length);
      root.dataset.depthStatus = group.children.length ? "ready" : "empty";
      if (group.children.length) {
        renderFrame(lastFrame || { ...resolveBootFrame(layers), isBootFrame: true });
      }
    },
    setOrbWorldPosition({
      xW = null,
      yW = null,
      bo = BO_WORLD_UNITS,
      zBO = currentOrbZBO,
    } = {}) {
      if (disposed) return false;
      const handled = orb3dActorRuntime.setWorldPosition({ xW, yW, bo, zBO });
      if (!handled) return false;
      syncRootVisibility();
      scheduleGlobe3dFrames();
      if (lastFrame) renderFrame(lastFrame);
      return true;
    },
    bindGlobe3dRuntime(args = {}) {
      if (disposed) return;
      bindGlobe3dEvents(args);
    },
    playOrbNod3d(payload = {}) {
      if (disposed) {
        return { handled: false, skipped: "orb_nod3d_runtime_missing" };
      }
      const result = orb3dActorRuntime.playNod(payload);
      if (result && result.handled) {
        scheduleGlobe3dFrames();
        renderFrame(lastFrame || {});
      }
      return result || { handled: false };
    },
    renderFrame,
    dispose() {
      disposed = true;
      if (globe3dFrame && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(globe3dFrame);
      }
      if (pendingRenderFrame && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(pendingRenderFrame);
      }
      globe3dFrame = 0;
      pendingRenderFrame = 0;
      orbLifecycle3dRuntime.dispose();
      while (globe3dUnsub.length) {
        const off = globe3dUnsub.pop();
        try { off(); } catch (_) {}
      }
      clearGlobe3dObjects();
      orb3dActorRuntime.dispose();
      clearGroup();
      clearPropsGroup();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  });
}
