function normalizeSeedValue(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return 0;
  return (n >>> 0);
}

export function createOrbLifeSeed() {
  const seeded = normalizeSeedValue((Math.random() * 0xFFFFFFFF) | 0);
  return seeded || 1;
}

export function resolveOrbLifeSeed(value, fallback = 1) {
  const normalized = normalizeSeedValue(value);
  if (normalized) return normalized;
  const safeFallback = normalizeSeedValue(fallback);
  return safeFallback || 1;
}
