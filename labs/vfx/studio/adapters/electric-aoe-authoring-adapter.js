const ELECTRIC_AOE_FIELDS = Object.freeze([
  ["electricMs", "electricMs"],
  ["electricStartRatio", "electricStartRatio"],
  ["electricEndRatio", "electricEndRatio"],
]);

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

export function createElectricAoeAuthoringAdapter({
  electricAoePresetDefault = {},
} = {}) {
  function defaultSettings() {
    const startRatio = Number.isFinite(Number(electricAoePresetDefault.startRatio))
      ? Number(electricAoePresetDefault.startRatio)
      : (Number(electricAoePresetDefault.startR) || 83) / 100;
    const endRatio = Number.isFinite(Number(electricAoePresetDefault.endRatio))
      ? Number(electricAoePresetDefault.endRatio)
      : (Number(electricAoePresetDefault.endR) || 200) / 100;
    return {
      electricMs: Math.round(clampNumber(electricAoePresetDefault.durationMs, 200, 60000, 10000)),
      electricStartRatio: Number(clampNumber(startRatio, 0.02, 5, 0.83).toFixed(2)),
      electricEndRatio: Number(clampNumber(endRatio, 0.08, 12, 2.0).toFixed(2)),
    };
  }

  function capture(els) {
    return Object.fromEntries(ELECTRIC_AOE_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ELECTRIC_AOE_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (els.electricStartRatio && settings.electricStartR != null && settings.electricStartRatio == null) {
      els.electricStartRatio.value = String(((Number(settings.electricStartR) || 83) / 100).toFixed(2));
    }
    if (els.electricEndRatio && settings.electricEndR != null && settings.electricEndRatio == null) {
      els.electricEndRatio.value = String(((Number(settings.electricEndR) || 200) / 100).toFixed(2));
    }
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
