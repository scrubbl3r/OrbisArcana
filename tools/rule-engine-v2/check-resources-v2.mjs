export function createStoredGlobeResources(initialStored = 0) {
  const initialStoredNum = Number(initialStored);
  let stored = Number.isFinite(initialStoredNum) ? initialStoredNum : 0;
  return {
    getStoredGlobeCount: () => stored,
    consumeStoredGlobe: () => {
      if (stored <= 0) return { ok: false, stored };
      stored -= 1;
      return { ok: true, stored };
    },
  };
}
