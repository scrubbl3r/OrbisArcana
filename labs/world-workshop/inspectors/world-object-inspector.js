import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { disposeObject } from "../rendering/world-render-utils.js";

function resizeInspector({ renderer, camera, root, edgeMaterials = [] }) {
  const bounds = root.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
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
} = {}) {
  if (!root) return null;

  if (root.__worldWorkshopPreviewCleanup) root.__worldWorkshopPreviewCleanup();
  root.innerHTML = "";

  const baseOrb = Number(bo) || 72;
  const edgeMaterials = [];
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.domElement.className = canvasClassName;
  renderer.setClearColor(0x000000, 0);
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
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

  let animationFrame = 0;
  const render = () => {
    resizeInspector({ renderer, camera, root, edgeMaterials });
    renderer.render(scene, camera);
  };
  const tick = () => {
    controls.update();
    render();
    animationFrame = requestAnimationFrame(tick);
  };
  tick();

  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(render)
    : null;
  if (resizeObserver) resizeObserver.observe(root);

  const cleanup = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (resizeObserver) resizeObserver.disconnect();
    controls.dispose();
    disposeObject(scene);
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    root.__worldWorkshopPreviewCleanup = null;
  };
  root.__worldWorkshopPreviewCleanup = cleanup;

  return Object.freeze({
    scene,
    camera,
    controls,
    renderer,
    edgeMaterials,
    render,
    cleanup,
  });
}

