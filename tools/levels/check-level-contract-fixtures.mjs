import assert from "node:assert/strict";
import {
  CANONICAL_LEVEL_IDS,
  DEFAULT_LEVEL_INSPECTION_ID,
  EXPECTED_LEVEL_SEMANTIC_LAYERS,
  EXPECTED_LEVEL_SVG_REPORTS,
  EXPECTED_LEVEL_WORLD_SIZES,
} from "./level-contract-fixtures.mjs";

assert.ok(
  CANONICAL_LEVEL_IDS.includes(DEFAULT_LEVEL_INSPECTION_ID),
  "default inspection level should be one of the canonical levels"
);

for (const id of CANONICAL_LEVEL_IDS) {
  assert.ok(EXPECTED_LEVEL_WORLD_SIZES[id], `${id} should have an expected world size fixture`);
  assert.ok(EXPECTED_LEVEL_SVG_REPORTS[id], `${id} should have an expected SVG report fixture`);
  assert.equal(
    EXPECTED_LEVEL_SVG_REPORTS[id].levelId,
    id,
    `${id} SVG report fixture should identify the same level id`
  );
}

for (const expectation of EXPECTED_LEVEL_SEMANTIC_LAYERS) {
  assert.ok(
    CANONICAL_LEVEL_IDS.includes(expectation.levelId),
    `${expectation.levelId} semantic layer fixture should target a canonical level`
  );
  assert.ok(expectation.key, `${expectation.levelId} semantic layer fixture should name a layer key`);
  assert.ok(
    Array.isArray(expectation.labels),
    `${expectation.levelId} ${expectation.key} semantic layer fixture should provide labels`
  );
}

console.log("level-contract fixtures ok");
