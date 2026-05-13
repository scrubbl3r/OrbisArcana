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
  return `idle radius ${roundMetric(idle.idleRadiusBo)} BO / base speed ${roundMetric(idle.baseSpeedBoPerSec)} BO/s / turn ease ${roundMetric(idle.turnEase)} / hover tightness ${roundMetric(idle.hoverTightness)}`;
}

export function formatEnemyWorkshopPersonalityReadout(surface = null) {
  if (!surface) return "Pending";
  const ranges = surface.personalityRanges || surface.gnat && surface.gnat.personalityRanges || {};
  return `speed ${rangeText(ranges.speed)} / wander chance ${rangeText(ranges.wanderChance)} / wander range ${rangeText(ranges.wanderRange)} / awareness ${rangeText(ranges.awareness)} / aggression ${rangeText(ranges.aggression)}`;
}

export function formatEnemyWorkshopSpawnReadout(surface = null) {
  if (!surface) return "Pending";
  const wander = surface.wander || surface.gnat && surface.gnat.wander || {};
  return `wander ${roundMetric(wander.rangeMinBo)}-${roundMetric(wander.rangeMaxBo)} BO / chance ${roundMetric(wander.chancePerMinute)} per min / outbound skew ${roundMetric(wander.outboundSkew)} / return skew ${roundMetric(wander.returnSkew)}`;
}

export function formatEnemyWorkshopRuntimeReadout(surface = null) {
  if (!surface) return "Pending";
  return `content target src/content/enemies/${String(surface.archetype || surface.id || "enemy")}.js / runtime target src/game-runtime/enemies/ / level spawns remain level-owned`;
}
