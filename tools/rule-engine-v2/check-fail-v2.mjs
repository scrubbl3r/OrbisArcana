export function failCheck(tag, msg) {
  console.error(`[${tag}] FAIL: ${msg}`);
  process.exit(1);
}

export function failCheckStatus(tag, msg, status = 1) {
  console.error(`[${tag}] FAIL: ${msg}`);
  process.exit(Number.isInteger(status) ? status : 1);
}

export function failCheckWithDetails(tag, msg, details = []) {
  console.error(`[${tag}] FAIL: ${msg}`);
  for (const line of Array.isArray(details) ? details : []) {
    console.error(`  - ${line}`);
  }
  process.exit(1);
}
