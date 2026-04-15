export function hydrateReceiverVfxDefaults(vfxDefaults, presets = {}) {
  if (!vfxDefaults || typeof vfxDefaults !== "object") return vfxDefaults;

  const {
    bubbleShield = null,
    shockwave = null,
    flameAoe = null,
    electricAoe = null,
    orbNod = null,
  } = presets || {};

  if (bubbleShield && vfxDefaults.shield && typeof vfxDefaults.shield === "object") {
    Object.assign(vfxDefaults.shield, bubbleShield);
  }
  if (shockwave && vfxDefaults.shock && typeof vfxDefaults.shock === "object") {
    Object.assign(vfxDefaults.shock, shockwave);
  }
  if (flameAoe && vfxDefaults.flame && typeof vfxDefaults.flame === "object") {
    Object.assign(vfxDefaults.flame, flameAoe);
  }
  if (electricAoe && vfxDefaults.electric && typeof vfxDefaults.electric === "object") {
    Object.assign(vfxDefaults.electric, electricAoe);
  }
  if (orbNod && vfxDefaults.nod && typeof vfxDefaults.nod === "object") {
    Object.assign(vfxDefaults.nod, orbNod);
  }

  return vfxDefaults;
}
