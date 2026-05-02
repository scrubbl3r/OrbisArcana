const BUBBLE_SHIELD_3D_FIELDS = Object.freeze([
  ["shield3dMs", "durationMs"],
  ["shield3dDiameterRatio", "diameterRatio"],
  ["shield3dAlpha", "alpha"],
  ["shield3dPulseMs", "pulseMs"],
  ["shield3dPulseMin", "pulseMin"],
  ["shield3dPulseMax", "pulseMax"],
  ["shield3dCrackTotal", "maxCracks"],
  ["shield3dCrackAlpha", "crackAlpha"],
  ["shield3dCrackStroke", "crackWidthPx"],
  ["shield3dCrackLift", "crackLiftBO"],
  ["shield3dCriticalGlow", "criticalGlow"],
  ["shield3dMutationSpeed", "mutationSpeed"],
  ["shield3dMutationAmount", "mutationAmount"],
  ["shield3dDiffuseWash", "diffuseWash"],
  ["shield3dEdgeBrightness", "edgeBrightness"],
  ["shield3dCellDarkness", "cellDarkness"],
  ["shield3dCellSharpness", "cellSharpness"],
  ["shield3dDetailEmergence", "detailEmergence"],
]);

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function fixedNumber(value, digits, fallback = 0) {
  return Number(clampNumber(value, -Infinity, Infinity, fallback).toFixed(digits));
}

function roundedNumber(value, fallback = 0) {
  return Math.round(clampNumber(value, -Infinity, Infinity, fallback));
}

function colorParts(color, fallback) {
  const raw = Number(color);
  const value = Number.isFinite(raw)
    ? Math.max(0, Math.min(0xffffff, Math.round(raw))) >>> 0
    : Number(fallback) >>> 0;
  return Object.freeze({
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  });
}

export function createBubbleShield3dAuthoringAdapter({
  bubbleShield3dPresetDefault = {},
} = {}) {
  function defaultSettings() {
    const crack = colorParts(bubbleShield3dPresetDefault.crackColor, 0xf8fdff);
    const energy = colorParts(bubbleShield3dPresetDefault.energyColor, 0x94b8c2);
    return {
      durationMs: roundedNumber(clampNumber(bubbleShield3dPresetDefault.durationMs, 80, 120000, 5000)),
      diameterRatio: fixedNumber(clampNumber(bubbleShield3dPresetDefault.diameterRatio, 0.1, 8, 1.24), 2, 1.24),
      alpha: fixedNumber(clampNumber(bubbleShield3dPresetDefault.alpha, 0, 1, 1), 2, 1),
      pulseMs: roundedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMs, 20, 700, 80)),
      pulseMin: fixedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMin, 0, 1, 0.3), 2, 0.3),
      pulseMax: fixedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMax, 0, 1, 1), 2, 1),
      maxCracks: roundedNumber(clampNumber(bubbleShield3dPresetDefault.maxCracks, 3, 96, 8)),
      crackR: crack.r,
      crackG: crack.g,
      crackB: crack.b,
      crackAlpha: fixedNumber(clampNumber(bubbleShield3dPresetDefault.crackAlpha, 0, 1, 0.6), 2, 0.6),
      crackWidthPx: fixedNumber(clampNumber(bubbleShield3dPresetDefault.crackWidthPx, 0.25, 12, 1), 2, 1),
      crackLiftBO: fixedNumber(clampNumber(bubbleShield3dPresetDefault.crackLiftBO, 0, 0.2, 0), 3, 0),
      criticalGlow: fixedNumber(clampNumber(bubbleShield3dPresetDefault.criticalGlow, 0, 4, 1.35), 2, 1.35),
      energyR: energy.r,
      energyG: energy.g,
      energyB: energy.b,
      mutationSpeed: fixedNumber(clampNumber(bubbleShield3dPresetDefault.mutationSpeed, 0, 2, 2), 2, 2),
      mutationAmount: fixedNumber(clampNumber(bubbleShield3dPresetDefault.mutationAmount, 0, 1.5, 1.5), 2, 1.5),
      diffuseWash: fixedNumber(clampNumber(bubbleShield3dPresetDefault.diffuseWash, 0, 2, 1), 2, 1),
      edgeBrightness: fixedNumber(clampNumber(bubbleShield3dPresetDefault.edgeBrightness, 0, 3, 1), 2, 1),
      cellDarkness: fixedNumber(clampNumber(bubbleShield3dPresetDefault.cellDarkness, 0, 2, 1), 2, 1),
      cellSharpness: fixedNumber(clampNumber(bubbleShield3dPresetDefault.cellSharpness, 0, 3, 1.1), 2, 1.1),
      detailEmergence: fixedNumber(clampNumber(bubbleShield3dPresetDefault.detailEmergence, 0, 1, 1), 2, 1),
    };
  }

  function capture(els) {
    const out = Object.fromEntries(BUBBLE_SHIELD_3D_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
    const crackR = roundedNumber(clampNumber(els && els.shield3dCrackR && els.shield3dCrackR.value, 0, 255, 248));
    const crackG = roundedNumber(clampNumber(els && els.shield3dCrackG && els.shield3dCrackG.value, 0, 255, 253));
    const crackB = roundedNumber(clampNumber(els && els.shield3dCrackB && els.shield3dCrackB.value, 0, 255, 255));
    const energyR = roundedNumber(clampNumber(els && els.shield3dEnergyR && els.shield3dEnergyR.value, 0, 255, 148));
    const energyG = roundedNumber(clampNumber(els && els.shield3dEnergyG && els.shield3dEnergyG.value, 0, 255, 184));
    const energyB = roundedNumber(clampNumber(els && els.shield3dEnergyB && els.shield3dEnergyB.value, 0, 255, 194));
    out.crackColor = (
      (crackR << 16) +
      (crackG << 8) +
      crackB
    ) >>> 0;
    out.energyColor = (
      (energyR << 16) +
      (energyG << 8) +
      energyB
    ) >>> 0;
    return out;
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    BUBBLE_SHIELD_3D_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (settings.crackColor != null) {
      const crack = colorParts(settings.crackColor, 0xf8fdff);
      if (els.shield3dCrackR) els.shield3dCrackR.value = String(crack.r);
      if (els.shield3dCrackG) els.shield3dCrackG.value = String(crack.g);
      if (els.shield3dCrackB) els.shield3dCrackB.value = String(crack.b);
    }
    if (settings.energyColor != null) {
      const energy = colorParts(settings.energyColor, 0x94b8c2);
      if (els.shield3dEnergyR) els.shield3dEnergyR.value = String(energy.r);
      if (els.shield3dEnergyG) els.shield3dEnergyG.value = String(energy.g);
      if (els.shield3dEnergyB) els.shield3dEnergyB.value = String(energy.b);
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
