// Content-side registry for castActionId execution metadata.
// Receiver/runtime can map handler keys to concrete implementation functions.

export const CAST_ACTION_REGISTRY = Object.freeze([
  Object.freeze({
    id: "aoe_electric",
    handlerKey: "play_electric_aoe",
    floatGracePolicy: "default",
    globeCost: 1,
  }),
  Object.freeze({
    id: "aoe_flame",
    handlerKey: "play_flame_aoe",
    floatGracePolicy: "default",
    globeCost: 1,
  }),
  Object.freeze({
    id: "aoe_frost",
    handlerKey: "play_frost_aoe",
    floatGracePolicy: "default",
    globeCost: 1,
  }),
  Object.freeze({
    id: "teleport",
    handlerKey: "teleport",
    floatGracePolicy: "domus",
    globeCost: 1,
  }),
  Object.freeze({
    id: "shockwave",
    handlerKey: "trigger_shockwave",
    floatGracePolicy: "default",
    globeCost: 0,
  }),
  Object.freeze({
    id: "bubble_shield",
    handlerKey: "bubble_shield",
    floatGracePolicy: "none",
    globeCost: 1,
  }),
  Object.freeze({
    id: "float_grace",
    handlerKey: "float_grace",
    floatGracePolicy: "none",
    globeCost: 0,
  }),
  Object.freeze({
    id: "colorize",
    handlerKey: "colorize",
    floatGracePolicy: "none",
    globeCost: 0,
  }),
  Object.freeze({
    id: "cast_loaded_ud",
    handlerKey: "cast_loaded_ud",
    floatGracePolicy: "none",
    globeCost: 0,
  }),
  Object.freeze({
    id: "cast_loaded_lr",
    handlerKey: "cast_loaded_lr",
    floatGracePolicy: "none",
    globeCost: 0,
  }),
  Object.freeze({
    id: "cast_loaded_fb",
    handlerKey: "cast_loaded_fb",
    floatGracePolicy: "none",
    globeCost: 0,
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
