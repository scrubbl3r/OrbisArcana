export function createOrbFxSystem({ eventBus, orbInteriorEl, stageEl, getOrbScreenY, orbRadiusPx }) {
  if (!eventBus || typeof eventBus.on !== 'function') {
    throw new Error('createOrbFxSystem requires eventBus.on');
  }
  if (!orbInteriorEl) throw new Error('createOrbFxSystem requires orbInteriorEl');
  if (!stageEl) throw new Error('createOrbFxSystem requires stageEl');
  if (typeof getOrbScreenY !== 'function') throw new Error('createOrbFxSystem requires getOrbScreenY');
  if (!(Number(orbRadiusPx) > 0)) throw new Error('createOrbFxSystem requires orbRadiusPx');

  const unsub = [];
  const inner = {
    particles: [],
    nextId: 1,
  };
  const released = {
    particles: [],
    nextId: 1,
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (x) => clamp(Number(x) || 0, 0, 1);

  function innerGlobeDiameterPx() {
    return Number(orbRadiusPx) * 0.2; // 10% of orb diameter
  }

  function clearInnerGlobes() {
    inner.particles = [];
    orbInteriorEl.innerHTML = '';
  }

  function clearReleasedGlobes() {
    for (const p of released.particles) {
      try { if (p.el) p.el.remove(); } catch (_) {}
    }
    released.particles = [];
  }

  function reset() {
    clearInnerGlobes();
    clearReleasedGlobes();
  }

  function renderInnerGlobes() {
    for (const p of inner.particles) {
      if (!p.el) {
        const el = document.createElement('div');
        el.className = 'innerGlobe';
        p.el = el;
        orbInteriorEl.appendChild(el);
      }
      const d = p.r * 2;
      p.el.style.width = `${d.toFixed(2)}px`;
      p.el.style.height = `${d.toFixed(2)}px`;
      p.el.style.left = `${(Number(orbRadiusPx) + p.x - p.r).toFixed(2)}px`;
      p.el.style.top = `${(Number(orbRadiusPx) + p.y - p.r).toFixed(2)}px`;
    }
  }

  function spawnInnerGlobe() {
    const r = innerGlobeDiameterPx() * 0.5;
    const speed = 360 + (Math.random() * 270);
    const a = Math.random() * Math.PI * 2;
    inner.particles.push({
      id: inner.nextId++,
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r,
      el: null,
    });
    renderInnerGlobes();
  }

  function tickInnerGlobes(dt) {
    if (!inner.particles.length) return;
    const maxDistBase = Number(orbRadiusPx);
    for (const p of inner.particles) {
      p.vx += (Math.random() - 0.5) * 120 * dt;
      p.vy += (Math.random() - 0.5) * 120 * dt;
      const vMag = Math.hypot(p.vx, p.vy);
      const vCap = 900;
      if (vMag > vCap) {
        const s = vCap / (vMag || 1);
        p.vx *= s;
        p.vy *= s;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const dist = Math.hypot(p.x, p.y);
      const maxDist = maxDistBase - p.r;
      if (dist > maxDist && maxDist > 0) {
        const nx = p.x / (dist || 1);
        const ny = p.y / (dist || 1);
        p.x = nx * maxDist;
        p.y = ny * maxDist;
        const vn = (p.vx * nx) + (p.vy * ny);
        if (vn > 0) {
          p.vx = p.vx - (2 * vn * nx);
          p.vy = p.vy - (2 * vn * ny);
          const tx = -ny;
          const ty = nx;
          const kick = (Math.random() - 0.5) * 120;
          p.vx += tx * kick;
          p.vy += ty * kick;
        }
      }
    }
    renderInnerGlobes();
  }

  function fxRand01() {
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] / 4294967296;
    } catch (_) {
      return Math.random();
    }
  }

  function releaseInnerGlobesAtDeath(nowMs) {
    if (!inner.particles.length) return;
    const stageRect = stageEl.getBoundingClientRect();
    const baseX = (stageRect.width || 0) * 0.5;
    const baseY = Number(getOrbScreenY()) || 0;
    for (const p of inner.particles) {
      const seedA = fxRand01() * Math.PI * 2;
      const nx = Math.cos(seedA);
      const ny = Math.sin(seedA);
      const tx = -ny;
      const ty = nx;
      const ttlMs = Math.round(1000 + (fxRand01() * 2500));
      released.particles.push({
        id: released.nextId++,
        bornMs: Number(nowMs) || performance.now(),
        ttlMs,
        growMs: 0,
        x0: baseX + (Number(p.x) || 0) + ((fxRand01() - 0.5) * 10),
        y0: baseY + (Number(p.y) || 0) + ((fxRand01() - 0.5) * 10),
        nx,
        ny,
        tx,
        ty,
        speed: 140 + (fxRand01() * 320),
        sinAmp: 10 + (fxRand01() * 22),
        sinFreq: 6 + (fxRand01() * 8),
        phase: fxRand01() * Math.PI * 2,
        r0: Number(p.r) || innerGlobeDiameterPx() * 0.5,
        r1: Number(p.r) || innerGlobeDiameterPx() * 0.5,
        el: null,
      });
    }
    clearInnerGlobes();
  }

  function tickReleasedGlobes(nowMs) {
    if (!released.particles.length) return;
    const now = Number(nowMs) || performance.now();
    for (let i = released.particles.length - 1; i >= 0; i--) {
      const p = released.particles[i];
      if (!p.el) {
        const el = document.createElement('div');
        el.className = 'releasedGlobe';
        p.el = el;
        stageEl.appendChild(el);
      }
      const ageMs = now - p.bornMs;
      const ageS = Math.max(0, ageMs / 1000);
      const life01 = clamp01(ageMs / Math.max(1, p.ttlMs));
      const grow01 = clamp01(ageMs / Math.max(1, p.growMs));
      const r = p.r0 + ((p.r1 - p.r0) * grow01);
      const baseDist = p.speed * ageS;
      const sinOffset = Math.sin((ageS * p.sinFreq) + p.phase) * p.sinAmp;
      const x = p.x0 + (p.nx * baseDist) + (p.tx * sinOffset);
      const y = p.y0 + (p.ny * baseDist) + (p.ty * sinOffset);
      const fadeStart = 0.55;
      const fade01 = life01 <= fadeStart ? 1 : (1 - ((life01 - fadeStart) / (1 - fadeStart)));
      p.el.style.width = `${(r * 2).toFixed(2)}px`;
      p.el.style.height = `${(r * 2).toFixed(2)}px`;
      p.el.style.left = `${(x - r).toFixed(2)}px`;
      p.el.style.top = `${(y - r).toFixed(2)}px`;
      p.el.style.opacity = clamp01(fade01).toFixed(3);

      if (ageMs >= p.ttlMs) {
        try { p.el.remove(); } catch (_) {}
        released.particles.splice(i, 1);
      }
    }
  }

  function tick(nowMs, dt) {
    tickInnerGlobes(dt);
    tickReleasedGlobes(nowMs);
  }

  function start() {
    unsub.push(eventBus.on('pickup.collected', () => {
      spawnInnerGlobe();
    }));
    unsub.push(eventBus.on('orb.died', () => {
      releaseInnerGlobesAtDeath(performance.now());
    }));
    unsub.push(eventBus.on('orb.revived', () => {
      reset();
    }));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
    reset();
  }

  return {
    start,
    stop,
    reset,
    tick,
  };
}
