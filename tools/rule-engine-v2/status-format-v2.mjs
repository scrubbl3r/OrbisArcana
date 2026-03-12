export function formatCheckStatusList(entries, checksById, yesNo) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => `${entry.id}:${yesNo(checksById[entry.id] === true)}`)
    .join(" ");
}
