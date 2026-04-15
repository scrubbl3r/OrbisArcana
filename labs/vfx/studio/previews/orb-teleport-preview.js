import { applyOrbBaseVisualCssVars } from "../../../../src/game-runtime/orb/orb-base-state.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function ensureLayer(parent, className) {
  let el = parent && parent.querySelector(`.${className}`);
  if (el) return el;
  el = document.createElement("div");
  el.className = className;
  parent.appendChild(el);
  return el;
}

function buildFlickerMask(elapsedMs, onMs, offMs) {
  const cycleMs = Math.max(1, Number(onMs) + Number(offMs));
  const phaseMs = ((Number(elapsedMs) % cycleMs) + cycleMs) % cycleMs;
  return phaseMs < Number(onMs) ? 1 : 0;
}

export function createOrbTeleportPreview({ els, getOrbBaseVisualState = null } = {}) {
  let raf = 0;
  let stageLine = null;
  let destinationMarker = null;
  let sweepMarker = null;

  function ensureOverlay() {
    if (!els || !els.previewRoot) return;
    stageLine = ensureLayer(els.previewRoot, "orbTeleportGuide");
    destinationMarker = ensureLayer(els.previewRoot, "orbTeleportDestination");
    sweepMarker = ensureLayer(els.previewRoot, "orbTeleportSweep");

    const common = [stageLine, destinationMarker, sweepMarker];
    for (const el of common) {
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";
      el.style.pointerEvents = "none";
      el.style.transform = "translate(-50%,-50%)";
      el.style.display = "none";
    }

    stageLine.style.width = "180px";
    stageLine.style.height = "2px";
    stageLine.style.borderRadius = "999px";
    stageLine.style.background = "rgba(255,255,255,0.18)";

    destinationMarker.style.width = "var(--orb-d)";
    destinationMarker.style.height = "var(--orb-d)";
    destinationMarker.style.borderRadius = "999px";
    destinationMarker.style.border = "1px dashed rgba(255,255,255,0.28)";
    destinationMarker.style.opacity = "0.45";

    sweepMarker.style.width = "14px";
    sweepMarker.style.height = "14px";
    sweepMarker.style.borderRadius = "999px";
    sweepMarker.style.background = "rgba(255,255,255,0.75)";
    sweepMarker.style.boxShadow = "0 0 12px rgba(255,255,255,0.28)";
  }

  function readConfig() {
    return {
      flickerOnMs: Math.round(clampNumber(els && els.orbTeleportFlickerOnMs && els.orbTeleportFlickerOnMs.value, 10, 1000, 60)),
      flickerOffMs: Math.round(clampNumber(els && els.orbTeleportFlickerOffMs && els.orbTeleportFlickerOffMs.value, 10, 1000, 60)),
      fadeOutMs: Math.round(clampNumber(els && els.orbTeleportFadeOutMs && els.orbTeleportFadeOutMs.value, 40, 4000, 280)),
      cameraMoveMs: Math.round(clampNumber(els && els.orbTeleportCameraMoveMs && els.orbTeleportCameraMoveMs.value, 40, 4000, 360)),
      fadeInMs: Math.round(clampNumber(els && els.orbTeleportFadeInMs && els.orbTeleportFadeInMs.value, 40, 4000, 280)),
      distancePx: 180,
    };
  }

  function hydrateFields(cfg) {
    if (!els) return;
    if (els.orbTeleportFlickerOnMs) els.orbTeleportFlickerOnMs.value = String(cfg.flickerOnMs);
    if (els.orbTeleportFlickerOffMs) els.orbTeleportFlickerOffMs.value = String(cfg.flickerOffMs);
    if (els.orbTeleportFadeOutMs) els.orbTeleportFadeOutMs.value = String(cfg.fadeOutMs);
    if (els.orbTeleportCameraMoveMs) els.orbTeleportCameraMoveMs.value = String(cfg.cameraMoveMs);
    if (els.orbTeleportFadeInMs) els.orbTeleportFadeInMs.value = String(cfg.fadeInMs);
  }

  function resetOrb() {
    if (!els || !els.orb) return;
    els.orb.hidden = false;
    els.orb.style.transform = "";
    els.orb.style.opacity = "";
    els.orb.style.filter = "";
  }

  function hideOverlay() {
    if (stageLine) stageLine.style.display = "none";
    if (destinationMarker) destinationMarker.style.display = "none";
    if (sweepMarker) sweepMarker.style.display = "none";
  }

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    resetOrb();
    hideOverlay();
  }

  function apply() {
    if (!els || !els.previewRoot) return null;
    ensureOverlay();
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
    ensureOverlay();

    const fadeOutEnd = cfg.fadeOutMs;
    const cameraEnd = fadeOutEnd + cfg.cameraMoveMs;
    const fadeInEnd = cameraEnd + cfg.fadeInMs;
    const totalEnd = fadeInEnd;
    const xOffset = Number(cfg.distancePx) || 180;

    stageLine.style.display = "";
    stageLine.style.transform = `translate(-50%,-50%) translateX(${(xOffset * 0.5).toFixed(2)}px)`;
    destinationMarker.style.display = "";
    destinationMarker.style.transform = `translate(-50%,-50%) translateX(${xOffset.toFixed(2)}px)`;

    if (elapsedMs <= fadeOutEnd) {
      const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, cfg.fadeOutMs)));
      const flicker = buildFlickerMask(elapsedMs, cfg.flickerOnMs, cfg.flickerOffMs);
      els.orb.hidden = false;
      els.orb.style.transform = "";
      els.orb.style.opacity = String((1 - progress) * flicker);
      if (sweepMarker) sweepMarker.style.display = "none";
      return elapsedMs < totalEnd;
    }

    if (elapsedMs <= cameraEnd) {
      const progress = Math.max(0, Math.min(1, (elapsedMs - fadeOutEnd) / Math.max(1, cfg.cameraMoveMs)));
      els.orb.hidden = true;
      if (sweepMarker) {
        sweepMarker.style.display = "";
        sweepMarker.style.transform = `translate(-50%,-50%) translateX(${(progress * xOffset).toFixed(2)}px)`;
      }
      return elapsedMs < totalEnd;
    }

    const progress = Math.max(0, Math.min(1, (elapsedMs - cameraEnd) / Math.max(1, cfg.fadeInMs)));
    const flicker = buildFlickerMask(elapsedMs - cameraEnd, cfg.flickerOnMs, cfg.flickerOffMs);
    els.orb.hidden = false;
    els.orb.style.transform = `translateX(${xOffset.toFixed(2)}px)`;
    els.orb.style.opacity = String(progress * flicker);
    if (sweepMarker) sweepMarker.style.display = "none";

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
      els && els.orbTeleportApplyCameraMoveBtn,
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
