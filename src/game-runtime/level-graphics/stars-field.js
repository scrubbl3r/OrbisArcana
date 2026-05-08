import { STARS_FIELD_CONFIG } from "./stars-field.config.js?v=20260425i";

// Exemplar contract for future generative graphics:
// - authored SVG semantics define the visible/meaningful region
// - model generation is deterministic and scene-load-only
// - output is stable data for layer-based renderers
// - runtime motion should operate on layer groups, not individual generated items

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function hashString(value = "") {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashToUnit(seed = "") {
  const h = hashString(seed);
  return (h % 1000000) / 1000000;
}

function lerp(a, b, t) {
  return Number(a) + ((Number(b) - Number(a)) * Number(t));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

function resolveBoundaryBoxFromPoints(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  if (!safePoints.length) return null;
  let leftXW = Number.POSITIVE_INFINITY;
  let rightXW = Number.NEGATIVE_INFINITY;
  let topYW = Number.POSITIVE_INFINITY;
  let bottomYW = Number.NEGATIVE_INFINITY;
  for (const point of safePoints) {
    const xW = clampNumber(point && point.xW, 0);
    const yW = clampNumber(point && point.yW, 0);
    leftXW = Math.min(leftXW, xW);
    rightXW = Math.max(rightXW, xW);
    topYW = Math.min(topYW, yW);
    bottomYW = Math.max(bottomYW, yW);
  }
  return Object.freeze({
    leftXW,
    rightXW,
    topYW,
    bottomYW,
    widthW: Math.max(1, rightXW - leftXW),
    heightW: Math.max(1, bottomYW - topYW),
  });
}

function deriveLayerRegion(region = null, layer = null, cameraBoundaryBox = null, config = STARS_FIELD_CONFIG) {
  const boundaryBox = region && region.boundaryBox ? region.boundaryBox : null;
  if (!boundaryBox) return null;
  const sourceWidthW = Math.max(1, clampNumber(boundaryBox.widthW, 1));
  const sourceHeightW = Math.max(1, clampNumber(boundaryBox.heightW, 1));
  const parallaxRatio = clamp01(layer && layer.parallaxRatio);
  const overscanScale = Math.max(0, clampNumber(layer && layer.overscanScale, config.overscanScale));
  const cameraBox = cameraBoundaryBox && typeof cameraBoundaryBox === "object" ? cameraBoundaryBox : boundaryBox;
  const travelXW = Math.max(0, clampNumber(cameraBox.widthW, sourceWidthW) - sourceWidthW);
  const travelYW = Math.max(0, clampNumber(cameraBox.heightW, sourceHeightW) - sourceHeightW);
  const extraWidthW = travelXW * parallaxRatio * overscanScale;
  const extraHeightW = travelYW * parallaxRatio * overscanScale;
  const marginXW = extraWidthW * 0.5;
  const marginYW = extraHeightW * 0.5;
  const expandedBoundaryBox = Object.freeze({
    leftXW: clampNumber(boundaryBox.leftXW, 0) - marginXW,
    rightXW: clampNumber(boundaryBox.rightXW, 0) + marginXW,
    topYW: clampNumber(boundaryBox.topYW, 0) - marginYW,
    bottomYW: clampNumber(boundaryBox.bottomYW, 0) + marginYW,
    widthW: sourceWidthW + extraWidthW,
    heightW: sourceHeightW + extraHeightW,
  });
  return Object.freeze({
    ...region,
    layerId: String(layer && layer.id || "layer"),
    parallaxRatio,
    starCountWeight: Math.max(0, clampNumber(layer && layer.starCountWeight, 0)),
    radiusRangePx: Array.isArray(layer && layer.radiusRangePx) ? layer.radiusRangePx : Object.freeze([1, 2]),
    opacityRange: Array.isArray(layer && layer.opacityRange) ? layer.opacityRange : Object.freeze([0.2, 0.5]),
    palette: Array.isArray(layer && layer.palette) ? layer.palette : Object.freeze(["#ffffff"]),
    highlightChance: clamp01(layer && layer.highlightChance),
    sourceBoundaryBox: boundaryBox,
    cameraBoundaryBox: cameraBox,
    sourceWorldPoints: Array.isArray(region && region.worldPoints) ? region.worldPoints : [],
    worldPoints: Array.isArray(region && region.worldPoints) ? region.worldPoints : [],
    zBO: Math.max(0, clampNumber(region && region.zBO, 12)),
    depthBO: Math.max(0.001, clampNumber(region && region.depthBO, 40)),
    density: Math.max(0, clampNumber(region && region.density, 1)),
    boundaryBox: expandedBoundaryBox,
    generationBox: expandedBoundaryBox,
    overscanMarginXW: marginXW,
    overscanMarginYW: marginYW,
  });
}

function buildStarCandidate(region, cellX, cellY, ordinal, config) {
  const layerPalette = Array.isArray(region && region.palette) ? region.palette : [];
  const generationBox = region && region.generationBox ? region.generationBox : null;
  if (!generationBox) return null;
  const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 420));
  const jitterRatio = Math.max(0, Math.min(1, clampNumber(config.jitterRatio, 0.42)));
  const maxJitter = Math.min(cellSize * jitterRatio, Math.max(0, clampNumber(config.maxJitterW, 140)));
  const baseX = clampNumber(generationBox.leftXW, 0) + ((cellX + 0.5) * cellSize);
  const baseY = clampNumber(generationBox.topYW, 0) + ((cellY + 0.5) * cellSize);
  const jitterX = lerp(-maxJitter, maxJitter, hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:jx`));
  const jitterY = lerp(-maxJitter, maxJitter, hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:jy`));
  const xW = baseX + jitterX;
  const yW = baseY + jitterY;
  const insideLayer = (
    xW >= clampNumber(generationBox.leftXW, 0)
    && xW <= clampNumber(generationBox.rightXW, 0)
    && yW >= clampNumber(generationBox.topYW, 0)
    && yW <= clampNumber(generationBox.bottomYW, 0)
  );
  if (!insideLayer) return null;
  const radiusRange = Array.isArray(region && region.radiusRangePx) ? region.radiusRangePx : [1, 2];
  const opacityRange = Array.isArray(region && region.opacityRange) ? region.opacityRange : [0.2, 0.5];
  const palette = layerPalette.length ? layerPalette : ["#ffffff"];
  const paletteIndex = Math.min(
    palette.length - 1,
    Math.floor(hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:palette`) * palette.length)
  );
  const highlightChance = clamp01(region && region.highlightChance);
  const isHighlight = hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:highlight`) < highlightChance;
  const baseRadius = lerp(radiusRange[0], radiusRange[1], hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:radius`));
  const baseOpacity = lerp(opacityRange[0], opacityRange[1], hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:opacity`));
  const radiusMultiplier = isHighlight ? 1.8 : 1;
  const opacityBoost = isHighlight ? 0.18 : 0;
  const haloOpacity = isHighlight ? 0.10 : 0;
  const haloRadiusMultiplier = isHighlight ? 3.4 : 0;
  const scoreBase = hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:score`);
  const ordinalPenalty = ordinal * 0.11;
  const score = Math.max(0, scoreBase - ordinalPenalty);
  const localWidth = Math.max(1, clampNumber(generationBox.widthW, 1));
  const localHeight = Math.max(1, clampNumber(generationBox.heightW, 1));
  const nearZBO = Math.max(0, clampNumber(region && region.zBO, 12));
  const depthBO = Math.max(0.001, clampNumber(region && region.depthBO, 40));
  const zBO = nearZBO + (hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:z`) * depthBO);
  return Object.freeze({
    id: `${region.id}:star:${cellX}:${cellY}:${ordinal}`,
    regionId: region.id,
    cellX,
    cellY,
    ordinal,
    xW,
    yW,
    localXW: xW - clampNumber(generationBox.leftXW, 0),
    localYW: yW - clampNumber(generationBox.topYW, 0),
    localWidthW: localWidth,
    localHeightW: localHeight,
    radiusPx: baseRadius * radiusMultiplier,
    opacity: clamp01(baseOpacity + opacityBoost),
    color: String(palette[paletteIndex] || palette[0] || "#ffffff"),
    zBO,
    nearZBO,
    depthBO,
    depthBand: String(region.layerId || "layer_1"),
    parallaxRatio: clamp01(clampNumber(region.parallaxRatio, 0.22)),
    isHighlight,
    haloOpacity,
    haloRadiusPx: isHighlight ? (baseRadius * haloRadiusMultiplier) : 0,
    insideCore: true,
    insideEnvelope: true,
    score,
  });
}

