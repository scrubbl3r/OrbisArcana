import {
  AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES,
  resolveAuthoredLevelReadModelArray,
} from "../../../game-runtime/level/authored-level-read-model.js";

export function ensureLegacyShellStageBackdrop(shellContext, {
  getActiveShellStageAdapter = () => null,
  shellStageRect = () => ({ width: 0, height: 0 }),
  shellActiveStageLevel = () => null,
  shellWorldHeight = () => 0,
  clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
} = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  if (!runtime || !activeStageAdapter || typeof activeStageAdapter.ensureBackdrop !== "function" || !rootDocument) return;

  const rect = shellStageRect(shellContext);
  const activeLevel = shellActiveStageLevel(shellContext);
  const terrainProfile = Array.isArray(activeLevel && activeLevel.terrain && activeLevel.terrain.profile)
    ? activeLevel.terrain.profile
    : [];
  activeStageAdapter.ensureBackdrop({
    runtime,
    rootDocument,
    rect,
    worldHeight: shellWorldHeight(shellContext),
    terrainProfile,
    artShapes: resolveAuthoredLevelReadModelArray(runtime, AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES),
    clamp01,
  });
}

export function legacyShellGroundLineScreenY(shellContext, {
  shellStageRect = () => ({ width: 0, height: 0 }),
  shellGroundCenterWorld = () => 0,
  shellCameraTopFor = () => 0,
} = {}) {
  const stage = shellContext && shellContext.runtime ? shellContext.runtime.stage : null;
  if (!stage || !stage.phys || !stage.orbRuntimeState || typeof stage.orbRuntimeState.get !== "function") return 0;
  const rect = shellStageRect(shellContext);
  const groundLineWorldY = shellGroundCenterWorld(shellContext) +
    (Number(stage.phys.orbRadiusPx) || 50) +
    ((Number(stage.phys.groundLinePx) || 2) * 0.5);
  const camTop = shellCameraTopFor(shellContext, stage.orbRuntimeState.get().yW, rect.height || 0);
  return groundLineWorldY - camTop;
}

export function drawLegacyShellStars(shellContext, {
  getActiveShellStageAdapter = () => null,
  shellCameraTopFor = () => 0,
} = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !activeStageAdapter || typeof activeStageAdapter.drawStars !== "function" || !stageBackdrop) return;
  const h = stageBackdrop.height || 0;
  const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, h);
  activeStageAdapter.drawStars({
    runtime,
    camTop,
  });
}

export function drawLegacyShellBackdrop(shellContext, {
  getActiveShellStageAdapter = () => null,
  groundLineScreenY = () => 0,
} = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const activeStageAdapter = getActiveShellStageAdapter(shellContext);
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !activeStageAdapter || typeof activeStageAdapter.drawBackdrop !== "function" || !stageBackdrop) return;
  activeStageAdapter.drawBackdrop({
    runtime,
    groundY: groundLineScreenY(shellContext),
  });
}
