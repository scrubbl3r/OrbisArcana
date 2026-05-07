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
  legacyDomShockwaveRuntime,
  playShock,
} = {}) {
  if (legacyDomShockwaveRuntime && typeof legacyDomShockwaveRuntime.trigger === "function") {
    legacyDomShockwaveRuntime.trigger();
    return { handled: true, mode: "runtime_trigger" };
  }
  if (typeof playShock === "function") {
    playShock();
    return { handled: true, mode: "play_fallback" };
  }
  return { handled: false };
}
