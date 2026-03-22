// Runs a check script via Node and returns normalized `{ok,status}`.
import { spawnSync } from "node:child_process";
// Used by status/ready runners to invoke check scripts with stable result shape.
// Status normalization ensures non-integer child status values map to failure.
export function runCheckScript(script, options = {}) {
  const scriptPath = typeof script === "string" ? script.trim() : "";
  if (!scriptPath) {
    throw new Error("runCheckScript requires a non-empty script path");
  }
  const stdio = typeof options?.stdio === "string" && options.stdio.trim()
    ? options.stdio.trim()
    : "ignore";
  const res = spawnSync(process.execPath, [scriptPath], { stdio });
  return Object.freeze({
    ok: res.status === 0,
    status: Number.isInteger(res.status) ? res.status : 1,
  });
}

export function runCheckScriptOk(script, options = {}) {
  return runCheckScript(script, options).ok;
}
