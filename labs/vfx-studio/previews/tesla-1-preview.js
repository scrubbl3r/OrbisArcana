import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260517a";

const ORB_RADIUS_BO = 0.5;

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + bo * 20);
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function readInputNumber(el, fallback, min = -Infinity, max = Infinity) {
  return clampNumber(el && el.value, min, max, fallback);
}

function readInputBoolean(el, fallback = true) {
  if (!el) return !!fallback;
  return !!el.checked;
}

function random01(seed) {
  const x = Math.sin((Number(seed) || 0) * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function rgbColor(r = 255, g = 255, b = 255) {
  return new THREE.Color(
    clampNumber(r, 0, 255, 255) / 255,
    clampNumber(g, 0, 255, 255) / 255,
    clampNumber(b, 0, 255, 255) / 255
  );
}

function spherePoint(radius, theta, phi, zScale = 1) {
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    Math.cos(theta) * sinPhi * radius,
    Math.sin(theta) * sinPhi * radius,
    Math.cos(phi) * radius * zScale
  );
}

function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
    if (child.material && typeof child.material.dispose === "function") {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose && material.dispose());
      else child.material.dispose();
    }
  });
}

function midpointTree({ from, to, bo, subdivisions, displacementBo, decay, smoothing, seed, time }) {
  let points = [from.clone(), to.clone()];
  let amplitude = Math.max(0, Number(displacementBo) || 0) * bo;
  const safeDecay = clampNumber(decay, 0, 1, 0.58);
  for (let depth = 0; depth < subdivisions; depth += 1) {
    const next = [points[0]];
    for (let index = 0; index < points.length - 1; index += 1) {
      const a = points[index];
      const b = points[index + 1];
      const mid = a.clone().lerp(b, 0.5);
      const tangent = b.clone().sub(a).normalize();
      let normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
      if (normal.lengthSq() < 0.000001) normal = new THREE.Vector3(1, 0, 0);
      normal.normalize();
      const zAxis = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
      const roll = random01(seed + depth * 83 + index * 31 + Math.floor(time * 60) * 0.13) * 2 - 1;
      const zRoll = random01(seed + depth * 97 + index * 43 + Math.floor(time * 60) * 0.17) * 2 - 1;
      mid.add(normal.multiplyScalar(roll * amplitude));
      if (zAxis.lengthSq() > 0.000001) mid.add(zAxis.multiplyScalar(zRoll * amplitude * 0.35));
      next.push(mid, b);
    }
    points = next;
    amplitude *= safeDecay;
  }
  const smooth = clampNumber(smoothing, 0, 1, 0.22);
  if (smooth > 0 && points.length > 3) {
    const smoothed = [points[0]];
    for (let index = 1; index < points.length - 1; index += 1) {
      smoothed.push(points[index].clone().lerp(points[index - 1].clone().add(points[index + 1]).multiplyScalar(0.5), smooth * 0.5));
    }
    smoothed.push(points[points.length - 1]);
    points = smoothed;
  }
  return points;
}

