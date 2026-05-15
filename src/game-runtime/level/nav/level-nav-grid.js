export const LEVEL_NAV_GRID_RESOLUTION_BO = 1;

function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function distance(a = {}, b = {}) {
  return Math.hypot((a.xW || 0) - (b.xW || 0), (a.yW || 0) - (b.yW || 0));
}

function pointInLoop(point = {}, loop = null) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  if (points.length < 3) return false;
  let inside = false;
  const x = clampNumber(point.xW, 0);
  const y = clampNumber(point.yW, 0);
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const pi = points[i] || {};
    const pj = points[j] || {};
    const xi = clampNumber(pi.xW, 0);
    const yi = clampNumber(pi.yW, 0);
    const xj = clampNumber(pj.xW, 0);
    const yj = clampNumber(pj.yW, 0);
    const denom = Math.abs(yj - yi) > 0.000001 ? (yj - yi) : 0.000001;
    const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / denom + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInLoops(point = {}, loops = []) {
  const usableLoops = Array.isArray(loops) ? loops : [];
  if (!usableLoops.length) return true;
  return usableLoops.some((loop) => pointInLoop(point, loop));
}

function clampToBox(point = {}, box = null) {
  if (!box) return { xW: clampNumber(point.xW, 0), yW: clampNumber(point.yW, 0) };
  return {
    xW: clampNumber(point.xW, 0, box.leftXW, box.rightXW),
    yW: clampNumber(point.yW, 0, box.topYW, box.bottomYW),
  };
}

function normalizeBox(boundaryBox = null, loops = []) {
  if (boundaryBox) {
    return {
      leftXW: clampNumber(boundaryBox.leftXW, 0),
      rightXW: clampNumber(boundaryBox.rightXW, 0),
      topYW: clampNumber(boundaryBox.topYW, 0),
      bottomYW: clampNumber(boundaryBox.bottomYW, 0),
    };
  }
  const points = [];
  (Array.isArray(loops) ? loops : []).forEach((loop) => {
    if (Array.isArray(loop && loop.worldPoints)) points.push(...loop.worldPoints);
  });
  if (!points.length) return null;
  const xs = points.map((point) => clampNumber(point && point.xW, 0));
  const ys = points.map((point) => clampNumber(point && point.yW, 0));
  return {
    leftXW: Math.min(...xs),
    rightXW: Math.max(...xs),
    topYW: Math.min(...ys),
    bottomYW: Math.max(...ys),
  };
}

function randomPointAround(center = {}, radius = 1) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * Math.max(0, radius);
  return {
    xW: clampNumber(center.xW, 0) + Math.cos(angle) * r,
    yW: clampNumber(center.yW, 0) + Math.sin(angle) * r,
  };
}

