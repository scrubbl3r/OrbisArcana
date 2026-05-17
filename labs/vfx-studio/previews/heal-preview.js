function readNumber(field, fallback = 0) {
  const n = Number(field && field.value);
  return Number.isFinite(n) ? n : fallback;
}

function readHealConfig(els = {}) {
  return Object.freeze({
    globeCost: Math.max(0, Math.round(readNumber(els.healGlobeCost, 1))),
    healAmountHp: Math.max(1, Math.round(readNumber(els.healAmountHp, 500))),
    castDurationMs: Math.max(0, Math.round(readNumber(els.healCastDurationMs, 250))),
    cooldownMs: Math.max(0, Math.round(readNumber(els.healCooldownMs, 1000))),
    requireDamagedOrb: !!(els.healRequireDamagedOrb && els.healRequireDamagedOrb.checked),
    consumeOnFailedCast: !!(els.healConsumeOnFailedCast && els.healConsumeOnFailedCast.checked),
  });
}

export function createHealPreview({
  els = {},
} = {}) {
  function apply() {
    const config = readHealConfig(els);
    if (els.healPreviewReadout) {
      els.healPreviewReadout.value = `${config.healAmountHp} HP for ${config.globeCost} globe${config.globeCost === 1 ? "" : "s"}`;
    }
    return config;
  }

  function clear() {}

  function wire() {
    apply();
    [
      "healGlobeCost",
      "healAmountHp",
      "healCastDurationMs",
      "healCooldownMs",
      "healRequireDamagedOrb",
      "healConsumeOnFailedCast",
    ].forEach((id) => {
      const field = els[id];
      if (field) field.addEventListener("input", apply);
      if (field) field.addEventListener("change", apply);
    });
    if (els.previewHeal) els.previewHeal.addEventListener("click", apply);
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
