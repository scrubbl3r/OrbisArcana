import { createOrbState } from './orb-state.js';

// Top-level game state scaffold.
// Source-of-truth composition layer for future systems.
export function createGameState(config = {}) {
  return {
    schemaVersion: 1,
    nowMs: 0,

    orb: createOrbState(config.orb || {}),

    // Future domains (placeholders)
    world: config.world || {},
    input: config.input || {},
    fx: config.fx || {},
    audio: config.audio || {},
  };
}
