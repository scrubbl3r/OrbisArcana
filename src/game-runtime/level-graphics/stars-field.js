import { STARS_FIELD_CONFIG } from "./stars-field.config.js?v=20260424d";

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

function smoothstep(t) {
  const safeT = clamp01(t);
  return safeT * safeT * (3 - (2 * safeT));
}

function sampleValueNoise2D(x = 0, y = 0, seed = "") {
  const cellX = Math.floor(Number(x) || 0);
  const cellY = Math.floor(Number(y) || 0);
  const localX = smoothstep((Number(x) || 0) - cellX);
  const localY = smoothstep((Number(y) || 0) - cellY);
  const s00 = hashToUnit(`${seed}:${cellX}:${cellY}`);
  const s10 = hashToUnit(`${seed}:${cellX + 1}:${cellY}`);
  const s01 = hashToUnit(`${seed}:${cellX}:${cellY + 1}`);
  const s11 = hashToUnit(`${seed}:${cellX + 1}:${cellY + 1}`);
  const top = lerp(s00, s10, localX);
  const bottom = lerp(s01, s11, localX);
  return lerp(top, bottom, localY);
}

function sampleDensityField(region, cellX, cellY, config) {
  const boundaryBox = region && region.generationBox
    ? region.generationBox
    : (region && region.boundaryBox ? region.boundaryBox : null);
  const densityField = config && config.densityField ? config.densityField : {};
  const clusterField = config && config.clusterField ? config.clusterField : {};
  if (!boundaryBox) return 0.5;
  const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 76));
  const sampleX = clampNumber(boundaryBox.leftXW, 0) + ((cellX + 0.5) * cellSize);
  const sampleY = clampNumber(boundaryBox.topYW, 0) + ((cellY + 0.5) * cellSize);
  const warpScaleW = Math.max(1, clampNumber(densityField.warpScaleW, 1280));
  const warpAmplitudeW = Math.max(0, clampNumber(densityField.warpAmplitudeW, 180));
  const warpX = lerp(
    -warpAmplitudeW,
    warpAmplitudeW,
    sampleValueNoise2D(
      sampleX / warpScaleW,
      sampleY / warpScaleW,
      `${config.seedSalt}:${region.id}:warp-x`
    )
  );
  const warpY = lerp(
    -warpAmplitudeW,
    warpAmplitudeW,
    sampleValueNoise2D(
      sampleX / warpScaleW,
      sampleY / warpScaleW,
      `${config.seedSalt}:${region.id}:warp-y`
    )
  );
  const warpedX = sampleX + warpX;
  const warpedY = sampleY + warpY;
  const lowScaleW = Math.max(1, clampNumber(densityField.lowFrequencyScaleW, 960));
  const midScaleW = Math.max(1, clampNumber(densityField.midFrequencyScaleW, 420));
  const lowWeight = clamp01(densityField.lowFrequencyWeight);
  const midWeight = clamp01(densityField.midFrequencyWeight);
  const lowNoise = sampleValueNoise2D(
    warpedX / lowScaleW,
    warpedY / lowScaleW,
    `${config.seedSalt}:${region.id}:density-low`
  );
  const midNoise = sampleValueNoise2D(
    warpedX / midScaleW,
    warpedY / midScaleW,
    `${config.seedSalt}:${region.id}:density-mid`
  );
  const combined = ((lowNoise * lowWeight) + (midNoise * midWeight)) / Math.max(0.0001, lowWeight + midWeight);
  const contrast = Math.max(0.1, clampNumber(densityField.contrast, 1.55));
  const floor = clamp01(densityField.floor);
  const ceiling = Math.max(floor, clamp01(densityField.ceiling || 1));
  const shaped = floor + ((ceiling - floor) * Math.pow(clamp01(combined), contrast));

  const largeScaleW = Math.max(1, clampNumber(clusterField.largeScaleW, 1680));
  const smallScaleW = Math.max(1, clampNumber(clusterField.smallScaleW, 760));
  const largeWeight = clamp01(clusterField.largeWeight);
  const smallWeight = clamp01(clusterField.smallWeight);
  const clusterNoise = (
    (sampleValueNoise2D(warpedX / largeScaleW, warpedY / largeScaleW, `${config.seedSalt}:${region.id}:cluster-large`) * largeWeight)
    + (sampleValueNoise2D(warpedX / smallScaleW, warpedY / smallScaleW, `${config.seedSalt}:${region.id}:cluster-small`) * smallWeight)
  ) / Math.max(0.0001, largeWeight + smallWeight);
  const clusterInfluence = clamp01(clusterField.influence);
  const density = clamp01((shaped * (1 - clusterInfluence)) + (clusterNoise * clusterInfluence));

  const clipBox = region && region.boundaryBox ? region.boundaryBox : null;
  const overscanW = Math.max(1, clampNumber(config.generationOverscanW, 2048));
  const overscanDensityRatio = clamp01(clampNumber(config.overscanDensityRatio, 0.22));
  if (!clipBox) return density;
  const dx = Math.max(
    0,
    clampNumber(clipBox.leftXW, 0) - sampleX,
    sampleX - clampNumber(clipBox.rightXW, 0)
  );
  const dy = Math.max(
    0,
    clampNumber(clipBox.topYW, 0) - sampleY,
    sampleY - clampNumber(clipBox.bottomYW, 0)
  );
  const distanceOutside = Math.max(dx, dy);
  const outsideT = smoothstep(clamp01(distanceOutside / overscanW));
  return clamp01(density * lerp(1, overscanDensityRatio, outsideT));
}

