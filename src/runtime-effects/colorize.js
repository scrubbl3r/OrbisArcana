/**
 * Canonical orb colorize runtime effect implementation.
 * Narrow by design: color + alpha + fades only.
 * Pulse/flash behavior should remain separate effects.
 */
export function executeColorize({
  applyColorize,
  clearColorize,
  payload = {},
} = {}) {
  const mode = String(payload && payload.mode || "start").trim().toLowerCase();
  if (mode === "stop" || mode === "clear" || payload.enabled === false) {
    if (typeof clearColorize !== "function") return { handled: false };
    clearColorize();
    return { handled: true, mode: "stop" };
  }
  if (typeof applyColorize !== "function") return { handled: false };
  applyColorize(payload);
  return { handled: true, mode: "start" };
}
