import {
  LEVEL_SVG_LAYER_ART,
  LEVEL_SVG_LAYER_BOUNDS,
  LEVEL_SVG_LAYER_CAMERA_BOUNDS,
  LEVEL_SVG_LAYER_DEPTHS,
  LEVEL_SVG_LAYER_FIELDS,
  LEVEL_SVG_LAYER_GLOBES,
  LEVEL_SVG_LAYER_PROPS,
  LEVEL_SVG_LAYER_SPAWNS,
} from "../../../game-runtime/level/normalize-level-definition.js";

const ORB_HANGAR_MAP_ASSET_URL = new URL("./orb-hangar.map.svg", import.meta.url).toString();

const ORB_HANGAR_WORLD_ITEM_SPAWNS = Object.freeze([]);

const ORB_HANGAR_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "orb_hangar_ground_plane_fallback",
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

export const ORB_HANGAR = Object.freeze({
  id: "orb-hangar",
  label: "Orb Hangar",
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
    deadzoneWidthRatio: 0.42,
    deadzoneHeightRatio: 0.28,
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
    assetUrl: ORB_HANGAR_MAP_ASSET_URL,
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
      boundary: Object.freeze([LEVEL_SVG_LAYER_BOUNDS]),
      cameraBounds: Object.freeze([LEVEL_SVG_LAYER_CAMERA_BOUNDS]),
      spawns: Object.freeze([LEVEL_SVG_LAYER_SPAWNS]),
      cameras: Object.freeze([]),
      depths: Object.freeze([LEVEL_SVG_LAYER_DEPTHS]),
      worldItems: Object.freeze([LEVEL_SVG_LAYER_GLOBES]),
      props: Object.freeze([LEVEL_SVG_LAYER_PROPS]),
      art: Object.freeze([LEVEL_SVG_LAYER_ART]),
      fields: Object.freeze([LEVEL_SVG_LAYER_FIELDS]),
    }),
    primarySpawn: Object.freeze({
      id: "spawn_01",
    }),
  }),
  elements: Object.freeze({
    boundaries: ORB_HANGAR_BOUNDARIES,
    worldItemSpawns: ORB_HANGAR_WORLD_ITEM_SPAWNS,
  }),
});
