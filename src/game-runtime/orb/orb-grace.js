export function resolveOrbGraceDefaultTtlMs(config = null, fallback = 2500) {
  const candidate = Number(
    config
    && typeof config === "object"
    && config.defaultTtlMs
  );
  if (Number.isFinite(candidate) && candidate > 0) return candidate;
  const fallbackMs = Number(fallback);
  return (Number.isFinite(fallbackMs) && fallbackMs > 0) ? fallbackMs : 2500;
}

export function resolveOrbGracePayload(rawGrace, { defaultTtlMs = 2500 } = {}) {
  if (rawGrace == null || rawGrace === false) return null;
  const source = (rawGrace && typeof rawGrace === "object" && !Array.isArray(rawGrace))
    ? rawGrace
    : {};
  const ttlCandidate = Number(source.ttlMs);
  const ttlMs = Number.isFinite(ttlCandidate) && ttlCandidate > 0
    ? ttlCandidate
    : resolveOrbGraceDefaultTtlMs({ defaultTtlMs }, defaultTtlMs);
  return Object.freeze({
    ttlMs: Math.max(50, ttlMs),
  });
}
