function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function buildFlickerMask(elapsedMs, onMs, offMs) {
  const cycleMs = Math.max(1, Number(onMs) + Number(offMs));
  const phaseMs = ((Number(elapsedMs) % cycleMs) + cycleMs) % cycleMs;
  return phaseMs < Number(onMs) ? 1 : 0;
}

export function createTeleportRuntime({
  orbEl = null,
  orbInteriorEl = null,
  orbCracksEl = null,
  getConfig = () => ({}),
} = {}) {
  if (!orbEl) return null;

  let raf = 0;
  let startMs = 0;
  let lastConfig = null;
  let teleported = false;

  function normalizeConfig(raw = {}) {
    return {
      flickerOnMs: Math.round(clampNumber(raw.flickerOnMs ?? raw.orbTeleportFlickerOnMs, 10, 1000, 60)),
      flickerOffMs: Math.round(clampNumber(raw.flickerOffMs ?? raw.orbTeleportFlickerOffMs, 10, 1000, 60)),
      fadeOutMs: Math.round(clampNumber(raw.fadeOutMs ?? raw.orbTeleportFadeOutMs, 40, 4000, 280)),
      fadeInMs: Math.round(clampNumber(raw.fadeInMs ?? raw.orbTeleportFadeInMs, 40, 4000, 280)),
      onTeleport: typeof raw.onTeleport === "function" ? raw.onTeleport : null,
    };
  }

  function setOpacity(alpha) {
    const value = String(Math.max(0, Math.min(1, Number(alpha) || 0)));
    orbEl.style.opacity = value;
    if (orbInteriorEl) orbInteriorEl.style.opacity = value;
    if (orbCracksEl) orbCracksEl.style.opacity = value;
  }

  function reset() {
    orbEl.style.opacity = "";
    orbEl.style.transform = "";
    if (orbInteriorEl) orbInteriorEl.style.opacity = "";
    if (orbCracksEl) orbCracksEl.style.opacity = "";
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    startMs = 0;
    teleported = false;
    reset();
  }

  function render(nowMs) {
    if (!lastConfig) return;
    const elapsedMs = Math.max(0, nowMs - startMs);
    const fadeOutEnd = lastConfig.fadeOutMs;
    const totalEnd = fadeOutEnd + lastConfig.fadeInMs;

    if (elapsedMs <= fadeOutEnd) {
      const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, lastConfig.fadeOutMs)));
      const flicker = buildFlickerMask(elapsedMs, lastConfig.flickerOnMs, lastConfig.flickerOffMs);
      setOpacity((1 - progress) * flicker);
      raf = requestAnimationFrame(render);
      return;
    }

    if (!teleported) {
      teleported = true;
      if (typeof lastConfig.onTeleport === "function") {
        try {
          lastConfig.onTeleport();
        } catch (_) {}
      }
    }

    const fadeInElapsedMs = elapsedMs - fadeOutEnd;
    const progress = Math.max(0, Math.min(1, fadeInElapsedMs / Math.max(1, lastConfig.fadeInMs)));
    const flicker = buildFlickerMask(fadeInElapsedMs, lastConfig.flickerOnMs, lastConfig.flickerOffMs);
    setOpacity(progress * flicker);

    if (elapsedMs >= totalEnd) {
      setOpacity(1);
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(render);
  }

  function play(payload = {}) {
    clear();
    lastConfig = normalizeConfig({
      ...(typeof getConfig === "function" ? (getConfig() || {}) : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    startMs = performance.now();
    raf = requestAnimationFrame(render);
    return { handled: true };
  }

  function destroy() {
    clear();
  }

  return {
    play,
    clear,
    destroy,
  };
}
