export function defineCheckEntriesV2(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("defineCheckEntriesV2 entries must be an array");
  }
  const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  const seenKeys = new Set();
  const seenScripts = new Set();
  return Object.freeze(entries.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`defineCheckEntriesV2 entry[${index}] must be an object`);
    }
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const key = id || name;
    const script = typeof entry.script === "string" ? entry.script.trim() : "";
    if (!key) {
      throw new Error(`defineCheckEntriesV2 entry[${index}] must include non-empty id or name`);
    }
    if (!script) {
      throw new Error(`defineCheckEntriesV2 entry[${index}] script must be a non-empty string`);
    }
    if (seenKeys.has(key)) {
      throw new Error(`defineCheckEntriesV2 duplicate key: ${key}`);
    }
    if (seenScripts.has(script)) {
      throw new Error(`defineCheckEntriesV2 duplicate script: ${script}`);
    }
    seenKeys.add(key);
    seenScripts.add(script);
    const base = { ...entry, script };
    if (id) {
      base.id = id;
    } else {
      base.name = name;
    }
    return Object.freeze(base);
  }));
}
