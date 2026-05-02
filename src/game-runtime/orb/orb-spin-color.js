function toColor01(rgb = {}) {
  return Object.freeze({
    r: Math.max(0, Math.min(1, Number(rgb.r) || 0)),
    g: Math.max(0, Math.min(1, Number(rgb.g) || 0)),
    b: Math.max(0, Math.min(1, Number(rgb.b) || 0)),
  });
}

export const ORB_SPIN_COLOR_MAP = Object.freeze({
  y: Object.freeze({
    cw: toColor01({ r: 255 / 255, g: 0 / 255, b: 0 / 255 }),
    ccw: toColor01({ r: 0 / 255, g: 255 / 255, b: 74 / 255 }),
  }),
  x: Object.freeze({
    cw: toColor01({ r: 0 / 255, g: 74 / 255, b: 255 / 255 }),
    ccw: toColor01({ r: 255 / 255, g: 74 / 255, b: 0 / 255 }),
  }),
  z: Object.freeze({
    cw: toColor01({ r: 255 / 255, g: 235 / 255, b: 0 / 255 }),
    ccw: toColor01({ r: 148 / 255, g: 0 / 255, b: 255 / 255 }),
  }),
});

export function resolveOrbSpinColor(axis, direction) {
  const axisKey = String(axis || "").trim().toLowerCase();
  const directionKey = String(direction || "").trim().toLowerCase();
  const byAxis = ORB_SPIN_COLOR_MAP[axisKey];
  if (!byAxis) return null;
  return byAxis[directionKey] || null;
}
