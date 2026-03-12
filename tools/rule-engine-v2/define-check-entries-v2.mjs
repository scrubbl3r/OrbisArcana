export function defineCheckEntriesV2(entries) {
  const list = Array.isArray(entries) ? entries : [];
  return Object.freeze(
    list.map((entry) => Object.freeze({ ...entry }))
  );
}
