import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { createGameStageRuntimeAdapter } from "../game-stage/game-stage-runtime-adapter.js?v=20260506a";
import { createDomOrbStageAdapter } from "../dom-orb-stage-adapter.js";

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

const ORB_STAGE_VISUAL_REF_KEYS = Object.freeze([
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

function collectOrbStageVisualRefs(stageRefs = {}) {
  return collectOrbStageRefs(stageRefs, ORB_STAGE_VISUAL_REF_KEYS);
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
  const localBackdropState = Object.create(null);
  const stageRefs = Object.freeze(collectOrbStageRefs(refs));
  const legacyCore = createStageRuntimeAdapterCore({
    refs: stageRefs,
    level,
    state,
  });
  const shared3dAdapter = createGameStageRuntimeAdapter({
    refs: stageRefs,
    level,
    state,
    depth3dRuntime,
    orbDiameterWorldUnits,
    unbindResize,
  });
  const domOrbAdapter = createDomOrbStageAdapter({
    refs: stageRefs,
    getOrbWrapPosition: resolveDomOrbWrapPosition,
  });

  return Object.freeze({
    ...shared3dAdapter,
    applyOrbTransform(args = {}) {
      domOrbAdapter.applyOrbTransform(args);
      if (typeof shared3dAdapter.applyOrbTransform === "function") {
        shared3dAdapter.applyOrbTransform(args);
      }
    },
    renderOrbDamageVisuals: domOrbAdapter.renderOrbDamageVisuals,
    createOrbShatterController: domOrbAdapter.createOrbShatterController,
    getStageElements() {
      return Object.freeze({
        ...legacyCore.getStageElements(),
        ...collectOrbStageVisualRefs(stageRefs),
      });
    },
    getOrbVisualRefs() {
      return Object.freeze({
        ...collectOrbStageVisualRefs(stageRefs),
        deathPanel: stageRefs.deathPanel,
      });
    },
    ensureBackdrop({
      runtime = null,
      rect = null,
    } = {}) {
      if (!runtime || !rect) return;
      const width = Math.max(1, Math.floor(Number(rect.width) || 0));
      const height = Math.max(1, Math.floor(Number(rect.height) || 0));
      const stageBackdrop = runtime.stageBackdrop || (runtime.stageBackdrop = localBackdropState);
      if (stageBackdrop.width !== width || stageBackdrop.height !== height) {
        stageBackdrop.width = width;
        stageBackdrop.height = height;
      }
    },
  });
}
