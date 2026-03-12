export function createStoredGlobeResources(initialStored = 0) {
  let stored = Number.isFinite(Number(initialStored)) ? Number(initialStored) : 0;
  return {
    getStoredGlobeCount: () => stored,
    consumeStoredGlobe: () => {
      if (stored <= 0) return { ok: false, stored };
      stored -= 1;
      return { ok: true, stored };
    },
  };
}
