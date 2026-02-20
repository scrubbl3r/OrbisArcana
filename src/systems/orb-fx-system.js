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
  const orbiting = {
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

  function clearOrbitingGlobes() {
    for (const p of orbiting.particles) {
      try { if (p.el) p.el.remove(); } catch (_) {}
    }
    orbiting.particles = [];
  }

  function clearReleasedGlobes() {
    for (const p of released.particles) {
      try { if (p.el) p.el.remove(); } catch (_) {}
    }
    released.particles = [];
  }

  function reset() {
    clearInnerGlobes();
    clearOrbitingGlobes();
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

  function consumeOneInnerGlobe() {
    if (!inner.particles.length) return null;
    const p = inner.particles.shift() || null;
    try { if (p && p.el) p.el.remove(); } catch (_) {}
    renderInnerGlobes();
    return p;
  }

  function axisColor(axis) {
    const a = String(axis || "").toLowerCase();
    // Requested mapping: y=green, x=blue, z=red
    if (a === "y") {
      return {
        stroke: "rgba(50,255,117,0.98)",
        fill: "rgba(50,255,117,0.28)",
        glow: "0 0 12px rgba(50,255,117,0.30), inset 0 0 0 1px rgba(175,255,205,0.34)",
      };
    }
    if (a === "x") {
      return {
        stroke: "rgba(80,160,255,0.98)",
        fill: "rgba(80,160,255,0.28)",
        glow: "0 0 12px rgba(80,160,255,0.30), inset 0 0 0 1px rgba(186,215,255,0.34)",
      };
    }
    return {
      stroke: "rgba(255,80,80,0.98)",
      fill: "rgba(255,80,80,0.24)",
      glow: "0 0 12px rgba(255,80,80,0.30), inset 0 0 0 1px rgba(255,196,196,0.30)",
    };
  }

  function upsertOrbitingGlobe({ axis, slot, spellId }) {
    const a = String(axis || "").toLowerCase();
    const s = String(slot || "").toUpperCase();
    if (!a || !s) return;
    const existing = orbiting.particles.find((p) => p.axis === a && p.slot === s);
    const color = axisColor(a);
    if (existing) {
      existing.spellId = String(spellId || "");
      existing.stroke = color.stroke;
      existing.fill = color.fill;
      existing.glow = color.glow;
      return;
    }
    orbiting.particles.push({
      id: orbiting.nextId++,
      axis: a,
      slot: s,
      spellId: String(spellId || ""),
      phase: Math.random() * Math.PI * 2,
      speed: (1.35 + (Math.random() * 0.75)) * 4.0,
      radius: Math.max(3, Number(orbRadiusPx) * 0.10),
      orbitR: Math.max(14, Number(orbRadiusPx) + 18),
      stroke: color.stroke,
      fill: color.fill,
      glow: color.glow,
      tiltDeg: ((Math.random() * 10) - 5),
      tiltVelDeg: ((Math.random() * 2) - 1) * 0.65,
      tiltPhase: Math.random() * Math.PI * 2,
      lastMs: 0,
      el: null,
    });
  }

  function consumeOrbitingGlobe({ axis, slot }) {
    const a = String(axis || "").toLowerCase();
    const s = String(slot || "").toUpperCase();
    if (!a || !s) return;
    const idx = orbiting.particles.findIndex((p) => p.axis === a && p.slot === s);
    if (idx < 0) return;
    const p = orbiting.particles[idx];
    try { if (p.el) p.el.remove(); } catch (_) {}
    orbiting.particles.splice(idx, 1);
  }

  function orbitProjection(p, tS) {
    const r = Number(p.orbitR) || (Number(orbRadiusPx) + 18);
    const th = (Number(p.phase) || 0) + (Number(p.speed) || 1) * tS;
    const c = Math.cos(th);
    const s = Math.sin(th);
    let x = 0;
    let y = 0;
    let z = 0;
    if (p.axis === "y") {
      x = c * r;
      y = s * (r * 0.22);
      z = s;
    } else if (p.axis === "x") {
      x = s * (r * 0.22);
      y = c * r;
      z = s;
    } else {
      // True Z-axis orbit: circle in the screen XY plane (no diagonal tilt).
      x = c * (r * 0.86);
      y = s * (r * 0.86);
      z = 0;
    }
    const depth01 = clamp01((z + 1) * 0.5);
    const scale = 0.72 + (0.42 * depth01);
    const opacity = 0.48 + (0.50 * depth01);
    return { x, y, scale, opacity };
  }

  function tickOrbitingGlobes(nowMs) {
    if (!orbiting.particles.length) return;
    const now = Number(nowMs) || performance.now();
    const tS = now / 1000;
    const stageRect = stageEl.getBoundingClientRect();
    const cx = (stageRect.width || 0) * 0.5;
    const cy = Number(getOrbScreenY()) || 0;
    for (const p of orbiting.particles) {
      if (!p.el) {
        const el = document.createElement("div");
        el.className = "orbitGlobe";
        el.style.borderColor = p.stroke;
        el.style.backgroundColor = p.fill;
        el.style.boxShadow = p.glow;
        p.el = el;
        stageEl.appendChild(el);
      }
      const proj = orbitProjection(p, tS);
      const dt = p.lastMs ? clamp((now - p.lastMs) / 1000, 0, 0.05) : 0.016;
      p.lastMs = now;
      p.tiltVelDeg += ((Math.random() - 0.5) * 0.75) * dt;
      p.tiltVelDeg = clamp(p.tiltVelDeg, -1.6, 1.6);
      p.tiltDeg += p.tiltVelDeg * dt * 24;
      p.tiltDeg += Math.sin((tS * 0.55) + p.tiltPhase) * 0.035;
      p.tiltDeg = clamp(p.tiltDeg, -5, 5);
      const r = Math.max(2, Number(p.radius) || 4);
      const d = r * 2;
      const x = cx + proj.x;
      const y = cy + proj.y;
      p.el.style.width = `${d.toFixed(2)}px`;
      p.el.style.height = `${d.toFixed(2)}px`;
      p.el.style.left = `${(x - r).toFixed(2)}px`;
      p.el.style.top = `${(y - r).toFixed(2)}px`;
      p.el.style.opacity = clamp01(proj.opacity).toFixed(3);
      p.el.style.borderColor = p.stroke;
      p.el.style.backgroundColor = p.fill;
      p.el.style.boxShadow = p.glow;
      p.el.style.transform = `rotate(${p.tiltDeg.toFixed(2)}deg) scale(${proj.scale.toFixed(3)})`;
      p.el.style.zIndex = proj.scale >= 1 ? "34" : "30";
    }
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
    tickOrbitingGlobes(nowMs);
    tickReleasedGlobes(nowMs);
  }

  function start() {
    unsub.push(eventBus.on('pickup.collected', () => {
      spawnInnerGlobe();
    }));
    unsub.push(eventBus.on("voice.spell_loaded", (payload = {}) => {
      const axis = String(payload.axis || "").toLowerCase();
      const slot = String(payload.slot || "").toUpperCase();
      if (!axis || !slot) return;
      const globe = consumeOneInnerGlobe();
      if (!globe) return;
      upsertOrbitingGlobe({
        axis,
        slot,
        spellId: String(payload.spellId || ""),
      });
    }));
    unsub.push(eventBus.on("voice.spell_cast", (payload = {}) => {
      if (String(payload.trigger || "") !== "shake_detonation") return;
      consumeOrbitingGlobe({
        axis: String(payload.axis || "").toLowerCase(),
        slot: String(payload.slot || "").toUpperCase(),
      });
    }));
    unsub.push(eventBus.on('orb.died', () => {
      releaseInnerGlobesAtDeath(performance.now());
      clearOrbitingGlobes();
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
