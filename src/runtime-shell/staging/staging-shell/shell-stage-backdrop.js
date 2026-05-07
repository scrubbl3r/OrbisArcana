import {
  AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES,
  resolveAuthoredLevelReadModelArray,
} from "../../../game-runtime/level/authored-level-read-model.js";

export function ensureShellStageBackdrop(shellContext, {
  getActiveShellStageMethod = () => null,
  shellStageRect = () => ({ width: 0, height: 0 }),
  shellWorldHeight = () => 0,
  clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
} = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const rootDocument = shellContext && shellContext.rootDocument ? shellContext.rootDocument : null;
  const ensureBackdrop = getActiveShellStageMethod(shellContext, "ensureBackdrop");
  if (!runtime || !ensureBackdrop || !rootDocument) return;

  const rect = shellStageRect(shellContext);
  ensureBackdrop.method.call(ensureBackdrop.activeAdapter, {
    runtime,
    rootDocument,
    rect,
    worldHeight: shellWorldHeight(shellContext),
    artShapes: resolveAuthoredLevelReadModelArray(runtime, AUTHORED_LEVEL_READ_MODEL_KEY_ART_SHAPES),
    clamp01,
  });
}

export function shellGroundLineScreenY(shellContext, {
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

export function drawShellStars(shellContext, {
  getActiveShellStageMethod = () => null,
  shellCameraTopFor = () => 0,
} = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const drawStars = getActiveShellStageMethod(shellContext, "drawStars");
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !drawStars || !stageBackdrop) return;
  const h = stageBackdrop.height || 0;
  const camTop = shellCameraTopFor(shellContext, runtime.orbRuntimeState.get().yW, h);
  drawStars.method.call(drawStars.activeAdapter, {
    runtime,
    camTop,
  });
}

export function drawShellBackdrop(shellContext, {
  getActiveShellStageMethod = () => null,
  groundLineScreenY = () => 0,
} = {}) {
  const runtime = shellContext && shellContext.runtime ? shellContext.runtime : null;
  const drawBackdrop = getActiveShellStageMethod(shellContext, "drawBackdrop");
  const stageBackdrop = runtime && runtime.stageBackdrop;
  if (!runtime || !drawBackdrop || !stageBackdrop) return;
  drawBackdrop.method.call(drawBackdrop.activeAdapter, {
    runtime,
    groundY: groundLineScreenY(shellContext),
  });
}
