import * as THREE from "three";
import {
  FIRE_CARD_PROFILE_SMALL_TEARDROP,
  resolveFireCardProfile,
} from "./fire-card-profiles.js?v=20260519a";

const OFFSCREEN_POSITION = new THREE.Vector3(0, 0, -100000);
const ZERO_SCALE = new THREE.Vector3(0, 0, 0);

function createUnitTeardropGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.bezierCurveTo(-0.48, 0.1, -0.34, -0.34, 0, -0.5);
  shape.bezierCurveTo(0.34, -0.34, 0.48, 0.1, 0, 0.5);
  return new THREE.ShapeGeometry(shape, 24);
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
    seed = 0,
  } = {}) {
    const cardCount = Math.max(1, Math.floor(profile.cardCount || 1));
    const width = Math.max(1, Number(widthPx) || scalePx * Math.max(0.1, Number(profile.widthScale) || 1));
    const height = Math.max(1, Number(heightPx) || scalePx * Math.max(0.1, Number(profile.heightScale) || 1));
    const baseAngle = Math.sin((Number(seed) || 0) * 12.9898) * 0.18;
    const crossAngle = Number(profile.crossAngleRad) || 0.32;
    for (let card = 0; card < cardCount; card += 1) {
      if (writeIndex >= mesh.count) return;
      const side = card % 2 === 0 ? -1 : 1;
      const angle = baseAngle + side * crossAngle;
      const offset = side * width * 0.08;
      position.set(
        x + Math.sin(angle) * offset,
        y + height * (Number(profile.yOffsetScale) || 0.34),
        z + (Number(profile.zOffset) || 0) + card * 0.2
      );
      quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
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
