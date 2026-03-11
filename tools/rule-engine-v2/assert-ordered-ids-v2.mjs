export function assertOrderedIds({
  actualIds,
  requiredIds,
  manifestName = "manifest",
  itemLabel = "item",
}) {
  const actual = Array.isArray(actualIds) ? actualIds : [];
  const required = Array.isArray(requiredIds) ? requiredIds : [];

  if (actual.length !== required.length) {
    throw new Error(`${manifestName} must contain exactly ${required.length} ${itemLabel}s (got ${actual.length})`);
  }

  for (let i = 0; i < required.length; i += 1) {
    const expectedId = required[i];
    const actualId = actual[i] || "(missing)";
    if (actualId !== expectedId) {
      throw new Error(
        `${manifestName} order mismatch at index ${i}: expected '${expectedId}' got '${actualId}'`
      );
    }
  }
}
