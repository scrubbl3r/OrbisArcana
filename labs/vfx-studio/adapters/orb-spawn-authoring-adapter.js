const ORB_SPAWN_FIELDS = Object.freeze([
  ["orbSpawnBobRangeBO", "bobRangeBO"],
  ["orbSpawnBobSpeedHz", "bobSpeedHz"],
  ["orbSpawnDriftRangeBO", "driftRangeBO"],
  ["orbSpawnDriftSpeedHz", "driftSpeedHz"],
]);

function fixedNumber(value, digits, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Number((Number.isFinite(n) ? n : f).toFixed(digits));
}

export function createOrbSpawnAuthoringAdapter({
  orbSpawnPresetDefault = {},
} = {}) {
  function defaultSettings() {
    return {
      bobRangeBO: fixedNumber(orbSpawnPresetDefault.bobRangeBO, 2, 0.65),
      bobSpeedHz: fixedNumber(orbSpawnPresetDefault.bobSpeedHz, 2, 0.65),
      driftRangeBO: fixedNumber(orbSpawnPresetDefault.driftRangeBO, 2, 0.2),
      driftSpeedHz: fixedNumber(orbSpawnPresetDefault.driftSpeedHz, 2, 0.23),
    };
  }

  function capture(els) {
    return Object.fromEntries(ORB_SPAWN_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_SPAWN_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
