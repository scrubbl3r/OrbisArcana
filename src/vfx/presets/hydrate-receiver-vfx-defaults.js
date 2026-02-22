export function hydrateReceiverVfxDefaults(vfxDefaults, presets = {}) {
  if (!vfxDefaults || typeof vfxDefaults !== "object") return vfxDefaults;

  const {
    shockwave = null,
    flameAoe = null,
    electricAoe = null,
  } = presets || {};

  if (shockwave && vfxDefaults.shock && typeof vfxDefaults.shock === "object") {
    Object.assign(vfxDefaults.shock, shockwave);
  }
  if (flameAoe && vfxDefaults.flame && typeof vfxDefaults.flame === "object") {
    Object.assign(vfxDefaults.flame, flameAoe);
  }
  if (electricAoe && vfxDefaults.electric && typeof vfxDefaults.electric === "object") {
    Object.assign(vfxDefaults.electric, electricAoe);
  }

  return vfxDefaults;
}
