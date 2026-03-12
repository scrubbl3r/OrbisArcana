import { failCheckStatus } from "./check-fail-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";

export function runCheckScriptOrFailStatus({ tag, message, script, stdio = "inherit" }) {
  const res = runCheckScript(script, { stdio });
  if (!res.ok) failCheckStatus(tag, message, res.status || 1);
  return res;
}
