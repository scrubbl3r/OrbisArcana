/**
 * Canonical shockwave runtime effect implementation.
 * Keeps receiver VFX triggering out of generic wiring code.
 */
export function executeShockwave({
  triggerShockwave,
} = {}) {
  if (typeof triggerShockwave !== "function") {
    return { handled: false };
  }
  triggerShockwave();
  return { handled: true };
}

export function triggerShockwaveRuntime({
  shockwaveRuntime,
  playShock,
} = {}) {
  if (shockwaveRuntime && typeof shockwaveRuntime.trigger === "function") {
    shockwaveRuntime.trigger();
    return { handled: true, mode: "runtime_trigger" };
  }
  if (typeof playShock === "function") {
    playShock();
    return { handled: true, mode: "play_fallback" };
  }
  return { handled: false };
}
