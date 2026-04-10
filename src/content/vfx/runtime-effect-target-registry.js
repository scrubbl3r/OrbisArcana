import { CAST_ACTION_REGISTRY } from "../spells/cast-action-registry.js";

const SPELL_TARGET_LABELS = Object.freeze({
  aoe_flame: "Flame AOE",
  aoe_electric: "Electric AOE",
  bubble_shield: "Bubble Shield",
  shockwave: "Shockwave",
});

const ORB_STATE_TARGETS = Object.freeze([
  Object.freeze({
    id: "orb-state.pristine",
    targetKind: "orb-state",
    targetId: "pristine",
    label: "Pristine",
    vfxCategory: "orb",
  }),
  Object.freeze({
    id: "orb-state.crack_1",
    targetKind: "orb-state",
    targetId: "crack_1",
    label: "Crack 1",
    vfxCategory: "orb",
  }),
  Object.freeze({
    id: "orb-state.crack_2",
    targetKind: "orb-state",
    targetId: "crack_2",
    label: "Crack 2",
    vfxCategory: "orb",
  }),
  Object.freeze({
    id: "orb-state.shattered",
    targetKind: "orb-state",
    targetId: "shattered",
    label: "Shattered",
    vfxCategory: "orb",
  }),
  Object.freeze({
    id: "orb-state.charged",
    targetKind: "orb-state",
    targetId: "charged",
    label: "Charged",
    vfxCategory: "orb",
  }),
  Object.freeze({
    id: "orb-state.globe_loaded",
    targetKind: "orb-state",
    targetId: "globe_loaded",
    label: "Globe Loaded",
    vfxCategory: "orb",
  }),
]);

function buildSpellTargets() {
  const supported = new Set(["aoe_flame", "aoe_electric", "bubble_shield", "shockwave"]);
  return (Array.isArray(CAST_ACTION_REGISTRY) ? CAST_ACTION_REGISTRY : [])
    .filter((entry) => supported.has(String((entry && entry.id) || "").toLowerCase()))
    .map((entry) => {
      const targetId = String((entry && entry.id) || "").toLowerCase();
      return Object.freeze({
        id: `spell.${targetId}`,
        targetKind: "spell",
        targetId,
        label: SPELL_TARGET_LABELS[targetId] || targetId,
        vfxCategory: "spell",
      });
    });
}

export const RUNTIME_EFFECT_TARGET_REGISTRY = Object.freeze([
  ...buildSpellTargets(),
  ...ORB_STATE_TARGETS,
]);

export const RUNTIME_EFFECT_TARGET_REGISTRY_BY_ID = Object.freeze(
  RUNTIME_EFFECT_TARGET_REGISTRY.reduce((acc, entry) => {
    const id = String((entry && entry.id) || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = entry;
    return acc;
  }, {})
);

export function getRuntimeEffectTarget(targetRegistryId) {
  return RUNTIME_EFFECT_TARGET_REGISTRY_BY_ID[String(targetRegistryId || "").trim().toLowerCase()] || null;
}
