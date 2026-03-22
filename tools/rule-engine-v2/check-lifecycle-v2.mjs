// Runs a callback with a started system and guarantees stop() in finally.
// Used by runtime-style checks to avoid leaked started systems between cases.
export function runWithStartedSystem(system, fn) {
  system.start();
  try {
    return fn();
  } finally {
    system.stop();
  }
}
