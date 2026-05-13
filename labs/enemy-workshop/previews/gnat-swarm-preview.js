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

function randomInRange(range = [], fallback = 1) {
  const [min, max] = rangePair(range, [fallback, fallback]);
  return min + Math.random() * Math.max(0, max - min);
}

function speedPercentToMultiplier(value = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  if (numeric > 10) return numeric / 100;
  return numeric;
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
  const enemySettings = settings || {};
  const gnat = enemySettings.gnat || settings || surface && surface.gnat || {};
  const swarm = enemySettings.swarm || surface && surface.swarm || {};
  const idle = gnat.idle || {};
  const wander = gnat.wander || {};
  const personalityRanges = gnat.personalityRanges || {};
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
  const swarmTotal = Math.round(clampNumber(swarm.gnatsTotal, 1, 1, 240));
  const baseSpeedBoPerSec = clampNumber(idle.baseSpeedBoPerSec, 1.35, 0.1, 240);
  const maxSpeedBoPerSec = clampNumber(idle.maxSpeedBoPerSec, 3.2, 0.1, 320);
  const targetJitterPx = clampNumber(idle.targetJitterBo, 0.42, 0, 4) * scale;
  const stiffness = clampNumber(idle.springStiffness, 18, 0.1, 80);
  const damping = clampNumber(idle.springDamping, 6.5, 0, 30);
  const elasticJitterPx = clampNumber(idle.elasticJitterBo, 0.12, 0, 2) * scale;
  const elasticJitterHz = clampNumber(idle.elasticJitterHz, 9, 0, 40);
  const retargetMinSec = clampNumber(idle.targetRetargetMinSec, 0.28, 0.05, 8);
  const retargetMaxSec = Math.max(retargetMinSec, clampNumber(idle.targetRetargetMaxSec, 1.25, 0.05, 16));
  const fallbackWanderChancePerMinute = clampNumber(wander.chancePerMinute, 16, 0, 120) * legacyWanderChanceMultiplier;
  const cooldownSec = rangePair(personalityRanges.wanderCooldownSec, [wander.cooldownMinSec, wander.cooldownMaxSec]);
  const lingerSec = rangePair(personalityRanges.lingerSec, [wander.lingerMinSec, wander.lingerMaxSec]);

  root.innerHTML = `
    <div
      class="gnatPreviewScene"
      style="--idle-r:${idleRadiusPx}px;--wander-r:${wanderRadiusPx}px"
    >
      <div class="gnatPreviewRing gnatPreviewWanderRing" aria-hidden="true"></div>
      <div class="gnatPreviewRing gnatPreviewIdleRing" aria-hidden="true"></div>
      <div class="gnatPreviewSpawnPoint" aria-hidden="true"></div>
      ${Array.from({ length: swarmTotal }, () => '<span class="gnatPreviewDot" aria-hidden="true"></span>').join("")}
    </div>
  `;

  const dots = Array.from(root.querySelectorAll(".gnatPreviewDot"));
  const buildGnatState = (dot, index) => {
    const speedMultiplier = clampNumber(speedPercentToMultiplier(randomInRange(personalityRanges.speed, 100)), 1, 0.01, 4);
    const responseMultiplier = Math.max(0.1, Math.sqrt(baseSpeedBoPerSec / 1.35) * speedMultiplier);
    const personalWanderBo = clampNumber(randomInRange(personalityRanges.wanderRangeBo, wanderMaxBo), wanderMaxBo, 0.4, 24);
    const personalWanderRadiusPx = Math.round(Math.max(idleRadiusBo, personalWanderBo) * scale);
    const personalWanderMinPx = Math.min(wanderMinPx, personalWanderRadiusPx);
    const personalChancePerMinute = clampNumber(randomInRange(personalityRanges.wanderChancePerMinute, fallbackWanderChancePerMinute), 16, 0, 120);
    const personalCooldownSec = clampNumber(randomInRange(cooldownSec, 1.4), 1.4, 0, 120);
    const personalLingerSec = clampNumber(randomInRange(lingerSec, 0.4), 0.4, 0, 60);
    const outboundBias = clampNumber(randomInRange(personalityRanges.outboundBias, wander.outboundBias), 0.64, 0, 1);
    const returnBias = clampNumber(randomInRange(personalityRanges.returnBias, wander.returnBias), 0.82, 0, 1);
    const arrivalRadiusPx = clampNumber(randomInRange(personalityRanges.arrivalRadiusBo, wander.arrivalRadiusBo), 0.34, 0.05, 4) * scale;
    const returnSpeedMultiplier = clampNumber(randomInRange(personalityRanges.returnSpeedMultiplier, wander.returnSpeedMultiplier), 1.12, 0.1, 4);
    const outboundAnchorStep = 0.08 + outboundBias * 0.28;
    const returnAnchorStep = 0.18 + returnBias * 0.44;
    const outboundRerollRadiusPx = Math.max(arrivalRadiusPx * 1.5, idleRadiusPx * (0.75 - outboundBias * 0.35));
    const returnRerollRadiusPx = Math.max(arrivalRadiusPx * 1.25, idleRadiusPx * (0.62 - returnBias * 0.32));
    const start = randomInCircle(idleRadiusPx);
    return {
      dot,
      x: start.x,
      y: start.y,
      vx: baseSpeedBoPerSec * speedMultiplier * scale * 0.2,
      vy: 0,
      mode: "idle",
      target: randomInCircle(idleRadiusPx),
      wanderAnchor: { x: 0, y: 0 },
      wanderDestination: randomInAnnulus(personalWanderMinPx, personalWanderRadiusPx),
      nextTargetAt: 0,
      lingerUntil: 0,
      cooldownUntil: index * 0.04,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      baseSpeedPx: baseSpeedBoPerSec * speedMultiplier * scale,
      maxSpeedPx: maxSpeedBoPerSec * speedMultiplier * scale,
      responseMultiplier,
      wanderRadiusPx: personalWanderRadiusPx,
      wanderMinPx: personalWanderMinPx,
      wanderChancePerSec: personalChancePerMinute / 60,
      cooldownSec: personalCooldownSec,
      lingerSec: personalLingerSec,
      outboundAnchorStep,
      returnAnchorStep,
      outboundRerollRadiusPx,
      returnRerollRadiusPx,
      arrivalRadiusPx,
      returnSpeedMultiplier,
    };
  };
  const states = dots.map(buildGnatState);
  const animation = {
    frame: 0,
    lastMs: performance.now(),
  };

  const scheduleTarget = (state, nowSec) => {
    if (state.mode === "outbound") {
      state.wanderAnchor = moveToward(state.wanderAnchor, state.wanderDestination, state.outboundAnchorStep);
      const goalDistance = distanceBetween(state.wanderAnchor, state.wanderDestination);
      const focus = Math.min(1, goalDistance / Math.max(state.arrivalRadiusPx, state.wanderRadiusPx));
      const rerollRadius = Math.max(state.arrivalRadiusPx * 0.5, state.outboundRerollRadiusPx * (0.2 + focus * 0.8));
      state.target = offsetPoint(state.wanderAnchor, rerollRadius);
    } else if (state.mode === "linger") {
      state.wanderAnchor = moveToward(state.wanderAnchor, state.wanderDestination, 0.5);
      state.target = offsetPoint(state.wanderDestination, Math.max(state.arrivalRadiusPx, idleRadiusPx * 0.25));
    } else if (state.mode === "return") {
      state.wanderAnchor = moveToward(state.wanderAnchor, { x: 0, y: 0 }, state.returnAnchorStep);
      const goalDistance = distanceBetween(state.wanderAnchor, { x: 0, y: 0 });
      const focus = Math.min(1, goalDistance / Math.max(state.arrivalRadiusPx, state.wanderRadiusPx));
      const rerollRadius = Math.max(state.arrivalRadiusPx * 0.5, state.returnRerollRadiusPx * (0.2 + focus * 0.8));
      state.target = offsetPoint(state.wanderAnchor, rerollRadius);
    } else {
      state.wanderAnchor = { x: 0, y: 0 };
      state.target = randomInCircle(idleRadiusPx);
    }
    state.nextTargetAt = nowSec + retargetMinSec + Math.random() * Math.max(0, retargetMaxSec - retargetMinSec);
  };

  const startWander = (state, nowSec) => {
    state.mode = "outbound";
    state.wanderAnchor = { x: state.x, y: state.y };
    state.wanderDestination = randomInAnnulus(state.wanderMinPx, state.wanderRadiusPx);
    scheduleTarget(state, nowSec);
  };

  const startCooldown = (state, nowSec) => {
    state.mode = "cooldown";
    state.cooldownUntil = nowSec + state.cooldownSec;
    scheduleTarget(state, nowSec);
  };

  const startSec = performance.now() / 1000;
  states.forEach((state) => scheduleTarget(state, startSec));

  const tick = (nowMs) => {
    const nowSec = nowMs / 1000;
    const dt = Math.min(0.04, Math.max(0.001, (nowMs - animation.lastMs) / 1000));
    animation.lastMs = nowMs;
    states.forEach((state) => {
      if ((state.mode === "idle" || state.mode === "cooldown") && nowSec >= state.cooldownUntil) {
        state.mode = "idle";
        if (state.wanderChancePerSec > 0 && Math.random() < state.wanderChancePerSec * dt) startWander(state, nowSec);
      }
      if (nowSec >= state.nextTargetAt) scheduleTarget(state, nowSec);

      const jitterX = Math.sin(nowSec * elasticJitterHz * 6.283 + state.phaseX) * elasticJitterPx;
      const jitterY = Math.cos(nowSec * elasticJitterHz * 5.113 + state.phaseY) * elasticJitterPx;
      const targetJitterX = (Math.random() * 2 - 1) * targetJitterPx;
      const targetJitterY = (Math.random() * 2 - 1) * targetJitterPx;
      const tx = state.target.x + targetJitterX + jitterX;
      const ty = state.target.y + targetJitterY + jitterY;
      const ax = (tx - state.x) * stiffness * state.responseMultiplier - state.vx * damping;
      const ay = (ty - state.y) * stiffness * state.responseMultiplier - state.vy * damping;
      state.vx += ax * dt;
      state.vy += ay * dt;
      const modeMaxSpeedPx = state.mode === "return" ? state.maxSpeedPx * state.returnSpeedMultiplier : state.maxSpeedPx;
      const speed = Math.hypot(state.vx, state.vy);
      if (speed > modeMaxSpeedPx) {
        const cap = modeMaxSpeedPx / speed;
        state.vx *= cap;
        state.vy *= cap;
      }
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      if (state.mode === "outbound" && distanceBetween(state, state.wanderDestination) <= state.arrivalRadiusPx) {
        state.mode = "linger";
        state.lingerUntil = nowSec + state.lingerSec;
        scheduleTarget(state, nowSec);
      } else if (state.mode === "linger" && nowSec >= state.lingerUntil) {
        state.mode = "return";
        state.wanderAnchor = { x: state.x, y: state.y };
        scheduleTarget(state, nowSec);
      } else if (state.mode === "return" && distanceBetween(state, { x: 0, y: 0 }) <= Math.max(state.arrivalRadiusPx, idleRadiusPx * 0.72)) {
        startCooldown(state, nowSec);
      }
      if (Math.hypot(state.x, state.y) > state.wanderRadiusPx * 1.08) {
        state.x *= 0.985;
        state.y *= 0.985;
      }
      if (state.dot) state.dot.style.transform = `translate(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px) translate(-50%, -50%)`;
    });
    animation.frame = requestAnimationFrame(tick);
  };
  animation.frame = requestAnimationFrame(tick);
  root[PREVIEW_CLEANUP_KEY] = () => {
    if (animation.frame) cancelAnimationFrame(animation.frame);
  };

  return Object.freeze({
    idleRadiusBo,
    wanderMaxBo,
    idleRadiusPx,
    wanderMinPx,
    wanderRadiusPx,
    swarmTotal,
  });
}
