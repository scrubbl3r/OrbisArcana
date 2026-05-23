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
import { createElectricAoeHaloFieldPlanner } from "../../../src/game-runtime/spells/electric-aoe-halo-bolt-planner.js?v=20260522k";

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

  function addHaloSkeletonObject(object) {
    if (!object || !haloControlPointLayer) return;
    object.userData.isElectricAoeHaloSkeleton = true;
    object.visible = haloControlPointsVisible();
    haloControlPointLayer.add(object);
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

  function rgbColor(r = 255, g = 255, b = 255) {
    return new THREE.Color(
      Math.max(0, Math.min(255, Number(r) || 0)) / 255,
      Math.max(0, Math.min(255, Number(g) || 0)) / 255,
      Math.max(0, Math.min(255, Number(b) || 0)) / 255
    );
  }

  function pathLength(points = []) {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += points[index - 1].distanceTo(points[index]);
    }
    return total;
  }

  function createTaperedTubeGeometry(points, baseRadius, radialSegments = 6, taper = 1) {
    const sourcePoints = Array.isArray(points) ? points.filter(Boolean) : [];
    if (sourcePoints.length <= 1) return new THREE.BufferGeometry().setFromPoints(sourcePoints);
    const curve = new THREE.CatmullRomCurve3(sourcePoints, false, "catmullrom", 0.5);
    const tubularSegments = Math.max(2, Math.min(96, Math.round(sourcePoints.length * 4)));
    const rings = tubularSegments + 1;
    const sides = Math.max(3, Math.round(radialSegments));
    const positions = [];
    const indices = [];
    const pathTs = [];
    const taperAmount = Math.max(0, Math.min(1, Number(taper) / 4));
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
      const easedT = t * t * (3 - 2 * t);
      const radiusScale = Math.max(0.08, 1 - (0.92 * taperAmount * easedT));
      const radius = Math.max(0.001, baseRadius * radiusScale);
      for (let sideIndex = 0; sideIndex < sides; sideIndex += 1) {
        const angle = (sideIndex / sides) * Math.PI * 2;
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

  function createBoltFadeMaterial({ color, opacity, tipOpacity }) {
    return new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uColor: { value: color },
        uOpacity: { value: Math.max(0, Math.min(1, Number(opacity) || 0)) },
        uTipOpacity: { value: Math.max(0, Math.min(1, Number(tipOpacity) || 0)) },
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
          float pathFade = mix(1.0, uTipOpacity, clamp(vPathT, 0.0, 1.0));
          gl_FragColor = vec4(uColor, uOpacity * pathFade);
        }
      `,
    });
  }

  function createPathLineGeometry(points = []) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const count = Array.isArray(points) ? points.length : 0;
    const pathTs = [];
    for (let index = 0; index < count; index += 1) {
      pathTs.push(count <= 1 ? 0 : index / (count - 1));
    }
    geometry.setAttribute("aPathT", new THREE.Float32BufferAttribute(pathTs, 1));
    return geometry;
  }

  function addBoltShaderMeshes(layer, points, config, bo, namePrefix, renderOrder, time = 0) {
    if (!layer || !Array.isArray(points) || points.length <= 1) return;
    if (config && config.boltShaderEnabled === false) {
      const fallback = new THREE.LineBasicMaterial({
        color: 0xd8f7ff,
        transparent: true,
        opacity: 0.56,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), fallback);
      line.name = `${namePrefix}_line`;
      line.renderOrder = renderOrder;
      layer.add(line);
      return;
    }
    const lengthBo = pathLength(points) / Math.max(1, bo);
    const taper = Math.max(0, Math.min(4, Number(config && config.boltShaderLengthTaper) || 0));
    const lengthMix = Math.max(0, Math.min(1, Math.pow(lengthBo / 2.5, 1 / Math.max(0.2, taper || 1))));
    const coreMin = Math.max(0.001, Number(config && config.boltShaderCoreWidthMinBo) || 0.006);
    const coreMax = Math.max(coreMin, Number(config && config.boltShaderCoreWidthMaxBo) || 0.022);
    const glowMin = Math.max(0.001, Number(config && config.boltShaderGlowWidthMinBo) || 0.035);
    const glowMax = Math.max(glowMin, Number(config && config.boltShaderGlowWidthMaxBo) || 0.16);
    const coreRadius = bo * (coreMin + (coreMax - coreMin) * lengthMix) * 0.5;
    const glowRadius = bo * (glowMin + (glowMax - glowMin) * lengthMix) * 0.5;
    const coreSoftness = Math.max(0, Math.min(1, Number(config && config.boltShaderCoreSoftness) || 0));
    const glowSoftness = Math.max(0, Math.min(1, Number(config && config.boltShaderGlowSoftness) || 0));
    const tipOpacity = Math.max(0, Math.min(1, Number(config && config.boltShaderTipOpacity) || 0));
    const flickerDepth = Math.max(0, Math.min(1, Number(config && config.boltShaderFlickerDepth) || 0));
    const flickerHz = Math.max(0, Number(config && config.boltShaderFlickerSpeedHz) || 0);
    const flicker = 1 - flickerDepth * (0.5 + 0.5 * Math.sin((time * flickerHz * Math.PI * 2) + lengthBo));
    const glowColor = rgbColor(config && config.boltShaderGlowR, config && config.boltShaderGlowG, config && config.boltShaderGlowB);
    const coreColor = rgbColor(config && config.boltShaderCoreR, config && config.boltShaderCoreG, config && config.boltShaderCoreB);
    const glow = new THREE.Mesh(
      createTaperedTubeGeometry(points, glowRadius * (1 + glowSoftness * 1.8), 6, taper),
      createBoltFadeMaterial({
        color: glowColor,
        opacity: Math.max(0, Math.min(1, 0.18 * (Number(config && config.boltShaderGlowIntensity) || 1.8) * flicker)),
        tipOpacity,
      })
    );
    glow.name = `${namePrefix}_glow`;
    glow.renderOrder = renderOrder;
    layer.add(glow);
    if (coreSoftness > 0) {
      const coreSoft = new THREE.Mesh(
        createTaperedTubeGeometry(points, coreRadius * (1 + coreSoftness * 2.2), 5, taper),
        createBoltFadeMaterial({
          color: coreColor,
          opacity: Math.max(0, Math.min(1, 0.12 * coreSoftness * (Number(config && config.boltShaderCoreIntensity) || 3.5) * flicker)),
          tipOpacity,
        })
      );
      coreSoft.name = `${namePrefix}_core_soft`;
      coreSoft.renderOrder = renderOrder + 1;
      layer.add(coreSoft);
    }
    const core = new THREE.Mesh(
      createTaperedTubeGeometry(points, coreRadius, 5, taper),
      createBoltFadeMaterial({
        color: coreColor,
        opacity: Math.max(0, Math.min(1, 0.28 * (Number(config && config.boltShaderCoreIntensity) || 3.5) * flicker)),
        tipOpacity,
      })
    );
    core.name = `${namePrefix}_core`;
    core.renderOrder = renderOrder + 1;
    layer.add(core);
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
    const forkTtlMinMs = Math.round(readInputNumber(els.electricAoe3dHaloBoltForkTtlMinMs, 180, 16, 20000));
    const forkTtlMaxMs = Math.round(readInputNumber(els.electricAoe3dHaloBoltForkTtlMaxMs, forkTtlMinMs, forkTtlMinMs, 20000));
    const branchTotalMin = Math.round(readInputNumber(els.electricAoe3dHaloBoltBranchTotalMin, 0, 0, 16));
    const branchTtlMinMs = Math.round(readInputNumber(els.electricAoe3dHaloBoltBranchTtlMinMs, 120, 16, 20000));
    return Object.freeze({
      dominantBoltZBo: 0,
      boltShaderEnabled: readInputBoolean(els.electricAoe3dBoltShaderEnabled, true),
      boltShaderCoreWidthMinBo: readInputNumber(els.electricAoe3dBoltShaderCoreWidthMinBo, 0.006, 0, 1),
      boltShaderCoreWidthMaxBo: readInputNumber(els.electricAoe3dBoltShaderCoreWidthMaxBo, 0.022, 0, 1),
      boltShaderGlowWidthMinBo: readInputNumber(els.electricAoe3dBoltShaderGlowWidthMinBo, 0.035, 0, 4),
      boltShaderGlowWidthMaxBo: readInputNumber(els.electricAoe3dBoltShaderGlowWidthMaxBo, 0.16, 0, 4),
      boltShaderLengthTaper: readInputNumber(els.electricAoe3dBoltShaderLengthTaper, 1, 0, 4),
      boltShaderTipOpacity: readInputNumber(els.electricAoe3dBoltShaderTipOpacity, 0.35, 0, 1),
      boltShaderCoreIntensity: readInputNumber(els.electricAoe3dBoltShaderCoreIntensity, 3.5, 0, 20),
      boltShaderCoreSoftness: readInputNumber(els.electricAoe3dBoltShaderCoreSoftness, 0.22, 0, 1),
      boltShaderGlowIntensity: readInputNumber(els.electricAoe3dBoltShaderGlowIntensity, 1.8, 0, 20),
      boltShaderGlowSoftness: readInputNumber(els.electricAoe3dBoltShaderGlowSoftness, 0.55, 0, 1),
      boltShaderFlickerSpeedHz: readInputNumber(els.electricAoe3dBoltShaderFlickerSpeedHz, 4, 0, 60),
      boltShaderFlickerDepth: readInputNumber(els.electricAoe3dBoltShaderFlickerDepth, 0.35, 0, 1),
      boltShaderCoreR: Math.round(readInputNumber(els.electricAoe3dBoltShaderCoreR, 235, 0, 255)),
      boltShaderCoreG: Math.round(readInputNumber(els.electricAoe3dBoltShaderCoreG, 250, 0, 255)),
      boltShaderCoreB: Math.round(readInputNumber(els.electricAoe3dBoltShaderCoreB, 255, 0, 255)),
      boltShaderGlowR: Math.round(readInputNumber(els.electricAoe3dBoltShaderGlowR, 60, 0, 255)),
      boltShaderGlowG: Math.round(readInputNumber(els.electricAoe3dBoltShaderGlowG, 130, 0, 255)),
      boltShaderGlowB: Math.round(readInputNumber(els.electricAoe3dBoltShaderGlowB, 255, 0, 255)),
      haloBoltShapeMinStepBo: readInputNumber(els.electricAoe3dHaloBoltShapeMinStepBo, 0.05, 0.01, 8),
      haloBoltShapeMaxStepBo: readInputNumber(els.electricAoe3dHaloBoltShapeMaxStepBo, 0.28, 0.01, 8),
      haloBoltShapeSeekStrength: readInputNumber(els.electricAoe3dHaloBoltShapeSeekStrength, 0.42, 0, 4),
      haloBoltShapeHeadingMemory: readInputNumber(els.electricAoe3dHaloBoltShapeHeadingMemory, 0.72, 0, 1),
      haloBoltShapeWanderStrength: readInputNumber(els.electricAoe3dHaloBoltShapeWanderStrength, 0.9, 0, 4),
      haloBoltShapePathJitterBo: readInputNumber(els.electricAoe3dHaloBoltShapePathJitterBo, 0.18, 0, 4),
      haloBoltShapeSpeedHz: readInputNumber(els.electricAoe3dHaloBoltShapeSpeedHz, 18, 0, 120),
      haloBoltShapeSmoothing: readInputNumber(els.electricAoe3dHaloBoltShapeSmoothing, 0.18, 0, 1),
      haloBoltForkChance: readInputNumber(els.electricAoe3dHaloBoltForkChance, 0, 0, 1),
      haloBoltForkTtlMinMs: forkTtlMinMs,
      haloBoltForkTtlMaxMs: forkTtlMaxMs,
      haloBoltForkStartPct: readInputNumber(els.electricAoe3dHaloBoltForkStartPct, 0.33, 0, 1),
      haloBoltForkEndPct: readInputNumber(els.electricAoe3dHaloBoltForkEndPct, 0.75, 0, 1),
      haloBoltForkSpreadMinBo: readInputNumber(els.electricAoe3dHaloBoltForkSpreadMinBo, 0.22, 0, 8),
      haloBoltForkSpreadMaxBo: readInputNumber(els.electricAoe3dHaloBoltForkSpreadMaxBo, 0.46, 0, 8),
      haloBoltForkZTineMinBo: readInputNumber(els.electricAoe3dHaloBoltForkZTineMinBo, 0, 0, 8),
      haloBoltForkZTineMaxBo: readInputNumber(els.electricAoe3dHaloBoltForkZTineMaxBo, 0.08, 0, 8),
      haloBoltForkTargetOffsetBo: readInputNumber(els.electricAoe3dHaloBoltForkTargetOffsetBo, 0.18, 0, 8),
      haloBoltBranchEnabled: readInputBoolean(els.electricAoe3dHaloBoltBranchEnabled, false),
      haloBoltBranchChance: readInputNumber(els.electricAoe3dHaloBoltBranchChance, 0, 0, 1),
      haloBoltBranchTotalMin: branchTotalMin,
      haloBoltBranchTotalMax: Math.round(readInputNumber(els.electricAoe3dHaloBoltBranchTotalMax, branchTotalMin, branchTotalMin, 16)),
      haloBoltBranchRangeStartPct: readInputNumber(els.electricAoe3dHaloBoltBranchRangeStartPct, 0.15, 0, 1),
      haloBoltBranchRangeEndPct: readInputNumber(els.electricAoe3dHaloBoltBranchRangeEndPct, 0.85, 0, 1),
      haloBoltBranchLengthMinBo: readInputNumber(els.electricAoe3dHaloBoltBranchLengthMinBo, 0.08, 0, 8),
      haloBoltBranchLengthMaxBo: readInputNumber(els.electricAoe3dHaloBoltBranchLengthMaxBo, 0.28, 0, 8),
      haloBoltBranchAngleMinDeg: readInputNumber(els.electricAoe3dHaloBoltBranchAngleMinDeg, 72, 0, 180),
      haloBoltBranchAngleMaxDeg: readInputNumber(els.electricAoe3dHaloBoltBranchAngleMaxDeg, 112, 0, 180),
      haloBoltBranchTtlMinMs: branchTtlMinMs,
      haloBoltBranchTtlMaxMs: Math.round(readInputNumber(els.electricAoe3dHaloBoltBranchTtlMaxMs, branchTtlMinMs, branchTtlMinMs, 20000)),
      haloBoltBranchStepMinBo: readInputNumber(els.electricAoe3dHaloBoltBranchStepMinBo, 0.006, 0.001, 1),
      haloBoltBranchStepMaxBo: readInputNumber(els.electricAoe3dHaloBoltBranchStepMaxBo, 0.035, 0.001, 1),
      haloBoltBranchBendStrength: readInputNumber(els.electricAoe3dHaloBoltBranchBendStrength, 0.75, 0, 4),
      haloBoltBranchCurlStrength: readInputNumber(els.electricAoe3dHaloBoltBranchCurlStrength, 0.55, 0, 4),
      haloBoltBranchShapeScale: readInputNumber(els.electricAoe3dHaloBoltBranchShapeScale, 0.45, 0.001, 1),
      haloFieldLingerMinMs: Math.round(readInputNumber(els.electricAoe3dHaloFieldLingerMinMs, 900, 50, 20000)),
      haloFieldLingerMaxMs: Math.round(readInputNumber(els.electricAoe3dHaloFieldLingerMaxMs, 2600, 50, 20000)),
      haloFieldLingerDrift: readInputNumber(els.electricAoe3dHaloFieldLingerDrift, 0, 0, 1),
      haloFieldEnabled: readInputBoolean(els.electricAoe3dHaloFieldEnabled, true),
      haloFieldPointCount: Math.round(readInputNumber(els.electricAoe3dHaloFieldPointCount, 24, 0, 256)),
      haloFieldPointDiameterBo: 0.05,
      haloFieldReversalChance: readInputNumber(els.electricAoe3dHaloFieldReversalChance, 0.35, 0, 1),
      haloFieldSeed: Math.round(readInputNumber(els.electricAoe3dHaloFieldSeed, 4242, 1, 999999999)),
      haloFieldShellRadiusBo: readInputNumber(els.electricAoe3dHaloFieldShellRadiusBo, 1.5, 0.5, 32),
      haloFieldBoltStartMinBo: readInputNumber(els.electricAoe3dHaloFieldBoltStartMinBo, 0, 0, 32),
      haloFieldBoltStartMaxBo: readInputNumber(els.electricAoe3dHaloFieldBoltStartMaxBo, 0, 0, 32),
      haloFieldBoltEndMinBo: readInputNumber(els.electricAoe3dHaloFieldBoltEndMinBo, 1.5, 0.05, 32),
      haloFieldBoltEndMaxBo: readInputNumber(els.electricAoe3dHaloFieldBoltEndMaxBo, 1.5, 0.05, 32),
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
      addHaloSkeletonObject(shell);
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
    addHaloSkeletonObject(centerMarker);
    const addBranchLines = (branches, namePrefix) => {
      (Array.isArray(branches) ? branches : []).forEach((branch, branchIndex) => {
        const branchPoints = (Array.isArray(branch.points) ? branch.points : []).map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
        if (branchPoints.length <= 1) return;
        addBoltShaderMeshes(haloControlPointLayer, branchPoints, fieldConfig, bo, `${namePrefix}_branch_${branchIndex}`, 215, time);
      });
    };
    paths.forEach((path, pathIndex) => {
      const linePoints = path.points.map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
      addBoltShaderMeshes(haloControlPointLayer, linePoints, fieldConfig, bo, `electric_aoe3d:halo_control_line_${pathIndex}`, 214, time);
      addBranchLines(path.branches, `electric_aoe3d:halo_control_${pathIndex}`);
      (Array.isArray(path.forks) ? path.forks : []).forEach((fork, forkIndex) => {
        (Array.isArray(fork.tines) ? fork.tines : []).forEach((tine, tineIndex) => {
          const tinePoints = (Array.isArray(tine.points) ? tine.points : []).map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
          if (tinePoints.length <= 1) return;
          addBoltShaderMeshes(haloControlPointLayer, tinePoints, fieldConfig, bo, `electric_aoe3d:halo_control_fork_${pathIndex}_${forkIndex}_${tineIndex}`, 215, time);
          const tip = tinePoints[tinePoints.length - 1];
          const marker = new THREE.Mesh(haloControlPointGeometry, haloControlPointMaterial);
          marker.name = `electric_aoe3d:halo_control_fork_tip_${pathIndex}_${forkIndex}_${tineIndex}`;
          marker.renderOrder = 216;
          marker.position.copy(tip);
          addHaloSkeletonObject(marker);
          addBranchLines(tine.branches, `electric_aoe3d:halo_control_fork_${pathIndex}_${forkIndex}_${tineIndex}`);
        });
      });
      path.points.slice(-1).forEach((point, pointIndex) => {
        const marker = new THREE.Mesh(haloControlPointGeometry, haloControlPointMaterial);
        marker.name = `electric_aoe3d:halo_control_point_${pathIndex}_${pointIndex}`;
        marker.renderOrder = 216;
        marker.position.set(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo);
        addHaloSkeletonObject(marker);
      });
    });
  }

  function syncControlPointLayer(bo, time = 0, force = false) {
    if (!controlPointLayer) return;
    const nowMs = performance.now();
    if (!force && nowMs - controlPointLastRefreshMs < CONTROL_POINT_REFRESH_MS) return;
    controlPointLastRefreshMs = nowMs;
    const path = buildPreviewControlPath(bo, time);
    const shaderConfig = readHaloFieldConfig();
    const points = Array.isArray(path && path.points) ? path.points : [];
    const linePoints = points.map((point) => new THREE.Vector3(point.xW || 0, point.yW || 0, (point.zBo || 0) * bo));
    if (!controlPointLineMaterial) {
      controlPointLineMaterial = createBoltFadeMaterial({
        color: rgbColor(shaderConfig.boltShaderCoreR, shaderConfig.boltShaderCoreG, shaderConfig.boltShaderCoreB),
        opacity: 1,
        tipOpacity: shaderConfig.boltShaderTipOpacity,
      });
    }
    controlPointLineMaterial.uniforms.uColor.value.copy(rgbColor(shaderConfig.boltShaderCoreR, shaderConfig.boltShaderCoreG, shaderConfig.boltShaderCoreB));
    controlPointLineMaterial.uniforms.uOpacity.value = shaderConfig.boltShaderEnabled === false ? 0.68 : Math.max(0.2, Math.min(1, 0.28 * shaderConfig.boltShaderCoreIntensity));
    controlPointLineMaterial.uniforms.uTipOpacity.value = Math.max(0, Math.min(1, Number(shaderConfig.boltShaderTipOpacity) || 0));
    if (!controlPointLine) {
      controlPointLine = new THREE.Line(new THREE.BufferGeometry(), controlPointLineMaterial);
      controlPointLine.name = "electric_aoe3d:dominant_control_line";
      controlPointLine.renderOrder = 219;
      controlPointLayer.add(controlPointLine);
    }
    controlPointLine.geometry.dispose();
    controlPointLine.geometry = createPathLineGeometry(linePoints);
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
    layer.visible = true;
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
    syncHaloControlPointLayer(readBo(), (performance.now() - createdAt) / 1000, true);
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function toggleBoltShader() {
    if (!els.electricAoe3dBoltShaderVisibleBtn) return;
    const visible = els.electricAoe3dBoltShaderVisibleBtn.getAttribute("aria-pressed") !== "false";
    els.electricAoe3dBoltShaderVisibleBtn.setAttribute("aria-pressed", visible ? "false" : "true");
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
    if (els.electricAoe3dBoltShaderVisibleBtn) els.electricAoe3dBoltShaderVisibleBtn.addEventListener("click", toggleBoltShader);
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
      els.electricAoe3dBoltShaderEnabled,
      els.electricAoe3dBoltShaderCoreWidthMinBo,
      els.electricAoe3dBoltShaderCoreWidthMaxBo,
      els.electricAoe3dBoltShaderGlowWidthMinBo,
      els.electricAoe3dBoltShaderGlowWidthMaxBo,
      els.electricAoe3dBoltShaderLengthTaper,
      els.electricAoe3dBoltShaderTipOpacity,
      els.electricAoe3dBoltShaderCoreIntensity,
      els.electricAoe3dBoltShaderCoreSoftness,
      els.electricAoe3dBoltShaderGlowIntensity,
      els.electricAoe3dBoltShaderGlowSoftness,
      els.electricAoe3dBoltShaderFlickerSpeedHz,
      els.electricAoe3dBoltShaderFlickerDepth,
      els.electricAoe3dBoltShaderCoreR,
      els.electricAoe3dBoltShaderCoreG,
      els.electricAoe3dBoltShaderCoreB,
      els.electricAoe3dBoltShaderGlowR,
      els.electricAoe3dBoltShaderGlowG,
      els.electricAoe3dBoltShaderGlowB,
      els.electricAoe3dHaloFieldEnabled,
      els.electricAoe3dHaloFieldShellRadiusBo,
      els.electricAoe3dHaloFieldBoltStartMinBo,
      els.electricAoe3dHaloFieldBoltStartMaxBo,
      els.electricAoe3dHaloFieldBoltEndMinBo,
      els.electricAoe3dHaloFieldBoltEndMaxBo,
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
      els.electricAoe3dHaloBoltForkTtlMinMs,
      els.electricAoe3dHaloBoltForkTtlMaxMs,
      els.electricAoe3dHaloBoltForkStartPct,
      els.electricAoe3dHaloBoltForkEndPct,
      els.electricAoe3dHaloBoltForkSpreadMinBo,
      els.electricAoe3dHaloBoltForkSpreadMaxBo,
      els.electricAoe3dHaloBoltForkZTineMinBo,
      els.electricAoe3dHaloBoltForkZTineMaxBo,
      els.electricAoe3dHaloBoltForkTargetOffsetBo,
      els.electricAoe3dHaloBoltBranchEnabled,
      els.electricAoe3dHaloBoltBranchChance,
      els.electricAoe3dHaloBoltBranchTotalMin,
      els.electricAoe3dHaloBoltBranchTotalMax,
      els.electricAoe3dHaloBoltBranchRangeStartPct,
      els.electricAoe3dHaloBoltBranchRangeEndPct,
      els.electricAoe3dHaloBoltBranchLengthMinBo,
      els.electricAoe3dHaloBoltBranchLengthMaxBo,
      els.electricAoe3dHaloBoltBranchAngleMinDeg,
      els.electricAoe3dHaloBoltBranchAngleMaxDeg,
      els.electricAoe3dHaloBoltBranchTtlMinMs,
      els.electricAoe3dHaloBoltBranchTtlMaxMs,
      els.electricAoe3dHaloBoltBranchStepMinBo,
      els.electricAoe3dHaloBoltBranchStepMaxBo,
      els.electricAoe3dHaloBoltBranchBendStrength,
      els.electricAoe3dHaloBoltBranchCurlStrength,
      els.electricAoe3dHaloBoltBranchShapeScale,
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
