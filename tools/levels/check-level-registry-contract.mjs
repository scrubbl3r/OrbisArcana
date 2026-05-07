import assert from "node:assert/strict";
import { LEVELS, LEVELS_BY_ID, getLevelById } from "../../src/content/levels/registry.js";
import {
  CANONICAL_LEVEL_IDS,
  DEPRECATED_LEVEL_SEMANTIC_LAYER_KEYS,
  EXPECTED_LEVEL_SEMANTIC_LAYERS,
} from "./level-contract-fixtures.mjs";
import {
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  LEVEL_CAMERA_INITIAL_TARGET_FALLBACK,
  LEVEL_CAMERA_MODE_GAMEPLAY,
  LEVEL_CAMERA_MODE_PREVIEW,
  LEVEL_POINT_Y_MODE_FALLBACK,
  LEVEL_STAGE_BOX_HEIGHT_FALLBACK_PX,
  LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX,
  LEVEL_STAGE_PREVIEW_ZOOM_FALLBACK,
  LEVEL_SVG_DEPTH_MATERIAL_FALLBACK,
  LEVEL_SVG_DEPTH_TESSELLATION_FALLBACK,
  LEVEL_SVG_METADATA_SCALE_MODE_FIXED,
  LEVEL_SVG_METADATA_SCALE_MODE_ORB,
  LEVEL_SVG_METADATA_Z_MODE_ORB,
  LEVEL_SVG_METADATA_Z_MODE_WORLD,
  LEVEL_SVG_PROP_ANCHOR_CENTER,
  LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE,
  LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_MANUAL,
  LEVEL_WORLD_ITEM_Z_MODE_FALLBACK,
  normalizeLevelDefinition,
} from "../../src/game-runtime/level/normalize-level-definition.js";
import { normalizeLevelWorldItemSpawn } from "../../src/game-runtime/level/normalize-level-world-item-spawn.js";

assert.deepEqual(
  LEVELS.map((level) => level.id),
  CANONICAL_LEVEL_IDS,
  "registry should expose the canonical level order"
);
assert.equal(getLevelById("missing-level"), null, "unknown level ids should resolve to null");

for (const id of CANONICAL_LEVEL_IDS) {
  const level = LEVELS_BY_ID[id];
  assert.ok(level, `${id} should be addressable through LEVELS_BY_ID`);
  assert.equal(getLevelById(id), level, `${id} should be addressable through getLevelById`);
  assert.equal(Object.isFrozen(level), true, `${id} should be normalized and frozen`);
  assert.equal(Object.isFrozen(level.mapSource), true, `${id} mapSource should be frozen`);
  assert.equal(Object.isFrozen(level.mapSource.semanticLayers), true, `${id} semanticLayers should be frozen`);
  assert.equal(Object.isFrozen(level.mapSource.primarySpawn), true, `${id} primarySpawn should be frozen`);
  assert.equal(level.mapSource.primarySpawn.id, "spawn_01", `${id} should expose canonical primary spawn id`);
  assert.equal(Object.hasOwn(level.mapSource, "spawnMarker"), false, `${id} should not expose deprecated spawnMarker config`);
}

for (const expectation of EXPECTED_LEVEL_SEMANTIC_LAYERS) {
  const level = getLevelById(expectation.levelId);
  assert.deepEqual(
    level && level.mapSource && level.mapSource.semanticLayers && level.mapSource.semanticLayers[expectation.key],
    expectation.labels,
    `${expectation.levelId} should expose normalized ${expectation.key} labels`
  );
}
for (const id of CANONICAL_LEVEL_IDS) {
  const semanticLayers = getLevelById(id).mapSource.semanticLayers;
  for (const key of DEPRECATED_LEVEL_SEMANTIC_LAYER_KEYS) {
    assert.equal(
      Object.hasOwn(semanticLayers, key),
      false,
      `${id} normalized semanticLayers should not expose deprecated ${key} alias`
    );
  }
}
assert.deepEqual(
  normalizeLevelDefinition({}).stage,
  {
    panelHeightPx: LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX,
    levelBoxHeightPx: LEVEL_STAGE_BOX_HEIGHT_FALLBACK_PX,
    previewZoom: LEVEL_STAGE_PREVIEW_ZOOM_FALLBACK,
  },
  "normalized stage fallback should use named stage defaults"
);
assert.equal(
  normalizeLevelDefinition({}).camera.previewFollowMode,
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  "normalized preview follow mode should use named camera fallback"
);
assert.equal(
  normalizeLevelDefinition({}).camera.gameplayFollowMode,
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  "normalized gameplay follow mode should use named camera fallback"
);
assert.equal(
  normalizeLevelDefinition({}).camera.initialTarget,
  LEVEL_CAMERA_INITIAL_TARGET_FALLBACK,
  "normalized camera initial target should use named camera fallback"
);
assert.equal(LEVEL_CAMERA_MODE_PREVIEW, "preview", "camera preview mode name should stay stable");
assert.equal(LEVEL_CAMERA_MODE_GAMEPLAY, "gameplay", "camera gameplay mode name should stay stable");
assert.equal(
  normalizeLevelDefinition({}).spawn.yMode,
  LEVEL_POINT_Y_MODE_FALLBACK,
  "normalized spawn yMode should use named point fallback"
);
assert.equal(
  normalizeLevelWorldItemSpawn({
    kind: LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
    xNorm: 0.5,
    yW: 10,
  }).zMode,
  LEVEL_WORLD_ITEM_Z_MODE_FALLBACK,
  "normalized world item zMode should use named fallback"
);
assert.equal(
  normalizeLevelWorldItemSpawn({
    kind: LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
    xNorm: 0.5,
    yW: 10,
  }).regenTrigger,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
  "emitter regen trigger should use named fallback"
);
assert.equal(
  normalizeLevelWorldItemSpawn({
    kind: LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE,
    xNorm: 0.5,
    yW: 10,
  }).regenTrigger,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_MANUAL,
  "non-emitter regen trigger should use named fallback"
);
assert.equal(LEVEL_SVG_METADATA_Z_MODE_ORB, "orb", "svg orb z-mode name should stay stable");
assert.equal(LEVEL_SVG_METADATA_Z_MODE_WORLD, "world", "svg world z-mode name should stay stable");
assert.equal(LEVEL_SVG_METADATA_SCALE_MODE_FIXED, "fixed", "svg fixed scale-mode name should stay stable");
assert.equal(LEVEL_SVG_METADATA_SCALE_MODE_ORB, "orb", "svg orb scale-mode name should stay stable");
assert.equal(LEVEL_SVG_PROP_ANCHOR_CENTER, "center", "svg prop center anchor should stay stable");
assert.equal(LEVEL_SVG_DEPTH_MATERIAL_FALLBACK, "graphite", "svg depth material fallback should stay stable");
assert.equal(LEVEL_SVG_DEPTH_TESSELLATION_FALLBACK, 24, "svg depth tessellation fallback should stay stable");

console.log("level-registry contract ok");
