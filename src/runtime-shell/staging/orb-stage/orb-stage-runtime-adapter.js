import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";

export function createOrbStageRuntimeAdapter({ refs = {}, level = null, buildOverlayMarkup = () => "" } = {}) {
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
    getOrbWrapPosition: ({ top = 0, left = "50%" } = {}) => ({
      left: (typeof left === "number")
        ? `${Number(left || 0).toFixed(2)}px`
        : String(left || "50%"),
      transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
    }),
  });

  return Object.freeze({
    ...core,
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
      lineArtShapes = [],
    } = {}) {
      if (!runtime || !stageRefs.world || !stageRefs.worldOverlay || !rect) return;
      const width = Math.max(1, Math.floor(Number(rect.width) || 0));
      const height = Math.max(1, Math.floor(Number(rect.height) || 0));
      const stageBackdrop = runtime.stageBackdrop || (runtime.stageBackdrop = Object.create(null));
      const nextLineArtShapes = Array.isArray(lineArtShapes) ? lineArtShapes.slice() : [];
      const nextLineArtKey = nextLineArtShapes.map((shape = {}) => String(shape.id || "")).join("|");
      const worldWidth = Math.max(1, Number(runtime && runtime.frameMetrics && runtime.frameMetrics.worldWidthPx) || 2048);
      const worldHeight = Math.max(1, Number(runtime && runtime.frameMetrics && runtime.frameMetrics.worldHeightPx) || 2048);

      if (stageBackdrop.lineArtKey !== nextLineArtKey) {
        stageBackdrop.lineArtShapes = nextLineArtShapes;
        stageBackdrop.lineArtKey = nextLineArtKey;
        stageRefs.worldOverlay.innerHTML = buildOverlayMarkup(nextLineArtShapes);
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
      worldWidthPx = 2048,
      worldHeightPx = 2048,
    } = {}) {
      if (!stageRefs.world) return;
      stageRefs.world.style.setProperty("--orb-stage-world-width", `${Math.max(1, Number(worldWidthPx) || 2048)}px`);
      stageRefs.world.style.setProperty("--orb-stage-world-height", `${Math.max(1, Number(worldHeightPx) || 2048)}px`);
      stageRefs.world.style.setProperty("--orb-stage-world-x", `${(-Number(camLeft || 0) * Number(zoom || 1)).toFixed(2)}px`);
      stageRefs.world.style.setProperty("--orb-stage-world-y", `${(-Number(camTop || 0) * Number(zoom || 1)).toFixed(2)}px`);
      stageRefs.world.style.setProperty("--orb-stage-world-zoom", `${Number(zoom || 1)}`);
      stageRefs.world.style.setProperty("--stage-camera-shift-x", `${(Number(camLeft || 0) * Number(zoom || 1)).toFixed(2)}px`);
      stageRefs.world.style.setProperty("--stage-camera-shift-y", `${(Number(camTop || 0) * Number(zoom || 1)).toFixed(2)}px`);
    },
  });
}
