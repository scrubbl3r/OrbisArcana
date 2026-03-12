import { execSync } from "node:child_process";

export function runRgLines(command, { cwd = process.cwd() } = {}) {
  try {
    const out = execSync(String(command || ""), { cwd, encoding: "utf8" });
    return String(out || "")
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
