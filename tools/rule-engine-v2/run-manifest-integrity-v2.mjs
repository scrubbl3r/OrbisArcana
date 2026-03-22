// Shared manifest-integrity wrapper used by contract/regression/phase manifest checks.
import { runManifestIdCheck } from "./run-manifest-id-check-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
// Central entry point so all manifest checks share pass/fail behavior.
export function runManifestIntegrityCheckV2({
  tag,
  entries,
  requiredIds,
  manifestName,
  passMessage,
  entryLabel,
  itemLabel,
  reportPass = true,
}) {
  if (reportPass && (typeof passMessage !== "string" || !passMessage.trim())) {
    throw new Error("runManifestIntegrityCheckV2 requires non-empty passMessage when reportPass=true");
  }
  runManifestIdCheck({
    tag,
    entries,
    requiredIds,
    manifestName,
    entryLabel,
    itemLabel,
  });
  if (reportPass) reportCheckPass(tag, passMessage.trim());
}
