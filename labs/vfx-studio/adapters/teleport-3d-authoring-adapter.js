function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function readRoundedField(el, min, max, fallback) {
  return Math.round(clampNumber(el && el.value, min, max, fallback));
}

export function createTeleport3dAuthoringAdapter({
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
      orbTeleportFlickerOnMs: Number(els && els.orbTeleport3dFlickerOnMs && els.orbTeleport3dFlickerOnMs.value),
      orbTeleportFlickerOffMs: Number(els && els.orbTeleport3dFlickerOffMs && els.orbTeleport3dFlickerOffMs.value),
      orbTeleportFadeOutMs: Number(els && els.orbTeleport3dFadeOutMs && els.orbTeleport3dFadeOutMs.value),
      orbTeleportCameraTravelMs: Number(els && els.orbTeleport3dCameraTravelMs && els.orbTeleport3dCameraTravelMs.value),
      orbTeleportFadeInMs: Number(els && els.orbTeleport3dFadeInMs && els.orbTeleport3dFadeInMs.value),
    };
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    if (els.orbTeleport3dFlickerOnMs && settings.orbTeleportFlickerOnMs != null) els.orbTeleport3dFlickerOnMs.value = String(settings.orbTeleportFlickerOnMs);
    if (els.orbTeleport3dFlickerOffMs && settings.orbTeleportFlickerOffMs != null) els.orbTeleport3dFlickerOffMs.value = String(settings.orbTeleportFlickerOffMs);
    if (els.orbTeleport3dFadeOutMs && settings.orbTeleportFadeOutMs != null) els.orbTeleport3dFadeOutMs.value = String(settings.orbTeleportFadeOutMs);
    if (els.orbTeleport3dCameraTravelMs && settings.orbTeleportCameraTravelMs != null) els.orbTeleport3dCameraTravelMs.value = String(settings.orbTeleportCameraTravelMs);
    if (els.orbTeleport3dFadeInMs && settings.orbTeleportFadeInMs != null) els.orbTeleport3dFadeInMs.value = String(settings.orbTeleportFadeInMs);
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  function readBehaviorPreviewConfig(els) {
    return {
      fadeOutMs: readRoundedField(
        els && els.orbTeleport3dFadeOutMs,
        40,
        4000,
        teleportPresetDefault.orbTeleportFadeOutMs
      ),
      cameraTravelMs: readRoundedField(
        els && els.orbTeleport3dCameraTravelMs,
        0,
        8000,
        teleportBehaviorDefault.cameraTravelMs
      ),
      fadeInMs: readRoundedField(
        els && els.orbTeleport3dFadeInMs,
        40,
        4000,
        teleportPresetDefault.orbTeleportFadeInMs
      ),
      easing: String(teleportBehaviorDefault.cameraEasing || "easeInOutExpo"),
    };
  }

  function updateBehaviorReadout(els) {
    if (!els || !els.teleport3dBehaviorReadout) return;
    const cfg = readBehaviorPreviewConfig(els);
    const totalMs = cfg.fadeOutMs + cfg.cameraTravelMs + cfg.fadeInMs;
    els.teleport3dBehaviorReadout.textContent = `VFX fade-out ${cfg.fadeOutMs}ms -> camera travel ${cfg.cameraTravelMs}ms (${cfg.easing}) -> VFX fade-in ${cfg.fadeInMs}ms. Total ${totalMs}ms.`;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
    readBehaviorPreviewConfig,
    updateBehaviorReadout,
  });
}
