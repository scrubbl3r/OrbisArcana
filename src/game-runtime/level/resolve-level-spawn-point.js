function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveLevelSpawnPoint(
  level = null,
  {
    worldWidthPx = 0,
    groundCenterWorld = () => 0,
  } = {}
) {
  const spawn = level && typeof level.spawn === "object" ? level.spawn : null;
  if (!spawn) return null;

  const xW = Number.isFinite(Number(spawn.xW))
    ? Number(spawn.xW)
    : (
        Number.isFinite(Number(spawn.xNorm))
          ? (Math.max(0, clampNumber(spawn.xNorm, 0)) * Math.max(0, clampNumber(worldWidthPx, 0)))
          : null
      );

  const yMode = String(spawn.yMode || "absolute").trim().toLowerCase();
  let yW = null;

  if (Number.isFinite(Number(spawn.yW))) {
    yW = Number(spawn.yW);
  } else if (yMode === "ground_center_offset") {
    yW = Number(groundCenterWorld()) + clampNumber(spawn.yValue, 0);
  } else if (Number.isFinite(Number(spawn.yValue))) {
    yW = Number(spawn.yValue);
  }

  if (!Number.isFinite(xW) || !Number.isFinite(yW)) return null;

  return Object.freeze({
    xW: Number(xW),
    yW: Number(yW),
  });
}
