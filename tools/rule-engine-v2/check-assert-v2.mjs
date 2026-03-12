export function assertCheck(condition, message) {
  if (!condition) throw new Error(message);
}
