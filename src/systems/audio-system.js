// Audio system scaffold.
// Will subscribe to orb/game events and trigger sound cues.

export function createAudioSystem({ eventBus }) {
  const unsub = [];

  function start() {
    unsub.push(eventBus.on('orb.todo', () => {
      // TODO: map concrete orb events to audio cues once mechanics are implemented.
    }));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  return { start, stop };
}
