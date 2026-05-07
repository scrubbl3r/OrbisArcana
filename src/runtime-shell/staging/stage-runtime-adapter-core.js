import { normalizeLevelWorldItemSpawn } from "../../game-runtime/level/normalize-level-world-item-spawn.js";
import { createDomOrbStageAdapter } from "./dom-orb-stage-adapter.js";
import { createStageUiOverlayAdapter } from "./stage-ui-overlay-adapter.js";

export function createStageRuntimeAdapterCore({
  refs = {},
  level = null,
  state = null,
  getOrbWrapPosition = null,
  onTraceLoggerSet = null,
} = {}) {
  let primaryGlobeEl = refs.testGlobe || null;
  const domOrbAdapter = createDomOrbStageAdapter({
    refs,
    getOrbWrapPosition,
  });
  const uiOverlayAdapter = createStageUiOverlayAdapter({ refs });

  return {
    refs,
    level,
    getStageElements() {
      return {
        physStage: refs.physStage || null,
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
    applyOrbTransform: domOrbAdapter.applyOrbTransform,
    renderOrbDamageVisuals: domOrbAdapter.renderOrbDamageVisuals,
    openDeathOverlay: uiOverlayAdapter.openDeathOverlay,
    closeDeathOverlay: uiOverlayAdapter.closeDeathOverlay,
    createOrbShatterController: domOrbAdapter.createOrbShatterController,
    setTraceLogger(fn) {
      if (!state) return;
      state.traceLog = typeof fn === "function" ? fn : null;
      if (typeof onTraceLoggerSet === "function") {
        onTraceLoggerSet(state.traceLog);
      }
    },
  };
}
