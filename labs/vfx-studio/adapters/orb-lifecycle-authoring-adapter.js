const ORB_LIFECYCLE_FIELDS = Object.freeze([
  ["orbLifecycleShardTotal", "orbLifecycleShardTotal"],
  ["orbLifecycleHitTotal", "orbLifecycleHitTotal"],
  ["orbLifecycleShardR", "orbLifecycleShardR"],
  ["orbLifecycleShardG", "orbLifecycleShardG"],
  ["orbLifecycleShardB", "orbLifecycleShardB"],
  ["orbLifecycleShardA", "orbLifecycleShardA"],
  ["orbLifecycleShardStroke", "orbLifecycleShardStroke"],
]);

function roundedNumber(value, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Math.round(Number.isFinite(n) ? n : f);
}

export function createOrbLifecycleAuthoringAdapter({
  orbLifecycleDefaults = {},
} = {}) {
  function defaultSettings() {
    return {
      orbLifecycleShardTotal: roundedNumber(orbLifecycleDefaults.orbLifecycleShardTotal, 16),
      orbLifecycleHitTotal: roundedNumber(orbLifecycleDefaults.orbLifecycleHitTotal, 3),
      orbLifecycleShardR: roundedNumber(orbLifecycleDefaults.orbLifecycleShardR, 255),
      orbLifecycleShardG: roundedNumber(orbLifecycleDefaults.orbLifecycleShardG, 255),
      orbLifecycleShardB: roundedNumber(orbLifecycleDefaults.orbLifecycleShardB, 255),
      orbLifecycleShardA: Number.isFinite(Number(orbLifecycleDefaults.orbLifecycleShardA)) ? Number(orbLifecycleDefaults.orbLifecycleShardA).toFixed(2) : "0.46",
      orbLifecycleShardStroke: Number.isFinite(Number(orbLifecycleDefaults.orbLifecycleShardStroke)) ? Number(orbLifecycleDefaults.orbLifecycleShardStroke).toFixed(2) : "1.00",
    };
  }

  function capture(els) {
    return Object.fromEntries(ORB_LIFECYCLE_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_LIFECYCLE_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
