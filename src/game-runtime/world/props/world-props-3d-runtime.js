import { LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS, LEVEL_DEPTH_DEFAULT_ORB_Z_BO } from "../../level/depth-projection.js";
import { applyAuthoredRenderOrder } from "../../level/authored-render-stack.js";
import { createGraphiteMaterial } from "../../rendering/three/materials/graphite-material.js";
import { GRAPHITE_CONFIG } from "../../rendering/three/materials/graphite-config.js";
import { addLineEdges } from "../../rendering/three/three-line-utils.js";
import { disposeThreeObject } from "../../rendering/three/three-object-utils.js";
import { createPlinthModel } from "./plinth-model.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolvePropAnchorPoint(prop = {}) {
  return prop && prop.worldAnchor
    ? prop.worldAnchor
    : (prop && prop.worldCenter ? prop.worldCenter : Object.freeze({ xW: 0, yW: 0 }));
}

function resolvePlinthYForAnchor(anchorY = 0, anchor = "center", metrics = {}) {
  const normalizedAnchor = String(anchor || "center").trim().toLowerCase();
  if (normalizedAnchor === "top") {
    return anchorY - clampNumber(metrics && metrics.plinthHeight, 0);
  }
  if (normalizedAnchor === "bottom" || normalizedAnchor === "base") {
    return anchorY;
  }
  return anchorY - clampNumber(metrics && metrics.columnCenterY, 0);
}

function resolveActorLanePropZ(zBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO, bo = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS, metrics = {}) {
  const authoredDepth = Math.max(0, clampNumber(zBO, LEVEL_DEPTH_DEFAULT_ORB_Z_BO)) * Math.max(1, clampNumber(bo, LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS));
  const propHalfDepth = Math.max(
    clampNumber(metrics && metrics.baseDepth, 0),
    clampNumber(metrics && metrics.capitalDepth, 0),
    clampNumber(metrics && metrics.columnDepth, 0)
  ) * 0.5;
  return -(authoredDepth + propHalfDepth + (Math.max(1, clampNumber(bo, LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS)) * 0.05));
}

export function createWorldProps3dRuntime({
  group = null,
  getBo = () => LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS,
  getOrbZBO = () => LEVEL_DEPTH_DEFAULT_ORB_Z_BO,
  toRuntimePosition = ({ x = 0, y = 0 } = {}) => ({ x, y }),
  onCountChange = () => {},
} = {}) {
  let edgeMaterials = [];

  function publishCount() {
    if (typeof onCountChange === "function") {
      onCountChange(group && Array.isArray(group.children) ? group.children.length : 0);
    }
  }

  function clear() {
    if (!group) return;
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeThreeObject(child);
    }
    edgeMaterials = [];
    publishCount();
  }

  function buildPropModel(prop = {}) {
    const kind = String(prop && prop.kind || "").trim().toLowerCase();
    if (kind !== "plinth") return null;
    const scale = Math.max(0.01, clampNumber(prop && prop.scale, 1));
    const bo = Math.max(1, Math.max(1, Number(getBo()) || LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS) * scale);
    const material = createGraphiteMaterial(GRAPHITE_CONFIG);
    const { model, metrics } = createPlinthModel({
      bo,
      material,
      decorateMesh: (mesh) => {
        addLineEdges(mesh, {
          color: GRAPHITE_CONFIG.edgeHaloColor,
          linewidth: GRAPHITE_CONFIG.edgeHaloWidth,
          opacity: GRAPHITE_CONFIG.edgeHaloOpacity,
          thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
          edgeMaterials,
        });
        addLineEdges(mesh, {
          color: GRAPHITE_CONFIG.edgeColor,
          linewidth: GRAPHITE_CONFIG.edgeWidth,
          opacity: GRAPHITE_CONFIG.edgeOpacity,
          thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
          edgeMaterials,
        });
      },
    });
    const anchorPoint = resolvePropAnchorPoint(prop);
    const zBO = String(prop && prop.zMode || "").trim().toLowerCase() === "orb"
      ? Math.max(0, clampNumber(typeof getOrbZBO === "function" ? getOrbZBO() : getOrbZBO, LEVEL_DEPTH_DEFAULT_ORB_Z_BO))
      : Math.max(0, clampNumber(prop && prop.zBO, LEVEL_DEPTH_DEFAULT_ORB_Z_BO));
    const anchor = typeof toRuntimePosition === "function"
      ? (toRuntimePosition({ x: anchorPoint.xW, y: anchorPoint.yW }) || {})
      : {};
    model.position.set(
      Number(anchor.x) || 0,
      resolvePlinthYForAnchor(Number(anchor.y) || 0, prop && prop.anchor, metrics),
      resolveActorLanePropZ(zBO, bo, metrics)
    );
    model.name = `prop:${String(prop && prop.id || kind)}`;
    model.userData.prop = prop;
    model.userData.authoredZBO = zBO;
    applyAuthoredRenderOrder(model, prop, { fallback: 20, offset: 0.5 });
    model.traverse((child) => {
      if (!child || !child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return model;
  }

  function load(props = []) {
    clear();
    if (!group) return;
    const propList = Array.isArray(props) ? props : [];
    for (const prop of propList) {
      const model = buildPropModel(prop);
      if (model) group.add(model);
    }
    publishCount();
  }

  function updateResolution(width = 1, height = 1) {
    for (const material of edgeMaterials) {
      if (material && material.resolution) material.resolution.set(width, height);
    }
  }

  return Object.freeze({
    load,
    clear,
    updateResolution,
    count() {
      return group && Array.isArray(group.children) ? group.children.length : 0;
    },
    dispose() {
      clear();
    },
  });
}
