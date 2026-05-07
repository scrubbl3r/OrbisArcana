import { normalizeLevelWorldItemSpawn } from "../../game-runtime/level/normalize-level-world-item-spawn.js";
import { createStageUiOverlayAdapter } from "./stage-ui-overlay-adapter.js";

export function createStageRuntimeAdapterCore({
  refs = {},
  level = null,
  state = null,
  onTraceLoggerSet = null,
} = {}) {
  let primaryGlobeEl = refs.testGlobe || null;
  const uiOverlayAdapter = createStageUiOverlayAdapter({ refs });

  return {
    refs,
    level,
    getStageElements() {
      return {
        physStage: refs.physStage || null,
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
    getWorldItems() {
      return Array.isArray(level && level.elements && level.elements.worldItemSpawns)
        ? level.elements.worldItemSpawns
        : [];
    },
    normalizeWorldItemSpawn(item, options = {}) {
      return normalizeLevelWorldItemSpawn(item, options);
    },
    pickupScreenY(yW, { camTop = 0 } = {}) {
      return Number(yW || 0) - Number(camTop || 0);
    },
    getPrimaryGlobeEl() {
      return primaryGlobeEl;
    },
    setPrimaryGlobeEl(el) {
      primaryGlobeEl = el || null;
    },
    openDeathOverlay: uiOverlayAdapter.openDeathOverlay,
    closeDeathOverlay: uiOverlayAdapter.closeDeathOverlay,
    setTraceLogger(fn) {
      if (!state) return;
      state.traceLog = typeof fn === "function" ? fn : null;
      if (typeof onTraceLoggerSet === "function") {
        onTraceLoggerSet(state.traceLog);
      }
    },
  };
}
