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
  const defaults = surface.defaults || {};
  return `count ${roundMetric(defaults.count, 0)} / cohesion ${roundMetric(defaults.cohesion)} / curiosity ${roundMetric(defaults.curiosity)} / aggression ${roundMetric(defaults.aggression)} / independent seeded members`;
}

export function formatEnemyWorkshopPersonalityReadout(surface = null) {
  if (!surface) return "Pending";
  const ranges = surface.personalityRanges || {};
  return `speed ${rangeText(ranges.speed)} / jitter ${rangeText(ranges.jitter)} / orbit ${rangeText(ranges.orbitBias)} / lag ${rangeText(ranges.followLag)} / drift ${rangeText(ranges.verticalDrift)}`;
}

export function formatEnemyWorkshopSpawnReadout(surface = null) {
  if (!surface) return "Pending";
  const defaults = surface.defaults || {};
  return `spawn radius ${roundMetric(defaults.spawnRadiusBo)} BO / personal radius ${roundMetric(defaults.personalRadiusBo)} BO / default speed ${roundMetric(defaults.speedBoPerSec)} BO/s / jitter ${roundMetric(defaults.jitterBo)} BO`;
}

export function formatEnemyWorkshopRuntimeReadout(surface = null) {
  if (!surface) return "Pending";
  return `content target src/content/enemies/${String(surface.archetype || surface.id || "enemy")}.js / runtime target src/game-runtime/enemies/ / level spawns remain level-owned`;
}
