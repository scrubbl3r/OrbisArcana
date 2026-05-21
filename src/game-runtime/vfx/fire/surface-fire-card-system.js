import { closestPointOnSegment } from "../../collision/circle-boundary-collision.js";
import { createFireCardSystem } from "./fire-card-system.js?v=20260520v";

const WORLD_UP = Object.freeze({ x: 0, y: 1 });
const SURFACE_FIRE_TTL_MS = 3000;
const SURFACE_FIRE_EMIT_INTERVAL_MS = 90;
const EGG_LOCAL_HEIGHT = 2.0625;

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

function normalize2(x = 0, y = 0, fallback = WORLD_UP) {
  const length = Math.hypot(x, y);
  if (length <= 0.000001) return { x: fallback.x, y: fallback.y };
  return { x: x / length, y: y / length };
}

function lerp(a = 0, b = 0, t = 0) {
  return a + (b - a) * t;
}

function resolveSurfaceWidthT(steepness = 0) {
  return clamp01(steepness);
}

function resolveSurfaceCardProfile(steepness = 0, bo = 150) {
  const t = clamp01(steepness);
  const widthT = resolveSurfaceWidthT(steepness);
  return {
    widthPx: bo * lerp(0.14, 0.24, widthT),
    heightPx: (bo * 0.75) / EGG_LOCAL_HEIGHT,
    spacingPx: bo * lerp(0.09, 0.12, widthT),
    count: Math.round(lerp(4, 3, t)),
  };
}

