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
import { createElectricAoeHaloFieldPlanner } from "../../../src/game-runtime/spells/electric-aoe-halo-bolt-planner.js?v=20260522c";

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
  let haloShellMaterial = null;
  let haloFieldPlanner = null;
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
    haloShellMaterial = null;
    if (haloFieldPlanner && typeof haloFieldPlanner.reset === "function") haloFieldPlanner.reset();
    haloFieldPlanner = null;
    controlPointLastRefreshMs = 0;
    haloControlPointLastRefreshMs = 0;
  }

  function controlPointsVisible() {
    return !els.electricAoe3dControlPointsVisibleBtn
      || els.electricAoe3dControlPointsVisibleBtn.getAttribute("aria-pressed") !== "false";
  }

  function haloControlPointsVisible() {
    return !els.electricAoe3dHaloFieldVisibleBtn
      || els.electricAoe3dHaloFieldVisibleBtn.getAttribute("aria-pressed") !== "false";
  }

  function readInputNumber(el, fallback, min = -Infinity, max = Infinity) {
    const numeric = Number(el && el.value);
    const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
    return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
  }

  function readInputBoolean(el, fallback = true) {
    if (!el) return !!fallback;
    return !!el.checked;
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
      if (child.material
        && child.material !== haloControlPointLineMaterial
        && child.material !== haloControlPointMaterial
        && child.material !== haloShellMaterial
        && typeof child.material.dispose === "function") {
        child.material.dispose();
      }
    }
  }

  function readHaloFieldConfig() {
    return Object.freeze({
      dominantBoltZBo: 0,
      haloBoltShapeMinStepBo: readInputNumber(els.electricAoe3dHaloBoltShapeMinStepBo, 0.05, 0.01, 8),
      haloBoltShapeMaxStepBo: readInputNumber(els.electricAoe3dHaloBoltShapeMaxStepBo, 0.28, 0.01, 8),
      haloBoltShapeSeekStrength: readInputNumber(els.electricAoe3dHaloBoltShapeSeekStrength, 0.42, 0, 4),
      haloBoltShapeHeadingMemory: readInputNumber(els.electricAoe3dHaloBoltShapeHeadingMemory, 0.72, 0, 1),
      haloBoltShapeWanderStrength: readInputNumber(els.electricAoe3dHaloBoltShapeWanderStrength, 0.9, 0, 4),
      haloBoltShapePathJitterBo: readInputNumber(els.electricAoe3dHaloBoltShapePathJitterBo, 0.18, 0, 4),
      haloBoltShapeSpeedHz: readInputNumber(els.electricAoe3dHaloBoltShapeSpeedHz, 18, 0, 120),
      haloBoltShapeSmoothing: readInputNumber(els.electricAoe3dHaloBoltShapeSmoothing, 0.18, 0, 1),
      haloBoltForkChance: readInputNumber(els.electricAoe3dHaloBoltForkChance, 0, 0, 1),
      haloBoltForkStartPct: readInputNumber(els.electricAoe3dHaloBoltForkStartPct, 0.33, 0, 1),
      haloBoltForkEndPct: readInputNumber(els.electricAoe3dHaloBoltForkEndPct, 0.75, 0, 1),
      haloBoltForkSpreadBo: readInputNumber(els.electricAoe3dHaloBoltForkSpreadBo, 0.34, 0, 8),
      haloBoltForkTargetOffsetBo: readInputNumber(els.electricAoe3dHaloBoltForkTargetOffsetBo, 0.18, 0, 8),
      haloFieldLingerMinMs: Math.round(readInputNumber(els.electricAoe3dHaloFieldLingerMinMs, 900, 50, 20000)),
      haloFieldLingerMaxMs: Math.round(readInputNumber(els.electricAoe3dHaloFieldLingerMaxMs, 2600, 50, 20000)),
      haloFieldLingerDrift: readInputNumber(els.electricAoe3dHaloFieldLingerDrift, 0, 0, 1),
      haloFieldEnabled: readInputBoolean(els.electricAoe3dHaloFieldEnabled, true),
      haloFieldPointCount: Math.round(readInputNumber(els.electricAoe3dHaloFieldPointCount, 24, 0, 256)),
      haloFieldPointDiameterBo: 0.05,
      haloFieldReversalChance: readInputNumber(els.electricAoe3dHaloFieldReversalChance, 0.35, 0, 1),
      haloFieldSeed: Math.round(readInputNumber(els.electricAoe3dHaloFieldSeed, 4242, 1, 999999999)),
      haloFieldShellRadiusBo: readInputNumber(els.electricAoe3dHaloFieldShellRadiusBo, 1.5, 0.5, 32),
      haloFieldWander: readInputNumber(els.electricAoe3dHaloFieldWander, 0.35, 0, 2),
      haloFieldWanderDurationMinMs: Math.round(readInputNumber(els.electricAoe3dHaloFieldWanderDurationMinMs, 1200, 50, 20000)),
      haloFieldWanderDurationMaxMs: Math.round(readInputNumber(els.electricAoe3dHaloFieldWanderDurationMaxMs, 3200, 50, 20000)),
      haloFieldWanderSpeedMin: readInputNumber(els.electricAoe3dHaloFieldWanderSpeedMin, 0.25, 0, 64),
      haloFieldWanderSpeedMax: readInputNumber(els.electricAoe3dHaloFieldWanderSpeedMax, 0.75, 0, 64),
      haloFieldZMinBo: readInputNumber(els.electricAoe3dHaloFieldZMinBo, -1.5, -32, 32),
      haloFieldZMaxBo: readInputNumber(els.electricAoe3dHaloFieldZMaxBo, 1.5, -32, 32),
    });
  }

  function buildHaloFieldPaths(bo, time = 0) {
    if (!haloFieldPlanner) haloFieldPlanner = createElectricAoeHaloFieldPlanner();
    return haloFieldPlanner.buildPaths({
      bo,
      config: readHaloFieldConfig(),
      time,
    });
  }

  function syncHaloControlPointLayer(bo, time = 0, force = false) {
    if (!haloControlPointLayer) return;
    const nowMs = performance.now();
    if (!force && nowMs - haloControlPointLastRefreshMs < CONTROL_POINT_REFRESH_MS) return;
    haloControlPointLastRefreshMs = nowMs;
    clearLayerChildren(haloControlPointLayer);
    if (!haloControlPointLayer.visible) return;
    const paths = buildHaloFieldPaths(bo, time);
    const fieldConfig = readHaloFieldConfig();
    if (!haloShellMaterial) {
      haloShellMaterial = new THREE.MeshBasicMaterial({
        color: 0x376fff,
        transparent: true,
        opacity: 0.14,
        wireframe: true,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
    }
    if (fieldConfig.haloFieldEnabled) {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(fieldConfig.haloFieldShellRadiusBo * bo, 32, 16),
        haloShellMaterial
      );
      shell.name = "electric_aoe3d:halo_field_shell";
      shell.renderOrder = 213;
      haloControlPointLayer.add(shell);
    }
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
    const pointRadius = bo * fieldConfig.haloFieldPointDiameterBo * 0.5;
    if (!haloControlPointGeometry || Math.abs((haloControlPointGeometry.userData.radius || 0) - pointRadius) > 0.0001) {
      if (haloControlPointGeometry && typeof haloControlPointGeometry.dispose === "function") haloControlPointGeometry.dispose();
      haloControlPointGeometry = new THREE.SphereGeometry(pointRadius, 14, 8);
      haloControlPointGeometry.userData.radius = pointRadius;
    }
    const centerMarker = new THREE.Mesh(haloControlPointGeometry, haloControlPointMaterial);
    centerMarker.name = "electric_aoe3d:halo_field_center_point";
    centerMarker.renderOrder = 216;
    centerMarker.position.set(0, 0, fieldConfig.dominantBoltZBo * bo);
    haloControlPointLayer.add(centerMarker);
    paths.forEach((path, pathIndex) => {
      const linePoints = path.points.map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), haloControlPointLineMaterial);
      line.name = `electric_aoe3d:halo_control_line_${pathIndex}`;
      line.renderOrder = 214;
      haloControlPointLayer.add(line);
      (Array.isArray(path.forks) ? path.forks : []).forEach((fork, forkIndex) => {
        (Array.isArray(fork.tines) ? fork.tines : []).forEach((tine, tineIndex) => {
          const tinePoints = (Array.isArray(tine.points) ? tine.points : []).map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
          if (tinePoints.length <= 1) return;
          const tineLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(tinePoints), haloControlPointLineMaterial);
          tineLine.name = `electric_aoe3d:halo_control_fork_${pathIndex}_${forkIndex}_${tineIndex}`;
          tineLine.renderOrder = 215;
          haloControlPointLayer.add(tineLine);
          const tip = tinePoints[tinePoints.length - 1];
          const marker = new THREE.Mesh(haloControlPointGeometry, haloControlPointMaterial);
          marker.name = `electric_aoe3d:halo_control_fork_tip_${pathIndex}_${forkIndex}_${tineIndex}`;
          marker.renderOrder = 216;
          marker.position.copy(tip);
          haloControlPointLayer.add(marker);
        });
      });
      path.points.slice(-1).forEach((point, pointIndex) => {
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
    if (!els.electricAoe3dHaloFieldVisibleBtn) return;
    const visible = els.electricAoe3dHaloFieldVisibleBtn.getAttribute("aria-pressed") !== "false";
    els.electricAoe3dHaloFieldVisibleBtn.setAttribute("aria-pressed", visible ? "false" : "true");
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
    if (els.electricAoe3dHaloFieldVisibleBtn) els.electricAoe3dHaloFieldVisibleBtn.addEventListener("click", toggleHaloControlPoints);
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
      els.electricAoe3dHaloFieldEnabled,
      els.electricAoe3dHaloFieldShellRadiusBo,
      els.electricAoe3dHaloFieldPointCount,
      els.electricAoe3dHaloFieldWanderSpeedMin,
      els.electricAoe3dHaloFieldWanderSpeedMax,
      els.electricAoe3dHaloFieldWander,
      els.electricAoe3dHaloFieldWanderDurationMinMs,
      els.electricAoe3dHaloFieldWanderDurationMaxMs,
      els.electricAoe3dHaloFieldLingerMinMs,
      els.electricAoe3dHaloFieldLingerMaxMs,
      els.electricAoe3dHaloFieldLingerDrift,
      els.electricAoe3dHaloFieldReversalChance,
      els.electricAoe3dHaloFieldZMinBo,
      els.electricAoe3dHaloFieldZMaxBo,
      els.electricAoe3dHaloFieldSeed,
      els.electricAoe3dHaloBoltShapeMinStepBo,
      els.electricAoe3dHaloBoltShapeMaxStepBo,
      els.electricAoe3dHaloBoltShapeSeekStrength,
      els.electricAoe3dHaloBoltShapeHeadingMemory,
      els.electricAoe3dHaloBoltShapeWanderStrength,
      els.electricAoe3dHaloBoltShapePathJitterBo,
      els.electricAoe3dHaloBoltShapeSpeedHz,
      els.electricAoe3dHaloBoltShapeSmoothing,
      els.electricAoe3dHaloBoltForkChance,
      els.electricAoe3dHaloBoltForkStartPct,
      els.electricAoe3dHaloBoltForkEndPct,
      els.electricAoe3dHaloBoltForkSpreadBo,
      els.electricAoe3dHaloBoltForkTargetOffsetBo,
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
