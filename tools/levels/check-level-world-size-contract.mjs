import assert from "node:assert/strict";
import { getLevelById } from "../../src/content/levels/registry.js";
import {
  CANONICAL_LEVEL_IDS,
  EXPECTED_LEVEL_WORLD_SIZES,
} from "./level-contract-fixtures.mjs";
import {
  LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
  normalizeLevelDefinition,
} from "../../src/game-runtime/level/normalize-level-definition.js";
import {
  LEVEL_WORLD_SIZE_FALLBACK_PX,
  resolveLevelWorldSize,
} from "../../src/game-runtime/level/resolve-level-world-size.js";

function assertWorldSize(label, level, expected) {
  assert.deepEqual(
    resolveLevelWorldSize(level),
    expected,
    `${label} should resolve world size through resolveLevelWorldSize`
  );
}

for (const id of CANONICAL_LEVEL_IDS) {
  assertWorldSize(id, getLevelById(id), EXPECTED_LEVEL_WORLD_SIZES[id]);
}

assertWorldSize("mapSource.scale priority", {
  world: {
    widthPx: 4096,
    heightPx: 4096,
  },
  mapSource: {
    authoringViewBox: {
      width: 2048,
      height: 2048,
    },
    scale: {
      worldWidthPx: 8192,
      worldHeightPx: 8192,
    },
  },
}, {
  widthPx: 8192,
  heightPx: 8192,
});

assertWorldSize("level.world fallback", {
  world: {
    widthPx: 4096,
    heightPx: 3072,
  },
  mapSource: {
    authoringViewBox: {
      width: 2048,
      height: 1024,
    },
  },
}, {
  widthPx: 4096,
  heightPx: 3072,
});

assertWorldSize("authoringViewBox fallback", {
  mapSource: {
    authoringViewBox: {
      width: 2048,
      height: 1024,
    },
  },
}, {
  widthPx: 2048,
  heightPx: 1024,
});

assertWorldSize("default fallback", {}, {
  widthPx: LEVEL_WORLD_SIZE_FALLBACK_PX,
  heightPx: LEVEL_WORLD_SIZE_FALLBACK_PX,
});

assert.deepEqual(
  normalizeLevelDefinition({}).world,
  {
    widthPx: LEVEL_WORLD_SIZE_FALLBACK_PX,
    heightPx: LEVEL_WORLD_SIZE_FALLBACK_PX,
  },
  "normalized level world fallback should match resolveLevelWorldSize fallback"
);
assert.deepEqual(
  normalizeLevelDefinition({}).mapSource.scale,
  {
    worldWidthPx: LEVEL_WORLD_SIZE_FALLBACK_PX,
    worldHeightPx: LEVEL_WORLD_SIZE_FALLBACK_PX,
    boundaryTileSizePx: LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
  },
  "normalized map scale fallback should match resolveLevelWorldSize fallback"
);

console.log("level-world-size contract ok");
