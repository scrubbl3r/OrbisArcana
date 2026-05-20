import * as THREE from "three";
import {
  FIRE_CARD_PROFILE_SMALL_TEARDROP,
  resolveFireCardProfile,
} from "./fire-card-profiles.js?v=20260519b";

const OFFSCREEN_POSITION = new THREE.Vector3(0, 0, -100000);
const ZERO_SCALE = new THREE.Vector3(0, 0, 0);

function smoothMaxNumber(a, b, radius) {
  const k = Math.max(0.0001, Number(radius) || 0);
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return (a * (1 - h)) + (b * h) + (k * h * (1 - h));
}

function circleRadiusAtY(y, centerY, radius) {
  const dy = y - centerY;
  const disc = (radius * radius) - (dy * dy);
  return disc > 0 ? Math.sqrt(disc) : 0;
}

function createUnitTeardropGeometry({
  rows = 18,
  lowerCenterY = 0,
  lowerRadius = 0.5,
  upperCenterY = 0.56,
  upperRadius = 0.22,
  blendSoftness = 0.14,
  padding = 0.02,
} = {}) {
  const rowCount = Math.max(4, Math.round(rows));
  const minY = lowerCenterY - lowerRadius - padding;
  const maxY = upperCenterY + upperRadius + padding;
  const height = Math.max(0.0001, maxY - minY);
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= rowCount; i += 1) {
    const v = i / rowCount;
    const y = minY + height * v;
    const lower = circleRadiusAtY(y, lowerCenterY, lowerRadius);
    const upper = circleRadiusAtY(y, upperCenterY, upperRadius);
    const bridgeT = Math.max(0, Math.min(1, (y - lowerCenterY) / Math.max(0.0001, upperCenterY - lowerCenterY)));
    const bridge = y > lowerCenterY && y < upperCenterY
      ? (lowerRadius * (1 - bridgeT)) + (upperRadius * bridgeT)
      : 0;
    const envelope = smoothMaxNumber(smoothMaxNumber(lower, upper, blendSoftness), bridge, blendSoftness * 0.75);
    const r = Math.max(0.0001, envelope);
    positions.push(-r, y, 0, r, y, 0);
    uvs.push(0, v, 1, v);
  }
  for (let i = 0; i < rowCount; i += 1) {
    const a = i * 2;
    const b = a + 2;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData.fireCardShape = Object.freeze({
    rows: rowCount,
    lowerCenterY,
    lowerRadius,
    upperCenterY,
    upperRadius,
    blendSoftness,
    minY,
    maxY,
  });
  return geometry;
}

export function createFireCardSystem({
  root = null,
  maxCards = 128,
  profileId = FIRE_CARD_PROFILE_SMALL_TEARDROP,
} = {}) {
  const parent = root || new THREE.Group();
  const profile = resolveFireCardProfile(profileId);
  const geometry = createUnitTeardropGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: false,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, Math.floor(maxCards)));
  mesh.name = "vfx:fire-cards";
  mesh.frustumCulled = false;
  mesh.renderOrder = 1200;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(mesh);

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const sampleLocalPosition = new THREE.Vector3();
  const sampleWorldPosition = new THREE.Vector3();
  const sampleClipPosition = new THREE.Vector3();
  let writeIndex = 0;
  let lastSample = null;

  function hideInstance(index = 0) {
    quat.identity();
    matrix.compose(OFFSCREEN_POSITION, quat, ZERO_SCALE);
    mesh.setMatrixAt(index, matrix);
  }

  function beginFrame() {
    writeIndex = 0;
    lastSample = null;
  }

  function addTeardrop({
    x = 0,
    y = 0,
    z = 0,
    scalePx = 12,
    widthPx = null,
    heightPx = null,
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
      quat.identity();
      scale.set(width, height, 1);
      matrix.compose(position, quat, scale);
      mesh.setMatrixAt(writeIndex, matrix);
      if (!lastSample) {
        sampleLocalPosition.copy(position);
        lastSample = {
          x: Math.round(position.x * 10) / 10,
          y: Math.round(position.y * 10) / 10,
          z: Math.round(position.z * 10) / 10,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
          color: "#ffffff",
        };
      }
      writeIndex += 1;
    }
  }

  function endFrame() {
    for (let i = writeIndex; i < mesh.count; i += 1) hideInstance(i);
    mesh.instanceMatrix.needsUpdate = true;
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
          shape: "two-circle-envelope",
          renderOrder: mesh.renderOrder,
          frustumCulled: !!mesh.frustumCulled,
          materialTransparent: !!(mesh.material && mesh.material.transparent),
          materialDepthTest: !!(mesh.material && mesh.material.depthTest),
          materialDepthWrite: !!(mesh.material && mesh.material.depthWrite),
          materialBlending: mesh.material ? mesh.material.blending : null,
          materialToneMapped: !!(mesh.material && mesh.material.toneMapped),
          materialColor: mesh.material && mesh.material.color ? `#${mesh.material.color.getHexString()}` : "",
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
