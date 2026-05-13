function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function rangeMidpoint(range = [], fallback = 1) {
  if (!Array.isArray(range) || range.length < 2) return fallback;
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;
  return (min + max) / 2;
}

export function renderGnatSwarmPreview({ root, surface = null, settings = null } = {}) {
  if (!root) return null;
  const gnat = settings || surface && surface.gnat || {};
  const idle = gnat.idle || {};
  const wander = gnat.wander || {};
  const personalityRanges = gnat.personalityRanges || {};
  const speedMultiplier = clampNumber(rangeMidpoint(personalityRanges.speed, 1), 1, 0.1, 4);
  const wanderRangeMultiplier = clampNumber(rangeMidpoint(personalityRanges.wanderRange, 1), 1, 0.1, 4);
  const idleRadiusBo = clampNumber(idle.idleRadiusBo, 2.2, 0.2, 12);
  const wanderMaxBo = Math.max(idleRadiusBo, clampNumber(wander.rangeMaxBo, 5.8, 0.4, 20) * wanderRangeMultiplier);
  const scale = 42;
  const idleRadiusPx = Math.round(idleRadiusBo * scale);
  const wanderRadiusPx = Math.round(wanderMaxBo * scale);
  const waveX = Math.round(clampNumber(idle.waveAmplitudeXBo, 0.42, 0, 5) * scale);
  const waveY = Math.round(clampNumber(idle.waveAmplitudeYBo, 0.28, 0, 5) * scale);
  const orbitRadiusPx = Math.round(idleRadiusPx * 0.58);
  const loopBias = clampNumber(idle.loopBias, 0.46, 0, 1);
  const speed = clampNumber(idle.baseSpeedBoPerSec, 1.35, 0.1, 8) * speedMultiplier;
  const durationSec = Math.max(1.8, 7.2 / speed);
  root.innerHTML = `
    <div
      class="gnatPreviewScene"
      style="--idle-r:${idleRadiusPx}px;--wander-r:${wanderRadiusPx}px;--orbit-r:${orbitRadiusPx}px;--wave-x:${waveX}px;--wave-y:${waveY}px;--loop:${loopBias.toFixed(3)};--d:${durationSec.toFixed(3)}s"
    >
      <div class="gnatPreviewRing gnatPreviewWanderRing" aria-hidden="true"></div>
      <div class="gnatPreviewRing gnatPreviewIdleRing" aria-hidden="true"></div>
      <div class="gnatPreviewSpawnPoint" aria-hidden="true"></div>
      <div class="gnatPreviewFlightPath" aria-hidden="true">
        <span class="gnatPreviewDot"></span>
      </div>
    </div>
  `;
  return Object.freeze({
    idleRadiusBo,
    wanderMaxBo,
    idleRadiusPx,
    wanderRadiusPx,
    orbitRadiusPx,
    waveX,
    waveY,
    speedMultiplier,
    wanderRangeMultiplier,
  });
}
