import assert from "node:assert/strict";
import { buildAuthoredLevelOverlayMarkup } from "../../src/game-runtime/stage/authored-level-overlay.js";

const markup = buildAuthoredLevelOverlayMarkup({
  lineArtShapes: [
    Object.freeze({
      id: "art_fixture_01",
      worldPoints: Object.freeze([
        Object.freeze({ xW: 10, yW: 20 }),
        Object.freeze({ xW: 30, yW: 40 }),
      ]),
      fill: "none",
      fillOpacity: 1,
      stroke: "#fff",
      strokeOpacity: 0.75,
      worldStrokeWidth: 2,
    }),
  ],
});

assert.match(markup, /class="authoredArtPath gameStageArtPath"/, "authored art paths should use canonical art classes");
assert.match(markup, /data-authored-art-id="art_fixture_01"/, "authored art paths should expose canonical art ids");
assert.doesNotMatch(markup, /LineArt|line-art|line_art/, "authored art overlay markup should not expose line-art naming");

console.log("authored-level-overlay contract ok");
