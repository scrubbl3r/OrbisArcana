import { spawnSync } from "node:child_process";

export function runCheckScript(script, options = {}) {
  const stdio = options.stdio || "ignore";
  const res = spawnSync(process.execPath, [script], { stdio });
  return Object.freeze({
    ok: res.status === 0,
    status: Number.isInteger(res.status) ? res.status : 1,
  });
}
