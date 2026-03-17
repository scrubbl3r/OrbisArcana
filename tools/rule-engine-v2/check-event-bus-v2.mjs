export function createCheckEventBus() {
  const listeners = new Map();
  const getBucket = (key) => listeners.get(key) ?? [];
  const normalizeEventName = (eventName) => {
    const key = typeof eventName === "string" ? eventName.trim() : "";
    if (!key) {
      throw new Error("check event bus requires non-empty string event name");
    }
    return key;
  };
  return {
    on(eventName, handler) {
      const key = normalizeEventName(eventName);
      if (typeof handler !== "function") {
        throw new Error(`check event bus handler must be a function for '${key}'`);
      }
      const bucket = getBucket(key);
      bucket.push(handler);
      listeners.set(key, bucket);
      return () => {
        const cur = getBucket(key);
        const idx = cur.indexOf(handler);
        if (idx >= 0) cur.splice(idx, 1);
        listeners.set(key, cur);
      };
    },
    emit(eventName, payload = {}) {
      const key = normalizeEventName(eventName);
      const bucket = getBucket(key);
      for (const fn of bucket.slice()) fn(payload);
    },
  };
}
