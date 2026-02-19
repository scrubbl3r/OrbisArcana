export function createWorldSystem({
  eventBus,
  stageEl,
  getStageRect,
  worldToScreenY,
  getOrbWorldPosition,
  orbRadiusPx,
  spawn,
  getGlobeEl,
  setGlobeEl,
}) {
  if (!eventBus || typeof eventBus.emit !== 'function') {
    throw new Error('createWorldSystem requires eventBus.emit');
  }
  if (!stageEl) throw new Error('createWorldSystem requires stageEl');
  if (typeof getStageRect !== 'function') throw new Error('createWorldSystem requires getStageRect');
  if (typeof worldToScreenY !== 'function') throw new Error('createWorldSystem requires worldToScreenY');
  if (typeof getOrbWorldPosition !== 'function') throw new Error('createWorldSystem requires getOrbWorldPosition');
  if (typeof orbRadiusPx !== 'number' || !(orbRadiusPx > 0)) throw new Error('createWorldSystem requires orbRadiusPx');

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (x) => clamp(Number(x) || 0, 0, 1);

  const PICKUP_ATTRACT_START_EDGE_GAP_PX = 120;
  const PICKUP_CONSUME_EDGE_GAP_PX = 15;

  const state = {
    pickup: {
      id: 'globe_mid_01',
      xNorm: Number(spawn && spawn.xNorm) || 0.5,
      yW: Number(spawn && spawn.yW) || 0,
      anchorXNorm: Number(spawn && spawn.xNorm) || 0.5,
      anchorYW: Number(spawn && spawn.yW) || 0,
      r: Number(spawn && spawn.r) || 25,
      active: true,
      spawnedAtMs: 0,
      attracting: false,
      lastStepTs: 0,
      driftAmpXNorm: 0.014,
      driftAmpY: 24,
      driftFreqXHz: 0.23,
      driftFreqYHz: 0.31,
      driftPhaseX: Math.random() * Math.PI * 2,
      driftPhaseY: Math.random() * Math.PI * 2,
    },
  };

  function ensureGlobeEl() {
    const existing = (typeof getGlobeEl === 'function') ? getGlobeEl() : null;
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = 'testGlobe';
    el.className = 'pickupGlobe';
    el.setAttribute('aria-label', 'Energy globe');
    stageEl.appendChild(el);
    if (typeof setGlobeEl === 'function') setGlobeEl(el);
    return el;
  }

  function pickupWorldPos(p, nowMs) {
    if (!p) return { xNorm: 0.5, yW: 0 };
    if (p.attracting) {
      return {
        xNorm: Number(p.xNorm) || 0.5,
        yW: Number(p.yW) || 0,
      };
    }
    const t = (Number(nowMs) || performance.now()) / 1000;
    const xNorm = (Number(p.anchorXNorm) || 0.5) +
      (Math.sin((t * (Number(p.driftFreqXHz) || 0) * Math.PI * 2) + (Number(p.driftPhaseX) || 0)) * (Number(p.driftAmpXNorm) || 0));
    const yW = (Number(p.anchorYW) || 0) +
      (Math.sin((t * (Number(p.driftFreqYHz) || 0) * Math.PI * 2) + (Number(p.driftPhaseY) || 0)) * (Number(p.driftAmpY) || 0));
    return { xNorm, yW };
  }

  function render(nowMs) {
    const p = state.pickup;
    const globeEl = ensureGlobeEl();
    if (!globeEl || !p) return;
    if (!p.active) {
      globeEl.style.display = 'none';
      return;
    }

    const pos = pickupWorldPos(p, nowMs);
    const rect = getStageRect();
    const y = worldToScreenY(pos.yW);
    const top = y - p.r;
    const d = p.r * 2;
    globeEl.style.display = 'block';
    globeEl.style.width = `${d.toFixed(2)}px`;
    globeEl.style.height = `${d.toFixed(2)}px`;
    const left = ((Number(pos.xNorm) || 0.5) * (rect.width || 0)) - p.r;
    globeEl.style.left = `${left.toFixed(2)}px`;
    globeEl.style.top = `${top.toFixed(2)}px`;
    globeEl.style.transform = 'none';
    globeEl.style.zIndex = '40';
    globeEl.style.opacity = '1';
  }

  function collectPickup(nowMs) {
    const p = state.pickup;
    p.active = false;
    render(nowMs);
    eventBus.emit('pickup.collected', {
      id: p.id,
      type: 'energy_globe',
      atMs: Number(nowMs) || performance.now(),
    });
  }

  function tick(nowMs, _dt) {
    const p = state.pickup;
    if (!p || !p.active) {
      render(nowMs);
      return;
    }

    const stageW = getStageRect().width || 0;
    const orb = getOrbWorldPosition();
    const orbXNorm = Number(orb && orb.xNorm) || 0.5;
    const orbYW = Number(orb && orb.yW) || 0;

    const pos = pickupWorldPos(p, nowMs);
    const dxPx = ((orbXNorm - pos.xNorm) * stageW);
    const dyPx = (orbYW - pos.yW);
    let centerDist = Math.hypot(dxPx, dyPx);
    let edgeGapPx = centerDist - (orbRadiusPx + p.r);

    if (edgeGapPx <= PICKUP_ATTRACT_START_EDGE_GAP_PX) {
      if (!p.attracting) {
        p.xNorm = pos.xNorm;
        p.yW = pos.yW;
      }
      p.attracting = true;
    }

    if (p.attracting) {
      if (!p.lastStepTs) p.lastStepTs = Number(nowMs) || performance.now();
      const dt = clamp(((Number(nowMs) || performance.now()) - p.lastStepTs) / 1000, 0, 0.05);
      p.lastStepTs = Number(nowMs) || performance.now();

      const prox01 = clamp01(1 - (edgeGapPx / Math.max(1, PICKUP_ATTRACT_START_EDGE_GAP_PX)));
      const k = 2 + (10 * prox01 * prox01);
      const alpha = 1 - Math.exp(-k * dt);

      p.xNorm += (orbXNorm - p.xNorm) * alpha;
      p.yW += (orbYW - p.yW) * alpha;

      const dx2 = ((orbXNorm - p.xNorm) * stageW);
      const dy2 = (orbYW - p.yW);
      centerDist = Math.hypot(dx2, dy2);
      edgeGapPx = centerDist - (orbRadiusPx + p.r);
    } else {
      p.lastStepTs = Number(nowMs) || performance.now();
    }

    if (edgeGapPx <= PICKUP_CONSUME_EDGE_GAP_PX) {
      collectPickup(nowMs);
      return;
    }

    render(nowMs);
  }

  function reset(nowMs) {
    const p = state.pickup;
    p.xNorm = p.anchorXNorm;
    p.yW = p.anchorYW;
    p.active = true;
    p.spawnedAtMs = Number(nowMs) || performance.now();
    p.attracting = false;
    p.lastStepTs = 0;
    render(nowMs);
  }

  function getState() {
    return {
      pickup: {
        ...state.pickup,
      },
    };
  }

  return {
    tick,
    render,
    reset,
    getState,
  };
}
