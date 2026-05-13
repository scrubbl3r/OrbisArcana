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

function rangePair(range = [], fallback = [0, 1]) {
  if (!Array.isArray(range) || range.length < 2) return fallback.slice();
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback.slice();
  return min <= max ? [min, max] : [max, min];
}

function randomInCircle(radius = 1) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

function randomInAnnulus(minRadius = 0, maxRadius = 1) {
  const inner = Math.max(0, Math.min(minRadius, maxRadius));
  const outer = Math.max(inner, maxRadius);
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(inner * inner + Math.random() * (outer * outer - inner * inner));
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function moveToward(a, b, amount = 0.5) {
  const t = Math.min(1, Math.max(0, amount));
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function offsetPoint(point, radius = 1) {
  const offset = randomInCircle(radius);
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
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
  const legacyWanderChanceMultiplier = clampNumber(rangeMidpoint(personalityRanges.wanderChance, 1), 1, 0, 4);
  const legacyWanderRangeMultiplier = clampNumber(rangeMidpoint(personalityRanges.wanderRange, 1), 1, 0.1, 4);
  const idleRadiusBo = clampNumber(idle.idleRadiusBo, 2.2, 0.2, 12);
  const legacyWanderRangeBo = [
    clampNumber(wander.rangeMinBo, 2.8, 0.2, 20) * legacyWanderRangeMultiplier,
    clampNumber(wander.rangeMaxBo, 5.8, 0.4, 20) * legacyWanderRangeMultiplier,
  ];
  const wanderRangeBo = rangePair(personalityRanges.wanderRangeBo, legacyWanderRangeBo);
  const wanderMinBo = clampNumber(wanderRangeBo[0], 2.8, 0.2, 20);
  const wanderMaxBo = Math.max(idleRadiusBo, wanderMinBo, clampNumber(wanderRangeBo[1], 5.8, 0.4, 24));
  const scale = 42;
  const idleRadiusPx = Math.round(idleRadiusBo * scale);
  const wanderMinPx = Math.round(wanderMinBo * scale);
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
  const wanderChancePerMinute = clampNumber(
    rangeMidpoint(personalityRanges.wanderChancePerMinute, clampNumber(wander.chancePerMinute, 16, 0, 120) * legacyWanderChanceMultiplier),
    16,
    0,
    120
  );
  const cooldownSec = rangePair(personalityRanges.wanderCooldownSec, [wander.cooldownMinSec, wander.cooldownMaxSec]);
  const lingerSec = rangePair(personalityRanges.lingerSec, [wander.lingerMinSec, wander.lingerMaxSec]);
  const wanderChancePerSec = wanderChancePerMinute / 60;
  const cooldownMinSec = clampNumber(cooldownSec[0], 1.4, 0, 60);
  const cooldownMaxSec = Math.max(cooldownMinSec, clampNumber(cooldownSec[1], 5.5, 0, 120));
  const outboundBias = clampNumber(rangeMidpoint(personalityRanges.outboundBias, wander.outboundBias), 0.64, 0, 1);
  const arrivalRadiusPx = clampNumber(rangeMidpoint(personalityRanges.arrivalRadiusBo, wander.arrivalRadiusBo), 0.34, 0.05, 4) * scale;
  const returnBias = clampNumber(rangeMidpoint(personalityRanges.returnBias, wander.returnBias), 0.82, 0, 1);
  const returnSpeedMultiplier = clampNumber(rangeMidpoint(personalityRanges.returnSpeedMultiplier, wander.returnSpeedMultiplier), 1.12, 0.1, 4);
  const lingerMinSec = clampNumber(lingerSec[0], 0.4, 0, 30);
  const lingerMaxSec = Math.max(lingerMinSec, clampNumber(lingerSec[1], 2.2, 0, 60));
  const outboundAnchorStep = 0.08 + outboundBias * 0.28;
  const returnAnchorStep = 0.18 + returnBias * 0.44;
  const outboundRerollRadiusPx = Math.max(arrivalRadiusPx * 1.5, idleRadiusPx * (0.75 - outboundBias * 0.35));
  const returnRerollRadiusPx = Math.max(arrivalRadiusPx * 1.25, idleRadiusPx * (0.62 - returnBias * 0.32));

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
    mode: "idle",
    target: randomInCircle(idleRadiusPx),
    wanderAnchor: { x: 0, y: 0 },
    wanderDestination: randomInAnnulus(wanderMinPx, wanderRadiusPx),
    nextTargetAt: 0,
    lingerUntil: 0,
    cooldownUntil: 0,
    lastMs: performance.now(),
    frame: 0,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
  };

  const scheduleTarget = (nowSec) => {
    if (state.mode === "outbound") {
      state.wanderAnchor = moveToward(state.wanderAnchor, state.wanderDestination, outboundAnchorStep);
      const goalDistance = distanceBetween(state.wanderAnchor, state.wanderDestination);
      const focus = Math.min(1, goalDistance / Math.max(arrivalRadiusPx, wanderRadiusPx));
      const rerollRadius = Math.max(arrivalRadiusPx * 0.5, outboundRerollRadiusPx * (0.2 + focus * 0.8));
      state.target = offsetPoint(state.wanderAnchor, rerollRadius);
    } else if (state.mode === "linger") {
      state.wanderAnchor = moveToward(state.wanderAnchor, state.wanderDestination, 0.5);
      state.target = offsetPoint(state.wanderDestination, Math.max(arrivalRadiusPx, idleRadiusPx * 0.25));
    } else if (state.mode === "return") {
      state.wanderAnchor = moveToward(state.wanderAnchor, { x: 0, y: 0 }, returnAnchorStep);
      const goalDistance = distanceBetween(state.wanderAnchor, { x: 0, y: 0 });
      const focus = Math.min(1, goalDistance / Math.max(arrivalRadiusPx, wanderRadiusPx));
      const rerollRadius = Math.max(arrivalRadiusPx * 0.5, returnRerollRadiusPx * (0.2 + focus * 0.8));
      state.target = offsetPoint(state.wanderAnchor, rerollRadius);
    } else {
      state.wanderAnchor = { x: 0, y: 0 };
      state.target = randomInCircle(idleRadiusPx);
    }
    state.nextTargetAt = nowSec + retargetMinSec + Math.random() * Math.max(0, retargetMaxSec - retargetMinSec);
  };

  const startWander = (nowSec) => {
    state.mode = "outbound";
    state.wanderAnchor = { x: state.x, y: state.y };
    state.wanderDestination = randomInAnnulus(wanderMinPx, wanderRadiusPx);
    scheduleTarget(nowSec);
  };

  const startCooldown = (nowSec) => {
    state.mode = "cooldown";
    state.cooldownUntil = nowSec + cooldownMinSec + Math.random() * Math.max(0, cooldownMaxSec - cooldownMinSec);
    scheduleTarget(nowSec);
  };

  scheduleTarget(performance.now() / 1000);

  const tick = (nowMs) => {
    const nowSec = nowMs / 1000;
    const dt = Math.min(0.04, Math.max(0.001, (nowMs - state.lastMs) / 1000));
    state.lastMs = nowMs;
    if ((state.mode === "idle" || state.mode === "cooldown") && nowSec >= state.cooldownUntil) {
      state.mode = "idle";
      if (wanderChancePerSec > 0 && Math.random() < wanderChancePerSec * dt) startWander(nowSec);
    }
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
    const modeMaxSpeedPx = state.mode === "return" ? maxSpeedPx * returnSpeedMultiplier : maxSpeedPx;
    const speed = Math.hypot(state.vx, state.vy);
    if (speed > modeMaxSpeedPx) {
      const cap = modeMaxSpeedPx / speed;
      state.vx *= cap;
      state.vy *= cap;
    }
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    if (state.mode === "outbound" && distanceBetween(state, state.wanderDestination) <= arrivalRadiusPx) {
      state.mode = "linger";
      state.lingerUntil = nowSec + lingerMinSec + Math.random() * Math.max(0, lingerMaxSec - lingerMinSec);
      scheduleTarget(nowSec);
    } else if (state.mode === "linger" && nowSec >= state.lingerUntil) {
      state.mode = "return";
      state.wanderAnchor = { x: state.x, y: state.y };
      scheduleTarget(nowSec);
    } else if (state.mode === "return" && distanceBetween(state, { x: 0, y: 0 }) <= Math.max(arrivalRadiusPx, idleRadiusPx * 0.72)) {
      startCooldown(nowSec);
    }
    if (Math.hypot(state.x, state.y) > wanderRadiusPx * 1.08) {
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
    wanderMinPx,
    wanderRadiusPx,
    speedMultiplier,
    wanderChancePerMinute,
  });
}
