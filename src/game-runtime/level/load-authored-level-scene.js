import { buildLevelGraphicsModel } from "../level-graphics/build-level-graphics-model.js?v=20260508a";
import { buildAuthoredLevelSceneModel } from "./authored-level-scene-model.js";
import { normalizeLevelDefinition } from "./normalize-level-definition.js";
import { buildSvgLevelSummaryOptions } from "./svg-level-summary-options.js";
import { summarizeSvgLevelSource } from "./svg-level-source.js?v=20260508b";

const IN_FLIGHT_AUTHORED_LEVEL_SCENE_LOADS = new Map();

function authoredLevelSceneLoadKey({
  assetUrl = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
} = {}) {
  return [
    String(assetUrl || "").trim(),
    Math.max(0, Number(worldWidthPx) || 0),
    Math.max(0, Number(worldHeightPx) || 0),
  ].join("|");
}

async function loadAuthoredLevelSceneUncached({
  level = null,
  worldWidthPx = 0,
  worldHeightPx = 0,
  fetchImpl = globalThis.fetch,
  assetUrl = "",
  mapSource = null,
} = {}) {
  let fetchUrl = assetUrl;
  try {
    const url = new URL(assetUrl, globalThis.location && globalThis.location.href || undefined);
    url.searchParams.set("_oa_svg_v", String(Date.now()));
    fetchUrl = url.toString();
  } catch (_) {
    fetchUrl = assetUrl;
  }
  const response = await fetchImpl(fetchUrl, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Level SVG fetch failed: ${response.status}`);
  }

  const svgText = await response.text();
  const summary = summarizeSvgLevelSource(buildSvgLevelSummaryOptions({
    svgText,
    mapSource,
    worldWidthPx,
    worldHeightPx,
  }));

  const sceneModel = buildAuthoredLevelSceneModel({
    level,
    summary,
    worldWidthPx,
    worldHeightPx,
    groundCenterWorld: () => worldHeightPx * 0.5,
  });
  const levelGraphicsModel = buildLevelGraphicsModel({
    summary,
    sceneModel,
  });

  return Object.freeze({
    assetUrl,
    svgText,
    summary,
    sceneModel,
    levelGraphicsModel,
  });
}

export async function loadAuthoredLevelScene({
  level = null,
  worldWidthPx = 0,
  worldHeightPx = 0,
  fetchImpl = globalThis.fetch,
} = {}) {
  const normalizedLevel = level && typeof level === "object" ? normalizeLevelDefinition(level) : null;
  const mapSource = normalizedLevel && typeof normalizedLevel.mapSource === "object" ? normalizedLevel.mapSource : null;
  const assetUrl = String(mapSource && mapSource.assetUrl || "").trim();
  if (!mapSource || !assetUrl || typeof fetchImpl !== "function") return null;

  const loadKey = authoredLevelSceneLoadKey({
    assetUrl,
    worldWidthPx,
    worldHeightPx,
  });
  if (IN_FLIGHT_AUTHORED_LEVEL_SCENE_LOADS.has(loadKey)) {
    return IN_FLIGHT_AUTHORED_LEVEL_SCENE_LOADS.get(loadKey);
  }
  const loadPromise = loadAuthoredLevelSceneUncached({
    level: normalizedLevel,
    worldWidthPx,
    worldHeightPx,
    fetchImpl,
    assetUrl,
    mapSource,
  }).finally(() => {
    IN_FLIGHT_AUTHORED_LEVEL_SCENE_LOADS.delete(loadKey);
  });
  IN_FLIGHT_AUTHORED_LEVEL_SCENE_LOADS.set(loadKey, loadPromise);
  return loadPromise;
}
