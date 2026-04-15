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
  getOrbRuntime = () => null,
  patchOrbRuntime = () => null,
  getConfig = () => ({}),
  requestCameraTravel = null,
  cancelCameraTravel = null,
} = {}) {
  if (!orbEl) return null;

  let raf = 0;
  let startMs = 0;
  let lastConfig = null;
  let teleported = false;
  let completed = false;
  let fadeInStartMs = 0;
  let cameraTravelDone = false;
  let teleportSourceYW = 0;
  let playToken = 0;

  function normalizeConfig(raw = {}) {
    return {
      flickerOnMs: Math.round(clampNumber(raw.flickerOnMs ?? raw.orbTeleportFlickerOnMs, 10, 1000, 60)),
      flickerOffMs: Math.round(clampNumber(raw.flickerOffMs ?? raw.orbTeleportFlickerOffMs, 10, 1000, 60)),
      fadeOutMs: Math.round(clampNumber(raw.fadeOutMs ?? raw.orbTeleportFadeOutMs, 40, 4000, 280)),
      cameraTravelMs: Math.round(clampNumber(raw.cameraTravelMs ?? raw.orbTeleportCameraTravelMs, 0, 8000, 1500)),
      fadeInMs: Math.round(clampNumber(raw.fadeInMs ?? raw.orbTeleportFadeInMs, 40, 4000, 280)),
      onTeleport: typeof raw.onTeleport === "function" ? raw.onTeleport : null,
      onComplete: typeof raw.onComplete === "function" ? raw.onComplete : null,
    };
  }

  function engageTeleportHold() {
    const state = typeof getOrbRuntime === "function" ? getOrbRuntime() : null;
    const anchorY = Number.isFinite(Number(state && state.yW)) ? Number(state.yW) : 0;
    patchOrbRuntime({
      teleportHoldActive: true,
      teleportHoldAnchorY: anchorY,
      v: 0,
      onGround: false,
      descendMs: 0,
      shieldDescentBlocked: false,
    });
  }

  function refreshTeleportHoldAnchor() {
    const state = typeof getOrbRuntime === "function" ? getOrbRuntime() : null;
    const anchorY = Number.isFinite(Number(state && state.yW)) ? Number(state.yW) : 0;
    patchOrbRuntime({
      teleportHoldActive: true,
      teleportHoldAnchorY: anchorY,
      v: 0,
      onGround: false,
    });
  }

  function releaseTeleportHold() {
    const state = typeof getOrbRuntime === "function" ? getOrbRuntime() : null;
    const anchorY = Number.isFinite(Number(state && state.yW)) ? Number(state.yW) : 0;
    patchOrbRuntime({
      teleportHoldActive: false,
      teleportHoldAnchorY: anchorY,
      v: 0,
    });
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
    playToken += 1;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    startMs = 0;
    teleported = false;
    completed = false;
    fadeInStartMs = 0;
    cameraTravelDone = false;
    teleportSourceYW = 0;
    if (typeof cancelCameraTravel === "function") {
      try {
        cancelCameraTravel();
      } catch (_) {}
    }
    releaseTeleportHold();
    reset();
  }

  function render(nowMs) {
    if (!lastConfig) return;
    const elapsedMs = Math.max(0, nowMs - startMs);
    const fadeOutEnd = lastConfig.fadeOutMs;

    if (elapsedMs <= fadeOutEnd) {
      const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, lastConfig.fadeOutMs)));
      const flicker = buildFlickerMask(elapsedMs, lastConfig.flickerOnMs, lastConfig.flickerOffMs);
      setOpacity((1 - progress) * flicker);
      raf = requestAnimationFrame(render);
      return;
    }

    if (!teleported) {
      teleported = true;
      let teleportResult = null;
      if (typeof lastConfig.onTeleport === "function") {
        try {
          teleportResult = lastConfig.onTeleport();
        } catch (_) {}
      }
      refreshTeleportHoldAnchor();
      const destinationState = typeof getOrbRuntime === "function" ? getOrbRuntime() : null;
      const destinationYW = Number.isFinite(Number(destinationState && destinationState.yW))
        ? Number(destinationState.yW)
        : teleportSourceYW;
      const durationMs = Math.max(0, Number(lastConfig.cameraTravelMs) || 0);
      if (
        durationMs > 0 &&
        typeof requestCameraTravel === "function" &&
        Math.abs(destinationYW - teleportSourceYW) > 1
      ) {
        const activeToken = playToken;
        try {
          const maybePromise = requestCameraTravel({
            fromYW: teleportSourceYW,
            toYW: destinationYW,
            durationMs,
            easing: "easeInOutExpo",
          });
          if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.finally(() => {
              if (activeToken !== playToken) return;
              cameraTravelDone = true;
              fadeInStartMs = performance.now();
            });
          } else {
            cameraTravelDone = true;
            fadeInStartMs = performance.now();
          }
        } catch (_) {
          cameraTravelDone = true;
          fadeInStartMs = performance.now();
        }
      } else {
        cameraTravelDone = true;
        fadeInStartMs = performance.now();
      }
      void teleportResult;
    }

    if (!cameraTravelDone) {
      setOpacity(0);
      raf = requestAnimationFrame(render);
      return;
    }

    const fadeInElapsedMs = Math.max(0, nowMs - fadeInStartMs);
    const progress = Math.max(0, Math.min(1, fadeInElapsedMs / Math.max(1, lastConfig.fadeInMs)));
    const flicker = buildFlickerMask(fadeInElapsedMs, lastConfig.flickerOnMs, lastConfig.flickerOffMs);
    setOpacity(progress * flicker);

    if (fadeInElapsedMs >= lastConfig.fadeInMs) {
      releaseTeleportHold();
      setOpacity(1);
      if (!completed && typeof lastConfig.onComplete === "function") {
        completed = true;
        try {
          lastConfig.onComplete();
        } catch (_) {}
      }
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(render);
  }

  function play(payload = {}) {
    clear();
    playToken += 1;
    lastConfig = normalizeConfig({
      ...(typeof getConfig === "function" ? (getConfig() || {}) : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const state = typeof getOrbRuntime === "function" ? getOrbRuntime() : null;
    teleportSourceYW = Number.isFinite(Number(state && state.yW)) ? Number(state.yW) : 0;
    engageTeleportHold();
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
