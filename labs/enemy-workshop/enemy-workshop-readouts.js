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

export function formatEnemyWorkshopSwarmReadout(surface = null) {
  if (!surface) return "Pending";
  const swarm = surface.swarm || {};
  return `gnats total ${roundMetric(swarm.gnatsTotal, 0)} / spawn ${roundMetric(swarm.spawnRadiusBo)} BO / detect ${roundMetric(swarm.detectionRadiusBo)} BO / leash ${roundMetric(swarm.leashChaseBo, 0)}/${roundMetric(swarm.leashFeedBo, 0)} BO / telegraph ${roundMetric(swarm.telegraphRadiusBo)} BO / size ${roundMetric(swarm.gnatSizeBo, 3)} BO / z ${roundMetric(swarm.zDepthBo, 1)} BO / base speed ${rangeText(swarm.baseSpeedBoPerSec)} BO/s`;
}

export function formatEnemyWorkshopRuntimeReadout(surface = null) {
  if (!surface) return "Pending";
  return `content target src/content/enemies/${String(surface.archetype || surface.id || "enemy")}.js / runtime target src/game-runtime/enemies/ / level spawns remain level-owned`;
}