function compareSpatialCandidateOrder(a = {}, b = {}) {
  const rowA = Math.floor(clampNumber(a.cellY, 0));
  const rowB = Math.floor(clampNumber(b.cellY, 0));
  if (rowA !== rowB) return rowA - rowB;
  const colA = Math.floor(clampNumber(a.cellX, 0));
  const colB = Math.floor(clampNumber(b.cellX, 0));
  const serpentineA = (rowA % 2 === 0) ? colA : -colA;
  const serpentineB = (rowB % 2 === 0) ? colB : -colB;
  if (serpentineA !== serpentineB) return serpentineA - serpentineB;
  return String(a.id || "").localeCompare(String(b.id || ""));
}

function sampleEvenlyOrdered(items = [], targetCount = 0) {
  const safeItems = Array.isArray(items) ? items.slice() : [];
  const target = Math.max(0, Math.floor(Number(targetCount) || 0));
  if (!safeItems.length || target <= 0) return [];
  if (safeItems.length <= target) return safeItems;
  const selected = [];
  const stride = safeItems.length / target;
  for (let i = 0; i < target; i += 1) {
    const index = Math.min(safeItems.length - 1, Math.floor((i + 0.5) * stride));
    selected.push(safeItems[index]);
  }
  return selected;
}

function selectStratifiedCandidates(candidates = [], targetCount = 0) {
  const target = Math.max(0, Math.floor(Number(targetCount) || 0));
  if (target <= 0) return [];
  const buckets = new Map();
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const ordinal = Math.max(0, Math.floor(clampNumber(candidate && candidate.ordinal, 0)));
    const bucket = buckets.get(ordinal) || [];
    bucket.push(candidate);
    buckets.set(ordinal, bucket);
  }
  const ordinals = Array.from(buckets.keys()).sort((a, b) => a - b);
  const selected = [];
  let remaining = target;
  for (const ordinal of ordinals) {
    if (remaining <= 0) break;
    const bucket = (buckets.get(ordinal) || []).slice().sort(compareSpatialCandidateOrder);
    const takeCount = Math.min(remaining, bucket.length);
    selected.push(...sampleEvenlyOrdered(bucket, takeCount));
    remaining = target - selected.length;
  }
  return selected;
}

