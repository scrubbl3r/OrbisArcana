import { applyOrbBaseVisualCssVars } from "../../../src/game-runtime/orb/orb-base-state.js";

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

export function createOrbTeleportPreview({ els, getOrbBaseVisualState = null } = {}) {
  let raf = 0;

  function readConfig() {
    return {
      flickerOnMs: Math.round(clampNumber(els && els.orbTeleportFlickerOnMs && els.orbTeleportFlickerOnMs.value, 10, 1000, 60)),
      flickerOffMs: Math.round(clampNumber(els && els.orbTeleportFlickerOffMs && els.orbTeleportFlickerOffMs.value, 10, 1000, 60)),
      fadeOutMs: Math.round(clampNumber(els && els.orbTeleportFadeOutMs && els.orbTeleportFadeOutMs.value, 40, 4000, 280)),
      cameraTravelMs: Math.round(clampNumber(els && els.orbTeleportCameraTravelMs && els.orbTeleportCameraTravelMs.value, 0, 8000, 1500)),
      fadeInMs: Math.round(clampNumber(els && els.orbTeleportFadeInMs && els.orbTeleportFadeInMs.value, 40, 4000, 280)),
    };
  }

  function hydrateFields(cfg) {
    if (!els) return;
    if (els.orbTeleportFlickerOnMs) els.orbTeleportFlickerOnMs.value = String(cfg.flickerOnMs);
    if (els.orbTeleportFlickerOffMs) els.orbTeleportFlickerOffMs.value = String(cfg.flickerOffMs);
    if (els.orbTeleportFadeOutMs) els.orbTeleportFadeOutMs.value = String(cfg.fadeOutMs);
    if (els.orbTeleportCameraTravelMs) els.orbTeleportCameraTravelMs.value = String(cfg.cameraTravelMs);
    if (els.orbTeleportFadeInMs) els.orbTeleportFadeInMs.value = String(cfg.fadeInMs);
  }

  function resetOrb() {
    if (!els || !els.orb) return;
    els.orb.hidden = false;
    els.orb.style.transform = "";
    els.orb.style.opacity = "";
    els.orb.style.filter = "";
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    resetOrb();
  }

  function apply() {
    if (!els || !els.previewRoot) return null;
    if (typeof getOrbBaseVisualState === "function") {
      const orbBaseVisualState = getOrbBaseVisualState();
      if (orbBaseVisualState) {
        applyOrbBaseVisualCssVars(orbBaseVisualState, { root: els.previewRoot });
      }
    }
    const cfg = readConfig();
    hydrateFields(cfg);
    clear();
    return cfg;
  }

  function renderFrame(cfg, elapsedMs) {
    if (!els || !els.orb) return false;
    const fadeOutEnd = cfg.fadeOutMs;
    const fadeInStart = fadeOutEnd + cfg.cameraTravelMs;
    const fadeInEnd = fadeInStart + cfg.fadeInMs;
    const totalEnd = fadeInEnd;

    if (elapsedMs <= fadeOutEnd) {
      const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, cfg.fadeOutMs)));
      const flicker = buildFlickerMask(elapsedMs, cfg.flickerOnMs, cfg.flickerOffMs);
      els.orb.hidden = false;
      els.orb.style.transform = "";
      els.orb.style.opacity = String((1 - progress) * flicker);
      return elapsedMs < totalEnd;
    }

    if (elapsedMs < fadeInStart) {
      els.orb.hidden = false;
      els.orb.style.transform = "";
      els.orb.style.opacity = "0";
      return true;
    }

    const fadeInElapsedMs = elapsedMs - fadeInStart;
    const progress = Math.max(0, Math.min(1, fadeInElapsedMs / Math.max(1, cfg.fadeInMs)));
    const flicker = buildFlickerMask(fadeInElapsedMs, cfg.flickerOnMs, cfg.flickerOffMs);
    els.orb.hidden = false;
    els.orb.style.transform = "";
    els.orb.style.opacity = String(progress * flicker);

    if (elapsedMs >= totalEnd) {
      els.orb.style.opacity = "1";
      return false;
    }
    return true;
  }

  function play() {
    const cfg = apply();
    if (!cfg) return;
    const start = performance.now();

    function tick(now) {
      const keepGoing = renderFrame(cfg, now - start);
      if (!keepGoing) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
  }

  function wire() {
    apply();
    if (els && els.previewOrbTeleport) els.previewOrbTeleport.addEventListener("click", play);
    [
      els && els.orbTeleportApplyFlickerOnBtn,
      els && els.orbTeleportApplyFlickerOffBtn,
      els && els.orbTeleportApplyFadeOutBtn,
      els && els.orbTeleportApplyCameraTravelBtn,
      els && els.orbTeleportApplyFadeInBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", apply);
    });
  }

  return {
    apply,
    clear,
    play,
    wire,
  };
}
