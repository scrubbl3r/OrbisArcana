import { STARS_FIELD_CONFIG } from "./stars-field.config.js?v=20260425a";

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

function buildGenerationBox(region = null, config = STARS_FIELD_CONFIG) {
  const boundaryBox = region && region.boundaryBox ? region.boundaryBox : null;
  if (!boundaryBox) return null;
  const marginW = Math.max(0, clampNumber(config.parallaxMarginW, 1536));
  const leftXW = clampNumber(boundaryBox.leftXW, 0) - marginW;
  const topYW = clampNumber(boundaryBox.topYW, 0) - marginW;
  const rightXW = clampNumber(boundaryBox.rightXW, 0) + marginW;
  const bottomYW = clampNumber(boundaryBox.bottomYW, 0) + marginW;
  return Object.freeze({
    leftXW,
    topYW,
    rightXW,
    bottomYW,
    widthW: Math.max(1, rightXW - leftXW),
    heightW: Math.max(1, bottomYW - topYW),
  });
}

function distancePointToSegmentSquared(px = 0, py = 0, ax = 0, ay = 0, bx = 0, by = 0) {
  const abx = bx - ax;
  const aby = by - ay;
  if (Math.abs(abx) < 1e-9 && Math.abs(aby) < 1e-9) {
    const dx = px - ax;
    const dy = py - ay;
    return (dx * dx) + (dy * dy);
  }
  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, ((apx * abx) + (apy * aby)) / ((abx * abx) + (aby * aby))));
  const closestX = ax + (abx * t);
  const closestY = ay + (aby * t);
  const dx = px - closestX;
  const dy = py - closestY;
  return (dx * dx) + (dy * dy);
}

function distanceToPolygonEdges(x = 0, y = 0, points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  if (safePoints.length < 2) return Number.POSITIVE_INFINITY;
  let minDistanceSq = Number.POSITIVE_INFINITY;
  for (let i = 0, j = safePoints.length - 1; i < safePoints.length; j = i, i += 1) {
    const pi = safePoints[i] || {};
    const pj = safePoints[j] || {};
    const distanceSq = distancePointToSegmentSquared(
      x,
      y,
      clampNumber(pj.xW, 0),
      clampNumber(pj.yW, 0),
      clampNumber(pi.xW, 0),
      clampNumber(pi.yW, 0)
    );
    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq;
    }
  }
  return Math.sqrt(minDistanceSq);
}

function pointInExpandedPolygon(x = 0, y = 0, points = [], marginW = 0) {
  if (pointInPolygon(x, y, points)) return true;
  const safeMargin = Math.max(0, clampNumber(marginW, 0));
  if (safeMargin <= 0) return false;
  return distanceToPolygonEdges(x, y, points) <= safeMargin;
}

