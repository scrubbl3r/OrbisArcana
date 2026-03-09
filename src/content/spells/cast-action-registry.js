// Content-side registry for castActionId execution metadata.
// Receiver/runtime can map handler keys to concrete implementation functions.

export const CAST_ACTION_REGISTRY = Object.freeze([
  Object.freeze({
    id: "aoe_electric",
    handlerKey: "play_electric_aoe",
    floatGracePolicy: "default",
  }),
  Object.freeze({
    id: "aoe_flame",
    handlerKey: "play_flame_aoe",
    floatGracePolicy: "default",
  }),
  Object.freeze({
    id: "aoe_axis",
    handlerKey: "play_axis_aoe",
    floatGracePolicy: "default",
  }),
  Object.freeze({
    id: "aoe_school",
    handlerKey: "play_axis_aoe",
    floatGracePolicy: "default",
  }),
  Object.freeze({
    id: "aoe_frost",
    handlerKey: "play_frost_aoe",
    floatGracePolicy: "default",
  }),
  Object.freeze({
    id: "domus_teleport",
    handlerKey: "domus_teleport_orb",
    floatGracePolicy: "domus",
  }),
  Object.freeze({
    id: "sanctum_shield",
    handlerKey: "activate_sanctum_shield",
    floatGracePolicy: "none",
  }),
  Object.freeze({
    id: "orb_super_grace",
    handlerKey: "grant_orb_super_grace",
    floatGracePolicy: "none",
  }),
]);

export const CAST_ACTION_REGISTRY_BY_ID = Object.freeze(
  CAST_ACTION_REGISTRY.reduce((acc, item) => {
    const id = String(item && item.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, {})
);

export function getCastActionMeta(castActionId) {
  return CAST_ACTION_REGISTRY_BY_ID[String(castActionId || "").toLowerCase()] || null;
}
