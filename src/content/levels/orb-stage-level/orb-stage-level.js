const ORB_STAGE_LEVEL_TERRAIN_PROFILE = Object.freeze([
  { xNorm: 0.00, yOff: 72 },
  { xNorm: 0.10, yOff: 96 },
  { xNorm: 0.22, yOff: 58 },
  { xNorm: 0.34, yOff: 118 },
  { xNorm: 0.48, yOff: 70 },
  { xNorm: 0.60, yOff: 108 },
  { xNorm: 0.74, yOff: 62 },
  { xNorm: 0.86, yOff: 102 },
  { xNorm: 1.00, yOff: 80 },
]);

const ORB_STAGE_LEVEL_WORLD_ITEM_SPAWNS = Object.freeze([
  Object.freeze({
    id: "orb_stage_level_globe_emitter_01",
    kind: "energy_globe_emitter",
    spawn: Object.freeze({
      xNorm: 0.50,
      yMode: "ground_center_offset",
      yValue: -960,
      r: 25,
    }),
    capacity: 1,
    regenTrigger: "globe_spent",
  }),
]);

const ORB_STAGE_LEVEL_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "orb_stage_level_ground_plane_main",
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
  }),
  camera: Object.freeze({
    previewZoom: 1,
    gameplayZoom: 1,
    previewFollowMode: "follow_target_center",
    gameplayFollowMode: "follow_target_center",
    initialTarget: "spawn",
  }),
  world: Object.freeze({
    widthPx: 1000,
    heightPx: 2000,
  }),
  terrainProfile: ORB_STAGE_LEVEL_TERRAIN_PROFILE,
  elements: Object.freeze({
    boundaries: ORB_STAGE_LEVEL_BOUNDARIES,
    worldItemSpawns: ORB_STAGE_LEVEL_WORLD_ITEM_SPAWNS,
  }),
  boundaries: ORB_STAGE_LEVEL_BOUNDARIES,
  worldItemSpawns: ORB_STAGE_LEVEL_WORLD_ITEM_SPAWNS,
});
