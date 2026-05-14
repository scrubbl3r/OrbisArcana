function roundMetric(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  const scale = 10 ** Math.max(0, Number(digits) || 0);
  return String(Math.round(numeric * scale) / scale);
}

function rangeText(range = []) {
  if (!Array.isArray(range) || range.length < 2) return "unset";
  return `${roundMetric(range[0])}-${roundMetric(range[1])}`;
}

export function formatEnemyWorkshopMeta(surface = null) {
  if (!surface) return "";
  return `${String(surface.kind || "")} / ${String(surface.category || "")} / ${String(surface.status || "draft")}`;
}

export function formatEnemyWorkshopBehaviorReadout(surface = null) {
  if (!surface) return "Pending";
  const idle = surface.idle || surface.gnat && surface.gnat.idle || {};
  return `target ${roundMetric(idle.targetRetargetMinSec)}-${roundMetric(idle.targetRetargetMaxSec)}s / spring ${roundMetric(idle.springStiffness)} / damping ${roundMetric(idle.springDamping)} / elastic jitter ${roundMetric(idle.elasticJitterBo)} BO`;
}

export function formatEnemyWorkshopPersonalityReadout(surface = null) {
  if (!surface) return "Pending";
  const ranges = surface.personalityRanges || surface.gnat && surface.gnat.personalityRanges || {};
  return `speed ${rangeText(ranges.speed)}x / chance ${rangeText(ranges.wanderChancePerMinute)}/min / range ${rangeText(ranges.wanderRangeBo)} BO / stops ${rangeText(ranges.wanderStopSpacingBo)} BO / route ${rangeText(ranges.routeCommitment)}`;
}

export function formatEnemyWorkshopSwarmReadout(surface = null) {
  if (!surface) return "Pending";
  const swarm = surface.swarm || {};
  return `gnats total ${roundMetric(swarm.gnatsTotal, 0)} / spawn ${roundMetric(swarm.spawnRadiusBo)} BO / base speed ${rangeText(swarm.baseSpeedBoPerSec)} BO/s`;
}

export function formatEnemyWorkshopRuntimeReadout(surface = null) {
  if (!surface) return "Pending";
  return `content target src/content/enemies/${String(surface.archetype || surface.id || "enemy")}.js / runtime target src/game-runtime/enemies/ / level spawns remain level-owned`;
}
