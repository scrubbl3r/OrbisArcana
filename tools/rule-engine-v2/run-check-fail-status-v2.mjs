// Runs a check script and exits with its status via failCheckStatus on failure.
import { failCheckStatus } from "./check-fail-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
// Preserves child-check exit codes while emitting tagged failure messages.
// Wrapper validates caller metadata before delegating to child process execution.
export function runCheckScriptOrFailStatus({ tag, message, script, stdio = "inherit" }) {
  const safeTag = typeof tag === "string" ? tag.trim() : "";
  if (!safeTag) {
    throw new Error("runCheckScriptOrFailStatus requires a non-empty tag");
  }
  const safeMessage = typeof message === "string" ? message.trim() : "";
  if (!safeMessage) {
    throw new Error(`runCheckScriptOrFailStatus requires a non-empty message (${safeTag})`);
  }
  const res = runCheckScript(script, { stdio });
  if (!res.ok) failCheckStatus(safeTag, safeMessage, res.status ?? 1);
  return res;
}
