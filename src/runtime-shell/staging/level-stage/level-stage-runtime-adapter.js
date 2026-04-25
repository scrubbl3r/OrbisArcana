import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { applyAuthoredStarsFieldParallax } from "../authored-level-overlay.js?v=20260424i";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

export function createLevelStageRuntimeAdapter({
  refs = {},
  level = null,
  state = null,
  unbindResize = () => {},
} = {}) {
  const core = createStageRuntimeAdapterCore({
    refs,
    level,
    state,
    getOrbWrapPosition: ({ top = 0, left = "50%", xW = null, yW = null } = {}) => {
      if (Number.isFinite(Number(xW)) && Number.isFinite(Number(yW))) {
        return {
          left: `${Number(xW).toFixed(2)}px`,
          transform: `translate(-50%, ${Math.max(0, Number(yW) - (LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS * 0.5)).toFixed(2)}px)`,
        };
      }
      return {
        left: (typeof left === "number")
          ? `${Number(left || 0).toFixed(2)}px`
          : String(left || "50%"),
        transform: `translate(-50%, ${Number(top || 0).toFixed(2)}px)`,
      };
    },
  });
  return Object.freeze({
    ...core,
    getSpawnMarker() {
      return state && state.spawn ? state.spawn : null;
    },
    getPreviewZoom() {
      return state ? state.previewZoom : 0;
    },
    getPreviewFollowMode() {
      return state ? state.previewFollowMode : "";
    },
    applyCameraFrame({
      camLeft = 0,
      camTop = 0,
      zoom = state && state.previewZoom,
    } = {}) {
      if (!refs.world || !state) return;
      refs.world.style.setProperty("--level-world-width", `${state.worldWidthPx}px`);
      refs.world.style.setProperty("--level-world-height", `${state.worldHeightPx}px`);
      refs.world.style.setProperty("--level-world-zoom", `${Number(zoom || state.previewZoom)}`);
      refs.world.style.setProperty("--level-world-x", `${(-Number(camLeft || 0) * Number(zoom || state.previewZoom)).toFixed(2)}px`);
      refs.world.style.setProperty("--level-world-y", `${(-Number(camTop || 0) * Number(zoom || state.previewZoom)).toFixed(2)}px`);
      const parallaxSummary = applyAuthoredStarsFieldParallax(state.starsParallaxRefs, {
        camLeft: Number(camLeft || 0),
        camTop: Number(camTop || 0),
      });
      if (state && typeof state.traceLog === "function" && (state.traceAdapterCount || 0) < 3) {
        state.traceAdapterCount = (state.traceAdapterCount || 0) + 1;
        const firstBand = parallaxSummary && parallaxSummary.firstBand ? parallaxSummary.firstBand : null;
        state.traceLog(
          [
            "stars.trace adapter",
            `cam=${Math.round(Number(camLeft) || 0)},${Math.round(Number(camTop) || 0)}`,
            `refs=${parallaxSummary && Number.isFinite(Number(parallaxSummary.count)) ? parallaxSummary.count : 0}`,
            `first=${firstBand ? `${firstBand.transform}:${firstBand.ratio.toFixed(2)}:base=${Math.round(firstBand.baseCamLeft)},${Math.round(firstBand.baseCamTop)}` : "none"}`,
          ].join(" | ")
        );
      }
    },
    dispose() {
      unbindResize();
    },
  });
}
