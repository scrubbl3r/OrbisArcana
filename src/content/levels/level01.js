const LEVEL01_TERRAIN_PROFILE = Object.freeze([
  { xNorm: 0.0, yOff: 58 },
  { xNorm: 1 / 9, yOff: 74 },
  { xNorm: 2 / 9, yOff: 52 },
  { xNorm: 3 / 9, yOff: 96 },
  { xNorm: 4 / 9, yOff: 66 },
  { xNorm: 5 / 9, yOff: 84 },
  { xNorm: 6 / 9, yOff: 61 },
  { xNorm: 7 / 9, yOff: 98 },
  { xNorm: 8 / 9, yOff: 76 },
  { xNorm: 1.0, yOff: 88 },
]);

const LEVEL01_WORLD_ITEM_SPAWNS = Object.freeze([
  Object.freeze({
    id: "level01_globe_emitter_01",
    kind: "energy_globe_emitter",
    spawn: Object.freeze({
      xNorm: 0.5,
      yMode: "ground_center_offset",
      yValue: -1000,
      r: 25,
    }),
    capacity: 1,
    regenTrigger: "globe_spent",
  }),
]);

const LEVEL01_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "level01_ground_plane_main",
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

const LEVEL01_ELEMENTS = Object.freeze({
  boundaries: LEVEL01_BOUNDARIES,
  worldItemSpawns: LEVEL01_WORLD_ITEM_SPAWNS,
});

export const LEVEL01 = Object.freeze({
  id: "level01",
  label: "Level 01",
  stage: Object.freeze({
    panelHeightPx: 800,
    levelBoxHeightPx: 640,
  }),
  world: Object.freeze({
    heightPx: 2000,
  }),
  elements: LEVEL01_ELEMENTS,
  terrainProfile: LEVEL01_TERRAIN_PROFILE,
  boundaries: LEVEL01_BOUNDARIES,
  worldItemSpawns: LEVEL01_WORLD_ITEM_SPAWNS,
});