export function buildStarsFieldModel({
  regions = [],
  cameraBoundaryBox = null,
  config = STARS_FIELD_CONFIG,
} = {}) {
  // This model is intentionally static after build. Camera motion, culling,
  // clipping, and parallax belong to the renderer/runtime lane.
  const safeRegions = Array.isArray(regions) ? regions : [];
  const safeLayers = Array.isArray(config && config.parallaxLayers) ? config.parallaxLayers : [];
  const activeLayers = safeLayers.filter((layer = {}) => clampNumber(layer && layer.parallaxRatio, 0) >= 0);
  const layerRegions = activeLayers.flatMap((layer = {}) =>
    safeRegions.map((region = {}) => deriveLayerRegion(region, layer, cameraBoundaryBox, config)).filter(Boolean)
  );
  const totalWeight = activeLayers.reduce((sum, layer = {}) => sum + Math.max(0, clampNumber(layer.starCountWeight, 0)), 0) || 1;
  const targetStarCount = Math.max(0, Math.floor(clampNumber(config && config.targetStarCount, 0)));
  const stars = [];
  for (let regionIndex = 0; regionIndex < layerRegions.length; regionIndex += 1) {
    const region = layerRegions[regionIndex];
    const generationBox = region && region.generationBox ? region.generationBox : null;
    if (!generationBox) continue;
    const layerWeight = Math.max(0, clampNumber(region.starCountWeight, 0));
    const density = Math.max(0, clampNumber(region.density, 1));
    const targetForRegion = Math.max(0, Math.round(targetStarCount * density * (layerWeight / totalWeight)));
    const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 76));
    const cols = Math.max(1, Math.ceil(clampNumber(generationBox.widthW, cellSize) / cellSize));
    const rows = Math.max(1, Math.ceil(clampNumber(generationBox.heightW, cellSize) / cellSize));
    const candidates = [];
    for (let cellY = 0; cellY < rows; cellY += 1) {
      for (let cellX = 0; cellX < cols; cellX += 1) {
        for (let ordinal = 0; ordinal < Math.max(1, Math.floor(clampNumber(config.candidateOrdinals, 1))); ordinal += 1) {
          const candidate = buildStarCandidate(region, cellX, cellY, ordinal, config);
          if (candidate) candidates.push(candidate);
        }
      }
    }
    stars.push(...selectStratifiedCandidates(candidates, targetForRegion));
  }

  return Object.freeze({
    kind: "stars_field",
    config,
    regions: Object.freeze(safeRegions),
    layers: Object.freeze(layerRegions.map((region = {}) => Object.freeze({
      id: `${String(region.id || "stars_field")}__${String(region.layerId || "layer")}`,
      layerId: String(region.layerId || "layer"),
      parallaxRatio: clamp01(region.parallaxRatio),
      starCountWeight: Math.max(0, clampNumber(region.starCountWeight, 0)),
      radiusRangePx: Array.isArray(region.radiusRangePx) ? region.radiusRangePx : Object.freeze([1, 2]),
      opacityRange: Array.isArray(region.opacityRange) ? region.opacityRange : Object.freeze([0.2, 0.5]),
      palette: Array.isArray(region.palette) ? region.palette : Object.freeze(["#ffffff"]),
      highlightChance: clamp01(region.highlightChance),
      zBO: Math.max(0, clampNumber(region.zBO, 12)),
      depthBO: Math.max(0.001, clampNumber(region.depthBO, 40)),
      density: Math.max(0, clampNumber(region.density, 1)),
      boundaryBox: region.boundaryBox,
      sourceBoundaryBox: region.sourceBoundaryBox || null,
      cameraBoundaryBox: region.cameraBoundaryBox || null,
    }))),
    stars: Object.freeze(stars),
  });
}
