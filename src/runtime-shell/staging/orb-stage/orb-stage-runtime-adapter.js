import { createGameStageRuntimeAdapter } from "../game-stage/game-stage-runtime-adapter.js?v=20260506a";
import { createLegacyDomOrbStageAdapter } from "../legacy-dom-orb-stage-adapter.js";

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
  "orbWrap",
  "orb",
  "orbInterior",
  "orbCracks",
  "orbShards",
  "shield",
  "shockLayer",
  "flameLayer",
  "electricLayer",
  "deathPanel",
  "tryAgainBtn",
]);

const ORB_STAGE_LEGACY_DOM_ORB_REF_KEYS = Object.freeze([
  "orbWrap",
  "orb",
  "orbInterior",
  "orbCracks",
  "orbShards",
  "shield",
  "shockLayer",
  "flameLayer",
  "electricLayer",
]);

function collectOrbStageRefs(sourceRefs = {}, keys = ORB_STAGE_REF_KEYS) {
  return keys.reduce((acc, key) => {
    acc[key] = sourceRefs[key] || null;
    return acc;
  }, {});
}

function collectOrbStageLegacyDomRefs(stageRefs = {}) {
  return collectOrbStageRefs(stageRefs, ORB_STAGE_LEGACY_DOM_ORB_REF_KEYS);
}

function resolveOrbStageLegacyDomOrbWrapPosition({ top = 0, left = "50%" } = {}) {
  return {
    left: (typeof left === "number")
      ? `${Number(left || 0).toFixed(2)}px`
      : String(left || "50%"),
    transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
  };
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
  const orbStageLegacyDomAdapter = createLegacyDomOrbStageAdapter({
    refs: stageRefs,
    getOrbWrapPosition: resolveOrbStageLegacyDomOrbWrapPosition,
  });

  return Object.freeze({
    ...gameStageAdapter,
    applyOrbTransform(args = {}) {
      orbStageLegacyDomAdapter.applyLegacyDomOrbTransform(args);
      if (typeof gameStageAdapter.applyOrbTransform === "function") {
        gameStageAdapter.applyOrbTransform(args);
      }
    },
    renderLegacyDomOrbDamageVisuals: orbStageLegacyDomAdapter.renderLegacyDomOrbDamageVisuals,
    createLegacyDomOrbShatterController: orbStageLegacyDomAdapter.createLegacyDomOrbShatterController,
    getOrbStageLegacyDomElements() {
      return Object.freeze(collectOrbStageLegacyDomRefs(stageRefs));
    },
    getStageElements() {
      return Object.freeze(gameStageAdapter.getStageElements());
    },
  });
}
