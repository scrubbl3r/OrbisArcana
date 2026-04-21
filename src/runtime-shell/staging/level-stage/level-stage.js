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

export function renderLevelStage(root, { level = null } = {}) {
  if (!root) return null;
  const label = String(level && level.label || "Level Stage");
  const terrainPath = buildTerrainPath(level && level.terrainProfile);
  root.innerHTML = `
    <section class="levelStage" aria-label="Level stage">
      <div class="levelStageViewport">
        <div class="levelStageStars" aria-hidden="true"></div>
        <svg class="levelStageTerrain" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <path class="levelStageTerrainFill" d="${terrainPath}"></path>
          <path class="levelStageTerrainStroke" d="${terrainPath}"></path>
        </svg>
        <div class="levelStageGround" aria-hidden="true"></div>
        <div class="levelStageLabel">Level Stage</div>
        <div class="levelStageCenter">
          <div class="levelStageTitle">${label}</div>
        </div>
      </div>
    </section>
  `;
  return {
    root,
    level,
  };
}
