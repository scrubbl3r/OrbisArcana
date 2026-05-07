export const CANONICAL_LEVEL_IDS = Object.freeze([
  "reactor-shaft",
  "orb-hangar",
]);

export const DEFAULT_LEVEL_INSPECTION_ID = CANONICAL_LEVEL_IDS[0];

export const EXPECTED_LEVEL_SEMANTIC_LAYERS = Object.freeze([
  Object.freeze({
    levelId: "reactor-shaft",
    key: "spawns",
    labels: Object.freeze(["spawns"]),
  }),
  Object.freeze({
    levelId: "orb-hangar",
    key: "art",
    labels: Object.freeze(["art"]),
  }),
  Object.freeze({
    levelId: "orb-hangar",
    key: "fields",
    labels: Object.freeze(["fields"]),
  }),
]);

export const EXPECTED_LEVEL_WORLD_SIZES = Object.freeze({
  "reactor-shaft": Object.freeze({
    widthPx: 8192,
    heightPx: 8192,
  }),
  "orb-hangar": Object.freeze({
    widthPx: 8192,
    heightPx: 8192,
  }),
});

export const EXPECTED_LEVEL_SVG_REPORTS = Object.freeze({
  "reactor-shaft": Object.freeze({
    levelId: "reactor-shaft",
    loopCount: 1,
    cameraBoundaryLoopCount: 1,
    spawnMarkerCount: 1,
    worldItemSpawnCount: 2,
    propCount: 1,
    lineArtShapeCount: 1,
    starsFieldRegionCount: 0,
    depthLayerCount: 1,
    occupiedTileCount: 204,
  }),
  "orb-hangar": Object.freeze({
    levelId: "orb-hangar",
    loopCount: 1,
    cameraBoundaryLoopCount: 1,
    spawnMarkerCount: 1,
    worldItemSpawnCount: 2,
    propCount: 0,
    lineArtShapeCount: 0,
    starsFieldRegionCount: 0,
    depthLayerCount: 1,
    occupiedTileCount: 56,
  }),
});
