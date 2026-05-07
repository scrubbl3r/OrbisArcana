import {
  LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
  LEVEL_SVG_DEPTH_MATERIAL_FALLBACK,
  LEVEL_SVG_DEPTH_TESSELLATION_FALLBACK,
  LEVEL_SVG_METADATA_SCALE_MODE_FIXED,
  LEVEL_SVG_METADATA_SCALE_MODE_ORB,
  LEVEL_SVG_METADATA_Z_MODE_ORB,
  LEVEL_SVG_METADATA_Z_MODE_WORLD,
  LEVEL_SVG_PROP_ANCHOR_BASE,
  LEVEL_SVG_PROP_ANCHOR_BOTTOM,
  LEVEL_SVG_PROP_ANCHOR_CENTER,
  LEVEL_SVG_PROP_ANCHOR_TOP,
  LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
  LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
  LEVEL_WORLD_ITEM_Z_MODE_FALLBACK,
} from "./normalize-level-definition.js";

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

function isSvgRenderLayerVisible(layer = {}) {
  const style = parseSvgInlineStyle(layer && layer.style);
  const display = String((layer && layer.display) || style.display || "").trim().toLowerCase();
  const visibility = String((layer && layer.visibility) || style.visibility || "").trim().toLowerCase();
  return display !== "none" && visibility !== "hidden" && visibility !== "collapse";
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

function parseBoValue(value = "", fallback = 0) {
  const raw = String(value || "").trim().toLowerCase();
  const match = raw.match(/^(-?(?:\d*\.\d+|\d+))(?:\s*bo)?$/);
  if (!match) return fallback;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : fallback;
}

function parseSvgLabelMetadata(label = "", fallbackId = "") {
  const text = String(label || "").trim();
  const entries = Object.create(null);
  const pairMatches = text.matchAll(/([a-zA-Z_][\w-]*)\s*(?::|=)\s*([^,\s]+)/g);
  for (const match of pairMatches) {
    const key = String(match && match[1] || "").trim().toLowerCase();
    const value = String(match && match[2] || "").trim();
    if (!key || !value) continue;
    entries[key] = value.replace(/^["']|["']$/g, "");
  }

  const zRaw = String(entries.z || entries.zbo || entries.depth || "").trim();
  const zNormalized = zRaw.toLowerCase();
  let zMode = LEVEL_WORLD_ITEM_Z_MODE_FALLBACK;
  let zBO = parseBoValue(zRaw, 4);
  if (zNormalized === LEVEL_SVG_METADATA_Z_MODE_ORB || zNormalized === "orbz" || zNormalized === "orb_z") {
    zMode = LEVEL_SVG_METADATA_Z_MODE_ORB;
    zBO = null;
  } else if (zNormalized === "world" || zNormalized === "map") {
    zMode = LEVEL_SVG_METADATA_Z_MODE_WORLD;
    zBO = null;
  }

  const hasScale = Object.prototype.hasOwnProperty.call(entries, "scale");
  const scaleRaw = hasScale ? entries.scale : "";
  const scaleNormalized = String(scaleRaw || "").trim().toLowerCase();
  let scaleMode = LEVEL_SVG_METADATA_SCALE_MODE_FIXED;
  let scale = hasScale ? Math.max(0.01, clampNumber(scaleRaw, 1)) : 1;
  if (scaleNormalized === LEVEL_SVG_METADATA_SCALE_MODE_ORB || scaleNormalized === "bo") {
    scaleMode = LEVEL_SVG_METADATA_SCALE_MODE_ORB;
    scale = 1;
  }

  const depthRole = entries.depth && !/^[-+]?(?:\d*\.\d+|\d+)(?:\s*bo)?$/i.test(entries.depth)
    ? String(entries.depth || "").trim()
    : "";

  return Object.freeze({
    rawLabel: text,
    entries: Object.freeze({ ...entries }),
    id: String(entries.id || fallbackId || "").trim(),
    role: depthRole ? "depth" : String(entries.role || entries.type || "").trim().toLowerCase(),
    kind: String(entries.kind || entries.type || depthRole || "").trim().toLowerCase(),
    zMode,
    zBO,
    anchor: String(entries.anchor || LEVEL_SVG_PROP_ANCHOR_CENTER).trim().toLowerCase(),
    scaleMode,
    scale,
    maxDepthBO: Math.max(0, parseBoValue(entries.max || entries.maxdepth || entries.depthmax || "", 10)),
    material: String(entries.material || entries.mat || LEVEL_SVG_DEPTH_MATERIAL_FALLBACK).trim().toLowerCase(),
    tessellation: Math.max(2, Math.round(clampNumber(entries.tess || entries.tessellation, LEVEL_SVG_DEPTH_TESSELLATION_FALLBACK))),
  });
}

function resolveSvgMetadataId(source = {}, fallbackId = "") {
  const metadata = parseSvgLabelMetadata(source && source.label, source && source.id);
  return String(metadata.id || fallbackId || source && source.id || "").trim();
}

function resolveSvgSourceStack(layer = {}, sourceElementIndex = 0) {
  const layerIndex = Number.isFinite(Number(layer && layer.sourceLayerIndex))
    ? Number(layer.sourceLayerIndex)
    : 0;
  return Object.freeze({
    sourceLayerId: String(layer && layer.id || ""),
    sourceLayerLabel: String(layer && layer.label || ""),
    sourceLayerIndex: layerIndex,
    sourceStackIndex: layerIndex,
    sourceElementIndex: Math.max(0, Math.round(clampNumber(sourceElementIndex, 0))),
  });
}

function parseDepthLayerLabel(label = "") {
  const metadata = parseSvgLabelMetadata(label);
  const entries = metadata.entries || {};
  const text = String(label || "").trim();
  const legacyMatch = text.match(/^depth\s*:\s*([^,\s]+)/i);
  const name = String(metadata.kind || (legacyMatch && legacyMatch[1]) || metadata.id || "").trim();
  if (!name) return null;
  if (metadata.role !== "depth" && !legacyMatch) return null;
  return Object.freeze({
    id: name,
    label: text,
    maxDepthBO: metadata.maxDepthBO,
    orbZBO: metadata.zMode === LEVEL_WORLD_ITEM_Z_MODE_FALLBACK ? Math.max(0, parseBoValue(entries.z || entries.orbz || entries.orb_z || "", 4)) : 4,
    material: metadata.material,
    tessellation: metadata.tessellation,
  });
}

function parsePropLabelText(label = "", fallbackId = "") {
  const metadata = parseSvgLabelMetadata(label, fallbackId);
  return Object.freeze({
    id: metadata.id,
    zMode: metadata.zMode,
    zBO: metadata.zBO == null ? 4 : metadata.zBO,
    anchor: metadata.anchor,
    scaleMode: metadata.scaleMode,
    scale: metadata.scale,
  });
}

function inferPropKind(id = "") {
  const text = String(id || "").trim().toLowerCase();
  if (!text) return "";
  const match = text.match(/^([a-z][a-z0-9-]*)[_:-]/i);
  return match ? String(match[1] || "").toLowerCase() : text;
}

function resolveRectPropAnchor(rect = {}, anchor = LEVEL_SVG_PROP_ANCHOR_CENTER) {
  const x = clampNumber(rect && rect.x, 0);
  const y = clampNumber(rect && rect.y, 0);
  const width = clampNumber(rect && rect.width, 0);
  const height = clampNumber(rect && rect.height, 0);
  const normalizedAnchor = String(anchor || LEVEL_SVG_PROP_ANCHOR_CENTER).trim().toLowerCase();
  if (normalizedAnchor === LEVEL_SVG_PROP_ANCHOR_TOP) {
    return Object.freeze({ x: x + (width * 0.5), y });
  }
  if (normalizedAnchor === LEVEL_SVG_PROP_ANCHOR_BOTTOM || normalizedAnchor === LEVEL_SVG_PROP_ANCHOR_BASE) {
    return Object.freeze({ x: x + (width * 0.5), y: y + height });
  }
  return Object.freeze({ x: x + (width * 0.5), y: y + (height * 0.5) });
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
      label: readAttr(attrs, "inkscape:label"),
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
      label: readAttr(attrs, "inkscape:label"),
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
      label: readAttr(attrs, "inkscape:label"),
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
    const sourceLayerIndex = layers.length;
    layers.push(Object.freeze({
      id: readAttr(attrs, "id"),
      label: readAttr(attrs, "inkscape:label"),
      sourceLayerIndex,
      sourceStackIndex: sourceLayerIndex,
      style: readAttr(attrs, "style"),
      display: readAttr(attrs, "display"),
      visibility: readAttr(attrs, "visibility"),
      translate,
      body,
      paths: parseSvgPathElements(body),
      circles: parseSvgCircleElements(body),
      rects: parseSvgRectElements(body),
    }));
  }
  return Object.freeze(layers);
}

export function extractSvgDefsMarkup(svgText = "") {
  const defs = [];
  const matches = String(svgText || "").matchAll(/<defs\b[^>]*>[\s\S]*?<\/defs>/gi);
  for (const match of matches) {
    const markup = String(match && match[0] || "").trim();
    if (markup) defs.push(markup);
  }
  return Object.freeze(defs);
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
      .flatMap((layer) => (Array.isArray(layer.paths) ? layer.paths : []).map((path, index) => Object.freeze({
        ...path,
        ...resolveSvgSourceStack(layer, index),
        translatedAuthoredPoints: translatePolylinePoints(
          parseSvgPolylinePath(path && path.d) || [],
          layer && layer.translate
        ),
      })));
    selectedRects = matchingLayers
      .flatMap((layer) => (Array.isArray(layer.rects) ? layer.rects : []).map((rect, index) => Object.freeze({
        ...translateRect(rect, layer && layer.translate),
        ...resolveSvgSourceStack(layer, index),
      })));
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
      sourceLayerId: String(path && path.sourceLayerId || ""),
      sourceLayerLabel: String(path && path.sourceLayerLabel || ""),
      sourceLayerIndex: clampNumber(path && path.sourceLayerIndex, 0),
      sourceStackIndex: clampNumber(path && path.sourceStackIndex, 0),
      sourceElementIndex: clampNumber(path && path.sourceElementIndex, index),
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
      sourceLayerId: String(rect && rect.sourceLayerId || ""),
      sourceLayerLabel: String(rect && rect.sourceLayerLabel || ""),
      sourceLayerIndex: clampNumber(rect && rect.sourceLayerIndex, 0),
      sourceStackIndex: clampNumber(rect && rect.sourceStackIndex, 0),
      sourceElementIndex: clampNumber(rect && rect.sourceElementIndex, index),
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
  primarySpawnId = "",
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
      .flatMap((layer) => (Array.isArray(layer.circles) ? layer.circles : []).map((circle, index) => Object.freeze({
        ...translateCircle(circle, layer && layer.translate),
        ...resolveSvgSourceStack(layer, index),
      })));
  }
  const markerId = String(primarySpawnId || "").trim();
  if (markerId) {
    circles = circles.filter((circle) => (
      String(circle && circle.id || "").trim() === markerId ||
      resolveSvgMetadataId(circle) === markerId
    ));
  }
  return Object.freeze(circles.map((circle, index) => {
    const metadata = parseSvgLabelMetadata(circle && circle.label, circle && circle.id);
    const authoredCenter = Object.freeze({
      x: clampNumber(circle && circle.cx, 0),
      y: clampNumber(circle && circle.cy, 0),
    });
    return Object.freeze({
      id: String(metadata.id || circle && circle.id || `spawn_${index + 1}`),
      zMode: metadata.zMode,
      zBO: metadata.zBO,
      sourceLayerId: String(circle && circle.sourceLayerId || ""),
      sourceLayerLabel: String(circle && circle.sourceLayerLabel || ""),
      sourceLayerIndex: clampNumber(circle && circle.sourceLayerIndex, 0),
      sourceStackIndex: clampNumber(circle && circle.sourceStackIndex, 0),
      sourceElementIndex: clampNumber(circle && circle.sourceElementIndex, index),
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
    id: resolveSvgMetadataId(circle),
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
          ...circles.map((circleSource, sourceElementIndex) => {
            const circle = Object.freeze({
              ...translateCircle(circleSource, layer && layer.translate),
              ...resolveSvgSourceStack(layer, sourceElementIndex),
            });
            return Object.freeze({
              id: resolveSvgMetadataId(circle),
              sourceLayerId: String(circle && circle.sourceLayerId || ""),
              sourceLayerLabel: String(circle && circle.sourceLayerLabel || ""),
              sourceLayerIndex: clampNumber(circle && circle.sourceLayerIndex, 0),
              sourceStackIndex: clampNumber(circle && circle.sourceStackIndex, 0),
              sourceElementIndex: clampNumber(circle && circle.sourceElementIndex, 0),
              authoredCenter: Object.freeze({
                x: clampNumber(circle && circle.cx, 0),
                y: clampNumber(circle && circle.cy, 0),
              }),
              authoredRadius: clampNumber(circle && circle.r, 0),
            });
          }),
          ...rects.map((rectSource, sourceElementIndex) => {
            const rect = Object.freeze({
              ...translateRect(rectSource, layer && layer.translate),
              ...resolveSvgSourceStack(layer, sourceElementIndex),
            });
            return Object.freeze({
              id: resolveSvgMetadataId(rect),
              sourceLayerId: String(rect && rect.sourceLayerId || ""),
              sourceLayerLabel: String(rect && rect.sourceLayerLabel || ""),
              sourceLayerIndex: clampNumber(rect && rect.sourceLayerIndex, 0),
              sourceStackIndex: clampNumber(rect && rect.sourceStackIndex, 0),
              sourceElementIndex: clampNumber(rect && rect.sourceElementIndex, 0),
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
  defaultKind = LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER,
  defaultRadiusPx = 25,
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(worldItemLayerLabels) ? worldItemLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  const matchingLayers = authoredLayers
    .filter((layer) => (
      allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase())
      && isSvgRenderLayerVisible(layer)
    ));
  const spawns = [];
  for (const layer of matchingLayers) {
    const circles = Array.isArray(layer && layer.circles) ? layer.circles : [];
    for (let index = 0; index < circles.length; index += 1) {
      const circle = translateCircle(circles[index], layer && layer.translate);
      const metadata = parseSvgLabelMetadata(circle && circle.label, circle && circle.id);
      const sourceStack = resolveSvgSourceStack(layer, index);
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
        id: String(metadata.id || circle && circle.id || `world_item_spawn_${spawns.length + 1}`),
        kind: String(metadata.kind || defaultKind),
        ...sourceStack,
        zMode: metadata.zMode,
        zBO: metadata.zBO,
        scaleMode: metadata.scaleMode,
        scale: metadata.scale,
        xNorm: clampNumber(authoredCenter.x, 0) / Math.max(1, clampNumber(viewBox.width, 0)),
        yW: clampNumber(worldCenter.yW, 0),
        r: Math.max(1, Number(defaultRadiusPx) || 25),
        capacity: 1,
        regenTrigger: LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT,
        authoredCenter,
        worldCenter,
        authoredRadius: clampNumber(circle && circle.r, 0),
        sourceId: String(circle && circle.id || ""),
        sourceLabel: String(circle && circle.label || ""),
      }));
    }
  }
  return Object.freeze(spawns);
}

export function buildSvgPropInstances({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  propLayerLabels = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(propLayerLabels) ? propLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  const matchingLayers = authoredLayers
    .filter((layer) => (
      allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase())
      && isSvgRenderLayerVisible(layer)
    ));
  const props = [];
  for (const layer of matchingLayers) {
    const rects = Array.isArray(layer && layer.rects) ? layer.rects : [];
    const circles = Array.isArray(layer && layer.circles) ? layer.circles : [];
    for (const rectSource of rects) {
      const rect = translateRect(rectSource, layer && layer.translate);
      const rawId = String(rect && rect.id || "").trim();
      const rawLabel = String(rect && rect.label || "").trim();
      const config = parsePropLabelText(rawLabel, rawId);
      const id = String(config.id || rawId || `prop_${props.length + 1}`).trim();
      const sourceStack = resolveSvgSourceStack(layer, props.length);
      const authoredCenter = Object.freeze({
        x: clampNumber(rect && rect.x, 0) + (clampNumber(rect && rect.width, 0) * 0.5),
        y: clampNumber(rect && rect.y, 0) + (clampNumber(rect && rect.height, 0) * 0.5),
      });
      const authoredAnchor = resolveRectPropAnchor(rect, config.anchor);
      const worldTopLeft = scaleAuthoringPointToWorld({
        x: clampNumber(rect && rect.x, 0),
        y: clampNumber(rect && rect.y, 0),
      }, {
        viewBox,
        worldWidthPx,
        worldHeightPx,
      });
      const worldBottomRight = scaleAuthoringPointToWorld({
        x: clampNumber(rect && rect.x, 0) + clampNumber(rect && rect.width, 0),
        y: clampNumber(rect && rect.y, 0) + clampNumber(rect && rect.height, 0),
      }, {
        viewBox,
        worldWidthPx,
        worldHeightPx,
      });
      props.push(Object.freeze({
        id,
        kind: inferPropKind(id),
        ...sourceStack,
        zMode: config.zMode,
        zBO: config.zBO,
        anchor: config.anchor,
        scaleMode: config.scaleMode,
        scale: config.scale,
        sourceShape: "rect",
        authoredCenter,
        authoredAnchor,
        worldCenter: scaleAuthoringPointToWorld(authoredCenter, {
          viewBox,
          worldWidthPx,
          worldHeightPx,
        }),
        worldAnchor: scaleAuthoringPointToWorld(authoredAnchor, {
          viewBox,
          worldWidthPx,
          worldHeightPx,
        }),
        authoredBox: Object.freeze({
          x: clampNumber(rect && rect.x, 0),
          y: clampNumber(rect && rect.y, 0),
          width: clampNumber(rect && rect.width, 0),
          height: clampNumber(rect && rect.height, 0),
        }),
        worldBox: Object.freeze({
          xW: clampNumber(worldTopLeft.xW, 0),
          yW: clampNumber(worldTopLeft.yW, 0),
          width: Math.abs(clampNumber(worldBottomRight.xW, 0) - clampNumber(worldTopLeft.xW, 0)),
          height: Math.abs(clampNumber(worldBottomRight.yW, 0) - clampNumber(worldTopLeft.yW, 0)),
        }),
        sourceId: rawId,
        sourceLabel: rawLabel,
      }));
    }
    for (const circleSource of circles) {
      const circle = translateCircle(circleSource, layer && layer.translate);
      const rawId = String(circle && circle.id || "").trim();
      const rawLabel = String(circle && circle.label || "").trim();
      const config = parsePropLabelText(rawLabel, rawId);
      const id = String(config.id || rawId || `prop_${props.length + 1}`).trim();
      const sourceStack = resolveSvgSourceStack(layer, props.length);
      const authoredCenter = Object.freeze({
        x: clampNumber(circle && circle.cx, 0),
        y: clampNumber(circle && circle.cy, 0),
      });
      const authoredAnchor = authoredCenter;
      props.push(Object.freeze({
        id,
        kind: inferPropKind(id),
        ...sourceStack,
        zMode: config.zMode,
        zBO: config.zBO,
        anchor: config.anchor,
        scaleMode: config.scaleMode,
        scale: config.scale,
        sourceShape: "circle",
        authoredCenter,
        authoredAnchor,
        worldCenter: scaleAuthoringPointToWorld(authoredCenter, {
          viewBox,
          worldWidthPx,
          worldHeightPx,
        }),
        worldAnchor: scaleAuthoringPointToWorld(authoredAnchor, {
          viewBox,
          worldWidthPx,
          worldHeightPx,
        }),
        authoredRadius: clampNumber(circle && circle.r, 0),
        sourceId: rawId,
        sourceLabel: rawLabel,
      }));
    }
  }
  return Object.freeze(props);
}

export function buildSvgArtShapes({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  artLayerLabels = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(artLayerLabels) ? artLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  const matchingLayers = authoredLayers
    .filter((layer) => (
      allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase())
      && isSvgRenderLayerVisible(layer)
    ));
  const worldScaleX = Math.max(0, clampNumber(worldWidthPx, 0)) / Math.max(1, clampNumber(viewBox.width, 0));

  return Object.freeze(matchingLayers.flatMap((layer) => {
    const paths = Array.isArray(layer && layer.paths) ? layer.paths : [];
    return paths.map((path, index) => {
      const metadata = parseSvgLabelMetadata(path && path.label, path && path.id);
      const sourceStack = resolveSvgSourceStack(layer, index);
      const authoredPoints = translatePolylinePoints(
        parseSvgPolylinePath(path && path.d) || [],
        layer && layer.translate
      );
      if (authoredPoints.length < 2) return null;
      const style = parseSvgInlineStyle(path && path.style);
      return Object.freeze({
        id: String(metadata.id || path && path.id || `${String(layer && layer.label || "art").trim()}_${index + 1}`),
        ...sourceStack,
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

export function buildSvgStarsFieldRegions({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
  starsFieldLayerLabels = [],
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const allowedLabels = new Set(
    (Array.isArray(starsFieldLayerLabels) ? starsFieldLayerLabels : []).map((label) => String(label || "").trim().toLowerCase())
  );
  const loops = authoredLayers
    .filter((layer) => (
      allowedLabels.has(String(layer && layer.label || "").trim().toLowerCase())
      && isSvgRenderLayerVisible(layer)
    ))
    .flatMap((layer) => {
      const pathLoops = (Array.isArray(layer && layer.paths) ? layer.paths : []).map((path, index) => {
        const metadata = parseSvgLabelMetadata(path && path.label, path && path.id);
        const sourceStack = resolveSvgSourceStack(layer, index);
        const authoredPoints = translatePolylinePoints(
          parseSvgPolylinePath(path && path.d) || [],
          layer && layer.translate
        );
        if (authoredPoints.length < 3) return null;
        return Object.freeze({
          id: String(metadata.id || path && path.id || `stars_field_path_${index + 1}`),
          kind: "path_loop",
          ...sourceStack,
          authoredPoints,
          worldPoints: Object.freeze(authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
            viewBox,
            worldWidthPx,
            worldHeightPx,
          }))),
        });
      });
      const rectLoops = (Array.isArray(layer && layer.rects) ? layer.rects : []).map((rect, index) => {
        const metadata = parseSvgLabelMetadata(rect && rect.label, rect && rect.id);
        const sourceStack = resolveSvgSourceStack(layer, index);
        const authoredRect = translateRect(rect, layer && layer.translate);
        const authoredPoints = buildClosedRectPolyline(authoredRect) || [];
        if (authoredPoints.length < 4) return null;
        return Object.freeze({
          id: String(metadata.id || rect && rect.id || `stars_field_rect_${index + 1}`),
          kind: "rect_loop",
          ...sourceStack,
          authoredPoints,
          worldPoints: Object.freeze(authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
            viewBox,
            worldWidthPx,
            worldHeightPx,
          }))),
        });
      });
      return [...pathLoops, ...rectLoops].filter(Boolean);
    });
  return Object.freeze((Array.isArray(loops) ? loops : []).map((loop, index) => Object.freeze({
    id: String(loop && loop.id || `stars_field_${index + 1}`),
    kind: String(loop && loop.kind || "path_loop"),
    sourceLayerId: String(loop && loop.sourceLayerId || ""),
    sourceLayerLabel: String(loop && loop.sourceLayerLabel || ""),
    sourceLayerIndex: clampNumber(loop && loop.sourceLayerIndex, 0),
    sourceStackIndex: clampNumber(loop && loop.sourceStackIndex, 0),
    sourceElementIndex: clampNumber(loop && loop.sourceElementIndex, index),
    authoredPoints: Array.isArray(loop && loop.authoredPoints) ? loop.authoredPoints : [],
    worldPoints: Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [],
    boundaryBox: resolveBoundaryBoxFromLoops([loop]),
  })));
}

export function buildSvgDepthLayers({
  svgText = "",
  worldWidthPx = 0,
  worldHeightPx = 0,
} = {}) {
  const viewBox = parseSvgViewBox(svgText);
  const authoredLayers = parseSvgLayerElements(svgText);
  const defsMarkup = extractSvgDefsMarkup(svgText);
  const depthLayers = [];
  for (let index = 0; index < authoredLayers.length; index += 1) {
    const layer = authoredLayers[index];
    if (!isSvgRenderLayerVisible(layer)) continue;
    const layerConfig = parseDepthLayerLabel(layer && layer.label);
    const depthSources = layerConfig
      ? [Object.freeze({
          config: layerConfig,
          paths: Array.isArray(layer.paths) ? layer.paths : [],
          rects: Array.isArray(layer.rects) ? layer.rects : [],
        })]
      : [
          ...(Array.isArray(layer.paths) ? layer.paths : []).map((path, sourceElementIndex) => Object.freeze({
            config: parseDepthLayerLabel(path && path.label),
            paths: [path],
            rects: [],
            sourceElementIndex,
          })),
          ...(Array.isArray(layer.rects) ? layer.rects : []).map((rect, sourceElementIndex) => Object.freeze({
            config: parseDepthLayerLabel(rect && rect.label),
            paths: [],
            rects: [rect],
            sourceElementIndex,
          })),
        ];

    for (const source of depthSources) {
      const config = source && source.config;
      if (!config) continue;
      const sourceStack = resolveSvgSourceStack(layer, source && source.sourceElementIndex);
      const loops = [
        ...((Array.isArray(source.paths) ? source.paths : []).map((path, pathIndex) => {
          const authoredPoints = translatePolylinePoints(
            parseSvgPolylinePath(path && path.d) || [],
            layer && layer.translate
          );
          if (authoredPoints.length < 3) return null;
          const metadata = parseSvgLabelMetadata(path && path.label, path && path.id);
          return Object.freeze({
            id: String(metadata.id || path && path.id || `${config.id}_path_${pathIndex + 1}`),
            kind: "path_loop",
            ...sourceStack,
            sourceElementIndex: pathIndex,
            authoredPoints,
            worldPoints: Object.freeze(authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
              viewBox,
              worldWidthPx,
              worldHeightPx,
            }))),
          });
        })),
        ...((Array.isArray(source.rects) ? source.rects : []).map((rect, rectIndex) => {
          const authoredRect = translateRect(rect, layer && layer.translate);
          const authoredPoints = buildClosedRectPolyline(authoredRect) || [];
          if (authoredPoints.length < 4) return null;
          const metadata = parseSvgLabelMetadata(rect && rect.label, rect && rect.id);
          return Object.freeze({
            id: String(metadata.id || rect && rect.id || `${config.id}_rect_${rectIndex + 1}`),
            kind: "rect_loop",
            ...sourceStack,
            sourceElementIndex: rectIndex,
            authoredPoints,
            worldPoints: Object.freeze(authoredPoints.map((point) => scaleAuthoringPointToWorld(point, {
              viewBox,
              worldWidthPx,
              worldHeightPx,
            }))),
          });
        })),
      ].filter(Boolean);
      depthLayers.push(Object.freeze({
        ...config,
        ...sourceStack,
        sourceLayerId: String(layer && layer.id || `depth_layer_${index + 1}`),
        translate: layer && layer.translate ? layer.translate : Object.freeze({ x: 0, y: 0 }),
        authoredBody: String(layer && layer.body || ""),
        defsMarkup,
        boundaryBox: resolveBoundaryBoxFromLoops(loops),
        loops: Object.freeze(loops),
      }));
    }
  }
  return Object.freeze(depthLayers);
}

export function buildBoundaryTileMask({
  loops = [],
  worldWidthPx = 0,
  worldHeightPx = 0,
  tileSizePx = LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
} = {}) {
  const worldW = Math.max(0, clampNumber(worldWidthPx, 0));
  const worldH = Math.max(0, clampNumber(worldHeightPx, 0));
  const tileSize = Math.max(1, clampNumber(tileSizePx, LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX));
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
  propLayerLabels = [],
  artLayerLabels = [],
  starsFieldLayerLabels = [],
  primarySpawnId = "",
  tileSizePx = LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
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
    primarySpawnId,
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
  const props = buildSvgPropInstances({
    svgText,
    worldWidthPx,
    worldHeightPx,
    propLayerLabels,
  });
  const artShapes = buildSvgArtShapes({
    svgText,
    worldWidthPx,
    worldHeightPx,
    artLayerLabels,
  });
  const starsFieldRegions = buildSvgStarsFieldRegions({
    svgText,
    worldWidthPx,
    worldHeightPx,
    starsFieldLayerLabels,
  });
  const depthLayers = buildSvgDepthLayers({
    svgText,
    worldWidthPx,
    worldHeightPx,
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
    props: Object.freeze(props),
    artShapes,
    starsFieldRegions: Object.freeze(starsFieldRegions),
    depthLayers: Object.freeze(depthLayers),
    boundaryBox,
    boundaryTileMask,
  });
}
