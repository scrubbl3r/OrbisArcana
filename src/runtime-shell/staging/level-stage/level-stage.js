import { summarizeSvgLevelSource } from "../../../game-runtime/level/svg-level-source.js";
import { createCameraRuntime } from "../../../game-runtime/camera/camera-runtime.js";
import {
  buildAuthoredLevelSceneModel,
  resolveAuthoredLevelCameraTarget,
  resolveViewFloorBootOffsetYW,
} from "../../../game-runtime/level/authored-level-scene-model.js";
import { normalizeLevelWorldItemSpawn } from "../../../game-runtime/level/normalize-level-world-item-spawn.js";
import {
  resolveLevelCameraAnchor,
} from "../../../game-runtime/level/resolve-level-spawn-point.js";
import {
  applyOrbBaseVisualCssVars,
  buildOrbBaseVisualState,
} from "../../../game-runtime/orb/orb-base-state.js";
import {
  applyOrbFractureVisualCssVars,
  buildOrbFractureVisualState,
} from "../../../game-runtime/orb/orb-fracture-base-state.js";
import { createOrbShatterRuntimeController } from "../../../game-runtime/orb/orb-shatter-runtime.js";

const LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS = 72;
const LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM = 0.25;
const LEVEL_STAGE_ORB_MARKUP = `
  <div class="levelStageOrbLayer" aria-hidden="true">
    <div class="orbWrap levelStageOrbWrap" data-level-stage-orb-wrap="true">
      <div class="origin" aria-hidden="true">
        <div class="electricLayer" data-level-stage-electric-layer="true" aria-hidden="true"></div>
        <div class="flameLayer" data-level-stage-flame-layer="true" aria-hidden="true"></div>
        <div class="shockLayer" data-level-stage-shock-layer="true" aria-hidden="true"></div>
        <div class="shield atOrigin levelStageShield" data-level-stage-shield="true"></div>
        <div class="orb atOrigin" data-level-stage-orb="true"></div>
        <svg class="orbCracks atOrigin" data-level-stage-orb-cracks="true" viewBox="-50 -50 100 100"></svg>
        <div class="orbInterior atOrigin" data-level-stage-orb-interior="true"></div>
        <svg class="orbShards atOrigin" data-level-stage-orb-shards="true" viewBox="-80 -80 160 160"></svg>
      </div>
    </div>
  </div>
`;

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

