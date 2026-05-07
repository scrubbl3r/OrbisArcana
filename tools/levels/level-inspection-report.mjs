export function readLevelInspectionReportValue(report = {}, key = "") {
  if (key === "spawnCount") return Number(report.spawnCount) || (Array.isArray(report.spawnPoints) ? report.spawnPoints.length : 0);
  if (key === "worldItemCount") return Array.isArray(report.worldItems) ? report.worldItems.length : 0;
  if (key === "occupiedTileCount") {
    return Number(report.boundaryTileMask && report.boundaryTileMask.occupiedTileCount) || 0;
  }
  return report[key];
}

export function formatLevelInspectionSummary(report = {}) {
  return (
    `${report.levelId || "unknown"} svg ok: loops=${Number(report.loopCount) || 0}` +
    ` camLoops=${Number(report.cameraBoundaryLoopCount) || 0}` +
    ` spawns=${readLevelInspectionReportValue(report, "spawnCount")}` +
    ` globes=${readLevelInspectionReportValue(report, "worldItemCount")}` +
    ` props=${Number(report.propCount) || 0}` +
    ` art=${Number(report.artShapeCount) || 0}` +
    ` fields=${Number(report.starsFieldRegionCount) || 0}` +
    ` depth=${Number(report.depthLayerCount) || 0}` +
    ` tiles=${readLevelInspectionReportValue(report, "occupiedTileCount")}`
  );
}
