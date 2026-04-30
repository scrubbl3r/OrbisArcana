function clampCount(value = 0) {
  return String(Math.max(0, Number(value) || 0));
}

function resolveDepthLayerLabel(depthLayers = []) {
  const layers = Array.isArray(depthLayers) ? depthLayers : [];
  if (!layers.length) return "no depth layer";
  return layers.map((layer) => String(layer && layer.label || layer && layer.id || "depth")).join(" / ");
}

function resolveMaxDepthBO(depthLayers = []) {
  const layers = Array.isArray(depthLayers) ? depthLayers : [];
  let maxDepthBO = 0;
  for (const layer of layers) {
    const nextDepthBO = Number(layer && layer.maxDepthBO);
    if (Number.isFinite(nextDepthBO) && nextDepthBO > maxDepthBO) maxDepthBO = nextDepthBO;
  }
  return maxDepthBO;
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
  let currentMaxDepthBO = 0;
  let currentMaxDepthPx = 0;
  let worldGlobeSpawnCount = "0";
  let worldGlobeActiveCount = "0";
  let orbGlobeCount = "0";

  function setDatasetValue(target = null, key = "", value = "") {
    if (!target || !target.dataset || !key) return;
    target.dataset[key] = String(value);
  }

  function setDepthLayerLabel(depthLayers = []) {
    setDatasetValue(labelEl, "depth3d", resolveDepthLayerLabel(depthLayers));
    currentMaxDepthBO = resolveMaxDepthBO(depthLayers);
    currentMaxDepthPx = currentMaxDepthBO * Math.max(1, Number(fallbackBo) || 1);
    const nextMaxDepthBO = currentMaxDepthBO.toFixed(2);
    const nextMaxDepthPx = currentMaxDepthPx.toFixed(2);
    setDatasetValue(root, "depthMaxBo", nextMaxDepthBO);
    setDatasetValue(root, "depthMaxPx", nextMaxDepthPx);
    setDatasetValue(labelEl, "depthMaxBo", nextMaxDepthBO);
    setDatasetValue(labelEl, "depthMaxPx", nextMaxDepthPx);
  }

  function setSceneStatus({
    depthLayerCount = 0,
    depthStatus = "empty",
  } = {}) {
    setDatasetValue(root, "depthLayerCount", clampCount(depthLayerCount));
    setDatasetValue(root, "depthStatus", depthStatus);
  }

  function renderDebugText() {
    if (!debugEl) return;
    const nextBO = lastTelemetryBO || Number(fallbackBo || 0).toFixed(2);
    const nextRadius = lastTelemetryRadius || (Math.max(1, Number(fallbackBo) || 1) * 0.5).toFixed(2);
    const nextZBO = lastTelemetryZBO || "0.00";
    const nextDepthPx = lastTelemetryDepthPx || "0.00";
    const nextMaxDepthBO = Number(currentMaxDepthBO || 0).toFixed(2);
    const nextMaxDepthPx = Number(currentMaxDepthPx || 0).toFixed(2);
    const nextText = `3d BO ${nextBO} | r ${nextRadius} | z ${nextZBO}/${nextMaxDepthBO}BO | depth ${nextDepthPx}/${nextMaxDepthPx}px | globes ${worldGlobeActiveCount}/${worldGlobeSpawnCount} world ${orbGlobeCount} orb`;
    if (nextText !== lastTelemetryText) {
      debugEl.textContent = nextText;
      lastTelemetryText = nextText;
    }
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
    const nextMaxDepthBO = Number(currentMaxDepthBO || 0).toFixed(2);
    const nextMaxDepthPx = Number(currentMaxDepthPx || 0).toFixed(2);
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
    setDatasetValue(root, "depthMaxBo", nextMaxDepthBO);
    setDatasetValue(root, "depthMaxPx", nextMaxDepthPx);
    setDatasetValue(labelEl, "depthOrbBo", nextBO);
    setDatasetValue(labelEl, "depthOrbRadius", nextRadius);
    setDatasetValue(labelEl, "depthOrbZbo", nextZBO);
    setDatasetValue(labelEl, "depthOrbDepthPx", nextDepthPx);
    setDatasetValue(labelEl, "depthMaxBo", nextMaxDepthBO);
    setDatasetValue(labelEl, "depthMaxPx", nextMaxDepthPx);
    renderDebugText();
  }

  return Object.freeze({
    setDepthLayerLabel,
    setSceneStatus,
    updateOrbTelemetry,
    setWorldGlobeSpawnCount: (count) => {
      worldGlobeSpawnCount = clampCount(count);
      setDatasetValue(root, "depthGlobe3dWorldSpawnCount", worldGlobeSpawnCount);
      renderDebugText();
    },
    setWorldGlobeActiveCount: (count) => {
      worldGlobeActiveCount = clampCount(count);
      setDatasetValue(root, "depthGlobe3dWorldCount", worldGlobeActiveCount);
      renderDebugText();
    },
    setOrbGlobeCount: (count) => {
      orbGlobeCount = clampCount(count);
      setDatasetValue(root, "depthGlobe3dOrbCount", orbGlobeCount);
      renderDebugText();
    },
    setPropCount: (count) => setDatasetValue(root, "depthPropCount", clampCount(count)),
  });
}