export function createSurfaceFireCardSystem({
  root = null,
  maxCards = 640,
  getBo = () => 150,
  toRuntimePosition = null,
  onNeedsFrame = null,
} = {}) {
  const fireCards = createFireCardSystem({
    root,
    maxCards,
    billboardToCamera: true,
    materialOverrides: {
      wakeNoiseScale: 1.45,
      wakeNoiseDensityBottom: 0.7,
      wakeNoiseDensityTop: 0.08,
      wakeNoiseContrast: 0.22,
      wakeNoiseOctaves: 5,
      wakeNoiseGain: 0.32,
      wakeSimplexScale: 0.9,
      wakeSimplexDensityBottom: 0.1,
      wakeSimplexDensityTop: 0.42,
      wakeSimplexContrast: 0.34,
      wakeSimplexOctaves: 4,
      wakeSimplexGain: 0.36,
      wakeNoiseMix: 0.48,
      wakeCarveStrength: 0.56,
      contactFeatherPx: 5,
      edgeFeatherPx: 3,
    },
  });
  const liveCards = [];
  let segments = Object.freeze([]);
  let lastEmitMs = -Infinity;
  let lastTrace = Object.freeze({
    enabled: true,
    activeCount: 0,
    contacts: 0,
    nearestBo: null,
  });

  function load(boundarySegments = []) {
    segments = Object.freeze(Array.isArray(boundarySegments) ? boundarySegments : []);
    liveCards.length = 0;
    lastEmitMs = -Infinity;
    fireCards.beginFrame(0);
    fireCards.endFrame();
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function clear() {
    segments = Object.freeze([]);
    liveCards.length = 0;
    lastEmitMs = -Infinity;
    fireCards.beginFrame(0);
    fireCards.endFrame();
    lastTrace = Object.freeze({
      enabled: true,
      activeCount: 0,
      contacts: 0,
      nearestBo: null,
    });
  }

  function resolveSurfaceCard({
    contactRuntime = null,
    tangent = null,
    normal = null,
    steepness = 0,
    offsetPx = 0,
    bo = 150,
    z = 0,
    seed = 0,
  } = {}) {
    if (!contactRuntime || !tangent || !normal) return null;
    const profile = resolveSurfaceCardProfile(steepness, bo);
    return {
      x: contactRuntime.x + (tangent.x * offsetPx),
      y: contactRuntime.y + (tangent.y * offsetPx),
      z,
      widthPx: profile.widthPx,
      heightPx: profile.heightPx,
      contactNormal: { x: normal.x, y: normal.y },
      seed,
    };
  }

  function drawSurfaceCard(card = null) {
    if (!card) return;
    fireCards.addTeardrop({
      x: card.x,
      y: card.y,
      z: card.z,
      widthPx: card.widthPx,
      heightPx: card.heightPx,
      contactNormal: card.contactNormal,
      seed: card.seed,
    });
  }

  function update({
    nowSec = 0,
    camera = null,
    orbWorldPosition = null,
    orbRuntimePosition = null,
  } = {}) {
    const bo = Math.max(1, Number(getBo && getBo()) || 150);
    const nowMs = (Number(nowSec) || 0) * 1000;
    for (let i = liveCards.length - 1; i >= 0; i -= 1) {
      if (liveCards[i].expiresAtMs <= nowMs) liveCards.splice(i, 1);
    }
    fireCards.beginFrame(nowSec, { camera });
    if (!orbWorldPosition || !orbRuntimePosition || !segments.length || typeof toRuntimePosition !== "function") {
      for (const card of liveCards) drawSurfaceCard(card);
      fireCards.endFrame();
      lastTrace = Object.freeze({
        enabled: true,
        activeCount: fireCards.activeCount,
        liveCards: liveCards.length,
        ttlMs: SURFACE_FIRE_TTL_MS,
        contacts: 0,
        nearestBo: null,
      });
      return;
    }

    const rangePx = bo * 0.68;
    const candidates = [];
    for (const segment of segments) {
      if (!segment) continue;
      if (orbWorldPosition.xW < segment.minXW - rangePx || orbWorldPosition.xW > segment.maxXW + rangePx) continue;
      if (orbWorldPosition.yW < segment.minYW - rangePx || orbWorldPosition.yW > segment.maxYW + rangePx) continue;
      const point = closestPointOnSegment({
        pointXW: orbWorldPosition.xW,
        pointYW: orbWorldPosition.yW,
        segment,
      });
      if (!point) continue;
      const dxW = orbWorldPosition.xW - point.xW;
      const dyW = orbWorldPosition.yW - point.yW;
      const distancePx = Math.hypot(dxW, dyW);
      if (distancePx > rangePx) continue;
      candidates.push({ segment, point, distancePx });
    }
    candidates.sort((a, b) => a.distancePx - b.distancePx);
    const contacts = [];
    const shouldEmit = nowMs - lastEmitMs >= SURFACE_FIRE_EMIT_INTERVAL_MS;

    for (const contact of candidates) {
      if (contacts.length >= 3) break;
      const { segment, point } = contact;
      const contactRuntime = toRuntimePosition({ x: point.xW, y: point.yW, z: orbRuntimePosition.z || 0 });
      const aRuntime = toRuntimePosition({ x: segment.a.xW, y: segment.a.yW, z: orbRuntimePosition.z || 0 });
      const bRuntime = toRuntimePosition({ x: segment.b.xW, y: segment.b.yW, z: orbRuntimePosition.z || 0 });
      const tangent = normalize2(bRuntime.x - aRuntime.x, bRuntime.y - aRuntime.y, { x: 1, y: 0 });
      const rawNormal = normalize2(orbRuntimePosition.x - contactRuntime.x, orbRuntimePosition.y - contactRuntime.y, { x: -tangent.y, y: tangent.x });
      if (rawNormal.y < -0.55) continue;
      const index = contacts.length;
      contacts.push(contact);
      if (!shouldEmit) continue;
      const normal = rawNormal;
      const steepness = Math.abs(tangent.y);
      const profile = resolveSurfaceCardProfile(steepness, bo);
      const half = (profile.count - 1) * 0.5;
      for (let card = 0; card < profile.count; card += 1) {
        const surfaceCard = resolveSurfaceCard({
          contactRuntime,
          tangent,
          normal,
          steepness,
          offsetPx: (card - half) * profile.spacingPx,
          bo,
          z: orbRuntimePosition.z || 0,
          seed: (index * 17.17) + (card * 3.31) + (point.xW * 0.011) + (point.yW * 0.017),
        });
        if (surfaceCard) {
          surfaceCard.createdAtMs = nowMs;
          surfaceCard.expiresAtMs = nowMs + SURFACE_FIRE_TTL_MS;
          liveCards.push(surfaceCard);
        }
      }
    }
    if (shouldEmit && contacts.length > 0) lastEmitMs = nowMs;
    while (liveCards.length > maxCards) liveCards.shift();
    for (const card of liveCards) drawSurfaceCard(card);

    fireCards.endFrame();
    lastTrace = Object.freeze({
      enabled: true,
      activeCount: fireCards.activeCount,
      liveCards: liveCards.length,
      ttlMs: SURFACE_FIRE_TTL_MS,
      contacts: contacts.length,
      nearestBo: contacts.length ? Math.round((contacts[0].distancePx / bo) * 1000) / 1000 : null,
      sample: fireCards.getTrace(camera).sample,
    });
  }

  return Object.freeze({
    load,
    clear,
    update,
    dispose: () => fireCards.dispose(),
    hasActiveVisuals: () => fireCards.activeCount > 0,
    getTrace: () => lastTrace,
  });
}
