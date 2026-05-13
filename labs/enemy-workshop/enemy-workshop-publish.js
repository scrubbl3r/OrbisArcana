const ENEMY_CONTENT_TARGET_PATH = Object.freeze(["src", "content", "enemies", "gnat-swarm.js"]);
const ENEMY_DRAFT_PATH = Object.freeze(["src", "content", "enemies", "drafts"]);

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject(value[key]);
      return acc;
    }, {});
}

export const ENEMY_WORKSHOP_TARGETS = Object.freeze({
  gnatSwarm: ENEMY_CONTENT_TARGET_PATH,
  drafts: ENEMY_DRAFT_PATH,
});

export function buildEnemyDraftPayload({ surface = null, enemySettings = null, gnatSettings = null } = {}) {
  const id = String(surface && surface.id || "gnat-swarm");
  const label = String(surface && surface.label || "Gnat Swarm");
  const settings = enemySettings || { gnat: gnatSettings || {} };
  return Object.freeze({
    schema: "orbis.enemy-workshop.draft.v1",
    enemyId: id,
    label,
    savedAtMs: Date.now(),
    enemy: sortObject(settings),
  });
}

export function buildGnatSwarmEnemyModule({ surface = null, enemySettings = null, gnatSettings = null } = {}) {
  const id = String(surface && surface.id || "gnat-swarm");
  const label = String(surface && surface.label || "Gnat Swarm");
  const settings = enemySettings || { gnat: gnatSettings || {} };
  const payload = sortObject({
    id,
    label,
    kind: "swarm",
    category: "enemy",
    status: "draft",
    member: "gnat",
    ...settings,
  });
  return [
    "export const GNAT_SWARM_ENEMY_DEFAULT = Object.freeze(",
    JSON.stringify(payload, null, 2),
    ");",
    "",
  ].join("\n");
}
