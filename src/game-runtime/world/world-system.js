import {
  EVT_PICKUP_COLLECTED,
  EVT_RESOURCES_GLOBE_SPENT,
} from "../../contracts/events.js";
import { WORLD_GLOBE_VISUAL_DEFAULTS } from "./world-globe-state.js?v=20260418a";

export function createWorldSystem({
  eventBus,
  stageEl,
  getStageEl = null,
  getStageRect,
  worldToScreenY,
  getOrbWorldPosition,
  orbRadiusPx,
  getOrbRadiusPx = null,
  spawn,
  spawns,
  getGlobeEl,
  setGlobeEl,
  worldGlobeVisualState = WORLD_GLOBE_VISUAL_DEFAULTS,
}) {
  if (!eventBus || typeof eventBus.emit !== "function") {
    throw new Error("createWorldSystem requires eventBus.emit");
  }
  if (!stageEl) throw new Error("createWorldSystem requires stageEl");
  if (typeof getStageRect !== "function") throw new Error("createWorldSystem requires getStageRect");
  if (typeof worldToScreenY !== "function") throw new Error("createWorldSystem requires worldToScreenY");
  if (typeof getOrbWorldPosition !== "function") throw new Error("createWorldSystem requires getOrbWorldPosition");
  if (!(Number(orbRadiusPx) > 0) && typeof getOrbRadiusPx !== "function") {
    throw new Error("createWorldSystem requires orbRadiusPx or getOrbRadiusPx");
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (x) => clamp(Number(x) || 0, 0, 1);
  const clockNowMs = () => performance.now();
  const readStageEl = () => {
    const dynamicStageEl = typeof getStageEl === "function" ? getStageEl() : null;
    return dynamicStageEl || stageEl || null;
  };

  const PICKUP_ATTRACT_START_EDGE_GAP_PX = 120;
  const PICKUP_CONSUME_EDGE_GAP_PX = 15;
  const PICKUP_RESPAWN_FADE_MS = 2000;

  function setStyleIfChanged(cache, el, key, value) {
    if (!el || !cache) return;
    const nextValue = String(value);
    if (cache[key] === nextValue) return;
    cache[key] = nextValue;
    el.style[key] = nextValue;
  }

  function readOrbRadiusPx() {
    const liveRadius = (typeof getOrbRadiusPx === "function") ? Number(getOrbRadiusPx()) : NaN;
    if (Number.isFinite(liveRadius) && liveRadius > 0) return liveRadius;
    return Math.max(1, Number(orbRadiusPx) || 1);
  }

  function getPickupRadiusPx(pickup) {
    const authoredDiameter = Math.max(
      1,
      Number(worldGlobeVisualState && worldGlobeVisualState.idle && worldGlobeVisualState.idle.diameterPx) ||
        ((Number(pickup && pickup.r) || 25) * 2)
    );
    return authoredDiameter * 0.5;
  }

  function buildPickupFromSpawn(s, index) {
    const xNorm = Number(s && s.xNorm) || 0.5;
    const yW = Number(s && s.yW) || 0;
    const r = Number(s && s.r) || 25;
    const emitterId = String((s && s.id) || `globe_emitter_${String(index + 1).padStart(2, "0")}`);
    return {
      id: `${emitterId}.globe.1`,
      globeId: `${emitterId}.globe.1`,
      emitterId,
      kind: String((s && s.kind) || "energy_globe_emitter"),
      xNorm,
      yW,
      anchorXNorm: xNorm,
      anchorYW: yW,
      r,
      active: true,
      spawnedAtMs: 0,
      attracting: false,
      lastStepTs: 0,
      driftAmpPx: Math.max(0, Number(worldGlobeVisualState && worldGlobeVisualState.idle && worldGlobeVisualState.idle.driftPx) || 0),
      bobAmpY: Math.max(0, Number(worldGlobeVisualState && worldGlobeVisualState.idle && worldGlobeVisualState.idle.bobPx) || 0),
      bobHz: Math.max(0, Number(worldGlobeVisualState && worldGlobeVisualState.idle && worldGlobeVisualState.idle.bobHz) || 0),
      driftFreqXHz: 0.23,
      driftPhaseX: Math.random() * Math.PI * 2,
      driftPhaseY: Math.random() * Math.PI * 2,
      fadeInMs: 0,
      fadeInStartMs: 0,
      capacity: Math.max(1, Math.floor(Number(s && s.capacity) || 1)),
      regenTrigger: String((s && s.regenTrigger) || "globe_spent"),
      el: null,
      renderCache: null,
    };
  }

  const spawnList = (Array.isArray(spawns) && spawns.length) ? spawns : [spawn];
  const state = {
    pickups: spawnList.map((s, i) => buildPickupFromSpawn(s, i)),
  };

  function replacePickupsFromSpawns(nextSpawns = [], nowMs = clockNowMs()) {
    const normalizedSpawns = Array.isArray(nextSpawns) && nextSpawns.length ? nextSpawns : [spawn];
    const nextPickups = normalizedSpawns.map((s, i) => {
      const existing = state.pickups[i] || null;
      const nextPickup = buildPickupFromSpawn(s, i);
      if (existing && existing.el) {
        nextPickup.el = existing.el;
        nextPickup.renderCache = existing.renderCache || Object.create(null);
      }
      nextPickup.spawnedAtMs = nowMs;
      return nextPickup;
    });

    for (let i = nextPickups.length; i < state.pickups.length; i += 1) {
      const stale = state.pickups[i];
      if (stale && stale.el && stale.el.parentElement) {
        stale.el.parentElement.removeChild(stale.el);
      }
    }

    state.pickups = nextPickups;
    if (typeof setGlobeEl === "function") {
      setGlobeEl(nextPickups[0] && nextPickups[0].el ? nextPickups[0].el : null);
    }
    render(nowMs);
  }

  function ensureGlobeEl(pickup, index) {
    const activeStageEl = readStageEl();
    if (!activeStageEl) return null;
    if (pickup && pickup.el && pickup.el.isConnected) {
      if (pickup.el.parentElement !== activeStageEl) {
        activeStageEl.appendChild(pickup.el);
      }
      return pickup.el;
    }

    if (index === 0 && typeof getGlobeEl === "function") {
      const existing = getGlobeEl();
      if (existing) {
        if (existing.parentElement !== activeStageEl) {
          activeStageEl.appendChild(existing);
        }
        pickup.el = existing;
        pickup.renderCache = pickup.renderCache || Object.create(null);
        return existing;
      }
    }

    const el = document.createElement("div");
    el.id = (index === 0) ? "testGlobe" : `testGlobe${index + 1}`;
    el.className = "pickupGlobe";
    el.setAttribute("aria-label", "Energy globe");
    activeStageEl.appendChild(el);

    if (index === 0 && typeof setGlobeEl === "function") setGlobeEl(el);
    pickup.el = el;
    pickup.renderCache = Object.create(null);
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
    const rect = getStageRect();
    const stageW = Math.max(1, Number(rect && rect.width) || 1);
    const xNorm = (Number(p.anchorXNorm) || 0.5) +
      (
        Math.sin((t * (Number(p.driftFreqXHz) || 0) * Math.PI * 2) + (Number(p.driftPhaseX) || 0)) *
        ((Number(p.driftAmpPx) || 0) / stageW)
      );
    const yW = (Number(p.anchorYW) || 0) +
      (Math.sin((t * (Number(p.bobHz) || 0) * Math.PI * 2) + (Number(p.driftPhaseY) || 0)) * (Number(p.bobAmpY) || 0));
    return { xNorm, yW };
  }

  function renderPickup(p, idx, nowMs) {
    const globeEl = ensureGlobeEl(p, idx);
    if (!globeEl || !p) return;
    const renderCache = p.renderCache || (p.renderCache = Object.create(null));
    if (!p.active) {
      setStyleIfChanged(renderCache, globeEl, "display", "none");
      return;
    }

    const pos = pickupWorldPos(p, nowMs);
    const rect = getStageRect();
    const y = worldToScreenY(pos.yW);
    const pickupRadiusPx = getPickupRadiusPx(p);
    const top = y - pickupRadiusPx;
    const d = pickupRadiusPx * 2;
    setStyleIfChanged(renderCache, globeEl, "display", "block");
    setStyleIfChanged(renderCache, globeEl, "width", `${d.toFixed(2)}px`);
    setStyleIfChanged(renderCache, globeEl, "height", `${d.toFixed(2)}px`);
    const left = ((Number(pos.xNorm) || 0.5) * (rect.width || 0)) - pickupRadiusPx;
    setStyleIfChanged(renderCache, globeEl, "left", `${left.toFixed(2)}px`);
    setStyleIfChanged(renderCache, globeEl, "top", `${top.toFixed(2)}px`);
    setStyleIfChanged(renderCache, globeEl, "transform", "none");
    setStyleIfChanged(renderCache, globeEl, "zIndex", "40");
    const tNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : clockNowMs();
    if ((Number(p.fadeInMs) || 0) > 0) {
      const age = Math.max(0, tNow - (Number(p.fadeInStartMs) || 0));
      const alpha = clamp01(age / Math.max(1, Number(p.fadeInMs) || 1));
      setStyleIfChanged(renderCache, globeEl, "opacity", alpha.toFixed(3));
    } else {
      setStyleIfChanged(renderCache, globeEl, "opacity", "1");
    }
  }

  function render(nowMs) {
    for (let i = 0; i < state.pickups.length; i++) {
      renderPickup(state.pickups[i], i, nowMs);
    }
  }

  function collectPickup(p, nowMs) {
    p.active = false;
    p.fadeInMs = 0;
    p.fadeInStartMs = 0;
    render(nowMs);
    /** @type {import("../contracts/events.js").PickupCollectedPayload} */
    const payload = {
      id: p.id,
      globeId: String(p.globeId || p.id || ""),
      emitterId: String(p.emitterId || ""),
      type: "energy_globe",
      atMs: Number(nowMs) || performance.now(),
      xNorm: Number(p.xNorm) || Number(p.anchorXNorm) || 0.5,
      yW: Number(p.yW) || Number(p.anchorYW) || 0,
    };
    eventBus.emit(EVT_PICKUP_COLLECTED, payload);
  }

  function tick(nowMs, _dt) {
    const stageW = getStageRect().width || 0;
    const orb = getOrbWorldPosition();
    const orbXNorm = Number(orb && orb.xNorm) || 0.5;
    const orbYW = Number(orb && orb.yW) || 0;
    const currentOrbRadiusPx = readOrbRadiusPx();

    for (let i = 0; i < state.pickups.length; i++) {
      const p = state.pickups[i];
      if (!p || !p.active) continue;

      const pos = pickupWorldPos(p, nowMs);
      const pickupRadiusPx = getPickupRadiusPx(p);
      const dxPx = ((orbXNorm - pos.xNorm) * stageW);
      const dyPx = (orbYW - pos.yW);
      let centerDist = Math.hypot(dxPx, dyPx);
      let edgeGapPx = centerDist - (currentOrbRadiusPx + pickupRadiusPx);

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
        edgeGapPx = centerDist - (currentOrbRadiusPx + pickupRadiusPx);
      } else {
        p.lastStepTs = Number(nowMs) || performance.now();
      }

      if (edgeGapPx <= PICKUP_CONSUME_EDGE_GAP_PX) {
        collectPickup(p, nowMs);
      }
    }

    render(nowMs);
  }

  function reset(nowMs) {
    const tNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : clockNowMs();
    for (let i = 0; i < state.pickups.length; i++) {
      const p = state.pickups[i];
      p.xNorm = p.anchorXNorm;
      p.yW = p.anchorYW;
      p.active = true;
      p.spawnedAtMs = tNow;
      p.attracting = false;
      p.lastStepTs = 0;
      p.fadeInMs = 0;
      p.fadeInStartMs = 0;
    }
    render(tNow);
  }

  const unsub = [];
  if (eventBus && typeof eventBus.on === "function") {
    unsub.push(eventBus.on(EVT_RESOURCES_GLOBE_SPENT, (payload = {}) => {
      const emitterId = String(payload.emitterId || "");
      if (!emitterId) return;
      const p = state.pickups.find((pickup) => String(pickup && pickup.emitterId || "") === emitterId);
      if (!p || p.active) return;
      if (String(p.regenTrigger || "") !== "globe_spent") return;
      p.xNorm = p.anchorXNorm;
      p.yW = p.anchorYW;
      p.active = true;
      p.spawnedAtMs = clockNowMs();
      p.attracting = false;
      p.lastStepTs = 0;
      p.fadeInMs = PICKUP_RESPAWN_FADE_MS;
      p.fadeInStartMs = p.spawnedAtMs;
      render(p.spawnedAtMs);
    }));
  }

  function getState() {
    const pickups = state.pickups.map((p) => ({ ...p, el: undefined }));
    return {
      pickup: pickups[0] ? { ...pickups[0] } : null,
      pickups,
    };
  }

  return {
    tick,
    render,
    reset,
    setSpawns(spawnItems = [], nowMs) {
      replacePickupsFromSpawns(spawnItems, Number.isFinite(Number(nowMs)) ? Number(nowMs) : clockNowMs());
    },
    getState,
    stop() {
      while (unsub.length) {
        const fn = unsub.pop();
        try { fn(); } catch (_) {}
      }
    },
  };
}