function buildGenerationBox(region = null, config = STARS_FIELD_CONFIG) {
  const boundaryBox = region && region.boundaryBox ? region.boundaryBox : null;
  if (!boundaryBox) return null;
  const overscanW = Math.max(0, clampNumber(config.generationOverscanW, 2048));
  const leftXW = clampNumber(boundaryBox.leftXW, 0) - overscanW;
  const topYW = clampNumber(boundaryBox.topYW, 0) - overscanW;
  const rightXW = clampNumber(boundaryBox.rightXW, 0) + overscanW;
  const bottomYW = clampNumber(boundaryBox.bottomYW, 0) + overscanW;
  return Object.freeze({
    leftXW,
    topYW,
    rightXW,
    bottomYW,
    widthW: Math.max(1, rightXW - leftXW),
    heightW: Math.max(1, bottomYW - topYW),
  });
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
  const radiusRange = Array.isArray(band.radiusRangePx) ? band.radiusRangePx : [1, 2];
  const opacityRange = Array.isArray(band.opacityRange) ? band.opacityRange : [0.2, 0.5];
  const palette = Array.isArray(band.palette) ? band.palette : ["#ffffff"];
  const paletteIndex = Math.min(
    palette.length - 1,
    Math.floor(hashToUnit(`${region.id}:${cellX}:${cellY}:${ordinal}:palette`) * palette.length)
  );
  const highlightConfig = config && config.highlight ? config.highlight : {};
  const densityFieldStrength = sampleDensityField(region, cellX, cellY, config);
  const baseHighlightChance = lerp(
    clamp01(highlightConfig.chanceRange && highlightConfig.chanceRange[0]),
    clamp01(highlightConfig.chanceRange && highlightConfig.chanceRange[1]),
    densityFieldStrength
  );
  const denseAreaMultiplier = Math.max(1, clampNumber(highlightConfig.denseAreaMultiplier, 1.9));
  const highlightChance = clamp01(baseHighlightChance * lerp(1, denseAreaMultiplier, densityFieldStrength));
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
  return Object.freeze({
    id: `${region.id}:star:${cellX}:${cellY}:${ordinal}`,
    regionId: region.id,
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
    const generationBox = buildGenerationBox(region, config);
    if (!generationBox) continue;
    const generationRegion = Object.freeze({
      ...region,
      generationBox,
    });
    const cellSize = Math.max(1, clampNumber(config.targetCellSizeW, 420));
    const cols = Math.max(1, Math.ceil(clampNumber(generationBox.widthW, 0) / cellSize));
    const rows = Math.max(1, Math.ceil(clampNumber(generationBox.heightW, 0) / cellSize));
    for (let cy = 0; cy < rows; cy += 1) {
      for (let cx = 0; cx < cols; cx += 1) {
        const density = sampleDensityField(generationRegion, cx, cy, config);
        const densitySeed = `${config.seedSalt}:${generationRegion.id}:${cx}:${cy}:density`;
        const spawnChances = config && config.spawnChances ? config.spawnChances : {};
        const primaryChance = lerp(
          clamp01(spawnChances.primary && spawnChances.primary[0]),
          clamp01(spawnChances.primary && spawnChances.primary[1]),
          density
        );
        if (hashToUnit(`${densitySeed}:primary`) < primaryChance) {
          const star = buildStar(generationRegion, cx, cy, 0, config);
          if (star) stars.push(star);
        }
        const secondaryChance = lerp(
          clamp01(spawnChances.secondary && spawnChances.secondary[0]),
          clamp01(spawnChances.secondary && spawnChances.secondary[1]),
          density
        );
        if (hashToUnit(`${densitySeed}:secondary`) < secondaryChance) {
          const extraStar = buildStar(generationRegion, cx, cy, 1, config);
          if (extraStar) stars.push(extraStar);
        }
        const tertiaryChance = lerp(
          clamp01(spawnChances.tertiary && spawnChances.tertiary[0]),
          clamp01(spawnChances.tertiary && spawnChances.tertiary[1]),
          density
        );
        if (hashToUnit(`${densitySeed}:tertiary`) < tertiaryChance) {
          const tertiaryStar = buildStar(generationRegion, cx, cy, 2, config);
          if (tertiaryStar) stars.push(tertiaryStar);
        }
        const quaternaryChance = lerp(
          clamp01(spawnChances.quaternary && spawnChances.quaternary[0]),
          clamp01(spawnChances.quaternary && spawnChances.quaternary[1]),
          density
        );
        if (hashToUnit(`${densitySeed}:quaternary`) < quaternaryChance) {
          const quaternaryStar = buildStar(generationRegion, cx, cy, 3, config);
          if (quaternaryStar) stars.push(quaternaryStar);
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
