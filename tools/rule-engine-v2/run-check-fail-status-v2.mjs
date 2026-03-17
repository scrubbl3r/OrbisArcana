import { failCheckStatus } from "./check-fail-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";

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
