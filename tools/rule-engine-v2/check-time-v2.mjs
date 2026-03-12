export function createFixedNowMs(atMs = 0) {
  return () => atMs;
}

export function createMutableNow(startMs = 0) {
  const nowRef = { value: startMs };
  return {
    nowRef,
    nowMs: () => nowRef.value,
    advance: (deltaMs = 0) => {
      nowRef.value += deltaMs;
      return nowRef.value;
    },
  };
}
