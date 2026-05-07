import {
  LEVEL_POINT_Y_MODE_FALLBACK,
  LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET,
  LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE,
  LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_MANUAL,
  LEVEL_WORLD_ITEM_Z_MODE_FALLBACK,
} from "./normalize-level-definition.js";

export function normalizeLevelWorldItemSpawn(
  item,
  {
    groundCenterWorld = () => 0,
    clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  } = {}
) {
  const kind = String(item && item.kind || "");
  if (
    !item ||
    (kind !== LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE && kind !== LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER)
  ) return null;
  const regenTriggerFallback = kind === LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER
    ? LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT
    : LEVEL_WORLD_ITEM_REGEN_TRIGGER_MANUAL;
  if (Number.isFinite(Number(item.xNorm)) && Number.isFinite(Number(item.yW))) {
    return {
      id: String(item.id || ""),
      kind,
      xNorm: clamp(Number(item.xNorm), 0, 1),
      xW: Number.isFinite(Number(item.xW))
        ? Number(item.xW)
        : (
            item.worldCenter && Number.isFinite(Number(item.worldCenter.xW))
              ? Number(item.worldCenter.xW)
              : null
          ),
      yW: Number(item.yW) || 0,
      zMode: String(item.zMode || LEVEL_WORLD_ITEM_Z_MODE_FALLBACK),
      zBO: Number.isFinite(Number(item.zBO)) ? Number(item.zBO) : null,
      r: Math.max(1, Number(item.r) || 25),
      capacity: Math.max(1, Math.floor(Number(item.capacity) || 1)),
      regenTrigger: String(item.regenTrigger || regenTriggerFallback),
    };
  }
  const s = item.spawn || {};
  const xNorm = clamp(Number(s.xNorm), 0, 1);
  const r = Math.max(1, Number(s.r) || 25);
  const yMode = String(s.yMode || LEVEL_POINT_Y_MODE_FALLBACK);
  const yValue = Number(s.yValue) || 0;
  const yW = (yMode === LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET)
    ? (groundCenterWorld() + yValue)
    : yValue;
  return {
    id: String(item.id || ""),
    kind,
    xNorm: Number.isFinite(xNorm) ? xNorm : 0.5,
    xW: Number.isFinite(Number(item.xW)) ? Number(item.xW) : null,
    yW,
    zMode: String(item.zMode || LEVEL_WORLD_ITEM_Z_MODE_FALLBACK),
    zBO: Number.isFinite(Number(item.zBO)) ? Number(item.zBO) : null,
    r,
    capacity: Math.max(1, Math.floor(Number(item.capacity) || 1)),
    regenTrigger: String(item.regenTrigger || regenTriggerFallback),
  };
}
