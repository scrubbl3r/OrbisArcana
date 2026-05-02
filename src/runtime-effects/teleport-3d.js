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

export function normalizeTeleport3dRuntimeConfig(raw = {}) {
  return Object.freeze({
    flickerOnMs: Math.round(clampNumber(raw.flickerOnMs ?? raw.orbTeleportFlickerOnMs, 10, 1000, 60)),
    flickerOffMs: Math.round(clampNumber(raw.flickerOffMs ?? raw.orbTeleportFlickerOffMs, 10, 1000, 60)),
    fadeOutMs: Math.round(clampNumber(raw.fadeOutMs ?? raw.orbTeleportFadeOutMs, 40, 4000, 280)),
    fadeInMs: Math.round(clampNumber(raw.fadeInMs ?? raw.orbTeleportFadeInMs, 40, 4000, 280)),
    onTeleport: typeof raw.onTeleport === "function" ? raw.onTeleport : null,
    onComplete: typeof raw.onComplete === "function" ? raw.onComplete : null,
  });
}

export function createTeleport3dRuntime({
  setOpacity = () => {},
  onNeedsFrame = () => {},
} = {}) {
  let raf = 0;
  let playToken = 0;

  function applyOpacity(alpha = 1) {
    setOpacity(alpha);
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function clear() {
    playToken += 1;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    applyOpacity(1);
  }

  function play(payload = {}) {
    clear();
    const token = playToken;
    const config = normalizeTeleport3dRuntimeConfig({
      ...(payload && payload.config && typeof payload.config === "object" ? payload.config : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const startedAtMs = performance.now();
    let teleported = false;
    let travelDoneAtMs = startedAtMs + config.fadeOutMs;
    let completed = false;

    function tick(nowMs) {
      if (token !== playToken) return;
      const elapsedMs = Math.max(0, Number(nowMs) - startedAtMs);
      if (elapsedMs <= config.fadeOutMs) {
        const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, config.fadeOutMs)));
        const flicker = buildFlickerMask(elapsedMs, config.flickerOnMs, config.flickerOffMs);
        applyOpacity((1 - progress) * flicker);
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!teleported) {
        teleported = true;
        if (config.onTeleport) {
          try {
            const maybePromise = config.onTeleport();
            if (maybePromise && typeof maybePromise.then === "function") {
              travelDoneAtMs = Infinity;
              maybePromise.finally(() => {
                if (token !== playToken) return;
                travelDoneAtMs = performance.now();
              });
            }
          } catch (_) {}
        }
      }

      if (nowMs < travelDoneAtMs) {
        applyOpacity(0);
      } else {
        const fadeInElapsedMs = Math.max(0, Number(nowMs) - travelDoneAtMs);
        const progress = Math.max(0, Math.min(1, fadeInElapsedMs / Math.max(1, config.fadeInMs)));
        const flicker = buildFlickerMask(fadeInElapsedMs, config.flickerOnMs, config.flickerOffMs);
        applyOpacity(progress * flicker);
      }

      if (nowMs >= travelDoneAtMs + config.fadeInMs) {
        raf = 0;
        applyOpacity(1);
        if (!completed && config.onComplete) {
          completed = true;
          try {
            config.onComplete();
          } catch (_) {}
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return { handled: true };
  }

  return Object.freeze({
    play,
    clear,
    destroy: clear,
    isActive() {
      return !!raf;
    },
  });
}
