import assert from "node:assert/strict";
import {
  summarizeSvgLevelSource,
} from "../../src/game-runtime/level/svg-level-source.js";
import {
  LEVEL_SVG_LAYER_ART,
  LEVEL_SVG_LAYER_BOUNDS,
  LEVEL_SVG_LAYER_FIELDS,
  LEVEL_SVG_LAYER_GLOBES,
  LEVEL_SVG_LAYER_PROPS,
  LEVEL_SVG_LAYER_SPAWNS,
} from "../../src/game-runtime/level/normalize-level-definition.js";

const SVG_CONTRACT_FIXTURE = `
<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
  viewBox="0 0 100 100">
  <g id="bounds" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_BOUNDS}">
    <path id="bounds_path" d="M 10 10 L 90 10 L 90 90 L 10 90 Z" />
  </g>
  <g id="spawns" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_SPAWNS}">
    <circle id="spawn_01" cx="20" cy="80" r="4" />
  </g>
  <g id="art_visible" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_ART}">
    <path id="art_visible_path" d="M 15 15 L 35 35" style="fill:none;stroke:#fff;stroke-width:2" />
  </g>
  <g id="art_hidden" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_ART}" style="display:none">
    <path id="art_hidden_path" d="M 40 40 L 60 60" style="fill:none;stroke:#fff;stroke-width:2" />
  </g>
  <g id="fields_visible" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_FIELDS}">
    <rect id="field_visible_rect" x="10" y="10" width="30" height="30" />
  </g>
  <g id="fields_hidden" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_FIELDS}" style="visibility:hidden">
    <rect id="field_hidden_rect" x="50" y="10" width="30" height="30" />
  </g>
  <g id="globes_visible" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_GLOBES}">
    <circle id="globe_visible" cx="70" cy="70" r="4" />
  </g>
  <g id="globes_hidden" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_GLOBES}" display="none">
    <circle id="globe_hidden" cx="80" cy="80" r="4" />
  </g>
  <g id="props_visible" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_PROPS}">
    <rect id="plinth_visible" x="20" y="50" width="10" height="10" />
  </g>
  <g id="props_hidden" inkscape:groupmode="layer" inkscape:label="${LEVEL_SVG_LAYER_PROPS}" style="display:none">
    <rect id="plinth_hidden" x="40" y="50" width="10" height="10" />
  </g>
  <g id="depth_visible" inkscape:groupmode="layer" inkscape:label="depth:visible max=2bo z=1bo">
    <rect id="depth_visible_rect" x="5" y="5" width="20" height="20" />
  </g>
  <g id="depth_hidden" inkscape:groupmode="layer" inkscape:label="depth:hidden max=2bo z=1bo" style="display:none">
    <rect id="depth_hidden_rect" x="30" y="5" width="20" height="20" />
  </g>
</svg>`;

const summary = summarizeSvgLevelSource({
  svgText: SVG_CONTRACT_FIXTURE,
  worldWidthPx: 1000,
  worldHeightPx: 1000,
  boundaryLayerLabels: [LEVEL_SVG_LAYER_BOUNDS],
  spawnLayerLabels: [LEVEL_SVG_LAYER_SPAWNS],
  worldItemLayerLabels: [LEVEL_SVG_LAYER_GLOBES],
  propLayerLabels: [LEVEL_SVG_LAYER_PROPS],
  lineArtLayerLabels: [LEVEL_SVG_LAYER_ART],
  starsFieldLayerLabels: [LEVEL_SVG_LAYER_FIELDS],
  spawnMarkerId: "spawn_01",
  tileSizePx: 100,
});

assert.equal(summary.loopCount, 1, "visible bounds layer should hydrate");
assert.deepEqual(
  summary.spawnMarkers.map((spawn) => spawn.id),
  ["spawn_01"],
  "visible spawns layer should hydrate"
);
assert.deepEqual(
  summary.artShapes.map((shape) => shape.id),
  ["art_visible_path"],
  "hidden art layers must not hydrate authored art"
);
assert.deepEqual(
  summary.starsFieldRegions.map((region) => region.sourceLayerId),
  ["fields_visible"],
  "hidden fields layers must not hydrate stars field regions"
);
assert.deepEqual(
  summary.worldItemSpawns.map((spawn) => spawn.id),
  ["globe_visible"],
  "hidden globes layers must not hydrate world item spawns"
);
assert.deepEqual(
  summary.props.map((prop) => prop.id),
  ["plinth_visible"],
  "hidden props layers must not hydrate props"
);
assert.deepEqual(
  summary.depthLayers.map((layer) => layer.id),
  ["visible"],
  "hidden depth layers must not hydrate depth surfaces"
);

console.log("svg-level-source contract ok");
