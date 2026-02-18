// Orb system scaffold.
// Behavior to be implemented in the next pass.

export function createOrbSystem({ gameState, eventBus }) {
  function tick(nowMs) {
    gameState.nowMs = nowMs;
  }

  function applyDamage(_command) {
    // TODO: implement damage rules + orb events.
    eventBus.emit('orb.todo', { op: 'applyDamage' });
  }

  function applyHeal(_command) {
    // TODO: implement heal rules + orb events.
    eventBus.emit('orb.todo', { op: 'applyHeal' });
  }

  function revive(_command) {
    // TODO: implement revive rules + orb events.
    eventBus.emit('orb.todo', { op: 'revive' });
  }

  return {
    tick,
    applyDamage,
    applyHeal,
    revive,
  };
}
