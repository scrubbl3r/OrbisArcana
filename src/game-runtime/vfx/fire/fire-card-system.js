import * as THREE from "three";
import {
  FIRE_CARD_PROFILE_SMALL_TEARDROP,
  resolveFireCardProfile,
} from "./fire-card-profiles.js?v=20260520a";
import { createFireCardMaterial } from "./fire-card-material.js?v=20260520v";

const OFFSCREEN_POSITION = new THREE.Vector3(0, 0, -100000);
const ZERO_SCALE = new THREE.Vector3(0, 0, 0);

function circleRadiusAtY(y, centerY, radius) {
  const dy = y - centerY;
  const disc = (radius * radius) - (dy * dy);
  return disc > 0 ? Math.sqrt(disc) : 0;
}

function eggHalfWidthAtY(y) {
  if (y <= 0) return circleRadiusAtY(y, 0, 0.5);
  const t = Math.max(0, Math.min(1, y / 1.5625));
  const cap = Math.max(0, 1 - t * t);
  const taper = 1 - 0.16 * (t * t * (3 - 2 * t));
  return 0.5 * Math.pow(cap, 0.32) * taper;
}

function normalizeSeed(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return Math.abs(Math.sin(fallback * 12.9898) * 43758.5453) % 1;
  return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
}

