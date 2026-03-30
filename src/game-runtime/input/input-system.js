export function createInputSystem({ eventBus } = {}) {
  let frameId = 0;
  let latest = {
    atMs: 0,
    frameId: 0,
    energy01: 0,
    groove01: 0,
    dynamics01: 0,
    smooth01: 0,
    speed01: 0,
    shake01: 0,
    locked: false,
    shieldAxis: [0, 0, 0],
    shieldRGB: [0, 0, 0],
  };

  function clamp01(x) {
    x = Number(x);
    return Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  }

  function pick01NewOrOld(raw, newKey, oldKey) {
    if (raw && raw[newKey] != null) {
      const n = Number(raw[newKey]);
      return Number.isFinite(n) ? n : 0;
    }
    const n = Number(raw && raw[oldKey]);
    if (!Number.isFinite(n)) return 0;
    return (n > 1.5) ? (n / 100) : n;
  }

  function normVec3(v) {
    if (Array.isArray(v) && v.length >= 3) {
      return [
        Number.isFinite(Number(v[0])) ? Number(v[0]) : 0,
        Number.isFinite(Number(v[1])) ? Number(v[1]) : 0,
        Number.isFinite(Number(v[2])) ? Number(v[2]) : 0,
      ];
    }
    if (v && typeof v === "object") {
      return [
        Number.isFinite(Number(v.x)) ? Number(v.x) : 0,
        Number.isFinite(Number(v.y)) ? Number(v.y) : 0,
        Number.isFinite(Number(v.z)) ? Number(v.z) : 0,
      ];
    }
    return [0, 0, 0];
  }

  function normRgb01(v) {
    const [r, g, b] = normVec3(v);
    return [clamp01(r), clamp01(g), clamp01(b)];
  }

  function ingest(raw, atMs = performance.now()) {
    frameId += 1;
    latest = {
      atMs: Number(atMs) || 0,
      frameId,
      energy01: pick01NewOrOld(raw, "energy01", "energy"),
      groove01: pick01NewOrOld(raw, "groove01", "groove"),
      dynamics01: pick01NewOrOld(raw, "dynamics01", "orbit01"),
      smooth01: pick01NewOrOld(raw, "smooth01", "smooth"),
      speed01: pick01NewOrOld(raw, "speed01", "speed"),
      shake01: pick01NewOrOld(raw, "shake01", "shake"),
      locked: !!(raw && raw.locked),
      shieldAxis: normVec3(raw && raw.shieldAxis),
      shieldRGB: normRgb01(raw && raw.shieldRGB),
    };
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit("input.frame_updated", { latest });
    }
    return latest;
  }

  function getLatest() {
    return latest;
  }

  function reset(atMs = performance.now()) {
    latest = {
      atMs: Number(atMs) || 0,
      frameId: 0,
      energy01: 0,
      groove01: 0,
      dynamics01: 0,
      smooth01: 0,
      speed01: 0,
      shake01: 0,
      locked: false,
      shieldAxis: [0, 0, 0],
      shieldRGB: [0, 0, 0],
    };
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit("input.frame_updated", { latest });
    }
  }

  function start() {}
  function stop() {}

  return {
    start,
    stop,
    reset,
    ingest,
    getLatest,
  };
}