function buildLineArtOverlayMarkup(shapes = []) {
  return (Array.isArray(shapes) ? shapes : [])
    .map((shape = {}, index) => {
      const pathData = buildLoopPathData(shape.worldPoints);
      if (!pathData) return "";
      const fill = String(shape.fill || "none").trim();
      const stroke = String(shape.stroke || "none").trim();
      const fillOpacity = Math.max(0, Math.min(1, clampNumber(shape.fillOpacity, 1)));
      const strokeOpacity = Math.max(0, Math.min(1, clampNumber(shape.strokeOpacity, 1)));
      const strokeWidth = Math.max(0, clampNumber(shape.worldStrokeWidth, 1));
      return `<path class="levelStageLineArtPath" data-line-art-id="${String(shape.id || `line_art_${index + 1}`)}" d="${pathData}" style="fill:${fill};fill-opacity:${fillOpacity};stroke:${stroke};stroke-opacity:${strokeOpacity};stroke-width:${strokeWidth};"></path>`;
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

function buildOrbReferenceMarkup(spawn = null) {
  if (!spawn || !spawn.worldCenter) return "";
  const x = clampNumber(spawn.worldCenter.xW, 0);
  const y = clampNumber(spawn.worldCenter.yW, 0);
  const orbRadius = LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS * 0.5;
  return `
    <g class="levelStageOrbReference" data-orb-ref-id="${String(spawn.id || "spawn_orb")}">
      <circle class="levelStageOrbReferenceHalo" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(orbRadius * 1.18).toFixed(2)}"></circle>
      <circle class="levelStageOrbReferenceRing" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${orbRadius.toFixed(2)}"></circle>
    </g>
  `;
}

function buildWorldItemOverlayMarkup(spawns = []) {
  return (Array.isArray(spawns) ? spawns : [])
    .map((spawn = {}, index) => {
      const worldCenter = spawn && spawn.worldCenter ? spawn.worldCenter : null;
      if (!worldCenter) return "";
      const x = clampNumber(worldCenter.xW, 0);
      const y = clampNumber(spawn.yW, clampNumber(worldCenter.yW, 0));
      const r = Math.max(6, clampNumber(spawn.r, 25));
      return `
        <g class="levelStageWorldItem" data-world-item-id="${String(spawn.id || `world_item_${index + 1}`)}">
          <circle class="levelStageWorldItemHalo" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r * 1.6).toFixed(2)}"></circle>
          <circle class="levelStageWorldItemCore" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}"></circle>
        </g>
      `;
    })
    .filter(Boolean)
    .join("");
}

function buildViewFloorOverlayMarkup(guides = []) {
  return (Array.isArray(guides) ? guides : [])
    .map((guide = {}, index) => {
      const pathData = buildLoopPathData(guide.worldPoints);
      if (!pathData) return "";
      return `<path class="levelStageViewFloorPath" data-view-floor-id="${String(guide.id || `view_floor_${index + 1}`)}" d="${pathData}"></path>`;
    })
    .filter(Boolean)
    .join("");
}

function lineToPath(seg) {
  if (!seg || !seg.a || !seg.b) return "";
  return `M ${Number(seg.a.x).toFixed(2)} ${Number(seg.a.y).toFixed(2)} L ${Number(seg.b.x).toFixed(2)} ${Number(seg.b.y).toFixed(2)}`;
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
  const camera = level && typeof level.camera === "object" ? level.camera : null;
  const stage = level && typeof level.stage === "object" ? level.stage : {};
  return Math.max(
    0.05,
    clampNumber(camera && camera.previewZoom, 0) ||
    clampNumber(stage.previewZoom, 0) ||
    LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM
  );
}

function resolvePreviewFollowMode(level = null) {
  const camera = level && typeof level.camera === "object" ? level.camera : null;
  return String(camera && camera.previewFollowMode || "follow_target_center").trim();
}

function resolvePreviewCameraConfig(level = null, {
  worldWidthPx = 0,
  worldHeightPx = 0,
  cameraAnchors = [],
} = {}) {
  const camera = level && typeof level.camera === "object" ? level.camera : null;
  const fixedFrameAnchor = resolveLevelCameraAnchor(level, camera && camera.fixedFrameAnchorId, {
    worldWidthPx,
    groundCenterWorld: () => Math.max(0, worldHeightPx) * 0.5,
    svgAnchors: cameraAnchors,
  });
  return Object.freeze({
    screenAnchorX: Number(camera && camera.screenAnchorX) >= 0 ? Number(camera.screenAnchorX) : 0.5,
    screenAnchorY: Number(camera && camera.screenAnchorY) >= 0 ? Number(camera.screenAnchorY) : 0.5,
    deadzoneWidthPx: Number(camera && camera.deadzoneWidthPx) >= 0 ? Number(camera.deadzoneWidthPx) : -1,
    deadzoneHeightPx: Number(camera && camera.deadzoneHeightPx) >= 0 ? Number(camera.deadzoneHeightPx) : -1,
    deadzoneWidthRatio: Math.max(0, clampNumber(camera && camera.deadzoneWidthRatio, 0)),
    deadzoneHeightRatio: Math.max(0, clampNumber(camera && camera.deadzoneHeightRatio, 0)),
    followLerpX: Math.max(0, Math.min(1, clampNumber(camera && camera.followLerpX, 1))),
    followLerpY: Math.max(0, Math.min(1, clampNumber(camera && camera.followLerpY, 1))),
    clampInsetLeftPx: Number(camera && camera.clampInsetLeftPx) >= 0 ? Number(camera.clampInsetLeftPx) : 0,
    clampInsetRightPx: Number(camera && camera.clampInsetRightPx) >= 0 ? Number(camera.clampInsetRightPx) : 0,
    clampInsetTopPx: Number(camera && camera.clampInsetTopPx) >= 0 ? Number(camera.clampInsetTopPx) : 0,
    clampInsetBottomPx: Number(camera && camera.clampInsetBottomPx) >= 0 ? Number(camera.clampInsetBottomPx) : 0,
    fixedFrameCenterXW: fixedFrameAnchor && fixedFrameAnchor.point
      ? fixedFrameAnchor.point.xW
      : (
          camera && camera.fixedFrameCenterXW != null && Number.isFinite(Number(camera.fixedFrameCenterXW))
            ? Number(camera.fixedFrameCenterXW)
            : null
        ),
    fixedFrameCenterYW: fixedFrameAnchor && fixedFrameAnchor.point
      ? fixedFrameAnchor.point.yW
      : (
          camera && camera.fixedFrameCenterYW != null && Number.isFinite(Number(camera.fixedFrameCenterYW))
            ? Number(camera.fixedFrameCenterYW)
            : null
        ),
  });
}

function formatLevelStageTracePair(x, y) {
  return `${Math.round(Number(x) || 0)},${Math.round(Number(y) || 0)}`;
}

function traceLevelStage(state, message, kind = "muted") {
  const traceLog = state && typeof state.traceLog === "function" ? state.traceLog : null;
  if (!traceLog) return;
  const line = String(message || "").trim();
  if (!line) return;
  traceLog(line, kind);
}

function updateLevelCamera(refs, state) {
  if (!refs || !refs.physStage || !refs.world) return;
  const rect = typeof refs.physStage.getBoundingClientRect === "function"
    ? refs.physStage.getBoundingClientRect()
    : { width: 0, height: 0 };
  const viewportWidthPx = Math.max(0, clampNumber(rect.width, 0));
  const viewportHeightPx = Math.max(0, clampNumber(rect.height, 0));
  if (viewportWidthPx < 1 || viewportHeightPx < 1) {
    traceLevelStage(
      state,
      [
        "level_stage.frame_wait",
        `boot=${state.bootCamera ? 1 : 0}`,
        `rect=${formatLevelStageTracePair(rect.width, rect.height)}`,
      ].join(" | ")
    );
    return;
  }
  const cameraConfig = resolvePreviewCameraConfig(state.level, {
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
    cameraAnchors: state.cameraAnchors,
  });
  const sceneModel = state.sceneModel || null;
  const boundaryBox = sceneModel && sceneModel.boundaryBox ? sceneModel.boundaryBox : null;
  const viewFloorGuide = sceneModel && sceneModel.viewFloorGuide ? sceneModel.viewFloorGuide : null;
  const target = resolveAuthoredLevelCameraTarget({
    level: state.level,
    sceneModel,
    initialTarget: state.initialTarget,
    worldWidthPx: state.worldWidthPx,
    worldHeightPx: state.worldHeightPx,
  });
  const bootOffsetYW = resolveViewFloorBootOffsetYW({
    targetYW: target.yW,
    boundaryBox,
    viewFloorGuide,
    viewportHeightPx,
    zoom: Math.max(0.05, clampNumber(state.previewZoom, LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM)),
  });
  const frame = state.cameraRuntime && typeof state.cameraRuntime.resolveFrame === "function"
    ? state.cameraRuntime.resolveFrame({
      targetXW: clampNumber(target.xW, 0),
      targetYW: clampNumber(target.yW, 0) + bootOffsetYW,
      viewportWidthPx,
      viewportHeightPx,
      worldWidthPx: state.worldWidthPx,
      worldHeightPx: state.worldHeightPx,
      zoom: Math.max(0.05, clampNumber(state.previewZoom, LEVEL_STAGE_DEFAULT_PREVIEW_ZOOM)),
      followMode: state.bootCamera ? "follow_target_center" : state.previewFollowMode,
      fixedFrameCenterXW: cameraConfig.fixedFrameCenterXW,
      fixedFrameCenterYW: cameraConfig.fixedFrameCenterYW,
      screenAnchorX: cameraConfig.screenAnchorX,
      screenAnchorY: cameraConfig.screenAnchorY,
      deadzoneWidthPx: cameraConfig.deadzoneWidthPx,
      deadzoneHeightPx: cameraConfig.deadzoneHeightPx,
      deadzoneWidthRatio: cameraConfig.deadzoneWidthRatio,
      deadzoneHeightRatio: cameraConfig.deadzoneHeightRatio,
      followLerpX: state.bootCamera ? 1 : cameraConfig.followLerpX,
      followLerpY: state.bootCamera ? 1 : cameraConfig.followLerpY,
      clampLeftXW: state.bootCamera ? 0 : (boundaryBox ? clampNumber(boundaryBox.leftXW, 0) : 0),
      clampRightXW: state.bootCamera
        ? state.worldWidthPx
        : (boundaryBox ? clampNumber(boundaryBox.rightXW, state.worldWidthPx) : state.worldWidthPx),
      clampTopYW: state.bootCamera ? 0 : (boundaryBox ? clampNumber(boundaryBox.topYW, 0) : 0),
      clampBottomYW: state.bootCamera
        ? state.worldHeightPx
        : Math.max(
            boundaryBox ? clampNumber(boundaryBox.bottomYW, state.worldHeightPx) : state.worldHeightPx,
            viewFloorGuide ? clampNumber(viewFloorGuide.worldY, 0) : 0
          ),
      clampInsetLeftPx: cameraConfig.clampInsetLeftPx,
      clampInsetRightPx: cameraConfig.clampInsetRightPx,
      clampInsetTopPx: cameraConfig.clampInsetTopPx,
      clampInsetBottomPx: cameraConfig.clampInsetBottomPx,
    })
    : null;
  traceLevelStage(
    state,
    [
      "level_stage.frame",
      `boot=${state.bootCamera ? 1 : 0}`,
      `mode=${state.previewFollowMode}`,
      `spawnW=${state.spawn && state.spawn.worldCenter ? formatLevelStageTracePair(state.spawn.worldCenter.xW, state.spawn.worldCenter.yW) : "none"}`,
      `targetW=${formatLevelStageTracePair(target.xW, clampNumber(target.yW, 0) + bootOffsetYW)}`,
      `offsetY=${Math.round(bootOffsetYW)}`,
      `viewFloorW=${viewFloorGuide ? Math.round(viewFloorGuide.worldY) : "none"}`,
      `cam=${formatLevelStageTracePair(frame.camLeft, frame.camTop)}`,
      `screen=${formatLevelStageTracePair(frame.targetScreenX, frame.targetScreenY)}`,
      `rect=${formatLevelStageTracePair(viewportWidthPx, viewportHeightPx)}`,
      `clamp=${boundaryBox
        ? `${formatLevelStageTracePair(boundaryBox.leftXW, boundaryBox.topYW)}>${formatLevelStageTracePair(boundaryBox.rightXW, Math.max(boundaryBox.bottomYW, viewFloorGuide ? clampNumber(viewFloorGuide.worldY, 0) : boundaryBox.bottomYW))}`
        : `0,0>${formatLevelStageTracePair(state.worldWidthPx, state.worldHeightPx)}`}`,
    ].join(" | ")
  );
  state.bootCamera = false;
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
      ? `${state.previewFollowMode} | zoom ${frame.zoom.toFixed(2)} | spawn ${Math.round(authoredSpawn.x)}, ${Math.round(authoredSpawn.y)}`
      : `${state.previewFollowMode} | zoom ${frame.zoom.toFixed(2)} | spawn unresolved`;
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
      cameraLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.camera,
      viewFloorLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.viewFloor,
      worldItemLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.worldItems,
      lineArtLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.lineArt,
      spawnMarkerId: mapSource.spawnMarker && mapSource.spawnMarker.id,
      tileSizePx: mapSource.scale && mapSource.scale.boundaryTileSizePx,
    });
    state.summary = summary;
    state.sceneModel = buildAuthoredLevelSceneModel({
      level,
      summary,
      worldWidthPx: state.worldWidthPx,
      worldHeightPx: state.worldHeightPx,
      groundCenterWorld: () => state.worldHeightPx * 0.5,
    });
    state.cameraAnchors = Array.isArray(state.sceneModel.cameraAnchors) ? state.sceneModel.cameraAnchors : [];
    state.spawn = state.sceneModel.spawn;
    traceLevelStage(
      state,
      [
        "level_stage.activate",
        `level=${String(level && level.id || "unknown")}`,
        `spawnA=${state.spawn && state.spawn.authoredCenter ? formatLevelStageTracePair(state.spawn.authoredCenter.x, state.spawn.authoredCenter.y) : "none"}`,
        `spawnW=${state.spawn && state.spawn.worldCenter ? formatLevelStageTracePair(state.spawn.worldCenter.xW, state.spawn.worldCenter.yW) : "none"}`,
        `bounds=${state.sceneModel && state.sceneModel.boundaryBox
          ? `${formatLevelStageTracePair(state.sceneModel.boundaryBox.leftXW, state.sceneModel.boundaryBox.topYW)}>${formatLevelStageTracePair(state.sceneModel.boundaryBox.rightXW, state.sceneModel.boundaryBox.bottomYW)}`
          : "none"}`,
        `viewFloorW=${state.sceneModel && state.sceneModel.viewFloorGuide ? Math.round(state.sceneModel.viewFloorGuide.worldY) : "none"}`,
        `worldItems=${Array.isArray(state.sceneModel && state.sceneModel.worldItemSpawns) ? state.sceneModel.worldItemSpawns.length : 0}`,
        `lineArt=${Array.isArray(state.sceneModel && state.sceneModel.lineArtShapes) ? state.sceneModel.lineArtShapes.length : 0}`,
      ].join(" | ")
    );
    refs.worldImage.src = mapAssetUrl;
    refs.worldOverlay.setAttribute("viewBox", `0 0 ${state.worldWidthPx} ${state.worldHeightPx}`);
    refs.worldOverlay.innerHTML = `
      ${buildBoundaryOverlayMarkup(state.sceneModel.loops)}
      ${buildLineArtOverlayMarkup(state.sceneModel.lineArtShapes)}
      ${buildViewFloorOverlayMarkup(state.sceneModel.viewFloorGuides)}
      ${buildWorldItemOverlayMarkup(state.sceneModel.worldItemSpawns)}
      ${buildOrbReferenceMarkup(state.spawn)}
      ${buildSpawnOverlayMarkup(state.spawn)}
    `;
    if (refs.stage) refs.stage.dataset.levelStageState = "ready";
    if (state.cameraRuntime && typeof state.cameraRuntime.reset === "function") {
      state.cameraRuntime.reset();
    }
    state.bootCamera = true;
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
  const previewFollowMode = resolvePreviewFollowMode(level);
  const orbBaseVisualState = buildOrbBaseVisualState();
  const orbFractureVisualState = buildOrbFractureVisualState();
  root.innerHTML = `
    <section class="levelStage" aria-label="Level stage">
      <div class="levelStageViewport">
        <div class="levelStageStars" aria-hidden="true"></div>
        <div class="levelStageWorldDock" aria-hidden="true">
          <div class="levelStageWorld">
            ${mapAssetUrl ? `<img class="levelStageWorldImage" src="${mapAssetUrl}" alt="" aria-hidden="true" />` : ""}
            <svg class="levelStageWorldOverlay" viewBox="0 0 ${worldSize.widthPx} ${worldSize.heightPx}" preserveAspectRatio="none" aria-hidden="true"></svg>
            ${LEVEL_STAGE_ORB_MARKUP}
          </div>
        </div>
        <div class="levelStageLabel">
          <span class="levelStageLabelTitle">Level Stage</span>
          <span class="levelStageLabelMeta"></span>
        </div>
        <div class="deathPanel off" data-level-stage-death-panel="true" aria-hidden="true">
          <div class="deathCard" role="dialog" aria-label="You died">
            <div class="deathTitle">YOU DIED</div>
            <button class="stageButton" data-level-stage-try-again="true" type="button">TRY AGAIN</button>
          </div>
        </div>
      </div>
    </section>
  `;
  applyOrbBaseVisualCssVars(orbBaseVisualState, { root });
  applyOrbFractureVisualCssVars(orbFractureVisualState, { root });

  const refs = {
    root,
    stage: root.querySelector(".levelStage"),
    physStage: root.querySelector(".levelStageViewport"),
    worldDock: root.querySelector(".levelStageWorldDock"),
    world: root.querySelector(".levelStageWorld"),
    worldImage: root.querySelector(".levelStageWorldImage"),
    worldOverlay: root.querySelector(".levelStageWorldOverlay"),
    labelMeta: root.querySelector(".levelStageLabelMeta"),
    orbWrap: root.querySelector("[data-level-stage-orb-wrap='true']"),
    orb: root.querySelector("[data-level-stage-orb='true']"),
    orbInterior: root.querySelector("[data-level-stage-orb-interior='true']"),
    orbCracks: root.querySelector("[data-level-stage-orb-cracks='true']"),
    orbShards: root.querySelector("[data-level-stage-orb-shards='true']"),
    shield: root.querySelector("[data-level-stage-shield='true']"),
    shockLayer: root.querySelector("[data-level-stage-shock-layer='true']"),
    flameLayer: root.querySelector("[data-level-stage-flame-layer='true']"),
    electricLayer: root.querySelector("[data-level-stage-electric-layer='true']"),
    deathPanel: root.querySelector("[data-level-stage-death-panel='true']"),
    tryAgainBtn: root.querySelector("[data-level-stage-try-again='true']"),
  };

  const state = {
    worldWidthPx: worldSize.widthPx,
    worldHeightPx: worldSize.heightPx,
    previewZoom,
    previewFollowMode,
    initialTarget: String(level && level.camera && level.camera.initialTarget || "spawn").trim().toLowerCase(),
    level,
    cameraRuntime: createCameraRuntime(),
    bootCamera: true,
    cameraAnchors: [],
    spawn: null,
    summary: null,
    sceneModel: null,
    traceLog: null,
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
          orbWrap: refs.orbWrap || null,
          orb: refs.orb || null,
          orbInterior: refs.orbInterior || null,
          orbCracks: refs.orbCracks || null,
          orbShards: refs.orbShards || null,
          shield: refs.shield || null,
          shockLayer: refs.shockLayer || null,
          flameLayer: refs.flameLayer || null,
          electricLayer: refs.electricLayer || null,
          deathPanel: refs.deathPanel || null,
          tryAgainBtn: refs.tryAgainBtn || null,
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
      getPreviewFollowMode() {
        return state.previewFollowMode;
      },
      applyCameraFrame({
        camLeft = 0,
        camTop = 0,
        zoom = state.previewZoom,
      } = {}) {
        refs.world.style.setProperty("--level-world-width", `${state.worldWidthPx}px`);
        refs.world.style.setProperty("--level-world-height", `${state.worldHeightPx}px`);
        refs.world.style.setProperty("--level-world-zoom", `${Number(zoom || state.previewZoom)}`);
        refs.world.style.setProperty("--level-world-x", `${(-Number(camLeft || 0) * Number(zoom || state.previewZoom)).toFixed(2)}px`);
        refs.world.style.setProperty("--level-world-y", `${(-Number(camTop || 0) * Number(zoom || state.previewZoom)).toFixed(2)}px`);
      },
      applyOrbTransform({
        top = 0,
        left = "50%",
        xW = null,
        yW = null,
      } = {}) {
        if (!refs.orbWrap) return;
        if (Number.isFinite(Number(xW)) && Number.isFinite(Number(yW))) {
          refs.orbWrap.style.left = `${Number(xW).toFixed(2)}px`;
          refs.orbWrap.style.transform = `translate(-50%, ${Math.max(0, Number(yW) - (LEVEL_STAGE_ORB_DIAMETER_WORLD_UNITS * 0.5)).toFixed(2)}px)`;
          return;
        }
        const nextLeft = (typeof left === "number")
          ? `${Number(left || 0).toFixed(2)}px`
          : String(left || "50%");
        refs.orbWrap.style.left = nextLeft;
        refs.orbWrap.style.transform = `translate(-50%, ${Number(top || 0).toFixed(2)}px)`;
      },
      renderOrbDamageVisuals({
        fx = null,
      } = {}) {
        if (!refs.orb || !refs.orbCracks) return;
        const shattered = !!(fx && fx.visualState === "shattered");
        refs.orb.classList.toggle("shattered", shattered);
        refs.orb.style.opacity = shattered ? "0" : "";
        const shardStyle = fx && fx.shardStyle && typeof fx.shardStyle === "object" ? fx.shardStyle : null;
        const shardRgb = shardStyle && shardStyle.strokeRgb ? shardStyle.strokeRgb : null;
        const shardStroke = shardRgb
          ? `rgb(${Math.round(Number(shardRgb.r) || 0)},${Math.round(Number(shardRgb.g) || 0)},${Math.round(Number(shardRgb.b) || 0)})`
          : "";
        const shardAlpha = shardStyle && Number.isFinite(Number(shardStyle.strokeAlpha))
          ? Math.max(0, Math.min(1, Number(shardStyle.strokeAlpha)))
          : null;
        const shardStrokeWidth = shardStyle && Number.isFinite(Number(shardStyle.strokeWidthPx))
          ? Math.max(0.25, Number(shardStyle.strokeWidthPx))
          : null;
        const crackSegments = (!shattered && Array.isArray(fx && fx.crackSegments))
          ? fx.crackSegments
          : [];
        refs.orbCracks.innerHTML = crackSegments.map((seg) => {
          const d = lineToPath(seg);
          if (!d) return "";
          const style = [
            shardStroke ? `stroke:${shardStroke}` : "",
            shardAlpha != null ? `stroke-opacity:${shardAlpha.toFixed(3)}` : "",
            shardStrokeWidth != null ? `stroke-width:${shardStrokeWidth.toFixed(2)}px` : "",
          ].filter(Boolean).join(";");
          const attrs = [`d="${d}"`, style ? `style="${style}"` : ""].filter(Boolean).join(" ");
          return `<path ${attrs} />`;
        }).join("");
      },
      openDeathOverlay() {
        if (!refs.deathPanel) return;
        refs.deathPanel.classList.remove("off");
        refs.deathPanel.setAttribute("aria-hidden", "false");
      },
      closeDeathOverlay() {
        if (!refs.deathPanel) return;
        refs.deathPanel.classList.add("off");
        refs.deathPanel.setAttribute("aria-hidden", "true");
      },
      createOrbShatterController({
        root = refs.root,
        getOrbShatterRuntime = () => null,
        getOrbColorState = () => null,
        getBaseFillAlpha = () => 0.20,
        clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
        clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
      } = {}) {
        if (!refs.orb || typeof createOrbShatterRuntimeController !== "function") return null;
        return createOrbShatterRuntimeController({
          root,
          getOrbEl: () => refs.orb,
          getOrbShatterRuntime,
          getOrbColorState,
          getBaseFillAlpha,
          clamp,
          clamp01,
        });
      },
      setTraceLogger(fn) {
        state.traceLog = typeof fn === "function" ? fn : null;
        if (state.traceLog) {
          traceLevelStage(state, "level_stage.trace logger attached");
          if (state.sceneModel) {
            traceLevelStage(
              state,
              [
                "level_stage.trace snapshot",
                `spawnW=${state.spawn && state.spawn.worldCenter ? formatLevelStageTracePair(state.spawn.worldCenter.xW, state.spawn.worldCenter.yW) : "none"}`,
                `viewFloorW=${state.sceneModel && state.sceneModel.viewFloorGuide ? Math.round(state.sceneModel.viewFloorGuide.worldY) : "none"}`,
              ].join(" | ")
            );
          }
          updateLevelCamera(refs, state);
        }
      },
      dispose() {
        unbindResize();
      },
    }),
    level,
  };
}
