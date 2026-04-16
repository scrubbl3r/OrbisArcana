import {
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_CAST,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
} from "../../contracts/events.js";
import {
  getInnerGlobeDiameterPx,
  getOrbitDistancePx,
  getOrbitGlobeRadiusPx,
  ORB_GLOBE_VISUAL_DEFAULTS,
} from "./orb-globe-base-state.js";

export function createOrbGlobesRuntime({
  eventBus,
  orbInteriorEl,
  stageEl,
  getOrbScreenY,
  orbRadiusPx,
  getOrbRadiusPx = null,
  getAxisColor01,
  globeVisualState = ORB_GLOBE_VISUAL_DEFAULTS,
}) {
  if (!eventBus || typeof eventBus.on !== 'function') {
    throw new Error('createOrbGlobesRuntime requires eventBus.on');
  }
  if (!orbInteriorEl) throw new Error('createOrbGlobesRuntime requires orbInteriorEl');
  if (!stageEl) throw new Error('createOrbGlobesRuntime requires stageEl');
  if (typeof getOrbScreenY !== 'function') throw new Error('createOrbGlobesRuntime requires getOrbScreenY');
  if (!(Number(orbRadiusPx) > 0) && typeof getOrbRadiusPx !== "function") {
    throw new Error('createOrbGlobesRuntime requires orbRadiusPx or getOrbRadiusPx');
  }

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
  const TILT_MAX_DEG = 10;
  const axisColorProvider = (typeof getAxisColor01 === "function")
    ? getAxisColor01
    : ((axis) => {
      const a = String(axis || "").toLowerCase();
      if (a === "x") return { r: 0/255, g: 100/255, b: 253/255 };
      if (a === "z") return { r: 253/255, g: 241/255, b: 0/255 };
      return { r: 253/255, g: 78/255, b: 0/255 };
    });
  const ORBIT_AXES = Object.freeze(["x", "y", "z"]);
  const readWordIdFromPayload = (payload = {}) =>
    String((payload.wordId ?? payload.spellId) || "");

  function readOrbRadiusPx() {
    const liveRadius = (typeof getOrbRadiusPx === "function") ? Number(getOrbRadiusPx()) : NaN;
    if (Number.isFinite(liveRadius) && liveRadius > 0) return liveRadius;
    return Math.max(1, Number(orbRadiusPx) || 1);
  }

  function randomOrbitAxis() {
    const idx = Math.floor(Math.random() * ORBIT_AXES.length);
    return ORBIT_AXES[idx] || "y";
  }

  function color01ToRgba(c, a) {
    const r = Math.round(clamp01(c && c.r) * 255);
    const g = Math.round(clamp01(c && c.g) * 255);
    const b = Math.round(clamp01(c && c.b) * 255);
    return `rgba(${r},${g},${b},${clamp01(a).toFixed(3)})`;
  }

  function innerGlobeDiameterPx() {
    return getInnerGlobeDiameterPx(readOrbRadiusPx(), globeVisualState);
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
      const orbRadius = readOrbRadiusPx();
      p.el.style.width = `${d.toFixed(2)}px`;
      p.el.style.height = `${d.toFixed(2)}px`;
      p.el.style.left = `${(orbRadius + p.x - p.r).toFixed(2)}px`;
      p.el.style.top = `${(orbRadius + p.y - p.r).toFixed(2)}px`;
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

  function reconcileInnerGlobesToCount(targetCountRaw) {
    const targetCount = Math.max(0, Math.floor(Number(targetCountRaw) || 0));
    while (inner.particles.length < targetCount) {
      spawnInnerGlobe();
    }
    while (inner.particles.length > targetCount) {
      consumeOneInnerGlobe();
    }
  }

  function axisColor(axis) {
    const c = axisColorProvider(axis);
    const stroke = color01ToRgba(c, 0.98);
    const fill = color01ToRgba(c, 0.28);
    const glowOuter = color01ToRgba(c, 0.30);
    const glowInner = color01ToRgba(c, 0.34);
    return {
      stroke,
      fill,
      glow: `0 0 12px ${glowOuter}, inset 0 0 0 1px ${glowInner}`,
    };
  }

  function upsertOrbitingGlobe({ axis, slot, wordId, globeId, emitterId, state }) {
    const s = String(slot || "").toUpperCase();
    const g = String(globeId || "");
    if (!s && !g) return;
    const tokenId = String(wordId || "");
    const existing = orbiting.particles.find((p) => (g && p.globeId === g) || (s && p.slot === s));
    const a = String(axis || "").toLowerCase() || (existing && existing.axis) || randomOrbitAxis();
    if (!a) return;
    const color = axisColor(a);
    if (existing) {
      existing.axis = a;
      existing.slot = s;
      existing.globeId = g || existing.globeId || "";
      existing.emitterId = String(emitterId || existing.emitterId || "");
      existing.state = String(state || existing.state || "loaded");
      existing.wordId = tokenId;
      existing.spellId = tokenId;
      existing.stroke = color.stroke;
      existing.fill = color.fill;
      existing.glow = color.glow;
      return;
    }
    orbiting.particles.push({
      id: orbiting.nextId++,
      globeId: g,
      emitterId: String(emitterId || ""),
      state: String(state || "loaded"),
      axis: a,
      slot: s,
      wordId: tokenId,
      spellId: tokenId,
      phase: Math.random() * Math.PI * 2,
      speed: (1.35 + (Math.random() * 0.75)) * 4.0,
      radius: getOrbitGlobeRadiusPx(readOrbRadiusPx(), globeVisualState),
      orbitR: getOrbitDistancePx(readOrbRadiusPx(), globeVisualState),
      stroke: color.stroke,
      fill: color.fill,
      glow: color.glow,
      tiltA: ((Math.random() * 2 * TILT_MAX_DEG) - TILT_MAX_DEG),
      tiltB: ((Math.random() * 2 * TILT_MAX_DEG) - TILT_MAX_DEG),
      tiltTargetA: ((Math.random() * 2 * TILT_MAX_DEG) - TILT_MAX_DEG),
      tiltTargetB: ((Math.random() * 2 * TILT_MAX_DEG) - TILT_MAX_DEG),
      tiltTargetMsA: 1000 + (Math.random() * 2200),
      tiltTargetMsB: 1200 + (Math.random() * 2400),
      tiltPhase: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2,
      driftHz: 0.35 + (Math.random() * 0.45),
      driftAmp: 3 + (Math.random() * 7),
      lastMs: 0,
      el: null,
    });
    tickOrbitingGlobes(performance.now());
  }

  function consumeOrbitingGlobe({ axis, slot, globeId }) {
    const s = String(slot || "").toUpperCase();
    const g = String(globeId || "");
    if (!s && !g) return;
    const idx = orbiting.particles.findIndex((p) => (g && p.globeId === g) || (s && p.slot === s));
    if (idx < 0) return;
    const p = orbiting.particles[idx];
    try { if (p.el) p.el.remove(); } catch (_) {}
    orbiting.particles.splice(idx, 1);
  }

  function orbitProjection(p, tS) {
    const currentOrbRadius = readOrbRadiusPx();
    const r = Number(p.orbitR) || (currentOrbRadius + 18);
    const drift = Math.sin((tS * (Number(p.driftHz) || 0.5) * Math.PI * 2) + (Number(p.driftPhase) || 0))
      * (Number(p.driftAmp) || 0);
    const rw = r + drift;
    const th = (Number(p.phase) || 0) + (Number(p.speed) || 1) * tS;
    const c = Math.cos(th);
    const s = Math.sin(th);
    let x = 0;
    let y = 0;
    let z = 0;
    if (p.axis === "y") {
      x = c * rw;
      y = s * (rw * 0.26);
      z = s;
    } else if (p.axis === "x") {
      x = s * (rw * 0.26);
      y = c * rw;
      z = s;
    } else {
      // True Z-axis orbit: circle in the screen XY plane (no diagonal tilt).
      x = c * rw;
      y = s * rw;
      z = 0;
    }
    const toRad = Math.PI / 180;
    const a = (Number(p.tiltA) || 0) * toRad;
    const b = (Number(p.tiltB) || 0) * toRad;

    // Apply dual-axis tilt drift per orbit axis:
    // x-axis orbit -> tilt on y/z
    // y-axis orbit -> tilt on x/z
    // z-axis orbit -> tilt on x/y
    const sinA = Math.sin(a), cosA = Math.cos(a);
    const sinB = Math.sin(b), cosB = Math.cos(b);
    if (p.axis === "x") {
      // rotate around Y (a), then around Z (b)
      const x1 = (x * cosA) + (z * sinA);
      const z1 = (-x * sinA) + (z * cosA);
      const x2 = (x1 * cosB) - (y * sinB);
      const y2 = (x1 * sinB) + (y * cosB);
      x = x2; y = y2; z = z1;
    } else if (p.axis === "y") {
      // rotate around X (a), then around Z (b)
      const y1 = (y * cosA) - (z * sinA);
      const z1 = (y * sinA) + (z * cosA);
      const x2 = (x * cosB) - (y1 * sinB);
      const y2 = (x * sinB) + (y1 * cosB);
      x = x2; y = y2; z = z1;
    } else {
      // rotate around X (a), then around Y (b)
      const y1 = (y * cosA) - (z * sinA);
      const z1 = (y * sinA) + (z * cosA);
      const x2 = (x * cosB) + (z1 * sinB);
      const z2 = (-x * sinB) + (z1 * cosB);
      x = x2; y = y1; z = z2;
    }

    const depth01 = clamp01(((z / Math.max(1, rw)) + 1) * 0.5);
    const scale = 0.72 + (0.42 * depth01);
    const opacity = 0.48 + (0.50 * depth01);
    return { x, y, scale, opacity };
  }

  function tickOrbitingGlobes(nowMs) {
    if (!orbiting.particles.length) return;
    const now = Number(nowMs) || performance.now();
    const tS = now / 1000;
    const currentOrbRadius = readOrbRadiusPx();
    const stageRect = stageEl.getBoundingClientRect();
    const cx = (stageRect.width || 0) * 0.5;
    const cy = Number(getOrbScreenY()) || 0;
    for (const p of orbiting.particles) {
      const liveColor = axisColor(p.axis);
      const isBound = String(p.state || "") === "bound" || !!String(p.slot || "");
      p.radius = getOrbitGlobeRadiusPx(currentOrbRadius, globeVisualState);
      p.orbitR = getOrbitDistancePx(currentOrbRadius, globeVisualState) * (isBound ? 0.88 : 1);
      p.stroke = liveColor.stroke;
      p.fill = liveColor.fill;
      p.glow = liveColor.glow;
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
      p.tiltTargetMsA = (Number(p.tiltTargetMsA) || 0) - (dt * 1000);
      p.tiltTargetMsB = (Number(p.tiltTargetMsB) || 0) - (dt * 1000);
      if (p.tiltTargetMsA <= 0) {
        p.tiltTargetA = ((Math.random() * 2 * TILT_MAX_DEG) - TILT_MAX_DEG);
        p.tiltTargetMsA = 900 + (Math.random() * 2600);
      }
      if (p.tiltTargetMsB <= 0) {
        p.tiltTargetB = ((Math.random() * 2 * TILT_MAX_DEG) - TILT_MAX_DEG);
        p.tiltTargetMsB = 1100 + (Math.random() * 2800);
      }
      const wobbleHz = 0.35;
      const alpha = 1 - Math.exp(-(wobbleHz * dt));
      p.tiltA += ((Number(p.tiltTargetA) || 0) - (Number(p.tiltA) || 0)) * alpha;
      p.tiltB += ((Number(p.tiltTargetB) || 0) - (Number(p.tiltB) || 0)) * alpha;
      p.tiltA += Math.sin((tS * 0.43) + p.tiltPhase) * 0.08;
      p.tiltB += Math.sin((tS * 0.37) + p.tiltPhase + 1.1) * 0.08;
      p.tiltA = clamp(p.tiltA, -TILT_MAX_DEG, TILT_MAX_DEG);
      p.tiltB = clamp(p.tiltB, -TILT_MAX_DEG, TILT_MAX_DEG);
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
      p.el.style.boxShadow = isBound ? `${p.glow}, 0 0 18px rgba(255,255,255,0.20)` : p.glow;
      p.el.style.transform = `scale(${proj.scale.toFixed(3)})`;
      p.el.style.zIndex = proj.scale >= 1 ? "34" : "30";
    }
  }

  function reconcileOrbitingGlobesFromInventory(globes = []) {
    const active = (Array.isArray(globes) ? globes : [])
      .filter((g) => g && String(g.state || "") !== "spent")
      .map((g) => ({
        globeId: String(g.globeId || g.id || ""),
        emitterId: String(g.emitterId || ""),
        state: String(g.state || "loaded"),
        slot: String(g.slot || "").toUpperCase(),
        wordId: String(g.wordId || g.spellId || ""),
        axis: String(g.axis || g.spinAxis || "").toLowerCase(),
      }))
      .filter((g) => g.globeId);
    const activeIds = new Set(active.map((g) => g.globeId));
    for (let i = orbiting.particles.length - 1; i >= 0; i -= 1) {
      const p = orbiting.particles[i];
      if (p.globeId && activeIds.has(p.globeId)) continue;
      try { if (p.el) p.el.remove(); } catch (_) {}
      orbiting.particles.splice(i, 1);
    }
    for (const g of active) {
      upsertOrbitingGlobe(g);
    }
  }

  function tickInnerGlobes(dt) {
    if (!inner.particles.length) return;
    const maxDistBase = readOrbRadiusPx();
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
    unsub.push(eventBus.on(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, (payload = {}) => {
      clearInnerGlobes();
      reconcileOrbitingGlobesFromInventory(payload.globes || []);
    }));
    unsub.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      const slot = String(payload.slot || "").toUpperCase();
      const globeId = String(payload.globeId || payload.boundGlobeId || "");
      if (!slot && !globeId) return;
      const wordId = readWordIdFromPayload(payload);
      upsertOrbitingGlobe({
        axis: String(payload.axis || "").toLowerCase(),
        slot,
        wordId,
        globeId,
        emitterId: String(payload.emitterId || ""),
        state: "bound",
      });
    }));
    unsub.push(eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      const slot = String(payload.slot || "").toUpperCase();
      const globeId = String(payload.globeId || payload.boundGlobeId || "");
      if (!slot && !globeId) return;
      consumeOrbitingGlobe({ slot, globeId });
    }));
    unsub.push(eventBus.on(EVT_ORB_DIED, () => {
      releaseInnerGlobesAtDeath(performance.now());
      clearOrbitingGlobes();
    }));
    unsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
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

export const createOrbFxSystem = createOrbGlobesRuntime;
