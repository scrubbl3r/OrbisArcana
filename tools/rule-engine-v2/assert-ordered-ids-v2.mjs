// Asserts two ID arrays match exactly in length and position.
// Maintains strict deterministic ordering contract for manifest ID lists.
// No normalization beyond required checks to avoid masking caller mistakes.
export function assertOrderedIds({
  actualIds,
  requiredIds,
  manifestName = "manifest",
  itemLabel = "item",
}) {
  if (!Array.isArray(actualIds)) {
    throw new Error(`${manifestName} actualIds must be an array`);
  }
  if (!Array.isArray(requiredIds)) {
    throw new Error(`${manifestName} requiredIds must be an array`);
  }
  const actual = actualIds;
  const required = requiredIds;

  if (actual.length !== required.length) {
    throw new Error(`${manifestName} must contain exactly ${required.length} ${itemLabel}s (got ${actual.length})`);
  }

  for (let i = 0; i < required.length; i += 1) {
    if (typeof required[i] !== "string" || !required[i].trim()) {
      throw new Error(`${manifestName} requiredIds[${i}] must be a non-empty string`);
    }
    const expectedId = required[i];
    const actualIdRaw = actual[i];
    const actualId = typeof actualIdRaw === "string" && actualIdRaw.trim()
      ? actualIdRaw
      : "(missing)";
    if (actualId !== expectedId) {
      throw new Error(
        `${manifestName} order mismatch at index ${i}: expected '${expectedId}' got '${actualId}'`
      );
    }
  }
}