function createUnitEggGeometry({
  rows = 48,
  columns = 16,
} = {}) {
  const rowCount = Math.max(4, Math.round(rows));
  const columnCount = Math.max(2, Math.round(columns));
  const minY = -0.5;
  const maxY = 1.5625;
  const height = Math.max(0.0001, maxY - minY);
  const positions = [];
  const uvs = [];
  const indices = [];

  function halfWidthAtY(y) {
    return eggHalfWidthAtY(y);
  }

  function pushVertex(x, y) {
    const v = Math.max(0, Math.min(1, (y - minY) / height));
    const halfWidth = halfWidthAtY(y);
    const localX = halfWidth > 0.000001 ? Math.max(-1, Math.min(1, x / halfWidth)) : 0;
    positions.push(x, y, 0);
    uvs.push((localX + 1) * 0.5, v);
  }

  const grid = [];
  for (let row = 0; row <= rowCount; row += 1) {
    const v = row / rowCount;
    const y = minY + height * v;
    const r = halfWidthAtY(y);
    const rowIndices = [];
    for (let column = 0; column <= columnCount; column += 1) {
      const u = column / columnCount;
      const x = r * ((u * 2) - 1);
      rowIndices.push(positions.length / 3);
      pushVertex(x, y);
    }
    grid.push(rowIndices);
  }

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const current = grid[row];
      const next = grid[row + 1];
      indices.push(
        current[column], current[column + 1], next[column],
        current[column + 1], next[column + 1], next[column]
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData.fireCardShape = Object.freeze({
    rows: rowCount,
    columns: columnCount,
    minY,
    maxY,
    anchor: "bottom-bulb-center",
  });
  return geometry;
}

export function createFireCardSystem({
  root = null,
  maxCards = 128,
  profileId = FIRE_CARD_PROFILE_SMALL_TEARDROP,
  debugSolid = false,
  billboardToCamera = true,
  endCapFeatherPx = 0,
  bottomFeatherPx = 0,
  materialOverrides = null,
} = {}) {
  const parent = root || new THREE.Group();
  const profile = resolveFireCardProfile(profileId);
  const geometry = createUnitEggGeometry();
  const material = createFireCardMaterial({
    ...profile,
    ...(materialOverrides && typeof materialOverrides === "object" ? materialOverrides : {}),
    debugSolid,
    endCapFeatherPx,
    bottomFeatherPx,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, Math.floor(maxCards)));
  const seedAttribute = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count), 1);
  const contactNormalAttribute = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count * 2), 2);
  seedAttribute.setUsage(THREE.DynamicDrawUsage);
  contactNormalAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aFireSeed", seedAttribute);
  geometry.setAttribute("aFireContactNormal", contactNormalAttribute);
  mesh.name = "vfx:fire-cards";
  mesh.frustumCulled = false;
  mesh.renderOrder = 1200;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(mesh);

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const cardQuat = new THREE.Quaternion();
  const cameraWorldQuat = new THREE.Quaternion();
  const parentWorldQuat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const sampleLocalPosition = new THREE.Vector3();
  const sampleWorldPosition = new THREE.Vector3();
  const sampleClipPosition = new THREE.Vector3();
  let writeIndex = 0;
  let lastSample = null;
  let billboardMode = "local";

  function hideInstance(index = 0) {
    quat.identity();
    matrix.compose(OFFSCREEN_POSITION, quat, ZERO_SCALE);
    mesh.setMatrixAt(index, matrix);
  }

  function beginFrame(_nowSec = 0, { camera = null } = {}) {
    writeIndex = 0;
    lastSample = null;
    if (material.uniforms && material.uniforms.uTime) {
      material.uniforms.uTime.value = Number(_nowSec) || 0;
    }
    billboardMode = "local";
    cardQuat.identity();
    if (billboardToCamera && camera && typeof camera.getWorldQuaternion === "function") {
      if (typeof parent.updateWorldMatrix === "function") parent.updateWorldMatrix(true, false);
      if (typeof camera.updateMatrixWorld === "function") camera.updateMatrixWorld();
      camera.getWorldQuaternion(cameraWorldQuat);
      parent.getWorldQuaternion(parentWorldQuat).invert();
      cardQuat.copy(parentWorldQuat).multiply(cameraWorldQuat);
      billboardMode = "camera";
    }
  }

  function addTeardrop({
    x = 0,
    y = 0,
    z = 0,
    scalePx = 12,
    widthPx = null,
    heightPx = null,
    seed = null,
    contactNormal = null,
    quaternion = null,
  } = {}) {
    const cardCount = Math.max(1, Math.floor(profile.cardCount || 1));
    const width = Math.max(1, Number(widthPx) || scalePx * Math.max(0.1, Number(profile.widthScale) || 1));
    const height = Math.max(1, Number(heightPx) || scalePx * Math.max(0.1, Number(profile.heightScale) || 1));
    for (let card = 0; card < cardCount; card += 1) {
      if (writeIndex >= mesh.count) return;
      position.set(
        x,
        y,
        z + (Number(profile.zOffset) || 0) + card * 0.2
      );
      scale.set(width, height, 1);
      matrix.compose(position, quaternion || cardQuat, scale);
      mesh.setMatrixAt(writeIndex, matrix);
      const resolvedSeed = normalizeSeed(seed, (x * 0.013) + (y * 0.017) + card);
      const normalX = Number(contactNormal && contactNormal.x);
      const normalY = Number(contactNormal && contactNormal.y);
      const normalLength = Math.hypot(normalX, normalY);
      seedAttribute.setX(writeIndex, resolvedSeed);
      contactNormalAttribute.setXY(
        writeIndex,
        normalLength > 0.000001 ? normalX / normalLength : 0,
        normalLength > 0.000001 ? normalY / normalLength : 1
      );
      if (!lastSample) {
        sampleLocalPosition.copy(position);
        lastSample = {
          x: Math.round(position.x * 10) / 10,
          y: Math.round(position.y * 10) / 10,
          z: Math.round(position.z * 10) / 10,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
          color: "#ffffff",
          seed: Math.round(resolvedSeed * 1000) / 1000,
        };
      }
      writeIndex += 1;
    }
  }

  function endFrame() {
    for (let i = writeIndex; i < mesh.count; i += 1) hideInstance(i);
    mesh.instanceMatrix.needsUpdate = true;
    seedAttribute.needsUpdate = true;
    contactNormalAttribute.needsUpdate = true;
    mesh.visible = writeIndex > 0;
  }

  function dispose() {
    parent.remove(mesh);
    geometry.dispose();
    material.dispose();
  }

  for (let i = 0; i < mesh.count; i += 1) hideInstance(i);
  mesh.visible = false;

  return Object.freeze({
    beginFrame,
    addTeardrop,
    endFrame,
    dispose,
    getTrace(camera = null) {
      return Object.freeze({
        activeCount: writeIndex,
        visible: !!mesh.visible,
        mesh: {
          name: mesh.name,
          parentName: mesh.parent && mesh.parent.name ? mesh.parent.name : "",
          shape: "egg-bottom-anchor-cap-strip",
          billboardMode,
          renderOrder: mesh.renderOrder,
          frustumCulled: !!mesh.frustumCulled,
          materialTransparent: !!(mesh.material && mesh.material.transparent),
          materialDepthTest: !!(mesh.material && mesh.material.depthTest),
          materialDepthWrite: !!(mesh.material && mesh.material.depthWrite),
          materialBlending: mesh.material ? mesh.material.blending : null,
          materialToneMapped: !!(mesh.material && mesh.material.toneMapped),
          materialName: mesh.material && mesh.material.name ? mesh.material.name : "",
          materialColor: mesh.material && mesh.material.color ? `#${mesh.material.color.getHexString()}` : "",
          debugSolid: !!debugSolid,
          endCapFeatherPx,
          bottomFeatherPx,
          matrixWorldNeedsUpdate: !!mesh.matrixWorldNeedsUpdate,
        },
        sample: lastSample,
        sampleCamera: camera && lastSample ? (() => {
          mesh.updateWorldMatrix(true, false);
          if (typeof camera.updateMatrixWorld === "function") camera.updateMatrixWorld();
          sampleWorldPosition.copy(sampleLocalPosition);
          mesh.localToWorld(sampleWorldPosition);
          sampleClipPosition.copy(sampleWorldPosition).project(camera);
          return {
            world: {
              x: Math.round(sampleWorldPosition.x * 10) / 10,
              y: Math.round(sampleWorldPosition.y * 10) / 10,
              z: Math.round(sampleWorldPosition.z * 10) / 10,
            },
            clip: {
              x: Math.round(sampleClipPosition.x * 1000) / 1000,
              y: Math.round(sampleClipPosition.y * 1000) / 1000,
              z: Math.round(sampleClipPosition.z * 1000) / 1000,
            },
            inClip: sampleClipPosition.x >= -1 && sampleClipPosition.x <= 1
              && sampleClipPosition.y >= -1 && sampleClipPosition.y <= 1
              && sampleClipPosition.z >= -1 && sampleClipPosition.z <= 1,
          };
        })() : null,
      });
    },
    get activeCount() {
      return writeIndex;
    },
  });
}