function createTaperedTubeGeometry(points, baseRadius, radialSegments = 6, taper = 1) {
  const sourcePoints = Array.isArray(points) ? points.filter(Boolean) : [];
  if (sourcePoints.length <= 1) return new THREE.BufferGeometry().setFromPoints(sourcePoints);
  const curve = new THREE.CatmullRomCurve3(sourcePoints, false, "catmullrom", 0.5);
  const tubularSegments = Math.max(2, Math.min(96, Math.round(sourcePoints.length * 3)));
  const rings = tubularSegments + 1;
  const sides = Math.max(3, Math.round(radialSegments));
  const positions = [];
  const indices = [];
  const pathTs = [];
  const taperAmount = clampNumber(taper, 0, 4, 1) / 4;
  const worldUp = new THREE.Vector3(0, 0, 1);
  let previousNormal = null;
  for (let ringIndex = 0; ringIndex < rings; ringIndex += 1) {
    const t = ringIndex / Math.max(1, tubularSegments);
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    let normal = previousNormal
      ? previousNormal.clone().sub(tangent.clone().multiplyScalar(previousNormal.dot(tangent)))
      : worldUp.clone().cross(tangent);
    if (normal.lengthSq() < 0.000001) normal = new THREE.Vector3(1, 0, 0).cross(tangent);
    normal.normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    previousNormal = normal.clone();
    const radius = Math.max(0.001, baseRadius * Math.max(0.08, 1 - 0.92 * taperAmount * (t * t * (3 - 2 * t))));
    for (let sideIndex = 0; sideIndex < sides; sideIndex += 1) {
      const angle = sideIndex / sides * Math.PI * 2;
      const offset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius));
      positions.push(center.x + offset.x, center.y + offset.y, center.z + offset.z);
      pathTs.push(t);
    }
  }
  for (let ringIndex = 0; ringIndex < tubularSegments; ringIndex += 1) {
    for (let sideIndex = 0; sideIndex < sides; sideIndex += 1) {
      const a = ringIndex * sides + sideIndex;
      const b = ringIndex * sides + ((sideIndex + 1) % sides);
      const c = (ringIndex + 1) * sides + ((sideIndex + 1) % sides);
      const d = (ringIndex + 1) * sides + sideIndex;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aPathT", new THREE.Float32BufferAttribute(pathTs, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBoltMaterial({ color, opacity, tipOpacity }) {
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: clampNumber(opacity, 0, 1, 0.5) },
      uTipOpacity: { value: clampNumber(tipOpacity, 0, 1, 0.05) },
    },
    vertexShader: `
      attribute float aPathT;
      varying float vPathT;
      void main() {
        vPathT = aPathT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTipOpacity;
      varying float vPathT;
      void main() {
        float baseFade = mix(1.0, uTipOpacity, clamp(vPathT, 0.0, 1.0));
        float headFade = smoothstep(0.0, 0.06, vPathT);
        gl_FragColor = vec4(uColor, uOpacity * baseFade * headFade);
      }
    `,
  });
}

function addBoltMeshes(layer, points, config, bo, name, renderOrder, time, intensityScale = 1) {
  if (!layer || !Array.isArray(points) || points.length < 2) return;
  if (!readInputBoolean(config.tesla1BoltShaderEnabled, true)) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.62, depthTest: false, depthWrite: false, toneMapped: false })
    );
    line.name = `${name}:fallback_line`;
    line.renderOrder = renderOrder;
    layer.add(line);
    return;
  }
  const lengthBo = points.reduce((total, point, index) => {
    if (index <= 0) return total;
    return total + point.distanceTo(points[index - 1]) / Math.max(1, bo);
  }, 0);
  const lengthMix = clampNumber(lengthBo / 2.5, 0, 1, 0.5);
  const taper = readInputNumber(config.tesla1BoltShaderLengthTaper, 0.1, 0, 4);
  const coreMin = readInputNumber(config.tesla1BoltShaderCoreWidthMinBo, 0.01, 0, 1);
  const coreMax = readInputNumber(config.tesla1BoltShaderCoreWidthMaxBo, 0.022, coreMin, 1);
  const glowMin = readInputNumber(config.tesla1BoltShaderGlowWidthMinBo, 0.04, 0, 4);
  const glowMax = readInputNumber(config.tesla1BoltShaderGlowWidthMaxBo, 0.06, glowMin, 4);
  const coreRadius = bo * (coreMin + (coreMax - coreMin) * lengthMix) * 0.5;
  const glowRadius = bo * (glowMin + (glowMax - glowMin) * lengthMix) * 0.5;
  const flickerHz = readInputNumber(config.tesla1BoltShaderFlickerSpeedHz, 3, 0, 60);
  const flickerDepth = readInputNumber(config.tesla1BoltShaderFlickerDepth, 0.35, 0, 1);
  const flicker = 1 - flickerDepth * (0.5 + 0.5 * Math.sin(time * flickerHz * Math.PI * 2 + lengthBo));
  const coreColor = rgbColor(config.tesla1BoltShaderCoreR && config.tesla1BoltShaderCoreR.value, config.tesla1BoltShaderCoreG && config.tesla1BoltShaderCoreG.value, config.tesla1BoltShaderCoreB && config.tesla1BoltShaderCoreB.value);
  const glowColor = rgbColor(config.tesla1BoltShaderGlowR && config.tesla1BoltShaderGlowR.value, config.tesla1BoltShaderGlowG && config.tesla1BoltShaderGlowG.value, config.tesla1BoltShaderGlowB && config.tesla1BoltShaderGlowB.value);
  const tipOpacity = readInputNumber(config.tesla1BoltShaderTipOpacity, 0.02, 0, 1);
  const glow = new THREE.Mesh(
    createTaperedTubeGeometry(points, glowRadius * (1 + readInputNumber(config.tesla1BoltShaderGlowSoftness, 0.8, 0, 1) * 1.8), 7, taper),
    createBoltMaterial({
      color: glowColor,
      opacity: clampNumber(0.16 * readInputNumber(config.tesla1BoltShaderGlowIntensity, 1.8, 0, 20) * flicker * intensityScale, 0, 1, 0.3),
      tipOpacity,
    })
  );
  glow.name = `${name}:glow`;
  glow.renderOrder = renderOrder;
  layer.add(glow);
  const core = new THREE.Mesh(
    createTaperedTubeGeometry(points, coreRadius * (1 + readInputNumber(config.tesla1BoltShaderCoreSoftness, 0.5, 0, 1)), 5, taper),
    createBoltMaterial({
      color: coreColor,
      opacity: clampNumber(0.26 * readInputNumber(config.tesla1BoltShaderCoreIntensity, 3.5, 0, 20) * flicker * intensityScale, 0, 1, 0.5),
      tipOpacity,
    })
  );
  core.name = `${name}:core`;
  core.renderOrder = renderOrder + 1;
  layer.add(core);
}

