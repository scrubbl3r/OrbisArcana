const LEVEL_MVP_MAP_ASSET_URL = new URL("./level-mvp.svg", import.meta.url).toString();

const LEVEL_MVP_WORLD_ITEM_SPAWNS = Object.freeze([
  Object.freeze({
    id: "level_mvp_globe_emitter_01",
    kind: "energy_globe_emitter",
    spawn: Object.freeze({
      xNorm: 0.50,
      yMode: "ground_center_offset",
      yValue: -1000,
      r: 25,
    }),
    capacity: 1,
    regenTrigger: "globe_spent",
  }),
]);

const LEVEL_MVP_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "level_mvp_ground_plane_fallback",
    kind: "ground_plane",
    bottomPx: 140,
    stroke: Object.freeze({
      r: 214,
      g: 219,
      b: 230,
      a: 0.86,
      widthPx: 2,
    }),
  }),
]);

export const LEVEL_MVP = Object.freeze({
  id: "level-mvp",
  label: "Level MVP",
  stage: Object.freeze({
    panelHeightPx: 900,
    levelBoxHeightPx: 760,
    previewZoom: 1,
  }),
  camera: Object.freeze({
    previewZoom: 1,
    gameplayZoom: 1,
    previewFollowMode: "fixed_frame",
    gameplayFollowMode: "follow_target_soft",
    initialTarget: "spawn",
    deadzoneWidthPx: 240,
    deadzoneHeightPx: 160,
    fixedFrameAnchorId: "level_mvp_preview_frame",
    fixedFrameCenterXW: null,
    fixedFrameCenterYW: null,
  }),
  world: Object.freeze({
    widthPx: 8192,
    heightPx: 8192,
  }),
  mapSource: Object.freeze({
    kind: "svg_map_template",
    assetUrl: LEVEL_MVP_MAP_ASSET_URL,
    authoringViewBox: Object.freeze({
      x: 0,
      y: 0,
      width: 2048,
      height: 2048,
    }),
    scale: Object.freeze({
      worldWidthPx: 8192,
      worldHeightPx: 8192,
      boundaryTileSizePx: 128,
    }),
    semanticLayers: Object.freeze({
      boundary: Object.freeze(["bounds"]),
      spawn: Object.freeze(["spawn"]),
      camera: Object.freeze(["camera"]),
    }),
    spawnMarker: Object.freeze({
      id: "path2-9",
    }),
  }),
  elements: Object.freeze({
    boundaries: LEVEL_MVP_BOUNDARIES,
    worldItemSpawns: LEVEL_MVP_WORLD_ITEM_SPAWNS,
  }),
  boundaries: LEVEL_MVP_BOUNDARIES,
  worldItemSpawns: LEVEL_MVP_WORLD_ITEM_SPAWNS,
});
