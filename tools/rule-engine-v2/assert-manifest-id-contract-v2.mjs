// Validates manifest entry shape, then enforces exact ID ordering contract.
import { validateManifestEntries } from "./validate-manifest-v2.mjs";
import { assertOrderedIds } from "./assert-ordered-ids-v2.mjs";
// Returns normalized actual IDs so callers can reuse ordered-id outputs if needed.
// This helper intentionally composes validation + ordering into one reusable step.
export function assertManifestIdContract({
  entries,
  requiredIds,
  manifestName = "manifest",
  entryLabel = "entry",
  itemLabel = "item",
}) {
  validateManifestEntries({
    entries,
    manifestName,
    entryLabel,
  });

  const actualIds = entries.map((entry) => (typeof entry?.id === "string" ? entry.id.trim() : ""));
  assertOrderedIds({
    actualIds,
    requiredIds,
    manifestName,
    itemLabel,
  });

  return actualIds;
}
