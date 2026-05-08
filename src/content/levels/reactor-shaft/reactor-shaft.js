import {
  LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET,
  LEVEL_SVG_LAYER_ART,
  LEVEL_SVG_LAYER_BOUNDS,
  LEVEL_SVG_LAYER_CAMERA_BOUNDS,
  LEVEL_SVG_LAYER_CAMERAS,
  LEVEL_SVG_LAYER_DEPTHS,
  LEVEL_SVG_LAYER_FIELDS,
  LEVEL_SVG_LAYER_GLOBES,
  LEVEL_SVG_LAYER_ORB,
  LEVEL_SVG_LAYER_PROPS,
  LEVEL_SVG_LAYER_SPAWNS,
  LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
} from "../../../game-runtime/level/normalize-level-definition.js";

const REACTOR_SHAFT_MAP_ASSET_URL = new URL("./reactor-shaft.map.svg", import.meta.url).toString();

const REACTOR_SHAFT_WORLD_ITEM_SPAWNS = Object.freeze([
  Object.freeze({
    id: "reactor_shaft_globe_emitter_01",
    kind: LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
    spawn: Object.freeze({
      xNorm: 0.50,
      yMode: LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET,
      yValue: -1000,
      r: 25,
    }),
    capacity: 1,
    regenTrigger: LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
  }),
]);

const REACTOR_SHAFT_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "reactor_shaft_ground_plane_fallback",
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

export const REACTOR_SHAFT = Object.freeze({
  id: "reactor-shaft",
  label: "Reactor Shaft",
  stage: Object.freeze({
    panelHeightPx: 900,
    levelBoxHeightPx: 760,
    previewZoom: 1,
  }),
  camera: Object.freeze({
    previewZoom: 1,
    gameplayZoom: 1,
    previewFollowMode: "follow_target_soft",
    gameplayFollowMode: "follow_target_soft",
    initialTarget: "spawn",
    deadzoneWidthPx: -1,
    deadzoneHeightPx: -1,
    deadzoneWidthRatio: 0.40,
    deadzoneHeightRatio: 0.30,
    followLerpX: 0.16,
    followLerpY: 0.18,
    fixedFrameAnchorId: "path3",
    fixedFrameCenterXW: null,
    fixedFrameCenterYW: null,
  }),
  world: Object.freeze({
    widthPx: 8192,
    heightPx: 8192,
  }),
  spawn: Object.freeze({
    xW: 2172,
    yW: 7568.4544,
  }),
  mapSource: Object.freeze({
    kind: "svg_map_template",
    assetUrl: REACTOR_SHAFT_MAP_ASSET_URL,
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
      cameras: Object.freeze([LEVEL_SVG_LAYER_CAMERAS]),
      depths: Object.freeze([LEVEL_SVG_LAYER_DEPTHS]),
      worldItems: Object.freeze([LEVEL_SVG_LAYER_GLOBES]),
      props: Object.freeze([LEVEL_SVG_LAYER_PROPS]),
      art: Object.freeze([LEVEL_SVG_LAYER_ART]),
      fields: Object.freeze([LEVEL_SVG_LAYER_FIELDS]),
      orb: Object.freeze([LEVEL_SVG_LAYER_ORB]),
    }),
    primarySpawn: Object.freeze({
      id: "spawn_01",
    }),
  }),
  elements: Object.freeze({
    boundaries: REACTOR_SHAFT_BOUNDARIES,
    worldItemSpawns: REACTOR_SHAFT_WORLD_ITEM_SPAWNS,
  }),
});
