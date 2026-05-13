const PREVIEW_CLEANUP_KEY = Symbol.for("orbis.enemyWorkshop.gnatPreviewCleanup");

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

function randomInCircle(radius = 1) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

function cleanupPreview(root = null) {
  if (!root) return;
  const cleanup = root[PREVIEW_CLEANUP_KEY];
  if (typeof cleanup === "function") cleanup();
  root[PREVIEW_CLEANUP_KEY] = null;
}

export function renderGnatSwarmPreview({ root, surface = null, settings = null } = {}) {
  if (!root) return null;
  cleanupPreview(root);
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
  const baseSpeedPx = clampNumber(idle.baseSpeedBoPerSec, 1.35, 0.1, 8) * speedMultiplier * scale;
  const maxSpeedPx = clampNumber(idle.maxSpeedBoPerSec, 3.2, 0.1, 16) * speedMultiplier * scale;
  const targetJitterPx = clampNumber(idle.targetJitterBo, 0.42, 0, 4) * scale;
  const stiffness = clampNumber(idle.springStiffness, 18, 0.1, 80);
  const damping = clampNumber(idle.springDamping, 6.5, 0, 30);
  const elasticJitterPx = clampNumber(idle.elasticJitterBo, 0.12, 0, 2) * scale;
  const elasticJitterHz = clampNumber(idle.elasticJitterHz, 9, 0, 40);
  const retargetMinSec = clampNumber(idle.targetRetargetMinSec, 0.28, 0.05, 8);
  const retargetMaxSec = Math.max(retargetMinSec, clampNumber(idle.targetRetargetMaxSec, 1.25, 0.05, 16));

  root.innerHTML = `
    <div
      class="gnatPreviewScene"
      style="--idle-r:${idleRadiusPx}px;--wander-r:${wanderRadiusPx}px"
    >
      <div class="gnatPreviewRing gnatPreviewWanderRing" aria-hidden="true"></div>
      <div class="gnatPreviewRing gnatPreviewIdleRing" aria-hidden="true"></div>
      <div class="gnatPreviewSpawnPoint" aria-hidden="true"></div>
      <span class="gnatPreviewDot" aria-hidden="true"></span>
    </div>
  `;

  const dot = root.querySelector(".gnatPreviewDot");
  const state = {
    x: 0,
    y: 0,
    vx: baseSpeedPx * 0.2,
    vy: 0,
    target: randomInCircle(idleRadiusPx),
    nextTargetAt: 0,
    lastMs: performance.now(),
    frame: 0,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
  };

  const scheduleTarget = (nowSec) => {
    state.target = randomInCircle(idleRadiusPx);
    state.nextTargetAt = nowSec + retargetMinSec + Math.random() * Math.max(0, retargetMaxSec - retargetMinSec);
  };
  scheduleTarget(performance.now() / 1000);

  const tick = (nowMs) => {
    const nowSec = nowMs / 1000;
    const dt = Math.min(0.04, Math.max(0.001, (nowMs - state.lastMs) / 1000));
    state.lastMs = nowMs;
    if (nowSec >= state.nextTargetAt) scheduleTarget(nowSec);

    const jitterX = Math.sin(nowSec * elasticJitterHz * 6.283 + state.phaseX) * elasticJitterPx;
    const jitterY = Math.cos(nowSec * elasticJitterHz * 5.113 + state.phaseY) * elasticJitterPx;
    const targetJitterX = (Math.random() * 2 - 1) * targetJitterPx;
    const targetJitterY = (Math.random() * 2 - 1) * targetJitterPx;
    const tx = state.target.x + targetJitterX + jitterX;
    const ty = state.target.y + targetJitterY + jitterY;
    const ax = (tx - state.x) * stiffness - state.vx * damping;
    const ay = (ty - state.y) * stiffness - state.vy * damping;
    state.vx += ax * dt;
    state.vy += ay * dt;
    const speed = Math.hypot(state.vx, state.vy);
    if (speed > maxSpeedPx) {
      const cap = maxSpeedPx / speed;
      state.vx *= cap;
      state.vy *= cap;
    }
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    if (Math.hypot(state.x, state.y) > idleRadiusPx * 1.12) {
      state.x *= 0.985;
      state.y *= 0.985;
    }
    if (dot) dot.style.transform = `translate(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px) translate(-50%, -50%)`;
    state.frame = requestAnimationFrame(tick);
  };
  state.frame = requestAnimationFrame(tick);
  root[PREVIEW_CLEANUP_KEY] = () => {
    if (state.frame) cancelAnimationFrame(state.frame);
  };

  return Object.freeze({
    idleRadiusBo,
    wanderMaxBo,
    idleRadiusPx,
    wanderRadiusPx,
    speedMultiplier,
    wanderRangeMultiplier,
  });
}
