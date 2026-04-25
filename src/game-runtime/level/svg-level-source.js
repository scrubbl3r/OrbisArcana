function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function escapeRegExp(value = "") {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readAttr(attrText = "", name = "") {
  const attrName = escapeRegExp(name);
  const match = String(attrText || "").match(new RegExp(`(?:^|\\s)${attrName}="([^"]*)"`, "i"));
  return match ? String(match[1] || "") : "";
}

function parseSvgInlineStyle(styleText = "") {
  const style = Object.create(null);
  for (const part of String(styleText || "").split(";")) {
    const [rawKey, rawValue] = String(part || "").split(":");
    const key = String(rawKey || "").trim();
    if (!key) continue;
    style[key] = String(rawValue || "").trim();
  }
  return Object.freeze(style);
}

function parseTranslateTransform(transformText = "") {
  const match = String(transformText || "").match(/translate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\s*\)/i);
  if (!match) {
    return Object.freeze({ x: 0, y: 0 });
  }
  return Object.freeze({
    x: clampNumber(match[1], 0),
    y: clampNumber(match[2], 0),
  });
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

export function parseSvgCircleElements(svgText = "") {
  const matches = String(svgText || "").matchAll(/<circle\b([^>]*)\/?>/gi);
  const circles = [];
  for (const match of matches) {
    const attrs = String(match && match[1] || "");
    circles.push(Object.freeze({
      id: readAttr(attrs, "id"),
      cx: clampNumber(readAttr(attrs, "cx"), 0),
      cy: clampNumber(readAttr(attrs, "cy"), 0),
      r: clampNumber(readAttr(attrs, "r"), 0),
      style: readAttr(attrs, "style"),
    }));
  }
  return Object.freeze(circles);
}

export function parseSvgRectElements(svgText = "") {
  const matches = String(svgText || "").matchAll(/<rect\b([^>]*)\/?>/gi);
  const rects = [];
  for (const match of matches) {
    const attrs = String(match && match[1] || "");
    rects.push(Object.freeze({
      id: readAttr(attrs, "id"),
      x: clampNumber(readAttr(attrs, "x"), 0),
      y: clampNumber(readAttr(attrs, "y"), 0),
      width: clampNumber(readAttr(attrs, "width"), 0),
      height: clampNumber(readAttr(attrs, "height"), 0),
      transform: readAttr(attrs, "transform"),
      style: readAttr(attrs, "style"),
    }));
  }
  return Object.freeze(rects);
}

export function parseSvgLayerElements(svgText = "") {
  const matches = String(svgText || "").matchAll(/<g\b([^>]*)>([\s\S]*?)<\/g>/gi);
  const layers = [];
  for (const match of matches) {
    const attrs = String(match && match[1] || "");
    const body = String(match && match[2] || "");
    if (String(readAttr(attrs, "inkscape:groupmode") || "").trim().toLowerCase() !== "layer") continue;
    const translate = parseTranslateTransform(readAttr(attrs, "transform"));
    layers.push(Object.freeze({
      id: readAttr(attrs, "id"),
      label: readAttr(attrs, "inkscape:label"),
      translate,
      body,
      paths: parseSvgPathElements(body),
      circles: parseSvgCircleElements(body),
      rects: parseSvgRectElements(body),
    }));
  }
  return Object.freeze(layers);
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

function translatePoint(point = {}, translate = {}) {
  return Object.freeze({
    x: clampNumber(point && point.x, 0) + clampNumber(translate && translate.x, 0),
    y: clampNumber(point && point.y, 0) + clampNumber(translate && translate.y, 0),
  });
}

function translatePolylinePoints(points = [], translate = {}) {
  return Object.freeze((Array.isArray(points) ? points : []).map((point) => translatePoint(point, translate)));
}

function translateRect(rect = {}, translate = {}) {
  return Object.freeze({
    ...rect,
    x: clampNumber(rect && rect.x, 0) + clampNumber(translate && translate.x, 0),
    y: clampNumber(rect && rect.y, 0) + clampNumber(translate && translate.y, 0),
  });
}

function translateCircle(circle = {}, translate = {}) {
  return Object.freeze({
    ...circle,
    cx: clampNumber(circle && circle.cx, 0) + clampNumber(translate && translate.x, 0),
    cy: clampNumber(circle && circle.cy, 0) + clampNumber(translate && translate.y, 0),
  });
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

function buildClosedRectPolyline(rect = {}) {
  const x = clampNumber(rect && rect.x, 0);
  const y = clampNumber(rect && rect.y, 0);
  const width = Math.max(0, clampNumber(rect && rect.width, 0));
  const height = Math.max(0, clampNumber(rect && rect.height, 0));
  if (width <= 0 || height <= 0) return null;
  return Object.freeze([
    Object.freeze({ x, y }),
    Object.freeze({ x: x + width, y }),
    Object.freeze({ x: x + width, y: y + height }),
    Object.freeze({ x, y: y + height }),
    Object.freeze({ x, y }),
  ]);
}

export function buildSvgBoundaryLoops({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  boundaryPathIds = [],
  boundaryLayerLabels = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredPaths = parseSvgPathElements(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedIds = new Set((Array.isArray(boundaryPathIds) ? boundaryPathIds : []).map((id) => String(id || "")));
  const allowedLabels = new Set(
    (Array.isArray(boundaryLayerLabels) ? boundaryLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  let selectedPaths = authoredPaths;
  let selectedRects = parseSvgRectElements(svgText);
  if (allowedLabels.size) {
    const matchingLayers = authoredLayers
      .filter((layer) => allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase()));
    selectedPaths = matchingLayers
      .flatMap((layer) => (Array.isArray(layer.paths) ? layer.paths : []).map((path) => Object.freeze({
        ...path,
        translatedAuthoredPoints: translatePolylinePoints(
          parseSvgPolylinePath(path && path.d) || [],
          layer && layer.translate
        ),
      })));
    selectedRects = matchingLayers
      .flatMap((layer) => (Array.isArray(layer.rects) ? layer.rects : []).map((rect) => translateRect(rect, layer && layer.translate)));
  }
  if (allowedIds.size) {
    selectedPaths = selectedPaths.filter((path) => allowedIds.has(String(path && path.id || "")));
    selectedRects = selectedRects.filter((rect) => allowedIds.has(String(rect && rect.id || "")));
  }

  const pathLoops = selectedPaths.map((path, index) => {
    const authoredPoints = Array.isArray(path && path.translatedAuthoredPoints)
      ? path.translatedAuthoredPoints
      : (parseSvgPolylinePath(path && path.d) || []);
    const worldPoints = authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
      viewBox,
      worldWidthPx,
      worldHeightPx,
    }));
    return Object.freeze({
      id: String(path && path.id || `svg_path_${index + 1}`),
      kind: "path_loop",
      authoredPoints: Object.freeze(authoredPoints),
      worldPoints: Object.freeze(worldPoints),
    });
  }).filter((loop) => Array.isArray(loop.worldPoints) && loop.worldPoints.length >= 2);

  const rectLoops = selectedRects.map((rect, index) => {
    const authoredPoints = buildClosedRectPolyline(rect) || [];
    const worldPoints = authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
      viewBox,
      worldWidthPx,
      worldHeightPx,
    }));
    return Object.freeze({
      id: String(rect && rect.id || `svg_rect_${index + 1}`),
      kind: "rect_loop",
      authoredPoints: Object.freeze(authoredPoints),
      worldPoints: Object.freeze(worldPoints),
    });
  }).filter((loop) => Array.isArray(loop.worldPoints) && loop.worldPoints.length >= 4);

  return Object.freeze([
    ...pathLoops,
    ...rectLoops,
  ]);
}

