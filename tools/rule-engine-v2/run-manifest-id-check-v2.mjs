import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { runOrFail } from "./check-run-v2.mjs";

export function runManifestIdCheck({
  tag,
  entries,
  requiredIds,
  manifestName,
  entryLabel = "manifest",
  itemLabel = "check",
}) {
  runOrFail(String(tag || ""), () => {
    assertManifestIdContract({
      entries,
      requiredIds,
      manifestName,
      entryLabel,
      itemLabel,
    });
  });
}
