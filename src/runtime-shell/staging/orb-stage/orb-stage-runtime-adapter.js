import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { createDomOrbStageAdapter } from "../dom-orb-stage-adapter.js";
import { resolveLevelWorldSize } from "../../../game-runtime/level/resolve-level-world-size.js";
import {
  captureAuthoredStarsFieldParallaxRefs,
} from "../../../game-runtime/stage/authored-level-overlay.js?v=20260506a";
import { applyAuthoredStageCameraVars } from "../../../game-runtime/stage/authored-stage-frame.js";

const ORB_STAGE_REF_KEYS = Object.freeze([
  "root",
  "physStage",
  "world",
  "worldOverlay",
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

function resolveOrbStageBackdropWorldSize(runtime = null, levelWorldSize = {}) {
  const frameMetrics = runtime && runtime.frameMetrics ? runtime.frameMetrics : null;
  return {
    widthPx: Math.max(1, Number(frameMetrics && frameMetrics.worldWidthPx) || levelWorldSize.widthPx),
    heightPx: Math.max(1, Number(frameMetrics && frameMetrics.worldHeightPx) || levelWorldSize.heightPx),
  };
}

function buildOrbStageArtKey(artShapes = []) {
  return (Array.isArray(artShapes) ? artShapes : [])
    .map((shape = {}) => String(shape.id || ""))
    .join("|");
}

export function createOrbStageRuntimeAdapter({ refs = {}, level = null, buildOverlayMarkup = () => "" } = {}) {
  const localBackdropState = Object.create(null);
  let activeBackdropState = localBackdropState;
  const levelWorldSize = resolveLevelWorldSize(level);
  const stageRefs = Object.freeze(collectOrbStageRefs(refs));

  const core = createStageRuntimeAdapterCore({
    refs: stageRefs,
    level,
  });
  const domOrbAdapter = createDomOrbStageAdapter({
    refs: stageRefs,
    getOrbWrapPosition: ({ top = 0, left = "50%" } = {}) => ({
      left: (typeof left === "number")
        ? `${Number(left || 0).toFixed(2)}px`
        : String(left || "50%"),
      transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
    }),
  });

  return Object.freeze({
    ...core,
    applyOrbTransform: domOrbAdapter.applyOrbTransform,
    renderOrbDamageVisuals: domOrbAdapter.renderOrbDamageVisuals,
    createOrbShatterController: domOrbAdapter.createOrbShatterController,
    getStageElements() {
      return Object.freeze({
        ...core.getStageElements(),
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
      artShapes = [],
    } = {}) {
      if (!runtime || !stageRefs.world || !stageRefs.worldOverlay || !rect) return;
      const width = Math.max(1, Math.floor(Number(rect.width) || 0));
      const height = Math.max(1, Math.floor(Number(rect.height) || 0));
      const stageBackdrop = runtime.stageBackdrop || (runtime.stageBackdrop = localBackdropState);
      activeBackdropState = stageBackdrop;
      const nextArtShapes = (Array.isArray(artShapes) ? artShapes : []).slice();
      const nextArtKey = buildOrbStageArtKey(nextArtShapes);
      const worldSize = resolveOrbStageBackdropWorldSize(runtime, levelWorldSize);

      if (stageBackdrop.artKey !== nextArtKey) {
        stageBackdrop.artShapes = nextArtShapes;
        stageBackdrop.artKey = nextArtKey;
        stageRefs.worldOverlay.innerHTML = buildOverlayMarkup({
          starsField: null,
          loops: [],
          artShapes: nextArtShapes,
          worldWidthPx: worldSize.widthPx,
          worldHeightPx: worldSize.heightPx,
        });
        stageBackdrop.starsParallaxRefs = captureAuthoredStarsFieldParallaxRefs(stageRefs.worldOverlay);
      }

      if (stageBackdrop.width !== width || stageBackdrop.height !== height) {
        stageBackdrop.width = width;
        stageBackdrop.height = height;
      }
      stageRefs.worldOverlay.setAttribute("viewBox", `0 0 ${worldSize.widthPx} ${worldSize.heightPx}`);
    },
    applyCameraFrame({
      camLeft = 0,
      camTop = 0,
      zoom = 1,
      worldWidthPx = levelWorldSize.widthPx,
      worldHeightPx = levelWorldSize.heightPx,
    } = {}) {
      if (!stageRefs.world) return;
      applyAuthoredStageCameraVars({
        refs: stageRefs,
        starsParallaxRefs: activeBackdropState.starsParallaxRefs,
        worldWidthPx,
        worldHeightPx,
        camLeft,
        camTop,
        zoom,
        viewportWidthPx: Math.max(0, Number(activeBackdropState.width) || 0),
        viewportHeightPx: Math.max(0, Number(activeBackdropState.height) || 0),
      });
    },
  });
}
