// Stub runtime effect for future orb color/state work.
// Intentionally narrow: color + alpha + fades only.
// Pulse/flash behavior should remain separate effects.

export function createColorizeEffect() {
  return {
    id: "colorize",
    kind: "persistent",
    start(payload = {}, context = {}) {
      void payload;
      void context;
      return { handled: false, stub: true };
    },
    stop(payload = {}, context = {}) {
      void payload;
      void context;
      return { handled: false, stub: true };
    },
  };
}
