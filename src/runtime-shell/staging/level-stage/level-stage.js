function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function buildTerrainPath(terrainProfile = []) {
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
  const groundY = 860;
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

export function renderLevelStage(root, { level = null } = {}) {
  if (!root) return null;
  const terrainPath = buildTerrainPath(level && level.terrainProfile);
  root.innerHTML = `
    <section class="levelStage" aria-label="Level stage">
      <div class="levelStageViewport">
        <div class="levelStageStars" aria-hidden="true"></div>
        <svg class="levelStageTerrain" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <path class="levelStageTerrainFill" d="${terrainPath}"></path>
          <path class="levelStageTerrainStroke" d="${terrainPath}"></path>
        </svg>
        <div id="levelStageGround" class="levelStageGround" aria-hidden="true"></div>
        <div class="levelStageLabel">Level Stage</div>
      </div>
    </section>
  `;
  const refs = {
    root,
    physStage: root.querySelector(".levelStageViewport"),
    groundLine: root.querySelector("#levelStageGround"),
  };
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
