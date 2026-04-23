export function normalizeLevelWorldItemSpawn(
  item,
  {
    groundCenterWorld = () => 0,
    clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  } = {}
) {
  const kind = String(item && item.kind || "");
  if (!item || (kind !== "energy_globe" && kind !== "energy_globe_emitter")) return null;
  if (Number.isFinite(Number(item.xNorm)) && Number.isFinite(Number(item.yW))) {
    return {
      id: String(item.id || ""),
      kind,
      xNorm: clamp(Number(item.xNorm), 0, 1),
      yW: Number(item.yW) || 0,
      r: Math.max(1, Number(item.r) || 25),
      capacity: Math.max(1, Math.floor(Number(item.capacity) || 1)),
      regenTrigger: String(item.regenTrigger || (kind === "energy_globe_emitter" ? "globe_spent" : "manual")),
    };
  }
  const s = item.spawn || {};
  const xNorm = clamp(Number(s.xNorm), 0, 1);
  const r = Math.max(1, Number(s.r) || 25);
  const yMode = String(s.yMode || "absolute");
  const yValue = Number(s.yValue) || 0;
  const yW = (yMode === "ground_center_offset")
    ? (groundCenterWorld() + yValue)
    : yValue;
  return {
    id: String(item.id || ""),
    kind,
    xNorm: Number.isFinite(xNorm) ? xNorm : 0.5,
    yW,
    r,
    capacity: Math.max(1, Math.floor(Number(item.capacity) || 1)),
    regenTrigger: String(item.regenTrigger || (kind === "energy_globe_emitter" ? "globe_spent" : "manual")),
  };
}
