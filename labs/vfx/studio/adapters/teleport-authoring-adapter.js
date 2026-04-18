function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function readRoundedField(el, min, max, fallback) {
  return Math.round(clampNumber(el && el.value, min, max, fallback));
}

export function createTeleportAuthoringAdapter({
  teleportPresetDefault = {},
  teleportBehaviorDefault = {},
} = {}) {
  function defaultSettings() {
    return {
      orbTeleportFlickerOnMs: Math.round(Number(teleportPresetDefault.orbTeleportFlickerOnMs) || 60),
      orbTeleportFlickerOffMs: Math.round(Number(teleportPresetDefault.orbTeleportFlickerOffMs) || 60),
      orbTeleportFadeOutMs: Math.round(Number(teleportPresetDefault.orbTeleportFadeOutMs) || 280),
      orbTeleportCameraTravelMs: Math.round(Number(teleportBehaviorDefault.cameraTravelMs) || 1500),
      orbTeleportFadeInMs: Math.round(Number(teleportPresetDefault.orbTeleportFadeInMs) || 280),
    };
  }

  function capture(els) {
    return {
      orbTeleportFlickerOnMs: Number(els && els.orbTeleportFlickerOnMs && els.orbTeleportFlickerOnMs.value),
      orbTeleportFlickerOffMs: Number(els && els.orbTeleportFlickerOffMs && els.orbTeleportFlickerOffMs.value),
      orbTeleportFadeOutMs: Number(els && els.orbTeleportFadeOutMs && els.orbTeleportFadeOutMs.value),
      orbTeleportCameraTravelMs: Number(els && els.orbTeleportCameraTravelMs && els.orbTeleportCameraTravelMs.value),
      orbTeleportFadeInMs: Number(els && els.orbTeleportFadeInMs && els.orbTeleportFadeInMs.value),
    };
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return;
    if (els.orbTeleportFlickerOnMs && settings.orbTeleportFlickerOnMs != null) els.orbTeleportFlickerOnMs.value = String(settings.orbTeleportFlickerOnMs);
    if (els.orbTeleportFlickerOffMs && settings.orbTeleportFlickerOffMs != null) els.orbTeleportFlickerOffMs.value = String(settings.orbTeleportFlickerOffMs);
    if (els.orbTeleportFadeOutMs && settings.orbTeleportFadeOutMs != null) els.orbTeleportFadeOutMs.value = String(settings.orbTeleportFadeOutMs);
    if (els.orbTeleportCameraTravelMs && settings.orbTeleportCameraTravelMs != null) els.orbTeleportCameraTravelMs.value = String(settings.orbTeleportCameraTravelMs);
    if (els.orbTeleportFadeInMs && settings.orbTeleportFadeInMs != null) els.orbTeleportFadeInMs.value = String(settings.orbTeleportFadeInMs);
    if (typeof applyPreview === "function") applyPreview();
  }

  function readBehaviorPreviewConfig(els) {
    return {
      fadeOutMs: readRoundedField(
        els && els.orbTeleportFadeOutMs,
        40,
        4000,
        teleportPresetDefault.orbTeleportFadeOutMs
      ),
      cameraTravelMs: readRoundedField(
        els && els.orbTeleportCameraTravelMs,
        0,
        8000,
        teleportBehaviorDefault.cameraTravelMs
      ),
      fadeInMs: readRoundedField(
        els && els.orbTeleportFadeInMs,
        40,
        4000,
        teleportPresetDefault.orbTeleportFadeInMs
      ),
      easing: String(teleportBehaviorDefault.cameraEasing || "easeInOutExpo"),
    };
  }

  function updateBehaviorReadout(els) {
    if (!els || !els.teleportBehaviorReadout) return;
    const cfg = readBehaviorPreviewConfig(els);
    const totalMs = cfg.fadeOutMs + cfg.cameraTravelMs + cfg.fadeInMs;
    els.teleportBehaviorReadout.textContent = `VFX fade-out ${cfg.fadeOutMs}ms -> camera travel ${cfg.cameraTravelMs}ms (${cfg.easing}) -> VFX fade-in ${cfg.fadeInMs}ms. Total ${totalMs}ms.`;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
    readBehaviorPreviewConfig,
    updateBehaviorReadout,
  });
}
