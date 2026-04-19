import {
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_CAST,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
} from "../../contracts/events.js";
import {
  getInnerPaddingPx,
  getInnerGlobeDiameterPx,
  getOrbitDistancePx,
  getOrbitGlobeRadiusPx,
  ORB_GLOBE_VISUAL_DEFAULTS,
} from "./orb-globe-base-state.js?v=20260418a";

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
  const readRange = (minValue, maxValue, fallbackMin, fallbackMax) => {
    const rawMin = Math.max(0, Number(minValue));
    const rawMax = Math.max(0, Number(maxValue));
    const min = Number.isFinite(rawMin) ? rawMin : fallbackMin;
    const max = Number.isFinite(rawMax) ? rawMax : fallbackMax;
    return {
      min: Math.min(min, max),
      max: Math.max(min, max),
    };
  };
  const randBetween = (min, max) => Number(min) + (Math.random() * (Number(max) - Number(min)));

  function readOrbRadiusPx() {
    const liveRadius = (typeof getOrbRadiusPx === "function") ? Number(getOrbRadiusPx()) : NaN;
    if (Number.isFinite(liveRadius) && liveRadius > 0) return liveRadius;
    return Math.max(1, Number(orbRadiusPx) || 1);
  }

  function randomOrbitAxis() {
    const idx = Math.floor(Math.random() * ORBIT_AXES.length);
    return ORBIT_AXES[idx] || "y";
  }

  function randomOrbitPlane() {
    return {
      angle: Math.random() * Math.PI * 2,
      squash: randBetween(0.22, 0.68),
    };
  }

  function orbitSpeedRange() {
    return readRange(
      globeVisualState && globeVisualState.orbitSpeedMin,
      globeVisualState && globeVisualState.orbitSpeedMax,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitSpeedMin,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitSpeedMax
    );
  }

  function orbitDriftRange() {
    return readRange(
      globeVisualState && globeVisualState.orbitDriftMin,
      globeVisualState && globeVisualState.orbitDriftMax,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDriftMin,
      ORB_GLOBE_VISUAL_DEFAULTS.orbitDriftMax
    );
  }

  function innerSpeedRange() {
    return readRange(
      globeVisualState && globeVisualState.innerSpeedMinPxPerSec,
      globeVisualState && globeVisualState.innerSpeedMaxPxPerSec,
      ORB_GLOBE_VISUAL_DEFAULTS.innerSpeedMinPxPerSec,
      ORB_GLOBE_VISUAL_DEFAULTS.innerSpeedMaxPxPerSec
    );
  }

  function innerDriftRange() {
    return readRange(
      globeVisualState && globeVisualState.innerDriftMin,
      globeVisualState && globeVisualState.innerDriftMax,
      ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMin,
      ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMax
    );
  }

  function innerPaddingPx() {
    return getInnerPaddingPx(readOrbRadiusPx(), globeVisualState || ORB_GLOBE_VISUAL_DEFAULTS);
  }

  function rotateVector(vx, vy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: (vx * cos) - (vy * sin),
      y: (vx * sin) + (vy * cos),
    };
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
      p.el.style.opacity = "1";
      if (p.fill) p.el.style.backgroundColor = p.fill;
      if (p.glow) p.el.style.boxShadow = p.glow;
    }
  }

  function spawnInnerGlobe(payload = {}) {
    const axis = String(payload.axis || "").toLowerCase();
    const color = axis ? axisColor(axis, { fillAlpha: 1 }) : null;
    const r = innerGlobeDiameterPx() * 0.5;
    const speeds = innerSpeedRange();
    const drifts = innerDriftRange();
    const speed = randBetween(speeds.min, speeds.max);
    const a = Math.random() * Math.PI * 2;
    inner.particles.push({
      id: inner.nextId++,
      globeId: String(payload.globeId || ""),
      emitterId: String(payload.emitterId || ""),
      state: String(payload.state || "bound"),
      axis,
      slot: String(payload.slot || "").toUpperCase(),
      wordId: String(payload.wordId || ""),
      spellId: String(payload.wordId || ""),
      x: 0,
      y: 0,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      driftMin: drifts.min,
      driftMax: drifts.max,
      r,
      fill: color ? color.fill : "",
      glow: color ? color.glow : "",
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

  function upsertInnerGlobe({ axis, slot, wordId, globeId, emitterId, state }) {
    const g = String(globeId || "");
    const s = String(slot || "").toUpperCase();
    if (!g && !s) return;
    const existing = inner.particles.find((p) => (g && p.globeId === g) || (s && p.slot === s));
    const a = String(axis || "").toLowerCase() || (existing && existing.axis) || randomOrbitAxis();
    const color = axisColor(a, { fillAlpha: 1 });
    if (existing) {
      existing.globeId = g || existing.globeId || "";
      existing.emitterId = String(emitterId || existing.emitterId || "");
      existing.state = String(state || existing.state || "bound");
      existing.axis = a;
      existing.slot = s || existing.slot || "";
      existing.wordId = String(wordId || existing.wordId || "");
      existing.spellId = String(wordId || existing.spellId || "");
      existing.fill = color.fill;
      existing.glow = color.glow;
      renderInnerGlobes();
      return;
    }
    spawnInnerGlobe({
      axis: a,
      slot: s,
      wordId,
      globeId: g,
      emitterId,
      state: state || "bound",
    });
  }

  function consumeInnerGlobe({ slot, globeId }) {
    const s = String(slot || "").toUpperCase();
    const g = String(globeId || "");
    if (!s && !g) return;
    const idx = inner.particles.findIndex((p) => (g && p.globeId === g) || (s && p.slot === s));
    if (idx < 0) return;
    const p = inner.particles[idx];
    try { if (p.el) p.el.remove(); } catch (_) {}
    inner.particles.splice(idx, 1);
    renderInnerGlobes();
  }

  function axisColor(axis, { fillAlpha = 0.28 } = {}) {
    const c = axisColorProvider(axis);
    const stroke = color01ToRgba(c, 0.98);
    const fill = color01ToRgba(c, fillAlpha);
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
    const speeds = orbitSpeedRange();
    const drifts = orbitDriftRange();
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
      speed: randBetween(speeds.min, speeds.max),
      direction: Math.random() < 0.5 ? -1 : 1,
      orbitPlane: randomOrbitPlane(),
      drift: randBetween(drifts.min, drifts.max),
      driftDirection: Math.random() < 0.5 ? -1 : 1,
      radius: getOrbitGlobeRadiusPx(readOrbRadiusPx(), globeVisualState),
      orbitR: getOrbitDistancePx(readOrbRadiusPx(), globeVisualState),
      stroke: color.stroke,
      fill: color.fill,
      glow: color.glow,
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
    const direction = Number(p.direction) || 1;
    const th = (Number(p.phase) || 0) + ((Number(p.speed) || 1) * tS * direction);
    const plane = p.orbitPlane || { angle: 0, squash: 0.28 };
    const driftDirection = Number(p.driftDirection) || 1;
    const axisAngle = (Number(plane.angle) || 0) + (tS * (Number(p.drift) || 0) * driftDirection);
    const localX = Math.cos(th) * r;
    const localY = Math.sin(th) * r * (Number(plane.squash) || 0.28);
    const cos = Math.cos(axisAngle);
    const sin = Math.sin(axisAngle);
    const x = (localX * cos) - (localY * sin);
    const y = (localX * sin) + (localY * cos);
    const scale = 1;
    const opacity = 0.92;
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
      p.radius = getOrbitGlobeRadiusPx(currentOrbRadius, globeVisualState);
      p.orbitR = getOrbitDistancePx(currentOrbRadius, globeVisualState);
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
      p.el.style.transform = `scale(${proj.scale.toFixed(3)})`;
      p.el.style.zIndex = "30";
    }
  }

  function reconcileGlobesFromInventory(globes = []) {
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
    const loaded = active.filter((g) => String(g.state || "") === "loaded");
    const bound = active.filter((g) => String(g.state || "") === "bound");
    const loadedIds = new Set(loaded.map((g) => g.globeId));
    const boundIds = new Set(bound.map((g) => g.globeId));
    for (let i = orbiting.particles.length - 1; i >= 0; i -= 1) {
      const p = orbiting.particles[i];
      if (p.globeId && loadedIds.has(p.globeId)) continue;
      try { if (p.el) p.el.remove(); } catch (_) {}
      orbiting.particles.splice(i, 1);
    }
    for (let i = inner.particles.length - 1; i >= 0; i -= 1) {
      const p = inner.particles[i];
      if (p.globeId && boundIds.has(p.globeId)) continue;
      try { if (p.el) p.el.remove(); } catch (_) {}
      inner.particles.splice(i, 1);
    }
    for (const g of loaded) {
      upsertOrbitingGlobe(g);
    }
    for (const g of bound) {
      upsertInnerGlobe(g);
    }
  }

  function tickInnerGlobes(dt) {
    if (!inner.particles.length) return;
    const maxDistBase = readOrbRadiusPx();
    for (const p of inner.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const dist = Math.hypot(p.x, p.y);
      const maxDist = Math.max(0, maxDistBase - p.r - innerPaddingPx());
      if (dist > maxDist && maxDist > 0) {
        const nx = p.x / (dist || 1);
        const ny = p.y / (dist || 1);
        p.x = nx * maxDist;
        p.y = ny * maxDist;
        const vn = (p.vx * nx) + (p.vy * ny);
        p.vx = p.vx - (2 * vn * nx);
        p.vy = p.vy - (2 * vn * ny);

        const driftMin = Number.isFinite(p.driftMin) ? p.driftMin : ORB_GLOBE_VISUAL_DEFAULTS.innerDriftMin;
        const driftMax = Number.isFinite(p.driftMax) ? p.driftMax : driftMin;
        const drift = randBetween(Math.min(driftMin, driftMax), Math.max(driftMin, driftMax));
        const drifted = rotateVector(p.vx, p.vy, drift * (Math.random() < 0.5 ? -1 : 1));
        p.vx = drifted.x;
        p.vy = drifted.y;
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
      reconcileGlobesFromInventory(payload.globes || []);
    }));
    unsub.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      const slot = String(payload.slot || "").toUpperCase();
      const globeId = String(payload.globeId || payload.boundGlobeId || "");
      if (!slot && !globeId) return;
      const wordId = readWordIdFromPayload(payload);
      upsertInnerGlobe({
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
      consumeInnerGlobe({ slot, globeId });
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
