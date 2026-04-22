import { summarizeSvgLevelSource } from "../../../game-runtime/level/svg-level-source.js";
import { resolveCameraFrame } from "../../../game-runtime/camera/camera-runtime.js";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;
const LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM = 0.25;

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLevelWorldItemSpawn(
  item,
  {
    groundCenterWorld = () => 0,
    clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  } = {}
) {
  const kind = String(item && item.kind || "");
  if (!item || (kind !== "energy_globe" && kind !== "energy_globe_emitter")) return null;
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

function buildLoopPathData(points = []) {
  if (!Array.isArray(points) || !points.length) return "";
  const start = points[0] || { xW: 0, yW: 0 };
  let d = `M ${clampNumber(start.xW, 0).toFixed(2)} ${clampNumber(start.yW, 0).toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i] || {};
    d += ` L ${clampNumber(point.xW, 0).toFixed(2)} ${clampNumber(point.yW, 0).toFixed(2)}`;
  }
  return d;
}

function buildBoundaryOverlayMarkup(loops = []) {
  return (Array.isArray(loops) ? loops : [])
    .map((loop = {}, index) => {
      const pathData = buildLoopPathData(loop.worldPoints);
      if (!pathData) return "";
      return `<path class="levelStageBoundaryPath" data-loop-id="${String(loop.id || `loop_${index + 1}`)}" d="${pathData}"></path>`;
    })
    .filter(Boolean)
    .join("");
}

function buildSpawnOverlayMarkup(spawn = null) {
  if (!spawn || !spawn.worldCenter) return "";
  const x = clampNumber(spawn.worldCenter.xW, 0);
  const y = clampNumber(spawn.worldCenter.yW, 0);
  const authoredRadius = Math.max(2, clampNumber(spawn.authoredRadius, 0));
  const orbRadius = LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS * 0.5;
  return `
    <g class="levelStageSpawnMarker" data-spawn-id="${String(spawn.id || "spawn")}">
      <circle class="levelStageSpawnPulse" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(authoredRadius * 4).toFixed(2)}"></circle>
      <circle class="levelStageSpawnDot" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${authoredRadius.toFixed(2)}"></circle>
      <circle class="levelStageSpawnOrbRing" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${orbRadius.toFixed(2)}"></circle>
    </g>
  `;
}

function resolveLevelWorldSize(level = null, mapSource = {}) {
  const sourceScale = mapSource && typeof mapSource.scale === "object" ? mapSource.scale : {};
  const world = level && typeof level.world === "object" ? level.world : {};
  return Object.freeze({
    widthPx: Math.max(
      1,
      clampNumber(sourceScale.worldWidthPx, 0) ||
      clampNumber(world.widthPx, 0) ||
      clampNumber(mapSource.authoringViewBox && mapSource.authoringViewBox.width, 0) ||
      2048
    ),
    heightPx: Math.max(
      1,
      clampNumber(sourceScale.worldHeightPx, 0) ||
      clampNumber(world.heightPx, 0) ||
      clampNumber(mapSource.authoringViewBox && mapSource.authoringViewBox.height, 0) ||
      2048
    ),
  });
}

function resolvePreviewZoom(level = null) {
  const stage = level && typeof level.stage === "object" ? level.stage : {};
  return Math.max(0.05, clampNumber(stage.previewZoom, 0) || LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM);
}

function updateLevelCamera(refs, state) {
  if (!refs || !refs.physStage || !refs.world) return;
  const rect = typeof refs.physStage.getBoundingClientRect === "function"
    ? refs.physStage.getBoundingClientRect()
    : { width: 0, height: 0 };
  const spawn = state.spawn && state.spawn.worldCenter ? state.spawn.worldCenter : {
    xW: state.worldWidthPx * 0.5,
    yW: state.worldHeightPx * 0.5,
  };
  const frame = resolveCameraFrame({
    targetXW: clampNumber(spawn.xW, 0),
    targetYW: clampNumber(spawn.yW, 0),
    viewportWidthPx: Math.max(1, clampNumber(rect.width, 0)),
    viewportHeightPx: Math.max(1, clampNumber(rect.height, 0)),
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
    zoom: Math.max(0.05, clampNumber(state.previewZoom, LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM)),
    followMode: "follow_target_center",
  });
  const translateX = -frame.camLeft * frame.zoom;
  const translateY = -frame.camTop * frame.zoom;
  refs.world.style.setProperty("--level-world-width", `${state.worldWidthPx}px`);
  refs.world.style.setProperty("--level-world-height", `${state.worldHeightPx}px`);
  refs.world.style.setProperty("--level-world-zoom", `${frame.zoom}`);
  refs.world.style.setProperty("--level-world-x", `${translateX}px`);
  refs.world.style.setProperty("--level-world-y", `${translateY}px`);
  if (refs.labelMeta) {
    const authoredSpawn = state.spawn && state.spawn.authoredCenter ? state.spawn.authoredCenter : null;
    refs.labelMeta.textContent = authoredSpawn
      ? `zoom ${frame.zoom.toFixed(2)} | spawn ${Math.round(authoredSpawn.x)}, ${Math.round(authoredSpawn.y)}`
      : `zoom ${frame.zoom.toFixed(2)} | spawn unresolved`;
  }
}

async function hydrateSvgLevelPreview(refs, state, level) {
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : {};
  const mapAssetUrl = String(mapSource.assetUrl || "").trim();
  if (!mapAssetUrl || !refs || !refs.worldImage || !refs.worldOverlay) return;
  if (refs.stage) refs.stage.dataset.levelStageState = "loading";
  if (refs.labelMeta) refs.labelMeta.textContent = "loading svg";
  try {
    const response = await fetch(mapAssetUrl, { method: "GET" });
    if (!response.ok) throw new Error(`Level SVG fetch failed: ${response.status}`);
    const svgText = await response.text();
    const summary = summarizeSvgLevelSource({
      svgText,
      worldWidthPx: state.worldWidthPx,
      worldHeightPx: state.worldHeightPx,
      boundaryLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.boundary,
      spawnLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.spawn,
      spawnMarkerId: mapSource.spawnMarker && mapSource.spawnMarker.id,
      tileSizePx: mapSource.scale && mapSource.scale.boundaryTileSizePx,
    });
    state.summary = summary;
    state.spawn = Array.isArray(summary.spawnMarkers) && summary.spawnMarkers.length
      ? summary.spawnMarkers[0]
      : null;
    refs.worldImage.src = mapAssetUrl;
    refs.worldOverlay.setAttribute("viewBox", `0 0 ${state.worldWidthPx} ${state.worldHeightPx}`);
    refs.worldOverlay.innerHTML = `
      ${buildBoundaryOverlayMarkup(summary.loops)}
      ${buildSpawnOverlayMarkup(state.spawn)}
    `;
    if (refs.stage) refs.stage.dataset.levelStageState = "ready";
    updateLevelCamera(refs, state);
  } catch (error) {
    if (refs.stage) refs.stage.dataset.levelStageState = "error";
    if (refs.labelMeta) refs.labelMeta.textContent = "svg load failed";
    console.error(error);
  }
}

function bindLevelStageResize(refs, state) {
  if (!refs || !refs.physStage) return () => {};
  const update = () => updateLevelCamera(refs, state);
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => update());
    observer.observe(refs.physStage);
    return () => observer.disconnect();
  }
  const win = globalThis.window || null;
  if (win && typeof win.addEventListener === "function") {
    win.addEventListener("resize", update);
    return () => win.removeEventListener("resize", update);
  }
  return () => {};
}

export function renderLevelStage(root, { level = null } = {}) {
  if (!root) return null;
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : {};
  const mapAssetUrl = String(mapSource.assetUrl || "").trim();
  const worldSize = resolveLevelWorldSize(level, mapSource);
  const previewZoom = resolvePreviewZoom(level);
  root.innerHTML = `
    <section class="levelStage" aria-label="Level stage">
      <div class="levelStageViewport">
        <div class="levelStageStars" aria-hidden="true"></div>
        <div class="levelStageWorldDock" aria-hidden="true">
          <div class="levelStageWorld">
            ${mapAssetUrl ? `<img class="levelStageWorldImage" src="${mapAssetUrl}" alt="" aria-hidden="true" />` : ""}
            <svg class="levelStageWorldOverlay" viewBox="0 0 ${worldSize.widthPx} ${worldSize.heightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
          </div>
        </div>
        <div class="levelStageLabel">
          <span class="levelStageLabelTitle">Level Stage</span>
          <span class="levelStageLabelMeta"></span>
        </div>
      </div>
    </section>
  `;

  const refs = {
    root,
    stage: root.querySelector(".levelStage"),
    physStage: root.querySelector(".levelStageViewport"),
    worldDock: root.querySelector(".levelStageWorldDock"),
    world: root.querySelector(".levelStageWorld"),
    worldImage: root.querySelector(".levelStageWorldImage"),
    worldOverlay: root.querySelector(".levelStageWorldOverlay"),
    labelMeta: root.querySelector(".levelStageLabelMeta"),
  };

  const state = {
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
    previewZoom,
    spawn: null,
    summary: null,
  };

  updateLevelCamera(refs, state);
  const unbindResize = bindLevelStageResize(refs, state);
  void hydrateSvgLevelPreview(refs, state, level);

  return {
    root,
    refs,
    adapter: Object.freeze({
      refs,
      level,
      getStageElements() {
        return {
          physStage: refs.physStage || null,
          groundLine: null,
        };
      },
      getStageRect() {
        if (!refs.physStage || typeof refs.physStage.getBoundingClientRect !== "function") {
          return { width: 0, height: 0 };
        }
        return refs.physStage.getBoundingClientRect();
      },
      getWorldItemSpawns() {
        if (Array.isArray(level && level.elements && level.elements.worldItemSpawns)) {
          return level.elements.worldItemSpawns;
        }
        return Array.isArray(level && level.worldItemSpawns) ? level.worldItemSpawns : [];
      },
      normalizeWorldItemSpawn(item, options = {}) {
        return normalizeLevelWorldItemSpawn(item, options);
      },
      pickupScreenY(yW, { camTop = 0 } = {}) {
        return Number(yW || 0) - Number(camTop || 0);
      },
      getSpawnMarker() {
        return state.spawn;
      },
      getPreviewZoom() {
        return state.previewZoom;
      },
      dispose() {
        unbindResize();
      },
    }),
    level,
  };
}
