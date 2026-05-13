export const ENEMY_ARCHETYPES = Object.freeze([]);

export const ENEMY_ARCHETYPES_BY_ID = Object.freeze(
  ENEMY_ARCHETYPES.reduce((acc, enemy) => {
    const id = String(enemy && enemy.id || "").trim();
    if (id) acc[id] = enemy;
    return acc;
  }, Object.create(null))
);

export function getEnemyArchetypeById(id = "") {
  const key = String(id || "").trim();
  return key && ENEMY_ARCHETYPES_BY_ID[key] ? ENEMY_ARCHETYPES_BY_ID[key] : null;
}