export function createTesla1Preview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let masterLayer = null;
  let haloLayer = null;
  let treeLayer = null;
  let createdAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function clearLayer(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      disposeObject(child);
    }
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    masterLayer = null;
    haloLayer = null;
    treeLayer = null;
  }

  function masterRoute(bo, time) {
    const minRange = readInputNumber(els.tesla1MasterBoltMinRangeBo, 4, 0, 64);
    const maxRange = readInputNumber(els.tesla1MasterBoltMaxRangeBo, 7, minRange + 0.25, 64);
    const angle = time * 0.28 + 0.75;
    const radius = bo * (minRange + (maxRange - minRange) * (0.5 + 0.5 * Math.sin(time * 0.41)));
    const start = new THREE.Vector3(Math.cos(angle) * bo * ORB_RADIUS_BO, Math.sin(angle) * bo * ORB_RADIUS_BO, 0);
    const end = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    const bend = readInputNumber(els.tesla1MasterBoltPathBendAllowance, 1.4, 1, 8);
    if (bend <= 1.05) return [start, end];
    const normal = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const steer = start.clone().lerp(end, 0.55).add(normal.multiplyScalar(bo * Math.min(1.25, (bend - 1) * 0.4)));
    return [start, steer, end];
  }

  function readTreeConfig() {
    const boltMin = Math.round(readInputNumber(els.tesla1LightningTreeBoltCountMin, 4, 0, 256));
    const boltMax = Math.round(readInputNumber(els.tesla1LightningTreeBoltCountMax, 12, boltMin, 256));
    return Object.freeze({
      boltCount: Math.round((boltMin + boltMax) * 0.5),
      subdivisions: Math.round(readInputNumber(els.tesla1LightningTreeSubdivisions, 5, 0, 10)),
      displacementBo: readInputNumber(els.tesla1LightningTreeDisplacementBo, 0.22, 0, 8),
      displacementDecay: readInputNumber(els.tesla1LightningTreeDisplacementDecay, 0.58, 0, 1),
      smoothing: readInputNumber(els.tesla1LightningTreeSmoothing, 0.22, 0, 1),
      noiseSpeedHz: readInputNumber(els.tesla1LightningTreeNoiseSpeedHz, 18, 0, 120),
      forkChance: readInputNumber(els.tesla1LightningTreeForkChance, 0.15, 0, 1),
      forkDepth: Math.round(readInputNumber(els.tesla1LightningTreeForkDepth, 1, 0, 4)),
      branchChance: readInputNumber(els.tesla1LightningTreeBranchChance, 0.18, 0, 1),
      branchLengthMinBo: readInputNumber(els.tesla1LightningTreeBranchLengthMinBo, 0.08, 0, 8),
      branchLengthMaxBo: readInputNumber(els.tesla1LightningTreeBranchLengthMaxBo, 0.32, 0, 8),
    });
  }

  function syncMasterLayer(bo, time) {
    if (!masterLayer) return;
    clearLayer(masterLayer);
    masterLayer.visible = !els.tesla1MasterBoltVisibleBtn || els.tesla1MasterBoltVisibleBtn.getAttribute("aria-pressed") !== "false";
    const route = masterRoute(bo, time);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route),
      new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false, toneMapped: false })
    );
    line.name = "tesla1:master_bolt_route";
    line.renderOrder = 218;
    masterLayer.add(line);
    const pointGeometry = new THREE.SphereGeometry(bo * 0.025, 12, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, depthWrite: false, toneMapped: false });
    route.forEach((point, index) => {
      const marker = new THREE.Mesh(pointGeometry, pointMaterial);
      marker.name = `tesla1:master_control_point_${index}`;
      marker.position.copy(point);
      marker.renderOrder = 219;
      masterLayer.add(marker);
    });
  }

  function syncHaloLayer(bo) {
    if (!haloLayer) return;
    clearLayer(haloLayer);
    haloLayer.visible = !els.tesla1HaloVisibleBtn || els.tesla1HaloVisibleBtn.getAttribute("aria-pressed") !== "false";
    if (!readInputBoolean(els.tesla1HaloFieldEnabled, true)) return;
    const radius = readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32) * bo;
    const zMin = readInputNumber(els.tesla1HaloFieldZMinBo, -0.3, -32, 32);
    const zMax = readInputNumber(els.tesla1HaloFieldZMaxBo, 0.3, zMin, 32);
    const zScale = Math.max(0.02, Math.max(Math.abs(zMin), Math.abs(zMax)) / Math.max(0.001, readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32)));
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 16),
      new THREE.MeshBasicMaterial({
        color: 0x376fff,
        transparent: true,
        opacity: 0.12,
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
    );
    shell.name = "tesla1:halo_envelope";
    shell.scale.z = zScale;
    shell.renderOrder = 210;
    haloLayer.add(shell);
  }

  function syncTreeLayer(bo, time) {
    if (!treeLayer) return;
    clearLayer(treeLayer);
    treeLayer.visible = !els.tesla1LightningTreeVisibleBtn || els.tesla1LightningTreeVisibleBtn.getAttribute("aria-pressed") !== "false";
    const tree = readTreeConfig();
    const startMin = readInputNumber(els.tesla1HaloFieldBoltStartMinBo, 0.5, 0, 32);
    const startMax = readInputNumber(els.tesla1HaloFieldBoltStartMaxBo, 0.65, startMin, 32);
    const endMin = readInputNumber(els.tesla1HaloFieldBoltEndMinBo, 1.1, 0.05, 32);
    const endMax = readInputNumber(els.tesla1HaloFieldBoltEndMaxBo, 1.6, endMin, 32);
    const zMin = readInputNumber(els.tesla1HaloFieldZMinBo, -0.3, -32, 32);
    const zMax = readInputNumber(els.tesla1HaloFieldZMaxBo, 0.3, zMin, 32);
    const zScale = Math.max(0.02, Math.max(Math.abs(zMin), Math.abs(zMax)) / Math.max(0.001, endMax));
    const animatedSeed = Math.floor(time * Math.max(1, tree.noiseSpeedHz));
    const count = Math.max(0, tree.boltCount);
    for (let index = 0; index < count; index += 1) {
      const baseSeed = index * 101 + animatedSeed * 17;
      const theta = Math.PI * 2 * (index / Math.max(1, count) + random01(baseSeed) * 0.08 + time * 0.018);
      const phi = Math.acos(2 * random01(baseSeed + 5) - 1);
      const startRadius = bo * (startMin + (startMax - startMin) * random01(baseSeed + 7));
      const endRadius = bo * (endMin + (endMax - endMin) * random01(baseSeed + 11));
      const start = spherePoint(startRadius, theta, phi, zScale);
      const end = spherePoint(endRadius, theta + (random01(baseSeed + 13) - 0.5) * 0.36, phi + (random01(baseSeed + 19) - 0.5) * 0.24, zScale);
      const trunk = midpointTree({
        from: start,
        to: end,
        bo,
        subdivisions: tree.subdivisions,
        displacementBo: tree.displacementBo,
        decay: tree.displacementDecay,
        smoothing: tree.smoothing,
        seed: baseSeed,
        time,
      });
      addBoltMeshes(treeLayer, trunk, els, bo, `tesla1:tree_${index}`, 214, time, 1);
      if (random01(baseSeed + 23) < tree.branchChance && trunk.length > 4) {
        const branchAt = 1 + Math.floor(random01(baseSeed + 29) * (trunk.length - 3));
        const a = trunk[branchAt - 1];
        const b = trunk[branchAt + 1];
        const dir = b.clone().sub(a).normalize();
        const normal = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
        const branchLength = bo * (tree.branchLengthMinBo + (tree.branchLengthMaxBo - tree.branchLengthMinBo) * random01(baseSeed + 31));
        const branchEnd = trunk[branchAt].clone().add(normal.multiplyScalar(branchLength * (random01(baseSeed + 37) < 0.5 ? -1 : 1)));
        const branch = midpointTree({
          from: trunk[branchAt],
          to: branchEnd,
          bo,
          subdivisions: Math.max(1, Math.min(tree.subdivisions, 3)),
          displacementBo: tree.displacementBo * 0.6,
          decay: tree.displacementDecay,
          smoothing: tree.smoothing,
          seed: baseSeed + 41,
          time,
        });
        addBoltMeshes(treeLayer, branch, els, bo, `tesla1:branch_${index}`, 215, time, 0.68);
      }
    }
    const master = masterRoute(bo, time);
    const masterTree = midpointTree({
      from: master[0],
      to: master[master.length - 1],
      bo,
      subdivisions: Math.max(2, tree.subdivisions),
      displacementBo: tree.displacementBo,
      decay: tree.displacementDecay,
      smoothing: tree.smoothing,
      seed: 999 + animatedSeed,
      time,
    });
    addBoltMeshes(treeLayer, masterTree, els, bo, "tesla1:master_tree", 216, time, 1.15);
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    const bo = readBo();
    const activeConfig = ORB_3D_VISUAL_DEFAULTS;
    createdAt = performance.now();
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "tesla1Canvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      enableShadows: true,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
        syncMasterLayer(bo, time);
        syncHaloLayer(bo);
        syncTreeLayer(bo, time);
      },
    });
    if (!inspector) return activeConfig;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);
    shellMaterial = createOpalescentOrbShellMaterial(activeConfig);
    const created = createOrbModel({
      bo,
      shellMaterial,
      edgeMaterials: inspector.edgeMaterials,
      includeCore: false,
      includeRibs: true,
      edgeColor: 0xffffff,
      edgeWidth: 2,
      shellSegments: 96,
      ringSegments: 192,
    });
    model = created.model;
    if (els.tesla1OrbVisibleBtn) model.visible = els.tesla1OrbVisibleBtn.getAttribute("aria-pressed") !== "false";
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    masterLayer = new THREE.Group();
    masterLayer.name = "tesla1:master_bolt_control_layer";
    haloLayer = new THREE.Group();
    haloLayer.name = "tesla1:halo_envelope_layer";
    treeLayer = new THREE.Group();
    treeLayer.name = "tesla1:lightning_tree_layer";
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.scene.add(haloLayer);
    inspector.scene.add(treeLayer);
    inspector.scene.add(masterLayer);
    syncMasterLayer(bo, 0);
    syncHaloLayer(bo);
    syncTreeLayer(bo, 0);
    inspector.render();
    return activeConfig;
  }

  function clear() {
    destroyInspector();
  }

  function toggleLayer(button, layer) {
    if (!button) return;
    const visible = button.getAttribute("aria-pressed") !== "false";
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    if (layer) layer.visible = !visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function wire() {
    apply();
    const refreshOnCommit = (event) => {
      if (event && event.type === "keydown" && event.key !== "Enter") return;
      apply();
    };
    if (els.previewTesla1) els.previewTesla1.addEventListener("click", apply);
    if (els.tesla1OrbVisibleBtn) els.tesla1OrbVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1OrbVisibleBtn, model));
    if (els.tesla1MasterBoltVisibleBtn) els.tesla1MasterBoltVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1MasterBoltVisibleBtn, masterLayer));
    if (els.tesla1HaloVisibleBtn) els.tesla1HaloVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1HaloVisibleBtn, haloLayer));
    if (els.tesla1LightningTreeVisibleBtn) els.tesla1LightningTreeVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1LightningTreeVisibleBtn, treeLayer));
    [
      els.tesla1MasterBoltMinRangeBo,
      els.tesla1MasterBoltMaxRangeBo,
      els.tesla1MasterBoltContactRadiusBo,
      els.tesla1MasterBoltPathBendAllowance,
      els.tesla1HaloFieldEnabled,
      els.tesla1HaloFieldShellRadiusBo,
      els.tesla1HaloFieldBoltStartMinBo,
      els.tesla1HaloFieldBoltStartMaxBo,
      els.tesla1HaloFieldBoltEndMinBo,
      els.tesla1HaloFieldBoltEndMaxBo,
      els.tesla1HaloTargetMinRangeBo,
      els.tesla1HaloTargetMaxRangeBo,
      els.tesla1HaloContactRadiusBo,
      els.tesla1HaloFieldZMinBo,
      els.tesla1HaloFieldZMaxBo,
      els.tesla1LightningTreeBoltCountMin,
      els.tesla1LightningTreeBoltCountMax,
      els.tesla1LightningTreeFrequencyMinMs,
      els.tesla1LightningTreeFrequencyMaxMs,
      els.tesla1LightningTreeTtlMinMs,
      els.tesla1LightningTreeTtlMaxMs,
      els.tesla1LightningTreeSubdivisions,
      els.tesla1LightningTreeDisplacementBo,
      els.tesla1LightningTreeDisplacementDecay,
      els.tesla1LightningTreeSmoothing,
      els.tesla1LightningTreeNoiseSpeedHz,
      els.tesla1LightningTreeForkChance,
      els.tesla1LightningTreeForkDepth,
      els.tesla1LightningTreeBranchChance,
      els.tesla1LightningTreeBranchLengthMinBo,
      els.tesla1LightningTreeBranchLengthMaxBo,
      els.tesla1BoltShaderEnabled,
      els.tesla1BoltShaderCoreWidthMinBo,
      els.tesla1BoltShaderCoreWidthMaxBo,
      els.tesla1BoltShaderGlowWidthMinBo,
      els.tesla1BoltShaderGlowWidthMaxBo,
      els.tesla1BoltShaderLengthTaper,
      els.tesla1BoltShaderTipOpacity,
      els.tesla1BoltShaderCoreIntensity,
      els.tesla1BoltShaderCoreSoftness,
      els.tesla1BoltShaderGlowIntensity,
      els.tesla1BoltShaderGlowSoftness,
      els.tesla1BoltShaderFlickerSpeedHz,
      els.tesla1BoltShaderFlickerDepth,
      els.tesla1BoltShaderCoreR,
      els.tesla1BoltShaderCoreG,
      els.tesla1BoltShaderCoreB,
      els.tesla1BoltShaderGlowR,
      els.tesla1BoltShaderGlowG,
      els.tesla1BoltShaderGlowB,
    ].forEach((field) => {
      if (!field) return;
      field.addEventListener("keydown", refreshOnCommit);
      field.addEventListener("change", refreshOnCommit);
      field.addEventListener("blur", refreshOnCommit);
    });
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
