// Minimal stored-globe resource fixture used by dispatch/runtime check scenarios.
export function createStoredGlobeResources(initialStored = 0) {
  const initialStoredNum = Number(initialStored);
  let stored = Number.isFinite(initialStoredNum) ? initialStoredNum : 0;
  return {
    getStoredGlobeCount: () => stored,
    bindLoadedGlobe: (payload = {}) => {
      if (stored <= 0) return { ok: false, stored };
      stored -= 1;
      return {
        ok: true,
        stored,
        globe: {
          globeId: `check_globe_${stored + 1}`,
          emitterId: "check_emitter",
          slot: payload.slot ? String(payload.slot) : "",
          state: "bound",
        },
      };
    },
    spendBoundGlobe: () => ({ ok: true, stored }),
    consumeStoredGlobe: () => {
      if (stored <= 0) return { ok: false, stored };
      stored -= 1;
      return { ok: true, stored };
    },
  };
}
