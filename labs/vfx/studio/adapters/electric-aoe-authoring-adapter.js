const ELECTRIC_AOE_FIELDS = Object.freeze([
  ["electricMs", "electricMs"],
  ["electricStartR", "electricStartR"],
  ["electricEndR", "electricEndR"],
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
    return {
      electricMs: Math.round(clampNumber(electricAoePresetDefault.durationMs, 200, 60000, 10000)),
      electricStartR: Math.round(clampNumber(electricAoePresetDefault.startR, 2, 500, 83)),
      electricEndR: Math.round(clampNumber(electricAoePresetDefault.endR, 8, 1000, 200)),
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
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
