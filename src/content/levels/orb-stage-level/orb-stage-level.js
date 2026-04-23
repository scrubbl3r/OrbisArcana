const ORB_STAGE_MAP_ASSET_URL = new URL("./orb-stage.svg", import.meta.url).toString();

const ORB_STAGE_LEVEL_WORLD_ITEM_SPAWNS = Object.freeze([]);

const ORB_STAGE_LEVEL_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "orb_stage_level_ground_plane_fallback",
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

export const ORB_STAGE_LEVEL = Object.freeze({
  id: "orb-stage-level",
  label: "Orb Stage Level",
  stage: Object.freeze({
    panelHeightPx: 800,
    levelBoxHeightPx: 640,
    previewZoom: 1,
  }),
  camera: Object.freeze({
    previewZoom: 1,
    gameplayZoom: 1,
    previewFollowMode: "follow_target_soft",
    gameplayFollowMode: "follow_target_soft",
    initialTarget: "spawn",
    screenAnchorX: 0.5,
    screenAnchorY: 0.72,
    deadzoneWidthPx: -1,
    deadzoneHeightPx: -1,
    deadzoneWidthRatio: 0,
    deadzoneHeightRatio: 0.22,
    followLerpX: 0.16,
    followLerpY: 0.18,
    clampInsetLeftPx: 0,
    clampInsetRightPx: 0,
    clampInsetTopPx: 0,
    clampInsetBottomPx: 0,
    fixedFrameAnchorId: "",
    fixedFrameCenterXW: null,
    fixedFrameCenterYW: null,
  }),
  world: Object.freeze({
    widthPx: 8192,
    heightPx: 8192,
  }),
  spawn: Object.freeze({
    xW: 4174,
    yW: 6040,
  }),
  mapSource: Object.freeze({
    kind: "svg_map_template",
    assetUrl: ORB_STAGE_MAP_ASSET_URL,
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
      camera: Object.freeze(["camera_01"]),
      viewFloor: Object.freeze(["view_floor"]),
      worldItems: Object.freeze(["globe_1", "globe_2"]),
      lineArt: Object.freeze(["line_art"]),
    }),
    spawnMarker: Object.freeze({
      id: "path2-9",
    }),
  }),
  elements: Object.freeze({
    boundaries: ORB_STAGE_LEVEL_BOUNDARIES,
    worldItemSpawns: ORB_STAGE_LEVEL_WORLD_ITEM_SPAWNS,
  }),
  boundaries: ORB_STAGE_LEVEL_BOUNDARIES,
  worldItemSpawns: ORB_STAGE_LEVEL_WORLD_ITEM_SPAWNS,
});
