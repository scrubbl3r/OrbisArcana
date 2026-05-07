// Lightweight pub/sub bus for decoupling gameplay systems.
// Intentionally minimal for receiver runtime scaffolding.
export function createEventBus() {
  const listeners = new Map();

  function on(eventName, handler) {
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(handler);
    return () => off(eventName, handler);
  }

  function off(eventName, handler) {
    const set = listeners.get(eventName);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) listeners.delete(eventName);
  }

  function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (error) {
        try {
          console.error(`[event-bus] handler failed for ${String(eventName || "")}`, error);
        } catch {}
      }
    }
  }

  return { on, off, emit };
}
