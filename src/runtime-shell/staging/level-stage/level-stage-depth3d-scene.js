import * as THREE from "three";
import {
  DEPTH_ENVIRONMENT_MODE,
  resolveDepthEnvironmentMode,
} from "../../../game-runtime/level/depth-layer-3d-mesh.js?v=20260505a";

export function createLevelStageDepth3dScene({
  root = null,
  fovDeg = 42,
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
  const camera = new THREE.PerspectiveCamera(fovDeg, 1, 1, 24000);
  camera.up.set(0, 1, 0);

  const environmentMode = resolveDepthEnvironmentMode();
  root.dataset.depthEnvironmentMode = environmentMode;
  scene.add(new THREE.AmbientLight(
    0xffffff,
    environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.25 : 0.018,
  ));
  const fill = new THREE.HemisphereLight(
    0xbfdfff,
    0x050507,
    environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.0 : 0.055,
  );
  scene.add(fill);
  const key = new THREE.DirectionalLight(
    0xdfeeff,
    environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 1.15 : 0.0,
  );
  key.position.set(-0.3, -0.5, 1.0);
  key.castShadow = false;
  scene.add(key);

  const depthGroup = new THREE.Group();
  const propsGroup = new THREE.Group();
  const actorGroup = new THREE.Group();
  const globeGroup = new THREE.Group();
  globeGroup.name = "globe3d:runtime_layer";
  actorGroup.add(globeGroup);
  scene.add(depthGroup);
  scene.add(propsGroup);
  scene.add(actorGroup);

  return Object.freeze({
    renderer,
    scene,
    camera,
    environmentMode,
    depthGroup,
    propsGroup,
    actorGroup,
    globeGroup,
  });
}
