import { createOrbShatterRuntimeController } from "../../../game-runtime/orb/orb-shatter-runtime.js";
import { normalizeLevelWorldItemSpawn } from "../../../game-runtime/level/normalize-level-world-item-spawn.js";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;

function lineToPath(seg) {
  if (!seg || !seg.a || !seg.b) return "";
  return `M ${Number(seg.a.x).toFixed(2)} ${Number(seg.a.y).toFixed(2)} L ${Number(seg.b.x).toFixed(2)} ${Number(seg.b.y).toFixed(2)}`;
}

export function createLevelStageRuntimeAdapter({
  refs = {},
  level = null,
  state = null,
  unbindResize = () => {},
  traceLevelStage = () => {},
  formatLevelStageTracePair = () => "0,0",
  updateLevelCamera = () => {},
} = {}) {
  return Object.freeze({
    refs,
    level,
    getStageElements() {
      return {
        physStage: refs.physStage || null,
        groundLine: null,
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
      };
    },
    getStageRect() {
      if (!refs.physStage || typeof refs.physStage.getBoundingClientRect !== "function") {
        return { width: 0, height: 0 };
      }
      return refs.physStage.getBoundingClientRect();
    },
    getWorldItemSpawns() {
      if (Array.isArray(level && level.elements && level.elements.worldItemSpawns)) {
        return level.elements.worldItemSpawns;
      }
      return Array.isArray(level && level.worldItemSpawns) ? level.worldItemSpawns : [];
    },
    getPrimaryGlobeEl() {
      return refs.testGlobe || null;
    },
    setPrimaryGlobeEl(el) {
      refs.testGlobe = el || null;
    },
    normalizeWorldItemSpawn(item, options = {}) {
      return normalizeLevelWorldItemSpawn(item, options);
    },
    pickupScreenY(yW, { camTop = 0 } = {}) {
      return Number(yW || 0) - Number(camTop || 0);
    },
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
    },
    applyOrbTransform({
      top = 0,
      left = "50%",
      xW = null,
      yW = null,
    } = {}) {
      if (!refs.orbWrap) return;
      if (Number.isFinite(Number(xW)) && Number.isFinite(Number(yW))) {
        refs.orbWrap.style.left = `${Number(xW).toFixed(2)}px`;
        refs.orbWrap.style.transform = `translate(-50%, ${Math.max(0, Number(yW) - (LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS * 0.5)).toFixed(2)}px)`;
        return;
      }
      const nextLeft = (typeof left === "number")
        ? `${Number(left || 0).toFixed(2)}px`
        : String(left || "50%");
      refs.orbWrap.style.left = nextLeft;
      refs.orbWrap.style.transform = `translate(-50%, ${Number(top || 0).toFixed(2)}px)`;
    },
    renderOrbDamageVisuals({
      fx = null,
    } = {}) {
      if (!refs.orb || !refs.orbCracks) return;
      const shattered = !!(fx && fx.visualState === "shattered");
      refs.orb.classList.toggle("shattered", shattered);
      refs.orb.style.opacity = shattered ? "0" : "";
      const shardStyle = fx && fx.shardStyle && typeof fx.shardStyle === "object" ? fx.shardStyle : null;
      const shardRgb = shardStyle && shardStyle.strokeRgb ? shardStyle.strokeRgb : null;
      const shardStroke = shardRgb
        ? `rgb(${Math.round(Number(shardRgb.r) || 0)},${Math.round(Number(shardRgb.g) || 0)},${Math.round(Number(shardRgb.b) || 0)})`
        : "";
      const shardAlpha = shardStyle && Number.isFinite(Number(shardStyle.strokeAlpha))
        ? Math.max(0, Math.min(1, Number(shardStyle.strokeAlpha)))
        : null;
      const shardStrokeWidth = shardStyle && Number.isFinite(Number(shardStyle.strokeWidthPx))
        ? Math.max(0.25, Number(shardStyle.strokeWidthPx))
        : null;
      const crackSegments = (!shattered && Array.isArray(fx && fx.crackSegments))
        ? fx.crackSegments
        : [];
      refs.orbCracks.innerHTML = crackSegments.map((seg) => {
        const d = lineToPath(seg);
        if (!d) return "";
        const style = [
          shardStroke ? `stroke:${shardStroke}` : "",
          shardAlpha != null ? `stroke-opacity:${shardAlpha.toFixed(3)}` : "",
          shardStrokeWidth != null ? `stroke-width:${shardStrokeWidth.toFixed(2)}px` : "",
        ].filter(Boolean).join(";");
        const attrs = [`d="${d}"`, style ? `style="${style}"` : ""].filter(Boolean).join(" ");
        return `<path ${attrs} />`;
      }).join("");
    },
    openDeathOverlay() {
      if (!refs.deathPanel) return;
      refs.deathPanel.classList.remove("off");
      refs.deathPanel.setAttribute("aria-hidden", "false");
    },
    closeDeathOverlay() {
      if (!refs.deathPanel) return;
      refs.deathPanel.classList.add("off");
      refs.deathPanel.setAttribute("aria-hidden", "true");
    },
    createOrbShatterController({
      root = refs.root,
      getOrbShatterRuntime = () => null,
      getOrbColorState = () => null,
      getBaseFillAlpha = () => 0.20,
      clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
      clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
    } = {}) {
      if (!refs.orb || typeof createOrbShatterRuntimeController !== "function") return null;
      return createOrbShatterRuntimeController({
        root,
        getOrbEl: () => refs.orb,
        getOrbShatterRuntime,
        getOrbColorState,
        getBaseFillAlpha,
        clamp,
        clamp01,
      });
    },
    setTraceLogger(fn) {
      if (!state) return;
      state.traceLog = typeof fn === "function" ? fn : null;
      if (state.traceLog) {
        traceLevelStage(state, "level_stage.trace logger attached");
        if (state.sceneModel) {
          traceLevelStage(
            state,
            [
              "level_stage.trace snapshot",
              `spawnW=${state.spawn && state.spawn.worldCenter ? formatLevelStageTracePair(state.spawn.worldCenter.xW, state.spawn.worldCenter.yW) : "none"}`,
              `viewFloorW=${state.sceneModel && state.sceneModel.viewFloorGuide ? Math.round(state.sceneModel.viewFloorGuide.worldY) : "none"}`,
            ].join(" | ")
          );
        }
        updateLevelCamera(refs, state);
      }
    },
    dispose() {
      unbindResize();
    },
  });
}
