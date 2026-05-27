import { spawnSync } from "node:child_process";
import {
  CANONICAL_LEVEL_IDS,
  DEFAULT_LEVEL_INSPECTION_ID,
  EXPECTED_LEVEL_SVG_REPORTS,
} from "./level-contract-fixtures.mjs";
import {
  formatLevelInspectionSummary,
  readLevelInspectionReportValue,
} from "./level-inspection-report.mjs";

const SVG_INSPECTION_CHECKS = Object.freeze(
  CANONICAL_LEVEL_IDS.map((id) => Object.freeze({
    command: id === DEFAULT_LEVEL_INSPECTION_ID
      ? ["node", "tools/levels/inspect-level-svg.mjs", "--json"]
      : ["node", "tools/levels/inspect-level-svg.mjs", id, "--json"],
    expectedReport: EXPECTED_LEVEL_SVG_REPORTS[id],
  }))
);

const CHECKS = Object.freeze([
  Object.freeze({ command: ["node", "tools/levels/check-level-contract-fixtures.mjs"] }),
  Object.freeze({ command: ["node", "tools/levels/check-level-registry-contract.mjs"] }),
  Object.freeze({ command: ["node", "tools/levels/check-level-world-size-contract.mjs"] }),
  Object.freeze({ command: ["node", "tools/levels/check-svg-level-source-contract.mjs"] }),
  Object.freeze({ command: ["node", "tools/levels/check-camera-corridor-contract.mjs"] }),
  Object.freeze({ command: ["node", "tools/levels/check-camera-travel-contract.mjs"] }),
  Object.freeze({ command: ["node", "tools/levels/check-authored-level-overlay-contract.mjs"] }),
  ...SVG_INSPECTION_CHECKS,
]);

function assertInspectionReport(stdout = "", expectedReport = {}, label = "") {
  let report = null;
  try {
    report = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`level contract report was not JSON for ${label}: ${error.message}`);
  }
  for (const [key, expected] of Object.entries(expectedReport)) {
    const actual = readLevelInspectionReportValue(report, key);
    if (actual !== expected) {
      throw new Error(`level contract report changed for ${label}: ${key} expected ${expected}, got ${actual}`);
    }
  }
  process.stdout.write(`${formatLevelInspectionSummary(report)}\n`);
}

for (const check of CHECKS) {
  const command = check.command;
  const label = command.join(" ");
  const result = spawnSync(command[0], command.slice(1), {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    throw new Error(`level contract check failed: ${label}`);
  }
  if (check.expectedReport) {
    assertInspectionReport(result.stdout, check.expectedReport, label);
  } else if (result.stdout) {
    process.stdout.write(result.stdout);
  }
}

console.log("level contracts ok");
