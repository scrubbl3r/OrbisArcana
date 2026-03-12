import { runManifestIdCheck } from "./run-manifest-id-check-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

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
  runManifestIdCheck({
    tag,
    entries,
    requiredIds,
    manifestName,
    entryLabel,
    itemLabel,
  });
  if (reportPass) reportCheckPass(tag, passMessage);
}
