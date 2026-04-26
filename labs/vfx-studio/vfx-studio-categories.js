const CATEGORY_DEFINITIONS = Object.freeze({
  spell: Object.freeze({
    id: "spell",
    label: "spell",
    order: 10,
    supportsBinding: true,
    panes: Object.freeze(["vfx", "behavior"]),
  }),
  orb: Object.freeze({
    id: "orb",
    label: "orb",
    order: 20,
    supportsBinding: true,
    panes: Object.freeze(["vfx", "behavior"]),
  }),
  world: Object.freeze({
    id: "world",
    label: "world",
    order: 30,
    supportsBinding: false,
    panes: Object.freeze(["vfx", "behavior"]),
  }),
  hazard: Object.freeze({
    id: "hazard",
    label: "hazard",
    order: 40,
    supportsBinding: false,
    panes: Object.freeze(["vfx", "behavior"]),
  }),
  enemy: Object.freeze({
    id: "enemy",
    label: "enemy",
    order: 50,
    supportsBinding: false,
    panes: Object.freeze(["vfx", "behavior"]),
  }),
  sfx: Object.freeze({
    id: "sfx",
    label: "sfx",
    order: 60,
    supportsBinding: true,
    panes: Object.freeze(["sfx"]),
  }),
});

export const LAB_STUDIO_CATEGORIES = CATEGORY_DEFINITIONS;

export const LAB_STUDIO_CATEGORY_ORDER = Object.freeze(
  Object.values(CATEGORY_DEFINITIONS)
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((entry) => entry.id)
);

export function getLabStudioCategoryDefinition(categoryId) {
  const key = String(categoryId || "").trim().toLowerCase();
  return CATEGORY_DEFINITIONS[key] || null;
}

export function getLabStudioCategoryLabel(categoryId) {
  return (getLabStudioCategoryDefinition(categoryId) || {}).label || String(categoryId || "spell");
}

export function listLabStudioCategoryIdsInOrder() {
  return LAB_STUDIO_CATEGORY_ORDER.slice();
}
