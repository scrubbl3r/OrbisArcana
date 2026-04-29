export function hydrateReceiverVfxDefaults(vfxDefaults, presets = {}) {
  if (!vfxDefaults || typeof vfxDefaults !== "object") return vfxDefaults;

  const {
    bubbleShield = null,
    shockwave = null,
    flameAoe = null,
    electricAoe = null,
    teleport = null,
    orbNod = null,
    orbNod3d = null,
    orbSpawn = null,
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
  if (teleport && vfxDefaults.teleport && typeof vfxDefaults.teleport === "object") {
    Object.assign(vfxDefaults.teleport, teleport);
  }
  if (orbNod && vfxDefaults.nod && typeof vfxDefaults.nod === "object") {
    Object.assign(vfxDefaults.nod, orbNod);
  }
  if (orbNod3d && vfxDefaults.nod3d && typeof vfxDefaults.nod3d === "object") {
    Object.assign(vfxDefaults.nod3d, orbNod3d);
  }
  if (orbSpawn && vfxDefaults.spawn && typeof vfxDefaults.spawn === "object") {
    Object.assign(vfxDefaults.spawn, orbSpawn);
  }

  return vfxDefaults;
}
