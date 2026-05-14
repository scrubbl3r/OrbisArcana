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

function curveUnitValue(t = 0, curve = null) {
  const linear = clampNumber(t, 0, 0, 1);
  const bias = clampNumber(curve && curve.bias, 0, -1, 1);
  const amount = clampNumber(curve && curve.amount, 0, 0, 1);
  if (Math.abs(bias) <= 0.0001 || amount <= 0.0001) return linear;
  const power = 1 + Math.abs(bias) * 4;
  const curved = bias < 0
    ? linear ** power
    : 1 - (1 - linear) ** power;
  return linear + (curved - linear) * amount;
}

function randomInRangeWithCurve(range = [], fallback = 1, curve = null) {
  const [min, max] = rangePair(range, [fallback, fallback]);
  return min + curveUnitValue(Math.random(), curve) * Math.max(0, max - min);
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

function offsetPoint(point, radius = 1) {
  const offset = randomInCircle(radius);
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

function buildRouteSegments({ from, to, spacingRangePx, jitterPx }) {
  const distance = distanceBetween(from, to);
  if (distance <= 0.001) return [to];
  const dir = {
    x: (to.x - from.x) / distance,
    y: (to.y - from.y) / distance,
  };
  const perp = { x: -dir.y, y: dir.x };
  const segments = [];
  let traveled = 0;
  const minSpacing = Math.max(1, spacingRangePx[0]);
  const maxSpacing = Math.max(minSpacing, spacingRangePx[1]);
  while (traveled < distance) {
    traveled = Math.min(distance, traveled + minSpacing + Math.random() * (maxSpacing - minSpacing));
    if (distance - traveled < minSpacing * 0.35) traveled = distance;
    const lateral = (Math.random() * 2 - 1) * jitterPx;
    const forward = traveled < distance ? (Math.random() * 2 - 1) * Math.min(jitterPx, minSpacing * 0.35) : 0;
    const clampedDistance = Math.min(distance, Math.max(0, traveled + forward));
    segments.push({
      x: from.x + dir.x * clampedDistance + perp.x * lateral,
      y: from.y + dir.y * clampedDistance + perp.y * lateral,
    });
  }
  segments[segments.length - 1] = to;
  return segments;
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
  const spawnCurves = swarm.spawnCurves || {};
  const idle = gnat.idle || {};
  const wander = gnat.wander || {};
  const personalityRanges = gnat.personalityRanges || {};
  const legacyWanderChanceMultiplier = clampNumber(rangeMidpoint(personalityRanges.wanderChance, 1), 1, 0, 4);
  const legacyWanderRangeMultiplier = clampNumber(rangeMidpoint(personalityRanges.wanderRange, 1), 1, 0.1, 4);
  const spawnRadiusBo = clampNumber(swarm.spawnRadiusBo, clampNumber(idle.idleRadiusBo, 2.2, 0.2, 12), 0.2, 24);
  const legacyWanderRangeBo = [
    clampNumber(wander.rangeMinBo, 2.8, 0.2, 20) * legacyWanderRangeMultiplier,
    clampNumber(wander.rangeMaxBo, 5.8, 0.4, 20) * legacyWanderRangeMultiplier,
  ];
  const wanderRangeBo = rangePair(personalityRanges.wanderRangeBo, legacyWanderRangeBo);
  const wanderMinBo = clampNumber(wanderRangeBo[0], 2.8, 0.2, 20);
  const wanderMaxBo = Math.max(spawnRadiusBo, wanderMinBo, clampNumber(wanderRangeBo[1], 5.8, 0.4, 24));
  const baseSpeedRangeBoPerSec = rangePair(swarm.baseSpeedBoPerSec, [
    clampNumber(idle.baseSpeedBoPerSec, 1.35, 0.1, 240),
    clampNumber(idle.maxSpeedBoPerSec, 3.2, 0.1, 320),
  ]);
  const scale = 42;
  const idleRadiusPx = Math.round(spawnRadiusBo * scale);
  const wanderMinPx = Math.round(wanderMinBo * scale);
  const wanderRadiusPx = Math.round(wanderMaxBo * scale);
  const swarmTotal = Math.round(clampNumber(swarm.gnatsTotal, 1, 1, 240));
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
  const segmentDwellSec = rangePair(personalityRanges.segmentDwellSec, [0, 0]);

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
    const baseSpeedBoPerSec = clampNumber(randomInRange(baseSpeedRangeBoPerSec, 1.35), 1.35, 0.1, 320);
    const speedMultiplier = clampNumber(randomInRange(personalityRanges.speed, 1), 1, 0.05, 8);
    const effectiveSpeedBoPerSec = baseSpeedBoPerSec * speedMultiplier;
    const responseMultiplier = Math.max(0.1, Math.sqrt(effectiveSpeedBoPerSec / 1.35));
    const personalWanderBo = clampNumber(
      randomInRangeWithCurve(
        personalityRanges.wanderRangeBo,
        wanderMaxBo,
        spawnCurves.wanderRangeBo,
      ),
      wanderMaxBo,
      0.4,
      24,
    );
    const personalWanderRadiusPx = Math.round(Math.max(spawnRadiusBo, personalWanderBo) * scale);
    const personalWanderMinPx = Math.min(wanderMinPx, personalWanderRadiusPx);
    const personalChancePerMinute = clampNumber(
      randomInRangeWithCurve(
        personalityRanges.wanderChancePerMinute,
        fallbackWanderChancePerMinute,
        spawnCurves.wanderChancePerMinute,
      ),
      16,
      0,
      120,
    );
    const personalCooldownSec = clampNumber(randomInRange(cooldownSec, 1.4), 1.4, 0, 120);
    const personalLingerSec = clampNumber(randomInRange(lingerSec, 0.4), 0.4, 0, 60);
    const legacyOutboundBias = rangeMidpoint(personalityRanges.outboundBias, wander.outboundBias);
    const segmentSpacingRangeBo = rangePair(personalityRanges.wanderSegmentSpacingBo, [3, 7]);
    const segmentSpacingRangePx = [
      clampNumber(segmentSpacingRangeBo[0], 3, 0.2, 32) * scale,
      clampNumber(segmentSpacingRangeBo[1], 7, 0.2, 40) * scale,
    ];
    const segmentJitterPx = clampNumber(randomInRange(personalityRanges.wanderSegmentJitterBo, 1.2), 1.2, 0, 16) * scale;
    const personalSegmentDwellSec = clampNumber(randomInRange(segmentDwellSec, 0), 0, 0, 12);
    const routeCommitment = clampNumber(randomInRange(personalityRanges.routeCommitment, legacyOutboundBias), 0.82, 0, 1);
    const returnBias = clampNumber(randomInRange(personalityRanges.returnBias, wander.returnBias), 0.82, 0, 1);
    const arrivalRadiusPx = clampNumber(randomInRange(personalityRanges.arrivalRadiusBo, wander.arrivalRadiusBo), 0.34, 0.05, 4) * scale;
    const returnSpeedMultiplier = clampNumber(randomInRange(personalityRanges.returnSpeedMultiplier, wander.returnSpeedMultiplier), 1.12, 0.1, 4);
    const outboundRerollRadiusPx = Math.max(arrivalRadiusPx * 0.5, segmentJitterPx * (1.15 - routeCommitment * 0.75));
    const returnRerollRadiusPx = Math.max(arrivalRadiusPx * 0.5, segmentJitterPx * (0.95 - returnBias * 0.55));
    const start = randomInCircle(idleRadiusPx);
    return {
      dot,
      x: start.x,
      y: start.y,
      vx: effectiveSpeedBoPerSec * scale * 0.2,
      vy: 0,
      mode: "idle",
      target: randomInCircle(idleRadiusPx),
      wanderDestination: randomInAnnulus(personalWanderMinPx, personalWanderRadiusPx),
      routeSegments: [],
      routeIndex: 0,
      routeDwellUntil: 0,
      isDwellingAtSegment: false,
      nextTargetAt: 0,
      lingerUntil: 0,
      cooldownUntil: index * 0.04,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      baseSpeedPx: effectiveSpeedBoPerSec * scale,
      maxSpeedPx: effectiveSpeedBoPerSec * scale,
      responseMultiplier,
      wanderRadiusPx: personalWanderRadiusPx,
      wanderMinPx: personalWanderMinPx,
      wanderChancePerSec: personalChancePerMinute / 60,
      cooldownSec: personalCooldownSec,
      lingerSec: personalLingerSec,
      segmentSpacingRangePx,
      segmentJitterPx,
      segmentDwellSec: personalSegmentDwellSec,
      routeCommitment,
      returnBias,
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
      const routeSegment = state.routeSegments[state.routeIndex] || state.wanderDestination;
      state.target = offsetPoint(routeSegment, state.outboundRerollRadiusPx);
    } else if (state.mode === "linger") {
      state.target = offsetPoint(state.wanderDestination, Math.max(state.arrivalRadiusPx, idleRadiusPx * 0.25));
    } else if (state.mode === "return") {
      const routeSegment = state.routeSegments[state.routeIndex] || { x: 0, y: 0 };
      state.target = offsetPoint(routeSegment, state.returnRerollRadiusPx);
    } else {
      state.target = randomInCircle(idleRadiusPx);
    }
    state.nextTargetAt = nowSec + retargetMinSec + Math.random() * Math.max(0, retargetMaxSec - retargetMinSec);
  };

  const startWander = (state, nowSec) => {
    state.mode = "outbound";
    state.isDwellingAtSegment = false;
    state.wanderDestination = randomInAnnulus(state.wanderMinPx, state.wanderRadiusPx);
    state.routeSegments = buildRouteSegments({
      from: { x: state.x, y: state.y },
      to: state.wanderDestination,
      spacingRangePx: state.segmentSpacingRangePx,
      jitterPx: state.segmentJitterPx,
    });
    state.routeIndex = 0;
    scheduleTarget(state, nowSec);
  };

  const advanceRouteSegment = (state, nowSec, onFinished) => {
    if (state.isDwellingAtSegment) {
      if (nowSec < state.routeDwellUntil) return;
      state.isDwellingAtSegment = false;
      state.routeIndex += 1;
    } else {
      const hasNextSegment = state.routeIndex < state.routeSegments.length - 1;
      if (hasNextSegment && state.segmentDwellSec > 0) {
        state.isDwellingAtSegment = true;
        state.routeDwellUntil = nowSec + state.segmentDwellSec;
        scheduleTarget(state, nowSec);
        return;
      }
      state.routeIndex += 1;
    }
    if (state.routeIndex >= state.routeSegments.length) {
      onFinished();
    } else {
      scheduleTarget(state, nowSec);
    }
  };

  const startCooldown = (state, nowSec) => {
    state.mode = "cooldown";
    state.isDwellingAtSegment = false;
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
      if (state.mode === "outbound" && (state.isDwellingAtSegment || distanceBetween(state, state.routeSegments[state.routeIndex] || state.wanderDestination) <= state.arrivalRadiusPx)) {
        advanceRouteSegment(state, nowSec, () => {
          state.mode = "linger";
          state.isDwellingAtSegment = false;
          state.lingerUntil = nowSec + state.lingerSec;
          scheduleTarget(state, nowSec);
        });
      } else if (state.mode === "linger" && nowSec >= state.lingerUntil) {
        state.mode = "return";
        state.isDwellingAtSegment = false;
        const returnSpacingRangePx = [
          state.segmentSpacingRangePx[0] * Math.max(0.5, 1 - state.returnBias * 0.35),
          state.segmentSpacingRangePx[1] * Math.max(0.55, 1 - state.returnBias * 0.25),
        ];
        state.routeSegments = buildRouteSegments({
          from: { x: state.x, y: state.y },
          to: { x: 0, y: 0 },
          spacingRangePx: returnSpacingRangePx,
          jitterPx: state.segmentJitterPx * Math.max(0.25, 1 - state.returnBias * 0.6),
        });
        state.routeIndex = 0;
        scheduleTarget(state, nowSec);
      } else if (state.mode === "return" && (state.isDwellingAtSegment || distanceBetween(state, state.routeSegments[state.routeIndex] || { x: 0, y: 0 }) <= Math.max(state.arrivalRadiusPx, idleRadiusPx * 0.34))) {
        advanceRouteSegment(state, nowSec, () => {
          startCooldown(state, nowSec);
        });
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
    idleRadiusBo: spawnRadiusBo,
    wanderMaxBo,
    idleRadiusPx,
    wanderMinPx,
    wanderRadiusPx,
    swarmTotal,
  });
}
