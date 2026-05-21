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
import { buildElectricAoeDominantBoltControlPath } from "../../../src/game-runtime/spells/electric-aoe-dominant-bolt-planner.js?v=20260521a";

const CONTROL_POINT_REFRESH_MS = 1000 / 60;

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + (bo * 20));
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

export function createElectricAoe3dPreview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let controlPointLayer = null;
  let controlPointGeometry = null;
  let controlPointLine = null;
  let controlPointLineMaterial = null;
  let controlPointMaterial = null;
  let haloControlPointGeometry = null;
  let haloControlPointLayer = null;
  let haloControlPointLineMaterial = null;
  let haloControlPointMaterial = null;
  let controlPointLastRefreshMs = 0;
  let haloControlPointLastRefreshMs = 0;
  let createdAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    controlPointLayer = null;
    controlPointGeometry = null;
    controlPointLine = null;
    controlPointLineMaterial = null;
    controlPointMaterial = null;
    haloControlPointGeometry = null;
    haloControlPointLayer = null;
    haloControlPointLineMaterial = null;
    haloControlPointMaterial = null;
    controlPointLastRefreshMs = 0;
    haloControlPointLastRefreshMs = 0;
  }

  function controlPointsVisible() {
    return !els.electricAoe3dControlPointsVisibleBtn
      || els.electricAoe3dControlPointsVisibleBtn.getAttribute("aria-pressed") !== "false";
  }

  function haloControlPointsVisible() {
    return !els.electricAoe3dHaloControlPointsVisibleBtn
      || els.electricAoe3dHaloControlPointsVisibleBtn.getAttribute("aria-pressed") !== "false";
  }

  function readInputNumber(el, fallback, min = -Infinity, max = Infinity) {
    const numeric = Number(el && el.value);
    const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
    return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
  }

  function buildPreviewControlPath(bo, time = 0) {
    const minRangeBo = readInputNumber(els.electricAoe3dDominantBoltMinRangeBo, 2, 0, 64);
    const maxRangeBo = readInputNumber(els.electricAoe3dDominantBoltMaxRangeBo, 8, minRangeBo + 0.25, 64);
    const minStepBo = readInputNumber(els.electricAoe3dDominantBoltMinStepBo, 0.35, 0.05, 8);
    const maxStepBo = readInputNumber(els.electricAoe3dDominantBoltMaxStepBo, 0.9, minStepBo, 8);
    const rangeSpan = Math.max(0.25, maxRangeBo - minRangeBo);
    const targetRadiusBo = minRangeBo + rangeSpan * (0.5 + Math.sin(time * 0.9) * 0.28);
    const phase = Math.PI * 0.14 + time * 0.34;
    return buildElectricAoeDominantBoltControlPath({
      bo,
      config: {
        controlPointDiameterBo: 0.05,
        detourRatioMax: readInputNumber(els.electricAoe3dDominantBoltDetourRatioMax, 1.4, 1, 8),
        headingMemory: readInputNumber(els.electricAoe3dDominantBoltHeadingMemory, 0.72, 0, 1),
        maxRangeBo,
        maxStepBo,
        minRangeBo,
        minStepBo,
        pathJitterBo: readInputNumber(els.electricAoe3dDominantBoltPathJitterBo, 0.18, 0, 2),
        pointSpacingBo: 0.62,
        rangeBo: maxRangeBo,
        seekStrength: readInputNumber(els.electricAoe3dDominantBoltSeekStrength, 0.42, 0, 4),
        targetRadiusBo,
        wanderStrength: readInputNumber(els.electricAoe3dDominantBoltWanderStrength, 0.9, 0, 4),
        zBo: 0,
      },
      from: { xW: 0, yW: 0 },
      phase,
    });
  }

  function clearLayerChildren(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      if (child.geometry && child.geometry !== haloControlPointGeometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
      if (child.material && child.material !== haloControlPointLineMaterial && child.material !== haloControlPointMaterial && typeof child.material.dispose === "function") {
        child.material.dispose();
      }
    }
  }

  function buildHaloBoltPaths(bo, time = 0) {
    const startRadiusBo = 0.5;
    const minRangeBo = readInputNumber(els.electricAoe3dHaloBoltMinRangeBo, 0.55, 0, 16);
    const maxRangeBo = readInputNumber(els.electricAoe3dHaloBoltMaxRangeBo, 1.65, Math.max(0.05, minRangeBo), 16);
    const minTotal = Math.round(readInputNumber(els.electricAoe3dHaloBoltMinTotal, 4, 0, 64));
    const maxTotal = Math.round(readInputNumber(els.electricAoe3dHaloBoltMaxTotal, 10, minTotal, 64));
    const minWalkSpeed = readInputNumber(els.electricAoe3dHaloBoltMinWalkSpeed, 0.35, 0, 12);
    const maxWalkSpeed = readInputNumber(els.electricAoe3dHaloBoltMaxWalkSpeed, 1.2, minWalkSpeed, 12);
    const minStepBo = readInputNumber(els.electricAoe3dHaloBoltMinStepBo, 0.08, 0.01, 4);
    const maxStepBo = readInputNumber(els.electricAoe3dHaloBoltMaxStepBo, 0.28, minStepBo, 4);
    const pathJitterBo = readInputNumber(els.electricAoe3dHaloBoltPathJitterBo, 0.16, 0, 2);
    const forksMin = Math.round(readInputNumber(els.electricAoe3dHaloBoltForksMin, 0, 0, 12));
    const forksMax = Math.round(readInputNumber(els.electricAoe3dHaloBoltForksMax, 2, forksMin, 12));
    const forkLengthMinBo = readInputNumber(els.electricAoe3dHaloBoltForkLengthMinBo, 0.2, 0, 8);
    const forkLengthMaxBo = readInputNumber(els.electricAoe3dHaloBoltForkLengthMaxBo, 0.7, forkLengthMinBo, 8);
    const total = Math.max(0, Math.round((minTotal + maxTotal) * 0.5));
    const paths = [];
    for (let boltIndex = 0; boltIndex < total; boltIndex += 1) {
      const seed = boltIndex + 1;
      const unit = total <= 0 ? 0 : boltIndex / Math.max(1, total);
      const speed = minWalkSpeed + (maxWalkSpeed - minWalkSpeed) * (0.5 + 0.5 * Math.sin(seed * 2.17));
      const walkDirectionSeed = Math.sin(seed * 12.9898) * 43758.5453123;
      const walkDirection = (walkDirectionSeed - Math.floor(walkDirectionSeed)) >= 0.5 ? 1 : -1;
      const angle = unit * Math.PI * 2 + time * speed * walkDirection + Math.sin(time * 0.7 + seed) * 0.08;
      const rangeBo = minRangeBo + (maxRangeBo - minRangeBo) * (0.5 + 0.5 * Math.sin(seed * 1.91 + time * 0.45));
      const stepBo = minStepBo + (maxStepBo - minStepBo) * (0.5 + 0.5 * Math.sin(seed * 2.71));
      const segmentCount = Math.max(2, Math.ceil(Math.max(0.01, rangeBo) / Math.max(0.01, stepBo)));
      const radial = { x: Math.cos(angle), y: Math.sin(angle) };
      const tangent = { x: -radial.y, y: radial.x };
      const points = [];
      for (let pointIndex = 0; pointIndex <= segmentCount; pointIndex += 1) {
        const t = pointIndex / segmentCount;
        const jitter = Math.sin(seed * 12.989 + pointIndex * 4.141 + time * 7.2) * pathJitterBo * Math.sin(t * Math.PI);
        const radiusBo = startRadiusBo + rangeBo * t;
        points.push(Object.freeze({
          xW: (radial.x * radiusBo + tangent.x * jitter) * bo,
          yW: (radial.y * radiusBo + tangent.y * jitter) * bo,
          zBo: 0,
        }));
      }
      const forkCount = Math.max(0, Math.round(forksMin + (forksMax - forksMin) * (0.5 + 0.5 * Math.sin(seed * 1.37 + time * 0.8))));
      const forks = [];
      for (let forkIndex = 0; forkIndex < forkCount; forkIndex += 1) {
        const basePointIndex = Math.min(points.length - 2, Math.max(1, 1 + ((forkIndex * 2 + seed) % Math.max(1, points.length - 2))));
        const base = points[basePointIndex];
        const side = (forkIndex + seed) % 2 === 0 ? 1 : -1;
        const forkLengthBo = forkLengthMinBo + (forkLengthMaxBo - forkLengthMinBo) * (0.5 + 0.5 * Math.sin(seed * 3.31 + forkIndex));
        forks.push(Object.freeze([
          base,
          Object.freeze({
            xW: base.xW + (tangent.x * side + radial.x * 0.25) * forkLengthBo * bo,
            yW: base.yW + (tangent.y * side + radial.y * 0.25) * forkLengthBo * bo,
            zBo: 0,
          }),
        ]));
      }
      paths.push(Object.freeze({ forks: Object.freeze(forks), points: Object.freeze(points) }));
    }
    return Object.freeze(paths);
  }

  function syncHaloControlPointLayer(bo, time = 0, force = false) {
    if (!haloControlPointLayer) return;
    const nowMs = performance.now();
    if (!force && nowMs - haloControlPointLastRefreshMs < CONTROL_POINT_REFRESH_MS) return;
    haloControlPointLastRefreshMs = nowMs;
    clearLayerChildren(haloControlPointLayer);
    if (!haloControlPointLayer.visible) return;
    const paths = buildHaloBoltPaths(bo, time);
    if (!haloControlPointLineMaterial) {
      haloControlPointLineMaterial = new THREE.LineBasicMaterial({
        color: 0xd8f7ff,
        transparent: true,
        opacity: 0.56,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    if (!haloControlPointMaterial) {
      haloControlPointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    if (!haloControlPointGeometry) haloControlPointGeometry = new THREE.SphereGeometry(bo * 0.05 * 0.5, 14, 8);
    paths.forEach((path, pathIndex) => {
      const linePoints = path.points.map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), haloControlPointLineMaterial);
      line.name = `electric_aoe3d:halo_control_line_${pathIndex}`;
      line.renderOrder = 214;
      haloControlPointLayer.add(line);
      path.forks.forEach((fork, forkIndex) => {
        const forkLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(fork.map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo))),
          haloControlPointLineMaterial
        );
        forkLine.name = `electric_aoe3d:halo_control_fork_${pathIndex}_${forkIndex}`;
        forkLine.renderOrder = 215;
        haloControlPointLayer.add(forkLine);
      });
      path.points.forEach((point, pointIndex) => {
        const marker = new THREE.Mesh(haloControlPointGeometry, haloControlPointMaterial);
        marker.name = `electric_aoe3d:halo_control_point_${pathIndex}_${pointIndex}`;
        marker.renderOrder = 216;
        marker.position.set(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo);
        haloControlPointLayer.add(marker);
      });
    });
  }

  function syncControlPointLayer(bo, time = 0, force = false) {
    if (!controlPointLayer) return;
    const nowMs = performance.now();
    if (!force && nowMs - controlPointLastRefreshMs < CONTROL_POINT_REFRESH_MS) return;
    controlPointLastRefreshMs = nowMs;
    const path = buildPreviewControlPath(bo, time);
    const points = Array.isArray(path && path.points) ? path.points : [];
    const linePoints = points.map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
    if (!controlPointLineMaterial) {
      controlPointLineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    if (!controlPointLine) {
      controlPointLine = new THREE.Line(new THREE.BufferGeometry(), controlPointLineMaterial);
      controlPointLine.name = "electric_aoe3d:dominant_control_line";
      controlPointLine.renderOrder = 219;
      controlPointLayer.add(controlPointLine);
    }
    controlPointLine.geometry.dispose();
    controlPointLine.geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    controlPointLine.visible = linePoints.length > 1;
    if (!controlPointGeometry) controlPointGeometry = new THREE.SphereGeometry(bo * 0.05 * 0.5, 18, 10);
    if (!controlPointMaterial) {
      controlPointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    points.forEach((point, index) => {
      let marker = controlPointLayer.children[index + 1];
      if (!marker) {
        marker = new THREE.Mesh(controlPointGeometry, controlPointMaterial);
        marker.name = `electric_aoe3d:dominant_control_point_${index}`;
        marker.renderOrder = 220;
        controlPointLayer.add(marker);
      }
      marker.visible = true;
      marker.position.set(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo);
    });
    for (let index = points.length + 1; index < controlPointLayer.children.length; index += 1) {
      controlPointLayer.children[index].visible = false;
    }
  }

  function createControlPointLayer(bo) {
    const layer = new THREE.Group();
    layer.name = "electric_aoe3d:dominant_bolt_control_points";
    layer.visible = controlPointsVisible();
    controlPointLayer = layer;
    syncControlPointLayer(bo, 0, true);
    return layer;
  }

  function createHaloControlPointLayer(bo) {
    const layer = new THREE.Group();
    layer.name = "electric_aoe3d:halo_bolt_control_points";
    layer.visible = haloControlPointsVisible();
    haloControlPointLayer = layer;
    syncHaloControlPointLayer(bo, 0, true);
    return layer;
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
      canvasClassName: "flameAoe3dCanvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      enableShadows: true,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
          shellMaterial.uniforms.uTime.value = time;
        }
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
        syncControlPointLayer(bo, time);
        syncHaloControlPointLayer(bo, time);
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
    model.position.set(0, 0, 0);
    if (els.electricAoe3dOrbVisibleBtn) {
      model.visible = els.electricAoe3dOrbVisibleBtn.getAttribute("aria-pressed") !== "false";
    }
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    controlPointLayer = createControlPointLayer(bo);
    haloControlPointLayer = createHaloControlPointLayer(bo);
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.scene.add(controlPointLayer);
    inspector.scene.add(haloControlPointLayer);
    inspector.render();
    return activeConfig;
  }

  function toggleOrb() {
    if (!els.electricAoe3dOrbVisibleBtn) return;
    const visible = els.electricAoe3dOrbVisibleBtn.getAttribute("aria-pressed") !== "false";
    els.electricAoe3dOrbVisibleBtn.setAttribute("aria-pressed", visible ? "false" : "true");
    if (model) model.visible = !visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleControlPoints() {
    if (!els.electricAoe3dControlPointsVisibleBtn) return;
    const visible = els.electricAoe3dControlPointsVisibleBtn.getAttribute("aria-pressed") !== "false";
    els.electricAoe3dControlPointsVisibleBtn.setAttribute("aria-pressed", visible ? "false" : "true");
    if (controlPointLayer) controlPointLayer.visible = !visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleHaloControlPoints() {
    if (!els.electricAoe3dHaloControlPointsVisibleBtn) return;
    const visible = els.electricAoe3dHaloControlPointsVisibleBtn.getAttribute("aria-pressed") !== "false";
    els.electricAoe3dHaloControlPointsVisibleBtn.setAttribute("aria-pressed", visible ? "false" : "true");
    if (haloControlPointLayer) {
      haloControlPointLayer.visible = !visible;
      if (!visible) syncHaloControlPointLayer(readBo(), (performance.now() - createdAt) / 1000, true);
    }
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function wire() {
    apply();
    const refreshOnCommit = (event) => {
      if (event && event.type === "keydown" && event.key !== "Enter") return;
      apply();
    };
    if (els.previewElectricAoe3d) els.previewElectricAoe3d.addEventListener("click", apply);
    if (els.electricAoe3dOrbVisibleBtn) els.electricAoe3dOrbVisibleBtn.addEventListener("click", toggleOrb);
    if (els.electricAoe3dControlPointsVisibleBtn) els.electricAoe3dControlPointsVisibleBtn.addEventListener("click", toggleControlPoints);
    if (els.electricAoe3dHaloControlPointsVisibleBtn) els.electricAoe3dHaloControlPointsVisibleBtn.addEventListener("click", toggleHaloControlPoints);
    [
      els.electricAoe3dDominantBoltMinRangeBo,
      els.electricAoe3dDominantBoltMaxRangeBo,
      els.electricAoe3dDominantBoltDetourRatioMax,
      els.electricAoe3dDominantBoltMinStepBo,
      els.electricAoe3dDominantBoltMaxStepBo,
      els.electricAoe3dDominantBoltSeekStrength,
      els.electricAoe3dDominantBoltHeadingMemory,
      els.electricAoe3dDominantBoltWanderStrength,
      els.electricAoe3dDominantBoltPathJitterBo,
      els.electricAoe3dHaloBoltMinRangeBo,
      els.electricAoe3dHaloBoltMaxRangeBo,
      els.electricAoe3dHaloBoltMinTotal,
      els.electricAoe3dHaloBoltMaxTotal,
      els.electricAoe3dHaloBoltMinWalkSpeed,
      els.electricAoe3dHaloBoltMaxWalkSpeed,
      els.electricAoe3dHaloBoltMinStepBo,
      els.electricAoe3dHaloBoltMaxStepBo,
      els.electricAoe3dHaloBoltPathJitterBo,
      els.electricAoe3dHaloBoltForksMin,
      els.electricAoe3dHaloBoltForksMax,
      els.electricAoe3dHaloBoltForkLengthMinBo,
      els.electricAoe3dHaloBoltForkLengthMaxBo,
    ].forEach((input) => {
      if (!input) return;
      input.addEventListener("blur", refreshOnCommit);
      input.addEventListener("change", refreshOnCommit);
      input.addEventListener("keydown", refreshOnCommit);
    });
  }

  return Object.freeze({
    apply,
    clear: destroyInspector,
    play: apply,
    wire,
  });
}
