// Runs manifest ID/order contract assertion under standardized check failure handling.
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { runOrFail } from "./check-run-v2.mjs";
// Wrapper keeps manifest id checks aligned with common run/fail semantics.
export function runManifestIdCheck({
  tag,
  entries,
  requiredIds,
  manifestName,
  entryLabel = "manifest",
  itemLabel = "check",
}) {
  runOrFail(tag, () => {
    assertManifestIdContract({
      entries,
      requiredIds,
      manifestName,
      entryLabel,
      itemLabel,
    });
  });
}
