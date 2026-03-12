export function runWithStartedSystem(system, fn) {
  system.start();
  try {
    return fn();
  } finally {
    system.stop();
  }
}
