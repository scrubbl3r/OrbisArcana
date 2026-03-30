// Audio system scaffold.
// Will subscribe to orb/game events and trigger sound cues.

export function createAudioSystem({ eventBus }) {
  const unsub = [];

  function start() {
    unsub.push(eventBus.on('orb.damage_applied', () => {
      // TODO: trigger hit sound cue.
    }));
    unsub.push(eventBus.on('orb.healed', () => {
      // TODO: trigger heal sound cue.
    }));
    unsub.push(eventBus.on('orb.died', () => {
      // TODO: trigger death sound cue.
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
