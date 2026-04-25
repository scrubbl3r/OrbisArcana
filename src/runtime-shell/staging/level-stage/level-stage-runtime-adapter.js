import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { applyAuthoredStarsFieldParallax } from "../authored-level-overlay.js?v=20260424n";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

function intersectsRect(a = {}, b = {}) {
  return (
    Number(a.left || 0) < Number(b.right || 0) &&
    Number(a.right || 0) > Number(b.left || 0) &&
    Number(a.top || 0) < Number(b.bottom || 0) &&
    Number(a.bottom || 0) > Number(b.top || 0)
  );
}

function traceVisibleStars(refs = {}, state = null, { camLeft = 0, camTop = 0 } = {}) {
  const pushLogLine = state && typeof state.pushLogLine === "function" ? state.pushLogLine : null;
  if (!pushLogLine || !refs || !refs.physStage || !refs.worldOverlay) return;
  const now = Date.now();
  if (Number(state.starsVisibleTraceCount || 0) >= 8) return;
  if (Number(state.starsVisibleTraceLastAtMs || 0) && (now - Number(state.starsVisibleTraceLastAtMs || 0)) < 500) return;
  const stageRect = typeof refs.physStage.getBoundingClientRect === "function"
    ? refs.physStage.getBoundingClientRect()
    : null;
  if (!stageRect || !(stageRect.width > 0) || !(stageRect.height > 0)) return;
  const starEls = Array.from(refs.worldOverlay.querySelectorAll("[data-star-id][data-star-origin]"));
  let visibleCore = 0;
  let visibleMargin = 0;
  for (const starEl of starEls) {
    if (!starEl || typeof starEl.getBoundingClientRect !== "function") continue;
    const rect = starEl.getBoundingClientRect();
    if (!intersectsRect(rect, stageRect)) continue;
    const origin = String(starEl.getAttribute("data-star-origin") || "").trim().toLowerCase();
    if (origin === "margin") visibleMargin += 1;
    else visibleCore += 1;
  }
  state.starsVisibleTraceLastAtMs = now;
  state.starsVisibleTraceCount = Number(state.starsVisibleTraceCount || 0) + 1;
  pushLogLine(
    `TRACE stars.visible core:${visibleCore} margin:${visibleMargin} total:${visibleCore + visibleMargin} cam:${Math.round(Number(camLeft || 0))},${Math.round(Number(camTop || 0))}`,
    "warn"
  );
}

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
      state.externalCameraAuthority = true;
      refs.world.style.setProperty("--level-world-width", `${state.worldWidthPx}px`);
      refs.world.style.setProperty("--level-world-height", `${state.worldHeightPx}px`);
      refs.world.style.setProperty("--level-world-zoom", `${Number(zoom || state.previewZoom)}`);
      refs.world.style.setProperty("--level-world-x", `${(-Number(camLeft || 0) * Number(zoom || state.previewZoom)).toFixed(2)}px`);
      refs.world.style.setProperty("--level-world-y", `${(-Number(camTop || 0) * Number(zoom || state.previewZoom)).toFixed(2)}px`);
      applyAuthoredStarsFieldParallax(state.starsParallaxRefs, {
        camLeft: Number(camLeft || 0),
        camTop: Number(camTop || 0),
      });
      traceVisibleStars(refs, state, {
        camLeft: Number(camLeft || 0),
        camTop: Number(camTop || 0),
      });
    },
    dispose() {
      unbindResize();
    },
  });
}