function pointInPolygon(x = 0, y = 0, points = []) {
  let inside = false;
  const safePoints = Array.isArray(points) ? points : [];
  for (let i = 0, j = safePoints.length - 1; i < safePoints.length; j = i, i += 1) {
    const pi = safePoints[i] || {};
    const pj = safePoints[j] || {};
    const xi = clampNumber(pi.xW, 0);
    const yi = clampNumber(pi.yW, 0);
    const xj = clampNumber(pj.xW, 0);
    const yj = clampNumber(pj.yW, 0);
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function chooseDepthBand(seed = "", depthBands = []) {
  const unit = hashToUnit(`${seed}:depth`);
  let cursor = 0;
  const safeBands = Array.isArray(depthBands) ? depthBands : [];
  const totalWeight = safeBands.reduce((sum, band) => sum + Math.max(0, clampNumber(band && band.weight, 0)), 0) || 1;
  for (const band of safeBands) {
    cursor += Math.max(0, clampNumber(band && band.weight, 0)) / totalWeight;
    if (unit <= cursor) return band;
  }
  return safeBands[safeBands.length - 1] || null;
}

function buildStarCandidate(region, cellX, cellY, ordinal, config) {
  const band = chooseDepthBand(`${region.id}:${cellX}:${cellY}:${ordinal}:${config.seedSalt}`, config.depthBands);
  if (!band) return null;
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
  const marginW = Math.max(0, clampNumber(config.parallaxMarginW, 1536));
  const insideCore = pointInPolygon(xW, yW, region.worldPoints);
  const insideEnvelope = pointInExpandedPolygon(xW, yW, region.worldPoints, marginW);
  if (!insideEnvelope) return null;
  const radiusRange = Array.isArray(band.radiusRangePx) ? band.radiusRangePx : [1, 2];
  const opacityRange = Array.isArray(band.opacityRange) ? band.opacityRange : [0.2, 0.5];
  const palette = Array.isArray(band.palette) ? band.palette : ["#ffffff"];
  const paletteIndex = Math.min(
    palette.length - 1,
    Math.floor(hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:palette`) * palette.length)
  );
  const highlightConfig = config && config.highlight ? config.highlight : {};
  const baseHighlightChance = lerp(
    clamp01(highlightConfig.chanceRange && highlightConfig.chanceRange[0]),
    clamp01(highlightConfig.chanceRange && highlightConfig.chanceRange[1]),
    hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:highlight-weight`)
  );
  const highlightChance = clamp01(baseHighlightChance);
  const isHighlight = hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:highlight`) < highlightChance;
  const baseRadius = lerp(radiusRange[0], radiusRange[1], hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:radius`));
  const baseOpacity = lerp(opacityRange[0], opacityRange[1], hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:opacity`));
  const radiusMultiplier = isHighlight
    ? lerp(
      clampNumber(highlightConfig.radiusMultiplierRange && highlightConfig.radiusMultiplierRange[0], 1.8),
      clampNumber(highlightConfig.radiusMultiplierRange && highlightConfig.radiusMultiplierRange[1], 3.0),
      hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:highlight-radius`)
    )
    : 1;
  const opacityBoost = isHighlight
    ? lerp(
      clampNumber(highlightConfig.opacityBoostRange && highlightConfig.opacityBoostRange[0], 0.08),
      clampNumber(highlightConfig.opacityBoostRange && highlightConfig.opacityBoostRange[1], 0.22),
      hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:highlight-opacity`)
    )
    : 0;
  const haloOpacity = isHighlight
    ? lerp(
      clampNumber(highlightConfig.haloOpacityRange && highlightConfig.haloOpacityRange[0], 0.06),
      clampNumber(highlightConfig.haloOpacityRange && highlightConfig.haloOpacityRange[1], 0.18),
      hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:halo-opacity`)
    )
    : 0;
  const haloRadiusMultiplier = isHighlight
    ? lerp(
      clampNumber(highlightConfig.haloRadiusMultiplierRange && highlightConfig.haloRadiusMultiplierRange[0], 2.8),
      clampNumber(highlightConfig.haloRadiusMultiplierRange && highlightConfig.haloRadiusMultiplierRange[1], 5.2),
      hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:halo-radius`)
    )
    : 0;
  const scoreBase = hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:score`);
  const ordinalPenalty = ordinal * 0.11;
  const score = Math.max(0, scoreBase - ordinalPenalty);
  return Object.freeze({
    id: `${region.id}:star:${cellX}:${cellY}:${ordinal}`,
    regionId: region.id,
    cellX,
    cellY,
    ordinal,
    xW,
    yW,
    radiusPx: baseRadius * radiusMultiplier,
    opacity: clamp01(baseOpacity + opacityBoost),
    color: String(palette[paletteIndex] || palette[0] || "#ffffff"),
    depthBand: String(band.id || "mid"),
    parallaxRatio: clamp01(clampNumber(band.parallaxRatio, 0.22)),
    isHighlight,
    haloOpacity,
    haloRadiusPx: isHighlight ? (baseRadius * haloRadiusMultiplier) : 0,
    insideCore,
    insideEnvelope,
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
  config = STARS_FIELD_CONFIG,
} = {}) {
  const safeRegions = Array.isArray(regions) ? regions : [];
  const regionAreas = safeRegions.map((region = {}) => {
    const box = region && region.boundaryBox ? region.boundaryBox : null;
    return Math.max(1, clampNumber(box && box.widthW, 0) * clampNumber(box && box.heightW, 0));
  });
  const totalArea = regionAreas.reduce((sum, area) => sum + area, 0) || 1;
  const selectedStars = [];
  for (const region of safeRegions) {
    const boundaryBox = region && region.boundaryBox ? region.boundaryBox : null;
    const worldPoints = Array.isArray(region && region.worldPoints) ? region.worldPoints : [];
    if (!boundaryBox || worldPoints.length < 3) continue;
    const area = Math.max(0, clampNumber(boundaryBox.widthW, 0) * clampNumber(boundaryBox.heightW, 0));
    if (area < Math.max(1, clampNumber(config.minRegionAreaW2, 64000))) continue;
    const generationBox = buildGenerationBox(region, config);
    if (!generationBox) continue;
    const generationRegion = Object.freeze({
      ...region,
      generationBox,
    });
    const regionArea = Math.max(1, clampNumber(boundaryBox.widthW, 0) * clampNumber(boundaryBox.heightW, 0));
    const regionTargetCount = Math.max(
      1,
      Math.round((Math.max(1, clampNumber(config.targetStarCount, 3000)) * regionArea) / totalArea)
    );
    const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 420));
    const cols = Math.max(1, Math.ceil(clampNumber(generationBox.widthW, 0) / cellSize));
    const rows = Math.max(1, Math.ceil(clampNumber(generationBox.heightW, 0) / cellSize));
    const coreCandidates = [];
    const marginCandidates = [];
    const candidateOrdinals = Math.max(1, Math.floor(clampNumber(config.candidateOrdinals, 4)));
    for (let cy = 0; cy < rows; cy += 1) {
      for (let cx = 0; cx < cols; cx += 1) {
        for (let ordinal = 0; ordinal < candidateOrdinals; ordinal += 1) {
          const star = buildStarCandidate(generationRegion, cx, cy, ordinal, config);
          if (!star) continue;
          if (star.insideCore) {
            coreCandidates.push(star);
          } else {
            marginCandidates.push(star);
          }
        }
      }
    }
    const coreTargetCount = Math.min(
      coreCandidates.length,
      Math.round(regionTargetCount * clamp01(clampNumber(config.coreSpendRatio, 0.88)))
    );
    const marginCapCount = Math.min(
      marginCandidates.length,
      Math.round(regionTargetCount * clamp01(clampNumber(config.marginSpendRatioMax, 0.12)))
    );
    const selectedCore = selectStratifiedCandidates(coreCandidates, coreTargetCount);
    const selectedMargin = selectStratifiedCandidates(
      marginCandidates,
      Math.min(marginCapCount, Math.max(0, regionTargetCount - selectedCore.length))
    );
    const remainingCount = Math.max(0, regionTargetCount - selectedCore.length - selectedMargin.length);
    if (remainingCount > 0) {
      const selectedIds = new Set([...selectedCore, ...selectedMargin].map((star) => star.id));
      const remainingCore = coreCandidates.filter((star) => !selectedIds.has(star.id));
      const supplementalCore = selectStratifiedCandidates(remainingCore, remainingCount);
      const remainingAfterCore = Math.max(0, remainingCount - supplementalCore.length);
      const supplementalMargin = remainingAfterCore > 0
        ? selectStratifiedCandidates(
          marginCandidates.filter((star) => !selectedIds.has(star.id) && !supplementalCore.some((extra) => extra.id === star.id)),
          remainingAfterCore
        )
        : [];
      selectedStars.push(...selectedCore, ...selectedMargin, ...supplementalCore, ...supplementalMargin);
    } else {
      selectedStars.push(...selectedCore, ...selectedMargin);
    }
  }

  return Object.freeze({
    kind: "stars_field",
    config,
    regions: Object.freeze(safeRegions),
    stars: Object.freeze(selectedStars.map((star) => Object.freeze({
      id: star.id,
      regionId: star.regionId,
      xW: star.xW,
      yW: star.yW,
      radiusPx: star.radiusPx,
      opacity: star.opacity,
      color: star.color,
      depthBand: star.depthBand,
      parallaxRatio: star.parallaxRatio,
      isHighlight: star.isHighlight,
      haloOpacity: star.haloOpacity,
      haloRadiusPx: star.haloRadiusPx,
    }))),
  });
}

export function selectVisibleStars(starsFieldModel = null, viewport = {}) {
  const stars = Array.isArray(starsFieldModel && starsFieldModel.stars) ? starsFieldModel.stars : [];
  const leftXW = clampNumber(viewport.leftXW, 0);
  const rightXW = clampNumber(viewport.rightXW, 0);
  const topYW = clampNumber(viewport.topYW, 0);
  const bottomYW = clampNumber(viewport.bottomYW, 0);
  if (!(rightXW > leftXW) || !(bottomYW > topYW)) return Object.freeze(stars.slice());
  return Object.freeze(stars.filter((star = {}) => {
    const xW = clampNumber(star.xW, 0);
    const yW = clampNumber(star.yW, 0);
    return xW >= leftXW && xW <= rightXW && yW >= topYW && yW <= bottomYW;
  }));
}
