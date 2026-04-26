const WORLD_GLOBE_STYLE_SUFFIXES = Object.freeze([
  "DiameterRatio",
  "FillR",
  "FillG",
  "FillB",
  "FillAlpha",
  "StrokeR",
  "StrokeG",
  "StrokeB",
  "StrokeAlpha",
  "StrokeWidthRatio",
]);

function fixedNumber(value, digits, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Number((Number.isFinite(n) ? n : f).toFixed(digits));
}

function readStyleDefaults(prefix, state = {}) {
  const fill = state.fillRgb || {};
  const stroke = state.strokeRgb || {};
  return {
    [`${prefix}DiameterRatio`]: fixedNumber(state.diameterRatio, 2),
    [`${prefix}FillR`]: Math.round(Number(fill.r) || 0),
    [`${prefix}FillG`]: Math.round(Number(fill.g) || 0),
    [`${prefix}FillB`]: Math.round(Number(fill.b) || 0),
    [`${prefix}FillAlpha`]: fixedNumber(state.fillAlpha, 2),
    [`${prefix}StrokeR`]: Math.round(Number(stroke.r) || 0),
    [`${prefix}StrokeG`]: Math.round(Number(stroke.g) || 0),
    [`${prefix}StrokeB`]: Math.round(Number(stroke.b) || 0),
    [`${prefix}StrokeAlpha`]: fixedNumber(state.strokeAlpha, 2),
    [`${prefix}StrokeWidthRatio`]: fixedNumber(state.strokeWidthRatio, 3),
  };
}

export function createWorldGlobeAuthoringAdapter({
  worldGlobeVisualDefaults = {},
  getElementById = null,
} = {}) {
  const field = (id) => (typeof getElementById === "function" ? getElementById(id) : null);

  function readStyleFields(prefix) {
    const read = (suffix) => Number(field(prefix + suffix) && field(prefix + suffix).value);
    return Object.fromEntries(WORLD_GLOBE_STYLE_SUFFIXES.map((suffix) => [`${prefix}${suffix}`, read(suffix)]));
  }

  function applyStyleFields(prefix, settings) {
    WORLD_GLOBE_STYLE_SUFFIXES.forEach((suffix) => {
      const key = prefix + suffix;
      const el = field(key);
      const value = settings[key];
      if (el && value != null) el.value = String(value);
    });
  }

  function defaultSettings() {
    const idle = worldGlobeVisualDefaults.idle || {};
    return {
      ...readStyleDefaults("worldGlobeIdle", idle),
      worldGlobeIdleDriftRatio: fixedNumber(idle.driftRatio, 2),
      worldGlobeIdleBobRatio: fixedNumber(idle.bobRatio, 2),
      worldGlobeIdleBobHz: fixedNumber(idle.bobHz, 2),
      worldGlobeIdlePulseScale: fixedNumber(idle.pulseScale, 3),
      worldGlobeIdlePulseHz: fixedNumber(idle.pulseHz, 2),
      ...readStyleDefaults("worldGlobeCollected", worldGlobeVisualDefaults.collected),
      ...readStyleDefaults("worldGlobeConsumed", worldGlobeVisualDefaults.consumed),
    };
  }

  function capture() {
    return {
      ...readStyleFields("worldGlobeIdle"),
      worldGlobeIdleDriftRatio: Number(field("worldGlobeIdleDriftRatio") && field("worldGlobeIdleDriftRatio").value),
      worldGlobeIdleBobRatio: Number(field("worldGlobeIdleBobRatio") && field("worldGlobeIdleBobRatio").value),
      worldGlobeIdleBobHz: Number(field("worldGlobeIdleBobHz") && field("worldGlobeIdleBobHz").value),
      worldGlobeIdlePulseScale: Number(field("worldGlobeIdlePulseScale") && field("worldGlobeIdlePulseScale").value),
      worldGlobeIdlePulseHz: Number(field("worldGlobeIdlePulseHz") && field("worldGlobeIdlePulseHz").value),
      ...readStyleFields("worldGlobeCollected"),
      ...readStyleFields("worldGlobeConsumed"),
    };
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!settings || typeof settings !== "object") return false;
    applyStyleFields("worldGlobeIdle", settings);
    if (field("worldGlobeIdleDriftRatio") && settings.worldGlobeIdleDriftRatio != null) field("worldGlobeIdleDriftRatio").value = String(settings.worldGlobeIdleDriftRatio);
    if (field("worldGlobeIdleBobRatio") && settings.worldGlobeIdleBobRatio != null) field("worldGlobeIdleBobRatio").value = String(settings.worldGlobeIdleBobRatio);
    if (field("worldGlobeIdleBobHz") && settings.worldGlobeIdleBobHz != null) field("worldGlobeIdleBobHz").value = String(settings.worldGlobeIdleBobHz);
    if (field("worldGlobeIdlePulseScale") && settings.worldGlobeIdlePulseScale != null) field("worldGlobeIdlePulseScale").value = String(settings.worldGlobeIdlePulseScale);
    if (field("worldGlobeIdlePulseHz") && settings.worldGlobeIdlePulseHz != null) field("worldGlobeIdlePulseHz").value = String(settings.worldGlobeIdlePulseHz);
    applyStyleFields("worldGlobeCollected", settings);
    applyStyleFields("worldGlobeConsumed", settings);
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
