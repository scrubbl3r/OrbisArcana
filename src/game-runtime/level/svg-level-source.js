function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readAttr(attrText = "", name = "") {
  const match = String(attrText || "").match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? String(match[1] || "") : "";
}

export function parseSvgViewBox(svgText = "") {
  const match = String(svgText || "").match(/viewBox="([^"]+)"/i);
  if (!match) {
    return Object.freeze({ x: 0, y: 0, width: 0, height: 0 });
  }
  const parts = String(match[1] || "").trim().split(/[\s,]+/).map(Number);
  return Object.freeze({
    x: clampNumber(parts[0], 0),
    y: clampNumber(parts[1], 0),
    width: clampNumber(parts[2], 0),
    height: clampNumber(parts[3], 0),
  });
}

export function parseSvgPathElements(svgText = "") {
  const matches = String(svgText || "").matchAll(/<path\b([^>]*)\/?>/gi);
  const paths = [];
  for (const match of matches) {
    const attrs = String(match && match[1] || "");
    const d = readAttr(attrs, "d");
    if (!d) continue;
    paths.push(Object.freeze({
      id: readAttr(attrs, "id"),
      d,
      style: readAttr(attrs, "style"),
    }));
  }
  return Object.freeze(paths);
}

function tokenizePathData(pathData = "") {
  const tokens = [];
  const rx = /([a-zA-Z])|(-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?)/g;
  let match = null;
  while ((match = rx.exec(String(pathData || "")))) {
    tokens.push(match[1] || match[2]);
  }
  return tokens;
}

function readNumberToken(tokens, cursor) {
  const token = tokens[cursor.index];
  const value = Number(token);
  if (!Number.isFinite(value)) return null;
  cursor.index += 1;
  return value;
}

export function parseSvgPolylinePath(pathData = "") {
  const tokens = tokenizePathData(pathData);
  const points = [];
  const cursor = { index: 0 };
  let cmd = "";
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  while (cursor.index < tokens.length) {
    const raw = tokens[cursor.index];
    if (/^[a-zA-Z]$/.test(raw)) {
      cmd = raw;
      cursor.index += 1;
      continue;
    }
    if (!cmd) return null;

    if (cmd === "M" || cmd === "m") {
      const xNext = readNumberToken(tokens, cursor);
      const yNext = readNumberToken(tokens, cursor);
      if (xNext == null || yNext == null) return null;
      x = (cmd === "m") ? (x + xNext) : xNext;
      y = (cmd === "m") ? (y + yNext) : yNext;
      startX = x;
      startY = y;
      points.push({ x, y });
      cmd = (cmd === "m") ? "l" : "L";
      continue;
    }

    if (cmd === "L" || cmd === "l") {
      const xNext = readNumberToken(tokens, cursor);
      const yNext = readNumberToken(tokens, cursor);
      if (xNext == null || yNext == null) return null;
      x = (cmd === "l") ? (x + xNext) : xNext;
      y = (cmd === "l") ? (y + yNext) : yNext;
      points.push({ x, y });
      continue;
    }

    if (cmd === "H" || cmd === "h") {
      const xNext = readNumberToken(tokens, cursor);
      if (xNext == null) return null;
      x = (cmd === "h") ? (x + xNext) : xNext;
      points.push({ x, y });
      continue;
    }

    if (cmd === "V" || cmd === "v") {
      const yNext = readNumberToken(tokens, cursor);
      if (yNext == null) return null;
      y = (cmd === "v") ? (y + yNext) : yNext;
      points.push({ x, y });
      continue;
    }

    if (cmd === "Z" || cmd === "z") {
      if (!points.length) return null;
      if (x !== startX || y !== startY) {
        x = startX;
        y = startY;
        points.push({ x, y });
      }
      cursor.index += 1;
      continue;
    }

    return null;
  }

  if ((cmd === "Z" || cmd === "z") && points.length) {
    const last = points[points.length - 1];
    if (last.x !== startX || last.y !== startY) {
      points.push({ x: startX, y: startY });
    }
  }

  return points.length >= 2 ? Object.freeze(points.map((point) => Object.freeze(point))) : null;
}

