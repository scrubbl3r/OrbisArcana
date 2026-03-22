// Test helper: captures emitted payloads for a specific event-bus event.
// Used by regression checks to assert emitted event sequences/payloads.
// Payloads are shallow-copied to avoid post-emit mutation drift in assertions.
export function captureCheckEvents(eventBus, eventName) {
  const events = [];
  eventBus.on(eventName, (payload = {}) => events.push({ ...payload }));
  return events;
}
