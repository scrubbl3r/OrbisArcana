export function failCheck(tag, msg) {
  console.error(`[${tag}] FAIL: ${msg}`);
  process.exit(1);
}
