import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { createDomOrbStageAdapter } from "../dom-orb-stage-adapter.js";
import { resolveLevelWorldSize } from "../../../game-runtime/level/resolve-level-world-size.js";
import {
  captureAuthoredStarsFieldParallaxRefs,
} from "../../../game-runtime/stage/authored-level-overlay.js?v=20260506a";
import { applyAuthoredStageCameraVars } from "../../../game-runtime/stage/authored-stage-frame.js";

export function createOrbStageRuntimeAdapter({ refs = {}, level = null, buildOverlayMarkup = () => "" } = {}) {
  const localBackdropState = Object.create(null);
  const levelWorldSize = resolveLevelWorldSize(level);
  const stageRefs = Object.freeze({
    root: refs.root || null,
    physStage: refs.physStage || null,
    world: refs.world || null,
    worldOverlay: refs.worldOverlay || null,
    orbWrap: refs.orbWrap || null,
    orb: refs.orb || null,
    orbInterior: refs.orbInterior || null,
    orbCracks: refs.orbCracks || null,
    orbShards: refs.orbShards || null,
    testGlobe: refs.testGlobe || null,
    shield: refs.shield || null,
    shockLayer: refs.shockLayer || null,
    flameLayer: refs.flameLayer || null,
    electricLayer: refs.electricLayer || null,
    deathPanel: refs.deathPanel || null,
    tryAgainBtn: refs.tryAgainBtn || null,
  });

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
    getOrbVisualRefs() {
      return Object.freeze({
        orbWrap: stageRefs.orbWrap,
        orb: stageRefs.orb,
        orbInterior: stageRefs.orbInterior,
        orbCracks: stageRefs.orbCracks,
        orbShards: stageRefs.orbShards,
        shield: stageRefs.shield,
        shockLayer: stageRefs.shockLayer,
        flameLayer: stageRefs.flameLayer,
        electricLayer: stageRefs.electricLayer,
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
      const nextArtShapes = (Array.isArray(artShapes) ? artShapes : []).slice();
      const nextArtKey = nextArtShapes.map((shape = {}) => String(shape.id || "")).join("|");
      const worldWidth = Math.max(1, Number(runtime && runtime.frameMetrics && runtime.frameMetrics.worldWidthPx) || levelWorldSize.widthPx);
      const worldHeight = Math.max(1, Number(runtime && runtime.frameMetrics && runtime.frameMetrics.worldHeightPx) || levelWorldSize.heightPx);

      if (stageBackdrop.artKey !== nextArtKey) {
        stageBackdrop.artShapes = nextArtShapes;
        stageBackdrop.artKey = nextArtKey;
        stageRefs.worldOverlay.innerHTML = buildOverlayMarkup(nextArtShapes, null, {
          worldWidthPx: worldWidth,
          worldHeightPx: worldHeight,
        });
        stageBackdrop.starsParallaxRefs = captureAuthoredStarsFieldParallaxRefs(stageRefs.worldOverlay);
      }

      if (stageBackdrop.width !== width || stageBackdrop.height !== height) {
        stageBackdrop.width = width;
        stageBackdrop.height = height;
      }
      stageRefs.worldOverlay.setAttribute("viewBox", `0 0 ${worldWidth} ${worldHeight}`);
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
        starsParallaxRefs: localBackdropState.starsParallaxRefs,
        worldWidthPx,
        worldHeightPx,
        camLeft,
        camTop,
        zoom,
        viewportWidthPx: Math.max(0, Number(localBackdropState.width) || 0),
        viewportHeightPx: Math.max(0, Number(localBackdropState.height) || 0),
      });
    },
  });
}
