import { createGameStageRuntimeAdapter } from "../game-stage/game-stage-runtime-adapter.js?v=20260516d";

const ORB_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

const ORB_STAGE_REF_KEYS = Object.freeze([
  "root",
  "stage",
  "physStage",
  "depth3dLayer",
  "world",
  "worldOverlay",
  "labelMeta",
  "depthReadout",
  "deathPanel",
  "tryAgainBtn",
]);

function collectOrbStageRefs(sourceRefs = {}, keys = ORB_STAGE_REF_KEYS) {
  return keys.reduce((acc, key) => {
    acc[key] = sourceRefs[key] || null;
    return acc;
  }, {});
}

export function createOrbStageRuntimeAdapter({
  refs = {},
  level = null,
  state = null,
  depth3dRuntime = null,
  orbDiameterWorldUnits = ORB_STAGE_ORB_DIAMETER_WORLD_UNITS,
  unbindResize = () => {},
} = {}) {
  const stageRefs = Object.freeze(collectOrbStageRefs(refs));
  const gameStageAdapter = createGameStageRuntimeAdapter({
    refs: stageRefs,
    level,
    state,
    depth3dRuntime,
    orbDiameterWorldUnits,
    unbindResize,
  });

  return Object.freeze({
    ...gameStageAdapter,
    applyOrbTransform(args = {}) {
      if (typeof gameStageAdapter.applyOrbTransform === "function") {
        gameStageAdapter.applyOrbTransform(args);
      }
    },
    getStageElements() {
      return Object.freeze(gameStageAdapter.getStageElements());
    },
  });
}
