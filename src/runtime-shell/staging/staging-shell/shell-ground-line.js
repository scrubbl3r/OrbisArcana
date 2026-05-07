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
