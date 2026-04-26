import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

const EDGE_COLOR = 0xffffff;
const FACE_COLOR = 0x000000;

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    }
  });
}

function addEdges(mesh, { color = EDGE_COLOR, edgeMaterials = [] } = {}) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 16);
  const positions = Array.from(edges.getAttribute("position").array);
  const lineGeometry = new LineSegmentsGeometry();
  lineGeometry.setPositions(positions);
  edges.dispose();
  const material = new LineMaterial({
      color,
      linewidth: 2,
      worldUnits: false,
    });
  edgeMaterials.push(material);
  const lines = new LineSegments2(lineGeometry, material);
  lines.computeLineDistances();
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  lines.scale.copy(mesh.scale);
  mesh.parent.add(lines);
  return lines;
}

function addBox(group, {
  width,
  height,
  depth,
  x = 0,
  y = 0,
  z = 0,
  material,
  edgeMaterials,
}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  addEdges(mesh, { edgeMaterials });
  return mesh;
}

function addNonagonColumn(group, {
  width,
  depth,
  height,
  x = 0,
  y = 0,
  z = 0,
  material,
  edgeMaterials,
}) {
  const radiusX = width * 0.5;
  const radiusZ = depth * 0.5;
  const geometry = new THREE.CylinderGeometry(1, 1, height, 9, 1, false, Math.PI * -0.5);
  geometry.scale(radiusX, 1, radiusZ);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  addEdges(mesh, { edgeMaterials });
  return mesh;
}

function resizeRenderer({ renderer, camera, root, edgeMaterials = [] }) {
  const bounds = root.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  camera.left = width * -0.5;
  camera.right = width * 0.5;
  camera.top = height * 0.5;
  camera.bottom = height * -0.5;
  camera.updateProjectionMatrix();
  edgeMaterials.forEach((material) => {
    material.resolution.set(width, height);
  });
  return { width, height };
}

export function renderIonicPlinthPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const columnWidth = bo * 0.8;
  const columnDepth = bo * 0.8;
  const columnHeight = bo * 1.5;
  const capitalWidth = bo * 1.35;
  const capitalDepth = capitalWidth;
  const baseWidth = bo * 1.35;
  const baseDepth = bo * 1.35;
  const baseLowerHeight = bo * 0.36;
  const baseUpperHeight = bo * 0.28;
  const capCenterHeight = bo * 0.34;
  const plinthHeight = baseLowerHeight + baseUpperHeight + columnHeight + capCenterHeight;
  const columnCenterY = baseLowerHeight + baseUpperHeight + columnHeight * 0.5;

  if (root.__worldWorkshopPreviewCleanup) root.__worldWorkshopPreviewCleanup();
  root.innerHTML = "";

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.domElement.className = "ionicPlinthCanvas";
  renderer.setClearColor(0x000000, 0);
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  camera.position.set(0, 0, 500);
  camera.lookAt(0, 0, 0);

  const faceMaterial = new THREE.MeshBasicMaterial({
    color: FACE_COLOR,
    side: THREE.DoubleSide,
  });
  const edgeMaterials = [];

  const yawGroup = new THREE.Group();
  const pitchGroup = new THREE.Group();
  const model = new THREE.Group();
  model.position.y = -columnCenterY;
  pitchGroup.add(model);
  yawGroup.add(pitchGroup);
  scene.add(yawGroup);

  let y = 0;
  addBox(model, {
    width: baseWidth,
    height: baseLowerHeight,
    depth: baseDepth,
    y: y + baseLowerHeight * 0.5,
    material: faceMaterial,
    edgeMaterials,
  });
  y += baseLowerHeight;
  addBox(model, {
    width: baseWidth * 0.86,
    height: baseUpperHeight,
    depth: baseDepth * 0.86,
    y: y + baseUpperHeight * 0.5,
    material: faceMaterial,
    edgeMaterials,
  });
  y += baseUpperHeight;
  addNonagonColumn(model, {
    width: columnWidth,
    height: columnHeight,
    depth: columnDepth,
    y: y + columnHeight * 0.5,
    material: faceMaterial,
    edgeMaterials,
  });
  y += columnHeight;
  addBox(model, {
    width: capitalWidth,
    height: capCenterHeight,
    depth: capitalDepth,
    y: y + capCenterHeight * 0.5,
    material: faceMaterial,
    edgeMaterials,
  });

  y += capCenterHeight;

  const orbGuide = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.SphereGeometry(bo * 0.5, 32, 16), 16),
    new THREE.LineDashedMaterial({
      color: EDGE_COLOR,
      dashSize: 4,
      gapSize: 6,
      transparent: true,
      opacity: 0.22,
    })
  );
  orbGuide.position.set(0, plinthHeight + bo * 0.5, 0);
  orbGuide.computeLineDistances();
  model.add(orbGuide);

  const rotation = {
    x: -0.08,
    y: 0.18,
  };
  let dragging = false;
  let lastPointer = null;
  const render = () => {
    resizeRenderer({ renderer, camera, root, edgeMaterials });
    pitchGroup.rotation.x = rotation.x;
    yawGroup.rotation.y = rotation.y;
    renderer.render(scene, camera);
  };
  const pointerDown = (event) => {
    dragging = true;
    lastPointer = {
      x: event.clientX,
      y: event.clientY,
    };
    renderer.domElement.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event) => {
    if (!dragging || !lastPointer) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    rotation.y += dx * 0.01;
    rotation.x = Math.max(-0.9, Math.min(0.9, rotation.x + dy * 0.01));
    lastPointer = {
      x: event.clientX,
      y: event.clientY,
    };
    render();
  };
  const pointerUp = (event) => {
    dragging = false;
    lastPointer = null;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId);
    }
  };
  const wheel = (event) => {
    event.preventDefault();
    rotation.y += (event.deltaX || event.deltaY) * 0.004;
    render();
  };
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("pointermove", pointerMove);
  renderer.domElement.addEventListener("pointerup", pointerUp);
  renderer.domElement.addEventListener("pointercancel", pointerUp);
  renderer.domElement.addEventListener("wheel", wheel, { passive: false });
  render();

  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(render)
    : null;
  if (resizeObserver) resizeObserver.observe(root);

  root.__worldWorkshopPreviewCleanup = () => {
    renderer.domElement.removeEventListener("pointerdown", pointerDown);
    renderer.domElement.removeEventListener("pointermove", pointerMove);
    renderer.domElement.removeEventListener("pointerup", pointerUp);
    renderer.domElement.removeEventListener("pointercancel", pointerUp);
    renderer.domElement.removeEventListener("wheel", wheel);
    if (resizeObserver) resizeObserver.disconnect();
    disposeObject(scene);
    faceMaterial.dispose();
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    root.__worldWorkshopPreviewCleanup = null;
  };

  return {
    bo,
    columnWidth,
    columnDepth,
    columnHeight,
    capitalWidth,
    baseWidth,
  };
}
