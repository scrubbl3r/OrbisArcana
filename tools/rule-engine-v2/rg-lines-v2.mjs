// Shared rg wrapper returning trimmed line matches; status code 1 maps to no matches.
import { execSync } from "node:child_process";
// Normalizes rg command execution for all surface/offender checks.
// Any non-1 exit code is treated as a real command/runtime failure.
export function runRgLines(command, { cwd = process.cwd() } = {}) {
  const cmd = typeof command === "string" ? command.trim() : "";
  if (!cmd) {
    throw new Error("runRgLines requires a non-empty command string");
  }
  const workdir = typeof cwd === "string" ? cwd.trim() : "";
  if (!workdir) {
    throw new Error("runRgLines requires cwd to be a non-empty string");
  }
  try {
    const out = execSync(cmd, { cwd: workdir, encoding: "utf8" });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (err) {
    if (err && typeof err.status === "number" && err.status === 1) {
      return [];
    }
    throw err;
  }
}
