import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

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

function addEdges(mesh, { color = EDGE_COLOR } = {}) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 16);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color,
      linewidth: 1,
    })
  );
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
}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  addEdges(mesh);
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
}) {
  const radiusX = width * 0.5;
  const radiusZ = depth * 0.5;
  const geometry = new THREE.CylinderGeometry(1, 1, height, 9, 1, false, Math.PI * -0.5);
  geometry.scale(radiusX, 1, radiusZ);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  addEdges(mesh);
  return mesh;
}

function resizeRenderer({ renderer, camera, root }) {
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
  const columnHeight = bo * 2;
  const capitalWidth = bo * 1.35;
  const capitalDepth = bo * 0.82;
  const baseWidth = bo * 1.35;
  const baseDepth = bo * 1.35;
  const baseLowerHeight = bo * 0.18;
  const baseUpperHeight = bo * 0.14;
  const capCenterHeight = bo * 0.34;
  const capBandHeight = bo * 0.13;
  const capSlabHeight = bo * 0.12;
  const plinthHeight = baseLowerHeight + baseUpperHeight + columnHeight + capCenterHeight + capBandHeight + capSlabHeight;
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

  const model = new THREE.Group();
  model.position.y = -columnCenterY;
  scene.add(model);

  let y = 0;
  addBox(model, {
    width: baseWidth,
    height: baseLowerHeight,
    depth: baseDepth,
    y: y + baseLowerHeight * 0.5,
    material: faceMaterial,
  });
  y += baseLowerHeight;
  addBox(model, {
    width: baseWidth * 0.86,
    height: baseUpperHeight,
    depth: baseDepth * 0.86,
    y: y + baseUpperHeight * 0.5,
    material: faceMaterial,
  });
  y += baseUpperHeight;
  addNonagonColumn(model, {
    width: columnWidth,
    height: columnHeight,
    depth: columnDepth,
    y: y + columnHeight * 0.5,
    material: faceMaterial,
  });
  y += columnHeight;
  addBox(model, {
    width: capitalWidth * 0.86,
    height: capCenterHeight,
    depth: capitalDepth * 0.72,
    y: y + capCenterHeight * 0.5,
    material: faceMaterial,
  });

  y += capCenterHeight;
  addBox(model, {
    width: capitalWidth,
    height: capBandHeight,
    depth: capitalDepth,
    y: y + capBandHeight * 0.5,
    material: faceMaterial,
  });
  y += capBandHeight;
  addBox(model, {
    width: capitalWidth,
    height: capSlabHeight,
    depth: capitalDepth,
    y: y + capSlabHeight * 0.5,
    material: faceMaterial,
  });

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

  let animationFrame = 0;
  const startedAt = performance.now();
  const render = () => {
    resizeRenderer({ renderer, camera, root });
    renderer.render(scene, camera);
  };
  const tick = () => {
    const elapsed = (performance.now() - startedAt) * 0.001;
    model.rotation.y = Math.sin(elapsed * 0.7) * 0.28;
    render();
    animationFrame = requestAnimationFrame(tick);
  };
  tick();

  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(render)
    : null;
  if (resizeObserver) resizeObserver.observe(root);

  root.__worldWorkshopPreviewCleanup = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
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
