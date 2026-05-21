export function hydrateReceiverVfxDefaults(vfxDefaults, presets = {}) {
  if (!vfxDefaults || typeof vfxDefaults !== "object") return vfxDefaults;

  const {
    bubbleShield = null,
    bubbleShield3d = null,
    shockwave = null,
    shockwave3d = null,
    flameAoe = null,
    flameAoe3d = null,
    electricAoe = null,
    electricAoe3d = null,
    teleport = null,
    orbNod = null,
    orbNod3d = null,
    orbSpawn = null,
  } = presets || {};

  if (bubbleShield && vfxDefaults.shield && typeof vfxDefaults.shield === "object") {
    Object.assign(vfxDefaults.shield, bubbleShield);
  }
  if (bubbleShield3d) {
    vfxDefaults.shield3d = {
      ...(vfxDefaults.shield3d && typeof vfxDefaults.shield3d === "object" ? vfxDefaults.shield3d : {}),
      ...bubbleShield3d,
    };
  }
  if (shockwave && vfxDefaults.shock && typeof vfxDefaults.shock === "object") {
    Object.assign(vfxDefaults.shock, shockwave);
  }
  if (shockwave3d) {
    vfxDefaults.shock3d = {
      ...(vfxDefaults.shock3d && typeof vfxDefaults.shock3d === "object" ? vfxDefaults.shock3d : {}),
      ...shockwave3d,
    };
  }
  if (flameAoe && vfxDefaults.flame && typeof vfxDefaults.flame === "object") {
    Object.assign(vfxDefaults.flame, flameAoe);
  }
  if (flameAoe3d) {
    vfxDefaults.flame3d = {
      ...(vfxDefaults.flame3d && typeof vfxDefaults.flame3d === "object" ? vfxDefaults.flame3d : {}),
      ...flameAoe3d,
    };
  }
  if (electricAoe && vfxDefaults.electric && typeof vfxDefaults.electric === "object") {
    Object.assign(vfxDefaults.electric, electricAoe);
  }
  if (electricAoe3d) {
    vfxDefaults.electric3d = {
      ...(vfxDefaults.electric3d && typeof vfxDefaults.electric3d === "object" ? vfxDefaults.electric3d : {}),
      ...electricAoe3d,
    };
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
  if (orbSpawn && vfxDefaults.orbSpawn && typeof vfxDefaults.orbSpawn === "object") {
    Object.assign(vfxDefaults.orbSpawn, orbSpawn);
  }

  return vfxDefaults;
}
