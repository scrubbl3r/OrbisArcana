import {
  EVT_PICKUP_COLLECTED,
  EVT_VOICE_SPELL_CAST,
} from "../../contracts/events.js";

export function createWorldSystem({
  eventBus,
  stageEl,
  getStageRect,
  worldToScreenY,
  getOrbWorldPosition,
  orbRadiusPx,
  spawn,
  spawns,
  getGlobeEl,
  setGlobeEl,
}) {
  if (!eventBus || typeof eventBus.emit !== "function") {
    throw new Error("createWorldSystem requires eventBus.emit");
  }
  if (!stageEl) throw new Error("createWorldSystem requires stageEl");
  if (typeof getStageRect !== "function") throw new Error("createWorldSystem requires getStageRect");
  if (typeof worldToScreenY !== "function") throw new Error("createWorldSystem requires worldToScreenY");
  if (typeof getOrbWorldPosition !== "function") throw new Error("createWorldSystem requires getOrbWorldPosition");
  if (typeof orbRadiusPx !== "number" || !(orbRadiusPx > 0)) throw new Error("createWorldSystem requires orbRadiusPx");

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (x) => clamp(Number(x) || 0, 0, 1);
  const clockNowMs = () => performance.now();

  const PICKUP_ATTRACT_START_EDGE_GAP_PX = 120;
  const PICKUP_CONSUME_EDGE_GAP_PX = 15;
  const PICKUP_RESPAWN_FADE_MS = 2000;

  function buildPickupFromSpawn(s, index) {
    const xNorm = Number(s && s.xNorm) || 0.5;
    const yW = Number(s && s.yW) || 0;
    const r = Number(s && s.r) || 25;
    return {
      id: String((s && s.id) || `globe_mid_${String(index + 1).padStart(2, "0")}`),
      xNorm,
      yW,
      anchorXNorm: xNorm,
      anchorYW: yW,
      r,
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
      fadeInMs: 0,
      fadeInStartMs: 0,
      el: null,
    };
  }

  const spawnList = (Array.isArray(spawns) && spawns.length) ? spawns : [spawn];
  const state = {
    pickups: spawnList.map((s, i) => buildPickupFromSpawn(s, i)),
  };

  function ensureGlobeEl(pickup, index) {
    if (pickup && pickup.el && pickup.el.isConnected) return pickup.el;

    if (index === 0 && typeof getGlobeEl === "function") {
      const existing = getGlobeEl();
      if (existing) {
        pickup.el = existing;
        return existing;
      }
    }

    const el = document.createElement("div");
    el.id = (index === 0) ? "testGlobe" : `testGlobe${index + 1}`;
    el.className = "pickupGlobe";
    el.setAttribute("aria-label", "Energy globe");
    stageEl.appendChild(el);

    if (index === 0 && typeof setGlobeEl === "function") setGlobeEl(el);
    pickup.el = el;
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

  function renderPickup(p, idx, nowMs) {
    const globeEl = ensureGlobeEl(p, idx);
    if (!globeEl || !p) return;
    if (!p.active) {
      globeEl.style.display = "none";
      return;
    }

    const pos = pickupWorldPos(p, nowMs);
    const rect = getStageRect();
    const y = worldToScreenY(pos.yW);
    const top = y - p.r;
    const d = p.r * 2;
    globeEl.style.display = "block";
    globeEl.style.width = `${d.toFixed(2)}px`;
    globeEl.style.height = `${d.toFixed(2)}px`;
    const left = ((Number(pos.xNorm) || 0.5) * (rect.width || 0)) - p.r;
    globeEl.style.left = `${left.toFixed(2)}px`;
    globeEl.style.top = `${top.toFixed(2)}px`;
    globeEl.style.transform = "none";
    globeEl.style.zIndex = "40";
    const tNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : clockNowMs();
    if ((Number(p.fadeInMs) || 0) > 0) {
      const age = Math.max(0, tNow - (Number(p.fadeInStartMs) || 0));
      const alpha = clamp01(age / Math.max(1, Number(p.fadeInMs) || 1));
      globeEl.style.opacity = alpha.toFixed(3);
    } else {
      globeEl.style.opacity = "1";
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
      type: "energy_globe",
      atMs: Number(nowMs) || performance.now(),
    };
    eventBus.emit(EVT_PICKUP_COLLECTED, payload);
  }

  function tick(nowMs, _dt) {
    const stageW = getStageRect().width || 0;
    const orb = getOrbWorldPosition();
    const orbXNorm = Number(orb && orb.xNorm) || 0.5;
    const orbYW = Number(orb && orb.yW) || 0;

    for (let i = 0; i < state.pickups.length; i++) {
      const p = state.pickups[i];
      if (!p || !p.active) continue;

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

  function respawnInactiveWithFade(nowMs, fadeMs = PICKUP_RESPAWN_FADE_MS) {
    const tNow = Number.isFinite(Number(nowMs)) ? Number(nowMs) : clockNowMs();
    let changed = false;
    for (let i = 0; i < state.pickups.length; i++) {
      const p = state.pickups[i];
      if (p.active) continue;
      p.xNorm = p.anchorXNorm;
      p.yW = p.anchorYW;
      p.active = true;
      p.spawnedAtMs = tNow;
      p.attracting = false;
      p.lastStepTs = 0;
      p.fadeInMs = Math.max(0, Number(fadeMs) || 0);
      p.fadeInStartMs = tNow;
      changed = true;
    }
    if (changed) render(tNow);
  }

  if (eventBus && typeof eventBus.on === "function") {
    eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      if (String(payload.trigger || "") !== "shake_detonation") return;
      respawnInactiveWithFade(clockNowMs(), PICKUP_RESPAWN_FADE_MS);
    });
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
    getState,
  };
}