export function buildLevelNavGrid({
  boundaryLoops = [],
  boundaryBox = null,
  bo = 42,
  resolutionBo = LEVEL_NAV_GRID_RESOLUTION_BO,
} = {}) {
  const loops = Array.isArray(boundaryLoops) ? boundaryLoops : [];
  const box = normalizeBox(boundaryBox, loops);
  const cellSizeWorld = Math.max(1, clampNumber(resolutionBo, LEVEL_NAV_GRID_RESOLUTION_BO, 0.1, 64) * Math.max(1, Number(bo) || 42));
  if (!box || box.rightXW <= box.leftXW || box.bottomYW <= box.topYW) {
    return null;
  }
  const cols = Math.max(1, Math.ceil((box.rightXW - box.leftXW) / cellSizeWorld));
  const rows = Math.max(1, Math.ceil((box.bottomYW - box.topYW) / cellSizeWorld));
  const walkable = new Uint8Array(cols * rows);
  const index = (col, row) => row * cols + col;
  const key = (col, row) => `${col},${row}`;
  const cellCenter = (col, row) => ({
    xW: box.leftXW + (col + 0.5) * cellSizeWorld,
    yW: box.topYW + (row + 0.5) * cellSizeWorld,
  });
  const cellForPoint = (point = {}) => ({
    col: clampNumber(Math.floor((clampNumber(point.xW, box.leftXW) - box.leftXW) / cellSizeWorld), 0, 0, cols - 1),
    row: clampNumber(Math.floor((clampNumber(point.yW, box.topYW) - box.topYW) / cellSizeWorld), 0, 0, rows - 1),
  });
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      walkable[index(col, row)] = pointInLoops(cellCenter(col, row), loops) ? 1 : 0;
    }
  }
  function isWalkableCell(col, row) {
    return col >= 0 && row >= 0 && col < cols && row < rows && walkable[index(col, row)] === 1;
  }
  function containsPoint(point = {}) {
    const clamped = clampToBox(point, box);
    const cell = cellForPoint(clamped);
    if (isWalkableCell(cell.col, cell.row)) return true;
    return pointInLoops(clamped, loops);
  }
  function resolvePoint(point = {}, { fallback = null } = {}) {
    const clamped = clampToBox(point, box);
    const start = cellForPoint(clamped);
    if (isWalkableCell(start.col, start.row)) return clamped;
    const maxRadius = Math.max(cols, rows);
    for (let radius = 1; radius <= maxRadius; radius += 1) {
      let best = null;
      let bestDistance = Infinity;
      for (let row = start.row - radius; row <= start.row + radius; row += 1) {
        for (let col = start.col - radius; col <= start.col + radius; col += 1) {
          if (Math.abs(col - start.col) !== radius && Math.abs(row - start.row) !== radius) continue;
          if (!isWalkableCell(col, row)) continue;
          const center = cellCenter(col, row);
          const d = distance(clamped, center);
          if (d < bestDistance) {
            best = center;
            bestDistance = d;
          }
        }
      }
      if (best) return best;
    }
    return fallback ? clampToBox(fallback, box) : clamped;
  }
  function randomPointAroundNav(center = {}, radius = 1) {
    for (let i = 0; i < 32; i += 1) {
      const candidate = clampToBox(randomPointAround(center, radius), box);
      if (containsPoint(candidate)) return candidate;
    }
    return resolvePoint(center, { fallback: center });
  }
  function segmentIsWalkable(from = {}, to = {}, stepWorld = cellSizeWorld * 0.5) {
    const total = distance(from, to);
    const steps = Math.max(1, Math.ceil(total / Math.max(1, stepWorld)));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const point = {
        xW: (from.xW || 0) + ((to.xW || 0) - (from.xW || 0)) * t,
        yW: (from.yW || 0) + ((to.yW || 0) - (from.yW || 0)) * t,
      };
      if (!containsPoint(point)) return false;
    }
    return true;
  }
  function findPath(from = {}, to = {}) {
    const startPoint = resolvePoint(from, { fallback: from });
    const goalPoint = resolvePoint(to, { fallback: to });
    if (segmentIsWalkable(startPoint, goalPoint)) return [startPoint, goalPoint];
    const start = cellForPoint(startPoint);
    const goal = cellForPoint(goalPoint);
    const open = [{ col: start.col, row: start.row, cost: 0, score: distance(startPoint, goalPoint) }];
    const best = new Map([[key(start.col, start.row), 0]]);
    const cameFrom = new Map();
    const closed = new Set();
    const neighbors = [
      [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
      [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, 1, Math.SQRT2],
    ];
    while (open.length) {
      open.sort((a, b) => a.score - b.score);
      const current = open.shift();
      const currentKey = key(current.col, current.row);
      if (closed.has(currentKey)) continue;
      if (current.col === goal.col && current.row === goal.row) {
        const cells = [];
        let cursor = currentKey;
        while (cursor) {
          const [col, row] = cursor.split(",").map(Number);
          cells.push({ col, row });
          cursor = cameFrom.get(cursor);
        }
        cells.reverse();
        return [
          startPoint,
          ...cells.slice(1, -1).map((cell) => cellCenter(cell.col, cell.row)),
          goalPoint,
        ];
      }
      closed.add(currentKey);
      for (const [dc, dr, weight] of neighbors) {
        const col = current.col + dc;
        const row = current.row + dr;
        if (!isWalkableCell(col, row)) continue;
        const neighborKey = key(col, row);
        if (closed.has(neighborKey)) continue;
        const point = cellCenter(col, row);
        const nextCost = current.cost + cellSizeWorld * weight;
        if (nextCost >= (best.get(neighborKey) ?? Infinity)) continue;
        best.set(neighborKey, nextCost);
        cameFrom.set(neighborKey, currentKey);
        open.push({
          col,
          row,
          cost: nextCost,
          score: nextCost + distance(point, goalPoint),
        });
      }
    }
    return [startPoint, goalPoint];
  }
  function distanceThroughLevel(from = {}, to = {}) {
    const path = findPath(from, to);
    let total = 0;
    for (let i = 1; i < path.length; i += 1) total += distance(path[i - 1], path[i]);
    return total || distance(from, to);
  }
  function buildRouteSegments({ from = {}, to = {}, spacingWorld = cellSizeWorld, jitterWorld = 0 } = {}) {
    const path = findPath(from, to);
    const segments = [];
    for (let i = 1; i < path.length; i += 1) {
      const a = path[i - 1];
      const b = path[i];
      const total = Math.max(0.001, distance(a, b));
      const count = Math.max(1, Math.ceil(total / Math.max(1, spacingWorld)));
      for (let step = 1; step <= count; step += 1) {
        const t = step / count;
        const candidate = {
          xW: (a.xW || 0) + ((b.xW || 0) - (a.xW || 0)) * t + (Math.random() * 2 - 1) * jitterWorld,
          yW: (a.yW || 0) + ((b.yW || 0) - (a.yW || 0)) * t + (Math.random() * 2 - 1) * jitterWorld,
        };
        segments.push(resolvePoint(candidate, { fallback: segments[segments.length - 1] || a }));
      }
    }
    if (!segments.length) segments.push(resolvePoint(to, { fallback: from }));
    segments[segments.length - 1] = resolvePoint(to, { fallback: segments[segments.length - 2] || from });
    return segments;
  }
  return Object.freeze({
    box,
    cellSizeWorld,
    cols,
    containsPoint,
    distanceThroughLevel,
    findPath,
    randomPointAround: randomPointAroundNav,
    resolutionBo,
    resolvePoint,
    rows,
    segmentIsWalkable,
    walkable,
    buildRouteSegments,
  });
}
