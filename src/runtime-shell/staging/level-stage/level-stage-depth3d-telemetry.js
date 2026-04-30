function clampCount(value = 0) {
  return String(Math.max(0, Number(value) || 0));
}

function resolveDepthLayerLabel(depthLayers = []) {
  const layers = Array.isArray(depthLayers) ? depthLayers : [];
  if (!layers.length) return "no depth layer";
  return layers.map((layer) => String(layer && layer.label || layer && layer.id || "depth")).join(" / ");
}

export function createLevelStageDepth3dTelemetry({
  root = null,
  labelEl = null,
  debugEl = null,
  fallbackBo = 72,
} = {}) {
  let lastTelemetryText = "";
  let lastTelemetryBO = "";
  let lastTelemetryRadius = "";
  let lastTelemetryZBO = "";
  let lastTelemetryDepthPx = "";

  function setDatasetValue(target = null, key = "", value = "") {
    if (!target || !target.dataset || !key) return;
    target.dataset[key] = String(value);
  }

  function setDepthLayerLabel(depthLayers = []) {
    setDatasetValue(labelEl, "depth3d", resolveDepthLayerLabel(depthLayers));
  }

  function setSceneStatus({
    depthLayerCount = 0,
    depthStatus = "empty",
  } = {}) {
    setDatasetValue(root, "depthLayerCount", clampCount(depthLayerCount));
    setDatasetValue(root, "depthStatus", depthStatus);
  }

  function updateOrbTelemetry({
    bo = fallbackBo,
    zBO = 0,
    depthPx = 0,
  } = {}) {
    if (!root || !root.dataset) return;
    const nextBO = Number(bo || 0).toFixed(2);
    const nextRadius = (Math.max(1, Number(bo) || fallbackBo) * 0.5).toFixed(2);
    const nextZBO = Number(zBO || 0).toFixed(2);
    const nextDepthPx = Number(depthPx || 0).toFixed(2);
    if (
      nextBO === lastTelemetryBO
      && nextRadius === lastTelemetryRadius
      && nextZBO === lastTelemetryZBO
      && nextDepthPx === lastTelemetryDepthPx
    ) {
      return;
    }
    lastTelemetryBO = nextBO;
    lastTelemetryRadius = nextRadius;
    lastTelemetryZBO = nextZBO;
    lastTelemetryDepthPx = nextDepthPx;
    setDatasetValue(root, "depthOrbBo", nextBO);
    setDatasetValue(root, "depthOrbRadius", nextRadius);
    setDatasetValue(root, "depthOrbZbo", nextZBO);
    setDatasetValue(root, "depthOrbDepthPx", nextDepthPx);
    setDatasetValue(labelEl, "depthOrbBo", nextBO);
    setDatasetValue(labelEl, "depthOrbRadius", nextRadius);
    setDatasetValue(labelEl, "depthOrbZbo", nextZBO);
    setDatasetValue(labelEl, "depthOrbDepthPx", nextDepthPx);
    if (debugEl) {
      const nextText = `3d BO ${nextBO} | r ${nextRadius} | z ${nextZBO}BO | depth ${nextDepthPx}`;
      if (nextText !== lastTelemetryText) {
        debugEl.textContent = nextText;
        lastTelemetryText = nextText;
      }
    }
  }

  return Object.freeze({
    setDepthLayerLabel,
    setSceneStatus,
    updateOrbTelemetry,
    setWorldGlobeSpawnCount: (count) => setDatasetValue(root, "depthGlobe3dWorldSpawnCount", clampCount(count)),
    setWorldGlobeActiveCount: (count) => setDatasetValue(root, "depthGlobe3dWorldCount", clampCount(count)),
    setOrbGlobeCount: (count) => setDatasetValue(root, "depthGlobe3dOrbCount", clampCount(count)),
    setPropCount: (count) => setDatasetValue(root, "depthPropCount", clampCount(count)),
  });
}
