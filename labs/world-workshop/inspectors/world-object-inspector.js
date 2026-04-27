import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createBloomComposer } from "../effects/bloom/bloom-effect.js";
import { clearPreviewHost, setPreviewHostCleanup } from "../preview-host.js";
import { disposeObject } from "../rendering/world-render-utils.js";

function resizeInspector({ renderer, composer = null, camera, root, edgeMaterials = [] }) {
  const bounds = root.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  if (composer) composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  edgeMaterials.forEach((material) => {
    material.resolution.set(width, height);
  });
  return { width, height };
}

export function createWorldObjectInspector({
  root,
  bo = 72,
  canvasClassName = "worldObjectInspectorCanvas",
  cameraPositionBo = Object.freeze({ x: 1.2, y: 0.24, z: 4.1 }),
  minDistanceBo = 1.2,
  maxDistanceBo = 32,
  enableShadows = false,
  shadowMapType = THREE.PCFSoftShadowMap,
  bloom = null,
  onFrame = null,
} = {}) {
  if (!root) return null;

  clearPreviewHost(root);

  const baseOrb = Number(bo) || 72;
  const edgeMaterials = [];
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.domElement.className = canvasClassName;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = Boolean(enableShadows);
  renderer.shadowMap.type = shadowMapType;
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  const { composer, bloomPass } = createBloomComposer({ renderer, scene, camera, bloom });
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.minDistance = baseOrb * minDistanceBo;
  controls.maxDistance = baseOrb * maxDistanceBo;
  controls.target.set(0, 0, 0);

  camera.position.set(
    baseOrb * Number(cameraPositionBo.x || 0),
    baseOrb * Number(cameraPositionBo.y || 0),
    baseOrb * Number(cameraPositionBo.z || 4)
  );
  camera.lookAt(controls.target);
  controls.update();

  resizeInspector({ renderer, composer, camera, root, edgeMaterials });

  let animationFrame = 0;
  const render = () => {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  const tick = () => {
    if (typeof onFrame === "function") {
      onFrame({ camera, controls, renderer, scene });
    }
    controls.update();
    render();
    animationFrame = requestAnimationFrame(tick);
  };
  tick();

  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => {
        resizeInspector({ renderer, composer, camera, root, edgeMaterials });
        render();
      })
    : null;
  if (resizeObserver) resizeObserver.observe(root);

  const cleanup = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (resizeObserver) resizeObserver.disconnect();
    controls.dispose();
    disposeObject(scene);
    if (composer) composer.dispose();
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    setPreviewHostCleanup(root, null);
  };
  setPreviewHostCleanup(root, cleanup);

  return Object.freeze({
    scene,
    camera,
    controls,
    renderer,
    composer,
    bloomPass,
    edgeMaterials,
    render,
    cleanup,
  });
}