export function scaleAuthoringPointToWorld(
  point = {},
  {
    viewBox = {},
    worldWidthPx = 0,
    worldHeightPx = 0,
  } = {}
) {
  const vbX = clampNumber(viewBox.x, 0);
  const vbY = clampNumber(viewBox.y, 0);
  const vbW = Math.max(1, clampNumber(viewBox.width, 0));
  const vbH = Math.max(1, clampNumber(viewBox.height, 0));
  return Object.freeze({
    xW: ((clampNumber(point.x, 0) - vbX) / vbW) * Math.max(0, clampNumber(worldWidthPx, 0)),
    yW: ((clampNumber(point.y, 0) - vbY) / vbH) * Math.max(0, clampNumber(worldHeightPx, 0)),
  });
}

export function buildSvgBoundaryLoops({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  boundaryPathIds = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredPaths = parseSvgPathElements(svgText);
  const allowedIds = new Set((Array.isArray(boundaryPathIds) ? boundaryPathIds : []).map((id) => String(id || "")));
  const selectedPaths = allowedIds.size
    ? authoredPaths.filter((path) => allowedIds.has(String(path && path.id || "")))
    : authoredPaths;

  return Object.freeze(selectedPaths.map((path, index) => {
    const authoredPoints = parseSvgPolylinePath(path.d) || [];
    const worldPoints = authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
      viewBox,
      worldWidthPx,
      worldHeightPx,
    }));
    return Object.freeze({
      id: String(path && path.id || `svg_path_${index + 1}`),
      authoredPoints: Object.freeze(authoredPoints),
      worldPoints: Object.freeze(worldPoints),
    });
  }).filter((loop) => Array.isArray(loop.worldPoints) && loop.worldPoints.length >= 2));
}

export function buildBoundaryTileMask({
  loops = [],
  worldWidthPx = 0,
  worldHeightPx = 0,
  tileSizePx = 128,
} = {}) {
  const worldW = Math.max(0, clampNumber(worldWidthPx, 0));
  const worldH = Math.max(0, clampNumber(worldHeightPx, 0));
  const tileSize = Math.max(1, clampNumber(tileSizePx, 128));
  const cols = Math.max(1, Math.ceil(worldW / tileSize));
  const rows = Math.max(1, Math.ceil(worldH / tileSize));
  const occupied = new Set();

  for (const loop of Array.isArray(loops) ? loops : []) {
    const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const ax = clampNumber(a && a.xW, 0) / tileSize;
      const ay = clampNumber(a && a.yW, 0) / tileSize;
      const bx = clampNumber(b && b.xW, 0) / tileSize;
      const by = clampNumber(b && b.yW, 0) / tileSize;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = ax + ((bx - ax) * t);
        const y = ay + ((by - ay) * t);
        const col = Math.max(0, Math.min(cols - 1, Math.floor(x)));
        const row = Math.max(0, Math.min(rows - 1, Math.floor(y)));
        occupied.add(`${col},${row}`);
      }
    }
  }

  return Object.freeze({
    tileSizePx: tileSize,
    cols,
    rows,
    occupiedKeys: Object.freeze(Array.from(occupied.values()).sort()),
  });
}

export function summarizeSvgLevelSource({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  boundaryPathIds = [],
  tileSizePx = 128,
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const loops = buildSvgBoundaryLoops({
    svgText,
    worldWidthPx,
    worldHeightPx,
    boundaryPathIds,
  });
  const boundaryTileMask = buildBoundaryTileMask({
    loops,
    worldWidthPx,
    worldHeightPx,
    tileSizePx,
  });
  return Object.freeze({
    viewBox,
    loopCount: loops.length,
    loops,
    boundaryTileMask,
  });
}
