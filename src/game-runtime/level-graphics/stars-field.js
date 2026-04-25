import { STARS_FIELD_CONFIG } from "./stars-field.config.js";

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

function buildStar(region, cellX, cellY, ordinal, config) {
  const band = chooseDepthBand(`${region.id}:${cellX}:${cellY}:${ordinal}:${config.seedSalt}`, config.depthBands);
  if (!band) return null;
  const boundaryBox = region && region.boundaryBox ? region.boundaryBox : null;
  if (!boundaryBox) return null;
  const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 420));
  const jitterRatio = Math.max(0, Math.min(1, clampNumber(config.jitterRatio, 0.42)));
  const maxJitter = Math.min(cellSize * jitterRatio, Math.max(0, clampNumber(config.maxJitterW, 140)));
  const baseX = clampNumber(boundaryBox.leftXW, 0) + ((cellX + 0.5) * cellSize);
  const baseY = clampNumber(boundaryBox.topYW, 0) + ((cellY + 0.5) * cellSize);
  const jitterX = lerp(-maxJitter, maxJitter, hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:jx`));
  const jitterY = lerp(-maxJitter, maxJitter, hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:jy`));
  const xW = baseX + jitterX;
  const yW = baseY + jitterY;
  if (!pointInPolygon(xW, yW, region.worldPoints)) return null;
  const radiusRange = Array.isArray(band.radiusRangePx) ? band.radiusRangePx : [1, 2];
  const opacityRange = Array.isArray(band.opacityRange) ? band.opacityRange : [0.2, 0.5];
  const palette = Array.isArray(band.palette) ? band.palette : ["#ffffff"];
  const paletteIndex = Math.min(
    palette.length - 1,
    Math.floor(hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:palette`) * palette.length)
  );
  return Object.freeze({
    id: `${region.id}:star:${cellX}:${cellY}:${ordinal}`,
    regionId: region.id,
    xW,
    yW,
    radiusPx: lerp(radiusRange[0], radiusRange[1], hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:radius`)),
    opacity: lerp(opacityRange[0], opacityRange[1], hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:opacity`)),
    color: String(palette[paletteIndex] || palette[0] || "#ffffff"),
    depthBand: String(band.id || "mid"),
  });
}

export function buildStarsFieldModel({
  regions = [],
  config = STARS_FIELD_CONFIG,
} = {}) {
  const safeRegions = Array.isArray(regions) ? regions : [];
  const stars = [];
  for (const region of safeRegions) {
    const boundaryBox = region && region.boundaryBox ? region.boundaryBox : null;
    const worldPoints = Array.isArray(region && region.worldPoints) ? region.worldPoints : [];
    if (!boundaryBox || worldPoints.length < 3) continue;
    const area = Math.max(0, clampNumber(boundaryBox.widthW, 0) * clampNumber(boundaryBox.heightW, 0));
    if (area < Math.max(1, clampNumber(config.minRegionAreaW2, 64000))) continue;
    const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 420));
    const cols = Math.max(1, Math.ceil(clampNumber(boundaryBox.widthW, 0) / cellSize));
    const rows = Math.max(1, Math.ceil(clampNumber(boundaryBox.heightW, 0) / cellSize));
    for (let cy = 0; cy < rows; cy += 1) {
      for (let cx = 0; cx < cols; cx += 1) {
        const densitySeed = `${config.seedSalt}:${region.id}:${cx}:${cy}:density`;
        const primary = hashToUnit(`${densitySeed}:primary`);
        if (primary >= Math.max(0, Math.min(1, clampNumber(config.primaryDensityThreshold, 0.48)))) {
          const star = buildStar(region, cx, cy, 0, config);
          if (star) stars.push(star);
        }
        const secondary = hashToUnit(`${densitySeed}:secondary`);
        if (secondary >= Math.max(0, Math.min(1, clampNumber(config.secondaryDensityThreshold, 0.84)))) {
          const extraStar = buildStar(region, cx, cy, 1, config);
          if (extraStar) stars.push(extraStar);
        }
      }
    }
  }

  return Object.freeze({
    kind: "stars_field",
    config,
    regions: Object.freeze(safeRegions),
    stars: Object.freeze(stars),
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

