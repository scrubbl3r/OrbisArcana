function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function linear01(t) {
  return clamp01(t);
}

export function easeInOutExpo01(t) {
  const x = clamp01(t);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x < 0.5
    ? Math.pow(2, (20 * x) - 10) / 2
    : (2 - Math.pow(2, (-20 * x) + 10)) / 2;
}

export function resolveCameraEasing(easing) {
  const key = String(easing || "").trim();
  if (key === "easeInOutExpo") return easeInOutExpo01;
  return linear01;
}
