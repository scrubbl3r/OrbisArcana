import { createStageRuntimeAdapterCore } from "../stage-runtime-adapter-core.js";
import { applyAuthoredStarsFieldParallax } from "../authored-level-overlay.js?v=20260424j";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatRect(rect = null) {
  if (!rect) return "none";
  return [
    Math.round(safeNum(rect.left, 0)),
    Math.round(safeNum(rect.top, 0)),
    Math.round(safeNum(rect.width, 0)),
    Math.round(safeNum(rect.height, 0)),
  ].join(",");
}

function formatSvgBox(box = null) {
  if (!box) return "none";
  return [
    Math.round(safeNum(box.x, 0)),
    Math.round(safeNum(box.y, 0)),
    Math.round(safeNum(box.width, 0)),
    Math.round(safeNum(box.height, 0)),
  ].join(",");
}

function traceStarsVisibility(state, refs, { camLeft = 0, camTop = 0, zoom = 1 } = {}) {
  if (!state || typeof state.traceLog !== "function" || !refs || !refs.worldOverlay) return;
  if ((state.traceStarsVisibilityCount || 0) >= 3) return;
  state.traceStarsVisibilityCount = (state.traceStarsVisibilityCount || 0) + 1;

  const overlayEl = refs.worldOverlay;
  const firstBand = overlayEl.querySelector("[data-stars-band]");
  const firstStar = overlayEl.querySelector("[data-star-id]");
  const overlayRect = typeof overlayEl.getBoundingClientRect === "function"
    ? overlayEl.getBoundingClientRect()
    : null;
  const bandRect = firstBand && typeof firstBand.getBoundingClientRect === "function"
    ? firstBand.getBoundingClientRect()
    : null;
  const starRect = firstStar && typeof firstStar.getBoundingClientRect === "function"
    ? firstStar.getBoundingClientRect()
    : null;
  const bandBox = firstBand && typeof firstBand.getBBox === "function"
    ? firstBand.getBBox()
    : null;
  const starStyle = firstStar && globalThis.window && typeof globalThis.window.getComputedStyle === "function"
    ? globalThis.window.getComputedStyle(firstStar)
    : null;
  const overlayStyle = overlayEl && globalThis.window && typeof globalThis.window.getComputedStyle === "function"
    ? globalThis.window.getComputedStyle(overlayEl)
    : null;

  state.traceLog([
    "stars.trace visibility",
    `cam=${Math.round(safeNum(camLeft, 0))},${Math.round(safeNum(camTop, 0))}`,
    `zoom=${Number(zoom || 1).toFixed(2)}`,
    `bands=${overlayEl.querySelectorAll("[data-stars-band]").length}`,
    `stars=${overlayEl.querySelectorAll("[data-star-id]").length}`,
    `bandTransform=${firstBand ? String(firstBand.getAttribute("transform") || "") : "none"}`,
    `star=${firstStar ? `${firstStar.getAttribute("cx")},${firstStar.getAttribute("cy")},r=${firstStar.getAttribute("r")}` : "none"}`,
    `overlayRect=${formatRect(overlayRect)}`,
    `bandRect=${formatRect(bandRect)}`,
    `starRect=${formatRect(starRect)}`,
    `bandBox=${formatSvgBox(bandBox)}`,
    `starStyle=${firstStar ? `${starStyle ? starStyle.display : "na"}/${starStyle ? starStyle.visibility : "na"}/${starStyle ? starStyle.opacity : "na"}` : "none"}`,
    `overlayStyle=${overlayStyle ? `${overlayStyle.display}/${overlayStyle.visibility}/${overlayStyle.opacity}` : "na"}`,
  ].join(" | "));
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
      traceStarsVisibility(state, refs, {
        camLeft: Number(camLeft || 0),
        camTop: Number(camTop || 0),
        zoom: Number(zoom || state.previewZoom),
      });
    },
    dispose() {
      unbindResize();
    },
  });
}
