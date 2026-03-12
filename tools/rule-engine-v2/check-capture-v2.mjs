export function captureCheckEvents(eventBus, eventName) {
  const events = [];
  eventBus.on(eventName, (payload = {}) => events.push({ ...payload }));
  return events;
}
