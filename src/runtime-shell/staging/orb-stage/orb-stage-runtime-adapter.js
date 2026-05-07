import { createGameStageRuntimeAdapter } from "../game-stage/game-stage-runtime-adapter.js?v=20260506a";
import { createDomOrbStageAdapter as createLegacyDomOrbStageAdapter } from "../dom-orb-stage-adapter.js";

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

function collectLegacyDomOrbRefs(stageRefs = {}) {
  return collectOrbStageRefs(stageRefs, ORB_STAGE_LEGACY_DOM_ORB_REF_KEYS);
}

function resolveDomOrbWrapPosition({ top = 0, left = "50%" } = {}) {
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
  const shared3dAdapter = createGameStageRuntimeAdapter({
    refs: stageRefs,
    level,
    state,
    depth3dRuntime,
    orbDiameterWorldUnits,
    unbindResize,
  });
  const legacyDomOrbAdapter = createLegacyDomOrbStageAdapter({
    refs: stageRefs,
    getOrbWrapPosition: resolveDomOrbWrapPosition,
  });

  return Object.freeze({
    ...shared3dAdapter,
    applyOrbTransform(args = {}) {
      legacyDomOrbAdapter.applyOrbTransform(args);
      if (typeof shared3dAdapter.applyOrbTransform === "function") {
        shared3dAdapter.applyOrbTransform(args);
      }
    },
    renderOrbDamageVisuals: legacyDomOrbAdapter.renderOrbDamageVisuals,
    createOrbShatterController: legacyDomOrbAdapter.createOrbShatterController,
    getStageElements() {
      return Object.freeze({
        ...shared3dAdapter.getStageElements(),
        ...collectLegacyDomOrbRefs(stageRefs),
      });
    },
  });
}
