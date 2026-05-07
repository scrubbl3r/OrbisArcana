export function readLevelInspectionReportValue(report = {}, key = "") {
  if (key === "spawnMarkerCount") return Array.isArray(report.spawnMarkers) ? report.spawnMarkers.length : 0;
  if (key === "worldItemSpawnCount") return Array.isArray(report.worldItemSpawns) ? report.worldItemSpawns.length : 0;
  if (key === "occupiedTileCount") {
    return Number(report.boundaryTileMask && report.boundaryTileMask.occupiedTileCount) || 0;
  }
  return report[key];
}

export function formatLevelInspectionSummary(report = {}) {
  return (
    `${report.levelId || "unknown"} svg ok: loops=${Number(report.loopCount) || 0}` +
    ` camLoops=${Number(report.cameraBoundaryLoopCount) || 0}` +
    ` spawns=${readLevelInspectionReportValue(report, "spawnMarkerCount")}` +
    ` globes=${readLevelInspectionReportValue(report, "worldItemSpawnCount")}` +
    ` props=${Number(report.propCount) || 0}` +
    ` art=${Number(report.lineArtShapeCount) || 0}` +
    ` fields=${Number(report.starsFieldRegionCount) || 0}` +
    ` depth=${Number(report.depthLayerCount) || 0}` +
    ` tiles=${readLevelInspectionReportValue(report, "occupiedTileCount")}`
  );
}
