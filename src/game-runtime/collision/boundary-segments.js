function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function buildBoundarySegmentsFromLoops(loops = []) {
  const segments = [];
  for (const loop of Array.isArray(loops) ? loops : []) {
    const loopId = String(loop && loop.id || "loop");
    const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
    for (let index = 0; index < (points.length - 1); index += 1) {
      const a = points[index] || {};
      const b = points[index + 1] || {};
      const ax = clampNumber(a.xW, NaN);
      const ay = clampNumber(a.yW, NaN);
      const bx = clampNumber(b.xW, NaN);
      const by = clampNumber(b.yW, NaN);
      if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) continue;
      if (ax === bx && ay === by) continue;
      segments.push(Object.freeze({
        id: `${loopId}:seg_${index + 1}`,
        loopId,
        index,
        a: Object.freeze({ xW: ax, yW: ay }),
        b: Object.freeze({ xW: bx, yW: by }),
        minXW: Math.min(ax, bx),
        minYW: Math.min(ay, by),
        maxXW: Math.max(ax, bx),
        maxYW: Math.max(ay, by),
      }));
    }
  }
  return Object.freeze(segments);
}
