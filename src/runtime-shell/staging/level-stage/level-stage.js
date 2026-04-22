function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function buildTerrainPath(terrainProfile = [], groundY = 860) {
  const points = Array.isArray(terrainProfile) && terrainProfile.length
    ? terrainProfile
    : [
        { xNorm: 0.0, yOff: 72 },
        { xNorm: 0.12, yOff: 96 },
        { xNorm: 0.24, yOff: 58 },
        { xNorm: 0.36, yOff: 114 },
        { xNorm: 0.50, yOff: 68 },
        { xNorm: 0.64, yOff: 102 },
        { xNorm: 0.78, yOff: 56 },
        { xNorm: 0.90, yOff: 88 },
        { xNorm: 1.0, yOff: 74 },
      ];

  const width = 1000;
  const start = points[0] || { xNorm: 0, yOff: 80 };
  let d = `M ${(clamp01(start.xNorm) * width).toFixed(2)} ${(groundY - (Number(start.yOff) || 0)).toFixed(2)}`;
  for (const point of points) {
    const x = clamp01(point && point.xNorm) * width;
    const y = groundY - (Number(point && point.yOff) || 0);
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  d += ` L ${width} ${groundY.toFixed(2)} L 0 ${groundY.toFixed(2)} Z`;
  return d;
}

function findGroundPlaneBoundary(boundaries = []) {
  return (Array.isArray(boundaries) ? boundaries : []).find((boundary = {}) => (
    String(boundary.kind || "").trim().toLowerCase() === "ground_plane"
  )) || null;
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

function clampChannel(value, fallback = 255) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clampAlpha(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function buildBoundaryMarkup(boundaries = []) {
  return boundaries
    .map((boundary = {}) => {
      const kind = String(boundary.kind || "").trim().toLowerCase();
      if (kind !== "ground_plane") return "";
      const stroke = boundary && typeof boundary.stroke === "object" ? boundary.stroke : {};
      const r = clampChannel(stroke.r, 214);
      const g = clampChannel(stroke.g, 219);
      const b = clampChannel(stroke.b, 230);
      const a = clampAlpha(stroke.a, 0.86);
      const widthPx = Math.max(1, Number(stroke.widthPx) || 2);
      const bottomPx = Math.max(0, Number(boundary.bottomPx) || 0);
      const id = String(boundary.id || "");
      return `
        <div
          class="levelStageBoundary levelStageBoundaryGroundPlane"
          data-boundary-id="${id}"
          style="--level-boundary-bottom:${bottomPx}px;--level-boundary-stroke-r:${r};--level-boundary-stroke-g:${g};--level-boundary-stroke-b:${b};--level-boundary-stroke-a:${a};--level-boundary-stroke-w:${widthPx}px;"
          aria-hidden="true"
        ></div>
      `;
    })
    .filter(Boolean)
    .join("");
}

export function renderLevelStage(root, { level = null } = {}) {
  if (!root) return null;
  const terrainProfile = Array.isArray(level && level.terrain && level.terrain.profile)
    ? level.terrain.profile
    : (Array.isArray(level && level.terrainProfile) ? level.terrainProfile : []);
  const boundaries = Array.isArray(level && level.elements && level.elements.boundaries)
    ? level.elements.boundaries
    : (Array.isArray(level && level.boundaries) ? level.boundaries : []);
  const groundPlaneBoundary = findGroundPlaneBoundary(boundaries);
  const boundaryMarkup = buildBoundaryMarkup(boundaries);
  root.innerHTML = `
    <section class="levelStage" aria-label="Level stage">
      <div class="levelStageViewport">
        <div class="levelStageStars" aria-hidden="true"></div>
        <svg id="levelStageTerrain" class="levelStageTerrain" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg>
        <div id="levelStageBoundaries" class="levelStageBoundaries" aria-hidden="true">${boundaryMarkup}</div>
        <div class="levelStageLabel">Level Stage</div>
      </div>
    </section>
  `;
  const refs = {
    root,
    physStage: root.querySelector(".levelStageViewport"),
    terrain: root.querySelector("#levelStageTerrain"),
    groundLine: root.querySelector(".levelStageBoundaryGroundPlane"),
    boundaries: root.querySelector("#levelStageBoundaries"),
  };

  const groundBottomPx = Math.max(0, Number(groundPlaneBoundary && groundPlaneBoundary.bottomPx) || 140);
  const strokeWidthPx = Math.max(1, Number(groundPlaneBoundary && groundPlaneBoundary.stroke && groundPlaneBoundary.stroke.widthPx) || 2);
  const viewportHeight = refs.physStage && Number(refs.physStage.clientHeight) > 0 ? Number(refs.physStage.clientHeight) : 1000;
  // Terrain mass should terminate on the top edge of the authored GP stroke.
  const terrainGroundTopPx = Math.max(0, viewportHeight - groundBottomPx - strokeWidthPx);
  const groundY = (terrainGroundTopPx / Math.max(1, viewportHeight)) * 1000;
  const terrainPath = buildTerrainPath(
    terrainProfile.map((point = {}) => ({
      xNorm: point.xNorm,
      yOff: point.yOff,
    })),
    groundY
  );
  if (refs.terrain) {
    refs.terrain.innerHTML = `
      <defs>
        <linearGradient id="levelStageTerrainGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(74, 116, 90)" stop-opacity="0.20"></stop>
          <stop offset="62%" stop-color="rgb(40, 67, 50)" stop-opacity="0.72"></stop>
          <stop offset="100%" stop-color="rgb(24, 40, 30)" stop-opacity="0.96"></stop>
        </linearGradient>
      </defs>
      <path class="levelStageTerrainFill" d="${terrainPath}"></path>
      <path class="levelStageTerrainStroke" d="${terrainPath}"></path>
    `;
  }

  return {
    root,
    refs,
    adapter: Object.freeze({
      refs,
      level,
      getStageElements() {
        return {
          physStage: refs.physStage || null,
          groundLine: refs.groundLine || null,
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
    }),
    level,
  };
}
