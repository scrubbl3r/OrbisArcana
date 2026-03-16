import { validateManifestEntries } from "./validate-manifest-v2.mjs";
import { assertOrderedIds } from "./assert-ordered-ids-v2.mjs";

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