export function resolveBoundaryBoxFromLoops(loops = []) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const loop of Array.isArray(loops) ? loops : []) {
    for (const point of Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : []) {
      const x = clampNumber(point && point.xW, NaN);
      const y = clampNumber(point && point.yW, NaN);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return Object.freeze({
    leftXW: minX,
    topYW: minY,
    rightXW: maxX,
    bottomYW: maxY,
    widthW: Math.max(0, maxX - minX),
    heightW: Math.max(0, maxY - minY),
  });
}

export function buildSvgSpawnMarkers({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  spawnLayerLabels = [],
  spawnMarkerId = "",
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(spawnLayerLabels) ? spawnLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  let circles = parseSvgCircleElements(svgText);
  if (allowedLabels.size) {
    circles = authoredLayers
      .filter((layer) => allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase()))
      .flatMap((layer) => (Array.isArray(layer.circles) ? layer.circles : []).map((circle) => translateCircle(circle, layer && layer.translate)));
  }
  const markerId = String(spawnMarkerId || "").trim();
  if (markerId) {
    circles = circles.filter((circle) => String(circle && circle.id || "").trim() === markerId);
  }
  return Object.freeze(circles.map((circle, index) => {
    const authoredCenter = Object.freeze({
      x: clampNumber(circle && circle.cx, 0),
      y: clampNumber(circle && circle.cy, 0),
    });
    return Object.freeze({
      id: String(circle && circle.id || `spawn_${index + 1}`),
      authoredCenter,
      worldCenter: scaleAuthoringPointToWorld(authoredCenter, {
        viewBox,
        worldWidthPx,
        worldHeightPx,
      }),
      authoredRadius: clampNumber(circle && circle.r, 0),
    });
  }));
}

export function buildSvgCameraAnchors({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  cameraLayerLabels = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(cameraLayerLabels) ? cameraLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  let anchors = parseSvgCircleElements(svgText).map((circle) => Object.freeze({
    id: String(circle && circle.id || "").trim(),
    authoredCenter: Object.freeze({
      x: clampNumber(circle && circle.cx, 0),
      y: clampNumber(circle && circle.cy, 0),
    }),
    authoredRadius: clampNumber(circle && circle.r, 0),
  }));
  if (allowedLabels.size) {
    anchors = authoredLayers
      .filter((layer) => allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase()))
      .flatMap((layer) => {
        const circles = Array.isArray(layer.circles) ? layer.circles : [];
        const rects = Array.isArray(layer.rects) ? layer.rects : [];
        return [
          ...circles.map((circleSource) => {
            const circle = translateCircle(circleSource, layer && layer.translate);
            return Object.freeze({
            id: String(circle && circle.id || "").trim(),
            authoredCenter: Object.freeze({
              x: clampNumber(circle && circle.cx, 0),
              y: clampNumber(circle && circle.cy, 0),
            }),
            authoredRadius: clampNumber(circle && circle.r, 0),
          });
          }),
          ...rects.map((rectSource) => {
            const rect = translateRect(rectSource, layer && layer.translate);
            return Object.freeze({
            id: String(rect && rect.id || "").trim(),
            authoredCenter: Object.freeze({
              x: clampNumber(rect && rect.x, 0) + (clampNumber(rect && rect.width, 0) * 0.5),
              y: clampNumber(rect && rect.y, 0) + (clampNumber(rect && rect.height, 0) * 0.5),
            }),
            authoredRadius: Math.max(
              clampNumber(rect && rect.width, 0),
              clampNumber(rect && rect.height, 0)
            ) * 0.5,
          });
          }),
        ];
      });
  }
  return Object.freeze(anchors.map((anchor, index) => {
    const authoredCenter = anchor && anchor.authoredCenter ? anchor.authoredCenter : Object.freeze({ x: 0, y: 0 });
    return Object.freeze({
      id: String(anchor && anchor.id || `camera_anchor_${index + 1}`),
      authoredCenter,
      worldCenter: scaleAuthoringPointToWorld(authoredCenter, {
        viewBox,
        worldWidthPx,
        worldHeightPx,
      }),
      authoredRadius: clampNumber(anchor && anchor.authoredRadius, 0),
    });
  }));
}

export function buildSvgCameraBoundaryLoops({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  cameraBoundaryLayerLabels = [],
} = {}) {
  return buildSvgBoundaryLoops({
    svgText,
    worldWidthPx,
    worldHeightPx,
    boundaryLayerLabels: cameraBoundaryLayerLabels,
  });
}

export function buildSvgWorldItemSpawns({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  worldItemLayerLabels = [],
  defaultKind = "energy_globe_emitter",
  defaultRadiusPx = 25,
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(worldItemLayerLabels) ? worldItemLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  const matchingLayers = authoredLayers
    .filter((layer) => allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase()));
  const spawns = [];
  for (const layer of matchingLayers) {
    const layerLabel = String(layer && layer.label || "").trim();
    const circles = Array.isArray(layer && layer.circles) ? layer.circles : [];
    for (let index = 0; index < circles.length; index += 1) {
      const circle = translateCircle(circles[index], layer && layer.translate);
      const authoredCenter = Object.freeze({
        x: clampNumber(circle && circle.cx, 0),
        y: clampNumber(circle && circle.cy, 0),
      });
      const worldCenter = scaleAuthoringPointToWorld(authoredCenter, {
        viewBox,
        worldWidthPx,
        worldHeightPx,
      });
      spawns.push(Object.freeze({
        id: String(layerLabel || circle && circle.id || `world_item_spawn_${spawns.length + 1}`),
        kind: defaultKind,
        xNorm: clampNumber(authoredCenter.x, 0) / Math.max(1, clampNumber(viewBox.width, 0)),
        yW: clampNumber(worldCenter.yW, 0),
        r: Math.max(1, Number(defaultRadiusPx) || 25),
        capacity: 1,
        regenTrigger: "globe_spent",
        authoredCenter,
        worldCenter,
        authoredRadius: clampNumber(circle && circle.r, 0),
      }));
    }
  }
  return Object.freeze(spawns);
}

export function buildSvgLineArtShapes({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  lineArtLayerLabels = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(lineArtLayerLabels) ? lineArtLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  const matchingLayers = authoredLayers
    .filter((layer) => allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase()));
  const worldScaleX = Math.max(0, clampNumber(worldWidthPx, 0)) / Math.max(1, clampNumber(viewBox.width, 0));

  return Object.freeze(matchingLayers.flatMap((layer) => {
    const paths = Array.isArray(layer && layer.paths) ? layer.paths : [];
    return paths.map((path, index) => {
      const authoredPoints = translatePolylinePoints(
        parseSvgPolylinePath(path && path.d) || [],
        layer && layer.translate
      );
      if (authoredPoints.length < 2) return null;
      const style = parseSvgInlineStyle(path && path.style);
      return Object.freeze({
        id: String(path && path.id || `${String(layer && layer.label || "line_art").trim()}_${index + 1}`),
        authoredPoints,
        worldPoints: Object.freeze(authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
          viewBox,
          worldWidthPx,
          worldHeightPx,
        }))),
        fill: String(style.fill || "none"),
        fillOpacity: clampNumber(style["fill-opacity"], 1),
        stroke: String(style.stroke || "none"),
        strokeOpacity: clampNumber(style["stroke-opacity"], 1),
        authoredStrokeWidth: clampNumber(style["stroke-width"], 0),
        worldStrokeWidth: clampNumber(style["stroke-width"], 0) * worldScaleX,
      });
    }).filter(Boolean);
  }));
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
  boundaryLayerLabels = [],
  spawnLayerLabels = [],
  cameraLayerLabels = [],
  cameraBoundaryLayerLabels = [],
  worldItemLayerLabels = [],
  lineArtLayerLabels = [],
  spawnMarkerId = "",
  tileSizePx = 128,
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const loops = buildSvgBoundaryLoops({
    svgText,
    worldWidthPx,
    worldHeightPx,
    boundaryPathIds,
    boundaryLayerLabels,
  });
  const spawnMarkers = buildSvgSpawnMarkers({
    svgText,
    worldWidthPx,
    worldHeightPx,
    spawnLayerLabels,
    spawnMarkerId,
  });
  const cameraAnchors = buildSvgCameraAnchors({
    svgText,
    worldWidthPx,
    worldHeightPx,
    cameraLayerLabels,
  });
  const cameraBoundaryLoops = buildSvgCameraBoundaryLoops({
    svgText,
    worldWidthPx,
    worldHeightPx,
    cameraBoundaryLayerLabels,
  });
  const worldItemSpawns = buildSvgWorldItemSpawns({
    svgText,
    worldWidthPx,
    worldHeightPx,
    worldItemLayerLabels,
  });
  const lineArtShapes = buildSvgLineArtShapes({
    svgText,
    worldWidthPx,
    worldHeightPx,
    lineArtLayerLabels,
  });
  const boundaryTileMask = buildBoundaryTileMask({
    loops,
    worldWidthPx,
    worldHeightPx,
    tileSizePx,
  });
  const boundaryBox = resolveBoundaryBoxFromLoops(loops);
  const cameraBoundaryBox = resolveBoundaryBoxFromLoops(cameraBoundaryLoops);
  return Object.freeze({
    viewBox,
    loopCount: loops.length,
    loops,
    spawnMarkers: Object.freeze(spawnMarkers),
    cameraAnchors: Object.freeze(cameraAnchors),
    cameraBoundaryLoops: Object.freeze(cameraBoundaryLoops),
    cameraBoundaryBox,
    worldItemSpawns: Object.freeze(worldItemSpawns),
    lineArtShapes: Object.freeze(lineArtShapes),
    boundaryBox,
    boundaryTileMask,
  });
}
